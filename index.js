/* Enhanced Telegram Bot with Modern UI/UX
 * Upgraded with comprehensive improvements for better user experience
 */
require('dotenv').config({ path: './env' })
process.env['NTBA_FIX_350'] = 1

let express = require('express');
let app = express();
let TelegramBot = require('node-telegram-bot-api')
let fs = require('fs')

// Import UI/UX enhancement modules
const BotUI = require('./funcs/ui-helpers');
const ProgressTracker = require('./funcs/progress-tracker');

// Import existing function modules
let {
  getTiktokInfo,
  tiktokVideo,
  tiktokAudio,
  tiktokSound
} = require('./funcs/tiktok')
let {
  getDataTwitter,
  downloadTwitterHigh,
  downloadTwitterLow,
  downloadTwitterAudio
} = require('./funcs/twitter')
let {
  getPlaylistSpotify,
  getAlbumsSpotify,
  getSpotifySong
} = require('./funcs/spotify')
let {
  downloadInstagram
} = require('./funcs/instagram')
let {
  pinterest,
  pinSearch
} = require('./funcs/pinterest')
let {
  getBanned
} = require('./funcs/functions')
let {
  getYoutube,
  getYoutubeAudio,
  getYoutubeVideo
} = require('./funcs/youtube')
let {
  getFacebook,
  getFacebookNormal,
  getFacebookHD,
  getFacebookAudio
} = require('./funcs/facebook')
let {
  threadsDownload
} = require('./funcs/threads')
let {
  getAiResponse
} = require('./funcs/ai')
let {
  getBrainlyAnswer
} = require('./funcs/brainly')
let {
  googleSearch
} = require('./funcs/google')
let {
  gitClone
} = require('./funcs/github')
let {
  getNetworkUploadSpeed,
  getNetworkDownloadSpeed,
  evaluateBot,
  executeBot
} = require('./funcs/dev')
let {
  telegraphUpload,
  Pomf2Upload,
  Ocr
} = require('./funcs/images');
let {
  readDb,
  writeDb,
  addUserDb,
  changeBoolDb
} = require('./funcs/database')

// User session management
let userLocks = {};
let userLocksText = {};
let userLocksImage = {};

let token = process.env.TOKEN
if (!token) {
  console.error('FATAL ERROR: Telegram Bot Token not provided in environment variables!');
  process.exit(1);
}

console.log(`🚀 Initializing ${BotUI.BOT_NAME}...`);

// Determine if we should use webhooks (for Heroku) or polling (for local)
const useWebhook = process.env.NODE_ENV === 'production' || process.env.USE_WEBHOOK === 'true';
const webhookUrl = process.env.HEROKU_URL ? `${process.env.HEROKU_URL}/bot${token}` : null;

let bot;

if (useWebhook && webhookUrl) {
  // Webhook mode for production
  console.log('🌐 Using webhook mode for production...');
  bot = new TelegramBot(token);
  
  // Configure Express to handle webhooks
  app.use(express.json());
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  // Set webhook
  bot.setWebHook(webhookUrl)
    .then(() => {
      console.log(`✅ Webhook set to: ${webhookUrl}`);
    })
    .catch(err => {
      console.error('❌ Webhook setup failed:', err.message);
      console.log('Falling back to polling...');
      startPolling();
    });
} else {
  // Polling mode for development
  console.log('🔄 Using polling mode...');
  startPolling();
}

function startPolling() {
  bot = new TelegramBot(token, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });

  // Handle polling errors with retry logic
  let retryCount = 0;
  const maxRetries = 5;

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
    
    if (error.message.includes('409 Conflict')) {
      retryCount++;
      if (retryCount <= maxRetries) {
        console.log(`🔄 Telegram server conflict detected. Waiting ${retryCount * 5} seconds before retry... (${retryCount}/${maxRetries})`);
        setTimeout(() => {
          try {
            bot.stopPolling();
            setTimeout(() => {
              bot.startPolling({ restart: true });
            }, 2000);
          } catch (e) {
            console.log('Retry failed:', e.message);
          }
        }, retryCount * 5000);
      } else {
        console.log('⚠️  Max retries reached. Bot will continue with limited functionality.');
        console.log('💡 Try restarting the application in a few minutes.');
      }
    }
  });
}

