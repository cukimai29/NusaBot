const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const pluginConfig = {
    name: 'npm',
    alias: ['npmsearch', 'npmjs', 'npmfind'],
    category: 'search',
    description: 'Search package di NPM registry',
    usage: '.npm <query>',
    example: '.npm axios',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbTools

async function getInteractiveContextInfo(sock, title = '📦 *ɴᴘᴍ sᴇᴀʀᴄʜ*', body = 'Package registry') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    // 🔥 FIX: Ambil gambar dari URL
    let mediaAttachment = null
    try {
        const thumbTools = await loadImage('zerotwo-games.jpg')
        if (thumbTools) {
            mediaAttachment = await prepareWAMessageMedia(
                { image: thumbTools },
                { upload: sock.waUploadToServer }
            )
        }
    } catch (e) {
        console.log('[NPM] Gagal upload gambar:', e.message)
    }

    return generateWAMessageFromContent('', {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: '📦 NPM SEARCH',
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: body
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `📦 ${config.bot?.name || 'NusaBot'}`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🔍 Cari Lagi',
                                    id: '.npm'
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 Menu',
                                    id: '.menu'
                                })
                            }
                        ]
                    }),
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
        }
    }, {})
}

async function handler(m, { sock }) {
    const query = m.args?.join(' ')
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}npm <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}npm axios\``
        )
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ᴘᴀᴄᴋᴀɢᴇ...*`)
    
    try {
        const res = await fetch(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}&size=10`)
        const data = await res.json()
        
        if (!data.objects || data.objects.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Package "${query}" tidak ditemukan`)
        }
        
        let text = `📦 *ɴᴘᴍ sᴇᴀʀᴄʜ*\n\n`
        text += `> Query: \`${query}\`\n`
        text += `> Found: ${data.total} packages\n\n`
        
        data.objects.slice(0, 8).forEach((item, i) => {
            const pkg = item.package
            const score = Math.round((item.score?.final || 0) * 100)
            
            text += `╭┈┈⬡「 ${i + 1}. *${pkg.name}* 」\n`
            text += `┃ 📌 v${pkg.version}\n`
            if (pkg.description) {
                text += `┃ 📝 ${pkg.description.slice(0, 50)}${pkg.description.length > 50 ? '...' : ''}\n`
            }
            text += `┃ 🔗 ${pkg.links?.npm || '-'}\n`
            if (pkg.author?.name) {
                text += `┃ 👤 ${pkg.author.name}\n`
            }
            text += `┃ ⭐ Score: ${score}%\n`
            text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        })
        
        await m.react('✅')
        
        // 🔥 FIX: Panggil getInteractiveContextInfo buat dapet message object
        const interactiveMsg = await getInteractiveContextInfo(
            sock, 
            '📦 NPM SEARCH', 
            `${text}`
        )
        
        // 🔥 FIX: relayMessage harus kirim .message
        await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}