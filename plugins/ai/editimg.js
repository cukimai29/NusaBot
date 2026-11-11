const { uploadToTmpFiles } = require('../../src/lib/zerotwo-tmpfiles')
const pluginConfig = {
    name: 'editimage',
    alias: ['editimg', 'imgedit'],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt',
    usage: '.editimage <prompt>',
    example: '.editimage make it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(
            `*ᴇᴅɪᴛ ɪᴍᴀɢᴇ*\n\n` +
            `> Edit gambar dengan AI\n\n` +
            `\`Contoh: ${m.prefix}editimage make it anime style\`\n\n` +
            `> Reply atau kirim gambar dengan caption`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`*ᴇᴅɪᴛ ɪᴍᴀɢᴇ*\n\n> Reply atau kirim gambar dengan caption`)
    }
    
    m.react('🕕')

    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh gambar`)
        }

        const image = await uploadToTmpFiles(mediaBuffer, { filename: 'image.jpg' })
        
        
        await sock.sendMessage(m.chat, {
            image: { url: `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(image.directUrl)}&prompt=${encodeURIComponent(prompt)}` },
            caption: `DONE`
        }, { quoted: m })
        
        m.react('✅')
    } catch (error) {
        m.react('❌')
        m.reply(`🍀 *Waduhh, sepertinya ini ada kendala*
> Silahkan coba ke versi ${m.prefix}zerotwobanana`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
