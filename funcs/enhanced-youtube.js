// Enhanced YouTube handler with improved UI/UX
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const util = require('util');
const { htmlToText, getBuffer, filterAlphanumericWithDash } = require('./functions');
const { Y2MateClient } = require('y2mate-api');
const BotUI = require('./ui-helpers');
const ProgressTracker = require('./progress-tracker');

const client = new Y2MateClient();

async function getYoutubeEnhanced(bot, chatId, url, userName) {
  let progressMsg = await bot.sendMessage(chatId, 
    BotUI.getProgressMessage('YouTube', 'analysis', 15), 
    { parse_mode: 'HTML' }
  );
  
  let tracker = new ProgressTracker(bot, chatId, progressMsg.message_id);
  await tracker.start('YouTube', 'analysis');

  try {
    await tracker.updateProgress(25, 'Connecting to YouTube...');

    if (url.includes('music.youtube.com')) {
      return await handleYouTubeMusic(bot, chatId, url, userName, tracker);
    } else {
      return await handleYouTubeVideo(bot, chatId, url, userName, tracker);
    }

  } catch (err) {
    console.error('YouTube processing error:', err);
    
    await tracker.error(BotUI.getErrorMessage('YouTube', 'Failed to process video', [
      'Check if the YouTube link is valid',
      'Ensure the video is publicly available',
      'Try copying the link again from YouTube',
      'Some age-restricted videos cannot be downloaded'
    ]));

    // Send to developer
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.ERROR_EMOJI} <b>YouTube Error Report</b>\n\n` +
      `👤 <b>User:</b> @${userName || 'unknown'}\n` +
      `🔗 <b>URL:</b> ${url}\n` +
      `❌ <b>Error:</b> ${err.message}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML' }
    );
  }
}

async function handleYouTubeMusic(bot, chatId, url, userName, tracker) {
  await tracker.updateProgress(40, 'Processing YouTube Music...');
  
  let newUrl = url.replace('music.youtube.com', 'www.youtube.com');
  let get = await client.getFromURL(newUrl, 'vi');
  
  await tracker.updateProgress(60, 'Analyzing audio quality options...');
  
  let getsize = get.linksAudio.get('mp3128' ? 'mp3128' : '140').size;
  let size = Math.floor(getsize.replace(' MB', ''));
  
  if (size > 49) {
    await tracker.error(BotUI.getFileSizeWarning(size));
    return;
  }

  await tracker.updateProgress(75, 'Downloading music file...');
  
  let fname = filterAlphanumericWithDash(get.title) + '.mp3';
  let get2 = await get.linksAudio.get('mp3128' ? 'mp3128' : '140').fetch();
  
  await tracker.updateProgress(90, 'Preparing audio file...');
  
  let buff = await getBuffer(get2.downloadLink);
  await fs.writeFileSync('content/' + fname, buff);
  
  // Success message
  let successMsg = BotUI.getSuccessMessage('YouTube Music', 'audio', get.title);
  await tracker.complete(successMsg);
  
  await bot.sendAudio(chatId, 'content/' + fname, { 
    caption: `${BotUI.MUSIC_EMOJI} <b>YouTube Music Download</b>\n\n` +
            `🎵 <b>Title:</b> ${get.title}\n` +
            `📊 <b>Size:</b> ${getsize}\n` +
            `🤖 <i>Downloaded by ${BotUI.BOT_NAME}</i>`,
    parse_mode: 'HTML'
  });
  
  await fs.unlinkSync('content/' + fname);
}

