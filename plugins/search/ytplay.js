
'use strict'

const { randomUUID } = require('crypto')
const crypto = require('crypto')
const axios = require('axios')
const qs = require('qs')


// ============ SCRAPER YOUTUBE ====================
class SaveTube {
    constructor() {
        this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12'
        this.fmt = ['144', '240', '360', '480', '720', '1080', 'mp3']
        this.re =
            /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/
        this.ua =
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
        this.maxTry = 4
    }

    decode(enc) {
        const data = Buffer.from(enc, 'base64')
        const iv = data.slice(0, 16)
        const ct = data.slice(16)
        const key = Buffer.from(this.ky, 'hex')
        const dc = crypto.createDecipheriv('aes-128-cbc', key, iv)
        return JSON.parse(Buffer.concat([dc.update(ct), dc.final()]).toString())
    }

    async getCdn() {
        const res = await axios.get('https://media.savetube.vip/api/random-cdn', { timeout: 10000 })
        return res.data.cdn
    }

    async sleep(ms) {
        return new Promise(r => setTimeout(r, ms))
    }

    cleanTitle(raw = '') {
        let t = String(raw)
        const lp =
            /lyrics?|official\s*(music\s*)?video|audio|visualizer|mv|m\/v|hd|4k|8k|full\s*song|original\s*mix|remaster(ed)?|live|cover|clean|explicit|extended|radio\s*edit|slowed|reverb|sped\s*up|color\s*coded|sub\s*indo|terjemahan|lyric\s*video/i
        t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
        t = t.replace(/[\(\[\{][^\)\]\}]*[\)\]\}]/g, m => (lp.test(m) ? '' : m))
        t = t
            .replace(/\/\/+/g, ' - ')
            .replace(/[|:]{1,2}/g, ' ')
            .replace(/[#@]\S+/g, '')
        t = t.replace(new RegExp(`\\b(${lp.source})\\b`, 'gi'), '')
        t = t
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+-\s*$/g, '')
            .replace(/^\s*-\s+/g, '')
            .trim()
        return t || String(raw).trim()
    }

    async download(url, format = 'mp3') {
        const id = url.match(this.re)?.[3]
        if (!id) throw new Error('ID tidak bisa diambil dari URL')
        if (!this.fmt.includes(format)) throw new Error(`Format tidak valid. Pilihan: ${this.fmt.join(', ')}`)
        let lastErr = null
        for (let attempt = 1; attempt <= this.maxTry; attempt++) {
            try {
                const cdn = await this.getCdn()
                const infoRes = await axios.post(
                    `https://${cdn}/v2/info`,
                    { url: `https://www.youtube.com/watch?v=${id}` },
                    { timeout: 15000, headers: { 'User-Agent': this.ua, Referer: 'https://save-tube.com/' } }
                )
                const info = this.decode(infoRes.data.data)
                const dlRes = await axios.post(
                    `https://${cdn}/download`,
                    {
                        downloadType: format === 'mp3' ? 'audio' : 'video',
                        quality: format === 'mp3' ? '128' : format,
                        key: info.key
                    },
                    {
                        timeout: 30000,
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': this.ua,
                            Referer: 'https://save-tube.com/'
                        }
                    }
                )
                const dlUrl = dlRes.data?.data?.downloadUrl
                if (!dlUrl) throw new Error('downloadUrl tidak ditemukan')
                return {
                    title: this.cleanTitle(info.title),
                    rawTitle: info.title,
                    thumb: info.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                    duration: info.duration,
                    format,
                    url: dlUrl
                }
            } catch (e) {
                lastErr = e
                if (attempt < this.maxTry) await this.sleep(800 * attempt)
            }
        }
        throw new Error(`SaveTube gagal: ${lastErr?.message}`)
    }
}

class QByte {
    constructor() {
        this.api = 'https://be-video-downloader.qbyte.web.id'
        this.web = 'https://video.downloader.qbyte.web.id/'
        this.ua =
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'
        this.http = axios.create({ timeout: 120000, maxRedirects: 5, validateStatus: () => true })
    }

    cleanName(t) {
        return String(t || 'media')
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    }

    getId(f) {
        return String(f.format_id || f.itag || f.id)
    }

    getHeight(f) {
        if (f.height) return Number(f.height)
        const r = String(f.resolution || '')
        const wxh = r.match(/(\d+)\s*x\s*(\d+)/i)
        if (wxh) return Number(wxh[2])
        const p = r.match(/(\d+)\s*p/i)
        if (p) return Number(p[1])
        const a = r.match(/\d+/)
        return a ? Number(a[0]) : 0
    }

