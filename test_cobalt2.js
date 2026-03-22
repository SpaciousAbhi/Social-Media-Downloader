const axios = require('axios');

async function testCobalt(url) {
  try {
    const res = await axios.post('https://api.cobalt.tools/api/json', {
      url: url
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log("Success with api.cobalt.tools:", res.data);
  } catch (err) {
    try {
      const res = await axios.post('https://co.wuk.sh/api/json', {
        url: url
      }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
      });
      console.log("Success with co.wuk.sh:", res.data);
    } catch (e2) {
      console.error("Both Failed.", e2.message);
    }
  }
}

testCobalt('https://www.instagram.com/reel/DU903q-Dx6W');
