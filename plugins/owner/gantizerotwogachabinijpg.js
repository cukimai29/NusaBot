const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-zerotwo-gachabini.jpg',
    alias: ['gantizerotwogachabini','setzerotwogachabini'],
    category: 'owner',
    description: 'Ganti gambar zerotwo-gachabini.jpg',
    usage: '.ganti-zerotwo-gachabini.jpg (reply/kirim gambar)',
    example: '.ganti-zerotwo-gachabini.jpg',
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
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ᴢᴇʀᴏᴛᴡᴏ-ɢᴀᴄʜᴀʙɪɴɪ.ᴊᴘɢ*

> Kirim / reply gambar untuk mengganti
> File : assets/images/zerotwo-gachabini.jpg`)
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

        const targetPath = path.join(process.cwd(),'assets','images','zerotwo-gachabini.jpg')

        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir,{ recursive:true })
        }

        fs.writeFileSync(targetPath,buffer)

        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*

> Gambar *zerotwo-gachabini.jpg* telah diganti`)

    } catch (error) {

        m.reply(`❌ *ᴇʀʀᴏʀ*

> ${error.message}`)

    }

}

module.exports = {
    config: pluginConfig,
    handler
}