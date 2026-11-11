const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bratbahlil',
    alias: ['bratb', 'bahlil'],
    category: 'sticker',
    description: 'Membuat sticker brat versi Bahlil',
    usage: '.bratbahlil <text>',
    example: '.bratbahlil Jangan lupa makan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {

    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `🎨 *ʙʀᴀᴛ ʙᴀʜʟɪʟ*\n\n` +
            `> Masukkan teks untuk dijadikan sticker.\n\n` +
            `> Contoh: \`${m.prefix}bratbahlil Jangan lupa makan\``
        )
    }

    m.react('🎨')

    try {

        const url =
`https://api.ourin.my.id/api/bratbahlil?text=${encodeURIComponent(text)}`

        await sock.sendImageAsSticker(
            m.chat,
            url,
            m,
            {
                packname: config.sticker?.packname || 'ZEROTWO-MD',
                author: config.sticker?.author || 'Brat Bahlil'
            }
        )

        m.react('✅')

    } catch (err) {

        console.error('[Brat Bahlil]', err)

        m.react('❌')

        m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Maaf, sedang ada gangguan pada server.\n` +
            `> ${err.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}