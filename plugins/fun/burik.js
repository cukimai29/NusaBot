const config = require('../../config')
const Jimp = require('jimp')

const pluginConfig = {
    name: 'burik',
    alias: ['rusak', 'jelek'],
    category: 'fun',
    description: 'Membuat foto menjadi burik/rusak',
    usage: '.burik (reply foto)',
    example: '.burik (reply foto)',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const isQuotedImage = m.isQuoted && m.quoted?.isImage
        const isDirectImage = m.isImage

        if (!isQuotedImage && !isDirectImage) {
            return await m.reply('❗ Reply atau kirim sebuah foto terlebih dahulu!')
        }

        await m.reply('⏳ Sedang memproses foto...')

        const target = isQuotedImage ? m.quoted : m
        const buffer = await target.download()
        if (!buffer) return await m.reply('❌ Gagal mengunduh foto!')

        const image = await Jimp.read(buffer)

        image
            .resize(100, Jimp.AUTO, Jimp.RESIZE_BILINEAR)
            .quality(15)

        const resultBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)
        await m.replyImage(resultBuffer, '📸 Foto burik berhasil dibuat!')

    } catch (error) {
        console.error('Burik Plugin Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}