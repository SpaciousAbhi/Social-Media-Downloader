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
  // Prefer system package to avoid GitHub download/challenge issues.
  const systemPath = '/usr/bin/yt-dlp';
  if (fs.existsSync(systemPath)) return systemPath;

  if (!YtDlpWrap) throw new Error('yt-dlp-wrap not installed and /usr/bin/yt-dlp missing');
  const dir = path.join(os.tmpdir(), 'yt-dlp-bin');
  fs.mkdirSync(dir, { recursive: true });
  const binPath = path.join(dir, 'yt-dlp');
  if (fs.existsSync(binPath)) return binPath;

  // Last resort: download from GitHub.
  const platform = process.platform;
  const arch = process.arch;
  const isWin = platform === 'win32';
  const isMac = platform === 'darwin';
  const isLinux = platform === 'linux';
  let asset = null;
  if (isWin) asset = 'yt-dlp.exe';
  else if (isMac) asset = 'yt-dlp_macos';
  else if (isLinux && arch === 'x64') asset = 'yt-dlp_linux';
  else if (isLinux && (arch === 'arm64' || arch === 'aarch64')) asset = 'yt-dlp_linux_aarch64';
  else asset = 'yt-dlp_linux';

  await YtDlpWrap.downloadFromGithub('latest', asset, binPath);
  fs.chmodSync(binPath, 0o755);
  return binPath;
}

async function runYtDlp(args) {
  const bin = await ensureYtDlpBinary();
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, { maxBuffer: 50 * 1024 * 1024 });
    if (stderr) {
      // yt-dlp often writes progress to stderr; keep it for diagnostics.
      return stdout + "\n" + stderr;
    }
    return stdout;
  } catch (err) {
    const util = require('util');
    const stderr = err && err.stderr ? String(err.stderr) : '';
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const msg = err && err.message ? String(err.message) : String(err);
    const dump = util.inspect(err, { depth: 3 }).slice(0, 1200);
    throw new Error([`yt-dlp failed: ${msg}`, stdout && `stdout: ${stdout.slice(0, 2000)}`, stderr && `stderr: ${stderr.slice(0, 4000)}`, `raw: ${dump}`].filter(Boolean).join("\n"));
  }
}

async function downloadWithYtDlp(url, mode /* 'video'|'audio' */) {
  const outDir = path.join(os.tmpdir(), 'downloads');
  fs.mkdirSync(outDir, { recursive: true });

  const tmpl = path.join(outDir, '%(title)s__%(id)s.%(ext)s');

  const common = [
    '--no-playlist',
    '--retries', '3',
    '--geo-bypass',
    '--extractor-args', 'youtube:player_client=android,web',
    '-o', tmpl,
  ];

  // Optional auth/cookie support for YouTube anti-bot checks.
  const cookieFile = process.env.YT_COOKIES_FILE;
  if (cookieFile) {
    common.push('--cookies', cookieFile);
  }

  // Optional proxy support (hosted envs often need this for YouTube).
  const proxy = process.env.YT_PROXY_URL;
  if (proxy) {
    common.push('--proxy', proxy);
  }

  if (mode === 'audio') {
    await runYtDlp([
      ...common,
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      url,
    ]);
  } else {
    await runYtDlp([
      ...common,
      '-f', 'bv*+ba/b',
      '--merge-output-format', 'mp4',
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
