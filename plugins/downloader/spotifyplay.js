const axios = require('axios')

const pluginConfig = {
    name: 'spotifyplay',
    alias: ['spplay'],
    category: 'downloader',
    description: 'Download lagu dari Spotify',
    usage: '.spplay <judul lagu>',
    example: '.spplay Payung Teduh Mari Bercerita',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function formatNumber(num) {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

async function handler(m, { sock }) {

    try {

        const text =
            m.text?.trim()

        if (!text) {

            return m.reply(
`🎧 *SPOTIFY PLAY*

Contoh:
${m.prefix || '.'}spplay Payung Teduh Mari Bercerita`
            )
        }

        await m.react('🕒')

        const api =
            `https://api.nexray.web.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(api)

        if (!data?.status) {

            await m.react('❌')
            throw new Error('Lagu tidak ditemukan')
        }

        const v =
            data.result

        let caption =
`🎧 *SPOTIFY PLAY*

🎵 Title : ${v.title}
🎤 Artist : ${v.artist}
💿 Album  : ${v.album}
⏱ Duration : ${v.duration}
🔥 Popularity : ${formatNumber(v.popularity)}
📅 Release : ${v.release_at}

📥 Mengirim audio...`

        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url: v.thumbnail
                },
                caption
            },
            {
                quoted: m
            }
        )

        const head =
            await axios.head(v.download_url)

        const size =
            Number(head.headers['content-length'] || 0)

        const sizeMB =
            size / 1024 / 1024

        if (sizeMB > 50) {

            await sock.sendMessage(
                m.chat,
                {
                    document: {
                        url: v.download_url
                    },
                    mimetype: 'audio/mpeg',
                    fileName: `${v.title}.mp3`
                },
                {
                    quoted: m
                }
            )

        } else {

            await sock.sendMessage(
                m.chat,
                {
                    audio: {
                        url: v.download_url
                    },
                    mimetype: 'audio/mpeg',
                    fileName: `${v.title}.mp3`
                },
                {
                    quoted: m
                }
            )
        }

        await m.react('✅')

    } catch (e) {

        console.log('SPOTIFY ERROR:', e)

        await m.react('❌')

        m.reply(
            '❌ Gagal mengambil lagu'
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}