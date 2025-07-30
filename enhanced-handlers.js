// Enhanced URL Pattern Handlers and Callback System
const BotUI = require('./funcs/ui-helpers');
const ProgressTracker = require('./funcs/progress-tracker');

// This file contains the enhanced URL handlers and callback system
// It will be included in the main bot file

function setupEnhancedHandlers(bot, userLocks, userLocksText, userLocksImage) {

  // =======================
  // ENHANCED URL HANDLERS
  // =======================

  // Enhanced TikTok handler
  bot.onText(/https?:\/\/(?:.*\.)?tiktok\.com/, async (msg) => {
    let getban = await getBanned(msg.chat.id);
    if (!getban.status) {
      return bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('System', 'Account suspended', [
        'Contact @Krxuvv for support'
      ]), { parse_mode: 'HTML' });
    }

    let userId = msg.from.id.toString();
    if (userLocks[userId]) {
      return bot.sendMessage(msg.chat.id, 
        `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
        `🎪 <i>Please wait for your current TikTok download to complete...</i>`, 
        { parse_mode: 'HTML' }
      );
    }

    userLocks[userId] = true;
    
    try {
      // Enhanced progress tracking
      let progressMsg = await bot.sendMessage(msg.chat.id, 
        BotUI.getProgressMessage('TikTok', 'download', 10), 
        { parse_mode: 'HTML' }
      );
      
      let tracker = new ProgressTracker(bot, msg.chat.id, progressMsg.message_id);
      await tracker.start('TikTok', 'download');
      
      // Log usage
      await bot.sendMessage(String(process.env.DEV_ID), 
        `🎪 <b>TikTok Download Log</b>\n\n` +
        `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
        `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

      await tracker.updateProgress(30, 'Analyzing TikTok content...');
      await getTiktokInfo(bot, msg.chat.id, msg.text, msg.chat.username);
      
    } catch (error) {
      console.error('TikTok handler error:', error);
      await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('TikTok', 'Download failed', [
        'Check if the TikTok link is valid',
        'Ensure the video is not private',
        'Try copying the link again'
      ]), { parse_mode: 'HTML' });
    } finally {
      userLocks[userId] = false;
    }
  });

  // Enhanced YouTube handler
  bot.onText(/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/, async (msg, match) => {
    let getban = await getBanned(msg.chat.id);
    if (!getban.status) {
      return bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('System', 'Account suspended', [
        'Contact @Krxuvv for support'
      ]), { parse_mode: 'HTML' });
    }

    let userId = msg.from.id.toString();
    if (userLocks[userId]) {
      return bot.sendMessage(msg.chat.id, 
        `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
        `🔴 <i>Please wait for your current YouTube download to complete...</i>`, 
        { parse_mode: 'HTML' }
      );
    }

    // Check for livestream
    if (match[0].includes("/live/")) {
      return bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('YouTube', 'Cannot download livestream', [
        'Live streams cannot be downloaded',
        'Wait for the stream to end',
        'Try a regular video instead'
      ]), { parse_mode: 'HTML' });
    }

    userLocks[userId] = true;
    
    try {
      let progressMsg = await bot.sendMessage(msg.chat.id, 
        BotUI.getProgressMessage('YouTube', 'download', 15), 
        { parse_mode: 'HTML' }
      );
      
      let tracker = new ProgressTracker(bot, msg.chat.id, progressMsg.message_id);
      await tracker.start('YouTube', 'download');
      
      await bot.sendMessage(String(process.env.DEV_ID), 
        `🔴 <b>YouTube Download Log</b>\n\n` +
        `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
        `🔗 <b>URL:</b> ${match[0]}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

      await tracker.updateProgress(40, 'Fetching YouTube video information...');
      await getYoutube(bot, msg.chat.id, match[0], msg.chat.username);
      
    } catch (error) {
      console.error('YouTube handler error:', error);
      await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('YouTube', 'Download failed', [
        'Verify the YouTube link is correct',
        'Check if the video is available',
        'Try a different video quality'
      ]), { parse_mode: 'HTML' });
    } finally {
      userLocks[userId] = false;
    }
  });

  // Enhanced Instagram handler
  bot.onText(/(https?:\/\/)?(www\.)?(instagram\.com)\/.+/, async (msg) => {
    let getban = await getBanned(msg.chat.id);
    if (!getban.status) return;

    let userId = msg.from.id.toString();
    if (userLocks[userId]) {
      return bot.sendMessage(msg.chat.id, 
        `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
        `📷 <i>Please wait for your current Instagram download to complete...</i>`, 
        { parse_mode: 'HTML' }
      );
    }

    userLocks[userId] = true;
    
    try {
      let progressMsg = await bot.sendMessage(msg.chat.id, 
        BotUI.getProgressMessage('Instagram', 'download', 20), 
        { parse_mode: 'HTML' }
      );
      
      let tracker = new ProgressTracker(bot, msg.chat.id, progressMsg.message_id);
      await tracker.start('Instagram', 'download');
      
      await bot.sendMessage(String(process.env.DEV_ID), 
        `📷 <b>Instagram Download Log</b>\n\n` +
        `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
        `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

      await tracker.updateProgress(50, 'Processing Instagram content...');
      await downloadInstagram(bot, msg.chat.id, msg.text, msg.chat.username);
      
    } catch (error) {
      console.error('Instagram handler error:', error);
      await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Instagram', 'Download failed', [
        'Check if the Instagram link is valid',
        'Ensure the post is public',
        'Try refreshing and copying the link again'
      ]), { parse_mode: 'HTML' });
    } finally {
      userLocks[userId] = false;
    }
  });

  // Enhanced Twitter handler
  bot.onText(/https?:\/\/(?:.*\.)?twitter\.com/, async (msg) => {
    let getban = await getBanned(msg.chat.id);
    if (!getban.status) return;

    let userId = msg.from.id.toString();
    if (userLocks[userId]) {
      return bot.sendMessage(msg.chat.id, 
        `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
        `🐦 <i>Please wait for your current Twitter download to complete...</i>`, 
        { parse_mode: 'HTML' }
      );
    }

    userLocks[userId] = true;
    
    try {
      let progressMsg = await bot.sendMessage(msg.chat.id, 
        BotUI.getProgressMessage('Twitter', 'download', 25), 
        { parse_mode: 'HTML' }
      );
      
      let tracker = new ProgressTracker(bot, msg.chat.id, progressMsg.message_id);
      await tracker.start('Twitter', 'download');
      
      await bot.sendMessage(String(process.env.DEV_ID), 
        `🐦 <b>Twitter Download Log</b>\n\n` +
        `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
        `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

      await tracker.updateProgress(45, 'Fetching Twitter media...');
      await getDataTwitter(bot, msg.chat.id, msg.text, msg.chat.username);
      
    } catch (error) {
      console.error('Twitter handler error:', error);
      await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Twitter', 'Download failed', [
        'Verify the Twitter link is correct',
        'Check if the tweet is public',
        'Ensure the tweet contains media'
      ]), { parse_mode: 'HTML' });
    } finally {
      userLocks[userId] = false;
    }
  });

  // Add more enhanced handlers for other platforms...
  // [Similar pattern for Facebook, Pinterest, Spotify, etc.]

  // =======================
  // ENHANCED CALLBACK SYSTEM
  // =======================

  bot.on('callback_query', async (query) => {
    const data = query.data;
    const url = data.split(' ').slice(1).join(' ');
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const username = query.message.chat.username;

    try {
      // Answer the callback query to remove loading state
      await bot.answerCallbackQuery(query.id);

      // Enhanced callback handlers with progress tracking
      if (data.startsWith('main_menu')) {
        await bot.editMessageText(`🏠 <b>Main Menu</b>\n\n${BotUI.FEATURE_EMOJI} <b>Choose what you'd like to do:</b>`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify(BotUI.getMainMenuKeyboard()),
          parse_mode: 'HTML'
        });

      } else if (data.startsWith('menu_download')) {
        await bot.editMessageText(
          `${BotUI.DOWNLOAD_EMOJI} <b>Download Center</b>\n\n` +
          `📱 <b>Supported Platforms:</b>\n` +
          `🔴 YouTube (videos/audio)\n` +
          `🎪 TikTok (videos/sounds)\n` +
          `📷 Instagram (posts/stories)\n` +
          `🐦 Twitter (videos/images)\n` +
          `📘 Facebook (videos/media)\n` +
          `📌 Pinterest (images)\n` +
          `🎵 Spotify (songs/playlists)\n` +
          `🐙 GitHub (repositories)\n\n` +
          `💡 <i>Simply send any link to download!</i>`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]]
          }),
          parse_mode: 'HTML'
        });

      } else if (data.startsWith('menu_ai')) {
        await bot.editMessageText(BotUI.getAIIntroMessage(), {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '🧠 Ask AI Question', callback_data: 'ai_prompt' }],
              [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
            ]
          }),
          parse_mode: 'HTML'
        });

      } else if (data.startsWith('menu_search')) {
        await bot.editMessageText(BotUI.getSearchIntroMessage(), {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '🌐 Google Search', callback_data: 'google_prompt' }],
              [{ text: '📌 Pinterest Search', callback_data: 'pinterest_prompt' }],
              [{ text: '🧠 Brainly Search', callback_data: 'brainly_prompt' }],
              [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
            ]
          }),
          parse_mode: 'HTML'
        });

      } else if (data.startsWith('menu_images')) {
        await bot.editMessageText(BotUI.getImageToolsMessage(), {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '📤 Send Image', callback_data: 'image_prompt' }],
              [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
            ]
          }),
          parse_mode: 'HTML'
        });

      } else if (data.startsWith('help_')) {
        await handleHelpCallback(bot, chatId, messageId, data);

      // Original download callbacks with enhanced UI
      } else if (data.startsWith('tta')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Downloading TikTok Audio...</b>\n\n` +
          `🎵 <i>Extracting audio from TikTok video...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await tiktokAudio(bot, chatId, url, username);

      } else if (data.startsWith('ttv')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Downloading TikTok Video...</b>\n\n` +
          `🎬 <i>Preparing TikTok video download...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await tiktokVideo(bot, chatId, url, username);

      } else if (data.startsWith('tts')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Downloading TikTok Sound...</b>\n\n` +
          `🎶 <i>Extracting original sound...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await tiktokSound(bot, chatId, url, username);

      } else if (data.startsWith('ytv')) {
        let args = url.split(' ');
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Downloading YouTube Video...</b>\n\n` +
          `🎬 <i>Processing video download...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await getYoutubeVideo(bot, chatId, args[0], args[1], username);

      } else if (data.startsWith('yta')) {
        let args = url.split(' ');
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Downloading YouTube Audio...</b>\n\n` +
          `🎵 <i>Extracting audio from video...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await getYoutubeAudio(bot, chatId, args[0], args[1], username);

      } else if (data.startsWith('ocr')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Processing OCR...</b>\n\n` +
          `🔍 <i>Extracting text from image...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await Ocr(bot, chatId, url, username);

      } else if (data.startsWith('tourl1')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Uploading to Telegraph...</b>\n\n` +
          `📤 <i>Creating permanent image link...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await telegraphUpload(bot, chatId, url, username);

      } else if (data.startsWith('tourl2')) {
        await bot.editMessageText(
          `${BotUI.LOADING_EMOJI} <b>Uploading to Pomf2...</b>\n\n` +
          `☁️ <i>Creating cloud storage link...</i>`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        await Pomf2Upload(bot, chatId, url, username);

      // Add more callback handlers...
      } else {
        // Unknown callback
        await bot.editMessageText(
          `${BotUI.ERROR_EMOJI} <b>Unknown Action</b>\n\n` +
          `⚠️ <i>This action is not recognized.</i>\n\n` +
          `💡 Please try again or return to the main menu.`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
          }),
          parse_mode: 'HTML'
        });
      }

    } catch (error) {
      console.error('Callback query error:', error);
      try {
        await bot.editMessageText(BotUI.getErrorMessage('System', 'Action failed', [
          'Try the action again',
          'Return to main menu',
          'Contact support if issue persists'
        ]), {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
          }),
          parse_mode: 'HTML'
        });
      } catch (editError) {
        console.error('Failed to edit message:', editError);
      }
    }
  });
}