    async download(url, format = 'mp3') {
        const headers = {
            'user-agent': this.ua,
            accept: 'application/json',
            origin: this.web.slice(0, -1),
            referer: this.web
        }
        const res = await this.http.get(`${this.api}/api/info`, { params: { url }, headers })
        if (res.status < 200 || res.status >= 300) throw new Error(`QByte info gagal HTTP ${res.status}`)
        const info = res.data
        const formats = Array.isArray(info.formats) ? info.formats : []

        const checkRes = await this.http.get(`${this.api}/api/check-download`, {
            headers: { 'user-agent': this.ua, accept: '*/*', referer: this.web }
        })
        if (checkRes.status < 200 || checkRes.status >= 300)
            throw new Error(`Server QByte penuh HTTP ${checkRes.status}`)

        const title = this.cleanName(info.title || 'media')

        if (format === 'mp3') {
            const audioFormat = formats
                .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
                .sort((a, b) => Number(b.abr || b.tbr || 0) - Number(a.abr || a.tbr || 0))[0]
            if (!audioFormat) throw new Error('Format audio tidak ditemukan')
            const audioId = this.getId(audioFormat)
            const audioExt = audioFormat.ext || 'm4a'
            const dRes = await this.http.get(`${this.api}/api/download`, {
                params: { url, format: audioId, filename: `${title}.${audioExt}` },
                responseType: 'stream',
                headers: { 'user-agent': this.ua, accept: '*/*', referer: this.web }
            })
            if (dRes.status < 200 || dRes.status >= 300) throw new Error(`QByte audio gagal HTTP ${dRes.status}`)
            const chunks = []
            await new Promise((resolve, reject) => {
                dRes.data.on('data', c => chunks.push(c))
                dRes.data.on('end', resolve)
                dRes.data.on('error', reject)
            })
            return {
                title,
                thumb: `https://i.ytimg.com/vi/${url.match(/v=([^&]+)/)?.[1]}/hqdefault.jpg`,
                buffer: Buffer.concat(chunks),
                format: 'mp3'
            }
        }

        const target = parseInt(format) || 720
        const videoFormat =
            formats
                .filter(f => f.vcodec !== 'none' && this.getHeight(f) === target)
                .sort(
                    (a, b) =>
                        (String(b.ext).toLowerCase() === 'mp4' ? 1 : 0) -
                        (String(a.ext).toLowerCase() === 'mp4' ? 1 : 0)
                )[0] ??
            formats
                .filter(f => f.vcodec !== 'none')
                .sort((a, b) => Math.abs(this.getHeight(a) - target) - Math.abs(this.getHeight(b) - target))[0]
        if (!videoFormat) throw new Error('Format video tidak ditemukan')

        const audioFormat2 = formats
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
            .sort((a, b) => Number(b.abr || b.tbr || 0) - Number(a.abr || a.tbr || 0))[0]

        const { spawn } = require('child_process')
        const fsp = require('fs/promises')
        const fs = require('fs')
        const path = require('path')
        const os = require('os')

        const tmpDir = os.tmpdir()
        const videoTmp = path.join(tmpDir, `qbyte-video-${Date.now()}.${videoFormat.ext || 'mp4'}`)
        const audioTmp = path.join(tmpDir, `qbyte-audio-${Date.now()}.${audioFormat2?.ext || 'm4a'}`)
        const outTmp = path.join(tmpDir, `qbyte-out-${Date.now()}.mp4`)

        const dlFile = async (formatId, filename, ext, outPath) => {
            const dRes = await this.http.get(`${this.api}/api/download`, {
                params: { url, format: formatId, filename },
                responseType: 'stream',
                headers: { 'user-agent': this.ua, accept: '*/*', referer: this.web }
            })
            if (dRes.status < 200 || dRes.status >= 300) throw new Error(`download gagal HTTP ${dRes.status}`)
            await new Promise((resolve, reject) => {
                const w = fs.createWriteStream(outPath)
                dRes.data.pipe(w)
                dRes.data.on('error', reject)
                w.on('finish', resolve)
                w.on('error', reject)
            })
        }

        await dlFile(this.getId(videoFormat), `${title}.${videoFormat.ext || 'mp4'}`, videoFormat.ext, videoTmp)
        if (audioFormat2)
            await dlFile(this.getId(audioFormat2), `${title}.${audioFormat2.ext || 'm4a'}`, audioFormat2.ext, audioTmp)

        const runFfmpeg = args =>
            new Promise((resolve, reject) => {
                const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
                let err = ''
                ff.stderr.on('data', c => (err += c.toString()))
                ff.on('close', code =>
                    code === 0 ? resolve() : reject(new Error(`FFmpeg gagal: ${err.slice(-500)}`))
                )
                ff.on('error', reject)
            })

        if (audioFormat2) {
            await runFfmpeg(['-y', '-i', videoTmp, '-i', audioTmp, '-c:v', 'copy', '-c:a', 'aac', '-shortest', outTmp])
        } else {
            await runFfmpeg(['-y', '-i', videoTmp, '-c:v', 'copy', outTmp])
        }

        const buffer = await fsp.readFile(outTmp)
        await fsp.unlink(videoTmp).catch(() => {})
        await fsp.unlink(audioTmp).catch(() => {})
        await fsp.unlink(outTmp).catch(() => {})

        return {
            title,
            thumb: `https://i.ytimg.com/vi/${url.match(/v=([^&]+)/)?.[1]}/hqdefault.jpg`,
            buffer,
            format: 'mp4'
        }
    }
}

