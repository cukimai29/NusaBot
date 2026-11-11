const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const userCooldown = {}
const userSpamCount = {}

const STICKERS = [
    "https://files.catbox.moe/8bwxff.webp",
    "https://files.catbox.moe/3z3g1j.webp",
    "https://files.catbox.moe/6bm16x.webp",
    "https://files.catbox.moe/fv8tqt.webp"
]

const pluginConfig = {
    name: 'bot',
    alias: ['02', 'zerotwo', 'two'],
    category: 'main',
    description: '✨ NusaBot - Darling专用女友模式 ✨',
    usage: '.zerotwo',
    example: '.zerotwo',
    cooldown: 0,
    isEnabled: true
}

// ===== FUNGSI KIRIM AUDIO SEBAGAI VN (PTT) =====
async function sendAudioAsVn(sock, m, filename = 'zerotwo') {
    try {
        const mp3Path = path.join(process.cwd(), 'assets', 'audio', `${filename}.mp3`)
        const oggPath = path.join(process.cwd(), 'assets', 'audio', `${filename}.ogg`)

        if (!fs.existsSync(mp3Path)) {
            console.log('[Bot Audio] MP3 tidak ditemukan:', mp3Path)
            return
        }

        // Convert MP3 → OGG Opus kalau belum ada
        if (!fs.existsSync(oggPath)) {
            console.log('[Bot Audio] 🔄 Convert MP3 → OGG Opus...')
            try {
                execSync(
                    `ffmpeg -y -i "${mp3Path}" ` +
                    `-c:a libopus -b:a 128k -vbr on -compression_level 10 ` +
                    `-ar 48000 -ac 1 ` +
                    `-application voip ` +
                    `"${oggPath}"`,
                    { stdio: 'ignore', timeout: 120000 }
                )
                console.log('[Bot Audio] ✅ Convert selesai')
            } catch (convErr) {
                console.error('[Bot Audio] ❌ Gagal convert:', convErr.message)
                return
            }
        }

        const vnBuffer = fs.readFileSync(oggPath)
        if (!vnBuffer || vnBuffer.length < 100) {
            console.log('[Bot Audio] ⚠️ File audio kosong / invalid')
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

        console.log('[Bot Audio] ✅ VN (PTT) terkirim')

    } catch (err) {
        console.error('[Bot Audio] Error:', err.message)
    }
}

async function handler(m, { sock, config: botConfig }) {
    const sender = m.sender
    const now = Date.now()
    const COOLDOWN = 60000

    if (!userCooldown[sender] || (now - userCooldown[sender]) > COOLDOWN) {
        userSpamCount[sender] = 0
    }

    if (userCooldown[sender] && (now - userCooldown[sender]) < COOLDOWN) {
        userSpamCount[sender] = (userSpamCount[sender] || 0) + 1

        if (userSpamCount[sender] <= STICKERS.length) {
            await sock.sendMessage(m.chat, {
                sticker: { url: STICKERS[userSpamCount[sender] - 1] }
            }, { quoted: m })
            return
        }

        return m.reply(
            `╭━〔 😡💢 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗠𝗢𝗗𝗘 𝗡𝗚𝗔𝗠𝗨𝗞 💢😡 〕━⬣\n` +
            `┃\n` +
            `┃ HEY *${m.pushName}*!!! 🔥💢\n` +
            `┃\n` +
            `┃ Kamu spam aku terus 😠\n` +
            `┃ Aku bukan bot murahan, Darling!!\n` +
            `┃\n` +
            `┃ Jangan ganggu terus\n` +
            `┃ kalau gak penting 😤🤬\n` +
            `┃\n` +
            `┃ ───────────────\n` +
            `┃ ✦ Status : 🔴 Overload\n` +
            `┃ ✦ Mood   : 💢 VERY ANGRY\n` +
            `┃ ───────────────\n` +
            `┃\n` +
            `┃ Sekalian mau kena tanduk aku? 🦬💥\n` +
            `┃\n` +
            `╰━⬣`
        )
    }

    userCooldown[sender] = now
    userSpamCount[sender] = 0

    const name = m.pushName || 'Darling'
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot'

    const responses = [
        {
            title: '💗✨ 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗔𝗜 ✨💗',
            footer: `こんにちは *${name}*~ 🦋😋\n\nAku datang lagi nih buat kamu~\nAda yang bisa Zero Two bantu? 💕\n\nJangan sungkan ya, Darling 🥰\n\n✦ Status : 🟢 Online\n✦ Mood   : 😊 Happy\n\nDarling, kamu lagi ngapain? 👀💕`,
        },
        {
            title: '🦋💕 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗧𝗘𝗔𝗦𝗜𝗡𝗚 💕🦋',
            footer: `Ara ara *${name}*~ 😏💗\n\nKamu manggil aku lagi?\nHmm... jangan sering-sering ya~ 😳\n\n✦ Darling : 💘 ${name}\n✦ Mood    : 😏 Teasing\n\nKamu suka sama aku? Jawab dong~ 😝💕`,
        },
        {
            title: '🌸🦋 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 🦋🌸',
            footer: `Halo *${name}* 👋💕\n\nZero Two siap melayani Darling-nya~\nMau ngobrol santai? ☕\n\n✦ Status : 🟢 Active\n✦ Energy : 💯 100%\n\nAyo Darling, ngobrol sama aku~ 💬💕`,
        },
        {
            title: '💢😤 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗧𝗦𝗨𝗡𝗗𝗘𝗥𝗘 😤💢',
            footer: `*${name}*... kamu nggak ada kerjaan lain? 😐💢\n\nManggil aku terus...\nBukan berarti aku seneng, ya! 😳💕\n\n✦ Mood : 😤 Tsundere\n✦ Blushing: 🔴 100%\n\nD-Diam ah! Jangan liatin aku terus! 😳💢`,
        }
    ]

    const randomIndex = Math.floor(Math.random() * responses.length)
    const selected = responses[randomIndex]

    // Load gambar
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'respon-bot-zerotwo.jpg')
    let imageBuffer = null
    let mediaAttachment = null

    if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath)
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[Bot] Gagal upload gambar:', e.message)
        }
    }

    // ===== KIRIM PAKAI NATIVE FLOW =====
    const interactiveMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: selected.title,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: selected.footer
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `💕 ${botConfig.bot?.name || 'NusaBot'} • ${new Date().getFullYear()}`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        messageParamsJson: JSON.stringify({
                            bottom_sheet: {
                                in_thread_buttons_limit: 2,
                                divider_indices: [1, 2, 3, 4, 5, 999],
                                list_title: "🎀 Pilih Menu Darling 🎀",
                                button_title: "🌸 Klik Disini"
                            }
                        }),
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "💕 Menu",
                                    id: ".menu"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🌸 Allmenu",
                                    id: ".allmenu"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "👑 Owner",
                                    id: ".owner"
                                })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "💬 Chat Owner",
                                    url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`
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
                            serverMessageId: 127
                        }
                    }
                })
            }
        }
    }, { userJid: m.sender, quoted: m })

    await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })

    // ===== KIRIM AUDIO SEBAGAI VN (PTT) =====
    await sendAudioAsVn(sock, m, 'zerotwo')
}

module.exports = {
    config: pluginConfig,
    handler
}