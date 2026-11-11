const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'carbon',
    alias: ['carbonapi', 'carboncode', 'codesnap'],
    category: 'maker',
    description: 'Bikin screenshot kode aesthetic seperti Carbon.now.sh (via API)',
    usage: '.carbon <kode> (atau reply pesan)',
    example: '.carbon console.log("Hello Darling!")',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let code = m.args.join(' ') || m.text?.trim() || ''
    
    if (m.quoted) {
        code = m.quoted.text || m.quoted.body || code
    }
    
    if (!code || code.length < 3) {
        return m.reply(
            `💕 *ᴄᴀʀʙᴏɴ ᴄᴏᴅᴇ ꜱɴᴀᴘꜱʜᴏᴛ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}carbon <kode>\n` +
            `┃   atau reply pesan dengan .carbon\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}carbon console.log("Hello")\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau bikin screenshot kode apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin screenshot kode darling~ tunggu sebentar yaa 🎨`)
    
    try {
        const response = await axios({
            url: 'https://carbonara.solopov.dev/api/cook',
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: { code: code },
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `💕 *ᴄᴀʀʙᴏɴ ᴄᴏᴅᴇ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃ 📝 *ᴋᴏᴅᴇ*: ${code.length > 50 ? code.substring(0, 50) + '...' : code}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini hasilnya darling~ 📸\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Carbon API] Error:', err)
        m.react('💔')
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> ${err.message}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}