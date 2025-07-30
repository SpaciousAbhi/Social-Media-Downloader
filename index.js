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

// Continue with other URL handlers and callbacks...