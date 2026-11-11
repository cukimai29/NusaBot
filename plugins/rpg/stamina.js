const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER

const pluginConfig = {
    name: 'stamina',
    alias: ['energy', 'cekstamina'],
    category: 'rpg',
    description: 'Cek dan pulihkan stamina',
    usage: '.stamina / .stamina isi',
    example: '.stamina',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbRpg

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '⚡ *sᴛᴀᴍɪɴᴀ*', body = 'Energi') {
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
    
    // 🔥 FIX: Ambil gambar dari URL
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

function createStaminaBar(current, max) {
    const filled = Math.round((current / max) * 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    
    if (!user.rpg) user.rpg = {}
    user.rpg.stamina = user.rpg.stamina ?? 100
    user.rpg.maxStamina = user.rpg.maxStamina || 100
    
    const subCmd = args[0]?.toLowerCase()
    
    if (subCmd === 'isi' || subCmd === 'restore' || subCmd === 'heal') {
        const potionCost = 5000
        
        if (user.rpg.stamina >= user.rpg.maxStamina) {
            return m.reply(`⚡ *sᴛᴀᴍɪɴᴀ ᴘᴇɴᴜʜ*\n\n> Stamina kamu sudah penuh!`)
        }
        
        if ((user.koin || 0) < potionCost) {
            return m.reply(
                `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Biaya: Rp ${potionCost.toLocaleString('id-ID')}\n` +
                `> Saldo: Rp ${(user.koin || 0).toLocaleString('id-ID')}`
            )
        }
        
        user.koin -= potionCost
        const restored = user.rpg.maxStamina - user.rpg.stamina
        user.rpg.stamina = user.rpg.maxStamina
        
        db.save()
        
        await m.react('⚡')
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo()
        
        return sock.sendMessage(m.chat, {
            text: `⚡ *sᴛᴀᴍɪɴᴀ ᴅɪɪsɪ*\n\n` +
                `╭┈┈⬡「 💊 *ʀᴇsᴛᴏʀᴇ* 」\n` +
                `┃ ⚡ Stamina: *+${restored}*\n` +
                `┃ 💵 Biaya: *-Rp ${potionCost.toLocaleString('id-ID')}*\n` +
                `┃ 📊 Sekarang: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡`,
            contextInfo: contextInfo
        }, { quoted: m })
    }
    
    const staminaBar = createStaminaBar(user.rpg.stamina, user.rpg.maxStamina)
    
    let txt = `⚡ *sᴛᴀᴍɪɴᴀ sᴛᴀᴛᴜs*\n\n`
    txt += `╭┈┈⬡「 📊 *ɪɴꜰᴏ* 」\n`
    txt += `┃ ⚡ Stamina: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n`
    txt += `┃ 📊 [${staminaBar}]\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Isi stamina: \`${m.prefix}stamina isi\` (Rp 5.000)\n`
    txt += `> Stamina pulih otomatis setiap jam`
    
    // 🔥 FIX: await getContextInfo
    const contextInfo = await getContextInfo()
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: contextInfo
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}