const st = new SaveTube()
const qbyte = new QByte()

const innertubeKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const innertubeUa =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function findVideoRenderer(node, out) {
    if (!node || typeof node !== 'object') return
    if (node.videoRenderer?.videoId) {
        out.push(node.videoRenderer)
        return
    }
    for (const key in node) findVideoRenderer(node[key], out)
}

async function searchYoutube(q) {
    if (/^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\//.test(q)) return q
    const res = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${innertubeKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': innertubeUa,
            'X-Youtube-Client-Name': '1',
            'X-Youtube-Client-Version': '2.20240101.00.00'
        },
        body: JSON.stringify({
            context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' } },
            query: q
        }),
        signal: AbortSignal.timeout(15000)
    })
    if (!res.ok) throw new Error(`Pencarian gagal HTTP ${res.status}`)
    const json = await res.json()
    const found = []
    findVideoRenderer(json.contents, found)
    if (!found.length) throw new Error('video tidak ditemukan')
    return `https://www.youtube.com/watch?v=${found[0].videoId}`
}

async function toBuffer(url, retries = 3) {
    let lastErr = null
    for (let i = 0; i < retries; i++) {
        try {
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
            return Buffer.from(res.data)
        } catch (e) {
            lastErr = e
            if (i < retries - 1) await new Promise(r => setTimeout(r, 800 * (i + 1)))
        }
    }
    throw lastErr
}

async function remuxVideoBuffer(buf) {
    const { execFile } = require('child_process')
    const { promisify } = require('util')
    const fs = require('fs/promises')
    const os = require('os')
    const path = require('path')
    const { randomUUID: uuid } = require('crypto')
    const execFileAsync = promisify(execFile)
    const inPath = path.join(os.tmpdir(), `yt_in_${uuid()}.mp4`)
    const outPath = path.join(os.tmpdir(), `yt_out_${uuid()}.mp4`)
    try {
        await fs.writeFile(inPath, buf)
        const { stdout } = await execFileAsync('ffprobe', [
            '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', inPath
        ])
        const data = JSON.parse(stdout)
        const duration = parseFloat(data?.format?.duration || '0')
        const hasAudio = (data?.streams || []).some(s => s.codec_type === 'audio')
        const args = ['-y', '-i', inPath, '-map', '0:v:0']
        if (hasAudio) args.push('-map', '0:a:0?')
        args.push('-c:v', 'copy', '-c:a', 'copy')
        if (duration > 0) args.push('-t', duration.toString())
        args.push('-avoid_negative_ts', 'make_zero', '-movflags', '+faststart', outPath)
        await execFileAsync('ffmpeg', args)
        return await fs.readFile(outPath)
    } catch {
        return buf
    } finally {
        await fs.unlink(inPath).catch(() => {})
        await fs.unlink(outPath).catch(() => {})
    }
}

async function getYoutubeDirectUrl(url, format = '360') {
    const formats = [format, '480', '720', '240', '144'].filter((v, i, a) => a.indexOf(v) === i)
    let lastError = null
    for (const fmt of formats) {
        try {
            const res = await st.download(url, fmt)
            if (res?.url) return res
        } catch (e) {
            lastError = e
        }
    }
    throw lastError || new Error('Gagal mendapatkan link download video')
}

