const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'addvideo-allmenu-zerotwo.mp4',
    alias: ['addvideoallmenu', 'setvideoallmenu'],
    category: 'owner',
    description: 'Tambah video allmenu zerotwo',
    usage: '.addvideo-allmenu-zerotwo.mp4 (reply video)',
    example: '.addvideo-allmenu-zerotwo.mp4',
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
        return m.reply(`🎬 *ᴀᴅᴅ ᴠɪᴅᴇᴏ ᴀʟʟᴍᴇɴᴜ*

> Reply video yang ingin dijadikan
> video menu bot

Contoh:
reply video lalu ketik
*.addvideo-allmenu-zerotwo.mp4*`)
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

        const targetPath = path.join(process.cwd(), 'assets', 'video-allmenu', 'zerotwo.mp4')

        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(targetPath, buffer)

        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*

> Video allmenu berhasil ditambahkan

📂 Path:
assets/video-allmenu/zerotwo.mp4`)

    } catch (error) {

        m.reply(`❌ *ᴇʀʀᴏʀ*

> ${error.message}`)

    }
}

module.exports = {
    config: pluginConfig,
    handler
}