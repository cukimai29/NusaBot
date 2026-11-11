const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ai4chat',
    alias: ['ai', 'gpt', 'copilot'],
    category: 'ai',
    description: 'Chat dengan AI GPT-5',
    usage: '.ai4chat <pertanyaan>',
    example: '.ai4chat Apa itu JavaScript?',
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

        // NO TEXT
        if (!text) {

            return await m.reply(
`🤖 *AI4CHAT*

❌ Masukkan pertanyaan

Contoh:
${pluginConfig.example}`
            )
        }

        // REACT LOADING
        await m.react('🕕')

        // API
        const api =
`https://api.zenzxz.my.id/ai/copilot?message=${encodeURIComponent(text)}&model=gpt-5`

        const { data } =
            await axios.get(api)

        // VALIDASI
        if (
            !data ||
            !data.result ||
            !data.result.text
        ) {

            await m.react('❌')

            return await m.reply(
                '❌ AI tidak memberikan respon'
            )
        }

        // SUCCESS
        await m.react('✅')

        await sock.sendMessage(
            m.chat,
            {
                text:
`🤖 *AI4CHAT GPT-5*

${data.result.text}`,

                contextInfo: {

                    forwardingScore: 999999,
                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'AI4CHAT GPT-5',

                        body:
                            text.slice(0, 50),

                        thumbnailUrl:
'https://files.catbox.moe/7wclw8.jpg',

                        sourceUrl:
'https://chat.openai.com',

                        mediaType: 1,
                        renderLargerThumbnail: false,
                        showAdAttribution: false
                    }
                }
            },
            { quoted: m }
        )

    } catch (error) {

        console.log('AI4CHAT Error:', error)

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