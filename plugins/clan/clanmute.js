const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clanmute',
    alias: ['mutemember', 'clansilence'],
    category: 'clan',
    description: 'Mute member di clan chat',
    usage: '.clanmute @user [duration]',
    example: '.clanmute @user 10m',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function parseDuration(duration) {
    if (!duration) return 300
    const match = duration.match(/^(\d+)(s|m|h|d)$/)
    if (!match) return 300
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch(unit) {
        case 's': return value
        case 'm': return value * 60
        case 'h': return value * 3600
        case 'd': return value * 86400
        default: return 300
    }
}

async function handler(m, { mention }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.text?.trim().split(/\s+/)
    
    let target = mention?.[0] || (args[0] ? (args[0].includes('@') ? args[0] : null) : null)
    let duration = args?.find(a => a.match(/^\d+[smhd]$/)) || '10m'
    
    if (!target) {
        return m.reply(`🔇 *ᴄʟᴀɴ ᴍᴜᴛᴇ*\n\n> Mute member di clan chat\n\n> Contoh:\n> .clanmute @user\n> .clanmute @user 1h`)
    }
    
    target = target.replace('@', '').replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    
    if (!user.clanId) {
        return m.reply(`❌ Kamu belum punya clan!`)
    }
    
    const clan = db.db.data.clans[user.clanId]
    if (!clan) {
        return m.reply(`❌ Clan tidak ditemukan!`)
    }
    
    if (clan.leader !== m.sender && clan.roles?.[m.sender] !== 'coleader') {
        return m.reply(`❌ Hanya *Leader* atau *Co-Leader* yang bisa mute member!`)
    }
    
    if (!clan.members.includes(target)) {
        return m.reply(`❌ Target bukan member clan kamu!`)
    }
    
    if (target === m.sender) {
        return m.reply(`❌ Tidak bisa mute diri sendiri!`)
    }
    
    if (clan.leader === target) {
        return m.reply(`❌ Tidak bisa mute leader clan!`)
    }
    
    const durationSeconds = parseDuration(duration)
    const mutedUntil = Date.now() + (durationSeconds * 1000)
    
    if (!clan.muted) clan.muted = []
    if (!clan.mutedUntil) clan.mutedUntil = {}
    
    clan.muted.push(target)
    clan.mutedUntil[target] = mutedUntil
    
    setTimeout(async () => {
        const currentClan = db.db.data.clans[user.clanId]
        if (currentClan && currentClan.muted) {
            const index = currentClan.muted.indexOf(target)
            if (index > -1) {
                currentClan.muted.splice(index, 1)
                delete currentClan.mutedUntil[target]
                await db.save()
            }
        }
    }, durationSeconds * 1000)
    
    await db.save()
    
    let durationText = ''
    if (durationSeconds < 60) durationText = `${durationSeconds} detik`
    else if (durationSeconds < 3600) durationText = `${Math.floor(durationSeconds / 60)} menit`
    else if (durationSeconds < 86400) durationText = `${Math.floor(durationSeconds / 3600)} jam`
    else durationText = `${Math.floor(durationSeconds / 86400)} hari`
    
    let txt = `🔇 *ᴄʟᴀɴ ᴍᴜᴛᴇ*\n\n`
    txt += `╭┈┈⬡「 📋 *ʜᴀꜱɪʟ* 」\n`
    txt += `┃ 📛 Clan: *${clan.name}*\n`
    txt += `┃ 👤 Member: @${target.split('@')[0]}\n`
    txt += `┃ ⏰ Durasi: *${durationText}*\n`
    txt += `┃ 👑 Dimute oleh: @${m.sender.split('@')[0]}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt, { mentions: [target, m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler
}