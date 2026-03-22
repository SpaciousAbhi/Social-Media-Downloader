const { igdl, ytmp4 } = require('api-dylux');

async function test(url) {
  try {
    const res = await igdl(url);
    console.log('IGDL Success:', res);
  } catch (err) {
    console.error('IGDL Failed:', err.message);
  }
}
test('https://www.instagram.com/reel/DU903q-Dx6W');
