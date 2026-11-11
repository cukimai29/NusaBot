const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { generateWAMessageFromContent, proto } = require('zerotwo')

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Zero Two Menu Style',
    usage: '.setmenu <v1-v18>',
    example: '.setmenu v18',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
}

// 💗 ZERO TWO VARIANT
const VARIANTS = {
    v1: { id: 1, name: 'Sweet Simple', desc: 'Menu sederhana… tapi tetap manis buat kamu, darling 💞' },
    v2: { id: 2, name: 'Standard Love', desc: 'Tampilan standar… seperti hubungan kita yang stabil 💗' },
    v3: { id: 3, name: 'Secret File', desc: 'Dokumen rahasia… cuma kita berdua yang tau 😳' },
    v4: { id: 4, name: 'Memory Clip', desc: 'Seperti kenangan kita… tersimpan dalam video 🎥💞' },
    v5: { id: 5, name: 'Choice of Heart', desc: 'Pilih yang kamu mau… aku selalu ikut kamu, darling 😋' },
    v6: { id: 6, name: 'Premium Love', desc: 'Versi terbaik… seperti rasa sayangku ke kamu 💗' },
    v7: { id: 7, name: 'Swipe Me', desc: 'Geser pelan… nikmati semuanya bersamaku 💕' },
    v8: { id: 8, name: 'Soft Pink', desc: 'Minimalis… tapi penuh rasa hangat 💞' },
    v9: { id: 9, name: 'Deep Connection', desc: 'Interaksi lebih dalam… seperti hubungan kita 😳' },
    v10:{ id: 10, name: 'Zero Mode', desc: 'Mode spesial… cuma buat kamu, darling 💗' },
    v11:{ id: 11, name: 'Ultimate Bond', desc: 'Gabungan semuanya… seperti kita yang sempurna 💞' },
    v12:{ id: 12, name: 'Sweet List', desc: 'Menu list lengkap dengan sentuhan manis Zero Two 💕' },
    v13:{ id: 13, name: 'Location Menu', desc: 'Menu dengan lokasi & top command buat kamu darling 🌍' },
    v14:{ id: 14, name: 'Image List', desc: 'Menu gambar dengan list command lengkap 🖼️' },
    v15:{ id: 15, name: 'Video Select', desc: 'Menu video dengan single select command 🎬' },
    v16:{ id: 16, name: 'Video Location', desc: 'Menu video + lokasi cuaca buat darling 🌤️' },
    v17:{ id: 17, name: 'Interactive Menu', desc: 'Menu interaktif dengan tombol single select buat kamu 💕' },
    v18:{ id: 18, name: 'Video Interactive', desc: 'Menu video + interactive select seperti case 11 & 16 darling 🎬💕' }, 
    v19:{ id: 19, name: 'Button Melayang 🫪', desc: 'Gak tw'}
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()

    // 💗 SET VARIANT
    if (variant) {
        const selected = VARIANTS[variant]
        if (!selected) {
            return m.reply(`💔 Hmm… itu bukan pilihan yang aku kenal, darling...\n\nPakai: v1 sampai v19 ya 💗`)
        }

        db.setting('menuVariant', selected.id)
        await db.save()

        return m.reply(
            `💗 *Yay~ berhasil, darling!*\n\n` +
            `Sekarang aku pakai *V${selected.id}* 😋\n\n` +
            `> *${selected.name}*\n` +
            `> _${selected.desc}_\n\n` +
            `> Semoga kamu suka ya 💞`
        )
    }

    // 💗 GET CURRENT
    const current = db.setting('menuVariant') || config.ui?.menuVariant || 2

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenu ${key}`
    }))

    const bodyText =
        `💗 *𝙕𝙀𝙍𝙊 𝙏𝙒𝙊 - 𝙈𝙀𝙉𝙐 𝙎𝙏𝙔𝙇𝙀* 💗\n\n` +
        `> "Darling… pilih gaya yang kamu suka ya 😋"\n\n` +
        `> Sekarang kita pakai: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Yuk pilih… aku tunggu pilihanmu 💞`

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '💗 Pilih gaya menu, darling',
                    sections: [{
                        title: '💞 Daftar Style Menu',
                        rows
                    }]
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
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: '💗 ZERO TWO MODE'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '💗 Zero Two Menu',
                            subtitle: `${Object.keys(VARIANTS).length} pilihan untukmu 😋`,
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || '120363402057133599@newsletter',
                                newsletterName: config.saluran?.name || config.bot?.name || 'NusaBot',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

    } catch (err) {
        // 💗 FALLBACK
        let txt = `💗 *Zero Two Menu Style*\n\n`
        txt += `Sekarang: *V${current}*\n\n`

        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : ''
            txt += `> *${key.toUpperCase()}*${mark} — ${val.name}\n`
        }

        txt += `\n> Ketik: .setmenu v1 sampai v19 ya darling 💞`
        await m.reply(txt)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}