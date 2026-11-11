const config = require('../../config')
const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const axios = require('axios')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const imageAssets = require('../../assets/images/assets-img')

const pluginConfig = {
    name: 'mulaiabsen',
    alias: ['startabsen', 'bukaabsen', 'openabsen'],
    category: 'group',
    description: 'Mulai sesi absen Zero Two Style',
    usage: '.mulaiabsen [keterangan]',
    example: '.mulaiabsen Rapat Mingguan',
    isGroup: true,
    cooldown: 10,
    isEnabled: true,
    isAdmin: true
}

if (!global.absensi) global.absensi = {}

// ============================================
// 🔥 ASSET LOADER
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
            console.log(`[MulaiAbsen] ✅ ${name} dari URL`)
            return buf
        } catch (e) {
            console.error(`[MulaiAbsen] ❌ Gagal download ${name}:`, e.message)
        }
    }

    try {
        const localPath = path.join(process.cwd(), 'assets', 'images', name)
        if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath)
            imageCache.set(name, buf)
            return buf
        }
    } catch (e) {}

    return null
}

// ============================================
// 🔥 WEATHER (buat quoted)
// ============================================
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

async function handler(m, { sock }) {
    const chatId = m.chat

    // ❌ Kalau masih ada sesi
    if (global.absensi[chatId]) {
        return m.reply(
            `💔 *Masih ada sesi absen*\n\nGunakan:\n*.hapusabsen* / *.cekabsen*`
        )
    }

    const keterangan = m.text?.trim() || 'Absen Harian'

    // ✅ Buat sesi baru
    global.absensi[chatId] = {
        keterangan,
        createdBy: m.sender,
        createdAt: new Date().toISOString(),
        peserta: []
    }

    const now = moment().tz('Asia/Jakarta')
    const date = now.format('dddd, D MMMM YYYY')
    const time = now.format('HH:mm')

    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || 'NusaBot'
    const botName = config.bot?.name || 'NusaBot'
    const prefix = config.command?.prefix || '.'

    // 🔥 LOAD GAMBAR dari URL
    const imageBuffer = await loadImage('zerotwo2.jpg')

    // 🔥 Header media (image)
    let headerMedia = null
    if (imageBuffer) {
        try {
            headerMedia = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[MulaiAbsen] Gagal upload image:', e.message)
        }
    }

    // 🔥 Quoted cuaca
    let thumbnail = null
    if (imageBuffer) {
        try {
            const sharp = require('sharp')
            thumbnail = await sharp(imageBuffer).resize(300, 300).toBuffer()
        } catch (e) {
            thumbnail = imageBuffer
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

    // 🔥 Body & Footer
    const bodyText = `📋 *ABSEN DIMULAI*

✨ Keterangan: *${keterangan}*
📅 Tanggal: *${date}*
⏰ Waktu: *${time}*
👑 Dibuat: @${m.sender.split('@')[0]}
👥 Peserta: *0*`

    const footerText = `💗 *ZERO TWO* 💗

╭───────────────⬣
│ 💡 *COMMAND*
│ • ${prefix}absen
│ • ${prefix}cekabsen
│ • ${prefix}hapusabsen
╰───────────────⬣

> Darling, jangan lupa absen ya 💗`

    // 🔥 Interactive Message
    const interactiveMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `✨ ${botName} - ABSEN ✨`,
                        hasMediaAttachment: !!headerMedia,
                        ...(headerMedia || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: bodyText
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: footerText
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '✅ ᴀʙꜱᴇɴ ꜱᴇᴋᴀʀᴀɴɢ',
                                    id: `${prefix}absen`
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 ᴄᴇᴋ ᴘᴇꜱᴇʀᴛᴀ',
                                    id: `${prefix}cekabsen`
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🗑️ ʜᴀᴘᴜꜱ ꜱᴇꜱɪ',
                                    id: `${prefix}hapusabsen`
                                })
                            }
                        ]
                    }),
                    contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 3
                        }
                    }
                })
            }
        }
    }, { userJid: m.sender, quoted: qOrder })

    await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })
}

module.exports = {
    config: pluginConfig,
    handler
}