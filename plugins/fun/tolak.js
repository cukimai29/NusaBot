const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tolak',
    alias: ['reject', 'no', 'gaktau'],
    category: 'fun',
    description: 'Menolak tembakan dari seseorang',
    usage: '.tolak @tag',
    example: '.tolak @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbFun

const rejectionQuotes = [
    'Sabar ya, yang lebih baik pasti datang! 🌟',
    'Belum jodoh bukan berarti tidak ada jodoh 💪',
    'Move on! Banyak ikan di laut! 🐟',
    'Yang sabar ya, cinta sejati akan datang 💕',
    'Jangan patah semangat, tetap semangat! 🔥',
    'Penolakan adalah awal dari keberhasilan 💪',
    'Masih banyak kesempatan di luar sana! ✨',
    'Yakin masih ada yang lebih cocok buat kamu! 🌈'
]

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '💔 *ᴛᴏʟᴀᴋ*', body = 'Rejected!') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    // 🔥 FIX: Ambil gambar dari URL (ganti ke zerotwo-games.jpg)
    try {
        const thumbFun = await loadImage('zerotwo-games.jpg')
        if (thumbFun) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: thumbFun,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let shooterJid = null
    
    if (m.quoted) {
        shooterJid = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        shooterJid = m.mentionedJid[0]
    }
    
    if (!shooterJid) {
        const sessions = global.tembakSessions || {}
        const mySession = Object.entries(sessions).find(
            ([key, val]) => val.target === m.sender && val.chat === m.chat
        )
        
        if (mySession) {
            shooterJid = mySession[1].shooter
        }
    }
    
    if (!shooterJid) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply pesan tembakan + \`${m.prefix}tolak\`\n` +
            `> Atau \`${m.prefix}tolak @tag\``
        )
    }
    
    if (shooterJid === m.sender) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa menolak diri sendiri!`)
    }
    
    if (shooterJid === m.botNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot tidak punya hati untuk ditolak!`)
    }
    
    let shooterData = db.getUser(shooterJid) || {}
    let myData = db.getUser(m.sender) || {}
    
    if (!shooterData.fun) shooterData.fun = {}
    if (!myData.fun) myData.fun = {}
    
    if (shooterData.fun.pasangan !== m.sender) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴍᴇɴᴇᴍʙᴀᴋ*\n\n` +
            `> @${shooterJid.split('@')[0]} tidak sedang menembakmu`,
            { mentions: [shooterJid] }
        )
    }
    
    shooterData.fun.pasangan = ''
    myData.fun.pasangan = ''
    
    if (!shooterData.fun.ditolakCount) shooterData.fun.ditolakCount = 0
    shooterData.fun.ditolakCount++
    
    db.setUser(shooterJid, shooterData)
    db.setUser(m.sender, myData)
    
    const sessionKey = `${m.chat}_${m.sender}`
    if (global.tembakSessions?.[sessionKey]) {
        delete global.tembakSessions[sessionKey]
    }
    
    const quote = rejectionQuotes[Math.floor(Math.random() * rejectionQuotes.length)]
    
    await m.react('💔')

    // 🔥 FIX: await getContextInfo
    const ctx = await getContextInfo('💔 *ᴅɪᴛᴏʟᴀᴋ*', 'Move on!')
    ctx.mentionedJid = [m.sender, shooterJid]
    
    await sock.sendMessage(m.chat, {
        text: `💔 *ᴅɪᴛᴏʟᴀᴋ!*\n\n` +
            `╭┈┈⬡「 😢 *ᴘᴇɴᴏʟᴀᴋᴀɴ* 」\n` +
            `┃ 👤 @${m.sender.split('@')[0]}\n` +
            `┃ ❌ menolak\n` +
            `┃ 👤 @${shooterJid.split('@')[0]}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> _"${quote}"_`,
        mentions: [m.sender, shooterJid],
        contextInfo: ctx
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}