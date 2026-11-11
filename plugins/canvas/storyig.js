const { Canvas, loadImage, FontLibrary } = require('skia-canvas')
const fs = require('fs')
const path = require('path')
const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'storyig',
    alias: ['igstory', 'storyinstagram', 'igst'],
    category: 'canvas',
    description: 'Buat story Instagram aesthetic dengan teks custom',
    usage: '.storyig <teks>',
    example: '.storyig Selamat pagi (Darling) dari Zero Two',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'storyig')
const FONT_SB_PATH = path.join(ASSETS_DIR, 'Inter-SemiBold.otf')
const FONT_B_PATH = path.join(ASSETS_DIR, 'Inter-Bold.otf')
const BG_PATH = path.join(ASSETS_DIR, 'bg-template.jpg')
const DEFAULT_PP = 'https://raw.githubusercontent.com/uploader762/dat4/main/uploads/e0f993-1777126212302.jpg'

async function downloadFile(url, dest) {
    if (fs.existsSync(dest)) return
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    })
    
    const writer = fs.createWriteStream(dest)
    response.data.pipe(writer)
    
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function downloadBuffer(url) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
    })
    return Buffer.from(response.data)
}

async function ensureAssets() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true })
    }
    
    await downloadFile('https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/Inter-SemiBold.otf', FONT_SB_PATH)
    await downloadFile('https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/Inter-Bold.otf', FONT_B_PATH)
    await downloadFile('https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/_20260430144912806.jpg', BG_PATH)
    
    FontLibrary.use('Inter-SB', [FONT_SB_PATH])
    FontLibrary.use('Inter-B', [FONT_B_PATH])
}

