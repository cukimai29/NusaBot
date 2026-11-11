const { getDatabase } = require('../../src/lib/database')

const config = {
    name: 'bal',
    alias: ['balance', 'saldo', 'cekbalance', 'mybalance'],
    category: 'economy',
    description: 'Cek saldo semua mata uang',
    usage: '.bal',
    example: '.bal',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true
}

const CURRENCIES = {
    usd: { name: 'Dollar', symbol: '$', emoji: '💵', color: '🇺🇸' },
    idr: { name: 'Rupiah', symbol: 'Rp', emoji: '🇮🇩', color: '💰' },
    yen: { name: 'Yen', symbol: '¥', emoji: '💴', color: '🇯🇵' },
    yuan: { name: 'Yuan', symbol: '¥', emoji: '🇨🇳', color: '🔴' },
    euro: { name: 'Euro', symbol: '€', emoji: '💶', color: '🇪🇺' },
    pound: { name: 'Pound', symbol: '£', emoji: '💷', color: '🇬🇧' },
    riyal: { name: 'Riyal', symbol: '﷼', emoji: '🇸🇦', color: '🟢' },
    won: { name: 'Won', symbol: '₩', emoji: '🇰🇷', color: '🔵' },
    rupee: { name: 'Rupee', symbol: '₹', emoji: '🇮🇳', color: '🟠' },
    ringgit: { name: 'Ringgit', symbol: 'RM', emoji: '🇲🇾', color: '🟡' },
    baht: { name: 'Baht', symbol: '฿', emoji: '🇹🇭', color: '🟣' },
    dong: { name: 'Dong', symbol: '₫', emoji: '🇻🇳', color: '🔴' }
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.wallet) user.wallet = {}
    
    let txt = `💳 *ᴍʏ ᴡᴀʟʟᴇᴛ*\n`
    txt += `👤 @${m.sender.split('@')[0]}\n\n`
    txt += `╭┈┈⬡「 💰 *ꜱᴀʟᴅᴏ* 」\n`
    
    let totalValue = 0
    
    for (const [code, curr] of Object.entries(CURRENCIES)) {
        const amount = user.wallet[code] || 0
        if (amount > 0 || true) {
            txt += `┃ ${curr.emoji} *${code.toUpperCase()}* : ${curr.symbol} ${amount.toLocaleString('id-ID')}\n`
            totalValue += amount
        }
    }
    
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> 📊 Total aset: *${totalValue.toLocaleString('id-ID')}* token`
    
    await m.reply(txt, { mentions: [m.sender] })
}

module.exports = { config, handler }