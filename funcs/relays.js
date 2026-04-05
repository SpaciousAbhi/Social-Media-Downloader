const axios = require('axios');
const cheerio = require('cheerio');

const COBALT_INSTANCES = [
    'https://cobalt-api.meowing.de',
    'https://cobalt-backend.canine.tools'
];

const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://yewtu.be',
    'https://invidious.nerdvpn.de'
];

/**
 * Stealth Extraction: Indown.io for Instagram
 */
async function indownExtract(url) {
    try {
        console.log('Trying Stealth Indown.io extraction...');
        const mainPages = await axios.get('https://indown.io/reels', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(mainPages.data);
        const token = $('input[name="_token"]').val();
        if (!token) throw new Error('Could not find indown token');

        const postData = new URLSearchParams();
        postData.append('referer', 'https://indown.io/reels');
        postData.append('locale', 'en');
        postData.append('_token', token);
        postData.append('link', url);
        postData.append('i', 'p');

        const res = await axios.post('https://indown.io/download', postData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://indown.io/reels',
                'Cookie': mainPages.headers['set-cookie']?.join('; ') || ''
            }
        });

        const $res = cheerio.load(res.data);
        const mediaUrl = $res('#result a.btn-primary').first().attr('href');
        if (mediaUrl) {
            console.log('Indown Stealth success!');
            return mediaUrl;
        }
    } catch (err) {
        console.error('Indown Stealth failed:', err.message);
    }
    return null;
}

/**
 * Stealth Extraction: YouTube4KDownloader for YouTube
 */
async function yt4kExtract(url) {
    try {
        console.log('Trying Stealth YT4K extraction...');
        const rand = Math.random().toString(36).substring(7);
        const api = `https://s6.youtube4kdownloader.com/ajax/getLinks.php?video=${encodeURIComponent(url)}&rand=${rand}`;
        const res = await axios.get(api, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://youtube4kdownloader.com/'
            }
        });
        if (res.data && res.data.data) {
             const formats = res.data.data;
             // Find best MP4 video or first progressive
             const best = formats.find(f => f.quality === '720p' && f.ext === 'mp4') || formats[0];
             if (best && best.url) {
                 console.log('YT4K Stealth success!');
                 return best.url;
             }
        }
    } catch (err) {
        console.error('YT4K Stealth failed:', err.message);
    }
    return null;
}

/**
 * Universal media relay downloader (Relay Cluster v5 - Stealth Edition)
 * @param {string} url - The social media URL
 * @param {string} mode - 'video' or 'audio'
 * @param {string} [filePath] - Optional local path to save the file
 * @returns {Promise<string>} - Media URL or local path
 */
async function downloadViaRelay(url, mode = 'video', filePath = null) {
    console.log(`[Relay v5] Starting stealth extraction for: ${url}`);

    // A. Platform-Specific Stealth Handlers (Priority 1)
    if (url.includes('instagram.com')) {
         const mUrl = await indownExtract(url);
         if (mUrl) return await handleMediaResult(mUrl, filePath);
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
         const mUrl = await yt4kExtract(url);
         if (mUrl) return await handleMediaResult(mUrl, filePath);
    }

    // B. Cobalt Cluster (Secondary)
    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`Trying Cobalt relay: ${instance}`);
            const response = await axios.post(`${instance}/`, {
                url: url
            }, {
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            let mediaUrl = response.data?.url || response.data?.picker?.[0]?.url;
            if (mediaUrl) {
                console.log(`Cobalt success via ${instance}`);
                return await handleMediaResult(mediaUrl, filePath);
            }
        } catch (err) {
            console.error(`Cobalt relay ${instance} failed:`, err.response?.status || err.message);
        }
    }

    // C. Traditional Public Mirrors (Tertiary)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
            for (const instance of INVIDIOUS_INSTANCES) {
                try {
                    console.log(`Trying Invidious mirror: ${instance}`);
                    const invUrl = `${instance}/api/v1/videos/${videoId}`;
                    const resI = await axios.get(invUrl, { timeout: 8000 });
                    if (resI.data && resI.data.formatStreams) {
                        const stream = resI.data.formatStreams.find(s => s.qualityLabel === '720p') || 
                                       resI.data.formatStreams.find(s => s.qualityLabel === '360p') || 
                                       resI.data.formatStreams[0];
                        if (stream && stream.url) {
                             console.log(`Invidious success via ${instance}`);
                             return await handleMediaResult(stream.url, filePath);
                        }
                    }
                } catch (err) {
                    console.error(`Invidious mirror ${instance} failed:`, err.message);
                }
            }
        }
    }

    // D. Final Verification API
    try {
        console.log('Trying VKRDownloader direct relay...');
        const vkrUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
        const resV = await axios.get(vkrUrl, { timeout: 10000 });
        if (resV.data && resV.data.data && resV.data.data.download) {
            const dl = resV.data.data.download.find(d => d.type === 'video') || resV.data.data.download[0];
            if (dl && dl.url) {
                console.log('VKR relay success!');
                return await handleMediaResult(dl.url, filePath);
            }
        }
    } catch (err) {
        console.error('VKR relay failed:', err.message);
    }

    throw new Error('All high-availability relay providers failed');
}

async function handleMediaResult(mediaUrl, filePath) {
    if (!filePath) return mediaUrl;
    console.log(`Piping relay stream to ${filePath}...`);
    const streamRes = await axios.get(mediaUrl, { 
        responseType: 'stream', 
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const fs = require('fs');
    const fileStream = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        streamRes.data.pipe(fileStream);
        fileStream.on('finish', () => resolve(filePath));
        fileStream.on('error', (err) => reject(err));
    });
}

module.exports = { downloadViaRelay };
