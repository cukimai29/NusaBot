const config = {
    name: 'animequotes2',
    alias: ['animequote2', 'quotesanime2', 'aq2'],
    category: 'anime',
    description: 'Kutipan bijak dari anime terkenal',
    usage: '.animequotes',
    example: '.animequotes',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const API = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/anime-quotes.json"

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

async function handler(m) {
    const result = await getQuotes()
    
    if (!result.ok || result.quotes.length === 0) {
        return m.reply(`❌ *GAGAL MENGAMBIL QUOTES*\n\n> Error: ${result.error || 'Data tidak ditemukan'}\n> Coba lagi nanti, Darling~`)
    }
    
    const randomIndex = Math.floor(Math.random() * result.quotes.length)
    const selected = result.quotes[randomIndex]
    
    const quote = selected.quote || selected.text || selected.kata || 'Tidak tersedia'
    const character = selected.character || selected.char || selected.name || selected.tokoh || 'Unknown'
    const anime = selected.anime || selected.title || selected.source || 'Unknown'
    
    let txt = `✨ *ᴀɴɪᴍᴇ ǫᴜᴏᴛᴇꜱ* ✨\n\n`
    txt += `╭──〔 💕 *ᴋᴜᴛɪᴘᴀɴ ʜᴀʀɪ ɪɴɪ* 〕───⬣\n`
    txt += `│  📝 *"${quote}"*\n`
    txt += `│\n`
    txt += `│  🎭 *${character}*\n`
    txt += `│  🎬 *${anime}*\n`
    txt += `╰────────────────⬣\n\n`
    txt += `> 💡 Ketik .animequotes lagi untuk kutipan lain, Darling~`
    
    await m.reply(txt)
}

module.exports = {
    config,
    handler
}