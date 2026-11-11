const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setallmenu',
    alias: ['setam', 'changeallmenu', 'gantiallmenu'],
    category: 'owner',
    description: 'Ganti versi allmenu (1/2/3)',
    usage: '.setallmenu <versi>',
    example: '.setallmenu 2',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.text?.trim().split(/\s+/)
    const version = parseInt(args[0])
    
    if (!version || (version !== 1 && version !== 2 && version !== 3)) {
        return m.reply(`🎀 *SET ALLMENU VERSION* 🎀\n\n> Pilih versi allmenu:\n\n✨ *Versi 1* - Tampilan klasik (product message)\n🌸 *Versi 2* - Tampilan video + caption cute\n💫 *Versi 3* - Tampilan buttons Telegram + location header\n\n📝 Contoh: .setallmenu 3`)
    }
    
    if (!db.db.data.settings) db.db.data.settings = {}
    const currentVersion = db.db.data.settings.allmenuVersion || 1
    
    if (currentVersion === version) {
        return m.reply(`💕 *Allmenu sudah versi ${version}* 💕\n\n> Tidak ada perubahan, Darling~`)
    }
    
    db.db.data.settings.allmenuVersion = version
    await db.save()
    
    let txt = `✨ *ALLMENU VERSION CHANGED!* ✨\n\n`
    txt += `╭──〔 💕 *ᴜᴘᴅᴀᴛᴇ* 〕───⬣\n`
    txt += `│  📌 Versi lama: *${currentVersion}*\n`
    txt += `│  ✨ Versi baru: *${version}*\n`
    txt += `╰────────────────⬣\n\n`
    
    if (version === 1) {
        txt += `🌸 *Versi 1 aktif!*\n> Allmenu akan tampil dengan product message seperti biasa, Darling~`
    } else if (version === 2) {
        txt += `🎀 *Versi 2 aktif!*\n> Allmenu akan tampil dengan VIDEO + caption yang lebih cute!\n> Lengkap dengan 3 button di fallback: Menu, Menu Cat, Owner`
    } else {
        txt += `💫 *Versi 3 aktif!*\n> Allmenu akan tampil dengan buttonsMessage + location header (jpegThumbnail), lengkap sama footer daftar command!`
    }
    
    txt += `\n\n💕 *Coba ketik .allmenu sekarang, Darling~*`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}