const axios = require('axios')
const { createCanvas } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'animequote',
    alias: ['animequotes', 'quoteanime', 'randomquotes'],
    category: 'anime',
    description: 'Menampilkan quote random dari karakter anime terkenal',
    usage: '.animequote [nama karakter/anime]',
    example: '.animequote\n.animequote zero two\n.animequote naruto',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

// TEMA BARU: Putih + Pink + Merah + Ungu (tanpa emoji)
const THEME = {
    bg: '#ffffff',           // background putih
    primary: '#ff2a6d',      // merah zero two
    secondary: '#ff69b4',    // pink cerah
    tertiary: '#a855f7',     // ungu
    textDark: '#1a1a2e',     // teks gelap
    textLight: '#4a4a6a',
    cardBg: '#faf5ff',       // putih keunguan tipis
    quoteBox: '#fdf2f8',     // pink sangat tipis
    border: '#ff2a6d'
}

// ============ DATABASE QUOTE (Simbol diganti, tanpa emoji) ============
const animeQuotes = [
    // Zero Two
    { quote: "Aku akan selalu menjadi darling-mu, tak peduli apa pun yang terjadi.", character: "Zero Two", anime: "Darling in the Franxx", symbol: "♡" },
    { quote: "Kupikir aku dilahirkan untuk bertemu denganmu.", character: "Zero Two", anime: "Darling in the Franxx", symbol: "◇" },
    { quote: "Jika kau mati, matilah bersamaku. Jika kau hidup, hiduplah bersamaku.", character: "Zero Two", anime: "Darling in the Franxx", symbol: "♢" },
    { quote: "Aku bukan manusia. Tapi selama aku bersamamu, aku merasa manusia.", character: "Zero Two", anime: "Darling in the Franxx", symbol: "♡" },
    { quote: "Hidup itu sendiri adalah sebuah perjalanan untuk belajar jatuh cinta.", character: "Zero Two", anime: "Darling in the Franxx", symbol: "✧" },
    // Naruto
    { quote: "Believe it! Aku tidak akan pernah menyerah!", character: "Naruto Uzumaki", anime: "Naruto", symbol: "★" },
    { quote: "Ketika seseorang terluka, mereka mungkin menyakiti orang lain juga.", character: "Sasuke Uchiha", anime: "Naruto", symbol: "⚡" },
    { quote: "Kegagalan adalah batu loncatan menuju kesuksesan.", character: "Rock Lee", anime: "Naruto", symbol: "✦" },
    { quote: "Seorang hokage adalah orang yang sabar dan tidak pernah menyerah.", character: "Naruto Uzumaki", anime: "Naruto", symbol: "♔" },
    // Jujutsu Kaisen
    { quote: "Matilah dengan bermartabat. Itu lebih baik daripada hidup tapi menghinamu.", character: "Satoru Gojo", anime: "Jujutsu Kaisen", symbol: "👁️" },
    { quote: "Kamu adalah orang terkuatku, jangan cemas.", character: "Satoru Gojo", anime: "Jujutsu Kaisen", symbol: "✨" },
    { quote: "Kematian bukanlah akhir dari segalanya.", character: "Yuji Itadori", anime: "Jujutsu Kaisen", symbol: "✊" },
    // Attack on Titan
    { quote: "Jika kau tidak mau mati, teruslah hidup!", character: "Eren Yeager", anime: "Attack on Titan", symbol: "⚔️" },
    { quote: "Kebebasan itu ada. Aku akan mengambilnya!", character: "Eren Yeager", anime: "Attack on Titan", symbol: "🕊️" },
    { quote: "Dunia ini kejam dan juga sangat indah.", character: "Mikasa Ackerman", anime: "Attack on Titan", symbol: "💔" },
    // One Piece
    { quote: "Aku akan menjadi Raja Bajak Laut!", character: "Monkey D. Luffy", anime: "One Piece", symbol: "♤" },
    { quote: "Aku tidak akan mati, partnerku.", character: "Roronoa Zoro", anime: "One Piece", symbol: "🗡️" },
    { quote: "Bermimpilah tanpa menyerah! Aku akan mewujudkannya!", character: "Monkey D. Luffy", anime: "One Piece", symbol: "♧" },
    // Spy x Family
    { quote: "Untuk perdamaian dunia!", character: "Loid Forger", anime: "Spy x Family", symbol: "♢" },
    { quote: "Waku waku!", character: "Anya Forger", anime: "Spy x Family", symbol: "☕" },
    // Demon Slayer
    { quote: "Jangan pernah menyerah, teruslah berjuang!", character: "Tanjiro Kamado", anime: "Demon Slayer", symbol: "🌊" },
    { quote: "Keluarga adalah segalanya bagiku.", character: "Tanjiro Kamado", anime: "Demon Slayer", symbol: "🏠" },
    // My Hero Academia
    { quote: "Ini cerita bagaimana aku menjadi pahlawan terhebat!", character: "Izuku Midoriya", anime: "My Hero Academia", symbol: "💚" },
    { quote: "Sekarang giliranku!", character: "All Might", anime: "My Hero Academia", symbol: "💪" },
    // Death Note
    { quote: "Aku akan menjadi dewa dunia baru!", character: "Light Yagami", anime: "Death Note", symbol: "📓" },
    { quote: "Manusia takut pada kematian... itu wajar.", character: "L", anime: "Death Note", symbol: "🍰" },
    // Fullmetal Alchemist
    { quote: "Tanpa pengorbanan, tidak ada yang bisa didapatkan.", character: "Edward Elric", anime: "Fullmetal Alchemist", symbol: "⚙️" },
    { quote: "Tidak ada yang sempurna di dunia ini.", character: "Alphonse Elric", anime: "Fullmetal Alchemist", symbol: "🛡️" },
    // Chainsaw Man
    { quote: "Aku ingin pegangan. Dengan seseorang. Siapa saja.", character: "Denji", anime: "Chainsaw Man", symbol: "⛓️" },
    { quote: "Jika aku mati, aku akan rindu makan roti.", character: "Denji", anime: "Chainsaw Man", symbol: "🍞" }
]

