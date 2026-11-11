const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'gita',
    alias: ['gitagpt', 'bhagavadgita'],
    category: 'ai',
    description: 'Chat dengan Gita GPT',
    usage: '.gita <pertanyaan>',
    example: '.gita What is dharma?',
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
`📿 *GITA GPT*

Chat dengan Bhagavad Gita AI

📌 Contoh:
${pluginConfig.example}`
            )
        }

        // REACT LOADING
        await m.react('🕕')

        // API
        const api =
`https://api.nexray.web.id/ai/gitagpt?text=${encodeURIComponent(text)}`

        const { data } =
            await axios.get(api)

        // VALIDASI
        const result =
            data?.result ||
            data?.data ||
            data?.answer

        if (!result) {

            await m.react('❌')

            return await m.reply(
                '❌ AI tidak merespon'
            )
        }

        // SEND RESULT
        await sock.sendMessage(
            m.chat,
            {
                text:
`📿 *GITA GPT RESPONSE*

${result.trim()}`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore:
                        999999,

                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'Bhagavad Gita AI',

                        body:
                            text.slice(0, 50),

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
            'GitaGPT Error:',
            error
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