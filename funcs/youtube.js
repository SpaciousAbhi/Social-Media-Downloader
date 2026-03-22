require('dotenv').config();
const fs = require('fs');
const { getCallbackData } = require('./functions');
const { downloadWithYtDlp } = require('./ytdlp');
const { getProgressBar } = require('./progress');

function normalizeYouTubeUrl(input) {
  try {
    const m = String(input).match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
    const id = m ? m[1] : null;
    if (!id) return input;
    return `https://www.youtube.com/watch?v=${id}`;
  } catch {
    return input;
  }
}

async function getYoutube(bot, chatId, url, userName) {
  const originalUrl = url;
  url = normalizeYouTubeUrl(url);

  let load = await bot.sendMessage(chatId, '🛰 *Searching YouTube...*', { parse_mode: 'Markdown' });
  try { 
    const { getMetadata } = require('./ytdlp');
    const meta = await getMetadata(url);

    // Redesign caption
    let caption = `🎥 *YOUTUBE CONTENT*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📝 *Title:* \`${(meta.title || 'YouTube Video').slice(0, 100)}\`\n`;
    caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    caption += `Choose your download format below:`;

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎬 Video (Best)', callback_data: getCallbackData('ytdlpv', url) }],
          [{ text: '🎵 Audio (MP3)', callback_data: getCallbackData('ytdlpa', url) }],
        ],
      },
    }

    await bot.deleteMessage(chatId, load.message_id);
    if (meta && meta.thumbnail) {
        return bot.sendPhoto(chatId, meta.thumbnail, options);
    } else {
        return bot.sendMessage(chatId, caption, options);
    }
  } catch (err) {
    console.error('getYoutube error:', err);
    await bot.editMessageText(`❌ *Search Failed:* \`${err.message}\``, { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
  }
}

async function getYoutubeVideo(bot, chatId, url, ind, userName) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading YouTube Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_video');
    
    await bot.sendVideo(chatId, filePath, { 
      caption: `✅ *Success!* YouTube video ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getYoutubeVideo error:', err);
    return bot.editMessageText(`❌ *YouTube Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

async function getYoutubeAudio(bot, chatId, url, ind, userName) {
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
      caption: `✅ *Success!* YouTube audio ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getYoutubeAudio error:', err);
    return bot.editMessageText(`❌ *YouTube Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  getYoutube,
  getYoutubeVideo,
  getYoutubeAudio
}
