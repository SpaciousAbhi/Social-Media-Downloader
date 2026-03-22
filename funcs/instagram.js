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
        
        // Convert Instagram URL to Ddinstagram (telegram proxy)
        const ddUrl = url.replace('instagram.com', 'ddinstagram.com').split('?')[0];
        
        console.log('Fetching from Ddinstagram proxy:', ddUrl);
        const { data } = await axios.get(ddUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

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
        console.error('downloadInstagram error:', err.message);
        bot.editMessageText(`❌ *Instagram Error:* \`Could not extract post (Private or Blocked)\``, { 
            chat_id: chatId, 
            message_id: load.message_id,
            parse_mode: 'Markdown' 
        });
    }
}

module.exports = {
  downloadInstagram
}