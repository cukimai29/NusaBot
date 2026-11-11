const { stopJadibot, getAllJadibotSessions } = require('../../src/lib/jadibotManager')
const config = require('../../config')

const pluginConfig = {
    name: 'stopdandeletejadibot',
    alias: ['deletejadibot', 'removejadibot', 'hapusjadibot'],
    category: 'owner',
    description: 'Stop dan hapus session jadibot user',
    usage: '.stopdandeletejadibot @user',
    example: '.stopdandeletejadibot @628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = null
    
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    } else if (m.text?.trim()) {
        const num = m.text.trim().replace(/[^0-9]/g, '')
        if (num) target = num + '@s.whatsapp.net'
    }
    
    if (!target) {
        const sessions = getAllJadibotSessions()
        
        if (sessions.length === 0) {
            return m.reply(`❌ Tidak ada session jadibot tersimpan`)
        }
        
        let txt = `🤖 *sᴛᴏᴘ & ᴅᴇʟᴇᴛᴇ ᴊᴀᴅɪʙᴏᴛ*\n\n`
        txt += `> Mention atau reply user untuk delete session\n\n`
        txt += `*sᴇssɪᴏɴ ᴛᴇʀsɪᴍᴘᴀɴ:*\n`
        
        sessions.forEach((s, i) => {
            const status = s.isActive ? '🟢' : '⚫'
            txt += `${i + 1}. ${status} @${s.id}\n`
        })
        
        txt += `\n*ᴄᴏɴᴛᴏʜ:*\n`
        txt += `> \`${m.prefix}stopdandeletejadibot @628xxx\``
        
        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: sessions.map(s => s.jid)
        }, { quoted: m })
    }
    
    const id = target.replace(/@.+/g, '')
    const sessions = getAllJadibotSessions()
    const session = sessions.find(s => s.id === id)
    
    if (!session) {
        return m.reply(`❌ Session jadibot untuk @${id} tidak ditemukan`, { mentions: [target] })
    }
    
    m.react('⏳')
    
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    try {
        await stopJadibot(target, true)
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴊᴀᴅɪʙᴏᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Nomor: @${id}\n` +
                `> Status: *Deleted*\n\n` +
                `> Session telah dihapus permanen`,
            mentions: [target],
            contextInfo: {
                mentionedJid: [target],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
    } catch (error) {
        m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
