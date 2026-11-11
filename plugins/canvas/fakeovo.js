const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas")
const fs = require("fs")
const path = require("path")
const config = require('../../config')

const pluginConfig = {
    name: 'fakeovo',
    alias: ['faketf', 'ovofake', 'fakepayment', 'fpovo'],
    category: 'canvas',
    description: 'Bikin fake screenshot OVO payment (BUAT KONTEN/GAGUAN DOANG YA 🗿)',
    usage: '.fakeovo <nominal>',
    example: '.fakeovo 500000',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const WIDTH = 841
const HEIGHT = 1870

const IMAGE_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/file_0000000078bc71fa87da5cf26dc6c008.jpeg"

const FIXED_RP = {
    text: "Rp",
    x: 61,
    y: 368,
    size: 20,
    weight: 800
}

const AMOUNT_STYLE = {
    x: 94,
    y: 371,
    size: 28,
    weight: 800,
    color: "#FFFFFF"
}

function formatAmount(input) {
    const digits = String(input).replace(/[^\d]/g, "") || "0"
    const normalized = digits.replace(/^0+(?=\d)/, "")
    return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function registerFont() {
    const fontPaths = [
        path.join(process.cwd(), "node_modules", "@fontsource", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-600-normal.woff2"),
        path.join(process.cwd(), "node_modules", "@fontsource", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-ext-600-normal.woff2"),
        path.join(process.cwd(), "assets", "fonts", "PlusJakartaSans-Bold.woff2"),
        path.join(process.cwd(), "assets", "fonts", "PlusJakartaSans-Bold.ttf")
    ]
    
    for (const fontPath of fontPaths) {
        if (fs.existsSync(fontPath)) {
            GlobalFonts.registerFromPath(fontPath, "Plus Jakarta Sans")
            return true
        }
    }
    
    try {
        GlobalFonts.registerFromPath(path.join(process.cwd(), "assets", "fonts", "PlusJakartaSans-Bold.ttf"), "Plus Jakarta Sans")
    } catch (e) {}
    
    return false
}

async function loadImageFromUrl(url) {
    const https = require('https')
    const http = require('http')
    
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http
        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Gagal download image: HTTP ${response.statusCode}`))
                return
            }
            
            const chunks = []
            response.on('data', (chunk) => chunks.push(chunk))
            response.on('end', async () => {
                const buffer = Buffer.concat(chunks)
                try {
                    const img = await loadImage(buffer)
                    resolve(img)
                } catch (err) {
                    reject(err)
                }
            })
            response.on('error', reject)
        }).on('error', reject)
    })
}

async function generateFakeOvo(amount) {
    const formattedAmount = formatAmount(amount)
    const outputDir = path.join(process.cwd(), "tmp")
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputPath = path.join(outputDir, `fakeovo_${Date.now()}.png`)
    
    try {
        registerFont()
        
        const image = await loadImageFromUrl(IMAGE_URL)
        
        const canvas = createCanvas(WIDTH, HEIGHT)
        const ctx = canvas.getContext("2d")
        
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(image, 0, 0, WIDTH, HEIGHT)
        
        ctx.fillStyle = AMOUNT_STYLE.color
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
        
        ctx.font = `${FIXED_RP.weight} ${FIXED_RP.size}px "Plus Jakarta Sans"`
        ctx.fillText(FIXED_RP.text, FIXED_RP.x, FIXED_RP.y)
        
        const amountText = formattedAmount
        
        ctx.font = `${AMOUNT_STYLE.weight} ${AMOUNT_STYLE.size}px "Plus Jakarta Sans"`
        ctx.fillText(amountText, AMOUNT_STYLE.x, AMOUNT_STYLE.y)
        
        const buffer = await canvas.encode("png")
        fs.writeFileSync(outputPath, buffer)
        
        return {
            success: true,
            path: outputPath,
            amount: amountText,
            formatted: `Rp ${amountText}`
        }
        
    } catch (err) {
        return {
            success: false,
            error: err.message
        }
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    let amount = args[0]?.replace(/[^\d]/g, "") || "0"
    
    if (!amount || amount === "0") {
        return m.reply(
            `💕 *ғᴀᴋᴇ ᴏᴠᴏ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}fakeovo <nominal>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}fakeovo 500000\n` +
            `┃   ${m.prefix}fakeovo 1.000.000\n` +
            `┃   ${m.prefix}fakeovo 10000000\n` +
            `┃\n` +
            `┃ ⚠️ *Dilarang keras!*\n` +
            `┃   Fitur ini untuk konten/gaguan\n` +
            `┃   JANGAN dipakai buat nipu!\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau bikin nominal berapa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    let nominal = parseInt(amount)
    if (isNaN(nominal)) nominal = 0
    if (nominal < 0) nominal = 0
    if (nominal > 999999999) {
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> Nominal terlalu besar darling~ maksimal Rp 999.999.999 🥺`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin fake OVO darling~ tunggu sebentar yaa 🎨`)
    
    try {
        const result = await generateFakeOvo(nominal)
        
        if (!result.success) {
            m.react('💔')
            return m.reply(
                `💔 *ɢᴀɢᴀʟ*\n\n` +
                `> ${result.error}\n\n` +
                `> Coba lagi ya darling~ 🥺`
            )
        }
        
        await sock.sendMessage(m.chat, {
            image: fs.readFileSync(result.path),
            caption: `💕 *ғᴀᴋᴇ ᴏᴠᴏ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 💰 *ɴᴏᴍɪɴᴀʟ*: ${result.formatted}\n` +
                    `┃\n` +
                    `┃ ⚠️ *Peringatan!*\n` +
                    `┃   Ini cuma screenshot palsu\n` +
                    `┃   JANGAN dipakai buat nipu!\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini hasilnya darling~ buat konten aja yaa 🥰\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        fs.unlinkSync(result.path)
        m.react('✅')
        
    } catch (err) {
        console.error('[FakeOvo] Error:', err)
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