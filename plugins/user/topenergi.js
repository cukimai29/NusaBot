const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'topenergi',
    alias: ['leaderboardenergi', 'lbenergi', 'topenergy'],
    category: 'user',
    description: 'Leaderboard energi',
    usage: '.topenergi',
    example: '.topenergi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

async function handler(m, { sock }) {
    const db = getDatabase()
    
    const ownerNumbers = (config.owner?.number || []).map(n => n.replace(/[^0-9]/g, ''))
    const dbOwners = (db.data.owner || []).map(n => n.replace(/[^0-9]/g, ''))
    const allOwners = [...new Set([...ownerNumbers, ...dbOwners])]
    
    const allUsers = Object.values(db.getAllUsers())
    const topUsers = allUsers
        .filter(u => {
            const userNum = (u.jid || u.number || '').replace(/[^0-9]/g, '')
            const isOwner = allOwners.includes(userNum)
            if (isOwner) return false
            if (u.energi === -1) return false
            if ((u.energi || 0) === 0) return false
            return true
        })
        .sort((a, b) => (b.energi || 0) - (a.energi || 0))
        .slice(0, 10)
    
    if (topUsers.length === 0) {
        return m.reply(`⚡ *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ᴇɴᴇʀɢɪ*\n\n> Belum ada data`)
    }
    
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  🏆 *ᴛᴏᴘ ᴇɴᴇʀɢɪ*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    const mentions = []
    
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i]
        const medal = MEDALS[i]
        const name = user.name || user.jid
        const energi = formatNumber(user.energi)
        
        text += `${medal} *${name}*\n`
        text += `    ⚡ ${energi}\n\n`
        
        mentions.push(`${user.jid}@s.whatsapp.net`)
    }
    
    text += `> ⚡ Total: ${topUsers.length} users`
    
    await sock.sendMessage(m.chat, {
        text,
        mentions,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
