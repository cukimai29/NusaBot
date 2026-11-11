const axios = require('axios')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

const pluginConfig = {
    name: 'emojitoimage',
    alias: ['emoji2img', 'emojiimg', 'e2i'],
    category: 'tools',
    description: 'Konversi emoji ke gambar HD (style Apple)',
    usage: '.emojitoimage <emoji> [style]',
    example: '.emojitoimage 😳 apple',
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const STYLES = ['apple', 'google', 'microsoft', 'samsung', 'whatsapp', 'twitter', 'facebook']

// 🔥 HAPUS TOP-LEVEL thumbTools

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    // 🔥 FIX: Ambil gambar dari URL
    try {
        const thumbTools = await loadImage('zerotwo-tools.jpg')
        if (thumbTools) {
            ctx.externalAdReply = {
                title,
                body,
                thumbnail: thumbTools,
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch {}

    return ctx
}

async function handler(m, { sock }) {
    const args = m.args || []
    const emoji = args[0]?.trim()
    const style = args[1]?.toLowerCase() || 'apple'
    
    if (!emoji) {
        return m.reply(
            `🖼️ *ᴇᴍᴏᴊɪ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
            `> Konversi emoji ke gambar HD\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}emojitoimage <emoji> [style]\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}emojitoimage 😳 apple\`\n\n` +
            `*Style tersedia:*\n` +
            `> ${STYLES.join(', ')}`
        )
    }
    
    const validStyle = STYLES.includes(style) ? style : 'apple'
    
    m.react('🖼️')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/emoimg?q=${encodeURIComponent(emoji)}&style=${validStyle}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 15000 })
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Emoji tidak ditemukan atau API error')
        }
        
        const imgUrl = data.data.url
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🖼️ EMOJI IMAGE', `${emoji} - ${validStyle}`)

        await sock.sendMessage(m.chat, {
            image: { url: imgUrl },
            caption: `🖼️ *ᴇᴍᴏᴊɪ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
                `> Emoji: ${emoji}\n` +
                `> Style: ${validStyle}\n` +
                `> Code: ${data.data.code || '-'}`,
            contextInfo: contextInfo
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}