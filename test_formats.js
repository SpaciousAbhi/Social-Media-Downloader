const { execSync } = require('child_process');

try {
    const out = execSync('/tmp/yt-dlp-bin/yt-dlp_linux --cookies /tmp/ytdlp_cookies.txt --list-formats https://www.youtube.com/watch?v=YMhC4FtqFHw', { encoding: 'utf8' });
    console.log("YT Formats:", out);
} catch (e) {
    console.log("YT Error:", e.stderr || e.message);
}

try {
    const igOut = execSync('/tmp/yt-dlp-bin/yt-dlp_linux --cookies /tmp/ytdlp_cookies.txt --dump-json https://www.instagram.com/reel/DU903q-Dx6W', { encoding: 'utf8' });
    console.log("IG:", igOut.slice(0, 500));
} catch (e) {
    console.log("IG Error:", e.stderr || e.message);
}
