const axios = require('axios');

async function testIG() {
  try {
    const res = await axios.get('https://api.siputzx.my.id/api/d/igdl?url=https://www.instagram.com/reel/DU903q-Dx6W');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
  }
}
testIG();
