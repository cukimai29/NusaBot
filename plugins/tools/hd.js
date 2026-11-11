const { upload, get } = require('../../src/scraper/hd')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale gambar jadi HD - Zero Two style ✨ Darling~',
    usage: '.remini (reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(`*🦋 ZERO TWO SAYS 🦋*\n\n*Hei Darling, kirim dulu gambarnya dong~*\n*Biar aku bikin jadi lebih HD buat kamu!*\n\n*Contoh: ${m.prefix}remini*`)
    }

    m.react('⏳')

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            m.react('❌')
            return m.reply(`*💔 ZERO TWO 💔*\n\n*Maaf Darling, aku gagal download gambarnya...*\n*Coba lagi ya~*`)
        }
        const temp = path.join(process.cwd(), 'temp', 'hd.jpg')
        fs.writeFileSync(temp, buffer)
        const codes = await upload(temp);
        const uplot = codes.code;
        await new Promise(resolve => setTimeout(resolve, 10000));
        let result = await get(uplot);
        while (result.status === 'waiting') {
            await new Promise(resolve => setTimeout(resolve, 6000));
            result = await get(uplot);
        }
        fs.unlinkSync(temp)
        m.react('✅')

        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

        await sock.sendMessage(m.chat, {
            image: { url: result.downloadUrls[0] },
            caption: `*🦋 ZERO TWO 🦋*\n\n*Tadaa~ Selesai Darling!*\n*Sekarang gambarnya jadi lebih bening dan HD kan?*\n*Kamu pasti suka, aku jamin~ 💕*`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })

    } catch (error) {
        m.react('❌')
        m.reply(`*💔 ZERO TWO ERROR 💔*\n\n*Wah, ada yang error nih Darling...*\n*Coba lagi nanti ya, aku janji bakal lebih baik!*\n\n*Error: ${error.message}*`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}