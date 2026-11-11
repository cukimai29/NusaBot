const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'aio2',
    alias: ['alldl2', 'downloadall2', 'aio2dl'],
    category: 'downloader',
    description: 'Download video dari berbagai platform (TikTok, IG, FB, Twitter, dll)',
    usage: '.aio2 <url>',
    example: '.aio2 https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const BASE = "https://downr.org"
const ANALYTICS = `${BASE}/.netlify/functions/analytics`
const DOWNLOAD = `${BASE}/.netlify/functions/download`
const NYT = `${BASE}/.netlify/functions/nyt`

const UA = "Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36"

function parseCookie(setCookie = []) {
    return setCookie.map(v => v.split(";")[0]).join("; ")
}

function parseData(data) {
    if (typeof data !== "string") return data
    const text = data.trim()
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

function isOk(status, data) {
    const isObject = data && typeof data === "object"
    if (status < 200 || status >= 300) return false
    if (data === null || data === undefined) return false
    if (data === "") return false
    if (data === "error") return false
    if (data === "failed") return false
    if (data === "user_retry_required") return false
    if (isObject && data.error === true) return false
    if (isObject && data.status === false) return false
    if (isObject && data.success === false) return false
    return true
}

function getError(data, status) {
    if (typeof data === "string") return data || `HTTP ${status}`
    if (data && typeof data === "object") return data.message || data.error || data.status || data.reason || `HTTP ${status}`
    return `HTTP ${status}`
}

async function getCookie() {
    const res = await axios.get(ANALYTICS, {
        timeout: 30000,
        validateStatus: () => true,
        responseType: "text",
        transformResponse: [v => v],
        headers: {
            accept: "*/*",
            referer: `${BASE}/`,
            "user-agent": UA
        }
    })
    return parseCookie(res.headers["set-cookie"] || [])
}

async function postEndpoint(endpoint, url, cookie = "") {
    const res = await axios.post(endpoint, { url }, {
        timeout: 120000,
        validateStatus: () => true,
        responseType: "text",
        transformResponse: [v => v],
        headers: {
            accept: "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            cookie,
            origin: BASE,
            referer: `${BASE}/`,
            "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": UA
        }
    })
    return {
        endpoint,
        status: res.status,
        data: parseData(res.data)
    }
}

async function tryDownload(url) {
    let cookie = await getCookie()
    let result = await postEndpoint(DOWNLOAD, url, cookie)
    if (isOk(result.status, result.data)) return result
    
    cookie = await getCookie()
    result = await postEndpoint(DOWNLOAD, url, cookie)
    if (isOk(result.status, result.data)) return result
    
    result = await postEndpoint(NYT, url, cookie)
    return result
}

async function downr(url) {
    try {
        if (!url || !/^https?:\/\//i.test(url)) {
            throw new Error("Invalid url.")
        }
        const result = await tryDownload(url)
        const ok = isOk(result.status, result.data)
        return {
            Status: ok,
            Code: result.status,
            Input: url,
            Endpoint: result.endpoint,
            Result: ok ? result.data : null,
            Error: ok ? null : getError(result.data, result.status)
        }
    } catch (err) {
        return {
            Status: false,
            Code: err.response?.status || 500,
            Input: url || null,
            Endpoint: null,
            Result: null,
            Error: err.message
        }
    }
}

async function handler(m, { sock }) {
    const url = m.args[0] || m.text
    
    if (!url) {
        return m.reply(
            `💕 *ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴠ2* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}aio2 <url>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}aio2 https://vt.tiktok.com/xxx\n` +
            `┃   ${m.prefix}aio2 https://instagram.com/p/xxx\n` +
            `┃   ${m.prefix}aio2 https://facebook.com/xxx\n` +
            `┃   ${m.prefix}aio2 https://twitter.com/xxx\n` +
            `┃\n` +
            `┃ ✦ *Support*\n` +
            `┃   TikTok, Instagram, Facebook,\n` +
            `┃   Twitter, YouTube Shorts, dll\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau download apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...*\n\n💗 *Zero Two:* Lagi ambil videonya darling~ tunggu sebentar yaa 🎬`)
    
    try {
        const result = await downr(url)
        
        if (!result.Status) {
            m.react('💔')
            return m.reply(
                `💔 *ɢᴀɢᴀʟ*\n\n` +
                `> ${result.Error}\n\n` +
                `> Coba cek link nya darling~ 🥺`
            )
        }
        
        const data = result.Result
        let videoUrl = null
        let caption = ''
        
        if (data && typeof data === 'object') {
            if (data.video) videoUrl = data.video
            else if (data.url) videoUrl = data.url
            else if (data.download) videoUrl = data.download
            else if (data.hd) videoUrl = data.hd
            else if (data.sd) videoUrl = data.sd
            else if (Array.isArray(data) && data.length > 0) {
                const found = data.find(v => v.type === 'video' || v.quality === 'hd' || v.quality === 'sd')
                videoUrl = found?.url || found?.link || data[0]?.url
            }
            
            caption = data.title || data.desc || data.description || ''
            if (caption.length > 100) caption = caption.substring(0, 100) + '...'
        }
        
        if (!videoUrl) {
            m.react('💔')
            return m.reply(
                `💔 *ɢᴀɢᴀʟ*\n\n` +
                `> Video url tidak ditemukan dalam response\n\n` +
                `> ${JSON.stringify(data).substring(0, 200)}\n\n` +
                `> Coba link lain darling~ 🥺`
            )
        }
        
        const videoRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        })
        
        await sock.sendMessage(m.chat, {
            video: Buffer.from(videoRes.data),
            caption: `💕 *ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴠ2* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 🔗 *ʟɪɴᴋ*: ${url.length > 40 ? url.substring(0, 40) + '...' : url}\n` +
                    (caption ? `┃ 📝 *ᴛɪᴛʟᴇ*: ${caption}\n` : '') +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini dia videonya darling~ 🎥\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`,
            mimetype: 'video/mp4'
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[AIO2] Error:', err)
        m.react('💔')
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> ${err.message}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}