const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')

const pluginConfig = {
    name: 'tobrooklyn',
    alias: ['brooklyn', 'cartoonify'],
    category: 'maker',
    description: 'Efek cartoon pada foto',
    usage: '.tobrooklyn (reply foto)',
    example: '.tobrooklyn',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
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

        // quoted image
        if (
            m.quoted &&
            (
                m.quoted.mimetype?.includes('image') ||
                m.quoted.type === 'imageMessage'
            )
        ) {

            buffer = await m.quoted.download()

        }

        // direct image
        else if (
            m.mimetype?.includes('image')
        ) {

            buffer = await m.download()
        }

        if (!buffer) {

            return await m.reply(
                `❌ Reply / kirim gambar\n\nContoh:\n${pluginConfig.example}`
            )
        }

        const uploaded =
            await uploadToTmpFiles(buffer)

        if (!uploaded) {

            return await m.reply(
                '❌ Upload gambar gagal'
            )
        }

        // API FIX WORKING
        const api =
            `https://nekobot.xyz/api/imagegen?type=deepfry&image=${encodeURIComponent(uploaded)}`

        const { data } =
            await axios.get(api)

        if (!data.success || !data.message) {

            return await m.reply(
                '❌ API gagal membuat gambar'
            )
        }

        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url: data.message
                },
                caption: '🖼️ *BROOKLYN EFFECT*'
            },
            { quoted: m }
        )

    } catch (error) {

        console.error('ToBrooklyn Error:', error)

        await m.reply(
            `❌ *GAGAL*\n\n> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}