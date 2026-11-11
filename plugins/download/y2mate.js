const config = {
    name: 'y2mate',
    alias: ['y2', 'y2download', 'youtubedl'],
    category: 'download',
    description: 'Download video/audio dari YouTube via Y2Mate',
    usage: '.y2mate <url> [mp3|mp4] [kualitas]',
    example: '.y2mate https://youtu.be/xxx mp3 128kbps',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')

const BASE_URL = "https://id-y2mate.com"
const MAX_TOTAL_TIME = 58000
const POLL_LIMIT = 55
const POLL_DELAY = 1000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function cleanText(text) {
    return String(text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
}

function compactAvailable(links) {
    const result = {}
    
    for (const [type, group] of Object.entries(links || {})) {
        for (const [id, item] of Object.entries(group || {})) {
            const format = item.f || type
            let quality = item.q || id
            
            if (id.includes("@")) {
                quality = id
            }
            
            if (format === "m4a" && quality === ".m4a") {
                quality = cleanText(item.q_text).replace(".m4a", "").replace(/[()]/g, "").trim() || "256kbps"
            }
            
            if (!result[format]) result[format] = []
            if (!result[format].includes(quality)) result[format].push(quality)
        }
    }
    
    return result
}

function pickFormat(links, type, quality) {
    const group = links?.[type]
    if (!group) return null
    
    const entries = Object.entries(group).map(([id, data]) => ({
        id,
        ...data
    }))
    
    return entries.find(v => v.q === quality || v.id === quality || v.f === type && v.q === quality) || 
           entries.find(v => v.q === "auto") || 
           entries[0] || 
           null
}

function findDownloadUrl(data) {
    if (!data) return null
    
    if (typeof data === "string") {
        const match = data.match(/https?:\/\/[^\s"'<>]+/i)
        return match ? match[0].replace(/\\\//g, "/") : null
    }
    
    if (typeof data !== "object") return null
    
    const keys = ["dlink", "download", "download_url", "url", "link", "result", "result_url", "file", "href"]
    
    for (const key of keys) {
        if (typeof data[key] === "string" && /^https?:\/\//i.test(data[key])) {
            return data[key].replace(/\\\//g, "/")
        }
    }
    
    for (const value of Object.values(data)) {
        const found = findDownloadUrl(value)
        if (found) return found
    }
    
    return null
}

async function y2mateDownload(url, type = 'mp3', quality = '128kbps') {
    const startedAt = Date.now()
    const jar = new CookieJar()
    
    const api = wrapper(axios.create({
        jar,
        withCredentials: true,
        timeout: 20000,
        validateStatus: () => true,
        headers: {
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
            "accept": "*/*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "origin": BASE_URL,
            "referer": `${BASE_URL}/`,
            "x-requested-with": "XMLHttpRequest",
            "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": `"Android"`
        }
    }))
    
    function elapsed() {
        return Date.now() - startedAt
    }
    
    function timeoutReached() {
        return elapsed() >= MAX_TOTAL_TIME
    }
    
    try {
        await api.get(`${BASE_URL}/`, {
            timeout: 15000,
            headers: { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
        })
        
        if (timeoutReached()) throw new Error("Timeout setelah load home")
        
        const body = new URLSearchParams({
            k_query: url,
            k_page: "home",
            hl: "en",
            q_auto: "0"
        })
        
        const analyzeRes = await api.post(`${BASE_URL}/mates/analyzeV2/ajax`, body.toString(), {
            timeout: 20000,
            headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
        })
        
        if (analyzeRes.status !== 200 || analyzeRes.data?.status !== "ok") {
            return { success: false, error: analyzeRes.data }
        }
        
        const detail = analyzeRes.data
        const selected = pickFormat(detail.links, type, quality)
        
        if (!selected?.k) {
            return {
                success: false,
                error: `Format ${type} ${quality} tidak ditemukan`,
                available: compactAvailable(detail.links)
            }
        }
        
        const convertBody = new URLSearchParams({
            vid: detail.vid,
            k: selected.k
        })
        
        const convertRes = await api.post(`${BASE_URL}/mates/convertV2/index`, convertBody.toString(), {
            timeout: 20000,
            headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
        })
        
        let resultUrl = findDownloadUrl(convertRes.data)
        let pollRaw = null
        
        if (!resultUrl && convertRes.data?.b_id && !timeoutReached()) {
            for (let i = 0; i < POLL_LIMIT; i++) {
                if (timeoutReached()) break
                
                const pollBody = new URLSearchParams({ b_id: convertRes.data.b_id })
                const pollRes = await api.post(`${BASE_URL}/mates/convertV2/pool`, pollBody.toString(), {
                    timeout: 10000,
                    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
                })
                
                const url = findDownloadUrl(pollRes.data)
                if (url) {
                    resultUrl = url
                    break
                }
                
                if (pollRes.data?.c_status === "FAILED" || pollRes.data?.status === "error") {
                    break
                }
                
                if (timeoutReached()) break
                await sleep(POLL_DELAY)
            }
        }
        
        return {
            success: Boolean(resultUrl),
            title: detail.title || null,
            duration: detail.t || null,
            type: type,
            quality: selected.q || quality,
            format: selected.f || null,
            size: selected.size || null,
            resultUrl: resultUrl,
            timeMs: elapsed(),
            available: compactAvailable(detail.links)
        }
        
    } catch (error) {
        return { success: false, error: error.message }
    }
}

async function downloadFile(url, outputDir, fileName) {
    fs.mkdirSync(outputDir, { recursive: true })
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 180000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        }
    })
    
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const output = path.join(outputDir, safeFileName)
    const writer = fs.createWriteStream(output)
    response.data.pipe(writer)
    
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, file: output, fileName: safeFileName }))
        writer.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const url = args[0]
    let type = (args[1] || 'mp3').toLowerCase()
    let quality = args[2] || (type === 'mp3' ? '128kbps' : '360p')
    
    if (!url) {
        return m.reply(`🎵 *ʏ2ᴍᴀᴛᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> Download video/audio dari YouTube via Y2Mate\n\n> Contoh:\n> • .y2mate https://youtu.be/xxx mp3 128kbps\n> • .y2mate https://youtu.be/xxx mp4 360p\n> • .y2mate https://youtu.be/xxx\n\n📝 *Kualitas audio:*\n> 64kbps, 128kbps, 192kbps, 320kbps\n\n📝 *Kualitas video:*\n> 360p, 480p, 720p, 1080p`)
    }
    
    if (!url.includes('youtu') && !url.includes('youtube.com')) {
        return m.reply(`❌ *URL tidak valid!*\n\n> Pastikan URL dari YouTube.\n> Contoh: https://youtu.be/xxx atau https://youtube.com/watch?v=xxx`)
    }
    
    if (!['mp3', 'mp4'].includes(type)) {
        return m.reply(`❌ *Tipe tidak valid!*\n\n> Gunakan mp3 atau mp4.\n> Contoh: .y2mate url mp3 128kbps`)
    }
    
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏꜱᴇꜱ ʟɪɴᴋ YᴏᴜTᴜʙᴇ...*\n\n🎬 *Tipe:* ${type.toUpperCase()}\n📊 *Kualitas:* ${quality}\n🕐 *Mohon tunggu 30-60 detik, Darling~*`)
    
    const result = await y2mateDownload(url, type, quality)
    
    if (!result.success) {
        let errorMsg = `❌ *GAGAL DOWNLOAD*\n\n`
        errorMsg += `> ${result.error || 'Unknown error'}\n\n`
        
        if (result.available) {
            errorMsg += `📋 *Kualitas tersedia:*\n`
            for (const [fmt, quals] of Object.entries(result.available)) {
                errorMsg += `> • ${fmt.toUpperCase()}: ${quals.join(', ')}\n`
            }
            errorMsg += `\n> 💡 Coba gunakan kualitas yang tersedia di atas, Darling~\n`
        }
        
        errorMsg += `\n> Coba lagi nanti dengan kualitas lain, Darling~`
        return m.reply(errorMsg)
    }
    
    let infoTxt = `🎵 *ʏ2ᴍᴀᴛᴇ ʀᴇꜱᴜʟᴛ*\n\n`
    infoTxt += `╭──〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ* 〕───⬣\n`
    infoTxt += `│  🎤 Judul: *${result.title || 'Tidak diketahui'}*\n`
    if (result.duration) infoTxt += `│  ⏱️ Durasi: ${result.duration}\n`
    infoTxt += `│  🎬 Tipe: ${result.type.toUpperCase()}\n`
    infoTxt += `│  📊 Kualitas: ${result.quality}\n`
    if (result.size) infoTxt += `│  💾 Ukuran: ${result.size}\n`
    infoTxt += `╰────────────────⬣\n\n`
    
    if (result.resultUrl) {
        infoTxt += `⏳ *Mendownload file...*`
        await m.reply(infoTxt)
        
        const tempDir = path.join(process.cwd(), 'temp', 'y2mate')
        const extension = type === 'mp3' ? 'mp3' : 'mp4'
        const fileName = `${result.title?.slice(0, 50) || 'download'}_${Date.now()}.${extension}`
        
        try {
            const downloadResult = await downloadFile(result.resultUrl, tempDir, fileName)
            
            if (downloadResult.success && fs.existsSync(downloadResult.file)) {
                const fileBuffer = fs.readFileSync(downloadResult.file)
                const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2)
                
                if (type === 'mp3') {
                    await sock.sendMessage(m.chat, {
                        audio: fileBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: downloadResult.fileName,
                        caption: `✅ *ᴅᴏᴡɴʟᴏᴀᴅ ꜱᴇʟᴇꜱᴀɪ!*\n\n🎤 ${result.title || 'Audio'}\n📊 ${result.quality}\n💾 ${fileSizeMB} MB`
                    })
                } else {
                    await sock.sendMessage(m.chat, {
                        video: fileBuffer,
                        caption: `✅ *ᴅᴏᴡɴʟᴏᴀᴅ ꜱᴇʟᴇꜱᴀɪ!*\n\n🎬 ${result.title || 'Video'}\n📊 ${result.quality}\n💾 ${fileSizeMB} MB`
                    })
                }
                
                fs.unlinkSync(downloadResult.file)
            } else {
                await m.reply(`✅ *Link berhasil didapatkan!*\n\n🔗 ${result.resultUrl}\n\n> 💡 Download manual melalui link di atas, Darling~`)
            }
        } catch (downloadError) {
            await m.reply(`✅ *Link berhasil didapatkan!*\n\n🔗 ${result.resultUrl}\n\n> ⚠️ Gagal mengunduh file: ${downloadError.message}\n> 💡 Download manual melalui link di atas, Darling~`)
        }
    } else {
        await m.reply(infoTxt)
    }
}

module.exports = {
    config,
    handler
}