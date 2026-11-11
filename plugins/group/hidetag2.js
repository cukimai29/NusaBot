const config = require('../../config')
const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'hidetag2',
    alias: ['h2', 'ht2'],
    category: 'group',
    description: 'Hidetag dengan fakeQuoted styling',
    usage: '.h2 <text> atau reply pesan',
    example: '.h2 Pengumuman penting!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {

    const text = m.fullArgs?.trim()

    if (!text && !m.quoted) {
        return m.reply(
            `📢 *HIDETAG 2*\n\n` +
            `• \`${m.prefix}h2 <text>\`\n` +
            `• Reply pesan + \`${m.prefix}h2\``
        )
    }

    try {

        m.react('📢')

        const groupMeta = await sock.groupMetadata(m.chat)
        const users = getParticipantJids(groupMeta.participants || [])

        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast'
            },
            message: {
                conversation: config.bot?.name || 'zerotwo MD'
            }
        }

        if (m.quoted) {

            let q = m.quoted
            let msg = q.message || {}

            // unwrap message (fix media kosong)
            if (msg?.ephemeralMessage) msg = msg.ephemeralMessage.message
            if (msg?.viewOnceMessage) msg = msg.viewOnceMessage.message
            if (msg?.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message

            const type = Object.keys(msg)[0]

            if (type === 'imageMessage') {

                const media = await q.download()

                return sock.sendMessage(
                    m.chat,
                    {
                        image: media,
                        caption: msg.imageMessage?.caption || '',
                        mentions: users
                    },
                    { quoted: fakeQuoted }
                )
            }

            if (type === 'videoMessage') {

                const media = await q.download()

                return sock.sendMessage(
                    m.chat,
                    {
                        video: media,
                        caption: msg.videoMessage?.caption || '',
                        mentions: users
                    },
                    { quoted: fakeQuoted }
                )
            }

            if (type === 'stickerMessage') {

                const media = await q.download()

                return sock.sendMessage(
                    m.chat,
                    {
                        sticker: media,
                        mentions: users
                    },
                    { quoted: fakeQuoted }
                )
            }

            if (type === 'audioMessage') {

                const media = await q.download()

                return sock.sendMessage(
                    m.chat,
                    {
                        audio: media,
                        mimetype: msg.audioMessage?.mimetype,
                        ptt: msg.audioMessage?.ptt || false,
                        mentions: users
                    },
                    { quoted: fakeQuoted }
                )
            }

            if (type === 'documentMessage') {

                const media = await q.download()

                return sock.sendMessage(
                    m.chat,
                    {
                        document: media,
                        fileName: msg.documentMessage?.fileName || 'file',
                        mimetype: msg.documentMessage?.mimetype,
                        mentions: users
                    },
                    { quoted: fakeQuoted }
                )
            }

            const quotedText =
                q.text ||
                msg.conversation ||
                msg.extendedTextMessage?.text ||
                ''

            return sock.sendMessage(
                m.chat,
                {
                    text: quotedText,
                    mentions: users
                },
                { quoted: fakeQuoted }
            )
        }

        // ===== TEXT MODE =====

        await sock.sendMessage(
            m.chat,
            {
                text,
                mentions: users
            },
            { quoted: fakeQuoted }
        )

        m.react('✅')

    } catch (err) {

        m.react('❌')

        m.reply(
            `❌ *ERROR*\n\n${err.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}