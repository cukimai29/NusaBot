const config = {
    name: 'alquran',
    alias: ['quran', 'qurani', 'alquranid'],
    category: 'religi',
    description: 'Baca Al-Quran dengan terjemahan dan tafsir',
    usage: '.alquran <surah> <ayat>',
    example: '.alquran 1 2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const axios = require('axios')
const cheerio = require('cheerio')

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

async function handler(m) {
    const args = m.text?.trim().split(/\s+/)
    const surah = args[0]
    const ayat = args[1]

    if (!surah || !ayat || isNaN(surah) || isNaN(ayat)) {
        return m.reply(`📖 *ᴀʟ-ǫᴜʀᴀɴ*\n\n> Baca Al-Quran dengan terjemahan dan tafsir\n\n> Contoh: .alquran 1 2\n> Contoh: .alquran 112 1\n\n📝 *Info:*\n> • Surah: 1-114\n> • Ayat: sesuai surah`)
    }

    await m.reply(`⏳ *Mengambil surah ${surah} ayat ${ayat}...*`)

    try {
        const res = await axios.get(`https://kalam.sindonews.com/ayat/${ayat}/${surah}`)
        
        if (!res.data) throw new Error('Data tidak ditemukan')

        const $ = cheerio.load(res.data)
        const content = $('body > main > div > div.content.clearfix > div.news > section > div.list-content.clearfix')

        const surahName = $(content).find('div.ayat-title > h1').text()
        const arab = $(content).find('div.ayat-detail > div.ayat-arab').text()
        const latin = $(content).find('div.ayat-detail > div.ayat-latin').text()
        const terjemahan = $(content).find('div.ayat-detail > div.ayat-detail-text').text()
        
        let tafsir = ''
        $(content).find('div.ayat-detail > div.tafsir-box > div').each(function () {
            tafsir += $(this).text() + '\n'
        })
        tafsir = tafsir.trim()
        
        const keterangan = $(content).find('div.ayat-detail > div.ayat-summary').text()

        let txt = `📖 *${surahName}* : Ayat ${ayat}\n\n`
        txt += `╭──〔 🕋 *ᴛᴇᴋꜱ ᴀʀᴀʙ* 〕───⬣\n`
        txt += `│  ${arab}\n`
        txt += `╰────────────────⬣\n\n`
        txt += `╭──〔 📖 *ʟᴀᴛɪɴ* 〕───⬣\n`
        txt += `│  ${latin}\n`
        txt += `╰────────────────⬣\n\n`
        txt += `╭──〔 🌸 *ᴛᴇʀᴊᴇᴍᴀʜᴀɴ* 〕───⬣\n`
        txt += `│  ${terjemahan}\n`
        txt += `╰────────────────⬣\n\n`
        
        if (tafsir) {
            txt += `╭──〔 📚 *ᴛᴀꜰꜱɪʀ* 〕───⬣\n`
            txt += `│  ${tafsir.slice(0, 1000)}${tafsir.length > 1000 ? readMore : ''}\n`
            txt += `╰────────────────⬣\n\n`
        }
        
        if (keterangan) {
            txt += `📌 *Keterangan:*\n${keterangan}\n`
        }

        await m.reply(txt)

    } catch (error) {
        console.error('Alquran Error:', error)
        await m.reply(`❌ *ERROR*\n\n> Surah ${surah} ayat ${ayat} tidak ditemukan.\n> Pastikan nomor surah dan ayat benar, Darling~`)
    }
}

module.exports = { config, handler }