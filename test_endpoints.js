const axios = require('axios');

async function testCobalt(url) {
  const instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.kwiatekmateusz.tech',
    'https://co.wuk.sh',
    'https://anidiots.guide/api/cobalt'
  ];

  for (const api of instances) {
    try {
      console.log(`Testing ${api}...`);
      const res = await axios.post(`${api}/api/json`, {
        url: url
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      console.log(`Success on ${api}:`, res.data.url ? 'Got URL!' : res.data);
      return api;
    } catch (err) {
      console.log(`${api} failed:`, err.message || err.response?.status);
    }
  }
}

testCobalt('https://www.instagram.com/reel/DU903q-Dx6W');
