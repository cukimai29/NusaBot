const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-zerotwo-v8.jpg',
    alias: ['gantizerotwov8', 'setzerotwov8'],
    category: 'owner',
    description: 'Ganti gambar zerotwo-v8.jpg (thumbnail welcome)',
    usage: '.ganti-zerotwo-v8.jpg (reply/kirim gambar)',
    example: '.ganti-zerotwo-welcome.jpg',
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
        return m.reply(`🖼️ *ɢᴀɴᴛɪ zerotwo-ᴠ8.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/zerotwo-v8.jpg`)
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
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'zerotwo-v8.jpg')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar zerotwo-v8.jpg telah diganti`)
        
    } catch (error) {
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
