require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { getBuffer, getRandom } = require('./functions')
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');
const { getProgressBar } = require('./progress');

async function downloadInstagram(bot, chatId, url, userName) {
    let load = await bot.sendMessage(chatId, '🛰 *Extracting Instagram content via Telegram Proxy...*', { parse_mode: 'Markdown' });
    try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        // Convert Instagram URL to Ddinstagram (telegram proxy) without www.
        let ddUrl = url.replace(/https:\/\/(www\.)?instagram\.com/i, 'https://ddinstagram.com').split('?')[0];

        const { getCookieString, USER_AGENT } = require('./ytdlp');
        const cookieString = getCookieString('instagram.com');

        console.log('Fetching from Instagram proxy:', ddUrl);
        let data = '';
        try {
            console.log('Attempting Instagram Proxy 1 (Ddinstagram)...');
            const res = await axios.get(ddUrl, {
                headers: { 'User-Agent': USER_AGENT, 'Cookie': cookieString },
                timeout: 8000
            });
            data = res.data;
        } catch (e1) {
            console.log('Proxy 1 failed, trying vkrdownloader API...');
            try {
                const vkrApi = `https://api.vkrdownloader.com/server?vkr=${encodeURIComponent(url)}`;
                const resV = await axios.get(vkrApi, { timeout: 10000 });
                if (resV.data && resV.data.data && resV.data.data.download) {
                    const dl = resV.data.data.download.find(d => d.type === 'video') || resV.data.data.download[0];
                    if (dl && dl.url) {
                        data = `<meta property="og:video" content="${dl.url}">`;
                    }
                }
                if (!data) throw new Error('VKR returned no media');
            } catch (eV) {
                console.log('VKR failed, trying btch-downloader...');
                try {
                    const btch = require('btch-downloader');
                    const btchRes = await btch.igdl(url);
                    if (btchRes && btchRes.length > 0) {
                        const media = btchRes[0].url || btchRes[0].thumbnail;
                        if (media) data = `<meta property="og:video" content="${media}">`;
                    }
                    if (!data) throw new Error('Btch returned no data');
                } catch (eB) {
                    console.log('Btch failed, trying proxy 2 (123view)...');
                    const igUrl2 = url.replace(/https:\/\/(www\.)?instagram\.com/i, 'https://ig.123view.com').split('?')[0];
                    try {
                        const res2 = await axios.get(igUrl2, {
                            headers: { 'User-Agent': USER_AGENT, 'Cookie': cookieString },
                            timeout: 8000
                        });
                        data = res2.data;
                    } catch (e2) {
                        console.log('Proxy 2 failed, trying final Cobalt fallback...');
                        try {
                            const { downloadViaCobalt } = require('./cobalt');
                            const cobaltUrl = await downloadViaCobalt(url, 'video');
                            if (cobaltUrl) {
                                data = `<meta property="og:video" content="${cobaltUrl}">`;
                            }
                        } catch (eC) {
                            throw e2;
                        }
                    }
                }
            }
        }

        const $ = cheerio.load(data);
        const videoUrl = $('meta[property="og:video"]').attr('content');
        const imageUrl = $('meta[property="og:image"]').attr('content');
        
        const mediaUrl = videoUrl || imageUrl;
        if (!mediaUrl) {
            throw new Error('No media found via proxy.');
        }

        const isVideo = !!videoUrl;
        await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
        
        const caption = `✅ *Success!* Instagram content ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`;
        const options = { caption, parse_mode: 'Markdown' };

        // For reliability with Telegram API on direct URLs, download to buffer first
        const buffer = await getBuffer(mediaUrl);

        try {
            if (isVideo) {
                await bot.sendChatAction(chatId, 'upload_video');
                await bot.sendVideo(chatId, buffer, options);
            } else {
                await bot.sendChatAction(chatId, 'upload_photo');
                await bot.sendPhoto(chatId, buffer, options);
            }
        } catch (sendErr) {
            console.error('Failed to send item:', sendErr);
            throw sendErr;
        }
        await bot.deleteMessage(chatId, load.message_id);

    } catch (err) {
        console.error('proxy download Instagram error:', err.message);
        
        try {
            console.log('Attempting final fallback with yt-dlp for Instagram...');
            bot.editMessageText('⚠️ *Proxy blocked! Falling back to raw extraction...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' }).catch(()=>{});
            
            let lastUpdate = 0;
            const filePath = await downloadWithYtDlp(url, 'video', (p) => {
              const now = Date.now();
              if (now - lastUpdate > 2000) {
                lastUpdate = now;
                const bar = getProgressBar(p.percent);
                bot.editMessageText(`📥 *Downloading via yt-dlp...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
                  chat_id: chatId,
                  message_id: load.message_id,
                  parse_mode: 'Markdown'
                }).catch(() => {});
              }
            });

            await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
            
            await bot.sendVideo(chatId, filePath, { 
              caption: `✅ *Success!* Instagram content ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
              parse_mode: 'Markdown'
            });
            
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await bot.deleteMessage(chatId, load.message_id);

        } catch (ytErr) {
            console.error('yt-dlp final fallback error:', ytErr.message);
            bot.editMessageText(`❌ *Instagram Error:* \`Could not extract post (Private or Blocked)\``, { 
                chat_id: chatId, 
                message_id: load.message_id,
                parse_mode: 'Markdown' 
            });
        }
    }
}

module.exports = {
  downloadInstagram
}