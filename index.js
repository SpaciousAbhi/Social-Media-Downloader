require('dotenv').config()
process.env['NTBA_FIX_350'] = 1
const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')

// Import functions
const { getTiktokInfo, tiktokVideo, tiktokAudio } = require('./funcs/tiktok')
const { getDataTwitter, downloadTwitterHigh, downloadTwitterAudio } = require('./funcs/twitter')
const { getPlaylistSpotify, getAlbumsSpotify, getSpotifySong } = require('./funcs/spotify')
const { downloadInstagram } = require('./funcs/instagram')
const { pinterest, pinSearch } = require('./funcs/pinterest')
const { getYoutube, getYoutubeAudio, getYoutubeVideo } = require('./funcs/youtube')
const { getFacebook, getFacebookNormal, getFacebookAudio } = require('./funcs/facebook')
const { threadsDownload } = require('./funcs/threads')
const { getAiResponse } = require('./funcs/ai')
const { googleSearch } = require('./funcs/google')
const { gitClone } = require('./funcs/github')
const { getNetworkUploadSpeed, getNetworkDownloadSpeed, evaluateBot, executeBot } = require('./funcs/dev')
const { telegraphUpload, Pomf2Upload, Ocr } = require('./funcs/images')
const { addUserDb, getAllUsers } = require('./funcs/database');
const { getBuffer, resolveUrl, getBanned, getCallbackData } = require('./funcs/functions');
const { connectDB } = require('./funcs/mongodb');

// Helper to extract first URL from text
function getLink(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s\n]+/i);
  return match ? match[0] : null;
}

// Ensure necessary directories exist
;['content', 'images'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Token
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TOKEN
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN (or TOKEN) environment variable')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

// Initialize MongoDB
connectDB().then(() => {
  console.log('MongoDB Initialized');
  
  // Restart Notification
  const adminId = process.env.DEV_ID;
  if (adminId) {
    bot.sendMessage(adminId, `🚀 *Bot Restarted*\nTime: \`${new Date().toLocaleString()}\`\nStatus: Operational ✅`, { parse_mode: 'Markdown' });
  }

  // Notify Users (Optional broadcast)
  if (process.env.NOTIFY_RESTART === 'true') {
    getAllUsers('./database.json').then(users => {
      users.forEach(chatId => {
        if (chatId !== adminId) {
          bot.sendMessage(chatId, `✨ *Bot is Online!*\nWe are back up and running. Thank you for your patience! 🚀`, { parse_mode: 'Markdown' }).catch(() => {});
        }
      });
    });
  }
});

// Middleware / Express Status
app.get('/', (req, res) => {
  res.send({ Status: "Active", Time: new Date().toISOString() })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Bot is running... HTTP server on :${PORT}`));

// Status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  let statusMsg = `🖥 *SYSTEM DASHBOARD*\n`;
  statusMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  statusMsg += `⏱ *Uptime:* \`${hours}h ${minutes}m ${seconds}s\`\n`;
  statusMsg += `📟 *Memory:* \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\n`;
  statusMsg += `⚙️ *Node:* \`${process.version}\`\n`;
  statusMsg += `💎 *yt-dlp:* \`Ready ✅\`\n`;
  statusMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  statusMsg += `📡 *Status:* \`Operational\``;

  bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
});

bot.on('photo', async (msg) => {
  let chatId = msg.chat.id;
  let ban = await getBanned(chatId);
  if (!ban.status) return bot.sendMessage(chatId, `❌ *Access Denied*\nReason: ${ban.reason || 'Banned'}`, { parse_mode: 'Markdown' });
  
  const destDir = `images/${chatId}`;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  
  try {
    let filePath = await bot.downloadFile(msg.photo[msg.photo.length - 1].file_id, destDir);
    await bot.deleteMessage(chatId, msg.message_id);
    let options = {
      caption: `🎨 *Image Tools*\n\nChoose an action for your image:`,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: `🔍 Extract Text (OCR)`, callback_data: `ocr ${filePath}` }],
          [{ text: `🌐 Upload to Telegraph`, callback_data: `tourl1 ${filePath}` }],
          [{ text: `☁️ Upload to Pomf2`, callback_data: `tourl2 ${filePath}` }]
        ]
      })
    }
    return bot.sendPhoto(chatId, filePath, options)
  } catch (err) {
    bot.sendMessage(process.env.DEV_ID, `⚠️ *Photo Error:* \`${err.message}\``, { parse_mode: 'Markdown' });
  }
})

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await addUserDb(chatId, './database.json');
  
  const welcome = `✨ *WELCOME TO ${process.env.BOT_NAME || 'MEDIA DOWN-BOT'}* ✨\n\n` +
                  `I am your ultimate companion for downloading content from all your favorite platforms! 🚀\n\n` +
                  `📱 *SUPPORTED PLATFORMS:*\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n` +
                  `• 🎵 *TikTok* (Video/Photo)\n` +
                  `• 📸 *Instagram* (Reels/Post)\n` +
                  `• 🐦 *Twitter / X* (Video/GIF)\n` +
                  `• 📘 *Facebook* (Public Video)\n` +
                  `• 🧵 *Threads* (Video)\n` +
                  `• 🎥 *YouTube* (Video/Audio)\n` +
                  `• 📌 *Pinterest* (Video/Image)\n` +
                  `• 🎧 *Spotify* (Music)\n` +
                  `• 📂 *GitHub* (Repo Clone)\n\n` +
                  `💡 *OTHER FEATURES:*\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n` +
                  `• 🤖 /ai - Ask AI anything\n` +
                  `• 🔍 /google - Search Google\n` +
                  `• 🖼 /pin - Search Pinterest\n` +
                  `• 🧠 OCR & Image Hosting (Send Image)\n\n` +
                  `👉 *Just send a link to start!*`;
                  
  bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
})

