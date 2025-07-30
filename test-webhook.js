require('dotenv').config({ path: './env' });
const axios = require('axios');

async function testBotWebhook() {
  const token = process.env.TOKEN;
  
  try {
    // Test bot info
    console.log('🤖 Testing bot connection...');
    const botInfo = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    console.log('✅ Bot Info:', botInfo.data.result);
    
    // Test webhook info
    console.log('🌐 Testing webhook info...');
    const webhookInfo = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    console.log('✅ Webhook Info:', webhookInfo.data.result);
    
    console.log('🎉 Bot is properly connected to Telegram!');
    
  } catch (error) {
    console.error('❌ Error testing bot connection:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBotWebhook();