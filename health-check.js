require('dotenv').config({ path: './env' });
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting bot health check...');

// Check environment variables
const token = process.env.TOKEN;
const devId = process.env.DEV_ID;

console.log('📋 Environment Check:');
console.log('- TOKEN:', token ? '✅ Found' : '❌ Missing');
console.log('- DEV_ID:', devId ? '✅ Found' : '❌ Missing');
console.log('- PORT:', PORT);

if (!token) {
  console.error('❌ FATAL: No bot token found!');
  process.exit(1);
}

// Test bot token
console.log('🤖 Testing bot token...');
const bot = new TelegramBot(token);

bot.getMe().then(info => {
  console.log('✅ Bot token is valid!');
  console.log('🤖 Bot Info:', {
    name: info.first_name,
    username: info.username,
    id: info.id
  });
  
  // Start Express server for Heroku
  app.get('/', (req, res) => {
    res.json({
      status: 'active',
      bot: {
        name: info.first_name,
        username: info.username,
        id: info.id
      },
      timestamp: new Date().toISOString()
    });
  });
  
  app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log('✅ Bot is ready for deployment!');
  });
  
}).catch(err => {
  console.error('❌ Bot token validation failed:', err.message);
  process.exit(1);
});