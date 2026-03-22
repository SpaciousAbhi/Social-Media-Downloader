require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getBuffer } = require('./functions');
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');

// Helper function to generate callback data (assuming it exists elsewhere or needs to be added)
function getCallbackData(type, url) {
  // In a real scenario, you might want to store the URL in a database
  // and pass an ID, or truncate/encode the URL if it's too long for callback_data.
  // For this example, we'll just concatenate.
  return `${type}|${url}`;
}

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
          [{ text: '🎬 Video (Best)', callback_data: getCallbackData('thv', url) }],
          [{ text: '🎵 Audio (MP3)', callback_data: getCallbackData('tha', url) }]
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

module.exports = {
  threadsDownload
}