// Anime Quote API (fallback)
const QUOTE_API = "https://animechan.xyz/api/random"

async function fetchRandomQuoteFromAPI() {
    try {
        const response = await axios.get(QUOTE_API, {
            timeout: 5000,
            headers: { 'User-Agent': 'ZeroTwo-Bot/1.0' }
        })
        if (response.data && response.data.quote) {
            return {
                success: true,
                quote: response.data.quote,
                character: response.data.character,
                anime: response.data.anime
            }
        }
        return { success: false }
    } catch (err) {
        console.log('[AnimeQuote] API error:', err.message)
        return { success: false }
    }
}

function filterQuotesByKeyword(keyword) {
    if (!keyword) return null
    const lowerKeyword = keyword.toLowerCase()
    const filtered = animeQuotes.filter(q => 
        q.character.toLowerCase().includes(lowerKeyword) || 
        q.anime.toLowerCase().includes(lowerKeyword) ||
        q.quote.toLowerCase().includes(lowerKeyword)
    )
    return filtered.length > 0 ? filtered : null
}

function getRandomQuote() {
    return animeQuotes[Math.floor(Math.random() * animeQuotes.length)]
}

// ============ RENDER CARD dengan Background Putih & Simbol ============
async function renderQuoteCard(quote, character, anime, symbol) {
    const W = 550
    const H = 380
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // 1. Background putih
    ctx.fillStyle = THEME.bg
    ctx.fillRect(0, 0, W, H)

    // 2. Dekorasi latar: garis-garis halus pink/ungu
    ctx.save()
    ctx.globalAlpha = 0.1
    for (let i = 0; i < W; i += 30) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H)
        ctx.strokeStyle = THEME.primary
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.strokeStyle = THEME.tertiary
        ctx.stroke()
    }
    ctx.restore()

    // 3. Border luar ganda
    ctx.strokeStyle = THEME.primary
    ctx.lineWidth = 2
    ctx.strokeRect(12, 12, W - 24, H - 24)
    ctx.strokeStyle = THEME.secondary
    ctx.lineWidth = 1.5
    ctx.strokeRect(16, 16, W - 32, H - 32)

    // 4. Simbol besar di sudut kiri atas (tanpa emoji)
    ctx.fillStyle = THEME.primary
    ctx.font = '42px "Segoe UI", "Arial"'
    ctx.fillText(symbol || '♡', 25, 65)

    // 5. Kotak quote dengan background pink lembut + border ungu
    ctx.fillStyle = THEME.quoteBox
    ctx.shadowBlur = 0
    roundRect(ctx, 25, 85, W - 50, 190, 15)
    ctx.fill()
    ctx.strokeStyle = THEME.tertiary
    ctx.lineWidth = 1
    ctx.stroke()

    // 6. Teks quote (word wrapping)
    ctx.fillStyle = THEME.textDark
    ctx.font = 'italic 14px "Segoe UI", "Roboto"'
    ctx.textAlign = 'center'
    
    const maxWidth = W - 90
    const words = quote.split(' ')
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
    
    let y = 118
    for (const line of lines) {
        ctx.fillText(line, W/2, y)
        y += 24
    }

    // 7. Karakter dan anime
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 15px "Segoe UI"'
    ctx.fillText(`— ${character}`, W/2, y + 18)
    
    ctx.fillStyle = THEME.tertiary
    ctx.font = '12px "Segoe UI"'
    ctx.fillText(`◆ ${anime} ◆`, W/2, y + 45)

    // 8. Footer dekorasi
    ctx.fillStyle = THEME.secondary
    ctx.font = '9px "Segoe UI"'
    ctx.fillText('✧ NusaBot  |  ANIME QUOTES ✧', W/2, H - 20)

    // 9. Aksen kecil pojok kanan bawah
    ctx.fillStyle = THEME.primary
    ctx.font = '18px "Segoe UI"'
    ctx.fillText('♡', W - 30, H - 22)

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
}

