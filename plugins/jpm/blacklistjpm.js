const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const fs = require("fs")
const path = require('path')

const pluginConfig = {
    name: 'blacklistjpm',
    alias: ['bljpm', 'jpmbl', 'jpmblacklist'],
    category: 'jpm',
    description: 'Blacklist grup dari JPM dengan interactive buttons',
    usage: '.blacklistjpm',
    example: '.blacklistjpm',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    let blacklist = db.setting('jpmBlacklist') || []
    
    if (action === 'add' && args[1]?.includes('@g.us')) {
        const targetGroup = args[1]
        if (blacklist.includes(targetGroup)) {
            return m.reply(`❌ Grup sudah ada di blacklist!`)
        }
        blacklist.push(targetGroup)
        db.setting('jpmBlacklist', blacklist)
        m.react('🚫')
        
        let groupName = targetGroup
        try {
            const meta = await sock.groupMetadata(targetGroup)
            groupName = meta.subject
        } catch (e) {}
        
        return m.reply(
            `🚫 *ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ᴋᴇ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
            `> Grup: \`${groupName}\`\n` +
            `> Total: \`${blacklist.length}\` grup`
        )
    }
    
    if (action === 'del' && args[1]?.includes('@g.us')) {
        const targetGroup = args[1]
        const index = blacklist.indexOf(targetGroup)
        if (index === -1) {
            return m.reply(`❌ Grup tidak ada di blacklist!`)
        }
        blacklist.splice(index, 1)
        db.setting('jpmBlacklist', blacklist)
        m.react('✅')
        
        let groupName = targetGroup
        try {
            const meta = await sock.groupMetadata(targetGroup)
            groupName = meta.subject
        } catch (e) {}
        
        return m.reply(
            `✅ *ᴅɪʜᴀᴘᴜs ᴅᴀʀɪ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
            `> Grup: \`${groupName}\`\n` +
            `> Sisa: \`${blacklist.length}\` grup`
        )
    }
    
    if (action === 'list') {
        if (blacklist.length === 0) {
            return m.reply(`📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n> Tidak ada grup yang di-blacklist`)
        }
        
        let listText = `📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n> Total: \`${blacklist.length}\` grup\n\n`
        
        for (let i = 0; i < blacklist.length; i++) {
            const groupId = blacklist[i]
            try {
                const meta = await sock.groupMetadata(groupId)
                listText += `${i + 1}. ${meta.subject}\n`
            } catch (e) {
                listText += `${i + 1}. Unknown Group\n`
            }
        }
        
        return m.reply(listText)
    }
    
    m.react('📋')
    await m.reply(`⏳ *ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ ɢʀᴜᴘ...*`)
    
    try {
        global.isFetchingGroups = true
        const allGroups = await sock.groupFetchAllParticipating()
        global.isFetchingGroups = false
        const groupIds = Object.keys(allGroups)
        
        if (groupIds.length === 0) {
            return m.reply(`❌ Tidak ada grup yang ditemukan`)
        }
        
        const rows = []
        
        for (const groupId of groupIds) {
            const group = allGroups[groupId]
            const isBlacklisted = blacklist.includes(groupId)
            const statusIcon = isBlacklisted ? '🚫' : '✅'
            
            rows.push({
                title: `${statusIcon} ${group.subject.substring(0, 24)}`,
                description: isBlacklisted ? 'Blacklisted - Klik untuk unblacklist' : 'Klik untuk blacklist',
                id: isBlacklisted ? `${m.prefix}blacklistjpm del ${groupId}` : `${m.prefix}blacklistjpm add ${groupId}`
            })
        }
        
        const caption = `📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ ᴍᴀɴᴀɢᴇʀ*\n\n` +
            `> Total grup: \`${groupIds.length}\`\n` +
            `> Blacklisted: \`${blacklist.length}\`\n\n` +
            `🚫 = Blacklisted\n` +
            `✅ = Aktif (akan menerima JPM)\n\n` +
            `_Pilih grup untuk toggle blacklist_`
        
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

        // 🔥 FIX: Ambil gambar dari URL
        let imageBuffer = null
        try {
            imageBuffer = await loadImage('zerotwo2.jpg')
        } catch (e) {}
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer, // 🔥 Pake buffer dari URL
            caption: caption,
            footer: config.bot?.name || 'zerotwo MD',
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            },
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 Pilih Grup',
                        sections: [{
                            title: `Daftar Grup (${groupIds.length})`,
                            rows: rows
                        }]
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📊 Lihat List Blacklist',
                        id: `${m.prefix}blacklistjpm list`
                    })
                }
            ]
        }, { quoted: m })
        
    } catch (error) {
        global.isFetchingGroups = false
        m.react('❌')
        m.reply(`❌ Error: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}