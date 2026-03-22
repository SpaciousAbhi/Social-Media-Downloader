const axios = require('axios');

async function testVKR(url) {
  try {
    const res = await axios.get('https://vkrdownloader.vercel.app/server?vkr=' + encodeURIComponent(url));
    console.log('VKR:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('VKR Failed:', err.message);
  }
}
testVKR('https://www.instagram.com/reel/DU903q-Dx6W');
