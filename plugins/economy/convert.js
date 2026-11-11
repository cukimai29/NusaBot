const { getDatabase } = require('../../src/lib/database')

const config = {
    name: 'convert',
    alias: ['tukar', 'exchange', 'currency'],
    category: 'economy',
    description: 'Tukar mata uang',
    usage: '.convert <jumlah> <dari> <ke>',
    example: '.convert 100 idr usd',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const CURRENCIES = {
    usd: { name: 'Dollar', symbol: '$', rate: 1, fee: 0.005 },
    idr: { name: 'Rupiah', symbol: 'Rp', rate: 15700, fee: 0.003 },
    yen: { name: 'Yen', symbol: '¥', rate: 150, fee: 0.004 },
    yuan: { name: 'Yuan', symbol: '¥', rate: 7.25, fee: 0.004 },
    euro: { name: 'Euro', symbol: '€', rate: 0.92, fee: 0.005 },
    pound: { name: 'Pound', symbol: '£', rate: 0.79, fee: 0.005 },
    riyal: { name: 'Riyal', symbol: '﷼', rate: 3.75, fee: 0.003 },
    won: { name: 'Won', symbol: '₩', rate: 1350, fee: 0.004 },
    rupee: { name: 'Rupee', symbol: '₹', rate: 83.5, fee: 0.004 },
    ringgit: { name: 'Ringgit', symbol: 'RM', rate: 4.45, fee: 0.003 },
    baht: { name: 'Baht', symbol: '฿', rate: 35.5, fee: 0.003 },
    dong: { name: 'Dong', symbol: '₫', rate: 24500, fee: 0.004 }
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.text?.trim().split(/\s+/)
    
    if (args.length < 3) {
        return m.reply(`💱 *ᴄᴏɴᴠᴇʀᴛ ᴄᴜʀʀᴇɴᴄʏ*\n\n> Tukar uang ke mata uang lain\n\n> Contoh:\n> .convert 10000 idr usd\n> .convert 50 usd yen\n\n> Fee: 0.3% - 0.5%`)
    }
    
    const amount = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to = args[2].toLowerCase()
    
    if (isNaN(amount) || amount <= 0) {
        return m.reply(`❌ Masukkan jumlah yang valid!`)
    }
    
    if (!CURRENCIES[from] || !CURRENCIES[to]) {
        return m.reply(`❌ Mata uang tidak dikenal!\n> Ketik *.currencies* untuk lihat daftar`)
    }
    
    if (!user.wallet) user.wallet = {}
    const currentBalance = user.wallet[from] || 0
    
    if (currentBalance < amount) {
        return m.reply(`❌ Saldo ${CURRENCIES[from].symbol} ${from.toUpperCase()} tidak cukup!\n> Kamu punya: ${CURRENCIES[from].symbol} ${currentBalance.toLocaleString('id-ID')}`)
    }
    
    const usdValue = amount / CURRENCIES[from].rate
    let result = usdValue * CURRENCIES[to].rate
    const fee = (CURRENCIES[from].fee + CURRENCIES[to].fee) / 2
    const feeAmount = result * fee
    const finalResult = result - feeAmount
    
    user.wallet[from] = currentBalance - amount
    user.wallet[to] = (user.wallet[to] || 0) + finalResult
    
    await db.save()
    
    let txt = `💱 *ᴄᴏɴᴠᴇʀꜱɪ ʙᴇʀʜᴀꜱɪʟ!*\n\n`
    txt += `╭┈┈⬡「 📊 *ᴅᴇᴛᴀɪʟ* 」\n`
    txt += `┃ 📤 Dari: ${CURRENCIES[from].symbol} ${amount.toLocaleString('id-ID')} ${from.toUpperCase()}\n`
    txt += `┃ 📥 Ke: ${CURRENCIES[to].symbol} ${finalResult.toLocaleString('id-ID')} ${to.toUpperCase()}\n`
    txt += `┃ 💸 Fee: ${CURRENCIES[from].symbol} ${feeAmount.toLocaleString('id-ID')} (${(fee*100).toFixed(2)}%)\n`
    txt += `┃ 💰 Kurs: 1 ${from.toUpperCase()} = ${(1/CURRENCIES[from].rate).toFixed(6)} USD\n`
    txt += `┃ 💰 Kurs: 1 USD = ${CURRENCIES[to].rate} ${to.toUpperCase()}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt)
}

module.exports = { config, handler }