async function downloadWithFallback(url, format) {
    try {
        return await st.download(url, format)
    } catch (e1) {
        console.warn(`[SaveTube] gagal: ${e1.message}, fallback ke QByte`)
        const res = await qbyte.download(url, format)
        return { ...res, url: null, _buffer: res.buffer }
    }
}

// tambahan: ssyoutube scraper
const SS_CONFIG = {
    BASE_URL: "https://ssyoutube.com",
    API: {
        CONVERT: "/api/convert"
    },
    SECRETS: {
        SALT: "384d5028ee4a399f6cae0175025a1708aa924fc0ccb08be1aa359cd856dd1639",
        FIXED_TS: "1765962059039"
    },
    HEADERS: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Origin": "https://ssyoutube.com",
        "Referer": "https://ssyoutube.com/"
    }
};

const ssCryptoUtils = () => {
    return {
        generateSignature: (url, timestamp) => {
            try {
                const rawString = url + timestamp + SS_CONFIG.SECRETS.SALT;
                return crypto.createHash('sha256').update(rawString).digest('hex');
            } catch (e) {
                console.error("Error generating signature:", e);
                return null;
            }
        }
    };
};

const ssUtils = ssCryptoUtils();

const ssFormatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const ssyoutube = {
    download: async (videoUrl) => {
        try {
            if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
                return { error: 'URL tidak valid. Harap gunakan URL YouTube.' };
            }

            const currentTs = Date.now().toString();
            const signature = ssUtils.generateSignature(videoUrl, currentTs);

            if (!signature) return { error: 'Gagal membuat signature keamanan.' };

            const payload = {
                'sf_url': videoUrl,
                'ts': currentTs,
                '_ts': SS_CONFIG.SECRETS.FIXED_TS,
                '_tsc': '0',
                '_s': signature
            };

            const response = await axios.post(
                SS_CONFIG.BASE_URL + SS_CONFIG.API.CONVERT,
                qs.stringify(payload), 
                { headers: SS_CONFIG.HEADERS }
            );

            const data = response.data;

            if (!data || !data.url) {
                return { error: 'Gagal mengambil data. Server mungkin memblokir request.' };
            }

            const result = {
                meta: {
                    id: data.id,
                    title: data.meta?.title,
                    duration: data.meta?.duration,
                    thumbnail: data.thumb
                },
                downloads: []
            };

            if (Array.isArray(data.url)) {
                result.downloads = data.url
                    .filter(item => !item.no_audio)
                    .map(item => ({
                        quality: item.quality || item.subname,
                        format: item.ext,
                        size: ssFormatSize(item.filesize),
                        url: item.url,
                        audio: item.audio
                    }));
            }

            return result;

        } catch (error) {
            console.error(`error download: ${error.message}`);
            if (error.response) console.error("Server Response:", error.response.data);
            return { error: error.message };
        }
    }
};
// Selesai