// Express server setup
app.get('/', async (req, res) => {
  res.json({
    status: "Active",
    bot_name: BotUI.BOT_NAME,
    version: "2.0 Enhanced UI/UX",
    features: ["Enhanced Visual Design", "Progress Tracking", "Rich Formatting", "Better Error Handling", "Interactive Menus"]
  })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log(`🌐 Server is running on port ${PORT}`);
});
console.log(`✅ ${BotUI.BOT_NAME} is running!`)

// =======================
// ENHANCED UI/UX HANDLERS
// =======================

// Enhanced photo handler with modern UI
bot.on('photo', async (msg) => {
  let chatId = msg.chat.id;
  let getban = await getBanned(chatId);
  
  if (!getban.status) {
    return bot.sendMessage(chatId, BotUI.getErrorMessage('System', 'Account suspended', [
      'Contact @Krxuvv for support',
      'Check terms of service'
    ]), { parse_mode: 'HTML' });
  }

  if (!fs.existsSync(`images/${chatId}`)) {
    await fs.mkdirSync(`images/${chatId}`, { recursive: true });
  }

  try {
    // Show processing message
    let processingMsg = await bot.sendMessage(chatId, 
      `${BotUI.LOADING_EMOJI} <b>Processing your image...</b>\n\n` +
      `${BotUI.PHOTO_EMOJI} <i>Downloading and preparing options...</i>`, 
      { parse_mode: 'HTML' }
    );

    let write = await bot.downloadFile(msg.photo[msg.photo.length - 1].file_id, `images/${chatId}`);
    await bot.deleteMessage(msg.chat.id, msg.message_id);

    // Enhanced image options with better UI
    let options = {
      caption: BotUI.getImageToolsMessage(),
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{
            text: `🔍 Extract Text (OCR)`,
            callback_data: `ocr ${write}`
          }],
          [{
            text: `📤 Telegraph Upload`,
            callback_data: `tourl1 ${write}`
          }],
          [{
            text: `☁️ Pomf2 Upload`,
            callback_data: `tourl2 ${write}`
          }],
          [{
            text: `🏠 Main Menu`,
            callback_data: `main_menu`
          }]
        ]
      }),
      parse_mode: 'HTML'
    }

    await bot.deleteMessage(chatId, processingMsg.message_id);
    return bot.sendPhoto(chatId, `${write}`, options);
    
  } catch (err) {
    console.error('Photo processing error:', err);
    return bot.sendMessage(chatId, BotUI.getErrorMessage('Image Processing', 'Failed to process image', [
      'Try sending the image again',
      'Ensure image is not corrupted',
      'Contact @Krxuvv if issue persists'
    ]), { parse_mode: 'HTML' });
  }
});

// Enhanced /start command with interactive welcome
bot.onText(/\/start/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  
  if (!getban.status) {
    return bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('System', 'Account suspended', [
      'Contact @Krxuvv for support',
      'Review terms of service'
    ]), { parse_mode: 'HTML' });
  }

  let chatId = msg.chat.id;
  let db = await readDb('./database.json');
  
  // Add user to database if new
  if (!db[chatId]) {
    await addUserDb(chatId, './database.json');
  }

  // Send enhanced welcome message
  const welcomeMessage = BotUI.getWelcomeMessage();
  const welcomeKeyboard = BotUI.getMainMenuKeyboard();

  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: JSON.stringify(welcomeKeyboard),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
});

// Enhanced /help command
bot.onText(/\/help/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  const helpMessage = `${BotUI.HELP_EMOJI} <b>Help & Support Center</b>

Welcome to the comprehensive help system! Choose a category below to get detailed information.

${BotUI.INFO_EMOJI} <i>Select a topic to learn more about our features and how to use them effectively.</i>`;

  await bot.sendMessage(msg.chat.id, helpMessage, {
    reply_markup: JSON.stringify(BotUI.getHelpKeyboard()),
    parse_mode: 'HTML'
  });
});

