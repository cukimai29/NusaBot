const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')
const Tesseract = require('tesseract.js')

const pluginConfig = {
    name: 'ocr',
    alias: ['totext', 'imagetotext', 'readtext'],
    category: 'tools',
    description: 'Extract teks dari gambar (Offline/Local)',
    usage: '.ocr (reply gambar)',
    example: '.ocr',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbTools

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '📖 *ᴏᴄʀ*', body = 'Text extraction') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    const contextInfo = {
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
        const thumbTools = await loadImage('zerotwo-games.jpg')
        if (thumbTools) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: thumbTools,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply gambar dengan \`${m.prefix}ocr\`\n\n` +
            `> Media yang didukung:\n` +
            `> JPG, PNG, GIF, WEBP`
        )
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengekstrak teks dari gambar...`)
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer || buffer.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat download gambar`)
        }
        
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        })
        
        const extractedText = text ? text.trim() : ''
        
        if (!extractedText || extractedText.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴛᴇᴋs*\n\n> Tidak ada teks yang terdeteksi di gambar`)
        }
        
        await m.react('✅')
        
        const responseText = `📖 *ᴏᴄʀ ʀᴇsᴜʟᴛ*\n\n` +
            `╭┈┈⬡「 📝 *ᴛᴇᴋs* 」\n` +
            `${extractedText.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Total: ${extractedText.length} karakter`
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('📖 *ᴏᴄʀ*', `${extractedText.length} chars`)

        await sock.sendMessage(m.chat, {
            text: responseText,
            contextInfo: contextInfo
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}