// Helper function for help callbacks
async function handleHelpCallback(bot, chatId, messageId, data) {
  const helpType = data.split('_')[1];
  let helpMessage = '';
  
  switch(helpType) {
    case 'downloaders':
      helpMessage = `${BotUI.VIDEO_EMOJI} <b>Download Features</b>\n\n` +
        `📱 <b>Supported Platforms:</b>\n\n` +
        `🔴 <b>YouTube</b>\n` +
        `• Videos in multiple qualities\n` +
        `• Audio extraction (MP3)\n` +
        `• Music from YouTube Music\n\n` +
        `🎪 <b>TikTok</b>\n` +
        `• Videos without watermark\n` +
        `• Audio extraction\n` +
        `• Original sounds\n\n` +
        `📷 <b>Instagram</b>\n` +
        `• Posts and carousels\n` +
        `• Stories and highlights\n` +
        `• IGTV and reels\n\n` +
        `🐦 <b>Twitter/X</b>\n` +
        `• Videos in HD/SD\n` +
        `• Images and GIFs\n` +
        `• Audio extraction\n\n` +
        `💡 <i>Just send any link to download!</i>`;
      break;
      
    case 'ai':
      helpMessage = BotUI.getAIIntroMessage();
      break;
      
    case 'images':
      helpMessage = BotUI.getImageToolsMessage();
      break;
      
    case 'search':
      helpMessage = BotUI.getSearchIntroMessage();
      break;
      
    case 'usage':
      helpMessage = `${BotUI.INFO_EMOJI} <b>How to Use the Bot</b>\n\n` +
        `🚀 <b>Getting Started:</b>\n` +
        `1. Send /start to see the welcome message\n` +
        `2. Use /menu for quick access to features\n` +
        `3. Send any social media link to download\n\n` +
        `⌨️ <b>Commands:</b>\n` +
        `• /ai <question> - Ask AI anything\n` +
        `• /google <query> - Search Google\n` +
        `• /brainly <question> - Educational answers\n` +
        `• /pin <search> - Pinterest images\n` +
        `• /help - Show this help\n` +
        `• /menu - Main menu\n\n` +
        `📱 <b>Sending Links:</b>\n` +
        `• Copy link from any supported platform\n` +
        `• Paste it in the chat\n` +
        `• Choose download options\n` +
        `• Wait for your file!\n\n` +
        `💡 <i>Pro tip: Use the menu buttons for easier navigation!</i>`;
      break;
      
    case 'troubleshoot':
      helpMessage = `🔧 <b>Troubleshooting Guide</b>\n\n` +
        `❓ <b>Common Issues:</b>\n\n` +
        `🚫 <b>"Download Failed"</b>\n` +
        `• Check if link is valid and public\n` +
        `• Try copying the link again\n` +
        `• Some private content can't be downloaded\n\n` +
        `⚠️ <b>"File too large"</b>\n` +
        `• Telegram has 50MB limit\n` +
        `• Try lower quality option\n` +
        `• Use direct download link provided\n\n` +
        `⏳ <b>"Takes too long"</b>\n` +
        `• Large files take more time\n` +
        `• Don't send multiple requests\n` +
        `• Wait for current download to finish\n\n` +
        `🔄 <b>"Bot not responding"</b>\n` +
        `• Try /start command\n` +
        `• Wait a few seconds and try again\n` +
        `• Contact @Krxuvv if issue persists\n\n` +
        `📞 <b>Need More Help?</b>\n` +
        `Contact: @Krxuvv`;
      break;
      
    default:
      helpMessage = `${BotUI.HELP_EMOJI} <b>Help Center</b>\n\n` +
        `Select a category to get detailed help information.`;
  }
  
  await bot.editMessageText(helpMessage, {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: '🔙 Back to Help', callback_data: 'back_to_help' }],
        [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
      ]
    }),
    parse_mode: 'HTML'
  });
}

module.exports = { setupEnhancedHandlers };