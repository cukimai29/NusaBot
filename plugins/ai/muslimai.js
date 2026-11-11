const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'muslimai',
    alias: ['islamai', 'quranai'],
    category: 'ai',
    description: 'AI untuk bertanya tentang Islam dan Al-Quran',
    usage: '.muslimai <pertanyaan>',
    example: '.muslimai Apa itu sholat?',
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
            m.args?.join(' ')
                ?.trim()

        // NO TEXT
        if (!text) {

            return await m.reply(
`☪️ *MUSLIM AI*

Tanyakan sesuatu tentang Islam
dan Al-Quran

📌 Contoh:
${pluginConfig.example}`
            )
        }

        // REACT LOADING
        await m.react('🕕')

        // API
        const api =
`https://api.nexray.web.id/ai/muslim?text=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(
                api,
                {
                    timeout: 60000
                }
            )

        // VALIDASI
        const result =
            data?.result ||
            data?.data ||
            data?.answer

        if (!result) {

            await m.react('❌')

            return await m.reply(
                '❌ AI tidak memberikan jawaban'
            )
        }

        // SEND RESULT
        await sock.sendMessage(
            m.chat,
            {
                text:
`☪️ *MUSLIM AI RESPONSE*

${result}`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore:
                        999999,

                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'Muslim AI',

                        body:
                            text.slice(0, 60),

                        thumbnailUrl:
'https://files.catbox.moe/7wclw8.jpg',

                        sourceUrl:
'https://nexray.web.id',

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
            'MuslimAI Error:',
            error
        )

        await m.react('☢️')

        if (
            error.code ===
            'ECONNABORTED'
        ) {

            return await m.reply(
`⏱️ *TIMEOUT*

Request terlalu lama,
coba lagi nanti`
            )
        }

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