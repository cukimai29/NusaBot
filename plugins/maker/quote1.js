const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const { writeFileSync, existsSync, readFileSync, unlinkSync } = require('fs')
const path = require('path')
const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'quote1',
    alias: ['q1', 'quoteimage1', 'kata1'],
    category: 'maker',
    description: 'Buat quote aesthetic dengan efek bulge + emoji support',
    usage: '.quote <teks>',
    example: '.quote Hidup itu seperti mengendarai sepeda',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/tinos/Tinos-Regular.ttf'
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'quote')
const FONT_PATH = path.join(ASSETS_DIR, 'QuoteFont.ttf')
const EMOJI_JSON_PATH = path.join(ASSETS_DIR, 'emoji-apple.json')

const THEMES = {
    quote: { bg: '#ffffff', text: '#9e0a1b' },
    dark: { bg: '#0a0a1a', text: '#ffd93d' },
    pink: { bg: '#ffd1dc', text: '#9b2d4c' },
    blue: { bg: '#d4e9ff', text: '#1a5276' },
    green: { bg: '#d5f5e3', text: '#1a6e3a' },
    purple: { bg: '#e8d5f5', text: '#4a1a6e' }
}

const WIDTH = 720
const HEIGHT = 1280
const BULGE_RADIUS = 580
const BULGE_STRENGTH = 0.12

let emojiMap = null
const emojiImageCache = new Map()

async function downloadFile(url, dest) {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const buf = Buffer.from(response.data)
    writeFileSync(dest, buf)
    return buf
}

async function ensureFonts() {
    if (!existsSync(ASSETS_DIR)) {
        const fs = require('fs')
        fs.mkdirSync(ASSETS_DIR, { recursive: true })
    }
    if (!existsSync(FONT_PATH)) await downloadFile(FONT_URL, FONT_PATH)
    GlobalFonts.registerFromPath(FONT_PATH, 'QuoteFont')
}

function emojiToUnicode(emoji) {
    return [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')
}

async function loadEmojiMap() {
    if (emojiMap) return emojiMap
    if (!existsSync(EMOJI_JSON_PATH)) await downloadFile(EMOJI_JSON_URL, EMOJI_JSON_PATH)
    emojiMap = JSON.parse(readFileSync(EMOJI_JSON_PATH, 'utf-8'))
    return emojiMap
}

async function getEmojiImage(emoji) {
    if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji)
    const map = await loadEmojiMap()
    const base = emojiToUnicode(emoji)
    const variants = [
        base,
        base.replace(/-fe0f/gi, ''),
        `${base.replace(/-fe0f/gi, '')}-fe0f`,
        base.toUpperCase(),
        base.replace(/-fe0f/gi, '').toUpperCase(),
        base.replace(/-fe0f/gi, '').toUpperCase() + '-FE0F'
    ]
    let b64 = null
    for (const v of variants) {
        if (map[v]) { b64 = map[v]; break }
    }
    if (!b64) return null
    const img = await loadImage(Buffer.from(b64, 'base64'))
    emojiImageCache.set(emoji, img)
    return img
}

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu

function tokenize(rawText) {
    const chunks = rawText.split(EMOJI_REGEX)
    const tokens = []
    for (const chunk of chunks) {
        if (!chunk) continue
        EMOJI_REGEX.lastIndex = 0
        if (EMOJI_REGEX.test(chunk)) {
            tokens.push({ type: 'emoji', text: chunk })
            EMOJI_REGEX.lastIndex = 0
            continue
        }
        const parts = chunk.split(/(\*[^*]+\*)/g)
        for (const part of parts) {
            if (!part) continue
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                splitWords(part.slice(1, -1), 'italic', tokens)
            } else {
                splitWords(part, 'auto', tokens)
            }
        }
    }
    return tokens
}

function splitWords(text, forcedStyle, tokens) {
    const words = text.split(/(\s+)/)
    for (const w of words) {
        if (w === '') continue
        if (/^\s+$/.test(w)) {
            tokens.push({ type: 'space', text: w })
            continue
        }
        let style = forcedStyle
        if (forcedStyle === 'auto') {
            const letters = w.replace(/[^a-zA-Z]/g, '')
            style = (letters.length > 1 && letters === letters.toUpperCase()) ? 'bold' : 'regular'
        }
        tokens.push({ type: 'word', text: w, style })
    }
}

function fontForStyle(style, size) {
    if (style === 'bold') return `bold ${size}px QuoteFont`
    if (style === 'italic') return `italic ${size}px QuoteFont`
    return `${size}px QuoteFont`
}

