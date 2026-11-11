const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'meme1',
    alias: ['drakememe'],
    category: 'canvas',
    description: 'Membuat meme drake format',
    usage: '.meme1 <text1>|<text2>',
    example: '.meme1 Tidur|Main HP',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {

    const input = m.text?.trim()

    if (!input || !input.includes('|')) {

        return await m.reply(
            `🎭 *ᴍᴇᴍᴇ ᴅʀᴀᴋᴇ*\n\n` +
            `> Masukkan 2 teks dipisah |\n\n` +
            `> Contoh:\n` +
            `> ${m.prefix}meme1 Tidur|Main HP`
        )
    }

    const parts = input
        .split('|')
        .map(v => v.trim())

    const text1 = parts[0]
    const text2 = parts[1]

    if (!text1 || !text2) {

        return await m.reply(
            '❌ Text tidak valid'
        )
    }

    m.react('🕕')

    try {

        const params = new URLSearchParams()

        params.append('template_id', '181913649')
        params.append('username', 'imgflip_hubot')
        params.append('password', 'imgflip_hubot')
        params.append('text0', text1)
        params.append('text1', text2)

        const response = await axios.post(
            'https://api.imgflip.com/caption_image',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )

        const data = response.data

        if (!data.success) {
            throw new Error('Gagal membuat meme')
        }

        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url: data.data.url
                },
                caption: '🎭 *ᴍᴇᴍᴇ ᴅʀᴀᴋᴇ*'
            },
            {
                quoted: m
            }
        )

        m.react('✅')

    } catch (error) {

        console.log('Meme Error:', error)

        m.react('☢')

        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}