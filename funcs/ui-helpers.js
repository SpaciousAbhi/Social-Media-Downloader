// UI/UX Helper Functions for Enhanced Telegram Bot Experience
const axios = require('axios');

/**
 * Enhanced message formatting with emojis and rich typography
 */
class BotUI {
  
  // Brand elements
  static BOT_NAME = "🎬 Krxuv Media Bot";
  static BOT_EMOJI = "🚀";
  static SUCCESS_EMOJI = "✅";
  static ERROR_EMOJI = "❌";
  static LOADING_EMOJI = "⏳";
  static DOWNLOAD_EMOJI = "📥";
  static MUSIC_EMOJI = "🎵";
  static VIDEO_EMOJI = "🎬";
  static PHOTO_EMOJI = "📸";
  static AI_EMOJI = "🤖";
  static SEARCH_EMOJI = "🔍";
  static HELP_EMOJI = "❓";
  static FEATURE_EMOJI = "⭐";
  static WARNING_EMOJI = "⚠️";
  static INFO_EMOJI = "ℹ️";

  /**
   * Create enhanced welcome message with rich formatting
   */
  static getWelcomeMessage() {
    return `🎉 <b>Welcome to ${this.BOT_NAME}!</b> 🎉

🌟 <b>Your Ultimate Social Media Downloader</b>

<i>Download content from all major platforms with style!</i>

🎯 <b>Supported Platforms:</b>
${this.VIDEO_EMOJI} <b>YouTube</b> - Videos & Audio
${this.MUSIC_EMOJI} <b>Spotify</b> - Songs & Playlists  
🎪 <b>TikTok</b> - Videos & Sounds
🐦 <b>Twitter</b> - Videos & Media
📷 <b>Instagram</b> - Posts & Stories
📘 <b>Facebook</b> - Videos & Media
📌 <b>Pinterest</b> - Images & Videos
🐙 <b>GitHub</b> - Repository Cloning

🔥 <b>Special Features:</b>
${this.AI_EMOJI} <b>AI Chat</b> - Ask anything with /ai
${this.SEARCH_EMOJI} <b>Google Search</b> - Quick search with /google
🧠 <b>Brainly</b> - Get answers with /brainly
📌 <b>Pinterest Search</b> - Find images with /pin
${this.PHOTO_EMOJI} <b>Image Tools</b> - OCR, Upload to URL

💡 <b>Quick Start:</b>
• Send any social media link to download
• Use commands for special features
• Send images for processing options

<i>Bot crafted with ❤️ by @Krxuvv</i>

Type /help for detailed guidance! ${this.HELP_EMOJI}`;
  }

