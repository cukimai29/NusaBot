const { getDatabase } = require('../../src/lib/database')
const { getGroupMode } = require('../group/botmode')
const { fetchGroupsSafe } = require('../../src/lib/jpmHelper')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const fs = require('fs')

// 🔥 HAPUS TOP-LEVEL cachedThumb

const pluginConfig = {
    name: 'jpm',
    alias: ['jasher', 'jaser'],
    category: 'jpm',
    description: 'Kirim pesan ke semua grup (JPM)',
    usage: '.jpm <pesan>',
    example: '.jpm Halo semuanya!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '📢 ᴊᴘᴍ', body = 'Jasa Pesan Massal') {
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
        const cachedThumb = await loadImage('zerotwo2.jpg')
        if (cachedThumb) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: cachedThumb,
                sourceUrl: config.saluran?.link || '',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (m.isGroup) {
        const groupMode = getGroupMode(m.chat, db)
        if (groupMode !== 'md') {
            return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> JPM hanya tersedia di mode MD\n\n\`${m.prefix}botmode md\``)
        }
    }
    
    const text = m.fullArgs?.trim() || m.text?.trim()
    if (!text) {
        return m.reply(
            `📢 *ᴊᴘᴍ (ᴊᴀsᴀ ᴘᴇsᴀɴ ᴍᴀssᴀʟ)*\n\n` +
            `> Masukkan pesan yang ingin dikirim ke semua grup\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `\`${m.prefix}jpm Halo semuanya!\`\n\n` +
            `> Bisa juga dengan gambar (reply gambar)`
        )
    }
    
    if (global.statusjpm) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> JPM sedang berjalan. Ketik \`${m.prefix}stopjpm\` untuk menghentikan.`)
    }
    
    m.react('📢')
    
    try {
        let mediaBuffer = null
        let mediaType = null
        const qmsg = m.quoted || m
        
        if (qmsg.isImage) {
            try {
                mediaBuffer = await qmsg.download()
                mediaType = 'image'
            } catch (e) {}
        } else if (qmsg.isVideo) {
            try {
                mediaBuffer = await qmsg.download()
                mediaType = 'video'
            } catch (e) {}
        }
        
        const allGroups = await fetchGroupsSafe(sock)
        let groupIds = Object.keys(allGroups)
        
        const blacklist = db.setting('jpmBlacklist') || []
        const blacklistedCount = groupIds.filter(id => blacklist.includes(id)).length
        groupIds = groupIds.filter(id => !blacklist.includes(id))
        
        if (groupIds.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada grup yang ditemukan${blacklistedCount > 0 ? ` (${blacklistedCount} grup di-blacklist)` : ''}`)
        }
        
        const jedaJpm = db.setting('jedaJpm') || 5000
        
        // 🔥 FIX: await getContextInfo
        const contextInfoStart = await getContextInfo('📢 ᴊᴘᴍ', 'Sending...')

        await sock.sendMessage(m.chat, {
            text: `📢 *ᴊᴘᴍ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
                `┃ 📷 ᴍᴇᴅɪᴀ: \`${mediaBuffer ? mediaType : 'Tidak'}\`\n` +
                `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` grup\n` +
                `┃ ⏱️ ᴊᴇᴅᴀ: \`${jedaJpm}ms\`\n` +
                `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((groupIds.length * jedaJpm) / 60000)} menit\`\n` +
                `╰┈┈⬡\n\n` +
                `> Memulai JPM ke semua grup...`,
            contextInfo: contextInfoStart
        }, { quoted: m })
        
        global.statusjpm = true
        let successCount = 0
        let failedCount = 0
        
        // 🔥 FIX: await getContextInfo buat loop
        const contextInfo = await getContextInfo('📢 ᴊᴘᴍ', config.bot?.name || 'zerotwo')
        
        for (const groupId of groupIds) {
            if (global.stopjpm) {
                delete global.stopjpm
                delete global.statusjpm
                
                const contextInfoStop = await getContextInfo('⏹️ ᴅɪʜᴇɴᴛɪᴋᴀɴ')

                await sock.sendMessage(m.chat, {
                    text: `⏹️ *ᴊᴘᴍ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                        `╭┈┈⬡「 📊 *sᴛᴀᴛᴜs* 」\n` +
                        `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
                        `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
                        `┃ ⏸️ sɪsᴀ: \`${groupIds.length - successCount - failedCount}\`\n` +
                        `╰┈┈⬡`,
                    contextInfo: contextInfoStop
                }, { quoted: m })
                return
            }
            
            try {
                if (mediaBuffer) {
                    await sock.sendMessage(groupId, {
                        [mediaType]: mediaBuffer,
                        caption: text,
                        contextInfo
                    })
                } else {
                    await sock.sendMessage(groupId, { 
                        text: text, 
                        contextInfo 
                    })
                }
                successCount++
            } catch (err) {
                failedCount++
            }
            
            await new Promise(resolve => setTimeout(resolve, jedaJpm))
        }
        
        delete global.statusjpm
        
        m.react('✅')
        
        // 🔥 FIX: await getContextInfo buat laporan akhir
        const contextInfoDone = await getContextInfo('✅ sᴇʟᴇsᴀɪ', `${successCount}/${groupIds.length}`)

        await sock.sendMessage(m.chat, {
            text: `✅ *ᴊᴘᴍ sᴇʟᴇsᴀɪ*\n\n` +
                `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
                `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
                `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
                `┃ 📊 ᴛᴏᴛᴀʟ: \`${groupIds.length}\`\n` +
                `╰┈┈⬡`,
            contextInfo: contextInfoDone
        }, { quoted: m })
        
    } catch (error) {
        delete global.statusjpm
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}