// Enhanced /menu command
bot.onText(/\/menu/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  const menuMessage = `🏠 <b>Main Menu</b>

${BotUI.FEATURE_EMOJI} <b>Choose what you'd like to do:</b>

<i>Select an option below to access different features and tools.</i>`;

  await bot.sendMessage(msg.chat.id, menuMessage, {
    reply_markup: JSON.stringify(BotUI.getMainMenuKeyboard()),
    parse_mode: 'HTML'
  });
});

// Developer commands (enhanced with better UI)
bot.onText(/\/upload/, async (msg) => {
  let chatId = msg.chat.id
  if (String(msg.from.id) !== String(process.env.DEV_ID)) {
    return
  }
  await getNetworkUploadSpeed(bot, chatId)
})

bot.onText(/\/download/, async (msg) => {
  let chatId = msg.chat.id
  if (String(msg.from.id) !== String(process.env.DEV_ID)) {
    return
  }
  await getNetworkDownloadSpeed(bot, chatId)
})

bot.onText(/\/senddb/, async (msg) => {
  if (String(msg.from.id) !== String(process.env.DEV_ID)) {
    return
  }
  await bot.sendDocument(msg.chat.id, "./database.json")
})

bot.onText(/\>/, async (msg) => {
  if (String(msg.from.id) !== String(process.env.DEV_ID)) {
    return
  }
  let text = msg.text.split(' ').slice(1).join(' ');
  await evaluateBot(bot, msg.chat.id, text)
})

bot.onText(/\$/, async (msg) => {
  if (String(msg.from.id) !== String(process.env.DEV_ID)) {
    return
  }
  let text = msg.text.split(' ').slice(1).join(' ');
  await executeBot(bot, msg.chat.id, text)
})

