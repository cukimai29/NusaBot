const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const pluginConfig = {
    name: 'script',
    alias: ['sc', 'sourcecode', 'source'],
    category: 'main',
    description: 'Dapatkan source code bot',
    usage: '.script',
    example: '.script',
    cooldown: 30,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botName = config.bot?.name || 'NusaBot'
        const botDeveloper = config.bot?.developer || 'RzkyADS'
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || botName
        const saluranUrl = config.saluran?.url || config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'
        const groupUrl = config.social?.whatsappGroup || 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'
        const ownerNumber = config.owner?.number?.[0] || ''

        let mediaAttachment = null

        // 🔥 FIX: Ambil gambar dari URL
        try {
            const thumbBuffer = await loadImage('zerotwo-allmenu.jpg')
            if (thumbBuffer) {
                mediaAttachment = await prepareWAMessageMedia(
                    { image: thumbBuffer },
                    { upload: sock.waUploadToServer }
                )
            }
        } catch (e) {
            console.log('[Script] Gagal upload gambar:', e.message)
        }

        const footerText = `╭━━━〔 📦 SOURCE CODE 〕━━━⬣\n` +
            `┃\n` +
            `┃ • Multi-device support\n` +
            `┃ • 500+ Commands\n` +
            `┃ • Anti-spam & Anti-link\n` +
            `┃ • Game & RPG System\n` +
            `┃ • Panel Management\n` +
            `┃ • Auto-update\n` +
            `┃\n` +
            `┣━━━〔 💰 HARGA 〕━━━⬣\n` +
            `┃ 💸 Rp 20.000\n` +
            `┃\n` +
            `┣━━━〔 🔗 LINK 〕━━━⬣\n` +
            `┃ 📢 Channel Resmi: ${saluranUrl}\n` +
            `┃ 👥 Grup Resmi: ${groupUrl}\n` +
            `┃\n` +
            `╰━━━⬣`

        const interactiveMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `${botName} - SOURCE CODE`,
                            hasMediaAttachment: !!mediaAttachment,
                            ...(mediaAttachment || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: `🛒 *${botName} Script*\n\n💰 Harga: *Rp 20.000*\n📦 500+ Commands\n⚡ Fast & Responsive\n\n© ${botDeveloper} ${new Date().getFullYear()}`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: footerText
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: '💎 Script Premium',
                                    url: `https://wa.me/${ownerNumber}`,
                                    copy_code: '💕 Darling 💕',
                                    expiration_time: Date.now() * 999
                                },
                                bottom_sheet: {
                                    in_thread_buttons_energi: 2,
                                    divider_indices: [1, 2, 999],
                                    list_title: '📦 Source Code Bot',
                                    button_title: '🛒 Beli Script'
                                }
                            }),
                            buttons: [
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '📢 Channel Resmi',
                                        url: saluranUrl,
                                        merchant_url: saluranUrl
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '👥 Grup Resmi',
                                        url: groupUrl,
                                        merchant_url: groupUrl
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💰 Beli Sekarang',
                                        id: `${m.prefix}owner`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '📋 Menu',
                                        id: `${m.prefix}menu`
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
                                serverMessageId: 128
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })

        await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })

    } catch (e) {
        console.log('[Script] Error:', e.message)
        m.reply('❌ Error saat kirim script!')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
