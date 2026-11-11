const axios = require('axios')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'mangasearch',
    alias: [ 'infomanga', 'mangasearch', 'cariManga' ],
    category: 'anime',
    description: 'Cari informasi manga dari MyAnimeList',
    usage: '.manga <judul manga>',
    example: '.manga one piece\n.manga jujutsu kaisen\n.manga chainsaw man',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
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
    cardBg: '#1e1028',
    gold: '#ffd700'
}

const JIKAN_API = "https://api.jikan.moe/v4"
const cache = new Map()
const CACHE_DURATION = 60 * 60 * 1000

// Delay function untuk hindari rate limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function searchManga(query) {
    const cacheKey = query.toLowerCase()
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data
        cache.delete(cacheKey)
    }

    try {
        await delay(1000)
        
        const searchRes = await axios.get(`${JIKAN_API}/manga`, {
            params: { q: query, limit: 1, order_by: 'score', sort: 'desc' },
            timeout: 15000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
        })

        if (!searchRes.data.data || searchRes.data.data.length === 0) {
            return { success: false, error: 'Manga tidak ditemukan' }
        }

        const manga = searchRes.data.data[0]
        const mangaId = manga.mal_id

        await delay(500)

        const detailRes = await axios.get(`${JIKAN_API}/manga/${mangaId}/full`, {
            timeout: 15000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
        })

        const data = detailRes.data.data

        const result = {
            success: true,
            data: {
                id: data.mal_id,
                title: data.title,
                titleEnglish: data.title_english,
                titleJapanese: data.title_japanese,
                synopsis: data.synopsis?.replace(/\[[^\]]+\]/g, '').substring(0, 600) || 'Tidak ada sinopsis',
                type: data.type || 'Manga',
                chapters: data.chapters || '?',
                volumes: data.volumes || '?',
                status: data.status || 'Unknown',
                published: data.published?.string || 'Unknown',
                score: data.score || 'N/A',
                scoredBy: data.scored_by || 0,
                rank: data.rank || 'N/A',
                popularity: data.popularity || 'N/A',
                members: data.members || 0,
                favorites: data.favorites || 0,
                authors: data.authors?.map(a => a.name).join(', ') || 'Unknown',
                genres: data.genres?.map(g => g.name).slice(0, 6) || [],
                image: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url
            }
        }

        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result

    } catch (err) {
        console.error('[Manga] Error:', err.message)
        if (err.response?.status === 429) return { success: false, error: 'Rate limit, coba lagi nanti darling~' }
        if (err.response?.status === 404) return { success: false, error: 'Manga tidak ditemukan' }
        return { success: false, error: err.message }
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

async function renderMangaCard(manga) {
    const w = 580
    const h = 700
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
    const glow = ctx.createRadialGradient(w * 0.5, 50, 0, w * 0.5, 50, 300)
    glow.addColorStop(0, `${THEME.primary}15`)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)

    // Decorative loves
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 70; i++) {
        drawLove(ctx, Math.random() * w, Math.random() * h, 4 + Math.random() * 10, 
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
    ctx.font = 'bold 24px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ ZERO TWO MANGA INFO ♡', w/2, 45)
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

    // COVER SECTION
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
        if (manga.image) {
            const imgResponse = await axios.get(manga.image, { responseType: 'arraybuffer', timeout: 10000 })
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
        ctx.font = 'bold 14px "Segoe UI"'
        ctx.textAlign = 'center'
        ctx.fillText('📘', 80, 165)
        ctx.font = '10px "Segoe UI"'
        ctx.fillText('NO COVER', 80, 190)
    }

    // MANGA TITLE
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 18px "Segoe UI"'
    ctx.textAlign = 'left'
    let title = manga.title.length > 34 ? manga.title.substring(0, 31) + '...' : manga.title
    ctx.fillText(title, 160, 105)

    if (manga.titleEnglish && manga.titleEnglish !== manga.title) {
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '10px "Segoe UI"'
        let engTitle = manga.titleEnglish.length > 38 ? manga.titleEnglish.substring(0, 35) + '...' : manga.titleEnglish
        ctx.fillText(engTitle, 160, 128)
    }

    // Score and rank
    ctx.fillStyle = THEME.gold
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`★ ${manga.score}`, 160, 155)
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`(${formatNumber(manga.scoredBy)} users)`, 160, 172)

    // INFO CARD
    const infoY = 270
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, infoY - 8, w - 40, 85, 10)
    ctx.fill()
    ctx.strokeStyle = THEME.cyan
    ctx.lineWidth = 1
    roundRect(ctx, 20, infoY - 8, w - 40, 85, 10)
    ctx.stroke()

    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('▸ MANGA DETAILS', 35, infoY + 5)

    // Row 1
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('STATUS', 35, infoY + 28)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(manga.status, 35, infoY + 46)
    
    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('CHAPTERS', 180, infoY + 28)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`${manga.chapters} ch (${manga.volumes} vol)`, 180, infoY + 46)
    
    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('PUBLISHED', 380, infoY + 28)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    let publishedShort = manga.published.split(',')[0]
    ctx.fillText(publishedShort.length > 20 ? publishedShort.substring(0, 17) + '...' : publishedShort, 380, infoY + 46)

    // Row 2 - Author
    ctx.fillStyle = THEME.tertiary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('AUTHOR', 35, infoY + 65)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(manga.authors.length > 45 ? manga.authors.substring(0, 42) + '...' : manga.authors, 35, infoY + 81)

    // GENRES CARD
    const genreY = 370
    if (manga.genres.length > 0) {
        ctx.fillStyle = `${THEME.cardBg}cc`
        roundRect(ctx, 20, genreY - 8, w - 40, 45, 10)
        ctx.fill()
        ctx.strokeStyle = THEME.secondary
        ctx.lineWidth = 1
        roundRect(ctx, 20, genreY - 8, w - 40, 45, 10)
        ctx.stroke()

        ctx.fillStyle = THEME.secondary
        ctx.font = 'bold 10px "Segoe UI"'
        ctx.fillText('▸ GENRES', 35, genreY + 5)

        let genreText = manga.genres.join(' ◆ ')
        ctx.fillStyle = THEME.textPrimary
        ctx.font = '9px "Segoe UI"'
        ctx.fillText(genreText.length > 65 ? genreText.substring(0, 62) + '...' : genreText, 35, genreY + 28)
    }

    // STATS CARD
    const statsY = 430
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, statsY - 8, w - 40, 50, 10)
    ctx.fill()
    ctx.strokeStyle = THEME.gold
    ctx.lineWidth = 1
    roundRect(ctx, 20, statsY - 8, w - 40, 50, 10)
    ctx.stroke()

    ctx.fillStyle = THEME.gold
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('▸ STATISTICS', 35, statsY + 5)

    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText(`RANK #${manga.rank}`, 35, statsY + 30)
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText(`POP #${manga.popularity}`, 160, statsY + 30)
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText(`❤️ ${formatNumber(manga.favorites)}`, 310, statsY + 30)
    ctx.fillStyle = THEME.success
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText(`👥 ${formatNumber(manga.members)}`, 430, statsY + 30)

    // SYNOPSIS CARD
    const synopsisY = 495
    const synopsisText = manga.synopsis
    const maxWidth = w - 70
    ctx.font = '9px "Segoe UI"'
    const words = synopsisText.split(' ')
    let lines = []
    let currentLine = ''

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
        } else {
            currentLine = testLine
        }
    }
    lines.push(currentLine)

    const synopsisHeight = Math.min(140, lines.length * 14 + 30)
    
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, synopsisY - 8, w - 40, synopsisHeight + 15, 10)
    ctx.fill()
    ctx.strokeStyle = THEME.tertiary
    ctx.lineWidth = 1
    roundRect(ctx, 20, synopsisY - 8, w - 40, synopsisHeight + 15, 10)
    ctx.stroke()

    ctx.fillStyle = THEME.tertiary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('▸ SYNOPSIS', 35, synopsisY + 5)

    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px "Segoe UI"'
    let synY = synopsisY + 28
    for (let i = 0; i < Math.min(lines.length, 9); i++) {
        ctx.fillText(lines[i], 35, synY)
        synY += 14
    }
    if (lines.length > 9) ctx.fillText('...', 35, synY)

    // FOOTER
    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '8px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ NusaBot  |  Data from MyAnimeList (Jikan API) ♡', w/2, h - 14)
    
    // Decorative loves
    drawLove(ctx, 25, h - 14, 4, THEME.primary, 0.6, 4)
    drawLove(ctx, w - 25, h - 14, 4, THEME.secondary, 0.6, 4)

    return canvas.toBuffer('image/png')
}

