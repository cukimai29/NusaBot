const config = {
    name: 'ezremove',
    alias: ['removewm', 'hapuswatermark', 'ezrm'],
    category: 'tools',
    description: 'Hapus watermark dari gambar',
    usage: '.ezremove (reply gambar)',
    example: '.ezremove',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

const axios = require("axios")
const fs = require("fs")
const path = require("path")

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"
const ORIGIN = "https://ezremove.ai"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getMime(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    if (ext === ".png") return "image/png"
    if (ext === ".webp") return "image/webp"
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
    return "application/octet-stream"
}

async function removeWatermark(filePath) {
    const filename = path.basename(filePath)
    const buffer = fs.readFileSync(filePath)
    const mime = getMime(filePath)
    const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`

    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image_file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`),
        buffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ])

    const create = await axios.post(
        "https://api.ezremove.ai/api/ez-remove/watermark-remove/create-job",
        body,
        {
            headers: {
                "User-Agent": UA,
                "Accept": "application/json, text/plain, */*",
                "Origin": ORIGIN,
                "Referer": `${ORIGIN}/`,
                "product-serial": `sr-${Date.now()}`,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": body.length
            },
            timeout: 30000,
            validateStatus: () => true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        }
    )

    if (create.status < 200 || create.status >= 300) {
        throw { code: create.status }
    }

    const jobId = create.data?.result?.job_id
    if (!jobId) {
        throw { code: create.status }
    }

    for (let i = 0; i < 30; i++) {
        await sleep(2000)

        const check = await axios.get(
            `https://api.ezremove.ai/api/ez-remove/watermark-remove/get-job/${jobId}`,
            {
                headers: {
                    "User-Agent": UA,
                    "Accept": "application/json, text/plain, */*",
                    "Origin": ORIGIN,
                    "Referer": `${ORIGIN}/`,
                    "product-serial": `sr-${Date.now()}`
                },
                timeout: 15000,
                validateStatus: () => true
            }
        )

        if (check.status < 200 || check.status >= 300) {
            throw { code: check.status }
        }

        const resultUrl = check.data?.result?.output?.[0]

        if (check.data?.code === 100000 && resultUrl) {
            return resultUrl
        }

        if (check.data?.code !== 300001) {
            throw { code: check.status }
        }
    }

    throw { code: 202 }
}

async function handler(m, { sock }) {
    try {
        if (!m.quoted || !m.quoted.message?.imageMessage) {
            return m.reply(`🖼️ *ᴇᴢʀᴇᴍᴏᴠᴇ*\n\n> Reply gambar yang ingin dihapus watermarknya!\n\n> Contoh: reply gambar lalu ketik .ezremove`)
        }

        await m.reply('⏳ *Menghapus watermark...*\n> Mohon tunggu sekitar 30 detik')

        const media = await m.quoted.download()
        const tempDir = path.join(__dirname, '../../temp')
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempPath = path.join(tempDir, `ezremove_${Date.now()}.jpg`)
        fs.writeFileSync(tempPath, media)

        const resultUrl = await removeWatermark(tempPath)

        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }

        if (resultUrl) {
            await sock.sendMessage(m.chat, {
                image: { url: resultUrl },
                caption: `✅ *ᴡᴀᴛᴇʀᴍᴀʀᴋ ʀᴇᴍᴏᴠᴇᴅ!*\n\n🔗 URL: ${resultUrl}`
            })
        } else {
            await m.reply(`❌ *GAGAL MENGHAPUS WATERMARK*\n\n> Coba lagi nanti atau gunakan gambar lain.`)
        }

    } catch (error) {
        console.error('EzRemove Error:', error)
        
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath)
        }
        
        await m.reply(`❌ *ERROR*\n\n${error.message}`)
    }
}

let tempPath
module.exports = {
    config,
    handler
}