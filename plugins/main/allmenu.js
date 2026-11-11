const config = require('../../config')
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter')
const { getCommandsByCategory, getCategories, getPlugin } = require('../../src/lib/plugins')
const { getCasesByCategory } = require('../../case/zerotwo')
const { getDatabase } = require('../../src/lib/database')

const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const axios = require('axios')
const sharp = require('sharp')
const { generateWAMessageFromContent } = require('zerotwo')
const { execSync } = require('child_process')

const videoAssets = require('../../assets/video/assets-vd')
const imageAssets = require('../../assets/images/assets-img')

const pluginConfig = {
    name: 'allmenu',
    alias: ['fullmenu', 'am', 'allcommand', 'semua'],
    category: 'main',
    description: 'Menampilkan semua command',
    usage: '.allmenu',
    cooldown: 5,
    isEnabled: true
}

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🌸', utility: '⚡', fun: '🎀', group: '💫',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🧠', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', random: '🎲', canvas: '🎨',
    premium: '💎', convert: '🔄', economy: '💰'
}

const zeroTwoMessages = [
    "Aku akan selalu ada untukmu, Darling",
    "Bersamamu, aku merasa kuat",
    "Aku percaya padamu",
    "Jangan pernah ragu, aku di sini"
]

const zeroTwoQuotesV2 = [
    "💕 Aku akan selalu ada untukmu, Darling 💕",
    "🌸 Bersamamu, aku merasa lebih kuat 🌸",
    "✨ Aku percaya padamu, lebih dari siapa pun ✨",
    "🎀 Jangan pernah ragu, aku di sisimu 🎀",
    "💗 Darling, kamu adalah alasan aku tersenyum 💗",
    "🌟 Setiap hari bersamamu adalah hadiah 🌟",
    "🍭 Kita partner selamanya, ingat itu 🍭",
    "💖 Aku sayang kamu, Darling~ 💖"
]

function getRandomZeroTwoMessage() {
    return zeroTwoMessages[Math.floor(Math.random() * zeroTwoMessages.length)]
}

function getRandomQuoteV2() {
    return zeroTwoQuotesV2[Math.floor(Math.random() * zeroTwoQuotesV2.length)]
}

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ',
        'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ',
        'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    }
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('')
}

function getCommandSymbols(cmd) {
    const plugin = getPlugin(cmd)
    if (!plugin || !plugin.config) return ''
    const s = []
    if (plugin.config.isOwner) s.push('Ⓞ')
    if (plugin.config.isPremium) s.push('ⓟ')
    if (plugin.config.limit) s.push('Ⓛ')
    if (plugin.config.isAdmin) s.push('Ⓐ')
    return s.length ? ' ' + s.join(' ') : ''
}

function getCommandSymbolsV2(cmd) {
    const plugin = getPlugin(cmd)
    if (!plugin || !plugin.config) return ''
    const s = []
    if (plugin.config.isOwner) s.push('👑')
    if (plugin.config.isPremium) s.push('💎')
    if (plugin.config.limit) s.push('🎫')
    if (plugin.config.isAdmin) s.push('⚜️')
    return s.length ? ' ' + s.join(' ') : ''
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
            console.log(`[AllMenu] ✅ ${name} dari URL`)
            return buf
        } catch (e) {
            console.error(`[AllMenu] ❌ Gagal download ${name}:`, e.message)
        }
    }

    // Fallback lokal
    try {
        const localPath = path.join(process.cwd(), 'assets', 'images', name)
        if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath)
            imageCache.set(name, buf)
            console.log(`[AllMenu] 📁 ${name} dari lokal`)
            return buf
        }
    } catch (e) {}

    console.error(`[AllMenu] ⚠️ ${name} tidak ditemukan`)
    return null
}

// ===== FUNGSI KIRIM AUDIO SEBAGAI VN (PTT) — MASIH LOKAL =====
async function sendAudioAsVn(sock, m) {
    try {
        const mp3Path = path.join(process.cwd(), 'assets', 'audio', 'zerotwo-allmenu.mp3')
        const oggPath = path.join(process.cwd(), 'assets', 'audio', 'zerotwo-allmenu.ogg')

        if (!fs.existsSync(mp3Path)) {
            console.log('[AllMenu Audio] MP3 tidak ditemukan:', mp3Path)
            return
        }

        if (!fs.existsSync(oggPath)) {
            console.log('[AllMenu Audio] 🔄 Convert MP3 → OGG Opus...')
            try {
                execSync(
                    `ffmpeg -y -i "${mp3Path}" ` +
                    `-c:a libopus -b:a 128k -vbr on -compression_level 10 ` +
                    `-ar 48000 -ac 1 ` +
                    `-application voip ` +
                    `"${oggPath}"`,
                    { stdio: 'ignore', timeout: 120000 }
                )
                console.log('[AllMenu Audio] ✅ Convert selesai')
            } catch (convErr) {
                console.error('[AllMenu Audio] ❌ Gagal convert:', convErr.message)
                return
            }
        }

        const vnBuffer = fs.readFileSync(oggPath)
        if (!vnBuffer || vnBuffer.length < 100) {
            console.log('[AllMenu Audio] ⚠️ File audio kosong / invalid')
            return
        }

        await sock.sendMessage(
            m.chat,
            {
                audio: vnBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            },
            { quoted: m.raw || m }
        )

        console.log('[AllMenu Audio] ✅ VN (PTT) terkirim')

    } catch (err) {
        console.error('[AllMenu Audio] Error:', err.message)
    }
}

