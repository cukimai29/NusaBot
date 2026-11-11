const config = require('../../config')
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins')
const fs = require('fs')
const path = require('path')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')
const axios = require('axios')
const sharp = require('sharp')
const videoAssets = require('../../assets/video/assets-vd')
const imageAssets = require('../../assets/images/assets-img')

const pluginConfig = {
    name: 'menucat',
    alias: ['mc', 'category', 'cat'],
    category: 'main',
    description: 'Menampilkan commands dalam kategori tertentu',
    usage: '.menucat <kategori>',
    example: '.menucat tools',
    isEnabled: true
}

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🌸', utility: '⚡', fun: '🎀', group: '💫',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️', ai: '🧠',
    game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️', premium: '💎',
    convert: '🔄', economy: '💰', canvas: '🎨'
}

const zeroTwoMessages = [
    "Aku akan selalu ada untukmu, Darling",
    "Bersamamu, aku merasa kuat",
    "Aku percaya padamu",
    "Jangan pernah ragu, aku di sini"
]

function getRandomZeroTwoMessage() {
    return zeroTwoMessages[Math.floor(Math.random() * zeroTwoMessages.length)]
}

function toSmallCaps(text) {
    const smallCaps = {
        'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ',
        'i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ',
        'q':'ǫ','r':'ʀ','s':'ꜱ','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x',
        'y':'ʏ','z':'ᴢ'
    }
    return text.toLowerCase().split('').map(v => smallCaps[v] || v).join('')
}

const weatherCode = {
    0: "☀️ Cerah", 1: "🌤️ Cerah Berawan", 2: "⛅ Berawan",
    3: "☁️ Mendung", 45: "🌫️ Berkabut", 48: "🌫️ Kabut Tebal",
    51: "🌦️ Gerimis", 61: "🌧️ Hujan Ringan", 63: "🌧️ Hujan",
    65: "⛈️ Hujan Lebat", 80: "🌦️ Hujan Lokal", 95: "⛈️ Badai Petir"
}

