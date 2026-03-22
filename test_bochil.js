const { instagramdl, youtubedl, youtubedlv2 } = require('@bochilteam/scraper');

async function test(url, type) {
  try {
    if (type === 'ig') {
      const res = await instagramdl(url);
      console.log('IG Fallback Success:', res.slice(0, 1));
    } else {
      const res = await youtubedlv2(url);
      console.log('YT Fallback Success:', res.title);
    }
  } catch (err) {
    console.error(type.toUpperCase(), 'Fallback failed:', err.message);
  }
}

test('https://www.instagram.com/reel/DU903q-Dx6W', 'ig');
test('https://www.youtube.com/watch?v=YMhC4FtqFHw', 'yt');
