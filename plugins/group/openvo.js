const { downloadContentFromMessage } = require('zerotwo')

const pluginConfig = {
    name: 'rvo',
    alias: [],
    category: 'group',
    description: 'Membuka pesan 1x lihat yang di-reply',
    usage: '.rvo (reply pesan 1x lihat)',
    example: '.rvo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted

    if (!quoted) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Balas pesan 1x lihat dengan perintah ini!\n` +
            `> Gunakan: \`${m.prefix}openvo\` (reply pesan 1x lihat)`
        )
        return
    }

    const quotedMsg = quoted.message
    if (!quotedMsg) {
        await m.reply(
            `❌ *ᴘᴇsᴀɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Tidak dapat membaca pesan yang di-reply.`
        )
        return
    }

    const type = Object.keys(quotedMsg)[0]
    const content = quotedMsg[type]

    if (!content) {
        await m.reply(
            `❌ *ᴋᴏɴᴛᴇɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Konten pesan tidak dapat dibaca.`
        )
        return
    }

    if (!content.viewOnce) {
        await m.reply(
            `❌ *ʙᴜᴋᴀɴ ᴠɪᴇᴡᴏɴᴄᴇ*\n\n` +
            `> Pesan yang di-reply bukan pesan 1x lihat!\n` +
            `> Balas pesan dengan ikon 1x lihat (👁️).`
        )
        return
    }

    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Membuka pesan 1x lihat...`)

    try {
        let mediaType = null
        if (type.includes('image')) {
            mediaType = 'image'
        } else if (type.includes('video')) {
            mediaType = 'video'
        } else if (type.includes('audio')) {
            mediaType = 'audio'
        }

        if (!mediaType) {
            await m.reply(
                `❌ *ᴛɪᴘᴇ ᴛɪᴅᴀᴋ ᴅɪᴅᴜᴋᴜɴɢ*\n\n` +
                `> Tipe media: ${type}\n` +
                `> Hanya mendukung: image, video, audio`
            )
            return
        }

        const stream = await downloadContentFromMessage(content, mediaType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n` +
                `> Tidak dapat mengunduh media.\n` +
                `> Media mungkin sudah kadaluarsa.`
            )
            return
        }

        const caption = content.caption || ''
        const senderNumber = quoted.key?.participant?.split('@')[0] || 'Unknown'

        const msgContent = {
            caption: `👁️ *ᴠɪᴇᴡᴏɴᴄᴇ ᴏᴘᴇɴᴇᴅ*\n\n` +
                `> Dari: @${senderNumber}\n` +
                (caption ? `> Caption: ${caption}` : ''),
            mentions: quoted.key?.participant ? [quoted.key.participant] : []
        }

        if (mediaType === 'image') {
            msgContent.image = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'video') {
            msgContent.video = buffer
            await sock.sendMessage(m.chat, msgContent, { quoted: m })
        } else if (mediaType === 'audio') {
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m })
        }

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal membuka pesan 1x lihat.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