const pluginConfig = {
    name: 'ytplay',
    alias: ['ytp', 'youtubeplay', 'playyt', 'playyoutube'],
    category: 'search',
    description: 'Cari & putar video YouTube langsung dalam bentuk player interaktif',
    usage: '.ytplay <judul/link>',
    example: '.ytplay alan walker faded',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

const DISPLAY_WS_HOST = 'radiant-cucurucho-428266.netlify.app' //url opsional

function escapeHtmlJs(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${')
        .replace(/</g, '\\x3C')
}

function buildPlayerHtml({ title, channel, duration, videoUrl, wsUrl, displayWsHost, posterBase64 }) {
    const safeTitle = escapeHtmlJs(title)
    const safeChannel = escapeHtmlJs(channel)
    const safeDuration = escapeHtmlJs(duration)
    const safeVideoUrl = escapeHtmlJs(videoUrl)
    const safeWsUrl = escapeHtmlJs(wsUrl)
    const safeDisplayWsHost = escapeHtmlJs(displayWsHost)

    return `<style>
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;background:#090a0f;font-family:Arial,Helvetica,sans-serif;color:#fff;touch-action:manipulation;cursor:pointer}
input[type=range]{width:100%;height:4px;accent-color:#fff;cursor:pointer}
.player-wrap{width:100%;max-width:440px;margin:auto;padding:12px}
.player{position:relative;overflow:hidden;background:#111318;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.55)}
.bg{position:absolute;inset:-25px;background-position:center;background-size:cover;filter:blur(22px);opacity:.38;transform:scale(1.15);pointer-events:none}
.bg-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,10,.35),rgba(5,6,10,.72));pointer-events:none}
.content{position:relative;padding:18px;z-index:2}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}
.top-title{font-size:13px;font-weight:700;letter-spacing:.8px;opacity:.85}
.top-sub{font-size:10px;opacity:.5;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
.icon-btn{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0}
.icon-btn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.video-frame{position:relative;width:100%;aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:#000;box-shadow:0 12px 35px rgba(0,0,0,.45);cursor:pointer}
.video-frame video{width:100%;height:100%;display:block;background:#000;object-fit:contain}
.big-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.18);transition:opacity .2s;z-index:3}
.big-btn{width:64px;height:64px;border:0;border-radius:50%;background:#fff;color:#08090d;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.big-btn svg{width:26px;height:26px;fill:currentColor;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.frame-playing .big-play{opacity:0;pointer-events:none}
.info{padding-top:15px}
.song-title{font-size:19px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.artist{font-size:13px;opacity:.6;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.progress{margin-top:18px}
.times{display:flex;justify-content:space-between;font-size:10px;opacity:.55;margin-top:7px}
.controls{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:13px}
.side-btn{width:38px;height:38px;border:0;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;padding:0;opacity:.8}
.side-btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.bottom{display:flex;align-items:center;justify-content:space-between;margin-top:15px;gap:12px}
.bottom-left,.bottom-right{display:flex;align-items:center;gap:9px}
.volume{width:85px}
.debug-wrap{margin-top:12px;background:#111318;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px;font-family:monospace}
.debug-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.debug-title{font-size:11px;font-weight:700;letter-spacing:.8px;opacity:.85}
.debug-state{font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:rgba(255,255,255,.08);color:#ffd166;letter-spacing:.5px}
.debug-server{font-size:9px;opacity:.5;word-break:break-all;margin-bottom:8px;line-height:1.4}
.debug-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.debug-cell{background:rgba(255,255,255,.05);border-radius:8px;padding:6px 8px}
.debug-cell span{display:block;font-size:8px;opacity:.5;letter-spacing:.5px}
.debug-cell b{display:block;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.debug-bar{height:4px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:8px}
.debug-bar-fill{height:100%;width:0;background:linear-gradient(90deg,#4cc9f0,#7bff9f);transition:width .3s}
.debug-log{height:110px;overflow-y:auto;background:rgba(0,0,0,.35);border-radius:8px;padding:6px 8px;font-size:9px;line-height:1.6;color:rgba(255,255,255,.75);word-break:break-all;-webkit-overflow-scrolling:touch}
.log-line{white-space:pre-wrap}
</style>

<body>
<div class="player-wrap">
<div class="player">
<div class="bg" id="background"></div>
<div class="bg-overlay"></div>
<div class="content">
<div class="top">
<div>
<div class="top-title" id="playlistTitle">NOW PLAYING VIDEO</div>
<div class="top-sub" id="playlistSub">${safeTitle}</div>
</div>
<button class="icon-btn" type="button" onclick="toggleMute()" id="muteButton">
<svg id="volumeIcon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M19 9a5 5 0 0 1 0 6"></path><path d="M16 6.5a9 9 0 0 1 0 11"></path></svg>
</button>
</div>
<div class="video-frame" id="videoFrame" onclick="toggleVideo()">
<video id="videoPlayer" playsinline webkit-playsinline preload="none" poster="${posterBase64}"></video>
<div class="big-play" id="bigPlay">
<button class="big-btn" type="button" onclick="event.stopPropagation();toggleVideo()">
<svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
<svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M7 5v14"></path><path d="M17 5v14"></path></svg>
</button>
</div>
</div>
<div class="info">
<div class="song-title" id="songTitle">Unknown Video</div>
<div class="artist" id="artist">Unknown Channel</div>
</div>
<div class="progress">
<input id="progress" type="range" min="0" max="100" value="0" step="0.1" oninput="seekVideo(this.value)">
<div class="times"><span id="currentTime">0:00</span><span id="duration">0:00</span></div>
</div>
<div class="controls">
<button class="side-btn" type="button" onclick="previousVideo()"><svg viewBox="0 0 24 24"><path d="M19 20 9 12l10-8v16z"></path><path d="M5 19V5"></path></svg></button>
<button class="side-btn" type="button" onclick="toggleVideo()">
<svg id="smallPlayIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
<svg id="smallPauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M7 5v14"></path><path d="M17 5v14"></path></svg>
</button>
<button class="side-btn" type="button" onclick="nextVideo()"><svg viewBox="0 0 24 24"><path d="m5 4 10 8-10 8V4z"></path><path d="M19 5v14"></path></svg></button>
</div>
<div class="bottom">
<div class="bottom-left">
<button class="icon-btn" type="button" onclick="toggleRepeat()" id="repeatButton">
<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path></svg>
</button>
</div>
<div class="bottom-right">
<button class="icon-btn" type="button" onclick="toggleMute()"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="m19 9-5 6"></path><path d="m14 9 5 6"></path></svg></button>
<input class="volume" id="volume" type="range" min="0" max="1" step="0.01" value="1" oninput="changeVolume(this.value)">
</div>
</div>
</div>
</div>

<div class="debug-wrap">
<div class="debug-head"><div class="debug-title">WEBSOCKET VIDEO</div><div class="debug-state" id="wsState">CONNECTING</div></div>
<div class="debug-server" id="wsServer">-</div>
<div class="debug-grid">
<div class="debug-cell"><span>MIME</span><b id="dbgMime">-</b></div>
<div class="debug-cell"><span>Downloaded</span><b id="dbgDownloaded">0.00 MB</b></div>
<div class="debug-cell"><span>Total</span><b id="dbgTotal">-</b></div>
<div class="debug-cell"><span>Progress</span><b id="dbgProgress">0%</b></div>
<div class="debug-cell"><span>Chunks</span><b id="dbgChunks">0</b></div>
<div class="debug-cell"><span>Loop</span><b id="dbgLoop">OFF</b></div>
</div>
<div class="debug-bar"><div class="debug-bar-fill" id="dbgBarFill"></div></div>
<div class="debug-log" id="debugLog"></div>
</div>
</div>

<script>
window.VIDEO_CONFIG = {
    title: "${safeTitle}",
    channel: "${safeChannel}",
    duration: "${safeDuration}",
    videoUrl: "${safeVideoUrl}",
    wsUrl: "${safeWsUrl}",
    displayWsHost: "${safeDisplayWsHost}",
    autoplay: false,
    volume: 0.8,
    loop: false
};

var video = document.getElementById("videoPlayer");
var frame = document.getElementById("videoFrame");
var songTitle = document.getElementById("songTitle");
var artist = document.getElementById("artist");
var progress = document.getElementById("progress");
var currentTime = document.getElementById("currentTime");
var durationLabel = document.getElementById("duration");
var volume = document.getElementById("volume");
var smallPlayIcon = document.getElementById("smallPlayIcon");
var smallPauseIcon = document.getElementById("smallPauseIcon");
var repeatButton = document.getElementById("repeatButton");
var playlistSub = document.getElementById("playlistSub");
var background = document.getElementById("background");

var isLoop = false;
var userPressed = false;
var config = window.VIDEO_CONFIG || {};

songTitle.textContent = config.title || "Unknown Video";
artist.textContent = config.channel || "Unknown Channel";
playlistSub.textContent = config.title || "Unknown Video";

if (video.poster && background) background.style.backgroundImage = "url('" + video.poster + "')";
if (config.volume !== undefined) { video.volume = config.volume; volume.value = config.volume; }

isLoop = config.loop || false;
video.loop = isLoop;
updateLoopStatus();

function formatTime(seconds) {
    if (!isFinite(seconds)) return "0:00";
    var min = Math.floor(seconds / 60);
    var sec = Math.floor(seconds % 60);
    if (sec < 10) sec = "0" + sec;
    return min + ":" + sec;
}

function updateUI() {
    if (video.paused) {
        smallPlayIcon.style.display = "block"; smallPauseIcon.style.display = "none";
        frame.classList.remove("frame-playing");
    } else {
        smallPlayIcon.style.display = "none"; smallPauseIcon.style.display = "block";
        frame.classList.add("frame-playing");
    }
}

function playVideo() {
    var result = video.play();
    if (result && result.catch) result.catch(function() {});
    updateUI();
}

function toggleVideo() {
    if (video.paused) { if (!video.src) userPressed = true; playVideo(); }
    else { userPressed = false; video.pause(); }
    updateUI();
}

function previousVideo() { if (!isFinite(video.duration)) return; video.currentTime = Math.max(0, video.currentTime - 10); }
function nextVideo() { if (!isFinite(video.duration)) return; video.currentTime = Math.min(video.duration, video.currentTime + 10); }
function seekVideo(value) { if (!isFinite(video.duration)) return; video.currentTime = (Number(value) / 100) * video.duration; }
function changeVolume(value) { video.volume = Number(value); if (video.volume > 0) video.muted = false; }
function toggleMute() { video.muted = !video.muted; }

function toggleRepeat() {
    isLoop = !isLoop; video.loop = isLoop;
    repeatButton.style.opacity = isLoop ? "1" : ".55";
    repeatButton.title = isLoop ? "Loop ON" : "Loop OFF";
    updateLoopStatus();
}
function updateLoopStatus() { var el = document.getElementById("dbgLoop"); if (el) el.textContent = isLoop ? "ON" : "OFF"; }

video.addEventListener("loadedmetadata", function() { durationLabel.textContent = formatTime(video.duration); });
video.addEventListener("timeupdate", function() {
    if (!isFinite(video.duration)) return;
    progress.value = (video.currentTime / video.duration) * 100;
    currentTime.textContent = formatTime(video.currentTime);
    durationLabel.textContent = formatTime(video.duration);
});
video.addEventListener("play", updateUI);
video.addEventListener("pause", updateUI);
video.addEventListener("ended", function() {
    if (!isLoop) { progress.value = 0; currentTime.textContent = "0:00"; video.currentTime = 0; }
    updateUI();
});

var wsVideo = null, wsChunks = [], wsDownloaded = 0, wsTotal = null, wsMime = "video/mp4";
var wsObjectUrl = null, wsDone = false, wsLastLog = 0;

function fmtSize(bytes) {
    if (!isFinite(bytes)) return "0 B";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
}
function setWsState(state) { var el = document.getElementById("wsState"); if (el) el.textContent = state; }
function writeLog(line) {
    var box = document.getElementById("debugLog"); if (!box) return;
    var div = document.createElement("div"); div.className = "log-line"; div.textContent = line;
    box.appendChild(div);
    while (box.childNodes.length > 80) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
}
function updateWsProgress() {
    var el = document.getElementById("dbgDownloaded"); if (el) el.textContent = fmtSize(wsDownloaded);
    if (wsTotal !== null && wsTotal > 0) {
        var pct = Math.min(100, (wsDownloaded / wsTotal) * 100);
        el = document.getElementById("dbgTotal"); if (el) el.textContent = fmtSize(wsTotal);
        el = document.getElementById("dbgProgress"); if (el) el.textContent = pct.toFixed(1) + "%";
        el = document.getElementById("dbgBarFill"); if (el) el.style.width = pct.toFixed(1) + "%";
    }
    el = document.getElementById("dbgChunks"); if (el) el.textContent = String(wsChunks.length);
}
function finishWsDownload(cfg) {
    if (wsDone) return; wsDone = true;
    setWsState("COMPLETE"); writeLog("Download complete");
    var blob = new Blob(wsChunks, { type: wsMime || "video/mp4" });
    writeLog("Blob created (" + fmtSize(blob.size) + ")");
    if (wsObjectUrl) URL.revokeObjectURL(wsObjectUrl);
    wsObjectUrl = URL.createObjectURL(blob);
    writeLog("Video source attached");
    video.src = wsObjectUrl; video.load();
    writeLog("Player ready");
    if (wsVideo) { try { wsVideo.close(); } catch (e) {} }
    wsChunks = [];
    if (cfg.autoplay || userPressed) setTimeout(function() { playVideo(); }, 300);
}
function startVideoStream(cfg) {
    var videoUrl = cfg.videoUrl || "";
    var wsUrl = cfg.wsUrl || "";
    if (!wsUrl && videoUrl) wsUrl = "wss://stream.kanara.my.id/?url=" + encodeURIComponent(videoUrl);

    var serverEl = document.getElementById("wsServer");
    if (serverEl) { serverEl.textContent = cfg.displayWsHost || "-"; }

    if (!wsUrl) { setWsState("ERROR"); writeLog("No video URL tersedia"); return; }
    if (typeof WebSocket === "undefined") { setWsState("ERROR"); writeLog("WebSocket API tidak tersedia"); return; }
    writeLog("Connecting..."); setWsState("CONNECTING");
    wsVideo = new WebSocket(wsUrl);
    wsVideo.binaryType = "arraybuffer";
    wsVideo.onopen = function() { writeLog("WebSocket OPEN"); setWsState("CONNECTED"); };
    wsVideo.onmessage = function(event) {
        if (typeof event.data === "string") {
            var message = null;
            try { message = JSON.parse(event.data); } catch (e) {}
            if (!message) return;
            if (message.type === "start") {
                wsMime = message.mime || "video/mp4";
                if (message.contentLength !== undefined && message.contentLength !== null) wsTotal = Number(message.contentLength);
                else if (message.length !== undefined && message.length !== null) wsTotal = Number(message.length);
                var mimeEl = document.getElementById("dbgMime"); if (mimeEl) mimeEl.textContent = wsMime;
                writeLog("START | MIME: " + wsMime);
                if (wsTotal !== null && wsTotal > 0) writeLog("Size: " + fmtSize(wsTotal));
                setWsState("DOWNLOADING"); updateWsProgress();
                return;
            }
            if (message.type === "end") { writeLog("END"); finishWsDownload(config); return; }
            if (message.type === "error") { writeLog("Server error: " + (message.message || "unknown")); setWsState("ERROR"); return; }
            return;
        }
        wsChunks.push(event.data);
        var bytes = event.data.byteLength || 0;
        wsDownloaded += bytes;
        var now = Date.now();
        if (now - wsLastLog > 400) { wsLastLog = now; writeLog("Binary chunk: " + fmtSize(bytes)); }
        updateWsProgress();
    };
    wsVideo.onerror = function() { writeLog("WebSocket error"); setWsState("ERROR"); };
    wsVideo.onclose = function(event) {
        if (wsDone) { setWsState("COMPLETE"); return; }
        writeLog("WebSocket closed unexpectedly");
        writeLog("Code: " + event.code + " Reason: " + (event.reason || "-"));
        setWsState("CLOSED");
    };
    window.addEventListener("beforeunload", function() {
        if (wsVideo) { try { wsVideo.close(); } catch (e) {} }
        if (wsObjectUrl) URL.revokeObjectURL(wsObjectUrl);
    });
}
startVideoStream(config);
</script>`
}

// ============ FUNGSI KIRIM PESAN KEK PLAY3 (CUMA CARA NGIRIMNYA DOANG) ============
async function sendVideoPlayer(sock, m, html) {
    const responseId = randomUUID()

    await sock.relayMessage(
        m.chat,
        {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    messageDisclaimerText: '',
                    botResponseId: responseId
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: 'Zero Video Player' }],
                        unifiedResponse: {
                            data: Buffer.from(
                                JSON.stringify({
                                    response_id: responseId,
                                    sections: [
                                        {
                                            view_model: {
                                                primitive: {
                                                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                                    payload: html,
                                                    trusted_sources: []
                                                },
                                                __typename: 'GenAISingleLayoutViewModel'
                                            }
                                        }
                                    ]
                                })
                            ).toString('base64')
                        },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        },
        { messageId: responseId }
    )
}

