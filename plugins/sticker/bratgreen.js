const { createCanvas } = require('canvas')
const config = require('../../config.js')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'bratgreen',
    alias: ['bratgreen'],
    category: 'sticker',
    description: 'Membuat sticker brat anime',
    usage: '.bratanime <text>',
    example: '.bratanime Hai semua',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function generateBratImage(text) {
    const size = 512
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#8ace00'
    ctx.fillRect(0, 0, size, size)

    const padding = 40
    const maxWidth = size - padding * 2
    let fontSize = 90
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#000000'

    function wrapText(fontSize) {
        ctx.font = `${fontSize}px Arial`
        const words = text.split(' ')
        const lines = []
        let current = ''
        for (const word of words) {
            const test = current ? `${current} ${word}` : word
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current)
                current = word
            } else {
                current = test
            }
        }
        if (current) lines.push(current)
        return lines
    }

    let lines = wrapText(fontSize)
    while (lines.length * fontSize * 1.1 > size - padding * 2 && fontSize > 20) {
        fontSize -= 5
        lines = wrapText(fontSize)
    }

    ctx.font = `${fontSize}px Arial`
    const lineHeight = fontSize * 1.1
    const totalHeight = lines.length * lineHeight
    let y = size / 2 - totalHeight / 2 + lineHeight / 2

    for (const line of lines) {
        const textWidth = ctx.measureText(line).width
        ctx.fillText(line, size / 2 - textWidth / 2, y)
        y += lineHeight
    }

    ctx.filter = 'blur(1.2px)'
    ctx.drawImage(canvas, 0, 0)
    ctx.filter = 'none'

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(
            `🖼️ *BRAT ANIME*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratanime Hai semua\``
        )
    }

    m.react('🕕')

    try {
        const imageBuffer = generateBratImage(text)
        await sock.sendImageAsSticker(m.chat, imageBuffer, m, {
            packname: config.sticker.packname,
            author: config.sticker.author
        })
        m.react('✅')
    } catch (error) {
        console.log('[bratanime] Error:', error.message)
        m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = { config: pluginConfig, handler }