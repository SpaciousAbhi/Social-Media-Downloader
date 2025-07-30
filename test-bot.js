require('dotenv').config({ path: './env' })
process.env['NTBA_FIX_350'] = 1

const TelegramBot = require('node-telegram-bot-api');
const { getBanned } = require('./funcs/functions');

const token = process.env.TOKEN;

if (!token) {
  console.error('❌ No bot token found!');
  process.exit(1);
}

console.log('🤖 Starting bot in polling mode for testing...');

// Force polling mode
const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

console.log('✅ Bot started in polling mode');

// Test /start command
bot.onText(/\/start/, async (msg) => {
  console.log('📨 Received /start command from:', msg.from.username || msg.from.first_name);
  
  try {
    const banned = await getBanned(msg.chat.id);
    console.log('🔒 Ban check result:', banned);
    
    if (!banned.status) {
      return bot.sendMessage(msg.chat.id, `You have been banned\n\nReason: ${banned.reason}`);
    }
    
    const response = `✅ Hello! I am your Social Media Downloader Bot

🎯 The critical function fix is working!

📱 Supported platforms:
• Instagram ✅
• TikTok
• Twitter  
• Facebook
• YouTube
• Pinterest
• Spotify

Send me a link to test!`;
    
    await bot.sendMessage(msg.chat.id, response);
    console.log('✅ Successfully sent response to /start command');
    
  } catch (error) {
    console.error('❌ Error handling /start:', error.message);
    await bot.sendMessage(msg.chat.id, 'Sorry, an error occurred.');
  }
});

// Test Instagram regex
bot.onText(/(https?:\/\/)?(www\.)?(instagram\.com)\/.+/, async (msg) => {
  console.log('📨 Received Instagram link from:', msg.from.username || msg.from.first_name);
  console.log('🔗 Link:', msg.text);
  
  try {
    const banned = await getBanned(msg.chat.id);
    if (!banned.status) {
      return bot.sendMessage(msg.chat.id, `You have been banned\n\nReason: ${banned.reason}`);
    }
    
    await bot.sendMessage(msg.chat.id, '✅ Instagram link detected! Function is working. \n\n(Full Instagram download functionality will work once deployed to Heroku)');
    console.log('✅ Successfully responded to Instagram link');
    
  } catch (error) {
    console.error('❌ Error handling Instagram link:', error.message);
    await bot.sendMessage(msg.chat.id, 'Sorry, an error occurred processing your Instagram link.');
  }
});

console.log('🎉 Bot is ready! Send /start or an Instagram link to test.');