require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const util = require('util');
const { htmlToText, getBuffer, filterAlphanumericWithDash } = require('./functions');
// NOTE: y2mate-api is unreliable; we prefer yt-dlp for production stability.
const { downloadWithYtDlp } = require('./ytdlp');

function normalizeYouTubeUrl(input) {
  try {
    // Extract video id from common formats
    const m = String(input).match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
    const id = m ? m[1] : null;
    if (!id) return input;
    return `https://www.youtube.com/watch?v=${id}`;
  } catch {
    return input;
  }
}

async function getYoutube(bot, chatId, url, userName) {
  const originalUrl = url
  url = normalizeYouTubeUrl(url)

  let load = await bot.sendMessage(chatId, 'Loading, please wait.')
  try { await bot.sendMessage(String(process.env.DEV_ID), `[YT] original=${originalUrl}
[YT] normalized=${url}`.trim()) } catch {}

  // Offer two simple options (video/audio) using yt-dlp. This avoids y2mate instability.
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Download Video (best)', callback_data: `ytdlpv ${url}` }],
        [{ text: 'Download Audio (mp3)', callback_data: `ytdlpa ${url}` }],
      ],
    },
  }

  await bot.editMessageText('Choose format:', { chat_id: chatId, message_id: load.message_id, ...opts })
}

async function getYoutubeVideo(bot, chatId, id, ind, userName) {
  // Back-compat: treat id as video id
  const url = `https://www.youtube.com/watch?v=${id}`
  let load = await bot.sendMessage(chatId, 'Downloading video, please wait...')
  try {
    const filePath = await downloadWithYtDlp(url, 'video')
    const stat = require('fs').statSync(filePath)
    const max = 49 * 1024 * 1024
    if (stat.size > max) {
      await bot.editMessageText('File is too large for Telegram bot upload (>49MB).', { chat_id: chatId, message_id: load.message_id })
      return
    }
    await bot.sendVideo(chatId, filePath, { caption: 'YouTube video' })
    await bot.deleteMessage(chatId, load.message_id)
    require('fs').unlinkSync(filePath)
  } catch (err) {
    const util = require('util')

    const redact = (s) => String(s)
      // redact bot token if it appears in request URLs
      .replace(/\/bot\d+:[^/\s]+\//g, '/bot<redacted>/')

    let detail = (err && err.stack) ? redact(err.stack)
      : (err && err.message && typeof err.message === 'string') ? redact(err.message)
      : redact(util.inspect(err, { depth: 4 }))

    // Telegram max message length is limited; keep logs readable.
    const MAX = 3500
    const shortDetail = detail.length > MAX ? (detail.slice(0, MAX) + `\n... (truncated ${detail.length - MAX} chars)`) : detail

    console.error('getYoutubeVideo_error', shortDetail)

    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/youtube.js\n• Function: getYoutubeVideo()\n• Url: ${url}\n\n${shortDetail}`)
    await bot.editMessageText('Failed to download video.', { chat_id: chatId, message_id: load.message_id })
  }
}

async function getYoutubeAudio(bot, chatId, id, ind, userName) {
  const url = `https://www.youtube.com/watch?v=${id}`
  let load = await bot.sendMessage(chatId, 'Downloading audio, please wait...')
  try {
    const filePath = await downloadWithYtDlp(url, 'audio')
    const stat = require('fs').statSync(filePath)
    const max = 49 * 1024 * 1024
    if (stat.size > max) {
      await bot.editMessageText('File is too large for Telegram bot upload (>49MB).', { chat_id: chatId, message_id: load.message_id })
      return
    }
    await bot.sendAudio(chatId, filePath, { caption: 'YouTube audio' })
    await bot.deleteMessage(chatId, load.message_id)
    require('fs').unlinkSync(filePath)
  } catch (err) {
    const util = require('util')

    const redact = (s) => String(s)
      .replace(/\/bot\d+:[^/\s]+\//g, '/bot<redacted>/')

    let detail = (err && err.stack) ? redact(err.stack)
      : (err && err.message && typeof err.message === 'string') ? redact(err.message)
      : redact(util.inspect(err, { depth: 4 }))

    const MAX = 3500
    const shortDetail = detail.length > MAX ? (detail.slice(0, MAX) + `\n... (truncated ${detail.length - MAX} chars)`) : detail

    console.error('getYoutubeAudio_error', shortDetail)

    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/youtube.js\n• Function: getYoutubeAudio()\n• Url: ${url}\n\n${shortDetail}`)
    await bot.editMessageText('Failed to download audio.', { chat_id: chatId, message_id: load.message_id })
  }
}


module.exports = {
  getYoutube,
  getYoutubeVideo,
  getYoutubeAudio
}
