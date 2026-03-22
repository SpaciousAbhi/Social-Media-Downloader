require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { getBuffer, getRandom } = require('./functions')
const { downloadWithYtDlp, getMetadata } = require('./ytdlp');
const { getProgressBar } = require('./progress');

async function downloadInstagram(bot, chatId, url, userName) {
    let load = await bot.sendMessage(chatId, '🛰 *Extracting Instagram content via API bypass...*', { parse_mode: 'Markdown' });
    try {
        const axios = require('axios');
        const { data } = await axios.get('https://bk9.fun/download/instagram?url=' + encodeURIComponent(url));
        
        if (!data || !data.status || !data.BK9 || data.BK9.length === 0) {
            throw new Error('No media found or API failed.');
        }

        await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
        
        for (let i = 0; i < data.BK9.length; i++) {
            const item = data.BK9[i];
            const mediaUrl = item.url;
            // Determine type
            const isVideo = url.includes('reel') || mediaUrl.includes('.mp4');
            
            const caption = i === 0 ? `✅ *Success!* Instagram content ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv` : '';
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
            }
        }
        await bot.deleteMessage(chatId, load.message_id);

    } catch (err) {
        console.error('downloadInstagram error:', err);
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