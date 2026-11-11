const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-video-allmenu-zerotwo.mp4',
    alias: ['gantivideoallmenu', 'setvideoallmenu'],
    category: 'owner',
    description: 'Ganti video allmenu zerotwo',
    usage: '.ganti-video-allmenu-zerotwo.mp4 (reply/kirim video)',
    example: '.ganti-video-allmenu-zerotwo.mp4',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {

    const isVideo = m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage')

    if (!isVideo) {
        return m.reply(`🎬 *ɢᴀɴᴛɪ ᴠɪᴅᴇᴏ ᴀʟʟᴍᴇɴᴜ*

> Kirim / reply video untuk mengganti
> File : assets/video-allmenu/zerotwo.mp4`)
    }

    try {

        let buffer

        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

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

> Video allmenu berhasil diganti
> Path : assets/video-allmenu/zerotwo.mp4`)

    } catch (error) {

        m.reply(`❌ *ᴇʀʀᴏʀ*

> ${error.message}`)

    }
}

module.exports = {
    config: pluginConfig,
    handler
}