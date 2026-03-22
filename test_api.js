const https = require('https');

function test(url) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(url.split('/')[3], ':', data.slice(0, 300)));
  }).on('error', console.error);
}

test('https://bk9.fun/download/instagram?url=https://www.instagram.com/reel/DU903q-Dx6W');
test('https://bk9.fun/download/youtube?url=https://www.youtube.com/watch?v=YMhC4FtqFHw');
test('https://api.ryzendesu.vip/api/downloader/igdl?url=https://www.instagram.com/reel/DU903q-Dx6W');
