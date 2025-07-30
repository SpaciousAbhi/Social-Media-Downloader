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

// Ban management function - currently allows all users
async function getBanned(userId) {
  // For now, allow all users (no ban system)
  // You can later implement a proper ban system by checking against a ban database
  return {
    status: true,  // true means user is NOT banned
    reason: null
  };
}

module.exports = {
  getBuffer,
  htmlToText,
  filterAlphanumericWithDash,
  getRandom,
  getBanned
}