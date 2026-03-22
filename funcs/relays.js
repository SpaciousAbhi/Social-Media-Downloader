const axios = require('axios');

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
 * Universal media relay downloader (Relay Cluster v4 - Verified)
 * @param {string} url - The social media URL
 * @param {string} mode - 'video' or 'audio'
 * @param {string} [filePath] - Optional local path to save the file
 * @returns {Promise<string>} - Media URL or local path
 */
async function downloadViaRelay(url, mode = 'video', filePath = null) {
    console.log(`[Relay v4] Starting extraction for: ${url}`);

    // 1. Try Cobalt Cluster (Root POST v10+)
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
                timeout: 15000
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

    // 2. Platform-Specific: Invidious for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
            for (const instance of INVIDIOUS_INSTANCES) {
                try {
                    console.log(`Trying Invidious mirror: ${instance}`);
                    const invUrl = `${instance}/api/v1/videos/${videoId}`;
                    const resI = await axios.get(invUrl, { timeout: 10000 });
                    if (resI.data && resI.data.formatStreams) {
                        // Prefer 720p or 360p progressive MP4
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

    // 3. Try VKRDownloader (Verified Bot-Friendly)
    try {
        console.log('Trying VKRDownloader direct relay...');
        const vkrUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
        const resV = await axios.get(vkrUrl, { timeout: 15000 });
        if (resV.data && resV.data.data && resV.data.data.download) {
            const dl = resV.data.data.download.find(d => d.type === 'video') || resV.data.data.download[0];
            if (dl && dl.url) {
                console.log('VKR relay success!');
                return await handleMediaResult(dl.url, filePath);
            }
        }
    } catch (err) {
        console.error('VKR relay failed:', err.response?.data || err.message);
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
