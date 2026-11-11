const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delprem',
    alias: ['delpremium', 'rmprem', 'removeprem'],
    category: 'owner',
    description: 'Menghapus user dari daftar premium ~darling~',
    usage: '.delprem <nomor/@tag>',
    example: '.delprem 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let targetNumber = ''
    
    // Darling detection~
    if (m.quoted) {
        targetNumber = m.quoted.sender?.split('@')[0] || ''
    } 
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetNumber = m.mentionedJid[0].split('@')[0] || ''
    } 
    else if (m.args && m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`🦋 *ZERO TWO SAYS* 🦋\n\n` +
            `"Oi *darling*~ Kamu lupa kasih nomor nih~ 🎐\n\n` +
            `Coba lagi pake ini:\n` +
            `➠ \`${m.prefix}delprem 6281234567890\`\n\n` +
            `Atau tag langsung darling-nya~ 💫"`)
    }
    
    // Format nomor ala Zero Two
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    targetNumber = targetNumber.replace(/[^0-9]/g, '')
    
    if (!db.data.premium) db.data.premium = []
    
    // Cari si darling yang mau dihapus~
    let index = -1
    let foundNumber = null
    
    for (let i = 0; i < db.data.premium.length; i++) {
        const premiumNum = db.data.premium[i].replace(/[^0-9]/g, '')
        if (premiumNum === targetNumber) {
            index = i
            foundNumber = db.data.premium[i]
            break
        }
    }
    
    if (index === -1) {
        return m.reply(`❌ *ZERO TWO - GAGAL* ❌\n\n` +
            `"Hmph! *${targetNumber}* itu bukan premium darlingku~ 🦋\n\n` +
            `Coba cek lagi daftar premiumnya dong~\n` +
            `Atau mungkin dia emang gak pernah jadi darlingku? 💫"`)
    }
    
    const removedNumber = db.data.premium.splice(index, 1)[0]
    
    // Hapus status premium
    const jid = removedNumber.includes('@') ? removedNumber : removedNumber + '@s.whatsapp.net'
    const user = db.getUser(jid)
    if (user) {
        user.isPremium = false
        db.setUser(jid, user)
    }
    
    db.save()
    await m.react('🦋')
    
    await m.reply(
        `🗑️ *ZERO TWO - PREMIUM REMOVED* 🗑️\n\n` +
        `"Bye bye~ *${removedNumber.replace(/[^0-9]/g, '')}* darling~ 🦋\n\n` +
        `╭─〔 ✨ *DETAIL* 〕─🦋\n` +
        `│ 📱 *Nomor* : \`${removedNumber.replace(/[^0-9]/g, '')}\`\n` +
        `│ 🆓 *Status* : \`Free User\` (biasa aja~)\n` +
        `│ 💫 *Sisa* : \`${db.data.premium.length}\` darling\n` +
        `╰─────────────────🦋\n\n` +
        `"Yaudah balik jadi manusia biasa lagi~ Jangan nangis ya~ 🎐"` +
        (db.data.premium.length > 0 ? 
        `\n\n✨ *Masih ada ${db.data.premium.length} darling lain* ✨\n` +
        `> Mereka masih beruntung jadi premium darling-ku~ 💫` : 
        `\n\n💔 *Sekarang gak ada darling premium tersisa...* 💔\n` +
        `> Sedih~ Tambahin lagi dong pakai \`.addprem\` 🦋`)
    )
}

module.exports = {
    config: pluginConfig,
    handler
}