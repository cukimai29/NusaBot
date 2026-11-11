const axios = require('axios')

const pluginConfig = {
    name: 'fakelobbyff',
    alias: ['fakeff', 'fakelobyff', 'fffake'],
    category: 'maker',
    description: 'Membuat Fake Lobby Free Fire',
    usage: '.fakelobbyff <nickname>',
    example: '.fakelobbyff Saurus',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const nickname = String(m.text || '').trim()

    if (!nickname) {
        return m.reply(
`🎮 *FAKE LOBBY FREE FIRE*

Masukkan nickname yang ingin digunakan.

*Contoh:*
\`${m.prefix || '.'}fakelobbyff Saurus\``
        )
    }

    await m.react('⏳')

    try {
        const api =
            `https://api.nexray.web.id/maker/fakelobyff` +
            `?nickname=${encodeURIComponent(nickname)}`

        const response = await axios.get(api, {
            responseType: 'arraybuffer',
            timeout: 60000,
            validateStatus: () => true
        })

        if (response.status !== 200) {
            let message = `HTTP ${response.status}`

            try {
                const body = Buffer.from(response.data).toString('utf8')
                const json = JSON.parse(body)

                message =
                    json.message ||
                    json.error ||
                    json.msg ||
                    message
            } catch {}

            throw new Error(message)
        }

        const buffer = Buffer.from(response.data)

        if (!buffer.length) {
            throw new Error('Response API kosong')
        }

        await sock.sendMessage(
            m.chat,
            {
                image: buffer,
                caption:
`🎮 *FAKE LOBBY FREE FIRE*

👤 Nickname: ${nickname}

> © RzkyADS`
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {
        console.error('[FakeLobbyFF]', error)

        await m.react('❌')

        await m.reply(
`❌ *Gagal membuat Fake Lobby FF!*

> ${error.message || 'Terjadi kesalahan pada API'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
