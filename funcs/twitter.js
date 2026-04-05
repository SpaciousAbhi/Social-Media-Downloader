const { getBuffer, getCallbackData } = require('./functions')
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');

async function getDataTwitter(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    const meta = await getMetadata(url);
    
    let caption = `🐦 *TWITTER / X CONTENT*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📝 *Description:* \`${(meta.description || meta.title || 'No description').slice(0, 500)}\`\n`;
    caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    caption += `Choose your download format below:`;
    
    let options = {
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🎬 HD Video', callback_data: await getCallbackData('twh', url) }],
          [{ text: '🎵 Audio (MP3)', callback_data: await getCallbackData('twa', url) }]
        ]
      })
    };

    if (meta.thumbnail) {
      const thumbPath = path.join(process.cwd(), 'content', `tw-thumb-${chatId}.jpg`);
      await fs.writeFileSync(thumbPath, await getBuffer(meta.thumbnail));
      await bot.sendPhoto(chatId, thumbPath, options);
      fs.unlinkSync(thumbPath); // Clean up the temporary thumbnail file
    } else {
      await bot.sendMessage(chatId, caption, options); // Send message if no thumbnail
    }
  } catch (err) {
    console.error('getDataTwitter error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Twitter ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    return bot.editMessageText('An error occurred. Make sure the Twitter/X link is valid and public!', { chat_id: chatId, message_id: load.message_id })
  }
}

const { getProgressBar } = require('./progress');

async function downloadTwitterHigh(bot, chatId, userName, url) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing Twitter download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading Twitter Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    await bot.sendChatAction(chatId, 'upload_video');
    
    await bot.sendVideo(chatId, filePath, { 
      caption: `✅ *Success!* Twitter video ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('downloadTwitterHigh error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Twitter Video ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    return bot.editMessageText(`❌ *Twitter Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

async function downloadTwitterAudio(bot, chatId, userName, url) {
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
      caption: `✅ *Success!* Twitter audio ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
      parse_mode: 'Markdown'
    });
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('downloadTwitterAudio error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Twitter Audio ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    return bot.editMessageText(`❌ *Twitter Audio Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  getDataTwitter,
  downloadTwitterHigh,
  downloadTwitterLow: downloadTwitterHigh, // Use high quality as default
  downloadTwitterAudio
}