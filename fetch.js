const https = require('https');
const fs = require('fs');

function fetch(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(dest, data);
        resolve();
      });
    }).on('error', reject);
  });
}

(async () => {
  await fetch('https://raw.githubusercontent.com/averygan/reclip/refs/heads/main/templates/index.html', 'reclip_index.html');
  await fetch('https://raw.githubusercontent.com/averygan/reclip/refs/heads/main/static/style.css', 'reclip_style.css');
  await fetch('https://raw.githubusercontent.com/averygan/reclip/refs/heads/main/static/app.js', 'reclip_app.js');
  console.log('done');
})();