async function generateStory(ppUrl, name, text) {
    await ensureAssets()
    
    let bg = await loadImage(BG_PATH)
    let avatar = await loadImage(ppUrl)
    
    let canvas = new Canvas(bg.width, bg.height)
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    ctx.drawImage(bg, 0, 0)
    
    let header = { x: 115, y: 388, gap: 25 }
    let p = { cx: header.x, cy: header.y, r: 68 }
    
    const SAFE_PADDING_X = 100
    const SAFE_PADDING_TOP = 480
    const SAFE_PADDING_BOTTOM = 480
    
    let safeLeft = SAFE_PADDING_X
    let safeRight = bg.width - SAFE_PADDING_X
    let safeTop = SAFE_PADDING_TOP
    let safeBottom = bg.height - SAFE_PADDING_BOTTOM
    let safeW = safeRight - safeLeft
    let safeH = safeBottom - safeTop
    let safeCX = bg.width / 2
    let safeCY = (safeTop + safeBottom) / 2
    
    let s = Math.min(avatar.width, avatar.height)
    let sx = (avatar.width - s) / 2
    let sy = (avatar.height - s) / 2
    
    ctx.save()
    ctx.beginPath()
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avatar, sx, sy, s, s, p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2)
    ctx.restore()
    
    ctx.font = 'bold 55px "Inter-SB"'
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(name, p.cx + p.r + header.gap, p.cy)
    
    function parseTokens(input) {
        let tokens = []
        let regex = /\(([^)]*)\)/g
        let last = 0, match
        while ((match = regex.exec(input)) !== null) {
            if (match.index > last) tokens.push({ text: input.slice(last, match.index), red: false })
            tokens.push({ text: match[1], red: true })
            last = regex.lastIndex
        }
        if (last < input.length) tokens.push({ text: input.slice(last), red: false })
        return tokens
    }
    
    function measureToken(ctx, token, fsz) {
        ctx.font = `bold ${fsz}px "${token.red ? 'Inter-B' : 'Inter-SB'}"`
        return ctx.measureText(token.text).width
    }
    
    function wrapTokens(ctx, tokens, maxWidth, fsz) {
        let lines = []
        let curLine = []
        let curW = 0
        
        let words = []
        for (let tok of tokens) {
            let parts = tok.text.split(/(\s+)/)
            for (let p of parts) {
                if (p === '') continue
                words.push({ text: p, red: tok.red })
            }
        }
        
        for (let word of words) {
            if (/^\s+$/.test(word.text)) {
                if (curLine.length > 0) {
                    ctx.font = `bold ${fsz}px "Inter-SB"`
                    let spaceW = ctx.measureText(' ').width
                    curW += spaceW
                    let last = curLine[curLine.length - 1]
                    if (last.red === word.red) last.text += word.text
                    else curLine.push({ text: word.text, red: word.red })
                }
                continue
            }
            
            ctx.font = `bold ${fsz}px "${word.red ? 'Inter-B' : 'Inter-SB'}"`
            let wordW = ctx.measureText(word.text).width
            ctx.font = `bold ${fsz}px "Inter-SB"`
            let spaceW = ctx.measureText(' ').width
            
            let addW = curLine.length > 0 ? spaceW + wordW : wordW
            
            if (curW + addW > maxWidth && curLine.length > 0) {
                lines.push(curLine)
                curLine = [{ text: word.text, red: word.red }]
                curW = wordW
            } else {
                if (curLine.length > 0) {
                    let last = curLine[curLine.length - 1]
                    if (last.red === word.red) {
                        last.text += ' ' + word.text
                    } else {
                        curLine.push({ text: ' ', red: false })
                        curLine.push({ text: word.text, red: word.red })
                    }
                    curW += spaceW + wordW
                } else {
                    curLine.push({ text: word.text, red: word.red })
                    curW = wordW
                }
            }
        }
        if (curLine.length > 0) lines.push(curLine)
        return lines
    }
    
    function lineWidth(ctx, segments, fsz) {
        return segments.reduce((sum, seg) => {
            ctx.font = `bold ${fsz}px "${seg.red ? 'Inter-B' : 'Inter-SB'}"`
            return sum + ctx.measureText(seg.text).width
        }, 0)
    }
    
    function drawScaledText(ctx, input) {
        let tokens = parseTokens(input.trim())
        
        const MAX_FONT = 65
        const MIN_FONT = 18
        let fsz = MAX_FONT
        let lines, totalH, lh
        
        do {
            lh = fsz * 1.25
            lines = wrapTokens(ctx, tokens, safeW, fsz)
            totalH = lines.length * lh
            if (totalH <= safeH) break
            fsz -= 1
        } while (fsz > MIN_FONT)
        
        if (totalH > safeH) {
            const maxLines = Math.floor(safeH / lh)
            lines = lines.slice(0, maxLines)
            if (lines.length > 0) {
                let lastLine = lines[lines.length - 1]
                ctx.font = `bold ${fsz}px "Inter-SB"`
                let dotsW = ctx.measureText('...').width
                while (lineWidth(ctx, lastLine, fsz) + dotsW > safeW) {
                    let last = lastLine[lastLine.length - 1]
                    if (last.text.length > 1) {
                        last.text = last.text.slice(0, -1).trimEnd()
                    } else {
                        lastLine.pop()
                        if (lastLine.length === 0) break
                    }
                }
                lastLine.push({ text: '...', red: false })
            }
            totalH = lines.length * lh
        }
        
        let startY = safeCY - totalH / 2 + lh / 2
        ctx.textBaseline = 'middle'
        
        for (let i = 0; i < lines.length; i++) {
            let segments = lines[i]
            let totalW = lineWidth(ctx, segments, fsz)
            let x = safeCX - totalW / 2
            let y = startY + i * lh
            
            for (let seg of segments) {
                ctx.font = `bold ${fsz}px "${seg.red ? 'Inter-B' : 'Inter-SB'}"`
                ctx.fillStyle = seg.red ? '#e51a1a' : '#000000'
                ctx.textAlign = 'left'
                ctx.fillText(seg.text, x, y)
                x += ctx.measureText(seg.text).width
            }
        }
    }
    
    drawScaledText(ctx, text)
    return await canvas.toBuffer('png')
}

async function handler(m, { sock }) {
    let text = m.args?.join(' ') || m.text?.trim() || ''
    
    if (!text) {
        return m.reply(
            `💕 *ꜱᴛᴏʀʏ ɪɢ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}storyig <teks>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}storyig Selamat pagi (Darling) dari Zero Two\n` +
            `┃   ${m.prefix}storyig Jangan pernah (menyerah) ya!\n` +
            `┃\n` +
            `┃ ✦ *Fitur Highlight*\n` +
            `┃   Gunakan tanda kurung (teks) untuk warna merah\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau bikin story IG aesthetic apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    if (text.length > 500) {
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> Teks terlalu panjang darling~ maksimal 500 karakter 🥺`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin story Instagram darling~ tunggu sebentar yaa 🎨`)
    
    try {
        const name = m.pushName || 'Darling'
        const ppUrl = DEFAULT_PP
        
        const imageBuffer = await generateStory(ppUrl, name, text)
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `💕 *ꜱᴛᴏʀʏ ɪɢ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 📝 *ᴛᴇᴋꜱ*:\n` +
                    `┃   ${text.length > 50 ? text.substring(0, 50) + '...' : text}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini story nya darling~ keren kan? 🦋\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[StoryIG] Error:', err)
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