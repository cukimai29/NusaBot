const te = require('../../src/lib/zerotwo-error.js')
const { uploadImage } = require('../../src/lib/zerotwo-uploader.js')
const { f } = require('../../src/lib/zerotwo-http.js')
const config = require('../../config')

const pluginConfig = {
    name: 'tofigurev2',
    alias: ['figurev2', 'figure2'],
    category: 'ai',
    description: 'Ubah gambar ke style Figure v2',
    usage: '.tofigurev2 (reply gambar)',
    example: '.tofigurev2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(
`╭━━━〔 🎭 FIGURE V2 〕━━━⬣
│
│ > Kirim/reply gambar untuk diubah ke style Figure
│
│ 📌 *Format:*
│ > ${m.prefix}tofigurev2 (reply gambar)
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    await m.react('🕕')

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            await m.react('❌')
            return m.reply(
`╭━━━〔 ❌ GAGAL 〕━━━⬣
│
│ > Gagal mendownload gambar
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }

        const imageUrl = await uploadImage(buffer, 'image.jpg')

        const url = `https://api-faa.my.id/faa/tofigurav3?url=${encodeURIComponent(imageUrl)}`
        const res = await f(url, 'arrayBuffer')

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            image: Buffer.from(res),
            caption: `✅ *Figure V2 Berhasil!*\n\n💕 NusaBot`
        }, { quoted: m })

    } catch (error) {
        await m.react('☢')
        console.error('[TOFIGUREV2 Error]', error)
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}