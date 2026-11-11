const config = {
    name: 'mcpedldl',
    alias: ['mcpeldl', 'dlmcpe', 'mcpemod'],
    category: 'download',
    description: 'Download mod/texture/shader dari MCPEDL',
    usage: '.mcpedldl <url/slug>',
    example: '.mcpedldl lunac-shaders',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream').promises

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"
const DESCRIPTION_LIMIT = 900

const api = axios.create({
    baseURL: "https://api.mcpedl.com",
    timeout: 30000,
    validateStatus: () => true,
    headers: {
        "user-agent": UA,
        "accept": "application/json",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "origin": "https://mcpedl.com",
        "referer": "https://mcpedl.com/"
    }
})

const web = axios.create({
    timeout: 60000,
    maxRedirects: 10,
    validateStatus: () => true,
    headers: {
        "user-agent": UA,
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "referer": "https://mcpedl.com/"
    }
})

function getSlug(input) {
    const raw = String(input || "").trim()
    
    try {
        const u = new URL(raw)
        const parts = u.pathname.split("/").filter(Boolean)
        return parts[0] || raw
    } catch {
        return raw
            .replace(/^https?:\/\/(?:www\.)?mcpedl\.com\//i, "")
            .replace(/^\/+/, "")
            .replace(/\/+$/, "")
            .trim()
    }
}

function decodeHtml(value) {
    return String(value || "")
        .replace(/&quot;/g, "\"")
        .replace(/&#x27;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
}

function cleanText(value) {
    return decodeHtml(value)
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function limitText(value, limit = DESCRIPTION_LIMIT) {
    const text = cleanText(value)
    if (!limit || text.length <= limit) return text
    return text.slice(0, limit).trim() + "..."
}

function normalizeUrl(url) {
    const text = decodeHtml(String(url || "").trim())
    try {
        return new URL(text, "https://mcpedl.com").toString()
    } catch {
        return null
    }
}

function extractRemoteUrl(url) {
    const normalized = normalizeUrl(url)
    if (!normalized) return null
    
    try {
        const u = new URL(normalized)
        const remote = u.searchParams.get("remoteUrl")
        if (remote) return decodeURIComponent(remote)
        return normalized
    } catch {
        return normalized
    }
}

function isDirectFile(url) {
    return /\.(mcpack|mcaddon|mcworld|zip|rar|7z)(\?|#|$)/i.test(url || "")
}

function getFileNameFromUrl(url) {
    try {
        const u = new URL(url)
        const name = decodeURIComponent(path.basename(u.pathname))
        return name || "download.mcpack"
    } catch {
        return "download.mcpack"
    }
}

function sanitizeFileName(name) {
    return String(name || "download.mcpack")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180) || "download.mcpack"
}

async function getDetail(slug) {
    const res = await api.get(`/api/route/slug/${encodeURIComponent(slug)}`)
    
    if (res.status < 200 || res.status >= 300 || !res.data?.data) {
        throw new Error(`API Error: ${res.status}`)
    }
    
    return res.data.data
}

function getLinksFromDescription(html) {
    const links = []
    const text = String(html || "")
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match
    
    while ((match = regex.exec(text)) !== null) {
        const href = match[1]
        const label = cleanText(match[2])
        const url = extractRemoteUrl(href)
        
        if (!url) continue
        
        if (url.toLowerCase().includes('download') || 
            url.match(/\.(mcpack|mcaddon|mcworld|zip|rar|7z)/i)) {
            links.push({
                name: label || getFileNameFromUrl(url),
                url: url,
                direct: isDirectFile(url)
            })
        }
    }
    
    return links
}

function buildDownloads(d) {
    const apiDownloads = Array.isArray(d.downloads) ? d.downloads.map(x => {
        const url = x.file || x.url || x.download_url || null
        if (!url) return null
        return {
            id: x.id,
            name: x.display_name || x.name || getFileNameFromUrl(url),
            url: url,
            direct: isDirectFile(url),
            type: x.type
        }
    }).filter(Boolean) : []
    
    const htmlDownloads = getLinksFromDescription(d.description)
    
    const all = [...apiDownloads, ...htmlDownloads]
    const unique = []
    const seen = new Set()
    
    for (const item of all) {
        if (!seen.has(item.url)) {
            seen.add(item.url)
            unique.push(item)
        }
    }
    
    return {
        all: unique,
        direct: unique.filter(x => x.direct)
    }
}

function pickMainDownload(directDownloads, detail = {}) {
    if (!directDownloads.length) return null
    
    const titleWords = String(detail.title || "").toLowerCase().split(/\s+/)
    
    const scored = directDownloads.map((item, index) => {
        const name = `${item.name || ""} ${item.url || ""}`.toLowerCase()
        let score = 0
        
        for (const word of titleWords) {
            if (name.includes(word)) score += 10
        }
        
        if (name.includes("main")) score += 15
        if (name.includes("latest")) score += 12
        if (name.includes("release")) score += 10
        if (name.includes("universal")) score += 8
        if (name.includes(".mcpack")) score += 5
        if (name.includes(".mcaddon")) score += 5
        if (name.includes(".mcworld")) score += 5
        if (name.includes("old")) score -= 10
        if (name.includes("beta")) score -= 8
        
        score -= index / 1000
        
        return { item, score }
    })
    
    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.item || directDownloads[0]
}

async function downloadFile(url, name, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true })
    
    const filename = sanitizeFileName(name || getFileNameFromUrl(url))
    const output = path.join(outputDir, filename)
    
    const res = await web.get(url, { responseType: "stream" })
    
    if (res.status < 200 || res.status >= 300) {
        return { success: false, statusCode: res.status, url, file: null }
    }
    
    await pipeline(res.data, fs.createWriteStream(output))
    
    return { success: true, statusCode: res.status, url, file: output, size: fs.statSync(output).size }
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const input = args[0]
    
    if (!input) {
        return m.reply(`🎮 *ᴍᴄᴘᴇᴅʟ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> Download mod, texture, shader dari MCPEDL\n\n> Contoh:\n> .mcpedldl lunac-shaders\n> .mcpedldl https://mcpedl.com/newb-shader/\n\n📝 *Hasil:*\n> • Info lengkap postingan\n> • Link download (mcpack/mcaddon)`)
    }
    
    const slug = getSlug(input)
    
    await m.reply(`⏳ *Mengambil data dari MCPEDL...*\n> 📛 Slug: ${slug}`)
    
    try {
        const detail = await getDetail(slug)
        const downloads = buildDownloads(detail)
        const mainDownload = pickMainDownload(downloads.direct, detail)
        
        const outputDir = path.join(process.cwd(), 'temp', 'mcpedl')
        
        let txt = `🎮 *ᴍᴄᴘᴇᴅʟ ᴅᴇᴛᴀɪʟ*\n\n`
        txt += `╭──〔 📋 *ɪɴꜰᴏ* 〕───⬣\n`
        txt += `│  📛 *${detail.title || 'Unknown'}*\n`
        if (detail.username) txt += `│  👤 Author: ${detail.username}\n`
        if (detail.average_rating) txt += `│  ⭐ Rating: ${detail.average_rating}/5\n`
        if (detail.publish_date) txt += `│  📅 Rilis: ${detail.publish_date}\n`
        if (detail.update_date) txt += `│  🔄 Update: ${detail.update_date}\n`
        txt += `│\n│  📝 *Deskripsi:*\n│  ${limitText(detail.description || detail.short_description, 400)}\n`
        txt += `│\n│  🔗 ${detail.slug ? `https://mcpedl.com/${detail.slug}/` : '-'}\n`
        txt += `╰────────────────⬣\n\n`
        
        if (downloads.direct.length > 0) {
            txt += `╭──〔 📥 *ʟɪɴᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 〕───⬣\n`
            for (let i = 0; i < Math.min(3, downloads.direct.length); i++) {
                const dl = downloads.direct[i]
                const isMain = mainDownload && dl.url === mainDownload.url ? '⭐ ' : ''
                txt += `│  ${isMain}${i+1}. ${dl.name}\n`
                txt += `│     └ ${dl.url}\n`
            }
            if (downloads.direct.length > 3) {
                txt += `│  └ ...dan ${downloads.direct.length - 3} link lain\n`
            }
            txt += `╰────────────────⬣\n\n`
        }
        
        if (detail.categories && detail.categories.length) {
            txt += `🏷️ *Kategori:* ${detail.categories.map(c => c.name).join(', ')}\n`
        }
        
        if (detail.cf_tags && detail.cf_tags.length) {
            txt += `🔖 *Tags:* ${detail.cf_tags.slice(0, 5).map(t => t.name).join(', ')}${detail.cf_tags.length > 5 ? '...' : ''}\n`
        }
        
        txt += `\n> 💡 Ketik .mcpedldl ${slug} download untuk download file utama`
        
        await m.reply(txt)
        
        if (args[1] && args[1].toLowerCase() === 'download' && mainDownload) {
            await m.reply(`⏳ *Mendownload ${mainDownload.name}...*\n> File akan diupload setelah selesai`)
            
            const result = await downloadFile(mainDownload.url, mainDownload.name, outputDir)
            
            if (result.success && fs.existsSync(result.file)) {
                const fileBuffer = fs.readFileSync(result.file)
                const fileName = path.basename(result.file)
                
                await sock.sendMessage(m.chat, {
                    document: fileBuffer,
                    mimetype: 'application/octet-stream',
                    fileName: fileName,
                    caption: `🎮 *Download selesai!*\n\n📛 ${detail.title}\n📦 ${mainDownload.name}\n📁 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`
                })
                
                fs.unlinkSync(result.file)
            } else {
                await m.reply(`❌ *GAGAL DOWNLOAD*\n\n> ${result.error || 'Unknown error'}\n> Coba download manual melalui link di atas, Darling~`)
            }
        }
        
    } catch (error) {
        console.error('MCPEDL Error:', error)
        await m.reply(`❌ *ERROR*\n\n> ${error.message}\n> Coba periksa URL/slug atau coba lagi nanti, Darling~`)
    }
}

module.exports = {
    config,
    handler
}