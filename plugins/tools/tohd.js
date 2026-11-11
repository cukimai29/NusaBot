const pluginConfig = {
    name: 'tohd',
    alias: ['tohd'],
    category: 'tools',
    description: 'Mengirim ulang foto/video dengan opsi HD',
    usage: '.tohd',
    example: '.tohd (reply foto/video)',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted

    if (!quoted || !quoted.isMedia) {
        return m.reply(
            '『 TO HD 』\n\n' +
            'Cara penggunaan:\n' +
            '1. Reply foto atau video yang ingin diproses.\n' +
            '2. Ketik .tohd\n\n' +
            'Foto/video tanpa label HD juga bisa dicoba.'
        )
    }

    const type = quoted.type
    const isImage = type === 'imageMessage'
    const isVideo = type === 'videoMessage'

    if (!isImage && !isVideo) {
        return m.reply('❌ Media harus berupa foto atau video.')
    }

    await m.react('⏳')

    try {
        const buffer = await quoted.download()

        if (!buffer || !Buffer.isBuffer(buffer)) {
            throw new Error('Gagal mengunduh media.')
        }

        const content = isImage
            ? {
                image: buffer,
                mimetype: 'image/jpeg',
                hd: true
            }
            : {
                video: buffer,
                mimetype: 'video/mp4',
                hd: true
            }

        await sock.sendMessage(
            m.chat,
            content,
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {
        console.error('[TOHD]', error)

        await m.react('❌')
        await m.reply(
            '❌ Gagal mengirim media!\n\n' +
            error.message
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}