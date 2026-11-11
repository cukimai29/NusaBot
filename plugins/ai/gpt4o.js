const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'gpt4o',
    alias: ['gpt4'],
    category: 'ai',
    description: 'Chat dengan GPT-4o',
    usage: '.gpt4o <pertanyaan>',
    example: '.gpt4o Hai apa kabar?',
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
`🧠 *GPT-4O*

Masukkan pertanyaan

📌 Contoh:
${pluginConfig.example}`
            )
        }

        // REACT LOADING
        await m.react('🕕')

        // API
        const api =
`https://api.covenant.sbs/api/ai/gpt4?question=${encodeURIComponent(text)}`

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
                '❌ AI tidak memberikan respon'
            )
        }

        // SEND RESULT
        await sock.sendMessage(
            m.chat,
            {
                text:
`🧠 *GPT-4O RESPONSE*

${result}`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore:
                        999999,

                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'GPT-4O AI',

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
            'GPT4O Error:',
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