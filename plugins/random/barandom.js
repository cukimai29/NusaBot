const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'barandom',
    alias: ['bluearchive', 'ba'],
    category: 'random',
    description: 'Random gambar Blue Archive',
    usage: '.barandom',
    example: '.barandom',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/ba'
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    await m.react('🎴')
    
    try {
        const res = await axios.get(api, { responseType: 'arraybuffer' })
        const buf = Buffer.from(res.data)
        
        await sock.sendMessage(m.chat, {
            image: buf,
            caption: `🎴 *ʙʟᴜᴇ ᴀʀᴄʜɪᴠᴇ ʀᴀɴᴅᴏᴍ*`,
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
        
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
