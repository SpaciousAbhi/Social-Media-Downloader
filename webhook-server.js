require('dotenv').config()
process.env['NTBA_FIX_350'] = 1

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 5000;
const token = process.env.TOKEN;
const url = process.env.HEROKU_URL || `https://your-app-name.herokuapp.com`;

if (!token) {
  console.error('FATAL ERROR: Telegram Bot Token not provided in environment variables!');
  process.exit(1);
}

console.log('🚀 Starting Telegram Bot with Webhook...');

// Create bot instance with webhook
const bot = new TelegramBot(token);

// Set webhook for Heroku deployment
const webhookUrl = `${url}/bot${token}`;

app.use(express.json());

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    mode: 'webhook',
    timestamp: new Date().toISOString()
  });
});

// Set webhook on startup
bot.setWebHook(webhookUrl)
  .then(() => {
    console.log(`✅ Webhook set to: ${webhookUrl}`);
  })
  .catch(err => {
    console.error('❌ Failed to set webhook:', err.message);
    console.log('Falling back to polling mode...');
    
    // Fallback to polling if webhook fails
    bot.startPolling();
  });

// All your existing bot handlers go here...
// Import and use all the handlers from the original index.js

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log('✅ Bot is ready!');
});

module.exports = { bot, app };