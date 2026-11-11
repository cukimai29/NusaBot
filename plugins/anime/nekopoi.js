const axios = require('axios')
const cheerio = require('cheerio')
const config = require('../../config')

const pluginConfig = {
    name: 'nekopoi',
    alias: ['npoi', 'nekopoiid', 'nepoi'],
    category: 'anime',
    description: 'Cari anime/hentai dari NekoPoi',
    usage: '.nekopoi <latest|detail|search> [query/url]',
    example: '.nekopoi latest\n.nekopoi search naruto\n.nekopoi detail https://nekopoi.care/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

async function latest() {
    try {
        const response = await axios.get("https://nekopoi.care", {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const html = response.data
        const $ = cheerio.load(html)
        let series = []
        let episode = []

        $(".animeseries ul li").each((i, el) => {
            let title = $(el).find("a").attr("original-title") || "No Title"
            let url = $(el).find("a").attr("href")
            let thumbnail = $(el).find("img").attr("src") || ""
            series.push({ title, url, thumbnail })
        })

        $("#boxid .eropost").each((i, el) => {
            let title = $(el).find(".eroinfo h2 a").text().trim()
            let release = $(el).find(".eroinfo span").eq(0).text().trim()
            let url = $(el).find(".eroinfo h2 a").attr("href")
            episode.push({ title, release, url })
        })

        return { series, episode }
    } catch (error) {
        console.error(error)
        throw new Error("Gagal mengambil data terbaru dari NekoPoi.")
    }
}

async function detail(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const html = response.data
        const $ = cheerio.load(html)
        let metadata = {}
        let episodes = []

        $(".animeinfos .listinfo ul li").each((i, el) => {
            let key = $(el).find("b").text().trim().toLowerCase()
            let value = $(el).text().replace(key + ":", "").trim()
            metadata[key] = value
        })

        metadata.thumbnail = $(".animeinfos .imgdesc img").attr("src") || ""
        metadata.sinopsis = $(".animeinfos p").text().trim()

        $(".animeinfos .episodelist ul li").each((i, el) => {
            let title = $(el).find("span a").text().trim()
            let release = $(el).find("span").eq(1).text().trim()
            let url = $(el).find("span a").attr("href")
            episodes.push({ title, release, url })
        })

        return { metadata, episodes }
    } catch (error) {
        console.error(error)
        throw new Error("Gagal mengambil detail anime.")
    }
}

async function search(query) {
    try {
        const response = await axios.get("https://nekopoi.care/?s=" + encodeURIComponent(query), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const html = response.data
        const $ = cheerio.load(html)
        let results = []

        $(".result ul li").each((i, el) => {
            let title = $(el).find("h2 a").text().trim()
            let url = $(el).find("h2 a").attr("href")
            let image = $(el).find("img").attr("src") || ""
            let type = url.includes("/hentai/") ? "Hentai Series" : "Hentai Episodes"
            results.push({ title, type, image, url })
        })

        return results
    } catch (error) {
        console.error(error)
        throw new Error("Gagal melakukan pencarian.")
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const query = args.slice(1).join(' ') || args[1]

    if (!action || !['latest', 'detail', 'search'].includes(action)) {
        return m.reply(
            `💕 *ɴᴇᴋᴏᴘᴏɪ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}nekopoi latest\n` +
            `┃   ${m.prefix}nekopoi search <query>\n` +
            `┃   ${m.prefix}nekopoi detail <url>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}nekopoi latest\n` +
            `┃   ${m.prefix}nekopoi search naruto\n` +
            `┃   ${m.prefix}nekopoi detail https://nekopoi.care/xxx\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau cari anime apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }

    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi mencari anime darling~ tunggu sebentar yaa 🦋`)

    try {
        if (action === 'latest') {
            const result = await latest()
            let txt = `💕 *ɴᴇᴋᴏᴘᴏɪ ʟᴀᴛᴇꜱᴛ* 💕\n\n`
            
            txt += `╭━━━〔 📺 ꜱᴇʀɪᴇꜱ 〕━━━⬣\n`
            result.series.slice(0, 10).forEach((anime, index) => {
                txt += `┃ ${index + 1}. *${anime.title}*\n`
                txt += `┃    🔗 ${anime.url}\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            
            txt += `╭━━━〔 🎬 ᴇᴘɪꜱᴏᴅᴇ 〕━━━⬣\n`
            result.episode.slice(0, 10).forEach((ep, index) => {
                txt += `┃ ${index + 1}. *${ep.title}*\n`
                txt += `┃    📅 ${ep.release}\n`
                txt += `┃    🔗 ${ep.url}\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            txt += `💗 *Zero Two:* Ini yang terbaru darling~ 🎬`
            
            await m.reply(txt)
            
        } else if (action === 'search') {
            if (!query) {
                return m.reply(`❌ Masukkan kata kunci pencarian darling~`)
            }
            
            const result = await search(query)
            
            if (!result || result.length === 0) {
                return m.reply(`💔 *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Tidak ada hasil untuk *${query}* darling~`)
            }
            
            let txt = `💕 *ʜᴀꜱɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ* 💕\n> ${query}\n\n`
            result.slice(0, 10).forEach((anime, index) => {
                txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
                txt += `┃ ${index + 1}. *${anime.title}*\n`
                txt += `┃ 📂 ᴛʏᴘᴇ: ${anime.type}\n`
                txt += `┃ 🔗 ${anime.url}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            })
            txt += `💗 *Zero Two:* Ini hasilnya darling~ 🦋`
            
            await m.reply(txt)
            
        } else if (action === 'detail') {
            if (!query) {
                return m.reply(`❌ Masukkan URL anime darling~`)
            }
            
            const result = await detail(query)
            
            let txt = `💕 *ᴅᴇᴛᴀɪʟ ᴀɴɪᴍᴇ* 💕\n\n`
            txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
            txt += `┃ 📖 *ᴛɪᴛʟᴇ*: ${result.metadata.judul || '-'}\n`
            txt += `┃ 📅 *ʀɪʟɪꜱ*: ${result.metadata.rilis || '-'}\n`
            txt += `┃ 🏷️ *ɢᴇɴʀᴇ*: ${result.metadata.genre || '-'}\n`
            txt += `┃ 🎬 *ᴘʀᴏᴅᴜᴄᴇʀ*: ${result.metadata.produser || '-'}\n`
            txt += `┃ 📊 *ꜱᴛᴀᴛᴜꜱ*: ${result.metadata.status || '-'}\n`
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            
            if (result.metadata.sinopsis) {
                txt += `╭━━━〔 📖 ꜱɪɴᴏᴘꜱɪꜱ 〕━━━⬣\n`
                txt += `┃ ${result.metadata.sinopsis.substring(0, 300)}${result.metadata.sinopsis.length > 300 ? '...' : ''}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            }
            
            txt += `╭━━━〔 🎬 ᴇᴘɪꜱᴏᴅᴇ ʟɪꜱᴛ 〕━━━⬣\n`
            result.episodes.slice(0, 10).forEach((ep, index) => {
                txt += `┃ ${index + 1}. *${ep.title}*\n`
                txt += `┃    📅 ${ep.release}\n`
                txt += `┃    🔗 ${ep.url}\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            txt += `💗 *Zero Two:* Ini detail animenya darling~ 🎬`
            
            await m.reply(txt)
        }
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Nekopoi] Error:', err)
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