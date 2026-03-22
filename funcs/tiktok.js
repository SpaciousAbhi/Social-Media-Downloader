require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { getBuffer, getRandom, getCallbackData } = require('./functions')
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');

async function getTiktokInfo(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    const meta = await getMetadata(url);
    
    // Check if it's a video or image carousel
    if (meta.ext === 'mp4' || (meta.video_ext && meta.video_ext !== 'none')) {
        let caption = `🎵 *TIKTOK CONTENT*\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `📝 *Title:* \`${meta.title || meta.description || '-'}\`\n`;
        caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
        caption += `💬 *Stats:* \`${meta.comment_count || 0} comments\`\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        caption += `Choose your download format below:`;

        let options = {
          caption: caption,
          parse_mode: 'Markdown',
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '🎬 Video (Best)', callback_data: getCallbackData('ttv', url) }],
              [{ text: '🎵 Audio (MP3)', callback_data: getCallbackData('tta', url) }]
            ]
          })
        };

        await bot.deleteMessage(chatId, load.message_id);
        if (meta.thumbnail) {
            return bot.sendPhoto(chatId, meta.thumbnail, options);
        } else {
            return bot.sendMessage(chatId, caption, options);
        }
    } else {
        // It might be a photo carousel
        if (meta.entries) {
            for (const entry of meta.entries) {
                const buff = await getBuffer(entry.url || entry.thumbnail);
                await bot.sendPhoto(chatId, buff, { caption: `Bot by @Krxuvv` });
            }
        } else {
            const buff = await getBuffer(meta.url || meta.thumbnail);
            await bot.sendPhoto(chatId, buff, { caption: `Bot by @Krxuvv` });
        }
        await bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    console.error('getTiktokInfo error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Tiktok ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    return bot.editMessageText('An error occurred. Make sure the link is valid and public.', { chat_id: chatId, message_id: load.message_id })
  }
}

const { getProgressBar } = require('./progress');

async function tiktokVideo(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      // Update message at most once per 2 seconds to avoid Telegram rate limits
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading TikTok Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {}); // Ignore edit errors if message is same
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_video');
    
    await bot.sendVideo(chatId, filePath, { 
      caption: `✅ *Success!* Here is your TikTok video.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('tiktokVideo error:', err);
    return bot.editMessageText(`❌ *Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

async function tiktokAudio(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing audio conversion...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'audio', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading & Converting Audio...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_audio');
    
    await bot.sendAudio(chatId, filePath, { 
      caption: `✅ *Success!* TikTok audio ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('tiktokAudio error:', err);
    return bot.editMessageText(`❌ *Audio Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  getTiktokInfo,
  tiktokVideo,
  tiktokAudio,
  tiktokSound: tiktokAudio // Aliasing for compatibility
}