async function weatherMenu(city = "Jakarta") {
    try {
        const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)
        const loc = geo.data.results?.[0]
        if (!loc) return "Cuaca tidak tersedia"
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`)
        const current = res.data.current
        const kondisi = weatherCode[current.weather_code] || "🌍 Tidak diketahui"
        return `${kondisi} | 🌡️ ${Math.round(current.temperature_2m)}°C\n📍 ${loc.name}`
    } catch {
        return "Cuaca tidak tersedia"
    }
}

// ============================================
// 🔥 ASSET LOADER (JPG dari URL + fallback lokal)
// ============================================
const imageCache = new Map()

async function loadImage(name) {
    if (imageCache.has(name)) return imageCache.get(name)

    const url = imageAssets[name]
    if (url && url.startsWith('http')) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            const buf = Buffer.from(res.data)
            imageCache.set(name, buf)
            console.log(`[MenuCat] ✅ ${name} dari URL`)
            return buf
        } catch (e) {
            console.error(`[MenuCat] ❌ Gagal download ${name}:`, e.message)
        }
    }

    // Fallback lokal
    try {
        const localPath = path.join(process.cwd(), 'assets', 'images', name)
        if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath)
            imageCache.set(name, buf)
            console.log(`[MenuCat] 📁 ${name} dari lokal`)
            return buf
        }
    } catch (e) {}

    console.error(`[MenuCat] ⚠️ ${name} tidak ditemukan`)
    return null
}

// ===== CACHE =====
let videoBuffer = null
let videoMedia = null
let thumbBuffer = null
let assetsLoaded = false

async function loadAllAssets() {
    if (assetsLoaded) return

    try {
        // Load video dari assets-vd.js
        const videoUrl = videoAssets["zerotwo.mp4"]
        if (videoUrl) {
            try {
                const response = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                })
                videoBuffer = Buffer.from(response.data)
                console.log('[MenuCat] ✅ Video loaded from CDN')
            } catch (e) {
                console.log('[MenuCat] ❌ Gagal load video:', e.message)
            }
        } else {
            console.log('[MenuCat] ⚠️ Video "zerotwo.mp4" tidak ditemukan di assets-vd.js')
        }

        // 🔥 Load thumbnail dari URL (zerotwo2.jpg)
        thumbBuffer = await loadImage('zerotwo2.jpg')

        // Cuma set assetsLoaded kalau minimal video atau thumbnail berhasil
        if (videoBuffer || thumbBuffer) {
            assetsLoaded = true
        }
    } catch (e) {
        console.log('[MenuCat] ❌ Gagal load assets:', e.message)
    }
}

// ===== KIRIM AUDIO MP3 =====
async function sendMenuAudio(sock, m) {
    try {
        const audioPath = path.join(process.cwd(), 'assets', 'audio', 'zerotwo-menucat.mp3')

        if (!fs.existsSync(audioPath)) {
            console.log('[MenuCat] ⚠️ Audio file tidak ditemukan:', audioPath)
            return
        }

        const audioBuffer = fs.readFileSync(audioPath)

        if (!audioBuffer || audioBuffer.length < 100) {
            console.log('[MenuCat] ⚠️ Audio file kosong / invalid')
            return
        }

        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true,
            fileName: 'zerotwo-menucat.mp3'
        }, { quoted: m.raw || m })

        console.log('[MenuCat] ✅ Audio MP3 terkirim')

    } catch (e) {
        console.log('[MenuCat] ❌ Gagal kirim audio:', e.message)
    }
}

async function handler(m, { sock }) {
    const prefix = config.command?.prefix || '.'
    const args = m.args || []
    const categoryArg = args[0]?.toLowerCase()
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const { getCasesByCategory } = require('../../case/zerotwo')
    const casesByCategory = getCasesByCategory()
    const botName = config.bot?.name || 'NusaBot'
    const botDeveloper = config.bot?.developer || 'RzkyADS'
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || botName
    const saluranUrl = config.saluran?.url || config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'
    const groupUrl = config.social?.whatsappGroup || 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'

    // Load assets (dijalankan sekali aja)
    await loadAllAssets()

    // Upload video ke WA (sekali aja)
    if (videoBuffer && !videoMedia) {
        try {
            videoMedia = await prepareWAMessageMedia(
                { video: videoBuffer, gifPlayback: true },
                { upload: sock.waUploadToServer }
            )
            console.log('[MenuCat] ✅ Video uploaded to WA')
        } catch (e) {
            console.log('[MenuCat] ❌ Gagal upload video:', e.message)
        }
    }

    let thumbnail = null
    if (thumbBuffer) {
        try {
            thumbnail = await sharp(thumbBuffer).resize(300, 300).toBuffer()
        } catch (e) {
            thumbnail = thumbBuffer
        }
    }

    const qOrder = {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: m.sender
        },
        message: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: await weatherMenu(),
                jpegThumbnail: thumbnail
            }
        }
    }

    // ===== LIST CATEGORY =====
    if (!categoryArg) {
        const allCats = [...new Set([...categories, ...Object.keys(casesByCategory)])].sort()

        let categoryList = ''
        for (const cat of allCats) {
            if (cat === 'owner' && !m.isOwner) continue
            const emoji = CATEGORY_EMOJIS[cat] || '🎀'
            const total = (commandsByCategory[cat]?.length || 0) + (casesByCategory[cat]?.length || 0)
            if (total < 1) continue
            categoryList += `${emoji} *${toSmallCaps(cat)}* — ${total}\n`
        }

        const footerText = `💕 *${botName}* 💕\n\n"${getRandomZeroTwoMessage()}"\n\n╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗠𝗘𝗡𝗨𝗖𝗔𝗧 〕───⬣\n│\n${categoryList}│\n│ ✦ *Cara Pakai*\n│\n│  𖦹 ${prefix}menucat tools\n│  𖦹 ${prefix}menucat ai\n│  𖦹 ${prefix}menucat download\n│\n╰──────────────────⬣`

        const headerData = videoMedia
            ? { hasMediaAttachment: true, videoMessage: videoMedia.videoMessage }
            : { hasMediaAttachment: false }

        const interactiveMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        header: {
                            title: `${botName} - MENU CATEGORY`,
                            subtitle: "Pilih kategori yang kamu mau, Darling~",
                            ...headerData
                        },
                        body: { text: `✨ *${botName}* ✨\n© ${botDeveloper} ${new Date().getFullYear()}` },
                        footer: { text: footerText },
                        nativeFlowMessage: {
                            buttons: [
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel Resmi', url: saluranUrl, merchant_url: saluranUrl }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '👥 Grup Resmi', url: groupUrl, merchant_url: groupUrl }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✨ All Menu ✨', id: `${prefix}allmenu` }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💕 Ping Bot', id: `${prefix}ping` }) }
                            ]
                        },
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 }
                        }
                    }
                }
            }
        }, { userJid: m.sender, quoted: qOrder })

        await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })

        // ===== KIRIM AUDIO MP3 =====
        await sendMenuAudio(sock, m)
        return
    }

    // ===== CATEGORY DETAIL =====
    const allCategories = [...new Set([...categories, ...Object.keys(casesByCategory)])]
    const matchedCat = allCategories.find(v => v.toLowerCase() === categoryArg)

    if (!matchedCat) {
        return m.reply(`╭───〔 𝗘𝗥𝗥𝗢𝗥 〕───⬣\n│\n│ ❌ *ᴋᴀᴛᴇɢᴏʀɪ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n│\n│  > "${categoryArg}" gak ada.\n│  > Ketik .menucat buat liat kategori.\n│\n╰──────────────────⬣`)
    }

    const pluginCommands = commandsByCategory[matchedCat] || []
    const caseCommands = casesByCategory[matchedCat] || []
    const allCommands = [...pluginCommands, ...caseCommands]

    let commandList = ''
    for (const cmd of allCommands) {
        commandList += `│  ✦ ${prefix}${toSmallCaps(cmd)}\n`
    }

    const categoryFooter = `💕 *${botName}* 💕\n\n"${getRandomZeroTwoMessage()}"\n\n╭───〔 ${CATEGORY_EMOJIS[matchedCat] || '🎀'} ${toSmallCaps(matchedCat).toUpperCase()} 〕───⬣\n│\n${commandList}│\n│ 📊 *ᴛᴏᴛᴀʟ*: ${allCommands.length} ᴄᴏᴍᴍᴀɴᴅ\n│\n╰──────────────────⬣`

    const headerData = videoMedia
        ? { hasMediaAttachment: true, videoMessage: videoMedia.videoMessage }
        : { hasMediaAttachment: false }

    const detailInteractiveMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: {
                    header: {
                        title: `${botName} - ${matchedCat.toUpperCase()}`,
                        subtitle: `📋 ${allCommands.length} commands`,
                        ...headerData
                    },
                    body: { text: `✨ *${botName}* ✨\n📋 Kategori: ${matchedCat}\n© ${botDeveloper}` },
                    footer: { text: categoryFooter },
                    nativeFlowMessage: {
                        buttons: [
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel Resmi', url: saluranUrl, merchant_url: saluranUrl }) },
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '👥 Grup Resmi', url: groupUrl, merchant_url: groupUrl }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✨ Kembali ✨', id: `${prefix}menucat` }) }
                        ]
                    },
                    contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 }
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: qOrder })

    await sock.relayMessage(m.chat, detailInteractiveMsg.message, { messageId: detailInteractiveMsg.key.id })

    // ===== KIRIM AUDIO MP3 =====
    await sendMenuAudio(sock, m)
}

module.exports = {
    config: pluginConfig,
    handler
}