async function handleYouTubeVideo(bot, chatId, url, userName, tracker) {
  await tracker.updateProgress(35, 'Fetching video information...');
  
  let get = await client.getFromURL(url, 'vi');
  
  await tracker.updateProgress(55, 'Preparing download options...');
  
  // Create enhanced options with better formatting
  let videoOptions = [];
  let audioOptions = [];
  
  // Process video options
  for (let [ind, args] of get.linksVideo) {
    let title = htmlToText(args.name);
    let sizeInfo = args.size ? ` (${args.size})` : '';
    let qualityEmoji = getQualityEmoji(title);
    
    videoOptions.push({
      text: `${qualityEmoji} ${title}${sizeInfo}`,
      callback_data: `ytv ${get.videoId} ${ind}`
    });
  }
  
  // Process audio options
  for (let [ind, args] of get.linksAudio) {
    let title = htmlToText(args.name);
    let sizeInfo = args.size ? ` (${args.size})` : '';
    
    audioOptions.push({
      text: `${BotUI.MUSIC_EMOJI} ${title}${sizeInfo}`,
      callback_data: `yta ${get.videoId} ${ind}`
    });
  }
  
  // Create enhanced keyboard layout
  let keyboard = [];
  
  if (videoOptions.length > 0) {
    keyboard.push([{ text: `🎬 Video Options`, callback_data: 'video_section' }]);
    videoOptions.forEach(option => {
      keyboard.push([option]);
    });
  }
  
  if (audioOptions.length > 0) {
    keyboard.push([{ text: `🎵 Audio Options`, callback_data: 'audio_section' }]);
    audioOptions.forEach(option => {
      keyboard.push([option]);
    });
  }
  
  keyboard.push([
    { text: '🔙 Back', callback_data: 'back' },
    { text: '🏠 Menu', callback_data: 'main_menu' }
  ]);
  
  let options = {
    caption: `${BotUI.VIDEO_EMOJI} <b>YouTube Video Ready!</b>\n\n` +
            `🎬 <b>Title:</b> ${get.title}\n` +
            `⏱️ <b>Duration:</b> ${get.duration || 'Unknown'}\n` +
            `👁️ <b>Views:</b> ${get.views || 'Unknown'}\n\n` +
            `📥 <b>Choose your preferred download option:</b>\n\n` +
            `💡 <i>Higher quality = larger file size</i>`,
    reply_markup: JSON.stringify({
      inline_keyboard: keyboard
    }),
    parse_mode: 'HTML'
  };
  
  await tracker.complete(`${BotUI.SUCCESS_EMOJI} <b>YouTube options ready!</b>`);
  
  await bot.sendPhoto(chatId, `https://i.ytimg.com/vi/${get.videoId}/maxresdefault.jpg`, options);
}

