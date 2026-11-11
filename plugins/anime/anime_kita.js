const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'animekita',
    alias: ['animekita', 'animelist', 'animeinfo', 'animesearch'],
    category: 'anime',
    description: 'Cari info anime dari animekita (search, detail, stream, latest)',
    usage: '.animekita search <judul>\n.animekita detail <slug>\n.animekita stream <slug>\n.animekita latest',
    example: '.animekita search naruto',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://api.apigratis.site/anime'

async function searchAnime(query) {
    const response = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`)
    return response.data.result.results || []
}

async function getDetail(slug) {
    const response = await axios.get(`${API_URL}/detail?slug=${encodeURIComponent(slug)}`)
    return response.data.result
}

async function getStream(slug) {
    const response = await axios.get(`${API_URL}/stream?slug=${encodeURIComponent(slug)}`)
    return response.data.result
}

async function getLatest() {
    const response = await axios.get(`${API_URL}/latest`)
    return response.data.result || []
}

function formatNumber(num) {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

async function handler(m, { sock }) {
    const args = m.args || []
    const keyword = args[0]?.toLowerCase()
    const query = args.slice(1).join(' ')
    
    if (!keyword || !['search', 'detail', 'stream', 'latest'].includes(keyword)) {
        return m.reply(
            `💕 *ᴀɴɪᴍᴇᴋɪᴛᴀ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}animekita search <judul>\n` +
            `┃   ${m.prefix}animekita detail <slug>\n` +
            `┃   ${m.prefix}animekita stream <slug>\n` +
            `┃   ${m.prefix}animekita latest\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}animekita search naruto\n` +
            `┃   ${m.prefix}animekita detail naruto-shippuden\n` +
            `┃   ${m.prefix}animekita latest\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau cari anime apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi mencari anime darling~ tunggu sebentar yaa 🦋`)
    
    try {
        if (keyword === 'search') {
            if (!query) {
                return m.reply(`❌ Masukkan judul anime yang mau dicari darling~`)
            }
            
            const results = await searchAnime(query)
            
            if (!results || results.length === 0) {
                return m.reply(`💔 *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Anime *${query}* tidak ditemukan darling~`)
            }
            
            let txt = `💕 *ʜᴀꜱɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ* 💕\n> ${query}\n\n`
            results.slice(0, 10).forEach((item, index) => {
                txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
                txt += `┃ ${index + 1}. *${item.title}*\n`
                txt += `┃ 📀 ᴇᴘɪꜱᴏᴅᴇ: ${item.episode || '?'}\n`
                txt += `┃ 🔗 ꜱʟᴜɢ: ${item.slug}\n`
                txt += `┃\n┃ ✦ *Aksi:*\n`
                txt += `┃    • .animekita detail ${item.slug}\n`
                txt += `┃    • .animekita stream ${item.slug}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            })
            txt += `💗 *Zero Two:* Pilih salah satu slug di atas darling~ 🦋`
            
            await m.reply(txt)
            
        } else if (keyword === 'detail') {
            if (!query) {
                return m.reply(`❌ Masukkan slug anime darling~`)
            }
            
            const detail = await getDetail(query)
            
            if (!detail) {
                return m.reply(`💔 *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Detail anime tidak ditemukan darling~`)
            }
            
            let txt = `💕 *ᴅᴇᴛᴀɪʟ ᴀɴɪᴍᴇ* 💕\n\n`
            txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
            txt += `┃ 📺 *ᴛɪᴛʟᴇ*: ${detail.title || '-'}\n`
            if (detail.japanese) txt += `┃ 🇯🇵 *ᴊᴀᴘᴀɴᴇꜱᴇ*: ${detail.japanese}\n`
            if (detail.episodes) txt += `┃ 📀 *ᴇᴘɪꜱᴏᴅᴇ*: ${detail.episodes}\n`
            if (detail.status) txt += `┃ 📌 *ꜱᴛᴀᴛᴜꜱ*: ${detail.status}\n`
            if (detail.rating) txt += `┃ ⭐ *ʀᴀᴛɪɴɢ*: ${detail.rating}\n`
            if (detail.duration) txt += `┃ ⏱️ *ᴅᴜʀᴀꜱɪ*: ${detail.duration}\n`
            if (detail.genre) txt += `┃ 🏷️ *ɢᴇɴʀᴇ*: ${detail.genre}\n`
            if (detail.release) txt += `┃ 📅 *ʀɪʟɪꜱ*: ${detail.release}\n`
            if (detail.studio) txt += `┃ 🎬 *ꜱᴛᴜᴅɪᴏ*: ${detail.studio}\n`
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            
            if (detail.sinopsis) {
                txt += `╭━━━〔 📖 ꜱɪɴᴏᴘꜱɪꜱ 〕━━━⬣\n`
                txt += `┃ ${detail.sinopsis.substring(0, 400)}${detail.sinopsis.length > 400 ? '...' : ''}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            }
            
            txt += `💗 *Zero Two:* Ini detail animenya darling~ 🎬`
            
            await m.reply(txt)
            
        } else if (keyword === 'stream') {
            if (!query) {
                return m.reply(`❌ Masukkan slug anime darling~`)
            }
            
            const stream = await getStream(query)
            
            if (!stream || !stream.link_stream) {
                return m.reply(`💔 *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Link stream tidak ditemukan darling~`)
            }
            
            let txt = `💕 *ꜱᴛʀᴇᴀᴍ ᴀɴɪᴍᴇ* 💕\n\n`
            txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
            txt += `┃ 📺 *ᴛɪᴛʟᴇ*: ${stream.title || query}\n`
            txt += `┃\n┃ ✦ *ʟɪɴᴋ ꜱᴛʀᴇᴀᴍ*:\n`
            
            if (typeof stream.link_stream === 'object') {
                for (const [quality, url] of Object.entries(stream.link_stream)) {
                    txt += `┃    • ${quality}: ${url}\n`
                }
            } else {
                txt += `┃    • ${stream.link_stream}\n`
            }
            
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            txt += `💗 *Zero Two:* Klik link di atas buat nonton darling~ 🎬`
            
            await m.reply(txt)
            
        } else if (keyword === 'latest') {
            const latest = await getLatest()
            
            if (!latest || latest.length === 0) {
                return m.reply(`💔 *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴅᴀᴛᴀ*\n\n> Tidak ada anime terbaru darling~`)
            }
            
            let txt = `💕 *ᴀɴɪᴍᴇ ᴛᴇʀʙᴀʀᴜ* 💕\n\n`
            latest.slice(0, 15).forEach((item, index) => {
                txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
                txt += `┃ ${index + 1}. *${item.title}*\n`
                txt += `┃ 📀 ᴇᴘɪꜱᴏᴅᴇ: ${item.episode || '?'}\n`
                txt += `┃ 🔗 ꜱʟᴜɢ: ${item.slug}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            })
            txt += `💗 *Zero Two:* Ini anime terbaru darling~ 🦋`
            
            await m.reply(txt)
        }
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Animekita] Error:', err)
        m.react('💔')
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> ${err.message}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}