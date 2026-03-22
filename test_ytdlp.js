const { getMetadata } = require('./funcs/ytdlp');

async function test() {
    try {
        console.log('Testing yt-dlp metadata extraction...');
        const url = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; 
        console.log('Fetching metadata for:', url);
        const meta = await getMetadata(url);
        console.log('Success! Extracted title:', meta.title);
        process.exit(0);
    } catch (err) {
        console.error('Test failed with error:', err);
        console.error('Error stack:', err.stack);
        process.exit(1);
    }
}

test();