// Enhanced AI command with better UX
bot.onText(/\/ai/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) {
    return bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('System', 'Access denied', [
      'Contact @Krxuvv for support'
    ]), { parse_mode: 'HTML' });
  }

  let input = msg.text.split(' ').slice(1).join(' ');
  let userId = msg.from.id.toString();
  
  if (userLocksText[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>AI Assistant Busy</b>\n\n` +
      `${BotUI.AI_EMOJI} <i>Your previous AI request is still processing...</i>\n\n` +
      `⏳ <i>Please wait for it to complete before asking another question.</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  if (!input) {
    return bot.sendMessage(msg.chat.id, BotUI.getAIIntroMessage(), { 
      parse_mode: 'HTML',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🤖 Try Example Questions', callback_data: 'ai_examples' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      })
    });
  }

  userLocksText[userId] = true;
  
  // Show enhanced processing message
  let processingMsg = await bot.sendMessage(msg.chat.id, 
    `${BotUI.AI_EMOJI} <b>AI Assistant Processing...</b>\n\n` +
    `🧠 <i>Analyzing your question...</i>\n` +
    `💭 <b>Question:</b> <code>${input.substring(0, 100)}${input.length > 100 ? '...' : ''}</code>\n\n` +
    `⏳ <i>Please wait while I generate a thoughtful response...</i>`, 
    { parse_mode: 'HTML' }
  );

  try {
    // Log usage for developer
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.AI_EMOJI} <b>AI Usage Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'} ${msg.from.last_name || ''}\n` +
      `🆔 <b>ID:</b> ${msg.from.id}\n` +
      `📝 <b>Query:</b> ${input.substring(0, 500)}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, processingMsg.message_id);
    await getAiResponse(bot, msg.chat.id, input, msg.chat.username);
    
  } catch (error) {
    await bot.editMessageText(BotUI.getErrorMessage('AI Assistant', 'Processing failed', [
      'Try rephrasing your question',
      'Check your internet connection',
      'Try again in a few moments',
      'Make sure your question is appropriate'
    ]), {
      chat_id: msg.chat.id,
      message_id: processingMsg.message_id,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🔄 Try Again', callback_data: 'ai_retry' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      })
    });
  } finally {
    userLocksText[userId] = false;
  }
});

// Enhanced Google search
bot.onText(/\/google/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let input = msg.text.split(' ').slice(1).join(' ');
  let userId = msg.from.id.toString();
  
  if (userLocksText[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>Search in progress</b>\n\n` +
      `${BotUI.SEARCH_EMOJI} <i>Please wait for your current search to complete...</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  if (!input) {
    return bot.sendMessage(msg.chat.id, BotUI.getSearchIntroMessage(), { 
      parse_mode: 'HTML',
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '🔍 Search Examples', callback_data: 'google_examples' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      })
    });
  }

  userLocksText[userId] = true;
  
  let searchMsg = await bot.sendMessage(msg.chat.id, 
    `${BotUI.SEARCH_EMOJI} <b>Google Search</b>\n\n` +
    `🔍 <i>Searching for:</i> <code>${input}</code>\n\n` +
    `⏳ <i>Fetching results from Google...</i>`, 
    { parse_mode: 'HTML' }
  );

  try {
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.SEARCH_EMOJI} <b>Google Search Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔍 <b>Query:</b> ${input}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, searchMsg.message_id);
    await googleSearch(bot, msg.chat.id, input, msg.chat.username);
    
  } catch (error) {
    await bot.editMessageText(BotUI.getErrorMessage('Google Search', 'Search failed', [
      'Try different search terms',
      'Check spelling and try again',
      'Use simpler keywords',
      'Try again in a few moments'
    ]), {
      chat_id: msg.chat.id,
      message_id: searchMsg.message_id,
      parse_mode: 'HTML'
    });
  } finally {
    userLocksText[userId] = false;
  }
});

// Enhanced Brainly command
bot.onText(/\/brainly/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let input = msg.text.split(' ').slice(1).join(' ');
  let userId = msg.from.id.toString();
  
  if (userLocksText[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>Query in progress</b>\n\n` +
      `🧠 <i>Please wait for your current Brainly request to complete...</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  if (!input) {
    return bot.sendMessage(msg.chat.id, 
      `🧠 <b>Brainly Educational Assistant</b>\n\n` +
      `📚 <b>Get help with your studies!</b>\n\n` +
      `<i>Examples:</i>\n` +
      `• <code>/brainly What is photosynthesis?</code>\n` +
      `• <code>/brainly Solve x + 5 = 10</code>\n` +
      `• <code>/brainly Explain World War 2</code>\n\n` +
      `💡 <i>Ask any educational question and get detailed answers!</i>`, 
      { parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: '📚 Study Examples', callback_data: 'brainly_examples' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        })
      }
    );
  }

  userLocksText[userId] = true;
  
  let brainlyMsg = await bot.sendMessage(msg.chat.id, 
    `🧠 <b>Brainly Search</b>\n\n` +
    `📖 <i>Searching educational content for:</i>\n` +
    `<code>${input}</code>\n\n` +
    `⏳ <i>Finding the best answers...</i>`, 
    { parse_mode: 'HTML' }
  );

  try {
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🧠 <b>Brainly Usage Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `❓ <b>Question:</b> ${input}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, brainlyMsg.message_id);
    await getBrainlyAnswer(bot, msg.chat.id, input, msg.chat.username);
    
  } catch (error) {
    await bot.editMessageText(BotUI.getErrorMessage('Brainly', 'Search failed', [
      'Try rephrasing your question',
      'Be more specific in your query',
      'Check for typos and try again'
    ]), {
      chat_id: msg.chat.id,
      message_id: brainlyMsg.message_id,
      parse_mode: 'HTML'
    });
  } finally {
    userLocksText[userId] = false;
  }
});

