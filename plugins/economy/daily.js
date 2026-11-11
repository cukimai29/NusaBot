const { getDatabase } = require('../../src/lib/database')

const config = {
    name: 'daily',
    alias: ['claim', 'dailybonus', 'hadiah'],
    category: 'economy',
    description: 'Klaim bonus harian',
    usage: '.daily',
    example: '.daily',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 86400,
    energi: 0,
    isEnabled: true
}

const CURRENCIES = ['idr', 'usd', 'yen', 'yuan', 'riyal', 'won', 'rupee', 'ringgit', 'baht']
const BONUS_RANGES = {
    idr: [5000, 50000],
    usd: [0.5, 5],
    yen: [50, 500],
    yuan: [2, 30],
    riyal: [1, 15],
    won: [1000, 10000],
    rupee: [50, 500],
    ringgit: [2, 25],
    baht: [15, 200]
}

function getRandomBonus(currency) {
    const [min, max] = BONUS_RANGES[currency]
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    const today = new Date().toDateString()
    
    if (user.lastDaily === today) {
        return m.reply(`❌ *Sudah claim hari ini!*\n> Kembali besok untuk bonus harian lagi.`)
    }
    
    const randomCurrency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)]
    const bonus = getRandomBonus(randomCurrency)
    
    if (!user.wallet) user.wallet = {}
    user.wallet[randomCurrency] = (user.wallet[randomCurrency] || 0) + bonus
    user.lastDaily = today
    
    let streak = user.dailyStreak || 0
    streak++
    user.dailyStreak = streak
    
    if (streak % 7 === 0) {
        const streakBonus = bonus * 2
        user.wallet[randomCurrency] += streakBonus
        await db.save()
        
        let txt = `🎁 *ʙᴏɴᴜꜱ ʜᴀʀɪᴀɴ!*\n\n`
        txt += `╭┈┈⬡「 ✨ *ʀᴇᴡᴀʀᴅ* 」\n`
        txt += `┃ 💰 Dapat: *${bonus.toLocaleString('id-ID')}* ${randomCurrency.toUpperCase()}\n`
        txt += `┃ 🔥 Streak: *${streak} hari* (+${streakBonus} bonus streak!)\n`
        txt += `┃ 📅 Kembali besok untuk bonus lagi!\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        await m.reply(txt)
    } else {
        await db.save()
        
        let txt = `🎁 *ʙᴏɴᴜꜱ ʜᴀʀɪᴀɴ!*\n\n`
        txt += `╭┈┈⬡「 ✨ *ʀᴇᴡᴀʀᴅ* 」\n`
        txt += `┃ 💰 Dapat: *${bonus.toLocaleString('id-ID')}* ${randomCurrency.toUpperCase()}\n`
        txt += `┃ 🔥 Streak: *${streak} hari*\n`
        txt += `┃ 📅 Kembali besok untuk bonus lagi!\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        await m.reply(txt)
    }
}

module.exports = { config, handler }