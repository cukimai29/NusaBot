const { generateWAMessageFromContent, proto } = require('zerotwo');

const pluginConfig = {
    name: 'float2',
    alias: ['f2'],
    category: 'main',
    description: 'Test floating button V2 - Native Flow',
    usage: '.f2',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot';

    // Kirim caption dulu
    await sock.sendMessage(m.chat, {
        text: `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di NusaBot!

📋 Ini adalah menu utama
╭━━〔 📊 INFO 〕━━⬣
┃ 👤 Nama: ${m.pushName}
┃ 🎭 Role: ${m.isOwner ? 'Owner' : 'User'}
╰━━━━━━━━━━⬣

✨ Silahkan pilih menu di bawah`
    }, { quoted: m });

    // Kirim tombol pake Native Flow (paling stabil)
    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: {
                        text: `⚡ *Pilih aksi di bawah:*`
                    },
                    footer: {
                        text: `💕 ${botConfig.bot?.name || 'NusaBot'} • ${new Date().getFullYear()}`
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🌸 Menu",
                                    id: ".menu"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "💕 Owner",
                                    id: ".owner"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📜 Script",
                                    id: ".sc"
                                })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🌐 Saluran",
                                    url: "https://example.com"
                                })
                            }
                        ]
                    },
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
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

module.exports = {
    config: pluginConfig,
    handler
}