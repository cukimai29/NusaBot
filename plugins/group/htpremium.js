const config = require('../../config')

const pluginConfig = {
    name: 'htpremium',
    alias: ['hidetagpremium', 'htprem'],
    category: 'group',
    description: 'Hidetag dengan support reply pesan (teks/media)',
    usage: '.htprem [pesan] atau reply pesan',
    example: '.htprem atau reply pesan lalu .htprem',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        // ===== AMBIL PARTICIPANTS =====
        const groupMeta = m.groupMetadata || await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        
        // ===== BUAT MENTIONS =====
        const mentions = participants.map(p => p.id)
        
        const quoted = m.quoted
        const text = m.text || ''
        const [cmd, msgText] = text.includes('|') ? text.split('|') : [text, '']
        
        // ===== JIKA REPLY =====
        if (quoted) {
            const qMsg = quoted.message || {}
            const type = Object.keys(qMsg)[0]
            
            // ===== IMAGE =====
            if (type === 'imageMessage') {
                const media = await quoted.download()
                const caption = qMsg.imageMessage?.caption || msgText || ''
                return sock.sendMessage(m.chat, {
                    image: media,
                    caption: caption,
                    mentions: mentions
                })
            }
            
            // ===== VIDEO =====
            if (type === 'videoMessage') {
                const media = await quoted.download()
                const caption = qMsg.videoMessage?.caption || msgText || ''
                return sock.sendMessage(m.chat, {
                    video: media,
                    caption: caption,
                    mentions: mentions
                })
            }
            
            // ===== STICKER =====
            if (type === 'stickerMessage') {
                const media = await quoted.download()
                await sock.sendMessage(m.chat, {
                    sticker: media,
                    mentions: mentions
                })
                if (msgText) {
                    await sock.sendMessage(m.chat, {
                        text: msgText,
                        mentions: mentions
                    })
                }
                return
            }
            
            // ===== AUDIO =====
            if (type === 'audioMessage') {
                const media = await quoted.download()
                const audioMsg = qMsg.audioMessage || {}
                await sock.sendMessage(m.chat, {
                    audio: media,
                    mimetype: audioMsg.mimetype || 'audio/mpeg',
                    ptt: audioMsg.ptt || false,
                    mentions: mentions
                })
                if (msgText) {
                    await sock.sendMessage(m.chat, {
                        text: msgText,
                        mentions: mentions
                    })
                }
                return
            }
            
            // ===== DOCUMENT =====
            if (type === 'documentMessage') {
                const media = await quoted.download()
                const docMsg = qMsg.documentMessage || {}
                await sock.sendMessage(m.chat, {
                    document: media,
                    mimetype: docMsg.mimetype || 'application/octet-stream',
                    fileName: docMsg.fileName || 'file',
                    mentions: mentions
                })
                if (msgText) {
                    await sock.sendMessage(m.chat, {
                        text: msgText,
                        mentions: mentions
                    })
                }
                return
            }
            
            // ===== TEXT =====
            const quotedText = quoted.text || 
                qMsg.conversation || 
                qMsg.extendedTextMessage?.text || ''
            
            const finalText = msgText || quotedText
            
            if (!finalText) {
                return m.reply('❌ *Pesan kosong!*')
            }
            
            return sock.sendMessage(m.chat, {
                text: finalText,
                mentions: mentions
            })
        }
        
        // ===== TIDAK REPLY =====
        if (!text) {
            return m.reply(
                `📢 *HIDETAG PREMIUM*\n\n` +
                `• Reply pesan lalu ketik \`${m.prefix}htprem\`\n` +
                `• Atau ketik \`${m.prefix}htprem <pesan>\`\n\n` +
                `• Contoh: \`${m.prefix}htprem hai semua\`\n\n` +
                `📌 Support: teks, gambar, video, sticker, audio, dokumen`
            )
        }
        
        // ===== KIRIM HIDETAG =====
        await sock.sendMessage(m.chat, {
            text: text,
            mentions: mentions
        }, { quoted: m })
        
    } catch (err) {
        console.error('[Hidetag Premium Error]', err)
        m.reply(`❌ *Error!*\n\n${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}