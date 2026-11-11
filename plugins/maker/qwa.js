const axios = require('axios')
const sharp = require('sharp')
const {
    Sticker,
    StickerTypes
} = require('wa-sticker-formatter')

const pluginConfig = {
    name: 'qwa',
    alias: ['qwas'],
    category: 'maker',
    description: 'Quote WhatsApp',
    usage: '.qwa teks',
    example: '.qwa Halo Darling',
    cooldown: 5
}

async function handler(m, { sock, text, command }) {

    await m.react('⏳')

    try {

        const q = m.quoted ? m.quoted : m

        let mime =
            q.mimetype ||
            q.msg?.mimetype ||
            ''

        let msgText =
            text ||
            q.text ||
            q.caption ||
            ''

        let isBg = true

        if (msgText.includes('--nobg')) {

            isBg = false

            msgText = msgText
                .replace('--nobg', '')
                .trim()
        }

        if (
            !msgText &&
            !mime.startsWith('image/')
        ) {

            return m.reply(
`╭━━━〔 💬 NUSABOT QWA AI 💬 〕━━━⬣
┃ ✨ Masukkan teks/reply pesan
┃
┃ 📌 Example:
┃ .qwa Halo Darling
┃
┃ 🖼️ Bisa reply gambar juga
┃ 🎭 Tambahkan --nobg
╰━━━━━━━━━━━━━━━━━━━━⬣`
            )
        }

        let senderImage = ''

        if (mime.startsWith('image/')) {

            let media = await q.download()

            if (mime.includes('webp')) {

                media = await sharp(media)
                    .png()
                    .toBuffer()

                mime = 'image/png'
            }

            senderImage =
`data:${mime};base64,${media.toString('base64')}`
        }

        let who =
            m.quoted
                ? (
                    m.quoted.sender ||
                    m.quoted.participant
                )
                : m.sender

        let username =
            m.pushName ||
            'User'

        let timeStr =
            new Date()
                .toLocaleTimeString(
                    'id-ID',
                    {
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                )
                .replace(':', '.')

        const payload = {

            sender_name:
                username,

            sender_number:
                '+' +
                who.split('@')[0],

            sender_avatar:
'https://files.catbox.moe/j9w4xk.jpg',

            sender_image:
                senderImage,

            message:
                msgText || ' ',

            time:
                timeStr,

            background:
                isBg
        }

        const response =
            await axios.post(
                'https://qwa.eeq.my.id/api/generate',
                payload,
                {
                    responseType:
                        'arraybuffer',

                    headers: {
                        'Content-Type':
                            'application/json'
                    }
                }
            )

        const buffer =
            Buffer.from(response.data)

        // ===== STICKER =====
        if (command === 'qwas') {

            const sticker =
                new Sticker(
                    buffer,
                    {
                        pack:
                            global.packname ||
                            'Zero Bot',

                        author:
                            global.author ||
                            'Zero AI',

                        type:
                            StickerTypes.FULL,

                        quality:
                            100,

                        background:
                            'transparent'
                    }
                )

            const finalSticker =
                await sticker.toBuffer()

            await sock.sendMessage(
                m.chat,
                {
                    sticker:
                        finalSticker
                },
                {
                    quoted: m
                }
            )

        }

        // ===== IMAGE =====
        else {

            const padded =
                await sharp(buffer)
                    .extend({
                        top: 50,
                        bottom: 50,
                        left: 50,
                        right: 50,
                        background: {
                            r: 0,
                            g: 0,
                            b: 0,
                            alpha: 0
                        }
                    })
                    .png()
                    .toBuffer()

            await sock.sendMessage(
                m.chat,
                {
                    image:
                        padded,

                    caption:
`╭━━━〔 💬 NUSABOT QWA AI 💬 〕━━━⬣
┃ ✨ Quote berhasil dibuat
┃
┃ 🤖 Powered by NusaBot - RzkyADS
╰━━━━━━━━━━━━━━━━━━━━⬣`
                },
                {
                    quoted: m
                }
            )
        }

        await m.react('✅')

    } catch (err) {

        console.error(
            '[QWA ERROR]',
            err
        )

        await m.react('❌')

        m.reply(
`╭━━━〔 ❌ ZERO ERROR ❌ 〕━━━⬣
┃ 💔 Gagal membuat quote
┃
┃ ⚠️ API sedang error/down
╰━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
