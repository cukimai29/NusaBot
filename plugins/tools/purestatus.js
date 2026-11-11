const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'purestatus',
    alias: ['ps', 'purestatus'],
    category: 'tools',
    description: 'Mengirim ulang foto/video dengan kualitas sumber',
    usage: '.purestatus',
    example: 'Kirim foto/video dengan caption .purestatus',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage =
        m.isImage ||
        (m.quoted && m.quoted.type === 'imageMessage')

    const isVideo =
        m.isVideo ||
        (m.quoted && m.quoted.type === 'videoMessage')

    if (!isImage && !isVideo) {
        return m.reply(
            '『 PURE STATUS 』\n\n' +
            'Kirim foto/video dengan caption .purestatus\n' +
            'atau reply foto/video dengan perintah .purestatus\n\n' +
            'Fungsi: mengirim ulang media tanpa encoding ulang.'
        )
    }

    await m.react('⏳')

    let buffer
    let tempPath

    try {
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer || !Buffer.isBuffer(buffer)) {
            throw new Error('Media gagal diunduh.')
        }

        const caption =
            isImage
                ? m.message?.imageMessage?.caption || ''
                : m.message?.videoMessage?.caption || ''

        const media = isImage
            ? { image: buffer }
            : { video: buffer }

        // Jika berupa caption command, hapus command dari caption.
        const cleanCaption = caption
            .replace(/^\.purestatus\b/i, '')
            .trim()

        if (cleanCaption) {
            media.caption = cleanCaption
        }

        // Kirim ke chat sebagai media biasa.
        // Tidak memakai FFmpeg agar file tidak di-encode ulang.
        await sock.sendMessage(m.chat, media, {
            quoted: m
        })

        await m.react('✅')

    } catch (error) {
        console.error('[PURE STATUS]', error)

        await m.reply(
            '❌ Gagal memproses media.\n\n' +
            'Penyebab: ' + error.message
        )

        await m.react('❌')

    } finally {
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}