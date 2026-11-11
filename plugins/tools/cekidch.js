const config = require('../../config')
const { generateWAMessageFromContent, proto } = require('zerotwo')

const pluginConfig = {
    name: 'cekidch',
    alias: ['idch', 'channelid'],
    category: 'tools',
    description: 'Cek ID channel ala Zero Two Premium',
    usage: '.cekidch <link>',
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(`💔 *Zero Two kecewa...*\n\nKamu lupa kasih link nya?\n\n> Contoh:\n${m.prefix}cekidch https://whatsapp.com/channel/xxxxx\n\nJangan bikin aku nunggu, darling... 😒`)
    }

    if (!text.includes('https://whatsapp.com/channel/')) {
        return m.reply(`😒 *Hmm...*\n\nItu bukan link channel yang valid loh...\nJangan coba bohong sama aku ya, darling.`)
    }

    m.react('💖')

    try {
        const inviteCode = text.split('https://whatsapp.com/channel/')[1]?.split(/[\s?]/)[0]

        if (!inviteCode) {
            m.react('❌')
            return m.reply(`💔 *Zero Two Error*\n\nAku gagal baca link nya...\nKamu serius gak sih? 😏`)
        }

        const metadata = await sock.newsletterMetadata('invite', inviteCode)

        if (!metadata?.id) {
            m.react('❌')
            return m.reply(`💔 *Target tidak ditemukan...*\n\nChannel nya hilang atau kamu salah kasih link 😒`)
        }

        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

        const infoText = `
💖 *ZERO TWO CHANNEL SCANNER*

╭───〔 🧬 TARGET LOCKED 〕───⬣
│ 👤 Nama Channel :
│    ${metadata.name || 'Unknown'}
│
│ 🆔 Channel ID :
│    ${metadata.id}
│
│ 👥 Subscriber :
│    ${metadata.subscribers || 0}
╰──────────────⬣

Hmm... menarik sekali 😏  
Aku sudah menemukan target nya...

Jangan kabur ya, darling...  
Aku selalu mengawasi kamu 💖
        `.trim()

        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copy ID',
                    copy_code: metadata.id
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📺 Buka Channel',
                    url: text
                })
            }
        ]

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: infoText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `💖 Zero Two System • ${config.bot?.name || 'AI'}`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 777
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        m.react('🔥')

    } catch (error) {
        m.react('❌')
        m.reply(`💔 *SYSTEM FAILURE*\n\nAku gagal memproses target...\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}