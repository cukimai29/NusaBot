const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'matematika',
    alias: ['mathgpt', 'math', 'mathsolver'],
    category: 'ai',
    description: 'AI untuk menyelesaikan soal matematika',
    usage: '.matematika <soal>',
    example: '.matematika 2+2 berapa?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {

    try {

        const text =
            m.args?.join(' ')
                ?.trim()

        // NO QUESTION
        if (!text) {

            return await m.reply(
`📐 *MATH GPT*

Masukkan soal matematika

📌 Contoh:
${pluginConfig.example}`
            )
        }

        // REACT LOADING
        await m.react('🕕')

        // API
        const api =
`https://api.covenant.sbs/api/ai/mathgpt?question=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(
                api,
                {
                    headers: {
                        'x-api-key':
                            config.APIkey.covenant
                    },

                    timeout: 60000
                }
            )

        // VALIDASI
        const result =
            data?.data?.result ||
            data?.result ||
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
`📐 *MATH GPT RESPONSE*

📝 Soal:
${text}

📚 Jawaban:
${result}`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore:
                        999999,

                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'Math GPT AI',

                        body:
                            text.slice(0, 60),

                        thumbnailUrl:
'https://files.catbox.moe/7wclw8.jpg',

                        sourceUrl:
'https://openai.com',

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
            'MathGPT Error:',
            error
        )

        await m.react('☢️')

        if (
            error.response?.status === 401
        ) {

            return await m.reply(
`❌ *401 UNAUTHORIZED*

API key covenant invalid
atau belum diisi`
            )
        }

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