// ===== V1 HANDLER =====
async function sendVersion1(m, sock, botConfig, uptime) {
    const prefix = botConfig.command?.prefix || '.'
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const casesByCategory = getCasesByCategory()
    const uptimeFormatted = formatUptime(uptime)
    const botName = botConfig.bot?.name || 'NusaBot'
    const developer = botConfig.bot?.developer || 'RzkyADS'
    const version = botConfig.bot?.version || '1.0.0'
    const footer = botConfig.settings?.footer || `© ${botName} 2026`

    // 🔥 Load image dari URL
    const imageBuffer = await loadImage('zerotwo.jpg')

    let caption = `╭───〔 𝗡𝗨𝗦𝗔𝗕𝗢𝗧 𝗠𝗘𝗡𝗨 〕───⬣\n│\n`
    caption += `│  ✨ *${getRandomZeroTwoMessage()}* ✨\n│\n`
    caption += `╰──────────────────⬣\n\n`

    caption += `╭───〔 📊 *ɪɴꜰᴏ ʙᴏᴛ* 〕───⬣\n`
    caption += `│  🤖 ɴᴀᴍᴀ: ${botName}\n`
    caption += `│  📦 ᴠᴇʀꜱɪ: ${version}\n`
    caption += `│  💗 ᴅᴇᴠ: ${developer}\n`
    caption += `│  ⏱ ᴜᴘᴛɪᴍᴇ: ${uptimeFormatted}\n`
    caption += `│  🎮 ᴍᴏᴅᴇ: ᴘᴜʙʟɪᴄ\n`
    caption += `╰──────────────────⬣\n\n`

    caption += `╭───〔 📌 *ᴋᴇᴛᴇʀᴀɴɢᴀɴ* 〕───⬣\n`
    caption += `│  Ⓞ ᴏᴡɴᴇʀ\n`
    caption += `│  ⓟ ᴘʀᴇᴍɪᴜᴍ\n`
    caption += `│  Ⓛ ʟɪᴍɪᴛ\n`
    caption += `│  Ⓐ ᴀᴅᴍɪɴ\n`
    caption += `╰──────────────────⬣\n\n`

    for (const category of categories) {
        if (category === 'owner' && !m.isOwner) continue

        const pluginCmds = commandsByCategory[category] || []
        const caseCmds = casesByCategory[category] || []
        const all = [...pluginCmds, ...caseCmds]

        if (!all.length) continue

        const emoji = CATEGORY_EMOJIS[category] || '📂'
        const name = toSmallCaps(category)

        caption += `╭───〔 ${emoji} *${name.toUpperCase()}* 〕───⬣\n`

        for (const cmd of all) {
            const sym = getCommandSymbols(cmd)
            caption += `│  ✦ ${prefix}${toSmallCaps(cmd)}${sym}\n`
        }

        caption += `╰──────────────────⬣\n\n`
    }

    caption += `© ${botName}\n`
    caption += `> 𝘔𝘢𝘥𝘦 𝘸𝘪𝘵𝘩 💗 𝘣𝘺 ${developer}\n`
    caption += `> ${moment().tz('Asia/Jakarta').format('YYYY')}`

    const saluranUrl = config.saluran?.url || config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'
    const groupUrl = config.social?.whatsappGroup || 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'

    try {
        if (imageBuffer) {
            await sock.sendMessage(m.chat, {
                productMessage: {
                    title: `${botName} - ALL MENU`,
                    description: `📋 Daftar lengkap command ${botName}`,
                    thumbnail: imageBuffer,
                    productId: 'ALLMENU002',
                    retailerId: botName,
                    url: saluranUrl,
                    body: caption,
                    footer: footer,
                    priceAmount1000: 0,
                    currencyCode: 'IDR',
                    buttons: [
                        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel Resmi', url: saluranUrl }) },
                        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '👥 Grup Resmi', url: groupUrl }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✨ Ping Bot ✨', id: `${prefix}ping` }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💕 Owner', id: `${prefix}owner` }) }
                    ]
                }
            }, { quoted: m })
        } else {
            await sock.sendMessage(m.chat, {
                text: caption,
                buttons: [
                    { buttonId: `${prefix}ping`, buttonText: { displayText: '✨ Ping' }, type: 1 },
                    { buttonId: `${prefix}owner`, buttonText: { displayText: '💕 Owner' }, type: 1 }
                ]
            }, { quoted: m })
        }

        await sendAudioAsVn(sock, m)

    } catch (err) {
        console.error('[AllMenu V1] Error:', err)
        await m.reply(caption)
        await sendAudioAsVn(sock, m)
    }
}