// Dev Commands
bot.onText(/\/upload/, (msg) => msg.from.id == process.env.DEV_ID && getNetworkUploadSpeed(bot, msg.chat.id));
bot.onText(/\/download/, (msg) => msg.from.id == process.env.DEV_ID && getNetworkDownloadSpeed(bot, msg.chat.id));
bot.onText(/\/senddb/, (msg) => msg.from.id == process.env.DEV_ID && bot.sendDocument(msg.chat.id, "./database.json"));
bot.onText(/\> (.+)/, (msg, match) => msg.from.id == process.env.DEV_ID && evaluateBot(bot, msg.chat.id, match[1]));
bot.onText(/\$ (.+)/, (msg, match) => msg.from.id == process.env.DEV_ID && executeBot(bot, msg.chat.id, match[1]));

// Features
bot.onText(/\/ai (.+)/, (msg, match) => getAiResponse(bot, msg.chat.id, match[1], msg.from.username));
bot.onText(/\/google (.+)/, (msg, match) => googleSearch(bot, msg.chat.id, match[1], msg.from.username));
bot.onText(/^(\/(pin|pinterest)) (.+)/, (msg, match) => pinSearch(bot, msg.chat.id, match[3], msg.from.username));

// Platform Regex
bot.onText(/https?:\/\/(?:.*\.)?tiktok\.com/, (msg) => getTiktokInfo(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/https?:\/\/(?:.*\.)?(twitter\.com|x\.com)/, (msg) => getDataTwitter(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/(https?:\/\/)?(www\.)?(instagram\.com)\/.+/, (msg) => downloadInstagram(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/(https?:\/\/)?(www\.)?(pinterest\.ca|pinterest\.?com|pin\.?it)\/.+/, (msg) => pinterest(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/(track|album|playlist)\/.+/, (msg, match) => {
  const url = getLink(msg.text);
  if (match[4] === 'track') return getSpotifySong(bot, msg.chat.id, url, msg.from.username);
  if (match[4] === 'album') return getAlbumsSpotify(bot, msg.chat.id, url, msg.from.username);
  return getPlaylistSpotify(bot, msg.chat.id, url, msg.from.username);
});
bot.onText(/https?:\/\/(?:www\.)?youtu\.?be(?:\.com)?\/.+/, (msg) => getYoutube(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/https?:\/\/(?:www\.)?facebook\.com\/.+/, (msg) => getFacebook(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/https?:\/\/(?:www\.)?threads\.net\/.+/, (msg) => threadsDownload(bot, msg.chat.id, getLink(msg.text), msg.from.username));
bot.onText(/(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i, (msg) => gitClone(bot, msg.chat.id, getLink(msg.text), msg.from.username));

// Callback Handling
bot.on('callback_query', async (mil) => {
  const data = mil.data;
  const chatId = mil.message.chat.id;
  const msgid = mil.message.message_id;
  const userName = mil.from.username || mil.from.first_name || 'user';
  const url = await resolveUrl(data);

  if (!url && data.includes('cache:')) {
    return bot.sendMessage(chatId, `❌ *Session Expired*\nPlease send the link again to refresh the downpgrade buttons.`, { parse_mode: 'Markdown' });
  }

  await bot.deleteMessage(chatId, msgid);

  if (data.startsWith('ttv')) await tiktokVideo(bot, chatId, url, userName);
  if (data.startsWith('tta')) await tiktokAudio(bot, chatId, url, userName);
  if (data.startsWith('igv')) await downloadInstagram(bot, chatId, url, userName);
  if (data.startsWith('iga')) await downloadInstagram(bot, chatId, url, userName); // IG audio typically just sends video
  if (data.startsWith('twh')) await downloadTwitterHigh(bot, chatId, userName, url);
  if (data.startsWith('twa')) await downloadTwitterAudio(bot, chatId, userName, url);
  if (data.startsWith('spt')) await getSpotifySong(bot, chatId, url, userName); // Kept from original
  if (data.startsWith('fbn')) await getFacebookNormal(bot, chatId, userName, url);
  if (data.startsWith('fba')) await getFacebookAudio(bot, chatId, userName, url);
  if (data.startsWith('ytdlpv')) await getYoutubeVideo(bot, chatId, url, null, userName);
  if (data.startsWith('ytdlpa')) await getYoutubeAudio(bot, chatId, url, null, userName);
  if (data.startsWith('thv')) {
      const { getThreadsVideo } = require('./funcs/threads');
      await (getThreadsVideo || threadsDownload)(bot, chatId, url, userName);
  }
  if (data.startsWith('tha')) {
      const { getThreadsAudio } = require('./funcs/threads');
      await (getThreadsAudio || threadsDownload)(bot, chatId, url, userName);
  }
  if (data.startsWith('tourl1')) await telegraphUpload(bot, chatId, url, userName); // Kept from original
  if (data.startsWith('tourl2')) await Pomf2Upload(bot, chatId, url, userName);
  if (data.startsWith('ocr')) await Ocr(bot, chatId, url, userName);
});

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);