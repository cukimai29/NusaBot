const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'buttonv3',
    alias: ['bv3'],
    category: 'main',
    description: 'Test button V3 - Native Flow',
    usage: '.bv3',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot';
    
    // Upload gambar (opsional)
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'zerotwo-v5.jpg');
    let mediaAttachment = null;
    
    if (fs.existsSync(imagePath)) {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            );
        } catch (e) {
            console.log('[Button V3] Gagal upload gambar:', e.message);
        }
    }

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    // HEADER (opsional, bisa pake gambar)
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `💕 NusaBot`,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    // BODY = Caption Utama
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di NusaBot!

📋 Ini adalah menu utama
╭━━〔 📊 INFO 〕━━⬣
┃ 👤 Nama: ${m.pushName}
┃ 🎭 Role: ${m.isOwner ? 'Owner' : 'User'}
╰━━━━━━━━━━⬣

✨ Pilih menu di bawah`
                    }),
                    // FOOTER = Tempat tombol "melayang"
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
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

module.exports = {
    config: pluginConfig,
    handler
}