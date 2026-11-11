const fs = require('fs')
const path = require('path')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const pluginConfig = {
    name: "slot",
    alias: ["slots","gachaslot"],
    category: "game",
    description: "Game slot machine",
    usage: ".slot",
    cooldown: 3,
    isEnabled: true
}

const emojis = ["🍒","🍉","🍋","🍇","⭐","💎","7️⃣"]

async function handler(m, { sock, config: botConfig }) {
    const e1 = emojis[Math.floor(Math.random() * emojis.length)]
    const e2 = emojis[Math.floor(Math.random() * emojis.length)]
    const e3 = emojis[Math.floor(Math.random() * emojis.length)]

    let result = ""
    let title = ""
    let desc = ""

    if (e1 === e2 && e2 === e3) {
        result = "JACKPOT"
        title = "🎰 JACKPOT!!!"
        desc = "Kamu menang besar 🗿🔥"
    } else if (e1 === e2 || e2 === e3 || e1 === e3) {
        result = "WIN"
        title = "🎰 MENANG!"
        desc = "Lumayan hoki 😋"
    } else {
        result = "LOSE"
        title = "🎰 ZONK!"
        desc = "Coba lagi cuy 🗿"
    }

    // 🔥 FIX: Ambil gambar dari URL
    let mediaAttachment = null
    try {
        const imageBuffer = await loadImage('respon-bot-zerotwo.jpg')
        if (imageBuffer) {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            )
        }
    } catch (e) {
        console.log('[Slot] Gagal upload gambar:', e.message)
    }

    const interactiveMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: title,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: 
`╭━━━〔 🎰 SLOT MACHINE 〕━━━╮
│
│   ${e1} │ ${e2} │ ${e3}
│
│ 💬 *${desc}*
│
╰━━━━━━━━━━━━━━━━━━╯`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `🎰 Mau coba lagi? Klik tombol di bawah!`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: `🎰 ${result}`,
                                url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`,
                                copy_code: '🎰 SLOT',
                                expiration_time: Date.now() * 999
                            },
                            bottom_sheet: {
                                in_thread_buttons_energi: 2,
                                divider_indices: [1, 2, 999],
                                list_title: `🎰 Slot Machine`,
                                button_title: '🎰 Spin!'
                            }
                        }),
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🎰 Spin Lagi',
                                    id: '.slot'
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '💰 Cek Saldo',
                                    id: '.saldo'
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 Menu',
                                    id: '.menu'
                                })
                            }
                        ]
                    }),
                    contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: botConfig.saluran?.id || '120363402057133599@newsletter',
                            newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot',
                            serverMessageId: 143
                        }
                    }
                })
            }
        }
    }, { userJid: m.sender, quoted: m })

    await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })
}

module.exports = { 
    config: pluginConfig, 
    handler 
}