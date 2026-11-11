const axios = require('axios')
const yts = require('yt-search')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'animeop',
    alias: ['animelagu', 'op', 'ed', 'animesong'],
    category: 'anime',
    description: 'Cari dan download lagu opening/ending anime dari YouTube',
    usage: '.animeop <judul anime> [op/ed]',
    example: '.animeop jujutsu kaisen op\n.animeop naruto ed',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 15,
    energi: 2,
    isEnabled: true
}

// ZERO TWO GLOWING THEME
const THEME = {
    bg: '#0a050f',
    bgGradient1: '#1a0b2e',
    bgGradient2: '#0f0a1a',
    primary: '#ff2a6d',
    secondary: '#ff69b4',
    tertiary: '#a855f7',
    success: '#10b981',
    warning: '#fbbf24',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    textPrimary: '#ffffff',
    textSecondary: '#c084fc',
    glow: '#ff2a6d',
    cardBg: '#1e1028'
}

const JIKAN_API = "https://api.jikan.moe/v4"
const cache = new Map()

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function searchAnime(query) {
    const cacheKey = query.toLowerCase()
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < 3600000) return cached.data
        cache.delete(cacheKey)
    }

    try {
        await delay(1000)
        
        const searchRes = await axios.get(`${JIKAN_API}/anime`, {
            params: { q: query, limit: 1, sfw: true },
            timeout: 15000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
        })

        if (!searchRes.data.data || searchRes.data.data.length === 0) {
            return { success: false, error: 'Anime tidak ditemukan' }
        }

        const anime = searchRes.data.data[0]
        const result = {
            success: true,
            data: {
                id: anime.mal_id,
                title: anime.title,
                titleEnglish: anime.title_english,
                image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
                url: anime.url
            }
        }
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
    } catch (err) {
        console.error('[AnimeOP] Error:', err.message)
        return { success: false, error: err.message }
    }
}

