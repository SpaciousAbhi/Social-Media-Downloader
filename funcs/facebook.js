const { getBuffer, getCallbackData } = require('./functions');
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');

async function getFacebook(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    const meta = await getMetadata(url);
    let caption = `📘 *FACEBOOK CONTENT*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📝 *Title:* \`${meta.title || meta.description || 'Facebook Video'}\`\n`;
    caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    caption += `Choose your download format below:`;
    
    let options = {
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🎬 Video (Best)', callback_data: await getCallbackData('fbn', url) }],
          [{ text: '🎵 Audio (MP3)', callback_data: await getCallbackData('fba', url) }]
        ]
      })
    };

    if (meta.thumbnail) {
      await bot.sendPhoto(chatId, meta.thumbnail, options);
    } else {
      await bot.sendMessage(chatId, caption, options);
    }
  } catch (err) {
    console.error('getFacebook error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Facebook ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    await bot.editMessageText('An error occurred. Make sure the Facebook link is valid and public!', { chat_id: chatId, message_id: load.message_id });
  }
}

const { getProgressBar } = require('./progress');

async function getFacebookNormal(bot, chatId, userName, url) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing Facebook download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading Facebook Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_video');
    
    await bot.sendVideo(chatId, filePath, { 
      caption: `✅ *Success!* Facebook video ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getFacebookNormal error:', err);
    return bot.editMessageText(`❌ *Facebook Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

async function getFacebookAudio(bot, chatId, userName, url) {
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
      caption: `✅ *Success!* Facebook audio ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('getFacebookAudio error:', err);
    return bot.editMessageText(`❌ *Facebook Audio Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  getFacebook,
  getFacebookNormal,
  getFacebookHD: getFacebookNormal, // Alias
  getFacebookAudio
}