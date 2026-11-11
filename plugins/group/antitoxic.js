const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'antitoxic',
    alias: ['toxic', 'antitoxik'],
    category: 'group',
    description: 'Mengatur antitoxic di grup',
    usage: '.antitoxic <on/off>',
    example: '.antitoxic on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const DEFAULT_TOXIC_WORDS = [
    'anjing', 'bangsat', 'kontol', 'memek', 'ngentot', 'babi', 'tolol',
    'goblok', 'idiot', 'bodoh', 'kampret', 'asu', 'jancok', 'bajingan',
    'keparat', 'setan', 'iblis', 'tai', 'brengsek', 'sialan'
]

function isToxic(text, toxicList) {
    if (!text || typeof text !== 'string') return { toxic: false, word: null }
    
    const lowerText = text.toLowerCase().trim()
    if (!lowerText) return { toxic: false, word: null }
    
    const words = (toxicList && toxicList.length > 0) ? toxicList : DEFAULT_TOXIC_WORDS
    
    for (const word of words) {
        if (!word) continue
        const lowerWord = word.toLowerCase().trim()
        if (!lowerWord) continue
        
        const escapedWord = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escapedWord}($|\\s|[^a-zA-Z0-9])`, 'i')
        
        if (regex.test(lowerText)) {
            return { toxic: true, word }
        }
    }
    
    return { toxic: false, word: null }
}

async function handleToxicMessage(m, sock, db, toxicWord) {
    const groupData = db.getGroup(m.chat) || {}
    const warnCount = (groupData.toxicWarns?.[m.sender] || 0) + 1
    
    if (!groupData.toxicWarns) groupData.toxicWarns = {}
    groupData.toxicWarns[m.sender] = warnCount
    db.setGroup(m.chat, groupData)
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    if (warnCount >= 3) {
        try {
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            
            groupData.toxicWarns[m.sender] = 0
            db.setGroup(m.chat, groupData)
            
            await sock.sendMessage(m.chat, {
                text: `╭┈┈⬡「 🚫 *ᴀɴᴛɪᴛᴏxɪᴄ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ᴋᴀᴛᴀ: \`${toxicWord}\`
┃ ㊗ ᴡᴀʀɴ: *3/3*
┃ ㊗ ᴀᴄᴛɪᴏɴ: *KICKED*
┃
╰┈┈⬡

> _User dikeluarkan karena toxic!_`,
                mentions: [m.sender],
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            })
        } catch {}
    } else {
        await sock.sendMessage(m.chat, {
            text: `╭┈┈⬡「 ⚠️ *ᴀɴᴛɪᴛᴏxɪᴄ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ᴋᴀᴛᴀ: \`${toxicWord}\`
┃ ㊗ ᴡᴀʀɴ: *${warnCount}/3*
┃ ㊗ ᴀᴄᴛɪᴏɴ: Dihapus
┃
╰┈┈⬡

> _3 peringatan = KICK!_`,
            mentions: [m.sender],
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        })
    }
    
    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCommand = args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    
    if (!subCommand) {
        const status = groupData.antitoxic ? '✅ ON' : '❌ OFF'
        const toxicCount = groupData.toxicWords?.length || DEFAULT_TOXIC_WORDS.length
        
        let txt = `╭━━━━━━━━━━━━━━━━━╮\n`
        txt += `┃  🛡️ *ᴀɴᴛɪᴛᴏxɪᴄ*\n`
        txt += `╰━━━━━━━━━━━━━━━━━╯\n\n`
        txt += `> Status: *${status}*\n`
        txt += `> Kata Toxic: *${toxicCount}*\n\n`
        txt += `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n`
        txt += `┃ ◦ \`.antitoxic on\` - Aktifkan\n`
        txt += `┃ ◦ \`.antitoxic off\` - Nonaktifkan\n`
        txt += `┃ ◦ \`.addtoxic <kata>\` - Tambah\n`
        txt += `┃ ◦ \`.deltoxic <kata>\` - Hapus\n`
        txt += `┃ ◦ \`.listtoxic\` - Lihat list\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.reply(txt)
        return
    }
    
    if (subCommand === 'on') {
        db.setGroup(m.chat, { antitoxic: true })
        m.react('✅')
        await m.reply(`✅ *ᴀɴᴛɪᴛᴏxɪᴄ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Pesan toxic akan otomatis dihapus`)
        return
    }
    
    if (subCommand === 'off') {
        db.setGroup(m.chat, { antitoxic: false })
        m.react('❌')
        await m.reply(`❌ *ᴀɴᴛɪᴛᴏxɪᴄ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`)
        return
    }
    
    await m.reply(`❌ Gunakan \`.antitoxic on\` atau \`.antitoxic off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    isToxic,
    handleToxicMessage,
    DEFAULT_TOXIC_WORDS
}
