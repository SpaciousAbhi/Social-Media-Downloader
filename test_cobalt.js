const axios = require('axios');

async function testCobalt(url) {
  try {
    const res = await axios.post('https://api.cobalt.tools/api/json', {
      url: url
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) console.log(err.response.status, err.response.data);
    else console.log(err.message);
  }
}

testCobalt('https://www.youtube.com/watch?v=YMhC4FtqFHw');
testCobalt('https://www.instagram.com/reel/DU903q-Dx6W');
