// Enhanced AI handler with improved UI/UX
require('dotenv').config();
const axios = require('axios');
const BotUI = require('./ui-helpers');

async function getAiResponseEnhanced(bot, chatId, input, userName) {
  if (!input) {
    return bot.sendMessage(chatId, BotUI.getAIIntroMessage(), { parse_mode: 'HTML' });
  }

  // Show enhanced typing indicator
  await bot.sendChatAction(chatId, 'typing');
  
  let thinkingMsg = await bot.sendMessage(chatId, 
    `${BotUI.AI_EMOJI} <b>AI Assistant Thinking...</b>\n\n` +
    `🧠 <i>Processing your question...</i>\n` +
    `💭 <b>Query:</b> <code>${input.substring(0, 150)}${input.length > 150 ? '...' : ''}</code>\n\n` +
    `⏳ <i>Generating intelligent response...</i>`, 
    { parse_mode: 'HTML' }
  );

  try {
    // Show typing every few seconds for longer processing
    let typingInterval = setInterval(() => {
      bot.sendChatAction(chatId, 'typing');
    }, 3000);

    let { data } = await axios('https://onlinegpt.org/wp-json/mwai-ui/v1/chats/submit', {
      method: "post",
      data: {
        botId: "default",
        newMessage: input,
        stream: false
      },
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json"
      }
    });

    clearInterval(typingInterval);

    if (data.success) {
      // Delete thinking message
      await bot.deleteMessage(chatId, thinkingMsg.message_id);
      
      // Format AI response with enhanced styling
      let response = `${BotUI.AI_EMOJI} <b>AI Assistant Response</b>\n\n` +
                    `${data.reply.trim()}\n\n` +
                    `─────────────────────\n` +
                    `💡 <i>Ask another question with /ai</i>\n` +
                    `🤖 <i>Powered by ${BotUI.BOT_NAME}</i>`;

      // Split long responses
      if (response.length > 4000) {
        let parts = splitMessage(response, 4000);
        for (let i = 0; i < parts.length; i++) {
          await bot.sendMessage(chatId, parts[i], { 
            parse_mode: 'HTML',
            reply_markup: i === parts.length - 1 ? JSON.stringify({
              inline_keyboard: [
                [
                  { text: '🤖 Ask Another Question', callback_data: 'ai_prompt' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }) : null
          });
        }
      } else {
        await bot.sendMessage(chatId, response, { 
          parse_mode: 'HTML',
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: '🤖 Ask Another Question', callback_data: 'ai_prompt' },
                { text: '🏠 Main Menu', callback_data: 'main_menu' }
              ]
            ]
          })
        });
      }

    } else {
      clearInterval(typingInterval);
      await bot.editMessageText(BotUI.getErrorMessage('AI Assistant', 'Failed to generate response', [
        'Try rephrasing your question',
        'Make your question more specific',
        'Check your internet connection',
        'Try again in a few moments'
      ]), {
        chat_id: chatId,
        message_id: thinkingMsg.message_id,
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: '🔄 Try Again', callback_data: 'ai_prompt' },
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        })
      });
    }

  } catch (err) {
    console.error('AI response error:', err);
    
    try {
      await bot.editMessageText(BotUI.getErrorMessage('AI Assistant', 'Service temporarily unavailable', [
        'The AI service might be busy',
        'Try again in a few minutes',
        'Check your question for inappropriate content',
        'Contact @Krxuvv if issue persists'
      ]), {
        chat_id: chatId,
        message_id: thinkingMsg.message_id,
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: '🔄 Try Again', callback_data: 'ai_prompt' },
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        })
      });
    } catch (editError) {
      // If editing fails, send new message
      await bot.sendMessage(chatId, BotUI.getErrorMessage('AI Assistant', 'Service error', [
        'Please try again later',
        'Contact support if needed'
      ]), { parse_mode: 'HTML' });
    }

    // Enhanced error reporting to developer
    await bot.sendMessage(String(process.env.DEV_ID), 
      `${BotUI.ERROR_EMOJI} <b>AI Service Error Report</b>\n\n` +
      `👤 <b>User:</b> @${userName || 'unknown'}\n` +
      `🆔 <b>Chat ID:</b> ${chatId}\n` +
      `❓ <b>Input:</b> ${input.substring(0, 200)}\n` +
      `❌ <b>Error:</b> ${err.message}\n` +
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}\n` +
      `📊 <b>Stack:</b> ${err.stack?.substring(0, 500) || 'N/A'}`, 
      { parse_mode: 'HTML' }
    );
  }
}

// Helper function to split long messages
function splitMessage(text, maxLength) {
  let parts = [];
  let current = '';
  let words = text.split(' ');
  
  for (let word of words) {
    if ((current + word + ' ').length > maxLength) {
      if (current) {
        parts.push(current.trim());
        current = word + ' ';
      } else {
        // Word itself is too long, split it
        parts.push(word.substring(0, maxLength));
        current = word.substring(maxLength) + ' ';
      }
    } else {
      current += word + ' ';
    }
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

// Enhanced AI conversation starters
function getAIPrompts() {
  return {
    inline_keyboard: [
      [
        { text: '🧠 General Knowledge', callback_data: 'ai_general' },
        { text: '📚 Study Help', callback_data: 'ai_study' }
      ],
      [
        { text: '💻 Tech Questions', callback_data: 'ai_tech' },
        { text: '🎨 Creative Writing', callback_data: 'ai_creative' }
      ],
      [
        { text: '🔍 Explain This', callback_data: 'ai_explain' },
        { text: '💡 Fun Facts', callback_data: 'ai_facts' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };
}

module.exports = {
  getAiResponseEnhanced,
  getAIPrompts
};