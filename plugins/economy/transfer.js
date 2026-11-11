const { getDatabase } = require('../../src/lib/database')

const config = {
    name: 'transfer',
    alias: ['tf', 'kirim', 'send'],
    category: 'economy',
    description: 'Transfer uang ke user lain',
    usage: '.transfer <matauang> <jumlah> @user',
    example: '.transfer usd 5 @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const CURRENCIES = {
    usd: { symbol: '$' }, idr: { symbol: 'Rp' }, yen: { symbol: '¥' },
    yuan: { symbol: '¥' }, euro: { symbol: '€' }, pound: { symbol: '£' },
    riyal: { symbol: '﷼' }, won: { symbol: '₩' }, rupee: { symbol: '₹' },
    ringgit: { symbol: 'RM' }, baht: { symbol: '฿' }, dong: { symbol: '₫' }
}

async function handler(m, { mention }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.text?.trim().split(/\s+/)
    
    let currency = args[0]?.toLowerCase()
    let amount = parseFloat(args[1])
    let target = mention?.[0] || args[2]
    
    if (!currency || !amount || !target) {
        return m.reply(`💸 *ᴛʀᴀɴꜱꜰᴇʀ*\n\n> Kirim uang ke user lain\n\n> Contoh: .transfer idr 50000 @user\n> Contoh: .transfer usd 5 @user`)
    }
    
    if (!CURRENCIES[currency]) {
        return m.reply(`❌ Mata uang tidak dikenal!\n> Ketik *.currencies* untuk lihat daftar`)
    }
    
    if (isNaN(amount) || amount <= 0) {
        return m.reply(`❌ Masukkan jumlah yang valid!`)
    }
    
    if (!target) {
        return m.reply(`❌ Tag user yang akan dikirim!`)
    }
    
    target = target.replace('@', '').replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    
    if (target === m.sender) {
        return m.reply(`❌ Tidak bisa transfer ke diri sendiri!`)
    }
    
    if (!user.wallet) user.wallet = {}
    const currentBalance = user.wallet[currency] || 0
    
    if (currentBalance < amount) {
        return m.reply(`❌ Saldo ${currency.toUpperCase()} tidak cukup!\n> Kamu punya: ${CURRENCIES[currency].symbol} ${currentBalance.toLocaleString('id-ID')}`)
    }
    
    const targetUser = db.getUser(target)
    if (!targetUser.wallet) targetUser.wallet = {}
    
    user.wallet[currency] -= amount
    targetUser.wallet[currency] = (targetUser.wallet[currency] || 0) + amount
    
    await db.save()
    
    let txt = `💸 *ᴛʀᴀɴꜱꜰᴇʀ ʙᴇʀʜᴀꜱɪʟ!*\n\n`
    txt += `╭┈┈⬡「 📊 *ᴅᴇᴛᴀɪʟ* 」\n`
    txt += `┃ 📤 Pengirim: @${m.sender.split('@')[0]}\n`
    txt += `┃ 📥 Penerima: @${target.split('@')[0]}\n`
    txt += `┃ 💰 Jumlah: ${CURRENCIES[currency].symbol} ${amount.toLocaleString('id-ID')} ${currency.toUpperCase()}\n`
    txt += `┃ 💳 Sisa: ${CURRENCIES[currency].symbol} ${user.wallet[currency].toLocaleString('id-ID')}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt, { mentions: [m.sender, target] })
}

module.exports = { config, handler }