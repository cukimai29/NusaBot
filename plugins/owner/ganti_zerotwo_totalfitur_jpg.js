const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-zerotwo-totalfitur.jpg',
    alias: ['gantitotalfitur', 'settotalfitur', 'gantichart', 'setchartimg'],
    category: 'owner',
    description: 'Ganti gambar zerotwo-totalfitur.jpg (background chart totalfitur)',
    usage: '.gantitotalfitur (reply/kirim gambar)',
    example: '.gantitotalfitur',
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
        return m.reply(`🩸 *ɢᴀɴᴛɪ ᴢᴇʀᴏᴛᴡᴏ-ᴛᴏᴛᴀʟꜰɪᴛᴜʀ.ᴊᴘɢ* 🩸\n\n> Kirim/reply gambar untuk mengganti background chart totalfitur\n> 📁 Lokasi: assets/images/zerotwo-totalfitur.jpg\n\n📝 *Catatan:*\n> • Gambar akan langsung digunakan di command .totalfitur\n> • Restart bot untuk melihat perubahan\n> • Ukuran gambar bebas (otomatis di-resize)`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ *Gagal mendownload gambar*`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'zerotwo-totalfitur.jpg')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        let txt = `╭━━━〔 🩸 *ɢᴀɴᴛɪ ɢᴀᴍʙᴀʀ ʙᴇʀʜᴀꜱɪʟ* 🩸 〕━━━⬣
│
│  ✅ *${path.basename(targetPath)}* telah diganti!
│
│  📁 *Lokasi:* assets/images/zerotwo-totalfitur.jpg
│  📊 *Fungsi:* Background chart .totalfitur
│
│  💀 *Restart bot untuk melihat perubahan*
│  🦋 *Darling, gambar baru siap digunakan~*
│
╰━━━━━━━━━━━━━━━━━━━━━━━⬣`
        
        await m.reply(txt)
        
    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}