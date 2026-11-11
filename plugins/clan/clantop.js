const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clantop',
    alias: ['topclan', 'leaderboardclan', 'rankingclan'],
    category: 'clan',
    description: 'Lihat top 10 clan terkuat',
    usage: '.clantop',
    example: '.clantop',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function getLevelFromExp(exp) {
    return Math.floor(Math.sqrt(exp / 100)) + 1
}

function getLevelBadge(level) {
    if (level >= 50) return '👑'
    if (level >= 40) return '💎'
    if (level >= 30) return '⭐'
    if (level >= 20) return '🌟'
    if (level >= 10) return '✨'
    if (level >= 5) return '💫'
    return '🌱'
}

async function handler(m) {
    const db = getDatabase()
    
    if (!db.db.data.clans || Object.keys(db.db.data.clans).length === 0) {
        return m.reply(`🏆 *ᴛᴏᴘ 10 ᴄʟᴀɴ*\n\n> Belum ada clan yang terdaftar!\n> Buat clan dengan *.clancreate*`)
    }
    
    const clans = Object.values(db.db.data.clans)
        .sort((a, b) => {
            if (b.level !== a.level) return (b.level || 1) - (a.level || 1)
            if (b.exp !== a.exp) return (b.exp || 0) - (a.exp || 0)
            return (b.wins || 0) - (a.wins || 0)
        })
        .slice(0, 10)
    
    let txt = `🏆 *ᴛᴏᴘ 10 ᴄʟᴀɴ ᴛᴇʀᴋᴜᴀᴛ*\n\n`
    
    for (let i = 0; i < clans.length; i++) {
        const clan = clans[i]
        const level = clan.level || getLevelFromExp(clan.exp || 0)
        const badge = getLevelBadge(level)
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌'
        
        const winRate = clan.wars ? Math.floor((clan.wins / clan.wars) * 100) : 0
        
        txt += `╭┈┈⬡「 ${medal} *${i+1}. ${clan.name}* 」\n`
        txt += `┃ ${badge} Level: *${level}*\n`
        txt += `┃ 👥 Member: *${clan.members?.length || 0}*\n`
        txt += `┃ 🏆 Win rate: *${winRate}%*\n`
        txt += `┃ 💰 Total kas: *Rp ${(clan.bank || 0).toLocaleString('id-ID')}*\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n`
        if (i < clans.length - 1) txt += `\n`
    }
    
    const totalClans = Object.keys(db.db.data.clans).length
    txt += `\n> 📊 Total clan terdaftar: *${totalClans}*`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}