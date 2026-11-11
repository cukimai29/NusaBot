const config = {
    name: 'filsufquotes',
    alias: ['filsuf', 'philosopher', 'fq'],
    category: 'fun',
    description: 'Kutipan bijak dari para filsuf terkenal',
    usage: '.filsufquotes',
    example: '.filsufquotes',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const API = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/filsuf-quotes.json"

async function getQuotes() {
    const axios = require('axios')
    
    try {
        const { data, status } = await axios.get(API, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json,text/plain,*/*"
            }
        })
        
        let quotes = []
        if (Array.isArray(data)) quotes = data
        else if (Array.isArray(data.quotes)) quotes = data.quotes
        else if (Array.isArray(data.result)) quotes = data.result
        else if (Array.isArray(data.data)) quotes = data.data
        
        return {
            ok: true,
            code: status,
            quotes: quotes
        }
    } catch (error) {
        return {
            ok: false,
            code: error.response?.status || 500,
            quotes: [],
            error: error.message
        }
    }
}

function getQuoteText(selected) {
    let quote = selected.quote || selected.text || selected.kata || null
    
    if (selected.translation && quote) {
        quote = `${quote}\n\n📝 *Terjemahan:* ${selected.translation}`
    }
    
    return quote
}

function getPhilosopher(selected) {
    return selected.philosopher || selected.author || selected.filsuf || selected.name || 'Unknown'
}

async function handler(m) {
    const result = await getQuotes()
    
    if (!result.ok || result.quotes.length === 0) {
        return m.reply(`❌ *GAGAL MENGAMBIL QUOTES*\n\n> Error: ${result.error || 'Data tidak ditemukan'}\n> Coba lagi nanti, Darling~`)
    }
    
    const randomIndex = Math.floor(Math.random() * result.quotes.length)
    const selected = result.quotes[randomIndex]
    
    const quote = getQuoteText(selected)
    const philosopher = getPhilosopher(selected)
    
    if (!quote) {
        return m.reply(`❌ *GAGAL MEMBACA QUOTE*\n\n> Coba lagi nanti, Darling~`)
    }
    
    let txt = `📚 *ꜰɪʟꜱᴜꜰ Qᴜᴏᴛᴇꜱ* 📚\n\n`
    txt += `╭──〔 💭 *ᴋᴜᴛɪᴘᴀɴ ʜᴀʀɪ ɪɴɪ* 〕───⬣\n`
    txt += `│  📝 *"${quote}"*\n`
    txt += `│\n`
    txt += `│  🎭 *~ ${philosopher}*\n`
    txt += `╰────────────────⬣\n\n`
    txt += `> 💡 Ketik .filsufquotes lagi untuk kutipan lain, Darling~`
    
    await m.reply(txt)
}

module.exports = {
    config,
    handler
}