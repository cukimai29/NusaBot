const fs = require('fs')
const path = require('path')
const { Canvas, loadImage, FontLibrary } = require('skia-canvas')
const config = require('../../config')

const pluginConfig = {
    name: 'qnc',
    alias: ['quotes', 'quote', 'kutipan'],
    category: 'canvas',
    description: 'Bikin quote aesthetic ala Zero Two',
    usage: '.qnc <teks>',
    example: '.qnc Aku selalu ada untukmu, Darling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const DEBUG = false

let HEADER = {
    text: "ZERO TWO",
    x: 543,
    y: 200,
    fontSize: 130,
    color: "#ff2a6d",
    fakeBoldOffset: 4,
    letterSpacing: "0px",
    debug: { x: 40, y: 130, w: 1006, h: 140 }
}

const PESAN = {
    text: "Aku akan selalu ada untukmu, Darling. Jangan pernah sendiri, karena aku di sini. Bersamamu, aku merasa kuat. Aku percaya padamu. Jangan pernah ragu, aku di sini..",
    x: 30,
    y: 300,
    fontSize: 63,
    lineHeight: 110,
    color: "#ffffff",
    strokeWidth: 0,
    scaleY: 1.3,
    letterSpacing: "5px",
    padding: { top: 20, bottom: 20, left: 30, right: 30 },
    debug: { x: 0, y: 280, w: 1086, h: 700 }
}

const INFO = {
    sender: "Zero Two",
    date: "02/06/2026",
    time: "11:28",
    x: 30,
    y: 980,
    useAutoY: false,
    gap: 120,
    fontSize: 48,
    lineHeight: 80,
    color: "#c084fc",
    strokeWidth: 0,
    scaleY: 1.3,
    letterSpacing: "5px",
    debug: { x: 0, y: 980, w: 1086, h: 320 }
}

const WIDTH = 1086
const HEIGHT = 1448

const BG_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/file_00000000a9f47208a295c9c984f92b7a.jpeg"
const FONT_PESAN_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/nokia-6000-series-medium.ttf"
const FONT_INFO_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/nokia-6000-series-medium.ttf"
const FONT_HEADER_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/nokia-6000-series-medium.ttf"

const ASSET_DIR = path.join(process.cwd(), 'assets', 'qnc')
const BG_PATH = path.join(ASSET_DIR, "bg_qnc.jpg")
const FONT_PESAN_PATH = path.join(ASSET_DIR, "pesan.ttf")
const FONT_INFO_PATH = path.join(ASSET_DIR, "info.ttf")
const FONT_HEADER_PATH = path.join(ASSET_DIR, "header.ttf")

async function download(url, dest) {
    if (fs.existsSync(dest)) {
        return
    }
    const https = require('https')
    const http = require('http')
    
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http
        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
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
    await download(BG_URL, BG_PATH)
    await download(FONT_PESAN_URL, FONT_PESAN_PATH)
    await download(FONT_INFO_URL, FONT_INFO_PATH)
    await download(FONT_HEADER_URL, FONT_HEADER_PATH)
    FontLibrary.use("FontHeader", FONT_HEADER_PATH)
    FontLibrary.use("FontPesan", FONT_PESAN_PATH)
    FontLibrary.use("FontInfo", FONT_INFO_PATH)
    assetsReady = true
}

function drawDebugBox(ctx, x, y, w, h, label, color) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.strokeRect(x, y, w, h)
    ctx.fillStyle = color
    ctx.font = "24px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(label, x + 4, y + 4)
    ctx.restore()
}

function drawHeaderText(ctx, cfg) {
    ctx.fillStyle = cfg.color
    ctx.font = `${cfg.fontSize}px FontHeader`
    if (ctx.letterSpacing) ctx.letterSpacing = cfg.letterSpacing
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    for (let i = 0; i <= cfg.fakeBoldOffset; i++) {
        ctx.fillText(cfg.text, cfg.x + i, cfg.y)
    }
}

function drawBodyText(ctx, text, x, y, fontName, fontSize, color, strokeWidth, scaleY, letterSpacing) {
    ctx.save()
    if (scaleY !== 1.0) {
        ctx.translate(x, y)
        ctx.scale(1, scaleY)
        ctx.translate(-x, -y)
    }
    ctx.font = `${fontSize}px ${fontName}`
    if (ctx.letterSpacing) ctx.letterSpacing = letterSpacing
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    if (strokeWidth > 0) {
        ctx.strokeStyle = color
        ctx.lineWidth = strokeWidth
        ctx.lineJoin = "round"
        ctx.strokeText(text, x, y)
    } else if (strokeWidth < 0) {
        ctx.fillStyle = color
        ctx.fillText(text, x, y)
        ctx.fillStyle = "#CAD5D8"
        ctx.lineWidth = Math.abs(strokeWidth)
        ctx.strokeStyle = "#CAD5D8"
        ctx.lineJoin = "round"
        ctx.strokeText(text, x, y)
    }

    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    ctx.restore()
}

