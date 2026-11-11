const config = require('../../config')
const axios = require('axios')
const FormData = require('form-data')
const cheerio = require('cheerio')

const pluginConfig = {
    name: 'instagramdl',
    alias: ['igdl', 'ig', 'instagram'],
    category: 'download',
    description: 'Download video/foto Instagram',
    usage: '.instagramdl <url>',
    example: '.instagramdl https://www.instagram.com/reel/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function igdl(url, m) {
    const form = new FormData()
    form.append('url', url)
    form.append('action', 'post')

    const res = await axios.post('https://snapinsta.top/action.php', form, {
        headers: {
            ...form.getHeaders(),
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
            'accept': '*/*',
            'origin': 'https://snapinsta.top',
            'referer': 'https://snapinsta.top/'
        }
    })

    const $ = cheerio.load(res.data)
    const downloads = []

    $('.download-items__btn a').each((_, el) => {
        let path = $(el).attr('href')
        if (!path) return
        if (!path.startsWith('http')) path = 'https://snapinsta.top' + path
        downloads.push(path)
    })

    return {
        status: downloads.length ? 200 : 404,
        download: downloads
    }
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> \`${m.prefix}igdl <url>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/reel/xxx\`\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/p/xxx\``
        )
    }

    try {
        const res = await igdl(url, m)

        if (res.status !== 200 || !res.download.length) {
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`)
        }

        for (let link of res.download) {
            let buf = (await axios.get(link, { responseType: 'arraybuffer' })).data
            buf = Buffer.from(buf)

            if (buf.slice(4, 8).toString() === 'ftyp')
                await sock.sendMessage(m.chat, { video: buf }, { quoted: m })
            else
                await sock.sendMessage(m.chat, { image: buf }, { quoted: m })
        }
    } catch (error) {
        console.error('Instagram DL Plugin Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}