const mongoose = require('mongoose');

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
    console.warn('WARNING: MONGO_URL not found in environment. Bot will use local fallback (ephemeral).');
}

const connectDB = async () => {
    if (!mongoUrl) return;
    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    settings: {
        fbnormal: { type: String, default: '' },
        fbhd: { type: String, default: '' },
        fbmp3: { type: String, default: '' },
        twhd: { type: String, default: '' },
        twsd: { type: String, default: '' },
        twaud: { type: String, default: '' }
    },
    lastInteraction: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Cache Schema (for callback data)
const cacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' } // Cooldown: 7 days
});

const Cache = mongoose.model('Cache', cacheSchema);

module.exports = { connectDB, User, Cache };