// Enhanced Pinterest search
bot.onText(/^(\/(pin|pinterest))/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let input = msg.text.split(' ').slice(1).join(' ');
  let userId = msg.from.id.toString();
  
  if (userLocksImage[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>Pinterest search in progress</b>\n\n` +
      `📌 <i>Please wait for your current search to complete...</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  if (!input) {
    return bot.sendMessage(msg.chat.id, 
      `📌 <b>Pinterest Image Search</b>\n\n` +
      `🔍 <b>Find amazing images!</b>\n\n` +
      `<i>Examples:</i>\n` +
      `• <code>/pin beautiful landscape</code>\n` +
      `• <code>/pin modern kitchen design</code>\n` +
      `• <code>/pin cute animals</code>\n\n` +
      `💡 <i>Search for any topic and get stunning Pinterest images!</i>`, 
      { parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: '🎨 Search Ideas', callback_data: 'pinterest_ideas' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        })
      }
    );
  }

  userLocksImage[userId] = true;
  
  let pinMsg = await bot.sendMessage(msg.chat.id, 
    `📌 <b>Pinterest Search</b>\n\n` +
    `🔍 <i>Searching Pinterest for:</i>\n` +
    `<code>${input}</code>\n\n` +
    `🎨 <i>Finding the best images...</i>`, 
    { parse_mode: 'HTML' }
  );

  try {
    await bot.sendMessage(String(process.env.DEV_ID), 
      `📌 <b>Pinterest Search Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔍 <b>Search:</b> ${input}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, pinMsg.message_id);
    await pinSearch(bot, msg.chat.id, input, msg.chat.username);
    
  } catch (error) {
    await bot.editMessageText(BotUI.getErrorMessage('Pinterest Search', 'Search failed', [
      'Try different search terms',
      'Use more specific keywords',
      'Check spelling and try again'
    ]), {
      chat_id: msg.chat.id,
      message_id: pinMsg.message_id,
      parse_mode: 'HTML'
    });
  } finally {
    userLocksImage[userId] = false;
  }
});

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
    
    // Log usage
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🎪 <b>TikTok Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
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
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🐦 <b>Twitter Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
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
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `📷 <b>Instagram Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
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

// Enhanced Pinterest handler
bot.onText(/(https?:\/\/)?(www\.)?(pinterest\.ca|pinterest\.?com|pin\.?it)\/.+/, async (msg) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
      `📌 <i>Please wait for your current Pinterest download to complete...</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Pinterest', 'download', 30), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `📌 <b>Pinterest Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${msg.text.substring(0, 100)}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await pinterest(bot, msg.chat.id, msg.text, msg.chat.username);
    
  } catch (error) {
    console.error('Pinterest handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Pinterest', 'Download failed', [
      'Check if the Pinterest link is valid',
      'Try a different Pinterest URL',
      'Ensure the pin is accessible'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced Spotify Track handler
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/track\/.+/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return bot.sendMessage(msg.chat.id, 
      `${BotUI.WARNING_EMOJI} <b>Download in progress</b>\n\n` +
      `🎵 <i>Please wait for your current Spotify download to complete...</i>`, 
      { parse_mode: 'HTML' }
    );
  }

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Spotify', 'track download', 25), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🎵 <b>Spotify Track Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await getSpotifySong(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('Spotify handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Spotify', 'Download failed', [
      'Check if the Spotify link is valid',
      'Ensure the track is available',
      'Try a different Spotify URL'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced Spotify Albums handler
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/album\/.+/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) return;

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Spotify', 'album download', 20), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🎵 <b>Spotify Album Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await getAlbumsSpotify(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('Spotify album handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Spotify', 'Album download failed', [
      'Check if the Spotify album link is valid',
      'Ensure the album is available',
      'Try individual tracks instead'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced Spotify Playlist handler
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/playlist\/.+/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) return;

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Spotify', 'playlist download', 15), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🎵 <b>Spotify Playlist Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await getPlaylistSpotify(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('Spotify playlist handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Spotify', 'Playlist download failed', [
      'Check if the Spotify playlist link is valid',
      'Ensure the playlist is public',
      'Large playlists may take longer'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced YouTube handler
bot.onText(/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

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
      BotUI.getProgressMessage('YouTube', 'analysis', 15), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🔴 <b>YouTube Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
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

// Enhanced Facebook handler
bot.onText(/^https?:\/\/(www\.)?(m\.)?facebook\.com\/.+/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) return;

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Facebook', 'download', 20), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `📘 <b>Facebook Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await getFacebook(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('Facebook handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Facebook', 'Download failed', [
      'Check if the Facebook link is valid',
      'Ensure the post is public',
      'Try copying the link again'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced Threads handler
bot.onText(/^https?:\/\/(www\.)?threads\.net\/.+/, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) return;

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('Threads', 'download', 25), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🧵 <b>Threads Download Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await threadsDownload(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('Threads handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('Threads', 'Download failed', [
      'Check if the Threads link is valid',
      'Ensure the post is public',
      'Try copying the link again'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

// Enhanced GitHub handler
bot.onText(/(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i, async (msg, match) => {
  let getban = await getBanned(msg.chat.id);
  if (!getban.status) return;

  let userId = msg.from.id.toString();
  if (userLocks[userId]) return;

  userLocks[userId] = true;
  
  try {
    let progressMsg = await bot.sendMessage(msg.chat.id, 
      BotUI.getProgressMessage('GitHub', 'repository clone', 15), 
      { parse_mode: 'HTML' }
    );
    
    await bot.sendMessage(String(process.env.DEV_ID), 
      `🐙 <b>GitHub Clone Log</b>\n\n` +
      `👤 <b>User:</b> ${msg.from.first_name || 'N/A'}\n` +
      `🔗 <b>URL:</b> ${match[0]}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`, 
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

    await bot.deleteMessage(msg.chat.id, progressMsg.message_id);
    await gitClone(bot, msg.chat.id, match[0], msg.chat.username);
    
  } catch (error) {
    console.error('GitHub handler error:', error);
    await bot.sendMessage(msg.chat.id, BotUI.getErrorMessage('GitHub', 'Repository clone failed', [
      'Check if the GitHub link is valid',
      'Ensure the repository is public',
      'Large repositories may take longer'
    ]), { parse_mode: 'HTML' });
  } finally {
    userLocks[userId] = false;
  }
});

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

    } else if (data.startsWith('menu_help')) {
      await bot.editMessageText(`${BotUI.HELP_EMOJI} <b>Help & Support Center</b>\n\nChoose a category to get detailed help information.`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: JSON.stringify(BotUI.getHelpKeyboard()),
        parse_mode: 'HTML'
      });

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

    } else if (data.startsWith('twh')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Twitter HD...</b>\n\n` +
        `🎬 <i>Processing high-definition video...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await downloadTwitterHigh(bot, chatId, username);

    } else if (data.startsWith('twl')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Twitter SD...</b>\n\n` +
        `📱 <i>Processing standard-definition video...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await downloadTwitterLow(bot, chatId, username);

    } else if (data.startsWith('twa')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Twitter Audio...</b>\n\n` +
        `🎵 <i>Extracting audio from Twitter video...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await downloadTwitterAudio(bot, chatId, username);

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

    } else if (data.startsWith('spt')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Spotify Track...</b>\n\n` +
        `🎵 <i>Processing Spotify song...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await getSpotifySong(bot, chatId, url, username);

    } else if (data.startsWith('fbn')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Facebook Normal...</b>\n\n` +
        `📱 <i>Processing standard quality...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await getFacebookNormal(bot, chatId, username);

    } else if (data.startsWith('fbh')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Facebook HD...</b>\n\n` +
        `🎬 <i>Processing high-definition video...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await getFacebookHD(bot, chatId, username);

    } else if (data.startsWith('fba')) {
      await bot.editMessageText(
        `${BotUI.LOADING_EMOJI} <b>Downloading Facebook Audio...</b>\n\n` +
        `🎵 <i>Extracting audio from Facebook video...</i>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      await getFacebookAudio(bot, chatId, username);

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

process.on('uncaughtException', console.error)