const axios = require('axios')
const { createCanvas, loadImage } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'anime',
    alias: ['animeinfo', 'animedetail', 'infonime'],
    category: 'anime',
    description: 'Mencari informasi lengkap anime dari MyAnimeList (Jikan API)',
    usage: '.anime <judul anime>',
    example: '.anime darling in the franxx\n.anime naruto\n.anime jujutsu kaisen',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// ============ ZERO TWO GLOWING THEME ============
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

// Genre ke simbol
const genreSymbols = {
    'Action': '⚡', 'Adventure': '🗺️', 'Comedy': '😂', 'Drama': '🎭',
    'Fantasy': '✨', 'Horror': '👻', 'Mystery': '🕵️', 'Romance': '💕',
    'Sci-Fi': '🚀', 'Slice of Life': '🌸', 'Sports': '⚽', 'Supernatural': '🔮',
    'Thriller': '🔪', 'Ecchi': '😳', 'Mecha': '🤖', 'Psychological': '🧠',
    'Seinen': '📖', 'Shounen': '⚡', 'Shoujo': '💖', 'Josei': '👩'
}

const JIKAN_API = "https://api.jikan.moe/v4"

// Cache
const cache = new Map()
const CACHE_DURATION = 30 * 60 * 1000 // 30 menit

// Queue sederhana
let isRequesting = false
const requestQueue = []

async function queueRequest(fn) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ fn, resolve, reject })
        processQueue()
    })
}

async function processQueue() {
    if (isRequesting || requestQueue.length === 0) return
    isRequesting = true
    
    const { fn, resolve, reject } = requestQueue.shift()
    try {
        const result = await fn()
        resolve(result)
    } catch (err) {
        reject(err)
    } finally {
        isRequesting = false
        setTimeout(processQueue, 1000) // 1 detik antar request
    }
}

async function searchAnime(query) {
    const cacheKey = query.toLowerCase().trim()
    
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data
        }
        cache.delete(cacheKey)
    }
    
    return queueRequest(async () => {
        try {
            // Search anime - pake timeout kecil
            const searchRes = await axios.get(`${JIKAN_API}/anime`, {
                params: { q: query, limit: 1, sfw: true },
                timeout: 10000,
                headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
            })
            
            if (!searchRes.data?.data?.length) {
                return { success: false, error: 'Anime tidak ditemukan' }
            }
            
            const anime = searchRes.data.data[0]
            const malId = anime.mal_id
            
            // Ambil detail
            const detailRes = await axios.get(`${JIKAN_API}/anime/${malId}`, { // pake endpoint biasa, bukan /full biar cepet
                timeout: 10000,
                headers: { 'User-Agent': 'ZeroTwo-Bot/2.0' }
            })
            
            const data = detailRes.data.data
            
            const result = {
                success: true,
                data: {
                    id: data.mal_id,
                    title: data.title || 'Unknown',
                    titleEnglish: data.title_english,
                    titleJapanese: data.title_japanese,
                    synopsis: data.synopsis?.substring(0, 300) || 'Tidak ada sinopsis',
                    type: data.type || 'Unknown',
                    episodes: data.episodes || '?',
                    status: data.status || 'Unknown',
                    aired: data.aired?.string?.split(',')[0] || 'Unknown',
                    duration: data.duration || 'Unknown',
                    score: data.score || 'N/A',
                    scoredBy: data.scored_by || 0,
                    rank: data.rank || 'N/A',
                    popularity: data.popularity || 'N/A',
                    members: data.members || 0,
                    favorites: data.favorites || 0,
                    studio: data.studios?.[0]?.name || 'Unknown',
                    genres: data.genres?.map(g => g.name) || [],
                    image: data.images?.jpg?.image_url || null
                }
            }
            
            cache.set(cacheKey, { data: result, timestamp: Date.now() })
            return result
            
        } catch (err) {
            console.error('[Anime] Error:', err.message)
            if (err.response?.status === 429) {
                return { success: false, error: 'Server sibuk, coba lagi 5 detik~' }
            }
            return { success: false, error: 'Gagal mengambil data anime' }
        }
    })
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