function formatCaption(manga) {
    let caption = `♡ *ZERO TWO MANGA INFO* ♡\n\n`
    caption += `*📖 ${manga.title}*\n`
    if (manga.titleEnglish && manga.titleEnglish !== manga.title) caption += `*${manga.titleEnglish}*\n`
    caption += `\n`
    caption += `★ *Score:* ${manga.score} (${formatNumber(manga.scoredBy)} users)\n`
    caption += `📊 *Rank:* #${manga.rank}  ◆  🔥 *Popularity:* #${manga.popularity}\n`
    caption += `❤️ *Favorites:* ${formatNumber(manga.favorites)}  ◆  👥 *Members:* ${formatNumber(manga.members)}\n`
    caption += `\n`
    caption += `📦 *Chapters:* ${manga.chapters}  ◆  *Volumes:* ${manga.volumes}\n`
    caption += `📌 *Status:* ${manga.status}\n`
    caption += `✍️ *Author:* ${manga.authors}\n`
    if (manga.genres.length) caption += `🎭 *Genre:* ${manga.genres.join(', ')}\n`
    caption += `\n`
    caption += `📖 *Sinopsis:*\n${manga.synopsis}${manga.synopsis.length >= 600 ? '...' : ''}\n\n`
    caption += `💕 *Zero Two:* ${['Mau baca manga ini darling? ♡', 'Rekomendasi bagus nih~ 💕', 'Ayo baca bareng!', 'Manga favoritku juga nih~', 'Seru banget ini manga nya! ♡'][Math.floor(Math.random() * 5)]} 🦋`
    return caption
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query) {
        return m.reply(
            `♡ *ZERO TWO MANGA SEARCH* ♡\n\n` +
            `📌 *Cara pakai:*\n• ${m.prefix}manga <judul manga>\n\n` +
            `📌 *Contoh:*\n• ${m.prefix}manga one piece\n• ${m.prefix}manga chainsaw man\n• ${m.prefix}manga jujutsu kaisen\n\n` +
            `💕 *Zero Two:* Cari manga apa nih darling~? ♡`
        )
    }

    await m.react('💕')
    try {
        await m.reply(`🦋 *Zero Two:* Lagi nyari manga *${query}*... tunggu sebentar ya darling~ ♡`)
        const result = await searchManga(query)
        if (!result.success) {
            await m.react('💔')
            return m.reply(`💔 *Manga tidak ditemukan!*\n\n*${query}* gak ketemu di database.\n\nCoba cek ejaannya atau pake judul lain ya darling~ 🦋`)
        }
        const manga = result.data
        try {
            const imgBuffer = await renderMangaCard(manga)
            await sock.sendMessage(m.chat, { image: imgBuffer, caption: formatCaption(manga) }, { quoted: m })
        } catch (imgErr) {
            console.error('[Manga] Canvas error:', imgErr)
            await m.reply(formatCaption(manga))
        }
        await m.react('💕')
    } catch (err) {
        console.error('[Manga] Error:', err)
        await m.react('💔')
        await m.reply(`💔 *Error Darling!*\n\n> ${err.message}\n\nCoba lagi nanti ya~ ♡`)
    }
}

module.exports = { config: pluginConfig, handler }