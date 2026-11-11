const axios = require('axios')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'anime',
    alias: ['animeinfo', 'animedetail', 'infonime'],
    category: 'anime',
    description: 'Mencari informasi lengkap anime dari MyAnimeList (Jikan API)',
    usage: '.anime <judul anime>',
    example: '.anime darling in the franxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

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
    rating: '#ffd700'
}

const genreSymbols = {
    'Action': '⚡', 'Adventure': '🗺️', 'Comedy': '😂', 'Drama': '🎭',
    'Fantasy': '✨', 'Horror': '👻', 'Mystery': '🕵️', 'Romance': '💕',
    'Sci-Fi': '🚀', 'Slice of Life': '🌸', 'Sports': '⚽', 'Supernatural': '🔮',
    'Thriller': '🔪', 'Ecchi': '😳', 'Mecha': '🤖', 'Psychological': '🧠',
    'Seinen': '📖', 'Shounen': '⚡', 'Shoujo': '💖', 'Josei': '👩'
}

const JIKAN_API = "https://api.jikan.moe/v4"
const cache = new Map()
const CACHE_DURATION = 60 * 60 * 1000

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function searchAnime(query) {
    const cacheKey = query.toLowerCase().trim()
    
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data
        }
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
        const malId = anime.mal_id
        
        await delay(500)
        
        const detailRes = await axios.get(`${JIKAN_API}/anime/${malId}/full`, {
            timeout: 15000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
        })
        
        const fullData = detailRes.data.data
        
        const result = {
            success: true,
            data: {
                id: fullData.mal_id,
                title: fullData.title,
                titleEnglish: fullData.title_english,
                titleJapanese: fullData.title_japanese,
                synopsis: fullData.synopsis || 'Tidak ada sinopsis',
                type: fullData.type || 'Unknown',
                episodes: fullData.episodes || '?',
                status: fullData.status || 'Unknown',
                aired: fullData.aired?.string || 'Unknown',
                season: fullData.season ? `${fullData.season} ${fullData.year}` : 'Unknown',
                duration: fullData.duration || 'Unknown',
                rating: fullData.rating || 'Unknown',
                score: fullData.score || 'N/A',
                scoredBy: fullData.scored_by || 0,
                rank: fullData.rank || 'N/A',
                popularity: fullData.popularity || 'N/A',
                members: fullData.members || 0,
                favorites: fullData.favorites || 0,
                studio: fullData.studios?.[0]?.name || 'Unknown',
                source: fullData.source || 'Unknown',
                genres: fullData.genres?.map(g => g.name) || [],
                themes: fullData.themes?.map(t => t.name) || [],
                producers: fullData.producers?.map(p => p.name).slice(0, 3) || [],
                image: fullData.images?.jpg?.large_image_url || fullData.images?.jpg?.image_url,
                trailer: fullData.trailer?.url || null
            }
        }
        
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
        
    } catch (err) {
        console.error('[Anime] Error:', err.message)
        if (err.response?.status === 429) {
            return { success: false, error: 'Rate limit, coba lagi nanti darling~' }
        }
        return { success: false, error: err.message }
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
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

function drawStar(ctx, cx, cy, r, color, alpha = 1) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 4
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180
        const ix = cx + Math.cos(innerAngle) * (r * 0.4)
        const iy = cy + Math.sin(innerAngle) * (r * 0.4)
        ctx.lineTo(ix, iy)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

function drawParticles(ctx, W, H, time) {
    const particles = [
        { x: 0.15, y: 0.2, size: 2, color: THEME.primary, speed: 0.5 },
        { x: 0.85, y: 0.15, size: 1.5, color: THEME.secondary, speed: 0.7 },
        { x: 0.3, y: 0.7, size: 2.5, color: THEME.tertiary, speed: 0.4 },
        { x: 0.7, y: 0.8, size: 1.8, color: THEME.cyan, speed: 0.6 },
        { x: 0.5, y: 0.4, size: 2, color: THEME.primary, speed: 0.8 },
        { x: 0.1, y: 0.9, size: 1.2, color: THEME.secondary, speed: 0.3 },
        { x: 0.95, y: 0.5, size: 2.2, color: THEME.tertiary, speed: 0.55 },
        { x: 0.45, y: 0.1, size: 1.5, color: THEME.success, speed: 0.65 },
        { x: 0.6, y: 0.95, size: 1.8, color: THEME.warning, speed: 0.45 },
        { x: 0.05, y: 0.4, size: 1.3, color: THEME.blue, speed: 0.5 },
        { x: 0.75, y: 0.3, size: 2, color: THEME.primary, speed: 0.6 },
        { x: 0.25, y: 0.85, size: 1.7, color: THEME.secondary, speed: 0.4 },
        { x: 0.55, y: 0.6, size: 1.4, color: THEME.tertiary, speed: 0.7 },
        { x: 0.88, y: 0.22, size: 1.9, color: THEME.cyan, speed: 0.5 },
        { x: 0.12, y: 0.55, size: 2.1, color: THEME.primary, speed: 0.55 }
    ]
    
    particles.forEach(p => {
        const offset = (time * p.speed * 50) % (W * 2)
        const x = (p.x * W + offset) % W
        drawLove(ctx, x, p.y * H, p.size, p.color, 0.5, 6)
    })
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

async function renderAnimeCard(anime) {
    const W = 650
    const H = 800
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    const time = Date.now() / 1000
    
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, THEME.bg)
    grad.addColorStop(0.5, THEME.bgGradient1)
    grad.addColorStop(1, THEME.bgGradient2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    
    const glow1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, 250)
    glow1.addColorStop(0, `${THEME.primary}20`)
    glow1.addColorStop(1, 'transparent')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, W, H)
    
    const glow2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 0, W * 0.85, H * 0.85, 280)
    glow2.addColorStop(0, `${THEME.secondary}18`)
    glow2.addColorStop(1, 'transparent')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, W, H)
    
    ctx.globalAlpha = 0.06
    for (let i = 0; i < H; i += 35) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.strokeStyle = THEME.primary
        ctx.lineWidth = 0.5
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 20; i++) {
        drawLove(ctx, Math.random() * W, Math.random() * H, 3 + Math.random() * 6,
            [THEME.primary, THEME.secondary, THEME.tertiary][Math.floor(Math.random() * 3)], 0.2, 4)
    }
    ctx.globalAlpha = 1
    
    drawParticles(ctx, W, H, time)
    
    for (let i = 0; i < 12; i++) {
        drawStar(ctx, Math.random() * W, Math.random() * H, 1.5 + Math.random() * 2.5,
            [THEME.primary, THEME.secondary, THEME.cyan][Math.floor(Math.random() * 3)], 0.4)
    }
    
    ctx.shadowColor = THEME.glow
    ctx.shadowBlur = 20
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 26px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ ZERO TWO ANIME INFO ♡', W/2, 48)
    ctx.shadowBlur = 0
    
    const sepGrad = ctx.createLinearGradient(30, 70, W - 30, 70)
    sepGrad.addColorStop(0, 'transparent')
    sepGrad.addColorStop(0.3, THEME.primary)
    sepGrad.addColorStop(0.5, THEME.secondary)
    sepGrad.addColorStop(0.7, THEME.tertiary)
    sepGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = sepGrad
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(30, 70)
    ctx.lineTo(W - 30, 70)
    ctx.stroke()
    
    drawLove(ctx, W/2, 70, 6, THEME.tertiary, 1, 12)
    
    ctx.shadowBlur = 5
    ctx.shadowColor = THEME.primary
    
    ctx.fillStyle = THEME.cardBg
    roundRect(ctx, 20, 88, 140, 200, 12)
    ctx.fill()
    
    const posterColors = [THEME.primary, THEME.secondary, THEME.tertiary, THEME.blue, THEME.cyan]
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = posterColors[i % posterColors.length]
        ctx.lineWidth = 1
        roundRect(ctx, 20 - i, 88 - i, 140 + (i * 2), 200 + (i * 2), 12 + i)
        ctx.stroke()
    }
    
    try {
        if (anime.image) {
            const imgResponse = await axios.get(anime.image, { responseType: 'arraybuffer', timeout: 10000 })
            const imgBuffer = Buffer.from(imgResponse.data)
            const poster = await loadImage(imgBuffer)
            ctx.save()
            roundRect(ctx, 22, 90, 136, 196, 10)
            ctx.clip()
            ctx.drawImage(poster, 22, 90, 136, 196)
            ctx.restore()
        } else {
            throw new Error('No image')
        }
    } catch (err) {
        ctx.fillStyle = THEME.primary
        ctx.font = 'bold 13px "Segoe UI"'
        ctx.textAlign = 'center'
        ctx.fillText('NO POSTER', 90, 188)
    }
    ctx.shadowBlur = 0
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 17px "Segoe UI"'
    ctx.textAlign = 'left'
    let title = anime.title.length > 45 ? anime.title.substring(0, 42) + '...' : anime.title
    ctx.fillText(title, 178, 118)
    
    if (anime.titleJapanese && anime.titleJapanese !== anime.title) {
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '11px "Segoe UI"'
        let jpTitle = anime.titleJapanese.length > 40 ? anime.titleJapanese.substring(0, 37) + '...' : anime.titleJapanese
        ctx.fillText(jpTitle, 178, 143)
    }
    
    if (anime.score !== 'N/A') {
        ctx.fillStyle = THEME.rating
        ctx.font = 'bold 17px "Segoe UI"'
        ctx.fillText(`★ ${anime.score}`, 178, 176)
        if (anime.scoredBy > 0) {
            ctx.fillStyle = THEME.textSecondary
            ctx.font = '9px "Segoe UI"'
            ctx.fillText(`(${formatNumber(anime.scoredBy)} users)`, 178, 194)
        }
    }
    
    let infoY = 315
    ctx.fillStyle = `${THEME.cardBg}dd`
    roundRect(ctx, 20, infoY - 8, W - 40, 48, 10)
    ctx.fill()
    
    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ INFO', 35, infoY + 6)
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px "Segoe UI"'
    ctx.fillText(`${anime.type}  ◆  ${anime.episodes} eps  ◆  ${anime.duration}`, 35, infoY + 26)
    
    infoY += 55
    
    ctx.fillStyle = `${THEME.cardBg}dd`
    roundRect(ctx, 20, infoY - 8, W - 40, 70, 10)
    ctx.fill()
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ STATUS', 35, infoY + 6)
    ctx.fillStyle = THEME.success
    ctx.font = '10px "Segoe UI"'
    ctx.fillText(anime.status, 35, infoY + 28)
    
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ STUDIO', 210, infoY + 6)
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px "Segoe UI"'
    let studioShort = anime.studio.length > 28 ? anime.studio.substring(0, 25) + '...' : anime.studio
    ctx.fillText(studioShort, 210, infoY + 28)
    
    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ AIRED', 410, infoY + 6)
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px "Segoe UI"'
    let airedShort = anime.aired.split(',')[0]
    ctx.fillText(airedShort.length > 25 ? airedShort.substring(0, 22) + '...' : airedShort, 410, infoY + 28)
    
    infoY += 78
    
    if (anime.genres.length > 0) {
        const genresPerRow = 4
        const genreRows = Math.ceil(anime.genres.length / genresPerRow)
        const genreCardHeight = 45 + (genreRows * 20)
        
        ctx.fillStyle = `${THEME.cardBg}dd`
        roundRect(ctx, 20, infoY - 8, W - 40, genreCardHeight, 10)
        ctx.fill()
        
        ctx.fillStyle = THEME.tertiary
        ctx.font = 'bold 11px "Segoe UI"'
        ctx.fillText('▸ GENRES', 35, infoY + 6)
        
        let genreX = 35
        let genreY = infoY + 28
        for (let i = 0; i < anime.genres.length; i++) {
            const genre = anime.genres[i]
            const symbol = genreSymbols[genre] || '◆'
            ctx.fillStyle = THEME.secondary
            ctx.font = '10px "Segoe UI"'
            ctx.fillText(`${symbol} ${genre}`, genreX, genreY)
            genreX += 105
            if (genreX > W - 60) {
                genreX = 35
                genreY += 20
            }
        }
        infoY += genreCardHeight + 8
    }
    
    const synopsisText = anime.synopsis.length > 400 ? anime.synopsis.substring(0, 400) + '...' : anime.synopsis
    const lineHeight = 14
    const maxWidth = W - 70
    ctx.font = '10px "Segoe UI"'
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
    
    const synopsisHeight = Math.min(180, lines.length * lineHeight + 35)
    
    ctx.fillStyle = `${THEME.cardBg}dd`
    roundRect(ctx, 20, infoY - 8, W - 40, synopsisHeight + 15, 10)
    ctx.fill()
    
    ctx.fillStyle = THEME.blue
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ SYNOPSIS', 35, infoY + 6)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px "Segoe UI"'
    let synY = infoY + 28
    for (const line of lines.slice(0, 16)) {
        ctx.fillText(line, 35, synY)
        synY += lineHeight
    }
    
    infoY += synopsisHeight + 25
    
    ctx.fillStyle = `${THEME.cardBg}dd`
    roundRect(ctx, 20, infoY - 8, W - 40, 60, 10)
    ctx.fill()
    
    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ RANK', 35, infoY + 6)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`#${anime.rank}`, 35, infoY + 34)
    
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ POPULARITY', 190, infoY + 6)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`#${anime.popularity}`, 190, infoY + 34)
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ FAVORITES', 380, infoY + 6)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`${formatNumber(anime.favorites)}`, 380, infoY + 34)
    
    ctx.fillStyle = THEME.success
    ctx.font = 'bold 11px "Segoe UI"'
    ctx.fillText('▸ MEMBERS', 520, infoY + 6)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`${formatNumber(anime.members)}`, 520, infoY + 34)
    
    ctx.fillStyle = `${THEME.primary}90`
    ctx.font = '9px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ NusaBot  |  Data from MyAnimeList (Jikan API) ♡', W/2, H - 12)
    
    return canvas.toBuffer('image/png')
}

