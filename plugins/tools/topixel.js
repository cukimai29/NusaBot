const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const config = require('../../config')

const pluginConfig = {
    name: 'topixel',
    alias: ['pixelate', 'pixelart', 'pix', 'jadipixel'],
    category: 'tools',
    description: 'Mengubah gambar menjadi pixel art',
    usage: '.topixel (reply gambar)',
    example: '.topixel',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const DEFAULT_LEVEL = 30

function getBlock(level) {
    const value = Math.min(Math.max(Number(level) || DEFAULT_LEVEL, 1), 40)
    return 41 - value
}

async function pixelArt(inputBuffer, pixelLevel = DEFAULT_LEVEL) {
    try {
        const image = sharp(inputBuffer, { limitInputPixels: false }).rotate().ensureAlpha()
        const meta = await image.metadata()

        const width = meta.width
        const height = meta.height
        const block = getBlock(pixelLevel)

        const input = await image.raw().toBuffer()
        const output = Buffer.alloc(input.length)

        for (let y = 0; y < height; y += block) {
            for (let x = 0; x < width; x += block) {
                let r = 0, g = 0, b = 0, a = 0, count = 0

                const maxY = Math.min(y + block, height)
                const maxX = Math.min(x + block, width)

                for (let yy = y; yy < maxY; yy++) {
                    for (let xx = x; xx < maxX; xx++) {
                        const i = (yy * width + xx) * 4
                        r += input[i]
                        g += input[i + 1]
                        b += input[i + 2]
                        a += input[i + 3]
                        count++
                    }
                }

                r = Math.round(r / count)
                g = Math.round(g / count)
                b = Math.round(b / count)
                a = Math.round(a / count)

                for (let yy = y; yy < maxY; yy++) {
                    for (let xx = x; xx < maxX; xx++) {
                        const i = (yy * width + xx) * 4
                        output[i] = r
                        output[i + 1] = g
                        output[i + 2] = b
                        output[i + 3] = a
                    }
                }
            }
        }

        const resultBuffer = await sharp(output, {
            raw: { width, height, channels: 4 }
        })
        .png({ compressionLevel: 9, adaptiveFiltering: false })
        .toBuffer()

        return { success: true, buffer: resultBuffer, width, height }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

async function handler(m, { sock }) {
    // 🔥 CARA DETEKSI GAMBAR YANG LEBIH FLEKSIBEL
    let quoted = m.quoted || m
    let isImage = false
    let imageBuffer = null
    
    // Cek dari quoted message
    if (m.quoted) {
        const msg = m.quoted.msg || m.quoted
        const hasMedia = msg?.imageMessage || msg?.videoMessage || msg?.documentMessage || 
                         (msg?.mimetype && msg.mimetype.startsWith('image/'))
        
        if (hasMedia || (msg?.mimetype && msg.mimetype.startsWith('image/'))) {
            isImage = true
            try {
                imageBuffer = await m.quoted.download()
            } catch (e) {}
        }
    }
    
    // Cek dari message langsung (kirim gambar + caption)
    if (!imageBuffer && m.msg?.imageMessage) {
        isImage = true
        try {
            imageBuffer = await m.download()
        } catch (e) {}
    }
    
    // Cek dari mime langsung
    const mime = m.mimetype || m.msg?.mimetype || m.quoted?.mimetype || ''
    if (!imageBuffer && mime && mime.startsWith('image/')) {
        isImage = true
        try {
            if (m.quoted) imageBuffer = await m.quoted.download()
            else imageBuffer = await m.download()
        } catch (e) {}
    }
    
    if (!isImage || !imageBuffer) {
        return m.reply(
            `💕 *ᴛᴏᴘɪxᴇʟ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   1. Reply gambar dengan \`${m.prefix}topixel\`\n` +
            `┃   2. Kirim gambar + caption \`${m.prefix}topixel\`\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau jadi pixel art darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi ngubah gambar jadi pixel art darling~ tunggu sebentar yaa 🎨`)
    
    try {
        const result = await pixelArt(imageBuffer, DEFAULT_LEVEL)
        
        if (!result.success) {
            m.react('💔')
            return m.reply(
                `💔 *ᴇʀʀᴏʀ*\n\n` +
                `> ${result.error}\n\n` +
                `> Coba lagi ya darling~ 🥺`
            )
        }
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `💕 *ᴘɪxᴇʟ ᴀʀᴛ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini hasilnya darling~ semoga suka 🥰\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Topixel] Error:', err)
        m.react('💔')
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> ${err.message}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}