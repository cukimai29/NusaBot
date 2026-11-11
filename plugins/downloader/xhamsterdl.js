const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'xhamsterdl',
    alias: ['xhdl', 'xhamsterdown'],
    category: 'downloader',
    description: 'Download video dari XHamster via link',
    usage: '.xhamsterdl <link>',
    example: '.xhamsterdl https://xhamster.com/videos/xxxx',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 10,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text || !text.includes('xhamster.com')) return m.reply('Masukkan link XHamster yang valid!')

    try {
        await m.reply('Bentar, gue cariin videonya...')
        
        const res = await axios.get(`https://api.vreden.web.id/api/xhamsterdl?url=${text}`)
        const data = res.data.result

        // Mengirim file video
        await sock.sendMessage(m.chat, { 
            video: { url: data.files.high || data.files.low || data.url }, 
            caption: `*Title:* ${data.title}\n*Views:* ${data.views || 'N/A'}\n\nDownloaded by **Void Zero**`,
            mimetype: 'video/mp4'
        }, { quoted: m })

    } catch (error) {
        console.error('XHamster DL Error:', error)
        await m.reply(`❌ *GAGAL DOWNLOAD*\n\n> Video tidak ditemukan atau link sudah kadaluarsa.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}