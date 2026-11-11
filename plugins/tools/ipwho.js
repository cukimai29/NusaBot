const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'ipwho',
    alias: ['ip', 'iplookup', 'ipinfo'],
    category: 'tools',
    description: 'Lookup informasi IP address',
    usage: '.ipwho <ip>',
    example: '.ipwho 8.8.8.8',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbTools

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '🌐 *ɪᴘ ʟᴏᴏᴋᴜᴘ*', body = 'IP Information') {
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
        const thumbTools = await loadImage('zerotwo-games.jpg')
        if (thumbTools) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: thumbTools,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const ip = m.args?.[0]
    
    if (!ip) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}ipwho <ip>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}ipwho 8.8.8.8\``
        )
    }
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
        return m.reply(`❌ *ғᴏʀᴍᴀᴛ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Contoh: \`8.8.8.8\``)
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ɪɴꜰᴏ ɪᴘ...*`)
    
    try {
        const res = await fetch(`https://ipwho.is/${ip}`)
        const data = await res.json()
        
        if (!data.success) {
            await m.react('❌')
            return m.reply(`❌ *ɪᴘ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> IP ${ip} tidak valid`)
        }
        
        if (data.latitude && data.longitude) {
            await sock.sendMessage(m.chat, {
                location: {
                    degreesLatitude: data.latitude,
                    degreesLongitude: data.longitude
                }
            }, { quoted: m })
        }
        
        const text = `🌐 *ɪᴘ ʟᴏᴏᴋᴜᴘ*\n\n` +
            `╭┈┈⬡「 📍 *ʟᴏᴋᴀsɪ* 」\n` +
            `┃ 🔢 IP: ${data.ip}\n` +
            `┃ 🌍 Country: ${data.country} ${data.country_code}\n` +
            `┃ 🏙️ City: ${data.city || '-'}\n` +
            `┃ 📍 Region: ${data.region || '-'}\n` +
            `┃ 🌐 Continent: ${data.continent || '-'}\n` +
            `┃ 📮 Postal: ${data.postal || '-'}\n` +
            `┃ ⏰ Timezone: ${data.timezone?.id || '-'}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🔌 *ᴋᴏɴᴇᴋsɪ* 」\n` +
            `┃ 🏢 ISP: ${data.connection?.isp || '-'}\n` +
            `┃ 🌐 ORG: ${data.connection?.org || '-'}\n` +
            `┃ 📡 ASN: ${data.connection?.asn || '-'}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🛡️ *sᴇᴄᴜʀɪᴛʏ* 」\n` +
            `┃ 🔒 VPN: ${data.security?.vpn ? '✅ Yes' : '❌ No'}\n` +
            `┃ 🌐 Proxy: ${data.security?.proxy ? '✅ Yes' : '❌ No'}\n` +
            `┃ 🤖 Tor: ${data.security?.tor ? '✅ Yes' : '❌ No'}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.react('✅')
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🌐 *ɪᴘ ʟᴏᴏᴋᴜᴘ*', data.country)
        
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: contextInfo
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}