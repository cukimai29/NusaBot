const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'chords',
    alias: ['chord', 'kunci', 'kuncigitar'],
    category: 'search',
    description: 'Cari chord/kunci gitar lagu',
    usage: '.chords <judul lagu>',
    example: '.chords komang',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🎸 *ᴄʜᴏʀᴅs sᴇᴀʀᴄʜ*\n\n` +
            `> Cari chord/kunci gitar lagu\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}chords komang\`\n` +
            `\`${m.prefix}chord perjalanan terindah\``
        )
    }
    
    m.react('🎸')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/chord?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data?.chord) {
            m.react('❌')
            return m.reply(`❌ Chord tidak ditemukan untuk: \`${text}\``)
        }
        
        const chord = data.data.chord
        
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
        
        let caption = `🎸 *ᴄʜᴏʀᴅs*\n\n`
        caption += `╭┈┈⬡「 🎵 *${text.toUpperCase()}* 」\n`
        caption += `╰┈┈⬡\n\n`
        caption += `\`\`\`\n${chord}\n\`\`\``
        
        await sock.sendMessage(m.chat, {
            text: caption,
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
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
