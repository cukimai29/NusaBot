const axios = require('axios')
const FormData = require('form-data')
const path = require('path')
const fs = require('fs')

const config = require('../../config')

const pluginConfig = {
    name: 'faceswap',
    alias: ['fs', 'swapface'],
    category: 'ai',
    description: 'Tukar wajah dari 2 gambar',
    usage: '.faceswap (kirim/reply 2 gambar)',
    example: '.faceswap',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

const sessions = new Map()

const APIKEY =
    config.APIkey?.neoxr ||
    'Milik-Bot-zerotwoMD'

// THUMB
let thumbAI = null

try {

    const thumbPath =
        path.join(
            process.cwd(),
            'assets/images/zerotwo-ai.jpg'
        )

    if (fs.existsSync(thumbPath)) {

        thumbAI =
            fs.readFileSync(thumbPath)
    }

} catch {}

// UPLOAD TMPFILES
async function uploadToTmpFiles(
    buffer,
    filename = 'image.jpg'
) {

    try {

        const form = new FormData()

        form.append(
            'file',
            buffer,
            {
                filename,
                contentType:
                    'image/jpeg'
            }
        )

        const response =
            await axios.post(
                'https://tmpfiles.org/api/v1/upload',
                form,
                {
                    headers:
                        form.getHeaders(),

                    timeout: 30000
                }
            )

        if (
            !response.data?.data?.url
        ) {

            throw new Error(
                'Upload gagal'
            )
        }

        return response.data.data.url
            .replace(
                'tmpfiles.org/',
                'tmpfiles.org/dl/'
            )

    } catch (e) {

        console.log(
            'Upload Error:',
            e
        )

        return null
    }
}

// GET IMAGE BUFFER
async function getImageBuffer(m) {

    try {

        // QUOTED IMAGE
        if (
            m.quoted &&
            (
                m.quoted.mimetype
                    ?.includes('image') ||

                m.quoted.type ===
                    'imageMessage'
            )
        ) {

            return await
                m.quoted.download()
        }

        // DIRECT IMAGE
        if (
            m.mimetype
                ?.includes('image')
        ) {

            return await
                m.download()
        }

        return null

    } catch {

        return null
    }
}

async function handler(m, { sock }) {

    try {

        const session =
            sessions.get(m.sender)

        const imageBuffer =
            await getImageBuffer(m)

        // STEP 1
        if (!session) {

            if (!imageBuffer) {

                return await m.reply(
`🔄 *FACE SWAP AI*

Tukar wajah dari 2 gambar

📌 Cara pakai:
1. Kirim gambar pertama
2. Kirim gambar kedua

Contoh:
Kirim foto pertama
caption:
${m.prefix}faceswap`
                )
            }

            await m.react('1️⃣')

            const sourceUrl =
                await uploadToTmpFiles(
                    imageBuffer,
                    'source.jpg'
                )

            if (!sourceUrl) {

                return await m.reply(
                    '❌ Upload gambar pertama gagal'
                )
            }

            // SAVE SESSION
            sessions.set(
                m.sender,
                {
                    sourceUrl,
                    timestamp:
                        Date.now()
                }
            )

            // AUTO DELETE
            setTimeout(() => {

                sessions.delete(
                    m.sender
                )

            }, 300000)

            return await m.reply(
`✅ *GAMBAR PERTAMA DISIMPAN*

Sekarang kirim gambar kedua
(target)

⏱️ Session berlaku 5 menit`
            )
        }

        // STEP 2
        if (!imageBuffer) {

            return await m.reply(
`⚠️ Kirim gambar kedua

Reply / kirim foto target
dengan caption:
${m.prefix}faceswap`
            )
        }

        await m.react('2️⃣')

        const targetUrl =
            await uploadToTmpFiles(
                imageBuffer,
                'target.jpg'
            )

        if (!targetUrl) {

            sessions.delete(
                m.sender
            )

            return await m.reply(
                '❌ Upload gambar kedua gagal'
            )
        }

        // PROCESS
        await sock.sendMessage(
            m.chat,
            {
                text:
`🔄 *MEMPROSES FACE SWAP*

Tunggu sebentar...`
            },
            { quoted: m }
        )

        // API
        const api =
`https://api.neoxr.eu/api/faceswap?source=${encodeURIComponent(session.sourceUrl)}&target=${encodeURIComponent(targetUrl)}&apikey=${APIKEY}`

        const { data } =
            await axios.get(api)

        // DELETE SESSION
        sessions.delete(
            m.sender
        )

        // VALIDASI
        if (
            !data ||
            !data.status ||
            !data.data ||
            !data.data.url
        ) {

            await m.react('❌')

            return await m.reply(
                '❌ API gagal merespon'
            )
        }

        // SEND RESULT
        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url:
                        data.data.url
                },

                caption:
`🪄 *FACE SWAP SUCCESS*`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore:
                        999999,

                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'Face Swap AI',

                        body:
                            'AI FaceSwap Result',

                        thumbnail:
                            thumbAI,

                        sourceUrl:
                            'https://neoxr.eu',

                        mediaType: 1,
                        renderLargerThumbnail: false,
                        showAdAttribution: false
                    }
                }
            },
            { quoted: m }
        )

        // SUCCESS
        await m.react('✅')

    } catch (error) {

        console.log(
            'FaceSwap Error:',
            error
        )

        sessions.delete(
            m.sender
        )

        await m.react('☢️')

        await m.reply(
`❌ *ERROR*

> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}