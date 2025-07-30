#!/bin/bash

echo "🚀 Telegram Bot - Heroku Deployment Setup"
echo "=========================================="
echo ""

# Check if HEROKU_URL is set
HEROKU_URL=$(grep "HEROKU_URL=" env | cut -d'=' -f2)

if [[ "$HEROKU_URL" == *"your-app-name"* ]]; then
    echo "⚠️  Please update HEROKU_URL in the 'env' file first!"
    echo "   Current: $HEROKU_URL"
    echo "   Example: https://my-telegram-bot.herokuapp.com"
    echo ""
    echo "1. Edit the 'env' file"
    echo "2. Replace 'your-app-name' with your actual Heroku app name"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Configuration Check:"
echo "   TOKEN: $(grep "TOKEN=" env | cut -d'=' -f2 | cut -c1-20)..."
echo "   DEV_ID: $(grep "DEV_ID=" env | cut -d'=' -f2)"
echo "   NODE_ENV: $(grep "NODE_ENV=" env | cut -d'=' -f2)"
echo "   HEROKU_URL: $HEROKU_URL"
echo ""

echo "✅ Testing bot token..."
node -e "
require('dotenv').config({ path: './env' });
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TOKEN);
bot.getMe().then(info => {
  console.log('✅ Bot token valid:', info.first_name, '(@' + info.username + ')');
  process.exit(0);
}).catch(err => {
  console.log('❌ Bot token invalid:', err.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Ready for Heroku deployment!"
    echo ""
    echo "Deployment commands:"
    echo "1. git add ."
    echo "2. git commit -m 'Update bot configuration'"
    echo "3. git push heroku main"
    echo ""
    echo "No Heroku environment variables needed - everything is in the repository!"
else
    echo ""
    echo "❌ Please fix the bot token issue before deploying."
fi