const { getDatabase } = require('../../src/lib/database')

const config = {
    name: 'rich',
    alias: ['datakaya', 'topky', 'tajir'],
    category: 'economy',
    description: 'Lihat leaderboard orang terkaya (USD)',
    usage: '.rich',
    example: '.rich',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const CURRENCY_RATES = {
    usd: 1, idr: 15700, yen: 150, yuan: 7.25, euro: 0.92,
    pound: 0.79, riyal: 3.75, won: 1350, rupee: 83.5,
    ringgit: 4.45, baht: 35.5, dong: 24500
}

function calculateUSDValue(wallet) {
    let total = 0
    for (const [currency, amount] of Object.entries(wallet || {})) {
        const rate = CURRENCY_RATES[currency]
        if (rate) {
            total += amount / rate
        }
    }
    return total
}

async function handler(m) {
    const db = getDatabase()
    const users = db.db.data.users || {}
    
    const userValues = []
    for (const [userId, userData] of Object.entries(users)) {
        const usdValue = calculateUSDValue(userData.wallet || {})
        if (usdValue > 0) {
            userValues.push({
                id: userId,
                name: userData.name || userId.split('@')[0],
                value: usdValue
            })
        }
    }
    
    userValues.sort((a, b) => b.value - a.value)
    const top10 = userValues.slice(0, 10)
    
    let txt = `🏆 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ᴏʀᴀɴɢ ᴛᴇʀᴋᴀʏᴀ*\n\n`
    txt += `╭┈┈⬡「 💰 *ᴜꜱᴅ ᴠᴀʟᴜᴇ* 」\n`
    
    for (let i = 0; i < top10.length; i++) {
        const user = top10[i]
        const medal = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌'
        txt += `┃ ${medal} ${i+1}. *${user.name}*\n`
        txt += `┃    └ $${user.value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    }
    
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt)
}

module.exports = { config, handler }