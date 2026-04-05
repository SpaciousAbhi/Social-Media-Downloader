const express = require('express');
const { ensureYtDlpBinary, getCookiesArgs } = require('./funcs/ytdlp');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const jobs = {};
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

function mountReclip(app) {
    app.use(express.json());

    // Serve UI
    app.get('/reclip', (req, res) => {
        res.sendFile(path.join(__dirname, 'reclip_index.html'));
    });
    app.get('/', (req, res, next) => {
        // Option to redirect / to /reclip or keep original status
        // We'll leave original / as status and just mount /reclip
        next();
    });

    // 1. Info API
    app.post('/api/info', async (req, res) => {
        const url = (req.body.url || '').trim();
        if (!url) return res.status(400).json({ error: 'No URL provided' });

        try {
            const bin = await ensureYtDlpBinary();
            const args = [...getCookiesArgs(), '--no-playlist', '-j', url];
            
            execFile(bin, args, { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
                if (err) {
                    const errMsg = (stderr || '').trim().split('\n').pop() || err.message;
                    return res.status(400).json({ error: errMsg });
                }
                try {
                    const info = JSON.parse(stdout);
                    const best_by_height = {};
                    (info.formats || []).forEach(f => {
                        const height = f.height;
                        if (height && f.vcodec !== 'none') {
                            const tbr = f.tbr || 0;
                            if (!best_by_height[height] || tbr > (best_by_height[height].tbr || 0)) {
                                best_by_height[height] = f;
                            }
                        }
                    });

                    const formats = Object.values(best_by_height).map(f => ({
                        id: f.format_id,
                        label: `${f.height}p`,
                        height: f.height
                    })).sort((a, b) => b.height - a.height);

                    res.json({
                        title: info.title || '',
                        thumbnail: info.thumbnail || '',
                        duration: info.duration,
                        uploader: info.uploader || '',
                        formats: formats
                    });
                } catch (parseErr) {
                    res.status(400).json({ error: 'Failed to parse video info' });
                }
            });
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });

    // 2. Download Endpoint
    app.post('/api/download', (req, res) => {
        const url = (req.body.url || '').trim();
        const format_choice = req.body.format || 'video';
        const format_id = req.body.format_id;
        const title = req.body.title || '';

        if (!url) return res.status(400).json({ error: 'No URL provided' });

        const job_id = Math.random().toString(36).substring(2, 12);
        jobs[job_id] = { status: 'downloading', url, title };

        runDownload(job_id, url, format_choice, format_id);

        res.json({ job_id });
    });

    // 3. Status Endpoint
    app.get('/api/status/:job_id', (req, res) => {
        const job = jobs[req.params.job_id];
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json({
            status: job.status,
            error: job.error,
            filename: job.filename
        });
    });

    // 4. File Endpoint
    app.get('/api/file/:job_id', (req, res) => {
        const job = jobs[req.params.job_id];
        if (!job || job.status !== 'done') return res.status(404).json({ error: 'File not ready' });
        
        res.download(job.file, job.filename, (err) => {
            if (err) console.error('Download error:', err);
        });
    });
}

async function runDownload(job_id, url, format_choice, format_id) {
    const job = jobs[job_id];
    const out_template = path.join(DOWNLOAD_DIR, `${job_id}.%(ext)s`);

    try {
        const bin = await ensureYtDlpBinary();
        let cmd = [...getCookiesArgs(), '--no-playlist', '-o', out_template];

        try {
            const ffmpegPath = require('ffmpeg-static');
            if (ffmpegPath) cmd.push('--ffmpeg-location', ffmpegPath);
        } catch (e) {}

        if (format_choice === 'audio') {
            cmd.push('-x', '--audio-format', 'mp3');
        } else if (format_id) {
            cmd.push('-f', `${format_id}+bestaudio/best`, '--merge-output-format', 'mp4');
        } else {
            cmd.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
        }
        cmd.push(url);

        execFile(bin, cmd, { maxBuffer: 100 * 1024 * 1024, timeout: 300000 }, (err, stdout, stderr) => {
            if (err) {
                job.status = 'error';
                job.error = (stderr || '').trim().split('\n').pop() || err.message;
                return;
            }

            const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.startsWith(job_id + '.')).map(f => path.join(DOWNLOAD_DIR, f));
            if (files.length === 0) {
                job.status = 'error';
                job.error = 'Download completed but no file was found';
                return;
            }

            let chosen;
            if (format_choice === 'audio') {
                chosen = files.find(f => f.endsWith('.mp3')) || files[0];
            } else {
                chosen = files.find(f => f.endsWith('.mp4')) || files[0];
            }

            // Cleanup
            files.forEach(f => {
                if (f !== chosen) {
                    try { fs.unlinkSync(f); } catch (e) {}
                }
            });

            job.status = 'done';
            job.file = chosen;
            const ext = path.extname(chosen);
            const rawTitle = (job.title || '').trim();
            if (rawTitle) {
                const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, '').slice(0, 20).trim();
                job.filename = safeTitle ? `${safeTitle}${ext}` : path.basename(chosen);
            } else {
                job.filename = path.basename(chosen);
            }
        });
    } catch (e) {
        job.status = 'error';
        job.error = e.message;
    }
}

module.exports = mountReclip;
