require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const { downloadWithYtDlp } = require('./ytdlp');

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

async function getYoutube(bot, chatId, url, _userName) {
  url = normalizeYouTubeUrl(url);
  const load = await bot.sendMessage(chatId, 'Loading, please wait.');
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Download Video (720p max)', callback_data: `ytv ${url}` }],
        [{ text: 'Download Audio', callback_data: `yta ${url}` }],
      ],
    },
  };
  await bot.editMessageText('Choose format:', { chat_id: chatId, message_id: load.message_id, ...opts });
}

async function getYoutubeVideo(bot, chatId, id, _ind, userName) {
  const url = String(id).startsWith('http') ? id : `https://www.youtube.com/watch?v=${id}`;
  const load = await bot.sendMessage(chatId, 'Downloading video, please wait...');
  const out = `content/yt-${Date.now()}-${chatId}.mp4`;
  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: '22' }) || ytdl.chooseFormat(info.formats, { quality: '18' });
    if (!format || !format.url) throw new Error('No suitable YouTube format found');

    await new Promise((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, { format });
      const file = fs.createWriteStream(out);
      stream.pipe(file);
      stream.on('error', reject);
      file.on('error', reject);
      file.on('finish', resolve);
    });

    const stat = fs.statSync(out);
    const max = 49 * 1024 * 1024;
    if (stat.size > max) {
      await bot.editMessageText('File is too large for Telegram bot upload (>49MB). Try shorter/lower quality video.', { chat_id: chatId, message_id: load.message_id });
      fs.unlinkSync(out);
      return;
    }

    await bot.sendVideo(chatId, out, { caption: 'YouTube video' });
    await bot.deleteMessage(chatId, load.message_id);
    fs.unlinkSync(out);
  } catch (err) {
    try {
      const f = await downloadWithYtDlp(url, 'video');
      const stat2 = fs.statSync(f);
      const max2 = 49 * 1024 * 1024;
      if (stat2.size <= max2) {
        await bot.sendVideo(chatId, f, { caption: 'YouTube video' });
        await bot.deleteMessage(chatId, load.message_id);
        fs.unlinkSync(f);
        if (fs.existsSync(out)) fs.unlinkSync(out);
        return;
      }
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}

    const detail = (err && err.stack) ? String(err.stack) : String(err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/youtube.js\n• Function: getYoutubeVideo()\n• Url: ${url}\n\n${detail}`.slice(0, 3900));
    await bot.editMessageText('Failed to download video.', { chat_id: chatId, message_id: load.message_id });
    if (fs.existsSync(out)) fs.unlinkSync(out);
  }
}

async function getYoutubeAudio(bot, chatId, id, _ind, userName) {
  const url = String(id).startsWith('http') ? id : `https://www.youtube.com/watch?v=${id}`;
  const load = await bot.sendMessage(chatId, 'Downloading audio, please wait...');
  const out = `content/yt-${Date.now()}-${chatId}.mp3`;
  try {
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
      const file = fs.createWriteStream(out);
      stream.pipe(file);
      stream.on('error', reject);
      file.on('error', reject);
      file.on('finish', resolve);
    });

    const stat = fs.statSync(out);
    const max = 49 * 1024 * 1024;
    if (stat.size > max) {
      await bot.editMessageText('Audio is too large for Telegram bot upload (>49MB).', { chat_id: chatId, message_id: load.message_id });
      fs.unlinkSync(out);
      return;
    }

    await bot.sendAudio(chatId, out, { caption: 'YouTube audio' });
    await bot.deleteMessage(chatId, load.message_id);
    fs.unlinkSync(out);
  } catch (err) {
    try {
      const f = await downloadWithYtDlp(url, 'audio');
      const stat2 = fs.statSync(f);
      const max2 = 49 * 1024 * 1024;
      if (stat2.size <= max2) {
        await bot.sendAudio(chatId, f, { caption: 'YouTube audio' });
        await bot.deleteMessage(chatId, load.message_id);
        fs.unlinkSync(f);
        if (fs.existsSync(out)) fs.unlinkSync(out);
        return;
      }
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}

    const detail = (err && err.stack) ? String(err.stack) : String(err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/youtube.js\n• Function: getYoutubeAudio()\n• Url: ${url}\n\n${detail}`.slice(0, 3900));
    await bot.editMessageText('Failed to download audio.', { chat_id: chatId, message_id: load.message_id });
    if (fs.existsSync(out)) fs.unlinkSync(out);
  }
}

module.exports = {
  getYoutube,
  getYoutubeVideo,
  getYoutubeAudio,
};
