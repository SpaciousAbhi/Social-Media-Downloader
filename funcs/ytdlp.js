const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Cookie Handler
let cookiesPath = null;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function fixCookies(cookieData) {
    if (!cookieData) return '';
    let finalCookies = cookieData;
    // Fix Heroku stripping newlines by adding them back before domains
    if (!finalCookies.includes('\n')) {
        finalCookies = finalCookies.replace(/ (\.[a-z0-9-]+\.[a-z]+)/g, '\n$1');
        finalCookies = finalCookies.replace(/ (instagram\.com)/g, '\n$1');
        finalCookies = finalCookies.replace(/ (youtube\.com)/g, '\n$1');
    }
    return finalCookies;
}

function getCookieString(domainFilter) {
    const cookieData = process.env.YTDLP_COOKIES;
    if (!cookieData) return '';
    
    const fixed = fixCookies(cookieData);
    const lines = fixed.split('\n');
    const cookies = [];
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const parts = line.split('\t');
        if (parts.length >= 7) {
            const domain = parts[0];
            if (domainFilter && !domain.includes(domainFilter)) continue;
            cookies.push(`${parts[5]}=${parts[6].trim()}`);
        }
    }
    return cookies.join('; ');
}

function getCookieJSON(domainFilter) {
    const cookieData = process.env.YTDLP_COOKIES;
    if (!cookieData) return [];
    
    const fixed = fixCookies(cookieData);
    const lines = fixed.split('\n');
    const cookies = [];
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const parts = line.split('\t');
        if (parts.length >= 7) {
            const domain = parts[0];
            if (domainFilter && !domain.includes(domainFilter)) continue;
            cookies.push({
                domain: domain,
                path: parts[2],
                name: parts[5],
                value: parts[6].trim()
            });
        }
    }
    return cookies;
}

function getCookiesArgs() {
    const cookieData = process.env.YTDLP_COOKIES;
    if (cookieData) {
        if (!cookiesPath) {
            cookiesPath = path.join(os.tmpdir(), 'ytdlp_cookies.txt');
            const fixed = fixCookies(cookieData);
            fs.writeFileSync(cookiesPath, fixed, 'utf8');
            if (process.platform !== 'win32') fs.chmodSync(cookiesPath, 0o600);
            console.log('✅ Injected YTDLP_COOKIES from environment.');
        }
        return ['--cookies', cookiesPath];
    }
  
  // Fallback to local cookies.txt if it exists
  const localCookies = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(localCookies)) {
      return ['--cookies', localCookies];
  }

  return [];
}

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
  const binName = isWin ? 'yt-dlp.exe' : (isMac ? 'yt-dlp_macos' : 'yt-dlp_linux');
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

  const dlUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binName}`;

  console.log(`Downloading yt-dlp binary from ${dlUrl} to ${binPath}...`);
  try {
    // We use curl for maximum reliability in avoiding node HTTP redirect/buffer issues for large binaries
    const { execSync } = require('child_process');
    execSync(`curl -L "${dlUrl}" -o "${binPath}"`, { stdio: 'inherit' });

    // Validate if it is actually an HTML page (404/error)
    if (fs.existsSync(binPath)) {
        const head = fs.readFileSync(binPath, { encoding: 'utf8', flag: 'r' }).substring(0, 100);
        if (head.includes('<!DOCTYPE html>') || head.includes('<html')) {
            fs.unlinkSync(binPath);
            throw new Error('Downloaded file is an HTML page (404 Not Found or similar).');
        }
    }

    if (!isWin) fs.chmodSync(binPath, 0o755);
  } catch (err) {
    console.error('Failed to download yt-dlp binary:', err.message);
    if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
    throw err;
  }
  
  return binPath;
}

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

async function runYtDlp(args, onProgress) {
  const bin = await ensureYtDlpBinary();
  const cookiesArgs = getCookiesArgs();
  const wrapper = new YtDlpWrap(bin);
  
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    wrapper.exec([...cookiesArgs, ...args])
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
    const cookiesArgs = getCookiesArgs();
    try {
      const { stdout } = await execFileAsync(bin, [...cookiesArgs, ...args], { maxBuffer: 50 * 1024 * 1024 });
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
  let extraArgs = ['--user-agent', USER_AGENT];
  const out = await runYtDlpSimple([...extraArgs, '--dump-json', '--no-playlist', '--no-warnings', url]);
  return JSON.parse(out);
}

async function downloadWithYtDlp(url, mode /* 'video'|'audio' */, onProgress, customOut) {
  const outDir = customOut || path.join(process.cwd(), 'content');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const id = Math.random().toString(36).substring(7);
  const tmpl = path.join(outDir, `ytdlp_${id}_%(title).100s.%(ext)s`);

  let args = ['--no-playlist', '--user-agent', USER_AGENT];
  if (mode === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b', '--merge-output-format', 'mp4');
  }
  args.push('-o', tmpl, url);

  const bin = await ensureYtDlpBinary();
  const cookiesArgs = getCookiesArgs();
  const wrapper = new YtDlpWrap(bin);
  
  return new Promise((resolve, reject) => {
    wrapper.exec([...cookiesArgs, ...args])
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
  getCookieString,
  getCookieJSON,
  USER_AGENT
};
