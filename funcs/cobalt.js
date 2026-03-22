const axios = require('axios');

const COBALT_INSTANCES = [
    'https://cobalt-api.meowing.de',
    'https://cobalt-backend.canine.tools',
    'https://kityune.imput.net',
    'https://blossom.imput.net',
    'https://nachos.imput.net'
];

/**
 * Download media via Cobalt API relay
 * @param {string} url - The social media URL
 * @param {string} mode - 'video' or 'audio'
 * @param {string} [filePath] - Optional local path to save the file
 * @returns {Promise<string>} - The direct download URL or the filePath if downloaded
 */
async function downloadViaCobalt(url, mode = 'video', filePath = null) {
    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`Trying Cobalt instance: ${instance}`);
            const response = await axios.post(`${instance}/`, {
                url: url,
                videoQuality: '720',
                audioFormat: 'mp3',
                downloadMode: mode === 'audio' ? 'audio' : 'video'
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });

            let mediaUrl = '';
            if (response.data && response.data.url) {
                mediaUrl = response.data.url;
            } else if (response.data && response.data.picker) {
                mediaUrl = response.data.picker[0].url;
            }

            if (mediaUrl) {
                if (filePath) {
                    console.log(`Downloading from Cobalt relay to ${filePath}...`);
                    const streamRes = await axios.get(mediaUrl, { 
                        responseType: 'stream',
                        timeout: 30000 
                    });
                    const fs = require('fs');
                    const fileStream = fs.createWriteStream(filePath);
                    
                    return new Promise((resolve, reject) => {
                        streamRes.data.pipe(fileStream);
                        fileStream.on('finish', () => resolve(filePath));
                        fileStream.on('error', (err) => reject(err));
                    });
                }
                return mediaUrl;
            }
        } catch (err) {
            console.error(`Cobalt instance ${instance} failed:`, err.message);
        }
    }
    throw new Error('All Cobalt instances failed');
}

module.exports = { downloadViaCobalt };