  /**
   * Create enhanced help menu with categories
   */
  static getHelpKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: `${this.VIDEO_EMOJI} Downloaders`, callback_data: 'help_downloaders' },
          { text: `${this.AI_EMOJI} AI Features`, callback_data: 'help_ai' }
        ],
        [
          { text: `${this.PHOTO_EMOJI} Image Tools`, callback_data: 'help_images' },
          { text: `${this.SEARCH_EMOJI} Search Tools`, callback_data: 'help_search' }
        ],
        [
          { text: `${this.INFO_EMOJI} How to Use`, callback_data: 'help_usage' },
          { text: `🔧 Troubleshooting`, callback_data: 'help_troubleshoot' }
        ],
        [
          { text: `🏠 Back to Menu`, callback_data: 'main_menu' }
        ]
      ]
    };
  }

  /**
   * Create main menu keyboard
   */
  static getMainMenuKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: `${this.DOWNLOAD_EMOJI} Download Media`, callback_data: 'menu_download' },
          { text: `${this.AI_EMOJI} AI Assistant`, callback_data: 'menu_ai' }
        ],
        [
          { text: `${this.SEARCH_EMOJI} Search Tools`, callback_data: 'menu_search' },
          { text: `${this.PHOTO_EMOJI} Image Tools`, callback_data: 'menu_images' }
        ],
        [
          { text: `${this.HELP_EMOJI} Help & Support`, callback_data: 'menu_help' },
          { text: `📊 Bot Stats`, callback_data: 'menu_stats' }
        ]
      ]
    };
  }

  /**
   * Enhanced progress message with visual indicators
   */
  static getProgressMessage(platform, action, progress = 0) {
    const progressBar = this.createProgressBar(progress);
    const platformEmoji = this.getPlatformEmoji(platform);
    
    return `${this.LOADING_EMOJI} <b>Processing ${platform} ${action}...</b>

${progressBar} <i>${progress}%</i>

${platformEmoji} <i>Please wait while we fetch your content...</i>

<code>Powered by ${this.BOT_NAME}</code>`;
  }

  /**
   * Create visual progress bar
   */
  static createProgressBar(progress) {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Get platform-specific emoji
   */
  static getPlatformEmoji(platform) {
    const emojis = {
      'youtube': '🔴',
      'tiktok': '🎪',
      'instagram': '📷',
      'twitter': '🐦',
      'facebook': '📘',
      'pinterest': '📌',
      'spotify': '🎵',
      'github': '🐙'
    };
    return emojis[platform.toLowerCase()] || this.VIDEO_EMOJI;
  }

  /**
   * Enhanced error message with suggestions
   */
  static getErrorMessage(platform, error, suggestions = []) {
    const platformEmoji = this.getPlatformEmoji(platform);
    let message = `${this.ERROR_EMOJI} <b>Download Failed</b>

${platformEmoji} <b>Platform:</b> ${platform}
${this.WARNING_EMOJI} <b>Issue:</b> ${error}

`;

    if (suggestions.length > 0) {
      message += `💡 <b>Suggestions:</b>\n`;
      suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    message += `\n${this.INFO_EMOJI} <i>Need help? Use /help or contact @Krxuvv</i>`;
    
    return message;
  }

  /**
   * Enhanced success message
   */
  static getSuccessMessage(platform, contentType, title) {
    const platformEmoji = this.getPlatformEmoji(platform);
    const typeEmoji = contentType === 'video' ? this.VIDEO_EMOJI : 
                     contentType === 'audio' ? this.MUSIC_EMOJI : this.PHOTO_EMOJI;
    
    return `${this.SUCCESS_EMOJI} <b>Download Complete!</b>

${platformEmoji} <b>Platform:</b> ${platform}
${typeEmoji} <b>Type:</b> ${contentType}
📝 <b>Title:</b> <i>${title}</i>

<i>Downloaded successfully by ${this.BOT_NAME}</i> ✨

🔄 Send another link to download more!`;
  }

  /**
   * Enhanced download options keyboard
   */
  static getDownloadOptionsKeyboard(platform, options) {
    const keyboard = [];
    
    options.forEach(option => {
      keyboard.push([{
        text: `${option.emoji} ${option.label} ${option.size ? `(${option.size})` : ''}`,
        callback_data: option.callback
      }]);
    });

    keyboard.push([
      { text: `🔙 Back`, callback_data: 'back' },
      { text: `🏠 Main Menu`, callback_data: 'main_menu' }
    ]);

    return { inline_keyboard: keyboard };
  }

  /**
   * File size warning message
   */
  static getFileSizeWarning(size, limit = 50) {
    return `${this.WARNING_EMOJI} <b>File Size Alert</b>

📊 <b>File Size:</b> ${size} MB
⚡ <b>Telegram Limit:</b> ${limit} MB

${this.INFO_EMOJI} <b>Options:</b>
• Use the direct download link below
• Try a different quality option
• Contact @Krxuvv for large file handling

💡 <i>We're working on cloud storage integration!</i>`;
  }

  /**
   * Platform-specific download keyboard
   */
  static getPlatformKeyboard(platform, data) {
    switch(platform.toLowerCase()) {
      case 'youtube':
        return this.getYouTubeKeyboard(data);
      case 'tiktok':
        return this.getTikTokKeyboard(data);
      case 'instagram':
        return this.getInstagramKeyboard(data);
      default:
        return this.getGenericKeyboard(data);
    }
  }

  /**
   * YouTube-specific keyboard
   */
  static getYouTubeKeyboard(data) {
    const keyboard = [];
    
    // Video options
    if (data.videoOptions) {
      keyboard.push([{ text: `🎬 Video Options`, callback_data: 'section_video' }]);
      data.videoOptions.forEach(option => {
        keyboard.push([{
          text: `${this.VIDEO_EMOJI} ${option.quality} ${option.size ? `(${option.size})` : ''}`,
          callback_data: `ytv ${data.videoId} ${option.id}`
        }]);
      });
    }

    // Audio options
    if (data.audioOptions) {
      keyboard.push([{ text: `🎵 Audio Options`, callback_data: 'section_audio' }]);
      data.audioOptions.forEach(option => {
        keyboard.push([{
          text: `${this.MUSIC_EMOJI} ${option.quality} ${option.size ? `(${option.size})` : ''}`,
          callback_data: `yta ${data.videoId} ${option.id}`
        }]);
      });
    }

    return { inline_keyboard: keyboard };
  }

  /**
   * TikTok-specific keyboard
   */
  static getTikTokKeyboard(data) {
    return {
      inline_keyboard: [
        [
          { text: `${this.VIDEO_EMOJI} Download Video`, callback_data: `ttv ${data.shorturl}` }
        ],
        [
          { text: `${this.MUSIC_EMOJI} Extract Audio`, callback_data: `tta ${data.shorturl}` }
        ],
        [
          { text: `🎶 Original Sound`, callback_data: `tts ${data.shorturl}` }
        ],
        [
          { text: `🔙 Back`, callback_data: 'back' },
          { text: `🏠 Menu`, callback_data: 'main_menu' }
        ]
      ]
    };
  }

  /**
   * Generic platform keyboard
   */
  static getGenericKeyboard(data) {
    return {
      inline_keyboard: [
        [
          { text: `${this.DOWNLOAD_EMOJI} Download`, callback_data: data.callback }
        ],
        [
          { text: `🔙 Back`, callback_data: 'back' },
          { text: `🏠 Menu`, callback_data: 'main_menu' }
        ]
      ]
    };
  }

  /**
   * AI assistant introduction
   */
  static getAIIntroMessage() {
    return `${this.AI_EMOJI} <b>AI Assistant Ready!</b>

🧠 <b>What can I help you with?</b>

<i>Examples:</i>
• Explain complex topics
• Help with homework
• Creative writing
• General questions
• Tech support

💡 <b>Usage:</b> <code>/ai your question here</code>

<i>Powered by advanced AI technology!</i> ✨`;
  }

  /**
   * Search tools introduction
   */
  static getSearchIntroMessage() {
    return `${this.SEARCH_EMOJI} <b>Search Tools Available!</b>

🌐 <b>Google Search</b>
• <code>/google your search query</code>
• Get quick web results

📌 <b>Pinterest Search</b>
• <code>/pin search term</code>
• Find amazing images

🧠 <b>Brainly Search</b>
• <code>/brainly your question</code>
• Get educational answers

<i>Find anything, anywhere, anytime!</i> 🚀`;
  }

  /**
   * Image tools introduction
   */
  static getImageToolsMessage() {
    return `${this.PHOTO_EMOJI} <b>Image Processing Tools!</b>

📤 <b>Just send any image and choose:</b>

🔍 <b>OCR (Text Extraction)</b>
• Extract text from images
• Support multiple languages

🔗 <b>Telegraph Upload</b>
• Get permanent image links
• Fast and reliable

☁️ <b>Pomf2 Upload</b>
• Alternative cloud storage
• High-speed uploads

<i>Send an image to get started!</i> ✨`;
  }
}

module.exports = BotUI;