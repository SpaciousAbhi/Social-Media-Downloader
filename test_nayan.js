const nayan = require('nayan-media-downloader');
const btch = require('btch-downloader');

async function test(url) {
  try {
    const res = await nayan.ndown(url);
    console.log('Nayan Success:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Nayan Failed:', err.message);
  }

  try {
    const res2 = await btch.igdl(url);
    console.log('Btch Success:', JSON.stringify(res2, null, 2));
  } catch (err) {
    console.error('Btch Failed:', err.message);
  }
}

test('https://www.instagram.com/reel/DU903q-Dx6W');
