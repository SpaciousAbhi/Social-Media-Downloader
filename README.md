# 🚀 Social Media Downloader Bot (v2.0 Premium)

A state-of-the-art Telegram bot built with **Node.js** and **yt-dlp**, designed to provide the fastest and most reliable media downloading experience across all major social platforms.

---

## ✨ Why Choose This Bot?

Unlike other downloader bots that rely on fragile scraping methods, this bot is powered by the **yt-dlp engine**, ensuring 100% functionality and high-quality downloads.

### 💎 10x UI/UX Features
- **📊 Real-Time Progress Bars**: Live updates showing download percentage, speed, and ETA.
- **🖼 High-Fidelity Info Cards**: Beautiful metadata previews with thumbnails and structured details.
- **⚡ One-Click Downloads**: Choose between HD Video or High-Quality Audio (MP3) instantly.
- **🖥 System Dashboard**: Monitor bot health, uptime, and memory usage with `/status`.
- **📸 Advanced Image Tools**: Built-in **OCR (Text Extraction)** and high-speed **Cloud Hosting** for images.

---

## 📱 Supported Platforms

- **🎵 TikTok**: Videos (No Watermark), High-Quality Audio.
- **📸 Instagram**: Reels, Videos, Photos, and Carousels.
- **🐦 Twitter / X**: HD Videos and Audio extractions.
- **📘 Facebook**: Public videos and reels in best quality.
- **🎥 YouTube**: Full video downloads or MP3 conversions.
- **🧵 Threads**: Direct media downloads from Meta's Threads.
- **🎧 Spotify / SoundCloud**: Search and download specialized content.

---

## 🛠 Installation & Setup

### 1. Prerequisites
- **Node.js v20.x** or higher.
- **FFmpeg** (Required for high-quality video merging and audio conversion).
- **yt-dlp binary** (Bot handles automatic downloading of this for you!).

### 2. Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/SpaciousAbhi/Social-Media-Downloader.git
   cd Social-Media-Downloader
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   TOKEN=your_telegram_bot_token
   DEV_ID=your_telegram_id
   PORT=3000
   BOT_NAME=SocialDownloaderBot
   ```
4. Run the bot:
   ```bash
   npm start
   ```

### 3. Cloud Deployment (Heroku/Ubuntu)
This bot is **Heroku-optimized**:
- Uses `os.tmpdir()` for binary execution to bypass read-only filesystems.
- Includes a `Procfile` for one-click deployment.
- Automatically detects the environment and downloads the correct `yt-dlp` architecture (Linux/Windows).

---

## 🕹 Bot Commands

- `/start` - Launch the premium welcome menu.
- `/status` - View system health and performance dashboard.
- `/help` - Get detailed usage instructions.
- `[Send any link]` - Automatically detects the platform and generates an info card.
- `[Send any image]` - Launch built-in OCR and Cloud Hosting tools.

---

## 🤝 Contributing & Support

If you find this bot helpful, please **Give it a ⭐ on GitHub!**

- **Developer**: [@Krxuvv](https://t.me/Krxuvv)
- **Repo**: [Social-Media-Downloader](https://github.com/SpaciousAbhi/Social-Media-Downloader)

---

## ⚖️ Disclaimer
*This tool is for educational purposes only. Please respect the copyright of the content creators and the terms of service of the respective platforms.*