async function handler(m, { sock }) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(
            `📦 *ʏᴛᴘʟᴀʏ ᴘʟᴜɢɪɴ* 🎤\n\n` +
            `> Ai butuh judul atau link YouTube dulu dong~ ✨\n\n` +
            `> ${m.prefix}ytplay <judul/link>\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${m.prefix}ytplay alan walker faded\n` +
            `> ${m.prefix}ytp https://youtu.be/xxxxx`
        )
    }

    await m.react('🕕')

    try {
        const youtubeUrl = await searchYoutube(query)
        if (!youtubeUrl) throw new Error('Video YouTube tidak ditemukan.')

        const info = await getYoutubeDirectUrl(youtubeUrl, '360')
        if (!info?.url) throw new Error('Gagal mendapatkan direct link video.')

        let posterBase64 = ''
        if (info.thumb) {
            try {
                const thumbRes = await axios.get(info.thumb, { responseType: 'arraybuffer', timeout: 10000 })
                posterBase64 = 'data:image/jpeg;base64,' + Buffer.from(thumbRes.data).toString('base64')
            } catch {
                posterBase64 = ''
            }
        }

        const wsUrl = 'wss://stream.kanara.my.id/?url=' + encodeURIComponent(info.url)
        const duration = info.duration
            ? `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`
            : ''

        const htmlPayload = buildPlayerHtml({
            title: info.title || 'YouTube Video',
            channel: info.author || 'YouTube',
            duration,
            videoUrl: info.url,
            wsUrl,
            displayWsHost: DISPLAY_WS_HOST,
            posterBase64
        })

        // ============ PAKAI sendVideoPlayer KAYAK PLAY3 ============
        await sendVideoPlayer(sock, m, htmlPayload)

        await m.react('✅')
    } catch (error) {
        console.error('[ytplay] Error:', error)
        await m.react('❌')
        return m.reply(`❌ *ᴀᴅᴜʜ, ɢᴀɢᴀʟ ᴘᴜᴛᴇʀ ᴠɪᴅᴇᴏɴʏᴀ*\n\n> ${error.message}\n\n> Coba judul/link lain ya~`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}