function formatCaption(anime) {
    let caption = `♡ *ZERO TWO ANIME INFO* ♡\n\n`
    caption += `*📺 ${anime.title}*\n`
    if (anime.titleJapanese) caption += `*${anime.titleJapanese}*\n`
    caption += `\n`
    caption += `★ *Score:* ${anime.score} (${formatNumber(anime.scoredBy)} users)\n`
    caption += `📊 *Rank:* #${anime.rank}  ◆  🔥 *Popularity:* #${anime.popularity}\n`
    caption += `❤️ *Favorites:* ${formatNumber(anime.favorites)}  ◆  👥 *Members:* ${formatNumber(anime.members)}\n`
    caption += `\n`
    caption += `📺 *Type:* ${anime.type}\n`
    caption += `📀 *Episode:* ${anime.episodes}\n`
    caption += `⏱️ *Durasi:* ${anime.duration}\n`
    caption += `🎬 *Studio:* ${anime.studio}\n`
    caption += `📅 *Rilis:* ${anime.aired}\n`
    caption += `📌 *Status:* ${anime.status}\n`
    if (anime.genres.length > 0) caption += `🎭 *Genre:* ${anime.genres.join(', ')}\n`
    caption += `\n`
    caption += `📖 *Sinopsis:*\n${anime.synopsis.substring(0, 450)}${anime.synopsis.length > 450 ? '...' : ''}\n\n`
    caption += `💕 *Zero Two:* ${['Ini anime favoritmu darling? ♡', 'Ayo tonton bareng~ 💕', 'Seru nih animenya!', 'Mau rekomendasi anime lain?', 'Darling suka anime ini? ♡'][Math.floor(Math.random() * 5)]} 🦋`
    
    return caption
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `♡ *ZERO TWO ANIME SEARCH* ♡\n\n` +
            `📌 *Cara pakai:*\n` +
            `• ${m.prefix}anime <judul anime>\n\n` +
            `📌 *Contoh:*\n` +
            `• ${m.prefix}anime darling in the franxx\n` +
            `• ${m.prefix}anime naruto\n\n` +
            `💕 *Zero Two:* Cari anime apa nih darling~? ♡`
        )
    }
    
    await m.react('💕')
    
    try {
        await m.reply(`🦋 *Zero Two:* Sedang mencari anime *${query}* darling~ tunggu sebentar ya! 💕`)
        
        const result = await searchAnime(query)
        
        if (!result.success) {
            await m.react('💔')
            return m.reply(`💔 *Anime tidak ditemukan!*\n\nJudul *${query}* gak ketemu di database MyAnimeList.\n\nCoba cek ejaannya ya darling~ ♡`)
        }
        
        const anime = result.data
        
        try {
            const imgBuffer = await renderAnimeCard(anime)
            if (imgBuffer) {
                await sock.sendMessage(m.chat, {
                    image: imgBuffer,
                    caption: formatCaption(anime)
                }, { quoted: m })
            } else {
                await m.reply(formatCaption(anime))
            }
        } catch (imgErr) {
            console.error('[Anime] Canvas error:', imgErr)
            await m.reply(formatCaption(anime))
        }
        
        await m.react('💕')
        
    } catch (err) {
        console.error('[Anime] Error:', err)
        await m.react('💔')
        await m.reply(`💔 *Error Darling!*\n\n> ${err.message}\n\nCoba lagi nanti ya~ ♡`)
    }
}

module.exports = { config: pluginConfig, handler }