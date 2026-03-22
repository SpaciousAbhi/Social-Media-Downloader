const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

let YtDlpWrap;
try {
  const mod = require('yt-dlp-wrap');
  YtDlpWrap = mod.default || mod;
} catch (e) {
  YtDlpWrap = null;
}

function safeName(name) {
  return String(name || 'download').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

async function ensureYtDlpBinary() {
  if (!YtDlpWrap) throw new Error('yt-dlp-wrap not installed');
  
  const platform = process.platform;
  const arch = process.arch;
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const rootPath = path.join(process.cwd(), binName);
  const tmpPath = path.join(os.tmpdir(), 'yt-dlp-bin', binName);
  
  if (fs.existsSync(rootPath)) {
    if (!isWin) try { fs.chmodSync(rootPath, 0o755); } catch(e) {}
    return rootPath;
  }
  if (fs.existsSync(tmpPath)) {
    if (!isWin) try { fs.chmodSync(tmpPath, 0o755); } catch(e) {}
    return tmpPath;
  }

  const binPath = tmpPath;
  const binDir = path.dirname(binPath);
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

  let platformAsset = null;
  if (isWin) platformAsset = 'win32';
  else if (isMac) platformAsset = 'darwin';
  else platformAsset = 'linux';

  console.log(`Downloading yt-dlp binary to ${binPath}...`);
  // Static method: downloadFromGithub(filePath, version, platform)
  await (YtDlpWrap.downloadFromGithub || (new YtDlpWrap()).downloadFromGithub)(binPath, 'latest', platformAsset);
  
  try {
    if (!isWin) fs.chmodSync(binPath, 0o755);
  } catch (e) {}
  
  return binPath;
}

const isWin = process.platform === 'win32';

async function runYtDlp(args, onProgress) {
  const bin = await ensureYtDlpBinary();
  const wrapper = new YtDlpWrap(bin);
  
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    wrapper.exec(args)
      .on('progress', (progress) => {
        if (onProgress && progress.percent !== undefined) {
          onProgress(progress);
        }
      })
      .on('ytDlpEvent', (event, data) => {
        // Optional: Capture specific log events if needed
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('close', () => {
        resolve(stdout);
      });
      
    // Note: yt-dlp-wrap's exec doesn't easily expose stdout as a string directly with an event, 
    // it usually streams. But for our purpose of simple file downloads, we just need the events.
    // If we need stdout (like for --dump-json), we use execPromise.
  });
}

// Optimized runYtDlp for simple execution
async function runYtDlpSimple(args) {
    const bin = await ensureYtDlpBinary();
    try {
      const { stdout } = await execFileAsync(bin, args, { maxBuffer: 50 * 1024 * 1024 });
      return stdout;
    } catch (err) {
      const stderr = err && err.stderr ? String(err.stderr) : '';
      const stdout = err && err.stdout ? String(err.stdout) : '';
      const msg = err && err.message ? String(err.message) : String(err);
      throw new Error([`yt-dlp failed: ${msg}`, stdout && `stdout: ${stdout.slice(0, 2000)}`, stderr && `stderr: ${stderr.slice(0, 4000)}`].filter(Boolean).join("\n"));
    }
}

async function getMetadata(url) {
  // We use manual runYtDlpSimple with --dump-json to avoid yt-dlp-wrap's default -f best
  const out = await runYtDlpSimple(['--dump-json', '--no-playlist', '--no-warnings', url]);
  return JSON.parse(out);
}

async function downloadWithYtDlp(url, mode /* 'video'|'audio' */, onProgress, customOut) {
  const outDir = customOut || path.join(process.cwd(), 'content');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const id = Math.random().toString(36).substring(7);
  const tmpl = path.join(outDir, `ytdlp_${id}_%(title).100s.%(ext)s`);

  let args = ['--no-playlist'];
  if (mode === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b', '--merge-output-format', 'mp4');
  }
  args.push('-o', tmpl, url);

  const bin = await ensureYtDlpBinary();
  const wrapper = new YtDlpWrap(bin);
  
  return new Promise((resolve, reject) => {
    wrapper.exec(args)
      .on('progress', (p) => {
        if (onProgress) onProgress(p);
      })
      .on('error', reject)
      .on('close', () => {
          // Find the file we just downloaded
          const prefix = `ytdlp_${id}_`;
          const files = fs.readdirSync(outDir)
            .filter(f => f.startsWith(prefix))
            .map(f => ({ f, p: path.join(outDir, f), m: fs.statSync(path.join(outDir, f)).mtimeMs }))
            .sort((a, b) => b.m - a.m);

          if (!files[0]) reject(new Error('Download produced no file'));
          else resolve(files[0].p);
      });
  });
}

module.exports = {
  downloadWithYtDlp,
  getMetadata,
  safeName,
};
