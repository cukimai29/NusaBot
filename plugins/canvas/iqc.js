const axios = require('axios')

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}iqc Hai cantik\``)
    }
    
    m.react('🕕')
    
    try {
        const now = new Date()
        const time = require("moment-timezone").tz("Asia/Jakarta").format("HH:mm")

        const apis = [
            `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(text)}`,
            `https://api-faa.my.id/faa/iqc?prompt=${encodeURIComponent(text)}`
        ]

        let sent = false
        for (const url of apis) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer'
        })

        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data)
        }, { quoted: m })

        sent = true
        break
    } catch (err) {
    lastError = err
}
}

        if (!sent) throw new Error('Semua API gagal')
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}