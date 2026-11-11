const axios = require('axios')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'animesearch',
    alias: ['searchanime', 'carianime', 'animefind', 'infonime2'],
    category: 'anime',
    description: 'Cari informasi lengkap anime dari MyAnimeList',
    usage: '.animesearch <judul anime>',
    example: '.animesearch darling in the franxx\n.animesearch re zero\n.animesearch naruto',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// ZERO TWO GLOWING THEME (SAMA KAYA TOTALFITUR)
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

// Cache
const cache = new Map()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 jam

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

async function searchAnime(query, limit = 5) {
    const cacheKey = `search_${query.toLowerCase()}`
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data
        cache.delete(cacheKey)
    }

    try {
        await delay(1000)
        
        const searchRes = await axios.get(`${JIKAN_API}/anime`, {
            params: { q: query, limit: limit, sfw: true, order_by: 'popularity', sort: 'desc' },
            timeout: 15000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
        })

        if (!searchRes.data.data || searchRes.data.data.length === 0) {
            return { success: false, error: 'Anime tidak ditemukan' }
        }

        const animes = await Promise.all(searchRes.data.data.map(async (anime) => {
            await delay(300)
            
            // Ambil detail lengkap
            const detailRes = await axios.get(`${JIKAN_API}/anime/${anime.mal_id}/full`, {
                timeout: 15000,
                headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
            })
            
            const data = detailRes.data.data
            
            return {
                id: data.mal_id,
                title: data.title,
                titleEnglish: data.title_english,
                titleJapanese: data.title_japanese,
                synopsis: data.synopsis?.replace(/\[[^\]]+\]/g, '').substring(0, 200) || 'Tidak ada sinopsis',
                type: data.type || 'TV',
                episodes: data.episodes || '?',
                status: data.status || 'Unknown',
                aired: data.aired?.string || 'Unknown',
                season: data.season ? `${data.season} ${data.year}` : 'Unknown',
                duration: data.duration || 'Unknown',
                score: data.score || 'N/A',
                scoredBy: data.scored_by || 0,
                rank: data.rank || 'N/A',
                popularity: data.popularity || 'N/A',
                members: data.members || 0,
                favorites: data.favorites || 0,
                studio: data.studios?.[0]?.name || 'Unknown',
                genres: data.genres?.map(g => g.name).slice(0, 4) || [],
                image: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url,
                url: data.url
            }
        }))

        const result = { success: true, data: animes, query: query }
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
    } catch (err) {
        console.error('[AnimeSearch] Error:', err.message)
        if (err.response?.status === 429) {
            return { success: false, error: 'Terlalu banyak request, coba lagi nanti darling~' }
        }
        return { success: false, error: err.message }
    }
}

