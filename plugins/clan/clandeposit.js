const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clandeposit',
    alias: ['donasi', 'clandonate'],
    category: 'clan',
    description: 'Donasi uang ke kas clan',
    usage: '.clandeposit <jumlah>',
    example: '.clandeposit 50000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.text?.trim().split(/\s+/)
    const amount = parseInt(args[0])
    
    if (!amount || isNaN(amount) || amount <= 0) {
        return m.reply(`💰 *ᴄʟᴀɴ ᴅᴇᴘᴏꜱɪᴛ*\n\n> Masukkan jumlah donasi!\n\n> Contoh: .clandeposit 50000`)
    }
    
    if (!user.clanId) {
        return m.reply(`❌ Kamu belum punya clan!\n> Buat clan dengan *.clancreate*`)
    }
    
    const clan = db.db.data.clans[user.clanId]
    if (!clan) {
        return m.reply(`❌ Clan tidak ditemukan!`)
    }
    
    if ((user.koin || 0) < amount) {
        return m.reply(`❌ Balance tidak cukup!\n\n> Dibutuhkan: *Rp ${amount.toLocaleString('id-ID')}*\n> Kamu punya: *Rp ${(user.koin || 0).toLocaleString('id-ID')}*`)
    }
    
    if (!clan.bank) clan.bank = 0
    if (!clan.donations) clan.donations = {}
    
    clan.bank += amount
    clan.donations[m.sender] = (clan.donations[m.sender] || 0) + amount
    db.updateKoin(m.sender, -amount)
    await db.save()
    
    let txt = `💰 *ᴅᴏɴᴀꜱɪ ʙᴇʀʜᴀꜱɪʟ!*\n\n`
    txt += `╭┈┈⬡「 📋 *ʀɪɴᴄɪᴀɴ* 」\n`
    txt += `┃ 📛 Clan: *${clan.name}*\n`
    txt += `┃ 👤 Donatur: @${m.sender.split('@')[0]}\n`
    txt += `┃ 💵 Jumlah: *Rp ${amount.toLocaleString('id-ID')}*\n`
    txt += `┃ 🏦 Total kas clan: *Rp ${clan.bank.toLocaleString('id-ID')}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt, { mentions: [m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler
}