const fs = require('fs')
const path = require('path')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')
const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER

const pluginConfig = {
    name: 'work',
    alias: ['kerja', 'job'],
    category: 'rpg',
    description: 'Bekerja ala Zero Two 😈',
    usage: '.work',
    cooldown: 180,
    isEnabled: true
}

// 💼 JOB LIST
const jobs = [
    { name: '👨‍🌾 Petani', min: 1000, max: 3000 },
    { name: '🧹 Cleaning Service', min: 2000, max: 5000 },
    { name: '📦 Kurir', min: 3000, max: 7000 },
    { name: '👨‍🍳 Koki', min: 4000, max: 10000 },
    { name: '👨‍💻 Programmer', min: 8000, max: 20000 },
    { name: '👨‍⚕️ Dokter', min: 15000, max: 30000 },
    { name: '🎮 Game Tester', min: 5000, max: 12000 },
    { name: '🎨 Designer', min: 6000, max: 15000 },
    { name: '🎤 Penyanyi', min: 7000, max: 18000 },
    { name: '🚗 Driver', min: 3000, max: 8000 },
    { name: '📸 Fotografer', min: 6000, max: 14000 },
    { name: '🛠 Teknisi', min: 5000, max: 13000 },
    { name: '🏪 Penjual', min: 2000, max: 6000 },
    { name: '📚 Guru', min: 7000, max: 16000 },
    { name: '🧠 Hacker', min: 10000, max: 25000 },
    { name: '🎬 Editor Video', min: 8000, max: 20000 },
    { name: '📱 Content Creator', min: 9000, max: 22000 },
    { name: '🪖 Tentara', min: 7000, max: 17000 },
    { name: '🚀 Astronot', min: 20000, max: 50000 },
    { name: '💰 Trader', min: 10000, max: 30000 },
    { name: '🎰 bandar slot', min: 20000, max: 50000 } // 🔥 FIX: Typo petik
]

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)

    // 🛡️ Cek user RPG
    if (!user.rpg) user.rpg = {}
    user.rpg.stamina = user.rpg.stamina || 100

    const staminaCost = 10
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `╭━〔 ⚡ 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗧𝗔𝗠𝗜𝗡𝗔 ⚡ 〕━⬣\n` +
            `┃\n` +
            `┃ Darling *${m.pushName}*~ 💢\n` +
            `┃ Stamina kamu habis nih!\n` +
            `┃ Butuh ${staminaCost} stamina buat kerja.\n` +
            `┃\n` +
            `┃ Istirahat dulu ya~ 😘\n` +
            `╰━⬣`
        )
    }

    // 💪 Kurangi stamina
    user.rpg.stamina -= staminaCost

    // 🎲 Pilih kerjaan random
    const job = jobs[Math.floor(Math.random() * jobs.length)]
    const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min
    const expGain = Math.floor(salary / 10)

    // 📊 Update data user
    user.koin = (user.koin || 0) + salary
    await addExpWithLevelCheck(sock, m, db, user, expGain)
    db.save()

    const name = m.pushName || 'Darling'
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot'

    // 🖼️ LOAD GAMBAR PAKE prepareWAMessageMedia
    let mediaAttachment = null

    // 🔥 FIX: Ambil gambar dari URL
    try {
        const imageBuffer = await loadImage('respon-bot-zerotwo.jpg')
        if (imageBuffer) {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            )
        }
    } catch (e) {
        console.log('[Work] Gagal upload gambar:', e.message)
    }

    // 📝 BUAT INTERACTIVE MESSAGE PERTAMA (PROSES KERJA)
    const interactiveMsg1 = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `💼 ${job.name}`,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `💗 *Zero Two lagi merhatiin kamu...* 😈\n\n💭 *"Jangan lama ya... aku tunggu kamu~"*`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `✨ ${botConfig.bot?.name || 'NusaBot'} ✨\n© ${new Date().getFullYear()}`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: `💗 Zero Two Working 💗`,
                                url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`,
                                copy_code: '💕 Darling 💕',
                                expiration_time: Date.now() * 999
                            },
                            bottom_sheet: {
                                in_thread_buttons_energi: 2,
                                divider_indices: [1, 2, 999],
                                list_title: `💼 ${job.name}`,
                                button_title: '💪 Work!'
                            }
                        }),
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '⏳ Loading...',
                                    id: '.work'
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
                            serverMessageId: 143
                        }
                    }
                })
            }
        }
    }, { userJid: m.sender, quoted: m })

    await sock.relayMessage(m.chat, interactiveMsg1.message, { messageId: interactiveMsg1.key.id })

    // ⏳ Delay biar dramatis
    await new Promise(r => setTimeout(r, 2500))

    // 📝 BUAT INTERACTIVE MESSAGE KEDUA (HASIL)
    const interactiveMsg2 = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `💗 ZERO TWO RESULT 💗`,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `╭─〔 💗 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 💗 〕─⬣\n` +
                              `┃\n` +
                              `┃ 💼 Pekerjaan : *${job.name}*\n` +
                              `┃ 💵 Gaji      : +Rp ${salary.toLocaleString('id-ID')}\n` +
                              `┃ 🚀 Exp       : +${expGain}\n` +
                              `┃ ⚡ Stamina   : -${staminaCost} (sisa ${user.rpg.stamina})\n` +
                              `┃\n` +
                              `╰────────────⬣\n\n` +
                              `😈 *"Kerja bagus ya darling..."* 💕`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `💞 Mau kerja lagi? ketik .work`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: `💗 Zero Two Result 💗`,
                                url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`,
                                copy_code: '💕 Darling 💕',
                                expiration_time: Date.now() * 999
                            },
                            bottom_sheet: {
                                in_thread_buttons_energi: 2,
                                divider_indices: [1, 2, 999],
                                list_title: `💗 Result 💗`,
                                button_title: '😈 OK!'
                            }
                        }),
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '💪 Kerja Lagi',
                                    id: '.work'
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 Menu',
                                    id: '.menu'
                                })
                            },
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📢 Saluran',
                                    url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`,
                                    merchant_url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`
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
                            serverMessageId: 144
                        }
                    }
                })
            }
        }
    }, { userJid: m.sender, quoted: m })

    await sock.relayMessage(m.chat, interactiveMsg2.message, { messageId: interactiveMsg2.key.id })

    // 🎵 Kirim audio setelah interactive message (lokal)
    const audioPath = path.join(process.cwd(), 'assets', 'audio', 'zerotwo.mp3')
    if (fs.existsSync(audioPath)) {
        try {
            await sock.sendMessage(m.chat, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m })
        } catch (err) {
            console.log('[Work] Gagal kirim audio:', err.message)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}