function expandToChars(tokens) {
    const chars = []
    for (const tok of tokens) {
        if (tok.type === 'emoji') {
            chars.push({ type: 'emoji', text: tok.text })
            continue
        }
        if (tok.type === 'space') {
            chars.push({ type: 'char', text: ' ', style: 'regular' })
            continue
        }
        for (const ch of tok.text) {
            chars.push({ type: 'char', text: ch, style: tok.style })
        }
    }
    return chars
}

function layoutLines(ctx, tokens, fontSize, maxWidth) {
    const lines = []
    let current = []
    let currentWidth = 0

    function widthOf(tok) {
        if (tok.type === 'emoji') return fontSize
        ctx.font = fontForStyle(tok.style, fontSize)
        return ctx.measureText(tok.text).width
    }

    for (const tok of tokens) {
        if (tok.type === 'space') {
            ctx.font = `${fontSize}px QuoteFont`
            const spW = ctx.measureText(' ').width
            if (current.length === 0) continue
            current.push({ ...tok, width: spW })
            currentWidth += spW
            continue
        }
        const w = widthOf(tok)
        if (currentWidth + w > maxWidth && current.length > 0) {
            while (current.length && current[current.length - 1].type === 'space') current.pop()
            lines.push(current)
            current = []
            currentWidth = 0
        }
        current.push({ ...tok, width: w })
        currentWidth += w
    }
    if (current.length) {
        while (current.length && current[current.length - 1].type === 'space') current.pop()
        lines.push(current)
    }
    return lines
}

function totalLineWidth(line) {
    return line.reduce((sum, t) => sum + t.width, 0)
}

function findBestFontSize(ctx, tokens, maxWidth, maxHeight) {
    let lo = 10, hi = 80, best = lo
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        const currentLineGap = Math.floor(mid * 0.2)
        const lines = layoutLines(ctx, tokens, mid, maxWidth)
        const totalHeight = lines.length * (mid + currentLineGap) - currentLineGap
        const fits = totalHeight <= maxHeight && lines.every(l => totalLineWidth(l) <= maxWidth)
        if (fits) { best = mid; lo = mid + 1 } else { hi = mid - 1 }
    }
    return best
}

async function drawEmojiToken(ctx, emoji, x, y, size) {
    const img = await getEmojiImage(emoji)
    if (!img) { ctx.font = `${size}px QuoteFont`; ctx.fillText(emoji, x, y); return }
    ctx.drawImage(img, x, y, size, size)
}

async function drawFlatLines(ctx, lines, centerX, startY, fontSize, lineGap) {
    let y = startY
    for (const line of lines) {
        const charTokens = expandToChars(line)
        const widths = charTokens.map(c => {
            if (c.type === 'emoji') return fontSize
            ctx.font = fontForStyle(c.style, fontSize)
            return ctx.measureText(c.text).width
        })
        const lineWidth = widths.reduce((a, b) => a + b, 0)
        let x = centerX - lineWidth / 2

        for (let i = 0; i < charTokens.length; i++) {
            const c = charTokens[i]
            const w = widths[i]
            if (c.type === 'emoji') {
                await drawEmojiToken(ctx, c.text, x, y, fontSize)
            } else if (c.text !== ' ') {
                ctx.font = fontForStyle(c.style, fontSize)
                ctx.fillText(c.text, x, y)
            }
            x += w
        }
        y += fontSize + lineGap
    }
}

function applyBulgeDistortion(srcCtx, dstCtx, width, height, radius, strength) {
    const srcData = srcCtx.getImageData(0, 0, width, height)
    const dstData = dstCtx.createImageData(width, height)
    const src = srcData.data
    const dst = dstData.data

    const cx = width / 2
    const cy = height / 2

    for (let y = 0; y < height; y++) {
        const dy = y - cy
        for (let x = 0; x < width; x++) {
            const dx = x - cx
            const dist = Math.sqrt(dx * dx + dy * dy)

            let sx = x
            let sy = y

            if (dist < radius && dist > 0) {
                const norm = dist / radius
                const exponent = 1 + strength
                const newDist = radius * Math.pow(norm, exponent)
                const ratio = newDist / dist
                sx = cx + dx * ratio
                sy = cy + dy * ratio
            }

            const dstIdx = (y * width + x) * 4

            if (sx >= 0 && sx < width - 1 && sy >= 0 && sy < height - 1) {
                const x1 = Math.floor(sx)
                const y1 = Math.floor(sy)
                const x2 = x1 + 1
                const y2 = y1 + 1

                const wx = sx - x1
                const wy = sy - y1

                const i11 = (y1 * width + x1) * 4
                const i21 = (y1 * width + x2) * 4
                const i12 = (y2 * width + x1) * 4
                const i22 = (y2 * width + x2) * 4

                for (let c = 0; c < 4; c++) {
                    const top = src[i11 + c] * (1 - wx) + src[i21 + c] * wx
                    const bottom = src[i12 + c] * (1 - wx) + src[i22 + c] * wx
                    dst[dstIdx + c] = Math.round(top * (1 - wy) + bottom * wy)
                }
            } else {
                dst[dstIdx] = 255
                dst[dstIdx + 1] = 255
                dst[dstIdx + 2] = 255
                dst[dstIdx + 3] = 255
            }
        }
    }

    dstCtx.putImageData(dstData, 0, 0)
}

