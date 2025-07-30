require('dotenv').config({ path: './env' });
const axios = require('axios');

async function clearWebhook() {
  const token = process.env.TOKEN;
  
  try {
    console.log('🧹 Clearing webhook...');
    const response = await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`);
    console.log('✅ Webhook cleared:', response.data);
    
    // Verify it's cleared
    const webhookInfo = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    console.log('📋 Current webhook info:', webhookInfo.data.result);
    
  } catch (error) {
    console.error('❌ Error clearing webhook:', error.message);
  }
}

clearWebhook();