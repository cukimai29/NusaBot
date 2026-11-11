const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'dolphin',
    alias: ['dolphinai', 'dphn'],
    category: 'ai',
    description: 'Chat dengan Dolphin AI 24B',
    usage: '.dolphin <pertanyaan>',
    example: '.dolphin jelaskan tentang AI',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const TEMPLATES = [
    'logical',
    'creative',
    'summarize',
    'code-beginner',
    'code-advanced'
]

// AI FUNCTION
async function dolphinAI(question, template = 'logical') {

    const { data } =
        await axios.post(
            'https://chat.dphn.ai/api/chat',
            {
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],

                model:
                    'dolphinserver:24B',

                template
            },
            {
                headers: {

                    origin:
                        'https://chat.dphn.ai',

                    referer:
                        'https://chat.dphn.ai/',

                    'user-agent':
                        'Mozilla/5.0'
                },

                responseType: 'text',
                timeout: 60000
            }
        )

    const result =
        data
            .split('\n\n')

            .filter(v =>
                v &&
                v.startsWith('data: {')
            )

            .map(v =>
                JSON.parse(
                    v.substring(6)
                )
            )

            .map(v =>
                v?.choices?.[0]
                    ?.delta?.content || ''
            )

            .join('')

    if (!result) {

        throw new Error(
            'AI tidak merespon'
        )
    }

    return result
}

async function handler(m, { sock }) {

    try {

        let text =
            m.text?.trim()

        // NO QUERY
        if (!text) {

            return await m.reply(
`🐬 *DOLPHIN AI*

Chat dengan Dolphin AI 24B

╭━━━〔 📋 TEMPLATE 〕━━━⬣
┃ • logical
┃ • creative
┃ • summarize
┃ • code-beginner
┃ • code-advanced
╰━━━━━━━━━━━━━━━━⬣

📌 Contoh:
${m.prefix}dolphin apa itu AI?
${m.prefix}dolphin --creative buat puisi`
            )
        }

        // DEFAULT TEMPLATE
        let template =
            'logical'

        // DETECT TEMPLATE
        const templateMatch =
            text.match(/^--(\S+)\s+/)

        if (templateMatch) {

            const requested =
                templateMatch[1]
                    .toLowerCase()

            if (
                TEMPLATES.includes(
                    requested
                )
            ) {

                template =
                    requested

                text =
                    text.replace(
                        templateMatch[0],
                        ''
                    ).trim()
            }
        }

        // EMPTY QUESTION
        if (!text) {

            return await m.reply(
                '❌ Masukkan pertanyaan'
            )
        }

        // REACT
        await m.react('🕕')

        // AI RESULT
        const result =
            await dolphinAI(
                text,
                template
            )

        // SEND
        await sock.sendMessage(
            m.chat,
            {
                text:
`🐬 *DOLPHIN AI RESPONSE*

${result}`,

                footer:
                    'NusaBot',

                contextInfo: {

                    forwardingScore: 999999,
                    isForwarded: true,

                    externalAdReply: {

                        title:
                            'Dolphin AI 24B',

                        body:
                            `Template: ${template}`,

                        thumbnailUrl:
'https://files.catbox.moe/7wclw8.jpg',

                        sourceUrl:
'https://chat.dphn.ai',

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
            'Dolphin Error:',
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