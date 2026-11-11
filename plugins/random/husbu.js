const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'husbu',
    alias: ['husbando'],
    category: 'random',
    description: 'Random gambar husbu/husbando anime',
    usage: '.husbu',
    example: '.husbu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: false
}

async function handler(m, { sock }) {
    try {
        await m.react('💕')
        
        const apikey = config.APIkey?.lolhuman || 'APIKey-Milik-Bot-zerotwoMD(ZEROz)'
        const url = `https://api.lolhuman.xyz/api/random/husbu?apikey=${apikey}`
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `💕 *Random Husbando*\n\n> _Anime boyfriend material~_`,
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
        
    } catch (err) {
        await m.react('❌')
        if (err.response?.status === 403) {
            return m.reply(`❌ *API Key tidak valid atau limit tercapai*`)
        }
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