// ===== V2 HANDLER =====
async function sendVersion2(m, sock, botConfig, uptime) {
    const prefix = botConfig.command?.prefix || '.'
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const casesByCategory = getCasesByCategory()
    const uptimeFormatted = formatUptime(uptime)
    const botName = botConfig.bot?.name || 'NusaBot'
    const developer = botConfig.bot?.developer || 'RzkyADS'
    const version = botConfig.bot?.version || '1.0.0'

    // 🔥 Load thumbnail dari URL
    const thumbBuffer = await loadImage('zerotwo2.jpg')

    let caption = `╭─────────── ˚₊· 💗 ·₊˚ ─────────────╮\n`
    caption += `│            ✨ *${toSmallCaps(botName)}* ✨            │\n`
    caption += `│         “${getRandomQuoteV2()}”         │\n`
    caption += `╰─────────── ˚₊· 🎀 ·₊˚ ─────────────╯\n\n`

    caption += `╭──〔 💗 *ɪɴꜰᴏ ʙᴏᴛ* 〕───⬣\n`
    caption += `│  ✨ ɴᴀᴍᴀ      : *${botName}*\n`
    caption += `│  🎀 ᴠᴇʀꜱɪ     : *${version}*\n`
    caption += `│  💕 ᴅᴇᴠᴇʟᴏᴘᴇʀ : *${developer}*\n`
    caption += `│  ⏱️ ᴜᴘᴛɪᴍᴇ    : *${uptimeFormatted}*\n`
    caption += `│  🌸 ᴍᴏᴅᴇ      : *PUBLIC*\n`
    caption += `╰────────────────⬣\n\n`

    caption += `╭──〔 📌 *ᴋᴇᴛᴇʀᴀɴɢᴀɴ* 〕───⬣\n`
    caption += `│  👑 ᴏᴡɴᴇʀ ᴏɴʟʏ\n`
    caption += `│  💎 ᴘʀᴇᴍɪᴜᴍ\n`
    caption += `│  🎫 ᴜꜱᴇ ʟɪᴍɪᴛ\n`
    caption += `│  ⚜️ ᴀᴅᴍɪɴ ɢʀᴏᴜᴘ\n`
    caption += `╰────────────────⬣\n\n`

    for (const category of categories) {
        if (category === 'owner' && !m.isOwner) continue

        const pluginCmds = commandsByCategory[category] || []
        const caseCmds = casesByCategory[category] || []
        const all = [...pluginCmds, ...caseCmds]

        if (!all.length) continue

        const emoji = CATEGORY_EMOJIS[category] || '🎀'
        const name = toSmallCaps(category)

        caption += `╭──〔 ${emoji} *${name.toUpperCase()}* 〕───⬣\n`

        for (const cmd of all) {
            const sym = getCommandSymbolsV2(cmd)
            caption += `│  ✦ ${prefix}${toSmallCaps(cmd)}${sym}\n`
        }

        caption += `╰────────────────⬣\n\n`
    }

    caption += `╭─────────────── ˚₊· 💗 ·₊˚ ───────────────╮\n`
    caption += `│     *Terimakasih telah menggunakan ${botName}*     │\n`
    caption += `│        “Aku selalu bersamamu, Darling~”        │\n`
    caption += `╰─────────────── ˚₊· 🎀 ·₊˚ ───────────────╯\n`
    caption += `\n> 💕 *${botName}* © ${moment().tz('Asia/Jakarta').format('YYYY')}`

    const saluranUrl = config.saluran?.url || config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'

    try {
        const videoUrl = videoAssets['zerotwo-v16.mp4'] || videoAssets['zerotwo.mp4']
        let videoBuffer = null

        if (videoUrl) {
            try {
                const response = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000 })
                videoBuffer = Buffer.from(response.data)
                console.log('[AllMenu V2] Video downloaded from CDN')
            } catch (err) {
                console.error('[AllMenu V2] Gagal download video:', err.message)
            }
        }

        if (videoBuffer) {
            await sock.sendMessage(m.chat, {
                video: videoBuffer,
                caption: caption,
                gifPlayback: false,
                mimetype: 'video/mp4',
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `✨ ${botName} ✨`,
                        body: getRandomQuoteV2(),
                        mediaType: 1,
                        thumbnail: thumbBuffer,
                        sourceUrl: saluranUrl,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
        } else {
            await sock.sendMessage(m.chat, {
                text: caption,
                buttons: [
                    { buttonId: `${prefix}menu`, buttonText: { displayText: '🌸 Menu' }, type: 1 },
                    { buttonId: `${prefix}menucat`, buttonText: { displayText: '📋 Menu Cat' }, type: 1 },
                    { buttonId: `${prefix}owner`, buttonText: { displayText: '💕 Owner' }, type: 1 }
                ]
            }, { quoted: m })
        }

        await sendAudioAsVn(sock, m)

    } catch (err) {
        console.error('[AllMenu V2] Error:', err)
        await m.reply(caption)
        await sendAudioAsVn(sock, m)
    }
}

