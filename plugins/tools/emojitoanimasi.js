const axios = require('axios')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

const pluginConfig = {
    name: 'emojitoanimasi',
    alias: ['emoji2sticker', 'emojisticker', 'e2s'],
    category: 'tools',
    description: 'Konversi emoji ke sticker animasi',
    usage: '.emojitoanimasi <emoji>',
    example: '.emojitoanimasi 😳',
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

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
    const emoji = m.text?.trim()
    
    if (!emoji) {
        return m.reply(
            `🎭 *ᴇᴍᴏᴊɪ ᴛᴏ ᴀɴɪᴍᴀsɪ*\n\n` +
            `> Konversi emoji ke sticker animasi\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}emojitoanimasi 😳\``
        )
    }
    
    m.react('🎭')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/emojito?q=${encodeURIComponent(emoji)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 15000 })
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Emoji tidak ditemukan atau API error')
        }
        
        const webpUrl = data.data.url
        
        const webpRes = await axios.get(webpUrl, { 
            responseType: 'arraybuffer',
            timeout: 15000 
        })
        const webpBuffer = Buffer.from(webpRes.data)
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🎭 EMOJI STICKER', emoji)

        await sock.sendMessage(m.chat, {
            sticker: webpBuffer,
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