async function searchSong(animeTitle, type) {
    const searchQuery = type === 'ed' 
        ? `${animeTitle} ending theme song` 
        : `${animeTitle} opening theme song`
    
    const searchResult = await yts(searchQuery)
    if (!searchResult.videos.length) {
        return { success: false, error: 'Lagu tidak ditemukan' }
    }
    
    let video = searchResult.videos[0]
    for (const v of searchResult.videos) {
        const title = v.title.toLowerCase()
        if (type === 'op' && (title.includes('op') || title.includes('opening'))) {
            video = v
            break
        }
        if (type === 'ed' && (title.includes('ed') || title.includes('ending'))) {
            video = v
            break
        }
    }
    
    return {
        success: true,
        data: {
            title: video.title,
            url: video.url,
            duration: video.timestamp,
            views: video.views,
            author: video.author.name,
            thumbnail: video.thumbnail
        }
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function drawLove(ctx, cx, cy, size, color, alpha = 1, blur = 0) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    if (blur > 0) {
        ctx.shadowColor = color
        ctx.shadowBlur = blur
    }
    ctx.beginPath()
    const s = size
    ctx.moveTo(cx, cy - s * 0.8)
    ctx.bezierCurveTo(cx - s, cy - s * 0.8, cx - s, cy + s * 0.4, cx, cy + s)
    ctx.bezierCurveTo(cx + s, cy + s * 0.4, cx + s, cy - s * 0.8, cx, cy - s * 0.8)
    ctx.fill()
    ctx.restore()
}

async function renderCard(anime, song, type) {
    const w = 560
    const h = 520
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, THEME.bg)
    grad.addColorStop(0.5, THEME.bgGradient1)
    grad.addColorStop(1, THEME.bgGradient2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Glow effect
    const glow = ctx.createRadialGradient(w * 0.5, 50, 0, w * 0.5, 50, 250)
    glow.addColorStop(0, `${THEME.primary}15`)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)

    // Decorative loves
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 60; i++) {
        drawLove(ctx, Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 
            [THEME.primary, THEME.secondary, THEME.tertiary][Math.floor(Math.random() * 3)], 0.3)
    }
    ctx.globalAlpha = 1

    // Border gradient
    const borderGrad = ctx.createLinearGradient(0, 0, w, 0)
    borderGrad.addColorStop(0, THEME.primary)
    borderGrad.addColorStop(0.5, THEME.secondary)
    borderGrad.addColorStop(1, THEME.tertiary)
    ctx.strokeStyle = borderGrad
    ctx.lineWidth = 3
    roundRect(ctx, 12, 12, w - 24, h - 24, 15)
    ctx.stroke()

    // Header
    ctx.shadowColor = THEME.glow
    ctx.shadowBlur = 18
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 22px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText(`♡ ZERO TWO ${type === 'op' ? 'OPENING' : 'ENDING'} ♡`, w/2, 45)
    ctx.shadowBlur = 0

    // Header separator
    const sepGrad = ctx.createLinearGradient(30, 65, w - 30, 65)
    sepGrad.addColorStop(0, 'transparent')
    sepGrad.addColorStop(0.3, THEME.primary)
    sepGrad.addColorStop(0.5, THEME.secondary)
    sepGrad.addColorStop(0.7, THEME.tertiary)
    sepGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = sepGrad
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(30, 65)
    ctx.lineTo(w - 30, 65)
    ctx.stroke()

    // COVER ANIME SECTION
    ctx.shadowBlur = 5
    ctx.shadowColor = THEME.primary
    
    // Border warna-warni untuk cover
    const posterColors = [THEME.primary, THEME.secondary, THEME.tertiary, THEME.blue]
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = posterColors[i]
        ctx.lineWidth = 1.5
        roundRect(ctx, 20 - i, 80 - i, 120 + (i * 2), 170 + (i * 2), 10 + i)
        ctx.stroke()
    }
    
    // Cover image
    ctx.fillStyle = THEME.cardBg
    roundRect(ctx, 20, 80, 120, 170, 10)
    ctx.fill()
    
    try {
        if (anime.image) {
            const imgResponse = await axios.get(anime.image, { responseType: 'arraybuffer', timeout: 10000 })
            const imgBuffer = Buffer.from(imgResponse.data)
            const cover = await loadImage(imgBuffer)
            ctx.save()
            roundRect(ctx, 22, 82, 116, 166, 8)
            ctx.clip()
            ctx.drawImage(cover, 22, 82, 116, 166)
            ctx.restore()
        } else {
            throw new Error('No image')
        }
    } catch (err) {
        ctx.fillStyle = THEME.secondary
        ctx.font = 'bold 12px "Segoe UI"'
        ctx.textAlign = 'center'
        ctx.fillText('NO COVER', 80, 165)
    }

    // ANIME TITLE
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 17px "Segoe UI"'
    ctx.textAlign = 'left'
    let title = anime.title.length > 32 ? anime.title.substring(0, 29) + '...' : anime.title
    ctx.fillText(title, 160, 105)

    if (anime.titleEnglish && anime.titleEnglish !== anime.title) {
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '10px "Segoe UI"'
        let engTitle = anime.titleEnglish.length > 35 ? anime.titleEnglish.substring(0, 32) + '...' : anime.titleEnglish
        ctx.fillText(engTitle, 160, 128)
    }

    // Type badge
    ctx.fillStyle = `${THEME.primary}30`
    roundRect(ctx, 160, 145, type === 'op' ? 85 : 80, 22, 11)
    ctx.fill()
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText(type === 'op' ? '♪ OPENING' : '♫ ENDING', 165, 161)

    // SONG INFO CARD
    const songY = 270
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, songY - 8, w - 40, 70, 10)
    ctx.fill()
    ctx.strokeStyle = THEME.secondary
    ctx.lineWidth = 1
    roundRect(ctx, 20, songY - 8, w - 40, 70, 10)
    ctx.stroke()

    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('▸ SONG DETAILS', 35, songY + 5)

    let songTitle = song.title.length > 55 ? song.title.substring(0, 52) + '...' : song.title
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText(songTitle, 35, songY + 28)

    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`♡ ${song.author}  ◆  ⏱️ ${song.duration}  ◆  👁️ ${formatNumber(song.views)} views`, 35, songY + 50)

    // DOWNLOAD GUIDE CARD
    const guideY = 358
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, guideY - 8, w - 40, 110, 10)
    ctx.fill()
    ctx.strokeStyle = THEME.tertiary
    ctx.lineWidth = 1
    roundRect(ctx, 20, guideY - 8, w - 40, 110, 10)
    ctx.stroke()

    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('▸ HOW TO DOWNLOAD', 35, guideY + 5)

    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px "Segoe UI"'
    ctx.fillText('1. Klik link YouTube di bawah', 35, guideY + 28)
    ctx.fillText('2. Buka di browser', 35, guideY + 48)
    ctx.fillText('3. Download pakai y2mate / savideo', 35, guideY + 68)
    ctx.fillText('4. Nikmati lagunya darling~ ♡', 35, guideY + 88)

    // LINK SECTION
    const linkY = 475
    ctx.fillStyle = THEME.primary
    ctx.font = '9px "Segoe UI"'
    let shortUrl = song.url.length > 68 ? song.url.substring(0, 65) + '...' : song.url
    ctx.fillText(`🔗 ${shortUrl}`, 35, linkY)

    // FOOTER
    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '8px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ NusaBot  |  Anime OP/ED Finder  |  Data from MyAnimeList ♡', w/2, h - 14)
    
    // Decorative love di footer
    drawLove(ctx, 25, h - 14, 4, THEME.primary, 0.6, 4)
    drawLove(ctx, w - 25, h - 14, 4, THEME.secondary, 0.6, 4)

    return canvas.toBuffer('image/png')
}

