const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER

const pluginConfig = {
    name: 'ngojek',
    alias: ['ojek', 'gojek', 'ojol'],
    category: 'rpg',
    description: 'Ngojek untuk mendapat uang',
    usage: '.ngojek',
    example: '.ngojek',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbRpg

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '🏍️ *ɴɢᴏᴊᴇᴋ*', body = 'Ojek Online') {
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
    
    // 🔥 FIX: Ambil gambar dari URL (sekaligus benerin typo 'zerotwon' -> 'zerotwo')
    try {
        const thumbRpg = await loadImage('zerotwo-rpg.jpg')
        if (thumbRpg) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: thumbRpg,
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const staminaCost = 15
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk ngojek\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('🏍️')
    
    const orders = [
        { type: '🍔 GoFood', distance: '2km', min: 5000, max: 15000 },
        { type: '👤 GoRide', distance: '5km', min: 10000, max: 25000 },
        { type: '📦 GoSend', distance: '3km', min: 8000, max: 20000 },
        { type: '🛒 GoMart', distance: '4km', min: 12000, max: 30000 },
        { type: '👥 GoRide Plus', distance: '10km', min: 20000, max: 50000 }
    ]
    
    const order = orders[Math.floor(Math.random() * orders.length)]
    const earning = Math.floor(Math.random() * (order.max - order.min + 1)) + order.min
    const tips = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : 0
    const totalEarning = earning + tips
    
    await m.reply(`🏍️ *sᴇᴅᴀɴɢ ɴɢᴏᴊᴇᴋ...*\n\n> ${order.type} - ${order.distance}`)
    await new Promise(r => setTimeout(r, 2500))
    
    user.koin = (user.koin || 0) + totalEarning
    
    const expGain = Math.floor(totalEarning / 20)
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    await m.react('✅')
    
    let txt = `🏍️ *ɴɢᴏᴊᴇᴋ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 📋 *ᴏʀᴅᴇʀ* 」\n`
    txt += `┃ 📱 Tipe: ${order.type}\n`
    txt += `┃ 📍 Jarak: ${order.distance}\n`
    txt += `┃ ─────────\n`
    txt += `┃ 💵 Tarif: *+Rp ${earning.toLocaleString('id-ID')}*\n`
    if (tips > 0) {
        txt += `┃ 🎁 Tips: *+Rp ${tips.toLocaleString('id-ID')}*\n`
    }
    txt += `┃ 🚄 Exp: *+${expGain}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    // 🔥 FIX: await getContextInfo
    const contextInfo = await getContextInfo('🏍️ *ɴɢᴏᴊᴇᴋ*', `+Rp ${totalEarning.toLocaleString('id-ID')}`)
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: contextInfo
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}