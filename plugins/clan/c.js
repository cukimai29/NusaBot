const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'c',
    alias: ['clanchat', 'cc', 'chatclan'],
    category: 'clan',
    description: 'Chat internal clan',
    usage: '.c <pesan>',
    example: '.c halo semua!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const message = m.text?.trim()
    
    if (!message) {
        return m.reply(`💬 *ᴄʟᴀɴ ᴄʜᴀᴛ*\n\n> Kirim pesan ke clan chat\n\n> Contoh: .c halo semua!`)
    }
    
    if (!user.clanId) {
        return m.reply(`❌ Kamu belum punya clan!\n> Buat clan dengan *.clancreate*`)
    }
    
    const clan = db.db.data.clans[user.clanId]
    if (!clan) {
        return m.reply(`❌ Clan tidak ditemukan!`)
    }
    
    if (clan.muted && clan.muted.includes(m.sender)) {
        return m.reply(`🔇 Kamu sedang di-mute di clan chat!`)
    }
    
    const userData = db.getUser(m.sender)
    const userName = userData?.name || m.pushName || m.sender.split('@')[0]
    const role = clan.leader === m.sender ? '👑 Leader' : (clan.roles?.[m.sender] === 'coleader' ? '⭐ Co-Leader' : (clan.roles?.[m.sender] === 'elder' ? '🛡️ Elder' : '⚔️ Member'))
    
    let chatHistory = clan.chatHistory || []
    chatHistory.push({
        from: m.sender,
        name: userName,
        message: message,
        time: Date.now()
    })
    
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50)
    }
    clan.chatHistory = chatHistory
    await db.save()
    
    let txt = `💬 *ᴄʟᴀɴ ᴄʜᴀᴛ* [${clan.name}]\n`
    txt += `╭┈┈⬡「 ${role} 」\n`
    txt += `┃ 📛 ${userName}\n`
    txt += `┃ 💬 ${message}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    for (const member of clan.members) {
        if (member !== m.sender) {
            await sock.sendMessage(member, { text: txt }).catch(() => {})
        }
    }
    
    await m.reply(`✅ Pesan terkirim ke *${clan.members.length}* member clan!`)
}

module.exports = {
    config: pluginConfig,
    handler
}