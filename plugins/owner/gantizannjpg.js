const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-thumbnail',
    alias: ['setthumbnail', 'gantithumbnail'],
    category: 'owner',
    description: 'Ganti gambar thumbnail menu',
    usage: '.ganti-thumbnail (reply/kirim gambar)',
    example: '.ganti-thumbnail',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🖼️ *GANTI THUMBNAIL MENU*\n\n> Kirim/reply gambar untuk mengganti thumbnail menu.`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'NusaBot.jpg')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *BERHASIL*\n\n> Thumbnail menu berhasil diganti.\n> Restart bot untuk melihat perubahan.`)
        
    } catch (error) {
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
