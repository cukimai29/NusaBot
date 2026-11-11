const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'xnxxdl',
    alias: ['xnxxdown', 'xnxxdloadd'],
    category: 'downloader',
    description: 'Download video dari XNXX via link',
    usage: '.xnxxdl <link>',
    example: '.xnxxdl https://www.xnxx.com/video-xxxx/xxxx',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 5,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text || !text.includes('xnxx.com')) return m.reply('Masukkan link XNXX yang valid!')

    try {
        await m.reply('Sedang mengunduh video, mohon tunggu...')
        
        // Contoh menggunakan API downloader
        const res = await axios.get(`https://api.timelines.ai/xnxxdl?url=${text}`)
        const data = res.data.result

        await sock.sendMessage(m.chat, { 
            video: { url: data.url_dl }, 
            caption: `*Title:* ${data.title}\n*Info:* ${data.info}`,
            mimetype: 'video/mp4'
        }, { quoted: m })

    } catch (error) {
        console.error('XNXX DL Error:', error)
        await m.reply(`❌ *GAGAL DOWNLOAD*\n\n> Link mungkin mati atau API limit.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}