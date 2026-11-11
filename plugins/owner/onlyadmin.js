const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'onlyadmin',
    alias: ['onlyadminbot', 'modeadmin', 'adminonly'],
    category: 'owner',
    description: 'Atur mode hanya admin yang bisa pakai bot di grup',
    usage: '.onlyadmin on/off',
    example: '.onlyadmin on',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const mode = args[0]?.toLowerCase()
    
    if (!mode || (mode !== 'on' && mode !== 'off')) {
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗢𝗡𝗟𝗬𝗔𝗗𝗠𝗜𝗡 〕───⬣
│
│ ✦ *Cara Pakai*
│
│  𖦹 .onlyadmin on  = Aktifkan
│  𖦹 .onlyadmin off = Matikan
│
│ ✦ *Fungsi*
│
│  𖦹 Saat aktif, hanya admin grup
│  𖦹 yang bisa menggunakan bot
│
│ ✦ *Contoh*
│
│  𖦹 .onlyadmin on
│
╰──────────────────⬣`
        )
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const isEnabled = mode === 'on'
    
    // Simpan ke database
    groupData.onlyAdmin = isEnabled
    db.setGroup(m.chat, groupData)
    await db.save()
    
    const status = isEnabled ? '🟢 *AKTIF*' : '🔴 *NONAKTIF*'
    const pesan = isEnabled 
        ? `> Hanya *ADMIN GRUP* yang bisa menggunakan bot sekarang!`
        : `> Semua *MEMBER GRUP* bisa menggunakan bot sekarang!`
    
    m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗢𝗡𝗟𝗬𝗔𝗗𝗠𝗜𝗡 〕───⬣
│
│ ✦ *Status Mode*
│
│  ${status}
│
│ ${pesan}
│
│ ✦ *Diubah oleh*
│  @${m.sender.split('@')[0]}
│
╰──────────────────⬣`,
        { mentions: [m.sender] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}