async function renderAnimeCard(anime, index) {
    const W = 920
    const H = 340
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, THEME.bg)
    grad.addColorStop(0.5, THEME.bgGradient1)
    grad.addColorStop(1, THEME.bgGradient2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Glow effect
    const glow = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, 250)
    glow.addColorStop(0, `${THEME.primary}15`)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Grid dekorasi
    ctx.globalAlpha = 0.05
    for (let i = 0; i < W; i += 45) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H)
        ctx.strokeStyle = THEME.primary
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Border
    const borderGrad = ctx.createLinearGradient(0, 0, W, 0)
    borderGrad.addColorStop(0, THEME.primary)
    borderGrad.addColorStop(0.5, THEME.secondary)
    borderGrad.addColorStop(1, THEME.tertiary)
    ctx.strokeStyle = borderGrad
    ctx.lineWidth = 2
    roundRect(ctx, 10, 10, W - 20, H - 20, 12)
    ctx.stroke()

    // Ranking number
    ctx.fillStyle = THEME.gold
    ctx.font = 'bold 28px "Segoe UI"'
    ctx.shadowColor = THEME.gold
    ctx.shadowBlur = 12
    ctx.fillText(`${index}`, 25, 55)
    ctx.shadowBlur = 0

    // Cover image
    try {
        if (anime.image) {
            const response = await axios.get(anime.image, { responseType: 'arraybuffer', timeout: 10000 })
            const imgBuffer = Buffer.from(response.data)
            const cover = await loadImage(imgBuffer)
            ctx.save()
            roundRect(ctx, 75, 20, 70, 95, 8)
            ctx.clip()
            ctx.drawImage(cover, 75, 20, 70, 95)
            ctx.restore()
        } else {
            ctx.fillStyle = THEME.cardBg
            roundRect(ctx, 75, 20, 70, 95, 8)
            ctx.fill()
            ctx.fillStyle = THEME.secondary
            ctx.font = '20px "Segoe UI"'
            ctx.fillText('📺', 108, 75)
        }
    } catch (err) {
        ctx.fillStyle = THEME.cardBg
        roundRect(ctx, 75, 20, 70, 95, 8)
        ctx.fill()
        ctx.fillStyle = THEME.secondary
        ctx.font = '20px "Segoe UI"'
        ctx.fillText('📺', 108, 75)
    }

    // Title
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 16px "Segoe UI"'
    ctx.textAlign = 'left'
    let title = anime.title.length > 55 ? anime.title.substring(0, 52) + '...' : anime.title
    ctx.fillText(title, 160, 42)

    // Score
    ctx.fillStyle = THEME.gold
    ctx.font = 'bold 12px "Segoe UI"'
    ctx.fillText(`★ ${anime.score}`, 160, 65)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`(${formatNumber(anime.scoredBy)} users)`, 235, 65)

    // Type & Episodes
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('📺 TYPE', 160, 88)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(anime.type, 215, 88)

    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('📀 EPS', 280, 88)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(anime.episodes, 330, 88)

    // Status & Year
    ctx.fillStyle = THEME.success
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('📌 STATUS', 160, 108)
    ctx.fillStyle = anime.status === 'Finished Airing' ? THEME.success : THEME.warning
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(anime.status, 215, 108)

    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('📅 YEAR', 280, 108)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(anime.aired.split(',')[0].substring(0, 15), 330, 108)

    // Studio
    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('🎬 STUDIO', 460, 88)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(anime.studio.length > 30 ? anime.studio.substring(0, 27) + '...' : anime.studio, 460, 108)

    // Rank & Popularity
    ctx.fillStyle = THEME.gold
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('🏆 RANK', 460, 42)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`#${anime.rank}`, 520, 42)
    
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('🔥 POP', 460, 65)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`#${anime.popularity}`, 520, 65)

    // Favorites & Members
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('❤️ FAV', 610, 42)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(formatNumber(anime.favorites), 665, 42)

    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('👥 MEM', 610, 65)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(formatNumber(anime.members), 665, 65)

    // Genres
    if (anime.genres.length > 0) {
        ctx.fillStyle = THEME.tertiary
        ctx.font = 'bold 10px "Segoe UI"'
        ctx.fillText('🎭 GENRES', 160, 132)
        
        let genreText = anime.genres.join(' ◆ ')
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '8px "Segoe UI"'
        ctx.fillText(genreText.length > 70 ? genreText.substring(0, 67) + '...' : genreText, 160, 148)
    }

    // Synopsis
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 10px "Segoe UI"'
    ctx.fillText('📖 SYNOPSIS', 460, 132)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '8px "Segoe UI"'
    let synopsis = anime.synopsis.length > 120 ? anime.synopsis.substring(0, 117) + '...' : anime.synopsis
    ctx.fillText(synopsis, 460, 148, 430)

    // Footer line
    ctx.strokeStyle = `${THEME.primary}40`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, H - 30)
    ctx.lineTo(W - 20, H - 30)
    ctx.stroke()

    // Link
    ctx.fillStyle = THEME.blue
    ctx.font = '8px "Segoe UI"'
    ctx.fillText(anime.url.substring(0, 70) + '...', 25, H - 12)

    // Love
    drawLove(ctx, W - 30, H - 18, 6, THEME.primary, 0.6, 4)

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🔍 *ZERO TWO ANIME SEARCH* 🔍\n\n` +
            `📌 *Cara pakai:*\n` +
            `• ${m.prefix}animesearch <judul anime>\n\n` +
            `📌 *Contoh:*\n` +
            `• ${m.prefix}animesearch darling in the franxx\n` +
            `• ${m.prefix}animesearch re zero\n` +
            `• ${m.prefix}animesearch naruto\n\n` +
            `💕 *Zero Two:* Mau cari anime apa darling~? 🦋`
        )
    }

    await m.react('💕')
    
    try {
        await m.reply(`🦋 *Zero Two:* Lagi nyari anime *${query}*... tunggu sebentar ya darling~ 🔍`)

        const result = await searchAnime(query, 5)
        
        if (!result.success) {
            await m.react('💔')
            return m.reply(`💔 *Anime tidak ditemukan!*\n\n*${query}* gak ketemu di database.\n\nCoba cek ejaannya atau pake judul lain ya darling~ 🦋`)
        }

        const animes = result.data
        let caption = `🔍 *SEARCH RESULT FOR "${query.toUpperCase()}"* 🔍\n\n`
        caption += `╭┈┈♡「 📊 FOUND 」\n`
        caption += `┃ ◦ Total: *${animes.length}* anime\n`
        caption += `╰┈┈♡\n\n`

        for (let i = 0; i < animes.length; i++) {
            const anime = animes[i]
            caption += `╭┈┈♡「 ${i+1}. *${anime.title}* 」\n`
            caption += `┃ ★ Score: *${anime.score}*\n`
            caption += `┃ 📺 Type: *${anime.type}* (${anime.episodes} eps)\n`
            caption += `┃ 📌 Status: *${anime.status}*\n`
            caption += `┃ 🎭 Genre: ${anime.genres.join(', ')}\n`
            caption += `┃ 🔗 Link: ${anime.url}\n`
            caption += `╰┈┈♡\n\n`
        }

        caption += `💕 *Zero Two:* ${animes.length > 1 ? `Wah ada ${animes.length} hasil darling, pilih yang mana?` : 'Ini dia anime yang darling cari~'} 🦋`

        // Kirim satu per satu card
        for (let i = 0; i < Math.min(animes.length, 5); i++) {
            try {
                const imgBuffer = await renderAnimeCard(animes[i], i + 1)
                await sock.sendMessage(m.chat, { image: imgBuffer }, { quoted: m })
                await delay(500)
            } catch (err) {
                console.error('[AnimeSearch] Card error:', err)
            }
        }
        
        // Kirim caption terakhir
        await sock.sendMessage(m.chat, { text: caption }, { quoted: m })
        
        await m.react('💕')
        
    } catch (err) {
        console.error('[AnimeSearch] Error:', err)
        await m.react('💔')
        await m.reply(`💔 *Error Darling!*\n\n> ${err.message}\n\nCoba lagi nanti ya~ ♡`)
    }
}

module.exports = { config: pluginConfig, handler }