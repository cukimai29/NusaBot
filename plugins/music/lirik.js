const pluginConfig = {
    name: 'lirik',
    alias: ['lyrics'],
    category: 'music',
    description: 'Mencari lirik lagu',
    usage: '.lirik <judul lagu>',
    example: '.lirik Berharap Tak Berpisah',
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

        const text =
            m.text?.trim()

        if (!text) {

            return m.reply(
`🎵 *LIRIK LAGU*

❌ Contoh:
${m.prefix || '.'}lirik Berharap Tak Berpisah`
            )
        }

        await m.react('⏳')

        const res =
            await fetch(
                `https://kaizenapi.my.id/search/kaze?q=${encodeURIComponent(text)}`
            )

        const json =
            await res.json()

        if (
            !json.status ||
            !json.result
        ) {

            await m.react('❌')

            return m.reply(
                '❌ Lirik tidak ditemukan.'
            )
        }

        const {
            title,
            lyrics
        } = json.result

        const romaji =
            extractSection(lyrics, 'ROMAJI:')

        const kanji =
            extractSection(lyrics, 'KANJI:')

        const indo =
            extractSection(lyrics, 'INDONESIA:')

        let caption =
`🎵 *LIRIK LAGU*

🎧 ${title}\n\n`

        if (kanji && romaji) {

            const romajiLines =
                romaji.split('\n')

            const kanjiLines =
                kanji.split('\n')

            const maxLines =
                Math.max(
                    romajiLines.length,
                    kanjiLines.length
                )

            for (let i = 0; i < maxLines; i++) {

                const k =
                    (kanjiLines[i] || '').trim()

                const r =
                    (romajiLines[i] || '').trim()

                if (k) caption += k + '\n'
                if (r) caption += r + '\n'
            }

        } else {

            caption += lyrics.trim()
        }

        if (indo) {

            caption +=
`\n━━━━━━━━━━━━━━━\n
🇮🇩 *Terjemahan Indonesia*\n\n${indo.trim()}`
        }

        caption +=
`\n\n👤 Request: ${m.pushName}\n📅 ${new Date().toLocaleDateString('id-ID')}`

        await m.react('✅')

        await sock.sendMessage(
            m.chat,
            {
                text: caption
            },
            {
                quoted: m
            }
        )

    } catch (e) {

        console.log(
            'LIRIK ERROR:',
            e
        )

        await m.react('❌')

        m.reply(
            '❌ Gagal mengambil lirik.'
        )
    }
}

function extractSection(lyrics, header) {

    const idx =
        lyrics.indexOf(header)

    if (idx === -1) return ''

    const start =
        idx + header.length

    const nextHeaders = [
        'ROMAJI:',
        'KANJI:',
        'INDONESIA:'
    ]

    let end =
        lyrics.length

    for (const h of nextHeaders) {

        if (h === header) continue

        const pos =
            lyrics.indexOf(h, start)

        if (pos !== -1 && pos < end) {

            end = pos
        }
    }

    return lyrics
        .slice(start, end)
        .trim()
}

module.exports = {
    config: pluginConfig,
    handler
}