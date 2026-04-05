const { getMetadata, downloadWithYtDlp } = require('./ytdlp');
const { getCallbackData } = require('./functions');
const fs = require('fs');

async function universalDownloadInfo(bot, chatId, url, userName) {
    const processingMsg = await bot.sendMessage(chatId, `🔍 *Analyzing link with Universal Extractor...*`, { parse_mode: 'Markdown' });
    try {
        const metadata = await getMetadata(url);
        
        let title = metadata.title || 'Unknown Media';
        if (title.length > 50) title = title.substring(0, 47) + '...';
        
        title = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const uploader = metadata.uploader ? metadata.uploader.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        
        const caption = `🎯 <b>Universal Downloader</b>\n\n` +
                        `📝 <b>Title:</b> ${title}\n` +
                        (uploader ? `👤 <b>Author:</b> ${uploader}\n` : '') +
                        (metadata.duration ? `⏱ <b>Duration:</b> ${Math.floor(metadata.duration / 60)}:${('0'+Math.floor(metadata.duration % 60)).slice(-2)}\n` : '');

        const inline_keyboard = [];
        const videoData = await getCallbackData('univ_v', url);
        const audioData = await getCallbackData('univ_a', url);
        
        inline_keyboard.push([{ text: '🎬 Download Best Video', callback_data: videoData }]);
        inline_keyboard.push([{ text: '🎵 Download Audio Only', callback_data: audioData }]);

        await bot.deleteMessage(chatId, processingMsg.message_id);
        
        if (metadata.thumbnail) {
            try {
                await bot.sendPhoto(chatId, metadata.thumbnail, {
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: JSON.stringify({ inline_keyboard })
                });
                return;
            } catch (e) {} // Fallthrough to sendMessage if thumbnail fails
        }
        
        await bot.sendMessage(chatId, caption, {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({ inline_keyboard })
        });
        
    } catch (err) {
        await bot.editMessageText(`❌ Extraction Failed\nError: ${err.message.substring(0, 800)}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        }).catch(()=>{});
    }
}

async function handleUniversalDownload(bot, chatId, url, mode) {
    const actionMsg = await bot.sendMessage(chatId, `⏳ *Downloading ${mode === 'video' ? 'Video' : 'Audio'}...*\nThis might take a moment.`, { parse_mode: 'Markdown' });
    try {
        const filePath = await downloadWithYtDlp(url, mode);
        
        await bot.editMessageText(`✅ *Download Complete!*\nUploading to Telegram...`, {
            chat_id: chatId,
            message_id: actionMsg.message_id,
            parse_mode: 'Markdown'
        });

        if (mode === 'video') {
            await bot.sendVideo(chatId, filePath);
        } else {
            await bot.sendAudio(chatId, filePath);
        }
        
        fs.unlinkSync(filePath);
        await bot.deleteMessage(chatId, actionMsg.message_id);

    } catch (err) {
        await bot.editMessageText(`❌ Download Failed\nError: ${err.message.substring(0, 800)}`, {
            chat_id: chatId,
            message_id: actionMsg.message_id
        }).catch(()=>{});
    }
}

module.exports = {
    universalDownloadInfo,
    handleUniversalDownload
};
