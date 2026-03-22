require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { getBuffer, getRandom } = require('./functions')
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');
const { getProgressBar } = require('./progress');

async function downloadInstagram(bot, chatId, url, userName) {
    let load = await bot.sendMessage(chatId, '🛰 *Initializing Instagram download...*', { parse_mode: 'Markdown' });
    try {
        const meta = await getMetadata(url);
        
        // Premium formatting for the caption
        let caption = `📸 *INSTAGRAM CONTENT*\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `📝 *Title:* \`${(meta.title || meta.description || 'Instagram Post').slice(0, 100)}\`\n`;
        caption += `👤 *Author:* \`${meta.uploader || '-'}\`\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        caption += `Choose your download format below:`;

        let options = {
          caption: caption,
          parse_mode: 'Markdown',
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '🎬 Video (Best)', callback_data: getCallbackData('igv', url) }],
              [{ text: '🎵 Audio (MP3)', callback_data: getCallbackData('iga', url) }]
            ]
          })
        };

        await bot.deleteMessage(chatId, load.message_id);
        if (meta.thumbnail) {
            await bot.sendPhoto(chatId, meta.thumbnail, options);
        } else {
            await bot.sendMessage(chatId, caption, options);
        }
    } catch (err) {
        console.error('downloadInstagram error:', err);
        bot.editMessageText(`❌ *Instagram Error:* \`${err.message}\``, { 
            chat_id: chatId, 
            message_id: load.message_id,
            parse_mode: 'Markdown' 
        });
    }
}

// Internal function to handle the actual download with progress
async function handleInstagramDownload(bot, chatId, url, userName) {
    let load = await bot.sendMessage(chatId, '🛰 *Downloading from Instagram...*', { parse_mode: 'Markdown' });
    try {
        let lastUpdate = 0;
        const filePath = await downloadWithYtDlp(url, 'video', (p) => {
            const now = Date.now();
            if (now - lastUpdate > 2000) {
                lastUpdate = now;
                const bar = getProgressBar(p.percent);
                bot.editMessageText(`📥 *Downloading Instagram Video...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
                    chat_id: chatId,
                    message_id: load.message_id,
                    parse_mode: 'Markdown'
                }).catch(() => {});
            }
        });

        await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
        await bot.sendChatAction(chatId, 'upload_video');
        
        await bot.sendVideo(chatId, filePath, { 
            caption: `✅ *Success!* Instagram content ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
            parse_mode: 'Markdown'
        });
        
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await bot.deleteMessage(chatId, load.message_id);
    } catch (err) {
        console.error('handleInstagramDownload error:', err);
        return bot.editMessageText(`❌ *Instagram Download Failed*\n\nError: \`${err.message}\``, { 
            chat_id: chatId, 
            message_id: load.message_id,
            parse_mode: 'Markdown' 
        })
    }
}

module.exports = {
  downloadInstagram
}