async function generateQuote({
    text = 'Hidup itu seperti mengendarai sepeda 🚲. Untuk menjaga keseimbanganmu ⚖️, kamu harus terus bergerak maju ➡️.',
    theme = 'quote',
    bulgeRadius = BULGE_RADIUS,
    bulgeStrength = BULGE_STRENGTH
} = {}) {
    const t = THEMES[theme] || THEMES.quote

    const padding = 140
    const maxWidth = WIDTH - padding * 2

    await ensureFonts()
    await loadEmojiMap()

    const offCanvas = createCanvas(WIDTH, HEIGHT)
    const offCtx = offCanvas.getContext('2d')

    offCtx.fillStyle = t.bg
    offCtx.fillRect(0, 0, WIDTH, HEIGHT)

    const tokens = tokenize(text)
    offCtx.textAlign = 'left'
    offCtx.textBaseline = 'top'

    const fontSize = findBestFontSize(offCtx, tokens, maxWidth, HEIGHT * 0.45)
    const lineGap = Math.floor(fontSize * 0.2)

    const lines = layoutLines(offCtx, tokens, fontSize, maxWidth)
    const totalTextHeight = lines.length * (fontSize + lineGap) - lineGap

    offCtx.fillStyle = t.text
    const startY = (HEIGHT - totalTextHeight) / 2
    const centerX = WIDTH / 2

    await drawFlatLines(offCtx, lines, centerX, startY, fontSize, lineGap)

    const canvas = createCanvas(WIDTH, HEIGHT)
    const ctx = canvas.getContext('2d')

    applyBulgeDistortion(offCtx, ctx, WIDTH, HEIGHT, bulgeRadius, bulgeStrength)

    return await canvas.encode('png')
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
`📝 *Quote Image Generator*

Buat quote aesthetic dengan efek bulge!

📌 *Format:*
> ${m.prefix}quote <teks>

📌 *Contoh:*
> ${m.prefix}quote Hidup itu seperti mengendarai sepeda 🚲

📌 *Theme opsional (di akhir):*
> ${m.prefix}quote <teks> --dark
> ${m.prefix}quote <teks> --pink
> ${m.prefix}quote <teks> --blue

🎨 *Theme tersedia:*
quote • dark • pink • blue • green • purple

✨ *Support emoji & bold/italic (*teks*)!*`
        )
    }

    let theme = 'quote'
    let cleanText = text

    const themeMatch = text.match(/--(\w+)$/)
    if (themeMatch) {
        const t = themeMatch[1].toLowerCase()
        if (THEMES[t]) {
            theme = t
            cleanText = text.replace(/--\w+$/, '').trim()
        }
    }

    if (!cleanText) {
        return m.reply(`❌ *Teks tidak boleh kosong!*`)
    }

    await m.react('⏳')

    try {
        const imageBuffer = await generateQuote({
            text: cleanText,
            theme: theme
        })

        const outPath = path.join(process.cwd(), `temp/quote-${Date.now()}.png`)
        const fs = require('fs')
        if (!fs.existsSync(path.dirname(outPath))) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true })
        }
        writeFileSync(outPath, imageBuffer)

        await sock.sendMessage(m.chat, {
            image: fs.readFileSync(outPath),
            caption: `📝 *Quote Generator*

${cleanText}

🎨 *Theme:* ${theme}
💕 *NusaBot*`
        }, { quoted: m })

        try { unlinkSync(outPath) } catch {}

        await m.react('✅')

    } catch (err) {
        console.error('[QUOTE Error]', err)
        await m.react('❌')
        await m.reply(
`❌ *Gagal membuat quote!*

> ${err.message}

Coba dengan teks yang lebih pendek.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}