async function getYoutubeVideoEnhanced(bot, chatId, id, ind, userName) {
  let progressMsg = await bot.sendMessage(chatId, 
    BotUI.getProgressMessage('YouTube', 'video download', 20), 
    { parse_mode: 'HTML' }
  );
  
  let tracker = new ProgressTracker(bot, chatId, progressMsg.message_id);
  await tracker.start('YouTube', 'video download');

  try {
    await tracker.updateProgress(30, 'Fetching video details...');
    
    let get = await client.getFromURL('https://www.youtube.com/' + id, 'vi');
    let res = await get.linksVideo.get(ind).fetch();
    let getsize = get.linksVideo.get(ind).size;
    let size = Math.floor(getsize.replace(' MB', ''));
    
    if (size > 49) {
      await tracker.error(
        BotUI.getFileSizeWarning(size) + 
        `\n\n🔗 <b>Direct Download Link:</b>\n${res.downloadLink}`
      );
      return;
    }

    await tracker.updateProgress(50, 'Downloading video file...');
    
    let fname = filterAlphanumericWithDash(res.title) + '.mp4';
    let buff = await getBuffer(res.downloadLink);
    
    await tracker.updateProgress(80, 'Processing video for Telegram...');
    
    await fs.writeFileSync('content/' + fname, buff);
    
    await tracker.updateProgress(95, 'Uploading to Telegram...');
    
    let successMsg = BotUI.getSuccessMessage('YouTube', 'video', res.title);
    await tracker.complete(successMsg);
    
    await bot.sendVideo(chatId, 'content/' + fname, { 
      caption: `${BotUI.VIDEO_EMOJI} <b>YouTube Video Download</b>\n\n` +
              `🎬 <b>Title:</b> ${res.title}\n` +
              `📊 <b>Size:</b> ${getsize}\n` +
              `🤖 <i>Downloaded by ${BotUI.BOT_NAME}</i>`,
      parse_mode: 'HTML'
    });
    
    await fs.unlinkSync('content/' + fname);
    
  } catch (err) {
    console.error('YouTube video download error:', err);
    await tracker.error(BotUI.getErrorMessage('YouTube', 'Video download failed', [
      'The video might be too large',
      'Try a different quality option',
      'Check your internet connection',
      'Some videos have download restrictions'
    ]));
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.ERROR_EMOJI} <b>YouTube Video Error</b>\n\n` +
      `👤 <b>User:</b> @${userName || 'unknown'}\n` +
      `🆔 <b>Video ID:</b> ${id}\n` +
      `📊 <b>Quality:</b> ${ind}\n` +
      `❌ <b>Error:</b> ${err.message}`, 
      { parse_mode: 'HTML' }
    );
  }
}

async function getYoutubeAudioEnhanced(bot, chatId, id, ind, userName) {
  let progressMsg = await bot.sendMessage(chatId, 
    BotUI.getProgressMessage('YouTube', 'audio extraction', 25), 
    { parse_mode: 'HTML' }
  );
  
  let tracker = new ProgressTracker(bot, chatId, progressMsg.message_id);
  await tracker.start('YouTube', 'audio extraction');

  try {
    await tracker.updateProgress(35, 'Fetching audio stream...');
    
    let get = await client.getFromURL('https://www.youtube.com/' + id, 'vi');
    let res = await get.linksAudio.get(ind).fetch();
    let getsize = get.linksAudio.get(ind).size;
    let size = Math.floor(getsize.replace(' MB', ''));
    
    if (size > 49) {
      await tracker.error(
        BotUI.getFileSizeWarning(size) + 
        `\n\n🔗 <b>Direct Download Link:</b>\n${res.downloadLink}`
      );
      return;
    }

    await tracker.updateProgress(55, 'Extracting audio...');
    
    let fname = filterAlphanumericWithDash(res.title) + '.mp3';
    let buff = await getBuffer(res.downloadLink);
    
    await tracker.updateProgress(80, 'Processing audio file...');
    
    await fs.writeFileSync('content/' + fname, buff);
    
    await tracker.updateProgress(95, 'Uploading audio...');
    
    let successMsg = BotUI.getSuccessMessage('YouTube', 'audio', res.title);
    await tracker.complete(successMsg);
    
    await bot.sendAudio(chatId, 'content/' + fname, { 
      caption: `${BotUI.MUSIC_EMOJI} <b>YouTube Audio Download</b>\n\n` +
              `🎵 <b>Title:</b> ${res.title}\n` +
              `📊 <b>Size:</b> ${getsize}\n` +
              `🤖 <i>Downloaded by ${BotUI.BOT_NAME}</i>`,
      parse_mode: 'HTML'
    });
    
    await fs.unlinkSync('content/' + fname);
    
  } catch (err) {
    console.error('YouTube audio download error:', err);
    await tracker.error(BotUI.getErrorMessage('YouTube', 'Audio extraction failed', [
      'The audio file might be too large',
      'Try a different quality option',
      'Check if the video has audio',
      'Some content has audio restrictions'
    ]));
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.ERROR_EMOJI} <b>YouTube Audio Error</b>\n\n` +
      `👤 <b>User:</b> @${userName || 'unknown'}\n` +
      `🆔 <b>Video ID:</b> ${id}\n` +
      `📊 <b>Quality:</b> ${ind}\n` +
      `❌ <b>Error:</b> ${err.message}`, 
      { parse_mode: 'HTML' }
    );
  }
}

// Helper function to get quality emoji
function getQualityEmoji(quality) {
  if (quality.includes('4K') || quality.includes('2160p')) return '💎';
  if (quality.includes('1080p') || quality.includes('HD')) return '🔥';
  if (quality.includes('720p')) return '⭐';
  if (quality.includes('480p')) return '📱';
  if (quality.includes('360p')) return '📺';
  return '🎬';
}

module.exports = {
  getYoutubeEnhanced,
  getYoutubeVideoEnhanced,
  getYoutubeAudioEnhanced
};