async function renderAnimeCard(anime) {
    const W = 620
    const H = 650 // Lebih pendek biar cepet render
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    
    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, THEME.bg)
    grad.addColorStop(1, THEME.bgGradient1)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    
    // Header
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 22px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ ZERO TWO ANIME INFO ♡', W/2, 40)
    
    // Poster
    ctx.fillStyle = THEME.cardBg
    roundRect(ctx, 20, 60, 120, 170, 10)
    ctx.fill()
    
    if (anime.image) {
        try {
            const imgResponse = await axios.get(anime.image, { 
                responseType: 'arraybuffer', 
                timeout: 5000 
            })
            const poster = await loadImage(Buffer.from(imgResponse.data))
            ctx.save()
            roundRect(ctx, 22, 62, 116, 166, 8)
            ctx.clip()
            ctx.drawImage(poster, 22, 62, 116, 166)
            ctx.restore()
        } catch (err) {
            ctx.fillStyle = THEME.primary
            ctx.font = 'bold 10px "Segoe UI"'
            ctx.fillText('NO IMAGE', 80, 145)
        }
    }
    
    // Title
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 14px "Segoe UI"'
    ctx.textAlign = 'left'
    let title = anime.title.length > 35 ? anime.title.substring(0, 32) + '...' : anime.title
    ctx.fillText(title, 155, 85)
    
    // Score
    if (anime.score !== 'N/A') {
        ctx.fillStyle = THEME.rating
        ctx.font = 'bold 13px "Segoe UI"'
        ctx.fillText(`★ ${anime.score}`, 155, 115)
    }
    
    // Info dasar
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText(`${anime.type} | ${anime.episodes} eps | ${anime.status}`, 155, 140)
    ctx.fillText(`${anime.studio}`, 155, 158)
    
    // Genre
    if (anime.genres.length > 0) {
        let genreText = anime.genres.slice(0, 3).join(', ')
        if (genreText.length > 40) genreText = genreText.substring(0, 37) + '...'
        ctx.fillStyle = THEME.secondary
        ctx.fillText(`🎭 ${genreText}`, 155, 180)
    }
    
    // Stats bar
    let y = 250
    ctx.fillStyle = `${THEME.cardBg}cc`
    roundRect(ctx, 20, y, W - 40, 50, 8)
    ctx.fill()
    
    ctx.fillStyle = THEME.warning
    ctx.font = 'bold 9px "Segoe UI"'
    ctx.fillText(`RANK #${anime.rank}`, 35, y + 20)
    ctx.fillStyle = THEME.cyan
    ctx.fillText(`POP #${anime.popularity}`, 180, y + 20)
    ctx.fillStyle = THEME.primary
    ctx.fillText(`❤️ ${formatNumber(anime.favorites)}`, 350, y + 20)
    ctx.fillStyle = THEME.success
    ctx.fillText(`👥 ${formatNumber(anime.members)}`, 490, y + 20)
    
    // Synopsis
    y += 70
    ctx.fillStyle = `${THEME.cardBg}cc`
    const synopsisHeight = Math.min(200, Math.ceil(anime.synopsis.length / 60) * 14 + 30)
    roundRect(ctx, 20, y, W - 40, synopsisHeight, 8)
    ctx.fill()
    
    ctx.fillStyle = THEME.blue
    ctx.font = 'bold 9px "Segoe UI"'
    ctx.fillText('SYNOPSIS', 35, y + 15)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '8px "Segoe UI"'
    let synopsis = anime.synopsis.length > 250 ? anime.synopsis.substring(0, 250) + '...' : anime.synopsis
    let lines = []
    let currentLine = ''
    for (let word of synopsis.split(' ')) {
        let testLine = currentLine + (currentLine ? ' ' : '') + word
        if (ctx.measureText(testLine).width > W - 70 && currentLine) {
            lines.push(currentLine)
            currentLine = word
        } else {
            currentLine = testLine
        }
    }
    lines.push(currentLine)
    
    let synY = y + 35
    for (let line of lines.slice(0, 12)) {
        ctx.fillText(line, 35, synY)
        synY += 12
    }
    
    // Footer
    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '7px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText('♡ NusaBot | MyAnimeList ♡', W/2, H - 10)
    
    return canvas.toBuffer('image/png')
}

function formatCaption(anime) {
    let caption = `♡ *${anime.title}* ♡\n`
    if (anime.titleJapanese) caption += `*${anime.titleJapanese}*\n`
    caption += `\n★ *Score:* ${anime.score}`
    if (anime.scoredBy > 0) caption += ` (${formatNumber(anime.scoredBy)} users)`
    caption += `\n📊 *Rank:* #${anime.rank} | 🔥 *Popular:* #${anime.popularity}`
    caption += `\n❤️ *Favs:* ${formatNumber(anime.favorites)} | 👥 *Members:* ${formatNumber(anime.members)}`
    caption += `\n\n📺 *${anime.type}* | ${anime.episodes} eps | ${anime.status}`
    caption += `\n🎬 *${anime.studio}*`
    if (anime.genres.length) caption += `\n🎭 *${anime.genres.join(', ')}*`
    caption += `\n\n📖 ${anime.synopsis.substring(0, 200)}${anime.synopsis.length > 200 ? '...' : ''}`
    caption += `\n\n💕 *Zero Two:* Selamat menonton darling~ ♡`
    return caption
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `♡ *ZERO TWO ANIME SEARCH* ♡\n\n` +
            `📌 *Cara:* ${m.prefix}anime <judul>\n` +
            `📌 *Contoh:* ${m.prefix}anime naruto\n\n` +
            `💕 Cari anime apa darling~?`
        )
    }
    
    await m.react('💕')
    
    try {
        const result = await searchAnime(query)
        
        if (!result.success) {
            await m.react('💔')
            return m.reply(`💔 *${result.error}*\n\nCoba cek ejaan judulnya ya darling~`)
        }
        
        const anime = result.data
        
        try {
            const imgBuffer = await renderAnimeCard(anime)
            await sock.sendMessage(m.chat, {
                image: imgBuffer,
                caption: formatCaption(anime)
            }, { quoted: m })
        } catch (imgErr) {
            await m.reply(formatCaption(anime))
        }
        
        await m.react('💕')
        
    } catch (err) {
        console.error('[Anime] Error:', err)
        await m.react('💔')
        await m.reply(`💔 *Error!*\n${err.message}\n\nCoba lagi nanti~`)
    }
}

module.exports = { config: pluginConfig, handler }