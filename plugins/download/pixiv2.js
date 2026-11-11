const config = {
    name: 'pixiv2',
    alias: ['pixivdl', 'pixivsearch', 'pixiv', 'pixivart'],
    category: 'download',
    description: 'Cari dan download artwork dari Pixiv',
    usage: '.pixiv2 <query>',
    example: '.pixiv2 Hinata Hyuga',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

const axios = require("axios")
const { CookieJar } = require("tough-cookie")
const { wrapper } = require("axios-cookiejar-support")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const BASE_URL = "https://www.pixiv.net"
const AVAILABLE_TYPES = ["artworks", "novels"]

const jar = new CookieJar()

const api = wrapper(axios.create({
    baseURL: BASE_URL,
    jar,
    withCredentials: true,
    timeout: 60000,
    validateStatus: () => true,
    decompress: true,
    headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": `"Android"`
    }
}))

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function shouldRetryStatus(code) {
    return code === 408 || code === 429 || code === 500 || code === 502 || code === 503 || code === 504
}

function decodeText(text) {
    return String(text || "")
        .replace(/\\\//g, "/")
        .replace(/&quot;/g, "\"")
        .replace(/&#34;/g, "\"")
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
}

function cleanText(text) {
    return decodeText(text)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim()
}

function safeNumber(value) {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
}

function normalizeImage(url) {
    if (!url) return null
    return String(url).replace(/\\\//g, "/")
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return []
    return tags.map(tag => {
        if (typeof tag === "string") return tag
        return tag?.translation?.en || tag?.translation || tag?.tag_translation || tag?.tag || tag?.name || tag?.romaji || null
    }).filter(Boolean)
}

function joinTags(tags, max = 15) {
    if (!Array.isArray(tags) || !tags.length) return null
    return tags.slice(0, max).join(", ")
}

async function req(method, url, headers = {}) {
    try {
        const res = await api.request({
            method,
            url,
            headers
        })
        return {
            Status: res.status >= 200 && res.status < 300,
            Code: res.status,
            Data: res.data
        }
    } catch (error) {
        return {
            Status: false,
            Code: error.response?.status || 500,
            Error: error.message
        }
    }
}

async function getHome() {
    return req("GET", `/?lang=en`, {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "upgrade-insecure-requests": "1"
    })
}

async function searchPixiv(type, query, page) {
    const params = new URLSearchParams({
        word: query,
        order: "date_d",
        mode: "all",
        p: String(page),
        s_mode: "s_tag",
        type: "all",
        lang: "en"
    })
    
    return req("GET", `/ajax/search/${type}/${encodeURIComponent(query)}?${params.toString()}`, {
        accept: "application/json",
        referer: `${BASE_URL}/en/tags/${encodeURIComponent(query)}`,
        "x-requested-with": "XMLHttpRequest"
    })
}

async function getArtworkDetail(id) {
    const detail = await req("GET", `/ajax/illust/${id}`, {
        accept: "application/json",
        referer: `${BASE_URL}/en/artworks/${id}`,
        "x-requested-with": "XMLHttpRequest"
    })
    
    const pages = await req("GET", `/ajax/illust/${id}/pages`, {
        accept: "application/json",
        referer: `${BASE_URL}/en/artworks/${id}`,
        "x-requested-with": "XMLHttpRequest"
    })
    
    return {
        Detail: detail.Status && detail.Data?.body ? detail.Data.body : null,
        Pages: pages.Status && Array.isArray(pages.Data?.body) ? pages.Data.body : []
    }
}

async function downloadImage(url, id, page, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true })
    
    try {
        const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 60000,
            validateStatus: () => true,
            headers: {
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
                "referer": BASE_URL + "/",
                "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }
        })
        
        if (res.status < 200 || res.status >= 300) {
            return { success: false, statusCode: res.status }
        }
        
        const ext = path.extname(url).split('?')[0] || '.jpg'
        const filename = `${id}_p${page}_${Date.now()}${ext}`
        const filepath = path.join(outputDir, filename)
        
        fs.writeFileSync(filepath, Buffer.from(res.data))
        
        return {
            success: true,
            filepath: filepath,
            filename: filename,
            size: Buffer.byteLength(res.data)
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const query = args.join(' ')
    
    if (!query) {
        return m.reply(`🎨 *ᴘɪxɪᴠ ᴀʀᴛᴡᴏʀᴋ ꜱᴇᴀʀᴄʜ*\n\n> Cari dan download artwork dari Pixiv\n\n> Contoh: .pixiv2 Hinata Hyuga\n> Contoh: .pixiv2 Naruto\n\n📝 *Info:*\n> • Mengambil 1 artwork random dari hasil pencarian\n> • Premium user bisa download gambar\n> • Proses 10-30 detik`)
    }
    
    if (!global.db?.users?.[m.sender]?.premium && !m.isOwner) {
        return m.reply(`💎 *Fitur Premium*\n\n> Fitur ini khusus untuk user Premium.\n> Ketik .benefitpremium untuk info upgrade, Darling~`)
    }
    
    await m.reply(`⏳ *Mencari artwork "${query}" di Pixiv...*`)
    await m.react("🎨")
    
    try {
        await getHome()
        
        const page = Math.floor(Math.random() * 5) + 1
        const search = await searchPixiv("artworks", query, page)
        
        if (!search.Status || !search.Data?.body?.illustManga?.data?.length) {
            return m.reply(`❌ *TIDAK DITEMUKAN*\n\n> Artwork dengan kata kunci "${query}" tidak ditemukan.\n> Coba kata kunci lain, Darling~`)
        }
        
        const items = search.Data.body.illustManga.data
        const randomIndex = Math.floor(Math.random() * items.length)
        const selected = items[randomIndex]
        
        const detail = await getArtworkDetail(selected.id)
        
        if (!detail.Detail) {
            return m.reply(`❌ *GAGAL MENGAMBIL DETAIL*\n\n> Coba lagi nanti, Darling~`)
        }
        
        const d = detail.Detail
        const pages = detail.Pages
        
        const images = pages.length 
            ? pages.map(x => normalizeImage(x?.urls?.original || x?.urls?.regular)).filter(Boolean)
            : [normalizeImage(d?.urls?.original)].filter(Boolean)
        
        const title = d.title || selected.title || "Untitled"
        const author = d.userName || selected.userName || "Unknown"
        const tags = joinTags(normalizeTags(d.tags?.tags || d.tags))
        const description = cleanText(d.description || selected.description || "")
        
        let caption = `🎨 *ᴘɪxɪᴠ ᴀʀᴛᴡᴏʀᴋ*\n\n`
        caption += `╭──〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ* 〕───⬣\n`
        caption += `│  🖼️ *Title:* ${title}\n`
        caption += `│  👤 *Artist:* ${author}\n`
        caption += `│  🆔 *ID:* ${selected.id}\n`
        if (d.likeCount) caption += `│  ❤️ *Likes:* ${d.likeCount.toLocaleString()}\n`
        if (d.viewCount) caption += `│  👁️ *Views:* ${d.viewCount.toLocaleString()}\n`
        if (d.bookmarkCount) caption += `│  🔖 *Bookmarks:* ${d.bookmarkCount.toLocaleString()}\n`
        if (tags) caption += `│  🏷️ *Tags:* ${tags}\n`
        if (description) caption += `│\n│  📝 *Description:*\n│  ${description.slice(0, 200)}${description.length > 200 ? '...' : ''}\n`
        caption += `╰────────────────⬣\n\n`
        caption += `> 🩸 *Darling, ini artwork pilihan untukmu~*`
        
        const outputDir = path.join(process.cwd(), 'temp', 'pixiv')
        
        if (images.length > 0) {
            const firstImage = images[0]
            
            try {
                const downloadResult = await downloadImage(firstImage, selected.id, 0, outputDir)
                
                if (downloadResult.success && fs.existsSync(downloadResult.filepath)) {
                    const fileBuffer = fs.readFileSync(downloadResult.filepath)
                    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2)
                    
                    await sock.sendMessage(m.chat, {
                        image: fileBuffer,
                        caption: `${caption}\n\n📦 *Size:* ${fileSizeMB} MB`
                    })
                    
                    fs.unlinkSync(downloadResult.filepath)
                    
                    if (images.length > 1) {
                        await m.reply(`📸 *+${images.length - 1} gambar lainnya*\n> Ketik .pixiv2 ${query} lagi untuk cari yang lain, Darling~`)
                    }
                } else {
                    await m.reply(`${caption}\n\n⚠️ *Gagal download gambar, tapi link tersedia*\n🔗 ${firstImage}`)
                }
            } catch (downloadError) {
                await m.reply(`${caption}\n\n⚠️ *Gagal download gambar, tapi link tersedia*\n🔗 ${firstImage}`)
            }
        } else {
            await m.reply(`❌ *GAGAL MENDAPATKAN GAMBAR*\n\n> Tidak ada URL gambar yang tersedia.`)
        }
        
        await m.react("💕")
        
    } catch (error) {
        console.error('Pixiv2 Error:', error)
        await m.react("❌")
        await m.reply(`❌ *ERROR*\n\n> ${error.message}\n> Coba lagi nanti, Darling~`)
    }
}

module.exports = {
    config,
    handler
}