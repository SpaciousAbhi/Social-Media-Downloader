const axios = require('axios');

const COBALT_INSTANCES = [
    'https://cobalt-api.meowing.de',
    'https://cobalt-backend.canine.tools',
    'https://kityune.imput.net',
    'https://blossom.imput.net',
    'https://nachos.imput.net'
];

/**
 * Universal media relay downloader
 * @param {string} url - The social media URL
 * @param {string} mode - 'video' or 'audio'
 * @param {string} [filePath] - Optional local path to save the file
 * @returns {Promise<string>} - Media URL or local path
 */
async function downloadViaRelay(url, mode = 'video', filePath = null) {
    console.log(`Starting relay extraction for: ${url} (mode: ${mode})`);

    // 1. Try Global Relays (Cobalt v10+)
    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`Trying Cobalt relay: ${instance}`);
            const response = await axios.post(`${instance}/`, {
                url: url
                // Minimal body to avoid 400 errors on v10+
            }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
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

    // 2. Try VKRDownloader API
    try {
        console.log('Trying VKRDownloader relay...');
        const vkrUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
        const resV = await axios.get(vkrUrl, { timeout: 15000 });
        if (resV.data && resV.data.data && resV.data.data.download) {
            const dl = resV.data.data.download.find(d => d.type === 'video') || resV.data.data.download[0];
            if (dl && dl.url) {
                console.log('VKR relay success!');
                return await handleMediaResult(dl.url, filePath);
            }
        }
        if (resV.data?.error) console.log('VKR rejected:', resV.data.error);
    } catch (err) {
        console.error('VKR relay failed:', err.response?.data || err.message);
    }

    // 3. Try TiklyDown (Good for TikTok/IG)
    try {
        console.log('Trying TiklyDown relay...');
        const tikUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        const resT = await axios.get(tikUrl, { timeout: 15000 });
        const mediaUrl = resT.data?.data?.video?.noWatermark || resT.data?.data?.images?.[0]?.url;
        if (mediaUrl) {
            console.log('TiklyDown relay success!');
            return await handleMediaResult(mediaUrl, filePath);
        }
    } catch (err) {
        console.error('TiklyDown relay failed:', err.message);
    }

    // 4. Platform-Specific God-Tier Fallback: Invidious for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
            console.log('Trying Invidious mirror relay...');
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) {
                const invBtn = `https://invidious.proto.id/api/v1/videos/${videoId}`;
                const resI = await axios.get(invBtn, { timeout: 10000 });
                if (resI.data && resI.data.formatStreams) {
                    const stream = resI.data.formatStreams.find(s => s.qualityLabel === '720p') || resI.data.formatStreams[0];
                    if (stream && stream.url) {
                         console.log('Invidious success!');
                         return await handleMediaResult(stream.url, filePath);
                    }
                }
            }
        } catch (err) {
            console.error('Invidious fallback failed:', err.message);
        }
    }

    throw new Error('All relay providers failed');
}

async function handleMediaResult(mediaUrl, filePath) {
    if (!filePath) return mediaUrl;
    console.log(`Piping relay stream to ${filePath}...`);
    const streamRes = await axios.get(mediaUrl, { 
        responseType: 'stream', 
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
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
