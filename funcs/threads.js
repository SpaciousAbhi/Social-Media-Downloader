require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getBuffer, getCallbackData } = require('./functions');
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');

async function threadsDownload(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    const meta = await getMetadata(url);
    
    // New premium formatting for the caption
    let caption = `🧵 *THREADS CONTENT*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📝 *Title:* \`${(meta.title || meta.description || 'Threads Content').slice(0, 100)}\`\n`;
    caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    caption += `Choose your download format below:`;

    let options = {
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🎬 Video (Best)', callback_data: await getCallbackData('thv', url) }],
          [{ text: '🎵 Audio (MP3)', callback_data: await getCallbackData('tha', url) }]
        ]
      })
    };

    // Send a message with options instead of directly sending the media
    // If there's a thumbnail, use it for the message, otherwise just send text.
    if (meta.thumbnail) {
        const thumbnailBuffer = await getBuffer(meta.thumbnail);
        await bot.sendPhoto(chatId, thumbnailBuffer, options);
    } else {
        await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown', reply_markup: options.reply_markup });
    }
    
    await bot.deleteMessage(chatId, load.message_id);

    // Download triggered by callback_query in index.js
  } catch (err) {
    console.error('threadsDownload error:', err);
    bot.editMessageText(`❌ *Error:* \`${err.message}\``, { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
  }
}

const { getProgressBar } = require('./progress');

async function getThreadsVideo(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing Threads download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading Threads Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_video');
    
    await bot.sendVideo(chatId, filePath, { 
      caption: `✅ *Success!* Threads video ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getThreadsVideo error:', err);
    return bot.editMessageText(`❌ *Threads Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

async function getThreadsAudio(bot, chatId, url, userName) {
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
      caption: `✅ *Success!* Threads audio ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getThreadsAudio error:', err);
    return bot.editMessageText(`❌ *Threads Audio Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  threadsDownload,
  getThreadsVideo,
  getThreadsAudio
}