// ===== V3 HANDLER =====
async function sendVersion3(m, sock, botConfig, uptime) {
    const prefix = botConfig.command?.prefix || '.'
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const casesByCategory = getCasesByCategory()
    const uptimeFormatted = formatUptime(uptime)
    const botName = botConfig.bot?.name || 'NusaBot'
    const developer = botConfig.bot?.developer || 'RzkyADS'
    const version = botConfig.bot?.version || '1.0.0'

    const allCommands = []
    for (const category of categories) {
        if (category === 'owner' && !m.isOwner) continue

        const pluginCmds = commandsByCategory[category] || []
        const caseCmds = casesByCategory[category] || []
        const all = [...pluginCmds, ...caseCmds]

        for (const cmd of all) {
            allCommands.push(cmd)
        }
    }

    const contentText = `╭───〔 💗 *${toSmallCaps(botName)}* 〕───⬣\n` +
        `│  ✨ ${getRandomQuoteV2()}\n` +
        `│\n` +
        `│  🤖 ɴᴀᴍᴀ   : *${botName}*\n` +
        `│  🎀 ᴠᴇʀꜱɪ  : *${version}*\n` +
        `│  💕 ᴅᴇᴠ    : *${developer}*\n` +
        `│  ⏱️ ᴜᴘᴛɪᴍᴇ : *${uptimeFormatted}*\n` +
        `╰──────────────────⬣\n` +
        `aja sendiri 🗿`

    const footerText = `📋 Daftar Command\n\n` +
        `${allCommands.map(cmd => `✦ ${prefix}${cmd}`).join('\n')}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `🌸 Total : ${allCommands.length} Commands`

    // 🔥 Load thumbnail dari URL
    let cachedImage = await loadImage('zerotwo3.jpg')

    // Fallback ke zerotwo.jpg kalau zerotwo3.jpg gak ada
    if (!cachedImage) {
        cachedImage = await loadImage('zerotwo.jpg')
    }

    let thumbV5 = null
    if (cachedImage) {
        try {
            const meta = await sharp(cachedImage).metadata()
            thumbV5 = await sharp(cachedImage)
                .resize(300, Math.round((meta.height / meta.width) * 300))
                .jpeg({ quality: 85 })
                .toBuffer()
        } catch (e) {
            console.error('[AllMenu V3] Resize thumbnail gagal:', e.message)
            thumbV5 = cachedImage
        }
    }

    try {
        const content = {
            buttonsMessage: {
                buttons: [
                    { buttonId: `${prefix}owner`, buttonText: { displayText: `💜 Owner ${config.owner?.name || 'Owner'}` }, type: 1 },
                    { buttonId: `${prefix}menu`, buttonText: { displayText: '💕 Kembali Menu Utama' }, type: 1 }
                ],
                locationMessage: {
                    jpegThumbnail: thumbV5 || undefined,
                    name: `${CATEGORY_EMOJIS.main || '💖'} ${botName.toUpperCase()}`,
                    address: `${allCommands.length} Commands`
                },
                contentText: contentText,
                footerText: footerText,
                headerType: 6
            }
        }

        const msg = generateWAMessageFromContent(m.chat, content, {
            userJid: sock.user.jid || sock.user.id
        })

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

        await sendAudioAsVn(sock, m)

    } catch (err) {
        console.error('[AllMenu V3] Error:', err)
        await m.reply(`${contentText}\n\n${footerText}`)
        await sendAudioAsVn(sock, m)
    }
}

// ===== MAIN HANDLER =====
async function handler(m, { sock, config: botConfig, uptime }) {
    const db = getDatabase()

    if (!db.db.data.settings) db.db.data.settings = {}
    const currentVersion = db.db.data.settings.allmenuVersion || 1

    if (currentVersion === 3) {
        await sendVersion3(m, sock, botConfig, uptime)
    } else if (currentVersion === 2) {
        await sendVersion2(m, sock, botConfig, uptime)
    } else {
        await sendVersion1(m, sock, botConfig, uptime)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
