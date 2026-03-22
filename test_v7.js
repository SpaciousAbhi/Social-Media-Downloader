const axios = require('axios');

async function testCobaltV7(target) {
  try {
    const res = await axios.post('https://api.cobalt.tools/', JSON.stringify({
        url: target
    }), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Cobalt URL:', res.data.url);
  } catch (err) {
    console.error('Cobalt failed:', err.response ? err.response.data : err.message);
  }
}

testCobaltV7('https://www.instagram.com/reel/DU903q-Dx6W');