function formatCaption(anime, song, type) {
    let caption = `♡ *ZERO TWO ${type === 'op' ? 'OPENING' : 'ENDING'}* ♡\n\n`
    caption += `📺 *Anime:* ${anime.title}\n`
    if (anime.titleEnglish && anime.titleEnglish !== anime.title) caption += `📖 *English:* ${anime.titleEnglish}\n`
    caption += `\n`
    caption += `🎤 *Lagu:* ${song.title}\n`
    caption += `👤 *Artist:* ${song.author}\n`
    caption += `⏱️ *Durasi:* ${song.duration}\n`
    caption += `👁️ *Views:* ${formatNumber(song.views)}\n`
    caption += `\n`
    caption += `🔗 *Link:* ${song.url}\n`
    caption += `\n`
    caption += `📌 *Cara download:*\n`
    caption += `1. Klik link di atas\n`
    caption += `2. Buka di browser\n`
    caption += `3. Download pakai y2mate / savideo\n`
    caption += `\n`
    caption += `💕 *Zero Two:* ${type === 'op' ? 'Openingnya keren banget darling~ ♡' : 'Endingnya bikin mewek qaqa~ 💕'} 🦋`
    return caption
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    if (!args || args.length < 1) {
        return m.reply(
            `♡ *ZERO TWO ANIME OP/ED* ♡\n\n` +
            `📌 *Cara pakai:*\n` +
            `• ${m.prefix}animeop <judul anime> op\n` +
            `• ${m.prefix}animeop <judul anime> ed\n\n` +
            `📌 *Contoh:*\n` +
            `• ${m.prefix}animeop jujutsu kaisen op\n` +
            `• ${m.prefix}animeop naruto ed\n` +
            `• ${m.prefix}animeop one piece op\n\n` +
            `💕 *Zero Two:* Mau cari opening atau ending anime apa darling~? ♡`
        )
    }

    let type = 'op'
    let query = args.join(' ')
    
    if (args[args.length - 1].toLowerCase() === 'op' || args[args.length - 1].toLowerCase() === 'ed') {
        type = args[args.length - 1].toLowerCase()
        query = args.slice(0, -1).join(' ')
    }
    
    if (!query) {
        return m.reply(`💔 Masukkan judul anime yang valid darling~\nContoh: \`.animeop jujutsu kaisen op\``)
    }

    await m.react('💕')
    
    try {
        await m.reply(`🦋 *Zero Two:* Lagi nyari ${type === 'op' ? 'opening' : 'ending'} *${query}*... tunggu sebentar ya darling~ ♡`)

        const animeResult = await searchAnime(query)
        if (!animeResult.success) {
            await m.react('💔')
            return m.reply(`💔 *Anime tidak ditemukan!*\n\n*${query}* gak ketemu di database.\n\nCoba cek ejaannya atau pake judul lain ya darling~ 🦋`)
        }

        const songResult = await searchSong(animeResult.data.title, type)
        if (!songResult.success) {
            await m.react('💔')
            return m.reply(`💔 *Lagu tidak ditemukan!*\n\n${type === 'op' ? 'Opening' : 'Ending'} untuk *${animeResult.data.title}* gak ketemu di YouTube.\n\nCoba cari manual ya darling~ 🦋`)
        }

        try {
            const imgBuffer = await renderCard(animeResult.data, songResult.data, type)
            await sock.sendMessage(m.chat, { 
                image: imgBuffer, 
                caption: formatCaption(animeResult.data, songResult.data, type) 
            }, { quoted: m })
        } catch (imgErr) {
            console.error('[AnimeOP] Canvas error:', imgErr)
            await m.reply(formatCaption(animeResult.data, songResult.data, type))
        }

        await m.react('💕')
        
    } catch (err) {
        console.error('[AnimeOP] Error:', err)
        await m.react('💔')
        await m.reply(`💔 *Error Darling!*\n\n> ${err.message}\n\nCoba lagi nanti ya~ ♡`)
    }
}

module.exports = { config: pluginConfig, handler }