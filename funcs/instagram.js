require('dotenv').config()
const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');
const path = require('path');
const fs = require('fs');
const { downloadWithYtDlp } = require('./ytdlp');
const { getBuffer, getRandom } = require('./functions')

async function igdl(url) {
  try {
    const encUrl = encodeURIComponent(url);
    let { data } = await axios.get(`https://krxuv-api.vercel.app/api/instagram?apikey=Krxuvonly&url=${encUrl}`);
    return data.results
  } catch (err) {
    return err
  }
}

async function downloadInstagram(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.')
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
    await bot.deleteMessage(chatId, load.message_id);
    return;
  } catch (primaryErr) {
    // Legacy fallback API path
    try {
      let get = await igdl(url);
      if (!get[0]) {
        return bot.editMessageText('Failed to get data, make sure your Instagram link is valid!', { chat_id: chatId, message_id: load.message_id })
      }
      if (get.length == 1) {
        if (get[0].type == 'Photo') {
          await bot.deleteMessage(chatId, load.message_id)
          return bot.sendPhoto(chatId, get[0].thumbnail, { caption: `Bot by @Krxuvv` })
        }
        await bot.sendVideo(chatId, get[0].url, { caption: `Bot by @Krxuvv` })
        await bot.deleteMessage(chatId, load.message_id)
        return;
      }
      let photos = get.filter(x => x.type === 'Photo').map(x => ({ type: 'photo', media: x.thumbnail }));
      for (let i = 0; i < photos.length; i += 10) {
        await bot.sendMediaGroup(chatId, photos.slice(i, i + 10));
      }
      await bot.deleteMessage(chatId, load.message_id)
      return;
    } catch (legacyErr) {
      const detail = `${primaryErr}\n--- fallback ---\n${legacyErr}`;
      await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/instagram.js\n• Function: downloadInstagram()\n• Url: ${url}\n\n${detail}`.trim());
      return bot.editMessageText('An error occurred, make sure your Instagram link is valid!', { chat_id: chatId, message_id: load.message_id })
    }
  }
}


module.exports = {
  downloadInstagram
}