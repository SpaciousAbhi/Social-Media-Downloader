const axios = require('axios');
const cheerio = require('cheerio');

async function getRandom(ext) {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

async function getBuffer(url) {
  try {
    let data = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Requests': 1
      },
      responseType: 'arraybuffer'
    })
    return data.data
  } catch (err) {
    console.log(err);
    return err
  }
}

function filterAlphanumericWithDash(inputText) {
  return inputText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
}

function htmlToText(html) {
  let $ = cheerio.load(html);
  return $.text();
}


const urlCache = new Map();

function getCallbackData(prefix, url) {
  if (!url) return prefix;
  if ((prefix.length + 1 + url.length) <= 64) return `${prefix} ${url}`;
  const id = Math.random().toString(36).substring(7);
  urlCache.set(id, url);
  if (urlCache.size > 1000) urlCache.clear(); 
  return `${prefix} cache:${id}`;
}

function resolveUrl(data) {
  const parts = data.split(' ');
  const val = parts.slice(1).join(' ');
  if (val.startsWith('cache:')) {
    return urlCache.get(val.replace('cache:', ''));
  }
  return val;
}

async function getBanned(chatId) {
    // Placeholder: can be expanded to a real ban system using database.json
    return { status: true, reason: null };
}

module.exports = {
  getBuffer,
  htmlToText,
  filterAlphanumericWithDash,
  getRandom,
  getCallbackData,
  resolveUrl,
  getBanned
}