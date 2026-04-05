const fs = require('fs');
const { User } = require('./mongodb');
const mongoose = require('mongoose');

function readDb(databaseName) {
  try {
    let data = fs.readFileSync(databaseName, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function writeDb(db, databaseName) {
  fs.writeFileSync(databaseName, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Enhanced addUserDb: Checks MongoDB first, then falls back to JSON.
 */
async function addUserDb(userid, databaseName) {
  userid = String(userid);
  
  // 1. Try MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      let user = await User.findOne({ chatId: userid });
      if (!user) {
        user = new User({ chatId: userid });
        await user.save();
        console.log(`User ${userid} added to MongoDB`);
      }
      return;
    } catch (err) {
      console.error('MongoDB addUserDb error:', err.message);
    }
  }

  // 2. Fallback to JSON
  const db = readDb(databaseName);
  if (!db[userid]) {
    db[userid] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: '',
      twhd: '',
      twsd: '',
      twaud: ''
    };
    writeDb(db, databaseName);
    console.log(`User ${userid} added to JSON DB (fallback)`);
  }
}

/**
 * Enhanced changeBoolDb: Checks MongoDB first, then falls back to JSON.
 */
async function changeBoolDb(userid, name, databaseName) {
  userid = String(userid);

  // 1. Try MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      let user = await User.findOne({ chatId: userid });
      if (user) {
        user.settings[name] = !user.settings[name];
        await user.save();
        return;
      }
    } catch (err) {
      console.error('MongoDB changeBoolDb error:', err.message);
    }
  }

  // 2. Fallback to JSON
  let db = readDb(databaseName);
  if (db[userid]) {
    if (typeof db[userid][name] !== 'undefined') {
      db[userid][name] = !db[userid][name];
      writeDb(db, databaseName);
    }
  }
}

/**
 * Get all users for broadcast.
 */
async function getAllUsers(databaseName) {
  // 1. Try MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      const users = await User.find({}, 'chatId');
      return users.map(u => u.chatId);
    } catch (err) {
      console.error('MongoDB getAllUsers error:', err.message);
    }
  }

  // 2. Fallback to JSON
  const db = readDb(databaseName);
  return Object.keys(db);
}

module.exports = {
  readDb,
  writeDb,
  addUserDb,
  changeBoolDb,
  getAllUsers
}