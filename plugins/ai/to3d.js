const te = require('../../src/lib/zerotwo-error.js')
const { live3d } = require('../../src/scraper/seaart.js')
const config = require('../../config')

const pluginConfig = {
    name: 'to3d',
    alias: ['3d', '3dfy', 'to3dmodel'],
    category: 'ai',
    description: 'Ubah foto menjadi gaya 3D render',
    usage: '.to3d (reply/kirim gambar)',
    example: '.to3d',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a high-quality 3D rendered style like Pixar or DreamWorks CGI. 
Apply realistic lighting, smooth textures, and that polished 3D animated movie look. 
Keep the original composition but make it look like a frame from a modern 3D animated film 
with subsurface scattering on skin, detailed hair, and cinematic lighting.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))

    if (!isImage) {
        return m.reply(
`╭━━━〔 🎮 TO 3D 〕━━━⬣
│
│ > Kirim/reply gambar untuk diubah ke gaya 3D
│
│ 📌 *Format:*
│ > ${m.prefix}to3d (reply gambar)
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

        const result = await live3d(buffer, PROMPT)

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            image: result.image,
            caption: `✅ *To 3D Berhasil!*\n\n💕 NusaBot`
        }, { quoted: m })

    } catch (error) {
        await m.react('☢')
        console.error('[TO3D Error]', error)
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}