const axios = require('axios')
const { createCanvas } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'topanime',
    alias: ['animelist', 'topanimelist', 'rankanime'],
    category: 'anime',
    description: 'Top anime berdasarkan rating, popularity, atau favorite dari MyAnimeList',
    usage: '.topanime [type]',
    example: '.topanime\n.topanime rating\n.topanime popular\n.topanime favorite',
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
    primary: '#ff2a6d',
    secondary: '#ff69b4',
    white: '#ffffff',
    gray: '#ff99bb',
    glow: '#ff2a6d',
    cardBg: '#1a0b1a',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    bronze: '#cd7f32'
}

// API Jikan
const JIKAN_API = "https://api.jikan.moe/v4"

// Cache
const cache = new Map()
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 jam

async function getTopAnime(filter = 'byrating', limit = 10) {
    const cacheKey = `top_${filter}`
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data
        cache.delete(cacheKey)
    }

    try {
        const response = await axios.get(`${JIKAN_API}/top/anime`, {
            params: { filter, limit, sfw: true },
            timeout: 10000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/1.0' }
        })

        if (!response.data.data) {
            return { success: false, error: 'Gagal mengambil data' }
        }

        const animes = response.data.data.map(anime => ({
            rank: anime.rank,
            title: anime.title,
            score: anime.score || 'N/A',
            scoredBy: anime.scored_by || 0,
            episodes: anime.episodes || '?',
            members: anime.members || 0,
            favorites: anime.favorites || 0,
            year: anime.year || '?',
            genres: anime.genres?.slice(0, 2).map(g => g.name) || [],
            synopsis: anime.synopsis?.substring(0, 150) || '',
            image: anime.images?.jpg?.image_url,
            url: anime.url
        }))

        const result = { success: true, data: animes, filter }
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
    } catch (err) {
        console.error('[TopAnime] Error:', err.message)
        if (err.response?.status === 429) {
            return { success: false, error: 'Terlalu banyak request, coba lagi nanti darling~' }
        }
        return { success: false, error: err.message }
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

function getMedalColor(rank) {
    if (rank === 1) return THEME.gold
    if (rank === 2) return THEME.platinum
    if (rank === 3) return THEME.bronze
    return THEME.white
}

function getMedalEmoji(rank) {
    if (rank === 1) return '🏆'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '📌'
}

async function renderTopAnimeCard(animes, filter) {
    const w = 550
    let h = 380 + (animes.length * 40)
    h = Math.min(h, 850)
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, THEME.bg)
    grad.addColorStop(1, THEME.cardBg)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.globalAlpha = 0.05
    for (let i = 0; i < w; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, h)
        ctx.strokeStyle = THEME.primary
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(w, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = THEME.primary
    ctx.lineWidth = 3
    ctx.strokeRect(12, 12, w - 24, h - 24)

    // Header
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 20px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.shadowColor = THEME.glow
    ctx.shadowBlur = 10
    ctx.fillText('🏆 ZERO TWO TOP ANIME 🏆', w/2, 42)
    ctx.shadowBlur = 0

    let filterText = ''
    if (filter === 'byrating') filterText = '⭐ TOP RATING ⭐'
    else if (filter === 'bypopularity') filterText = '🔥 TOP POPULARITY 🔥'
    else if (filter === 'favorite') filterText = '❤️ TOP FAVORITE ❤️'
    
    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 12px "Segoe UI"'
    ctx.fillText(filterText, w/2, 68)

    let y = 105
    for (let i = 0; i < animes.length; i++) {
        const anime = animes[i]
        const medalColor = getMedalColor(anime.rank)
        const medalEmoji = getMedalEmoji(anime.rank)
        
        ctx.fillStyle = '#00000040'
        ctx.beginPath()
        roundRect(ctx, 25, y - 10, w - 50, 40, 8)
        ctx.fill()

        // Rank & Medal
        ctx.fillStyle = medalColor
        ctx.font = 'bold 14px "Segoe UI"'
        ctx.fillText(`${medalEmoji} #${anime.rank}`, 35, y + 6)

        // Title
        ctx.fillStyle = THEME.white
        ctx.font = 'bold 11px "Segoe UI"'
        let title = anime.title.length > 35 ? anime.title.substring(0, 32) + '...' : anime.title
        ctx.fillText(title, 80, y + 6)

        // Score
        ctx.fillStyle = THEME.gold
        ctx.font = 'bold 10px "Segoe UI"'
        ctx.fillText(`⭐ ${anime.score}`, w - 90, y + 6)

        // Info
        ctx.fillStyle = THEME.gray
        ctx.font = '9px "Segoe UI"'
        ctx.fillText(`📺 ${anime.episodes} eps • 📅 ${anime.year}`, 80, y + 23)
        
        ctx.fillStyle = THEME.secondary
        ctx.font = '9px "Segoe UI"'
        ctx.fillText(`❤️ ${formatNumber(anime.favorites)}`, w - 90, y + 23)

        y += 42
    }

    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '9px "Segoe UI"'
    ctx.fillText('❥ NusaBot | Data from MyAnimeList (Jikan API)', w/2, h - 18)

    return canvas.toBuffer('image/png')
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
    return ctx
}

function formatCaption(animes, filter) {
    let caption = `🏆 *ZERO TWO TOP ANIME* 🏆\n\n`
    
    if (filter === 'byrating') caption += `⭐ *TOP RATING* ⭐\n`
    else if (filter === 'bypopularity') caption += `🔥 *TOP POPULARITY* 🔥\n`
    else caption += `❤️ *TOP FAVORITE* ❤️\n`
    caption += `━━━━━━━━━━━━━━━━━━━━\n\n`
    
    for (const anime of animes) {
        const medal = getMedalEmoji(anime.rank)
        caption += `${medal} *${anime.rank}. ${anime.title}*\n`
        caption += `   ⭐ Score: ${anime.score} | 📺 ${anime.episodes} eps\n`
        caption += `   📅 Year: ${anime.year} | ❤️ Favorites: ${formatNumber(anime.favorites)}\n`
        if (anime.genres.length) caption += `   🎭 Genre: ${anime.genres.join(', ')}\n`
        caption += `   📖 ${anime.synopsis.substring(0, 100)}${anime.synopsis.length > 100 ? '...' : ''}\n\n`
    }
    
    caption += `💕 *Zero Two:* ${filter === 'byrating' ? 'Ini anime rating tertinggi darling~' : filter === 'bypopularity' ? 'Anime paling populer nih~' : 'Anime paling difavoritin oleh user!'} 🦋`
    
    return caption
}

async function handler(m, { sock }) {
    let query = m.text?.trim()?.toLowerCase() || 'rating'
    
    let filter = 'byrating'
    if (query === 'popular' || query === 'populer' || query === 'popularity') {
        filter = 'bypopularity'
    } else if (query === 'favorite' || query === 'fav' || query === 'favorit') {
        filter = 'favorite'
    } else if (query === 'rating' || query === 'top') {
        filter = 'byrating'
    }
    
    await m.react('🏆')
    
    try {
        let filterText = ''
        if (filter === 'byrating') filterText = 'rating tertinggi'
        else if (filter === 'bypopularity') filterText = 'paling populer'
        else filterText = 'paling difavoritin'
        
        await m.reply(`🦋 *Zero Two:* Lagi ambil daftar top anime ${filterText}... tunggu sebentar ya~ 🏆`)
        
        const result = await getTopAnime(filter, 10)
        
        if (!result.success) {
            await m.react('❌')
            return m.reply(`❌ *Gagal mengambil data!*\n\n${result.error}\n\nCoba lagi nanti ya darling~ 🦋`)
        }
        
        try {
            const imgBuffer = await renderTopAnimeCard(result.data, filter)
            await sock.sendMessage(m.chat, {
                image: imgBuffer,
                caption: formatCaption(result.data, filter)
            }, { quoted: m })
        } catch (imgErr) {
            console.error('[TopAnime] Canvas error:', imgErr)
            await m.reply(formatCaption(result.data, filter))
        }
        
        await m.react('✅')
        
    } catch (err) {
        console.error('[TopAnime] Error:', err)
        await m.react('❌')
        await m.reply(`❌ *Error:* ${err.message}\n\nCoba lagi nanti ya darling~ 🦋`)
    }
}

module.exports = { config: pluginConfig, handler }