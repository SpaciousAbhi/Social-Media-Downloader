require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function pinSearch(bot, chatId, query, userName) {
  if (!query) return bot.sendMessage(chatId, '[Indonesia]\nGambar apa yang mau kamu cari di pinterest? contoh\n/pin anime\n\n[English]\nWhat images are you looking for on Pinterest? example\n/pin anime');
  let load = await bot.sendMessage(chatId, 'Loading, please wait');
  try {
    let get = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/?q=${query}&data={"options":{"isPrefetch":false,"query":"${query}","scope":"pins","no_fetch_context_on_resource":false},"context":{}}`)
    let json = await get.data;
		let data = json.resource_response.data.results;
		if (!data.length) return bot.editMessageText(`Query "${query}" not found!`, { chat_id: chatId, message_id: load.message_id });
		await bot.sendPhoto(chatId, data[~~(Math.random() * (data.length))].images.orig.url, { caption: `Bot by @Krxuvv` });
		return bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/pinterest.js\n• Function: pinSearch()\n• Query: ${query}\n\n${err}`.trim());
    return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id }) 
  }
}

const { downloadWithYtDlp, getMetadata } = require('./ytdlp');
const { getProgressBar } = require('./progress');

async function pinterest(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, '🛰 *Initializing Pinterest download...*', { parse_mode: 'Markdown' });
  try {
    let lastUpdate = 0;
    const filePath = await downloadWithYtDlp(url, 'video', (p) => {
      const now = Date.now();
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        const bar = getProgressBar(p.percent);
        bot.editMessageText(`📥 *Downloading Pinterest Media...*\n\n${bar}\n\n⚡️ *Speed:* \`${p.currentSpeed || '...'}\`\n⏳ *ETA:* \`${p.eta || '...'}\``, {
          chat_id: chatId,
          message_id: load.message_id,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    });

    await bot.editMessageText('📤 *Uploading to Telegram...*', { chat_id: chatId, message_id: load.message_id, parse_mode: 'Markdown' });
    
    // Check extension to send as photo or video
    if (filePath.endsWith('.mp4') || filePath.endsWith('.mkv') || filePath.endsWith('.mov')) {
        await bot.sendChatAction(chatId, 'upload_video');
        await bot.sendVideo(chatId, filePath, { 
          caption: `✅ *Success!* Pinterest media ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
          parse_mode: 'Markdown'
        });
    } else {
        await bot.sendChatAction(chatId, 'upload_photo');
        await bot.sendPhoto(chatId, filePath, { 
          caption: `✅ *Success!* Pinterest media ready.\n\n👤 *Requested by:* @${userName || 'user'}\n🤖 *Bot by:* @Krxuvv`,
          parse_mode: 'Markdown'
        });
    }
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    console.error('pinterest error:', err);
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR Pinterest ]\nUser: @${userName}\nUrl: ${url}\nError: ${err.message}`);
    return bot.editMessageText(`❌ *Pinterest Download Failed*\n\nError: \`${err.message}\``, { 
      chat_id: chatId, 
      message_id: load.message_id,
      parse_mode: 'Markdown' 
    })
  }
}

module.exports = {
  pinterest,
  pinSearch
}