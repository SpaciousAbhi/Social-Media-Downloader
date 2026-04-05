const axios = require('axios');
const cheerio = require('cheerio');
const { Cache } = require('./mongodb');
const mongoose = require('mongoose');

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

// Local memory fallback for cache
const localCache = new Map();

/**
 * Enhanced getCallbackData: Stores in MongoDB for persistence.
 */
async function getCallbackData(prefix, url) {
  if (!url) return prefix;
  if ((prefix.length + 1 + url.length) <= 64) return `${prefix} ${url}`;

  const id = Math.random().toString(36).substring(7);

  // 1. Try MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      await Cache.create({ key: id, value: url });
      return `${prefix} cache:${id}`;
    } catch (err) {
      console.error('MongoDB Cache set error:', err.message);
    }
  }
  
  // 2. Local Fallback
  localCache.set(id, url);
  // Auto-expire local cache after 1 hour to prevent memory leaks
  setTimeout(() => localCache.delete(id), 3600000);

  return `${prefix} cache:${id}`;
}

/**
 * Enhanced resolveUrl: Retrieves from MongoDB.
 * Note: This now needs to be used with 'await' in callback handlers.
 */
async function resolveUrl(data) {
  const parts = data.split(' ');
  const val = parts.slice(1).join(' ');
  if (val && val.startsWith('cache:')) {
    const key = val.replace('cache:', '');
    
    // 1. Try MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await Cache.findOne({ key });
        if (doc) return doc.value;
      } catch (err) {
        console.error('MongoDB Cache get error:', err.message);
      }
    }
    
    // 2. Local Fallback
    return localCache.get(key) || null;
  }
  return val;
}

async function getBanned(chatId) {
    // Placeholder: can be expanded to a real ban system using database.json or MongoDB
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