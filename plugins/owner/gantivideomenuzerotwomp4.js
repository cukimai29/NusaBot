const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-videomenu-zerotwo.mp4',
    alias: ['gantivideomenu', 'replacevideomenu'],
    category: 'owner',
    description: 'Ganti video menu zerotwo',
    usage: '.ganti-videomenu-zerotwo.mp4 (reply video)',
    example: '.ganti-videomenu-zerotwo.mp4',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {

    if (!m.quoted) {
        return m.reply(`🎬 *ɢᴀɴᴛɪ ᴠɪᴅᴇᴏ ᴍᴇɴᴜ*

> Reply video yang ingin dijadikan
> video menu baru bot

Contoh:
reply video lalu ketik
*.ganti-videomenu-zerotwo.mp4*`)
    }

    const isVideo = m.quoted.type === 'videoMessage'

    if (!isVideo) {
        return m.reply(`❌ Yang kamu reply harus *video*`)
    }

    try {

        const buffer = await m.quoted.download()

        if (!buffer) {
            return m.reply(`❌ Gagal mendownload video`)
        }

        const targetPath = path.join(process.cwd(), 'assets', 'video-menu', 'menu-zerotwo.mp4')

        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // hapus video lama kalau ada
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath)
        }

        fs.writeFileSync(targetPath, buffer)

        m.reply(`🔄 *ʙᴇʀʜᴀsɪʟ*

> Video menu berhasil diganti

📂 Path:
assets/video-menu/menu-zerotwo.mp4`)

    } catch (error) {

        m.reply(`❌ *ᴇʀʀᴏʀ*

> ${error.message}`)

    }
}

module.exports = {
    config: pluginConfig,
    handler
}