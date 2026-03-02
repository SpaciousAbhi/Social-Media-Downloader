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
  // yt-dlp-wrap v2+ doesn't expose getYtDlpBinary(); instead we download from GitHub.
  const wrapper = new YtDlpWrap();
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

  // downloadFromGithub(releaseTag, fileName, targetPath)
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
    const stderr = err && err.stderr ? String(err.stderr) : '';
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const msg = err && err.message ? String(err.message) : String(err);
    throw new Error([`yt-dlp failed: ${msg}`, stdout && `stdout: ${stdout.slice(0, 2000)}`, stderr && `stderr: ${stderr.slice(0, 4000)}`].filter(Boolean).join("\n"));
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
