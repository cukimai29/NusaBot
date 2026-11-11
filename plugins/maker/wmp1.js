const axios = require('axios')

const pluginConfig = {
    name: 'wmp1',
    alias: ['wmp1'],
    category: 'maker',
    description: 'Membuat visualisasi teks retro Windows Media Player v1',
    usage: '.wmp1 <teks>',
    example: '.wmp1 TIO IS HERE',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = (m.text || '').trim()

    if (!text) {
        return m.reply(
`❌ *Teks belum dimasukkan!*

Contoh:
*.wmp1 𝗭𝗘𝗥𝗢 𝗕𝗢𝗧 IS HERE*

🎵 Membuat visualisasi teks retro ala Windows Media Player v1.`
        )
    }

    try {
        await m.react('⏳')

        const apiUrl = 'https://apii.nexadev.my.id/wmp1'

        const response = await axios.get(apiUrl, {
            params: {
                text
            },
            responseType: 'arraybuffer',
            timeout: 60000
        })

        const contentType = response.headers['content-type'] || ''

        if (!contentType.includes('image')) {
            const body = Buffer.from(response.data).toString('utf8')
            throw new Error(`API tidak mengembalikan gambar: ${body.slice(0, 300)}`)
        }

        const imageBuffer = Buffer.from(response.data)

        await sock.sendMessage(
            m.chat,
            {
                image: imageBuffer,
                caption: `🎵 *WINDOWS MEDIA PLAYER v1*\n\n📝 Teks: ${text}`
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {
        console.error(
            '[WMP1 ERROR]',
            error.response?.data || error.message || error
        )

        await m.react('❌')

        return m.reply(
`❌ *Gagal membuat visualisasi WMP1.*

Kemungkinan:
• API sedang bermasalah
• Respons API bukan gambar
• Koneksi ke server gagal

Coba lagi beberapa saat nanti.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}