const axios = require('axios')
const FormData = require('form-data')
const te = require('../../src/lib/zerotwo-error')
const config = require('../../config')

const pluginConfig = {
    name: 'gura',
    alias: ['gawr'],
    category: 'canvas',
    description: 'Apply efek Gawr Gura ke gambar',
    usage: '.gura (reply/caption gambar)',
    example: '.gura',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToTmpFiles(buffer) {
    try {
        const form = new FormData()

        form.append('file', buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        })

        const response = await axios.post(
            'https://tmpfiles.org/api/v1/upload',
            form,
            {
                headers: form.getHeaders()
            }
        )

        return response.data.data.url
            .replace('tmpfiles.org/', 'tmpfiles.org/dl/')

    } catch (e) {
        console.log('Upload Error:', e)
        return null
    }
}

async function handler(m, { sock }) {

    try {

        let buffer = null

        if (
            m.quoted &&
            (
                m.quoted.mimetype?.includes('image') ||
                m.quoted.type === 'imageMessage'
            )
        ) {

            buffer = await m.quoted.download()

        } else if (
            m.mimetype?.includes('image')
        ) {

            buffer = await m.download()
        }

        if (!buffer) {

            return await m.reply(
                `🦈 *ɢᴜʀᴀ ᴇғғᴇᴄᴛ*\n\n` +
                `> Reply / kirim gambar dengan caption .gura`
            )
        }

        await m.react('🕕')

        const uploaded = await uploadToTmpFiles(buffer)

        if (!uploaded) {
            return await m.reply('❌ Upload gambar gagal')
        }

        const api = `https://api.nexray.web.id/canvas/gura?url=${encodeURIComponent(uploaded)}`

        const response = await axios.get(api, {
            responseType: 'arraybuffer'
        })

        const image = Buffer.from(response.data)

        await sock.sendMessage(
            m.chat,
            {
                image,
                caption: '🦈 *ɢᴜʀᴀ ᴇғғᴇᴄᴛ*'
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {

        console.error('Gura Error:', error)

        await m.react('☢')

        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}