const { getTiktokInfo, tiktokVideo, tiktokAudio } = require('./funcs/tiktok');
const { downloadInstagram } = require('./funcs/instagram');
const { getDataTwitter, downloadTwitterHigh, downloadTwitterAudio } = require('./funcs/twitter');
const { getFacebook, getFacebookNormal, getFacebookAudio } = require('./funcs/facebook');
const { threadsDownload } = require('./funcs/threads');
const { getYoutube, getYoutubeVideo, getYoutubeAudio } = require('./funcs/youtube');
const fs = require('fs');
const path = require('path');

// Mock Bot
const bot = {
    sendMessage: async (chatId, text, opts) => {
        console.log(`[BOT -> ${chatId}] Msg: ${text.slice(0, 100)}`);
        return { message_id: Math.floor(Math.random() * 1000) };
    },
    editMessageText: async (text, opts) => {
        console.log(`[BOT -> ${opts.chat_id}] Edit: ${text.slice(0, 100)}`);
        return true;
    },
    sendPhoto: async (chatId, photo, opts) => {
        console.log(`[BOT -> ${chatId}] Photo: ${photo}`);
        return true;
    },
    sendVideo: async (chatId, video, opts) => {
        console.log(`[BOT -> ${chatId}] Video: ${video}`);
        return true;
    },
    sendAudio: async (chatId, audio, opts) => {
        console.log(`[BOT -> ${chatId}] Audio: ${audio}`);
        return true;
    },
    deleteMessage: async (chatId, msgId) => {
        return true;
    },
    sendChatAction: async (chatId, action) => {
        return true;
    }
};

const testUrls = {
    tiktok: 'https://www.tiktok.com/@khaby.lame/video/6944923756854160645',
    instagram: 'https://www.instagram.com/reels/C4p5_z8S_0B/',
    twitter: 'https://twitter.com/Tesla/status/1769853902146957790',
    youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
};

async function runTests() {
    process.env.DEV_ID = '123456'; 
    
    console.log('--- STARTING DIAGNOSTIC TESTS ---');

    const platforms = [
        { name: 'TikTok Info', fn: () => getTiktokInfo(bot, 'test', testUrls.tiktok, 'test') },
        { name: 'TikTok Video', fn: () => tiktokVideo(bot, 'test', testUrls.tiktok, 'test') },
        { name: 'Instagram', fn: () => downloadInstagram(bot, 'test', testUrls.instagram, 'test') },
        { name: 'Twitter Info', fn: () => getDataTwitter(bot, 'test', testUrls.twitter, 'test') },
        { name: 'Twitter Video', fn: () => downloadTwitterHigh(bot, 'test', 'test', testUrls.twitter) },
        { name: 'YouTube Info', fn: () => getYoutube(bot, 'test', testUrls.youtube, 'test') },
        { name: 'YouTube Video', fn: () => getYoutubeVideo(bot, 'test', testUrls.youtube, null, 'test') }
    ];

    for (const p of platforms) {
        console.log(`\nTesting ${p.name}...`);
        try {
            await p.fn();
            console.log(`${p.name}: SUCCESS`);
        } catch (e) {
            console.error(`${p.name}: FAILED`);
            console.error('Error:', e.message);
            if (e.stack) console.error('Stack:', e.stack);
        }
    }

    console.log('\n--- TESTS COMPLETED ---');
    process.exit(0);
}

runTests();
