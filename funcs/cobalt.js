const axios = require('axios');

async function cobaltGet(url, mode='video') {
  const body = { url, vQuality: '720', filenameStyle: 'basic' };
  if (mode === 'audio') body.isAudioOnly = true;
  const { data } = await axios.post('https://api.cobalt.tools/api/json', body, {
    headers: { 'accept': 'application/json', 'content-type': 'application/json' },
    timeout: 30000,
  });
  if (!data || !data.url) throw new Error('cobalt_no_url');
  return data.url;
}

module.exports = { cobaltGet };
