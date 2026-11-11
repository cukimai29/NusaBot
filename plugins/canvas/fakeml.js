const config = require('../../config')

const pluginConfig = {
    name: 'fakeml',
    alias: ['fakelobyml'],
    category: 'maker',
    description: 'Fake lobby Mobile Legends',
    usage: '.fakeml nama',
    example: '.fakeml RzkyADS',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {

        const body =
            m.body ||
            m.text ||
            m.message?.conversation ||
            ''

        const input = body.trim().split(' ').slice(1).join(' ')

        if (!input) {
            return await m.reply(
                `❌ *Nama belum diisi!*\n\nContoh:\n${pluginConfig.example}`
            )
        }

        let avatar = 'https://telegra.ph/file/6880771a42bad09dd6087.jpg'

        try {

            // kalau reply gambar
            if (m.quoted && /image/.test(m.quoted.mtype || '')) {

                const media = await m.quoted.download()

                const uploadImage = require('../../src/lib/uploadImage')
                const uploaded = await uploadImage(media)

                if (uploaded) avatar = uploaded

            } else {

                // ambil pp user
                const pp = await sock.profilePictureUrl(
                    m.sender,
                    'image'
                ).catch(() => null)

                if (pp) avatar = pp

            }

        } catch (e) {
            console.log('PP fallback:', e.message)
        }

        const imageUrl =
            `https://api.nexray.web.id/maker/fakelobyml?avatar=${encodeURIComponent(avatar)}&nickname=${encodeURIComponent(input)}`

        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url: imageUrl
                },
                caption:
`🎮 *Fake Lobby ML*

👤 Nickname: ${input}
🖼️ Avatar: ${avatar.includes('telegra') ? 'Default' : 'Custom'}`
            },
            { quoted: m }
        )

    } catch (error) {
        console.error(error)

        await m.reply(
`❌ *GAGAL MEMBUAT FAKE ML*

> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}