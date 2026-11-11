const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const config = require('../../config')

const pluginConfig = {
    name: 'apkmod',
    alias: ['apk', 'happymod', 'apkdownload', 'modapk'],
    category: 'download',
    description: 'Cari dan download APK mod dari apk4free.net',
    usage: '.apkmod <query|url>',
    example: '.apkmod spotify\n.apkmod https://apk4free.net/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const Apk4Free = {
    async search(q) {
        const { data } = await axios.get('https://apk4free.net/?s=' + q, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const $ = cheerio.load(data)
        const res = []
        $('.baps > .bav').each((i, e) => {
            let obj = {}
            obj.title = $(e).find('span.title').text().trim()
            obj.link = $(e).find('a').attr('href')
            obj.developer = $(e).find('span.developer').text().trim()
            obj.version = $(e).find('span.version').text().trim()
            const style = $(e).find('span.stars').attr('style') || ''
            const rating = style.replace(/\D/g, '') || '0'
            obj.rating = parseInt(rating) / 20
            res.push(obj)
        })
        return res
    },
    async download(url) {
        const downloadUrl = /(download\/?)$/.test(url) ? url : url.replace(/\/$/, '') + '/download'
        const { data } = await axios.get(downloadUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const $ = cheerio.load(data)
        let obj = {}
        obj.title = $('div.pxtd > h3').text().trim()
        obj.package = $('div.pxtd > table tr:eq(0) td:eq(1)').text().trim()
        obj.version = $('div.pxtd > table tr:eq(1) td:eq(1)').text().trim()
        obj.size = $('div.pxtd > table tr:eq(2) td:eq(1)').text().trim()
        obj.requirements = $('div.pxtd > table tr:eq(3) td:eq(1)').text().trim()
        obj.url = $('div.pxtd #list-downloadlinks > li:eq(1) > a').attr('href')
        return obj
    }
}

function isUrl(url) {
    return url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/gi)
}

async function handler(m, { sock }) {
    const text = m.text?.trim() || m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `💕 *ᴀᴘᴋ ᴍᴏᴅ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}apkmod <query>\n` +
            `┃   ${m.prefix}apkmod <url>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}apkmod spotify\n` +
            `┃   ${m.prefix}apkmod https://apk4free.net/xxx\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau cari APK mod apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi mencari APK darling~ tunggu sebentar yaa 📦`)
    
    try {
        if (isUrl(text)) {
            const data = await Apk4Free.download(text)
            
            if (!data.url) {
                m.react('💔')
                return m.reply(
                    `💔 *ɢᴀɢᴀʟ*\n\n` +
                    `> Link download tidak ditemukan darling~ 🥺`
                )
            }
            
            const caption = `💕 *ᴀᴘᴋ ᴍᴏᴅ* 💕\n\n` +
                `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                `┃ 📦 *ᴛɪᴛʟᴇ*: ${data.title}\n` +
                `┃ 📱 *ᴘᴀᴄᴋᴀɢᴇ*: ${data.package}\n` +
                `┃ 🔢 *ᴠᴇʀꜱɪ*: ${data.version}\n` +
                `┃ 📏 *ꜱɪᴢᴇ*: ${data.size}\n` +
                `┃ 📱 *ʀᴇQᴜɪʀᴇᴍᴇɴᴛ*: ${data.requirements}\n` +
                `┃\n` +
                `┃ 💗 *Zero Two:* Ini APK nya darling~ 📲\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━⬣`
            
            await sock.sendMessage(m.chat, {
                document: { url: data.url },
                fileName: `${data.title}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: caption
            }, { quoted: m })
            
            m.react('✅')
            
        } else {
            const search = await Apk4Free.search(text)
            
            if (!search || search.length === 0) {
                m.react('💔')
                return m.reply(
                    `💔 *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
                    `> Tidak ada hasil untuk *${text}* darling~ 🥺`
                )
            }
            
            let txt = `💕 *ʜᴀꜱɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ* 💕\n> ${text}\n\n`
            search.slice(0, 10).forEach((item, index) => {
                const ratingStars = '⭐'.repeat(Math.floor(item.rating)) + '☆'.repeat(5 - Math.floor(item.rating))
                txt += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
                txt += `┃ ${index + 1}. *${item.title}*\n`
                txt += `┃ 👤 ${item.developer}\n`
                txt += `┃ 🔢 ${item.version}\n`
                txt += `┃ ${ratingStars} (${item.rating}/5)\n`
                txt += `┃ 🔗 ${item.link}\n`
                txt += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
            })
            txt += `💗 *Zero Two:* Pilih salah satu link di atas darling~ 🦋`
            
            await m.reply(txt)
            m.react('✅')
        }
        
    } catch (err) {
        console.error('[ApkMod] Error:', err)
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