// Progress Tracking System for Downloads
const BotUI = require('./ui-helpers');

class ProgressTracker {
  constructor(bot, chatId, messageId) {
    this.bot = bot;
    this.chatId = chatId;
    this.messageId = messageId;
    this.progress = 0;
    this.platform = '';
    this.action = '';
    this.isActive = false;
  }

  /**
   * Start progress tracking
   */
  async start(platform, action) {
    this.platform = platform;
    this.action = action;
    this.isActive = true;
    this.progress = 0;

    try {
      await this.updateProgress(10, 'Initializing...');
      return this;
    } catch (error) {
      console.error('Failed to start progress tracker:', error);
      return this;
    }
  }

  /**
   * Update progress with message
   */
  async updateProgress(progress, status = '') {
    if (!this.isActive) return;

    this.progress = Math.min(progress, 100);
    
    const progressBar = this.createProgressBar(this.progress);
    const platformEmoji = BotUI.getPlatformEmoji(this.platform);
    
    const message = `${BotUI.LOADING_EMOJI} <b>Processing ${this.platform} ${this.action}...</b>

${progressBar} <i>${this.progress}%</i>

${platformEmoji} <i>${status || 'Please wait while we process your request...'}</i>

<code>Powered by ${BotUI.BOT_NAME}</code>`;

    try {
      await this.bot.editMessageText(message, {
        chat_id: this.chatId,
        message_id: this.messageId,
        parse_mode: 'HTML'
      });
    } catch (error) {
      // Message might be the same, ignore
      if (!error.message.includes('message is not modified')) {
        console.error('Failed to update progress:', error);
      }
    }
  }

  /**
   * Create visual progress bar
   */
  createProgressBar(progress) {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Complete progress tracking
   */
  async complete(successMessage) {
    this.isActive = false;
    this.progress = 100;

    try {
      await this.bot.editMessageText(successMessage, {
        chat_id: this.chatId,
        message_id: this.messageId,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Failed to complete progress:', error);
    }
  }

  /**
   * Handle error during progress
   */
  async error(errorMessage) {
    this.isActive = false;

    try {
      await this.bot.editMessageText(errorMessage, {
        chat_id: this.chatId,
        message_id: this.messageId,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Failed to show error:', error);
    }
  }

  /**
   * Quick progress updates with predefined stages
   */
  async quickUpdate(stage) {
    const stages = {
      'fetching': { progress: 20, status: 'Fetching content information...' },
      'processing': { progress: 40, status: 'Processing download request...' },
      'downloading': { progress: 60, status: 'Downloading content...' },
      'optimizing': { progress: 80, status: 'Optimizing file for Telegram...' },
      'uploading': { progress: 90, status: 'Uploading to Telegram...' },
      'finalizing': { progress: 95, status: 'Finalizing download...' }
    };

    const stageData = stages[stage];
    if (stageData) {
      await this.updateProgress(stageData.progress, stageData.status);
    }
  }

  /**
   * Simulate realistic progress for unknown durations
   */
  async simulateProgress(duration = 5000) {
    const steps = [
      { progress: 15, status: 'Connecting to source...' },
      { progress: 30, status: 'Analyzing content...' },
      { progress: 45, status: 'Preparing download...' },
      { progress: 60, status: 'Downloading content...' },
      { progress: 75, status: 'Processing file...' },
      { progress: 85, status: 'Optimizing for Telegram...' },
      { progress: 95, status: 'Almost ready...' }
    ];

    const stepDuration = duration / steps.length;

    for (const step of steps) {
      if (!this.isActive) break;
      
      await this.updateProgress(step.progress, step.status);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }
}

module.exports = ProgressTracker;