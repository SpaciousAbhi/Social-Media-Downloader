# Telegram Bot Deployment Guide

## ✅ Issues Fixed

### 1. Missing Environment Variables
- **Problem**: Bot couldn't find TOKEN environment variable
- **Solution**: Created visible `env` file with proper TOKEN and DEV_ID

### 2. Port Binding Issue  
- **Problem**: Hardcoded port 5000 caused Heroku R10 timeout errors
- **Solution**: Updated to use `process.env.PORT || 5000` for dynamic port binding

### 3. Polling Conflicts
- **Problem**: 409 Conflict errors due to multiple bot instances
- **Solution**: Added intelligent retry logic and webhook support for production

## 🚀 Deployment Instructions

### For Heroku Deployment:

1. **The environment variables are in the visible `env` file** in the repository
2. **Update HEROKU_URL** in the `env` file with your actual Heroku app URL
3. **Set NODE_ENV=production** in the `env` file for production
4. **Deploy**: The bot will automatically use webhook mode for production

### For Local Development:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Bot**:
   ```bash
   npm start
   ```

## 🔧 Configuration

**Environment variables are stored in the visible `env` file:**
- **Token**: `7798265687:AAFvdltAgNn16bu-12obdqIJdws-bRvMwhM`
- **Admin ID**: `1654334233`
- **Bot Name**: Instagram Automation Bot (@VS_Instagram_Automation_Bot)

## 📱 Bot Features

This bot supports downloading from:
- TikTok
- Instagram  
- Twitter
- Facebook
- Pinterest
- Spotify
- YouTube
- GitHub repositories
- Meta Threads

Additional features:
- AI chat (`/ai`)
- Google search (`/google`)
- Brainly answers (`/brainly`)
- Pinterest search (`/pin`)
- OCR from images
- Image upload to Telegraph/Pomf2

## 🛠️ Troubleshooting

### 409 Conflict Errors
- This happens when Telegram thinks another bot instance is running
- The bot will automatically retry with backoff
- Wait 2-5 minutes for Telegram servers to clear the connection
- For immediate resolution, restart the Heroku dyno

### Port Issues
- Heroku automatically assigns ports - don't hardcode them
- Local development uses port 5000 by default
- Use `PORT=3000 npm start` to specify a different local port

## ✅ Health Check

Run the health check script to verify configuration:
```bash
node health-check.js
```

This will verify:
- Environment variables are set (from visible `env` file)
- Bot token is valid
- Server can start properly

## 🌐 Production Mode

The bot automatically detects production environment and switches to webhook mode for better reliability and compliance with Heroku's requirements.

**Local Mode**: Uses polling (good for development)
**Production Mode**: Uses webhooks (required for Heroku)

## 📁 Environment Variables

All environment variables are now stored in the **visible `env` file** in the repository root, making them easy to see and modify without dealing with hidden files.