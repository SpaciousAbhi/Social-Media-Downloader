try {
    const YtDlpWrap = require('yt-dlp-wrap');
    console.log('yt-dlp-wrap loaded successfully');
    console.log('Type:', typeof YtDlpWrap);
    const wrapper = new YtDlpWrap();
    console.log('Instance created successfully');
} catch (err) {
    console.error('Failed to load yt-dlp-wrap:', err);
}