// ============ CAPTION TANPA EMOJI ============
function formatCaption(quote, character, anime, isFiltered = false, keyword = '') {
    let caption = `◇ ZERO TWO ANIME QUOTE ◇\n\n`
    if (isFiltered) {
        caption += `▸ Filter: "${keyword}"\n\n`
    }
    caption += `“${quote}”\n\n`
    caption += `— ${character}\n`
    caption += `◆ ${anime} ◆\n\n`
    caption += `♡ Zero Two: ${['Quote favoritmu?', 'Simpan ya darling~', 'Bisa buat status WA nih~'][Math.floor(Math.random() * 3)]} ♡`
    return caption
}

// ============ HANDLER ============
async function handler(m, { sock }) {
    const query = m.text?.trim() || ''
    
    await m.react('⏳')
    
    try {
        if (query && query.length > 0) {
            const filtered = filterQuotesByKeyword(query)
            
            if (filtered && filtered.length > 0) {
                const randomFromFilter = filtered[Math.floor(Math.random() * filtered.length)]
                const img = await renderQuoteCard(
                    randomFromFilter.quote,
                    randomFromFilter.character,
                    randomFromFilter.anime,
                    randomFromFilter.symbol
                )
                await sock.sendMessage(m.chat, {
                    image: img,
                    caption: formatCaption(randomFromFilter.quote, randomFromFilter.character, randomFromFilter.anime, true, query)
                }, { quoted: m })
                await m.react('✅')
                return
            }
            
            const apiQuote = await fetchRandomQuoteFromAPI()
            if (apiQuote.success && 
                (apiQuote.character.toLowerCase().includes(query.toLowerCase()) || 
                 apiQuote.anime.toLowerCase().includes(query.toLowerCase()))) {
                const img = await renderQuoteCard(
                    apiQuote.quote,
                    apiQuote.character,
                    apiQuote.anime,
                    '✧'
                )
                await sock.sendMessage(m.chat, {
                    image: img,
                    caption: formatCaption(apiQuote.quote, apiQuote.character, apiQuote.anime, true, query)
                }, { quoted: m })
                await m.react('✅')
                return
            }
            
            await m.react('❌')
            return m.reply(`❌ Quote tidak ditemukan!\n\nTidak ada quote dari "${query}" di database.\n\n◆ Coba kata kunci lain:\n.example .animequote naruto\n.example .animequote zero two\n\n♡ Zero Two: Mungkin lain kali ya darling~`)
        }
        
        // Random quote
        let quote, character, anime, symbol
        const randomQuote = getRandomQuote()
        quote = randomQuote.quote
        character = randomQuote.character
        anime = randomQuote.anime
        symbol = randomQuote.symbol
        
        const img = await renderQuoteCard(quote, character, anime, symbol)
        await sock.sendMessage(m.chat, {
            image: img,
            caption: formatCaption(quote, character, anime)
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (err) {
        console.error('[AnimeQuote] Error:', err)
        await m.react('❌')
        try {
            const fallbackQuote = getRandomQuote()
            await m.reply(formatCaption(fallbackQuote.quote, fallbackQuote.character, fallbackQuote.anime))
        } catch {
            await m.reply(`❌ Error: ${err.message}\nCoba lagi nanti ya darling~`)
        }
    }
}

module.exports = { config: pluginConfig, handler }