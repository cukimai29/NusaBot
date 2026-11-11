const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'reminder',
    alias: ['canvasreminder', 'remindercanvas', 'remindme'],
    category: 'canvas',
    description: 'Bikin reminder/pengingat aesthetic dengan canvas',
    usage: '.reminder <teks>',
    example: '.reminder Jangan lupa bahagia hari ini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/CrimsonText-Regular.ttf'
const BG_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/_20260425155846190.jpeg'

const PADDING_RATIO = 0.15
const FOOTER_RATIO = 0.12
const QUOTE_COLOR = '#1a1a1a'
const FONT_SIZE_MAX = 60
const FONT_SIZE_MIN = 20

const ASSET_DIR = path.join(process.cwd(), 'assets', 'reminder')
const FONT_PATH = path.join(ASSET_DIR, 'CrimsonText-Regular.ttf')
const BG_PATH = path.join(ASSET_DIR, 'bg_reminder.jpg')

async function download(url, dest) {
    if (fs.existsSync(dest)) return
    
    const https = require('https')
    const http = require('http')
    
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http
        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`))
                return
            }
            const chunks = []
            response.on('data', (chunk) => chunks.push(chunk))
            response.on('end', () => {
                fs.writeFileSync(dest, Buffer.concat(chunks))
                resolve()
            })
            response.on('error', reject)
        }).on('error', reject)
    })
}

let assetsReady = false

async function prepareAssets() {
    if (assetsReady) return
    if (!fs.existsSync(ASSET_DIR)) {
        fs.mkdirSync(ASSET_DIR, { recursive: true })
    }
    await download(FONT_URL, FONT_PATH)
    await download(BG_URL, BG_PATH)
    
    const fontBuffer = fs.readFileSync(FONT_PATH)
    GlobalFonts.register(fontBuffer, 'CrimsonText')
    
    assetsReady = true
}

function calcFontSize(ctx, text, maxWidth, maxHeight, fontName) {
    const words = text.split(' ')

    for (let size = FONT_SIZE_MAX; size >= FONT_SIZE_MIN; size -= 1) {
        ctx.font = `${size}px ${fontName}`
        const lineHeight = size * 1.35

        let lines = 0
        let currentLine = []

        words.forEach(word => {
            const testLine = [...currentLine, word].join(' ').replace(/[\[\]]/g, '')
            if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                lines++
                currentLine = [word]
            } else {
                currentLine.push(word)
            }
        })
        lines++

        if (lines * lineHeight <= maxHeight) return size
    }

    return FONT_SIZE_MIN
}

function drawTextJustified(ctx, text, centerX, centerY, maxWidth, fontSize, highlightColor = 'rgba(255, 42, 109, 0.85)') {
    const lineHeight = fontSize * 1.35
    const words = text.split(' ')
    let lines = []
    let currentLine = []

    words.forEach(word => {
        const testLine = [...currentLine, word].join(' ').replace(/[\[\]]/g, '')
        if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine)
            currentLine = [word]
        } else {
            currentLine.push(word)
        }
    })
    lines.push(currentLine)

    let startY = centerY - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((line, index) => {
        const isLastLine = index === lines.length - 1

        const lineParts = line.map(word => {
            const match = word.match(/^\[(.+?)\]([^\w]*)$/)
            if (match) {
                const highlighted = match[1]
                const trailing = match[2]
                const hlWidth = ctx.measureText(highlighted).width
                const trailWidth = ctx.measureText(trailing).width
                return { content: highlighted, trailing, isHighlight: true, width: hlWidth + trailWidth, hlWidth }
            }
            return { content: word, trailing: '', isHighlight: false, width: ctx.measureText(word).width, hlWidth: 0 }
        })

        const totalWordsWidth = lineParts.reduce((sum, p) => sum + p.width, 0)
        let currentX, spaceWidth

        if (!isLastLine && line.length > 1) {
            spaceWidth = (maxWidth - totalWordsWidth) / (line.length - 1)
            currentX = centerX - maxWidth / 2
        } else {
            const standardSpace = ctx.measureText(' ').width
            spaceWidth = standardSpace
            currentX = centerX - (totalWordsWidth + standardSpace * (line.length - 1)) / 2
        }

        lineParts.forEach(part => {
            if (part.isHighlight) {
                ctx.fillStyle = highlightColor
                ctx.fillRect(currentX, startY - fontSize * 0.45, part.hlWidth, fontSize * 0.95)
            }
            ctx.fillStyle = QUOTE_COLOR
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'left'
            ctx.fillText(part.content, currentX, startY)
            if (part.trailing) {
                ctx.fillText(part.trailing, currentX + part.hlWidth, startY)
            }
            currentX += part.width + spaceWidth
        })

        startY += lineHeight
    })
}

async function generateReminder(text, footer = 'NusaBot', highlightColor = 'rgba(255, 42, 109, 0.85)') {
    await prepareAssets()

    const bgBuffer = fs.readFileSync(BG_PATH)
    const bg = await loadImage(bgBuffer)

    const canvas = createCanvas(bg.width, bg.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bg, 0, 0)

    const padding = canvas.width * PADDING_RATIO
    const footerHeight = canvas.height * FOOTER_RATIO
    const centerX = canvas.width / 2
    const maxWidth = canvas.width - padding * 2
    const quoteAreaTop = padding
    const quoteAreaHeight = canvas.height - footerHeight - quoteAreaTop
    const quoteAreaCenterY = quoteAreaTop + quoteAreaHeight / 2

    const fontSize = calcFontSize(ctx, text, maxWidth, quoteAreaHeight, 'CrimsonText')
    ctx.font = `${fontSize}px CrimsonText`

    drawTextJustified(ctx, text, centerX, quoteAreaCenterY, maxWidth, fontSize, highlightColor)

    ctx.font = '26px CrimsonText'
    ctx.fillStyle = QUOTE_COLOR
    ctx.textAlign = 'center'
    ctx.fillText(footer, centerX, canvas.height - footerHeight / 2)

    return canvas.toBuffer('image/jpeg')
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `💕 *ʀᴇᴍɪɴᴅᴇʀ ᴄᴀɴᴠᴀꜱ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}reminder <teks reminder>\n` +
            `┃   ${m.prefix}reminder <teks> | <footer>\n` +
            `┃   ${m.prefix}reminder <teks> | <footer> | <warna>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}reminder Jangan lupa bahagia\n` +
            `┃   ${m.prefix}reminder Jangan lupa sholat | NusaBot\n` +
            `┃   ${m.prefix}reminder Tetap [semangat] ya! | Darling | pink\n` +
            `┃\n` +
            `┃ ✦ *Highlight kata*\n` +
            `┃   Pakai kurung siku [kata] buat efek highlight\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau remind apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin reminder canvas darling~ tunggu sebentar yaa 🎨`)
    
    try {
        let footer = 'NusaBot'
        let highlightColor = 'rgba(255, 42, 109, 0.85)'
        let reminderText = text
        
        if (text.includes('|')) {
            const parts = text.split('|')
            reminderText = parts[0].trim()
            if (parts[1]) footer = parts[1].trim()
            if (parts[2]) {
                const colorInput = parts[2].trim().toLowerCase()
                const colors = {
                    'pink': 'rgba(255, 105, 180, 0.85)',
                    'red': 'rgba(255, 0, 0, 0.85)',
                    'blue': 'rgba(0, 100, 255, 0.85)',
                    'green': 'rgba(0, 200, 0, 0.85)',
                    'yellow': 'rgba(255, 200, 0, 0.85)',
                    'purple': 'rgba(128, 0, 255, 0.85)',
                    'orange': 'rgba(255, 100, 0, 0.85)',
                    'cyan': 'rgba(0, 255, 255, 0.85)',
                    'white': 'rgba(255, 255, 255, 0.85)'
                }
                highlightColor = colors[colorInput] || colors.pink
            }
        }
        
        if (reminderText.length > 500) {
            m.react('💔')
            return m.reply(
                `💔 *ᴇʀʀᴏʀ*\n\n` +
                `> Teks terlalu panjang darling~ maksimal 500 karakter 🥺`
            )
        }
        
        const imageBuffer = await generateReminder(reminderText, footer, highlightColor)
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `💕 *ʀᴇᴍɪɴᴅᴇʀ ᴄᴀɴᴠᴀꜱ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 📝 *ʀᴇᴍɪɴᴅᴇʀ*:\n` +
                    `┃   ${reminderText.length > 60 ? reminderText.substring(0, 60) + '...' : reminderText}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini reminder nya darling~ jangan lupa ya! 🥰\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Reminder] Error:', err)
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