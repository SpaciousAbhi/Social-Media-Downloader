const axios = require('axios');

async function testIG(url) {
  const endpoints = [
    `https://api.vkrdownloader.com/server?vkr=${encodeURIComponent(url)}`,
    `https://apis.davidcyriltech.my.id/download/igdl?url=${encodeURIComponent(url)}`,
    `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`,
    `https://bk9.fun/download/instagram?url=${encodeURIComponent(url)}`
  ];

  for (let api of endpoints) {
    try {
      console.log('Testing', api);
      const res = await axios.get(api, { timeout: 5000 });
      console.log('Success:', res.data ? Object.keys(res.data) : 'No data');
      if (res.data) return;
    } catch (e) {
      console.error('Failed:', e.message);
    }
  }
}
testIG('https://www.instagram.com/reel/DU903q-Dx6W/');
