require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { downloadWithYtDlp } = require('./ytdlp');

async function threadsDownload(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    // Stable path: yt-dlp first
    const filePath = await downloadWithYtDlp(url, 'video');
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    const max = 49 * 1024 * 1024;
    if (stat.size > max) {
      await bot.editMessageText('File is too large for Telegram bot upload (>49MB).', { chat_id: chatId, message_id: load.message_id });
      return;
    }

    if (['.mp4', '.mov', '.mkv', '.webm'].includes(ext)) {
      await bot.sendVideo(chatId, filePath, { caption: `Bot by @Krxuvv` });
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      await bot.sendPhoto(chatId, filePath, { caption: `Bot by @Krxuvv` });
    } else {
      await bot.sendDocument(chatId, filePath, { caption: `Bot by @Krxuvv` });
    }

    fs.unlinkSync(filePath);
    return bot.deleteMessage(chatId, load.message_id);
  } catch (primaryErr) {
    // Fallback: legacy API route
    try {
      let get = await axios.get('https://api.threadsphotodownloader.com/v2/media?url=' + encodeURIComponent(url));
      let data = get.data;
      if (data.image_urls?.[0] && !data.video_urls?.[0]) {
        if (data.image_urls.length == 1) {
          await bot.sendPhoto(chatId, data.image_urls[0], { caption: `Bot by @Krxuvv` });
        } else {
          let results = data.image_urls.map(maru => ({ type: 'photo', media: maru }));
          for (let i = 0; i < results.length; i += 10) {
            await bot.sendMediaGroup(chatId, results.slice(i, i + 10));
          }
        }
        return bot.deleteMessage(chatId, load.message_id);
      } else if (data.video_urls?.[0] && !data.image_urls?.[0]) {
        await bot.sendVideo(chatId, data.video_urls[0].download_url, { caption: `Bot by @Krxuvv` });
        return bot.deleteMessage(chatId, load.message_id);
      }
    } catch (legacyErr) {
      const detail = `${primaryErr}\n--- fallback ---\n${legacyErr}`;
      await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/threads.js\n• Function: threadsDownload()\n• Url: ${url}\n\n${detail}`.trim());
    }

    return bot.editMessageText('Failed to download media, make sure your link is valid!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  threadsDownload
}