function wrapLine(ctx, text, maxW, fontSize, fontName, letterSpacing) {
    ctx.font = `${fontSize}px ${fontName}`
    if (ctx.letterSpacing) ctx.letterSpacing = letterSpacing
    const words = text.split(" ")
    const wrapped = []
    let current = ""
    for (const word of words) {
        const test = current ? current + " " + word : word
        if (ctx.measureText(test).width > maxW && current) {
            wrapped.push(current)
            current = word
        } else {
            current = test
        }
    }
    if (current) wrapped.push(current)
    return wrapped
}

function getFitFontSize(ctx, lines, cfg, maxH) {
    const pad = cfg.padding
    const maxW = cfg.debug.w - pad.left - pad.right

    let fontSize = cfg.fontSize

    while (fontSize > 10) {
        const lineH = fontSize * (cfg.lineHeight / cfg.fontSize)
        const allWrapped = lines.flatMap(line => wrapLine(ctx, line, maxW, fontSize, "FontPesan", cfg.letterSpacing))
        const totalH = allWrapped.length * lineH

        if (totalH <= maxH) break
        fontSize -= 1
    }

    return fontSize
}

async function generateQuote(quoteText, sender = "Zero Two") {
    await prepareAssets()

    const canvas = new Canvas(WIDTH, HEIGHT)
    const ctx = canvas.getContext("2d")

    const bg = await loadImage(BG_PATH)
    ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT)

    drawHeaderText(ctx, HEADER)
    if (DEBUG) drawDebugBox(ctx, HEADER.debug.x, HEADER.debug.y, HEADER.debug.w, HEADER.debug.h, `HEADER | x:${HEADER.x} y:${HEADER.y} fs:${HEADER.fontSize}`, "rgba(0,150,255,0.8)")

    const now = new Date()
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    INFO.sender = sender
    INFO.date = date
    INFO.time = time

    const rawLines = quoteText.split("\n")
    const maxW = PESAN.debug.w - PESAN.padding.left - PESAN.padding.right
    const textX = PESAN.debug.x + PESAN.padding.left
    const textY = PESAN.debug.y + PESAN.padding.top
    const maxH = INFO.y - textY - PESAN.padding.bottom
    const fitFontSize = getFitFontSize(ctx, rawLines, PESAN, maxH)
    const fitLineHeight = fitFontSize * (PESAN.lineHeight / PESAN.fontSize)

    const wrappedLines = rawLines.flatMap(line =>
        wrapLine(ctx, line, maxW, fitFontSize, "FontPesan", PESAN.letterSpacing)
    )

    wrappedLines.forEach((line, i) => {
        drawBodyText(ctx, line, textX, textY + i * fitLineHeight, "FontPesan", fitFontSize, PESAN.color, PESAN.strokeWidth, PESAN.scaleY, PESAN.letterSpacing)
    })

    const lines = wrappedLines
    if (DEBUG) drawDebugBox(ctx, PESAN.debug.x, PESAN.debug.y, PESAN.debug.w, PESAN.debug.h, `PESAN | fs:${fitFontSize}`, "rgba(255,0,0,0.8)")

    const infoY = INFO.useAutoY
        ? PESAN.y + lines.length * fitLineHeight + INFO.gap
        : INFO.y

    const infoLines = ["Dari:", INFO.sender, INFO.date, INFO.time]
    infoLines.forEach((line, i) => {
        drawBodyText(ctx, line, INFO.x, infoY + i * INFO.lineHeight, "FontInfo", INFO.fontSize, INFO.color, INFO.strokeWidth, INFO.scaleY, INFO.letterSpacing)
    })
    if (DEBUG) drawDebugBox(ctx, INFO.debug.x, INFO.debug.y, INFO.debug.w, INFO.debug.h, `INFO | x:${INFO.x} y:${infoY} fs:${INFO.fontSize}`, "rgba(0,200,0,0.8)")

    return await canvas.toBuffer("png")
}

async function handler(m, { sock }) {
    let quoteText = m.text?.trim()
    
    if (!quoteText) {
        return m.reply(
            `💕 *Q U O T E S* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}qnc <teks quote>\n` +
            `┃   ${m.prefix}qnc <teks> | <nama>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}qnc Aku selalu ada untukmu\n` +
            `┃   ${m.prefix}qnc Jangan menyerah | Zero Two\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau bikin quote apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin quote aesthetic darling~ tunggu sebentar yaa 🎨`)
    
    try {
        let sender = "Zero Two"
        let text = quoteText
        
        if (quoteText.includes('|')) {
            const parts = quoteText.split('|')
            text = parts[0].trim()
            sender = parts[1].trim()
        }
        
        if (text.length > 500) {
            m.react('💔')
            return m.reply(
                `💔 *ᴇʀʀᴏʀ*\n\n` +
                `> Teks terlalu panjang darling~ maksimal 500 karakter 🥺`
            )
        }
        
        const imageBuffer = await generateQuote(text, sender)
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `💕 *Q U O T E S* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 📝 *ǫᴜᴏᴛᴇ*:\n` +
                    `┃   ${text.length > 50 ? text.substring(0, 50) + '...' : text}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini hasilnya darling~ semoga suka 🥰\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[QNC] Error:', err)
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