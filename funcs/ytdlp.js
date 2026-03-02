const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

let YtDlpWrap;
try {
  YtDlpWrap = require('yt-dlp-wrap').default;
} catch (e) {
  YtDlpWrap = null;
}

function safeName(name) {
  return String(name || 'download').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

async function ensureYtDlpBinary() {
  if (!YtDlpWrap) throw new Error('yt-dlp-wrap not installed');
  const dir = path.join(os.tmpdir(), 'yt-dlp-bin');
  fs.mkdirSync(dir, { recursive: true });
  const binPath = path.join(dir, 'yt-dlp');
  if (fs.existsSync(binPath)) return binPath;
  const wrapper = new YtDlpWrap();
  // Downloads the platform binary into the cwd by default; we move it.
  const downloaded = await wrapper.getYtDlpBinary();
  fs.copyFileSync(downloaded, binPath);
  fs.chmodSync(binPath, 0o755);
  return binPath;
}

async function runYtDlp(args) {
  const bin = await ensureYtDlpBinary();
  const { stdout } = await execFileAsync(bin, args, { maxBuffer: 50 * 1024 * 1024 });
  return stdout;
}

async function downloadWithYtDlp(url, mode /* 'video'|'audio' */) {
  const outDir = path.join(os.tmpdir(), 'downloads');
  fs.mkdirSync(outDir, { recursive: true });

  const tmpl = path.join(outDir, '%(title)s__%(id)s.%(ext)s');

  if (mode === 'audio') {
    await runYtDlp([
      '--no-playlist',
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', tmpl,
      url,
    ]);
  } else {
    await runYtDlp([
      '--no-playlist',
      '-f', 'bv*+ba/b',
      '--merge-output-format', 'mp4',
      '-o', tmpl,
      url,
    ]);
  }

  // Find newest file in outDir
  const files = fs.readdirSync(outDir)
    .map(f => ({ f, p: path.join(outDir, f), m: fs.statSync(path.join(outDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);

  if (!files[0]) throw new Error('Download produced no file');
  return files[0].p;
}

module.exports = {
  downloadWithYtDlp,
  safeName,
};
