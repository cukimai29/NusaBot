const config = require('../../config')
const fs = require('fs')
const path = require('path')
const generateCard = require('fake-ml')

const pluginConfig = {
    name: 'fakeml2',
    alias: ['fakecard', 'mlcard', 'mobilelegendcard', 'fakeaml'],
    category: 'canvas',
    description: 'Bikin fake card Mobile Legends (MLBB)',
    usage: '.fakeml2 <username> | <rank> | <border>',
    example: '.fakeml2 Ditzzx | imo | 11',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const DEFAULT_AVATAR = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg'

const RANK_LIST = {
    'warrior': 'Warrior',
    'elite': 'Elite',
    'master': 'Master',
    'grandmaster': 'Grandmaster',
    'epic': 'Epic',
    'legend': 'Legend',
    'mythic': 'Mythic',
    'glory': 'Mythic Glory',
    'honor': 'Mythic Honor',
    'imo': 'Immortal',
    'immortal': 'Immortal'
}

async function handler(m, { sock }) {
    let args = m.args || []
    let query = m.text || ''
    
    if (!query) {
        return m.reply(
            `💕 *ғᴀᴋᴇ ᴍʟ ᴄᴀʀᴅ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}fakeml2 <username> | <rank> | <border>\n` +
            `┃   ${m.prefix}fakeml2 <username> | <rank>\n` +
            `┃   ${m.prefix}fakeml2 <username>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}fakeml2 Ditzzx | imo | 11\n` +
            `┃   ${m.prefix}fakeml2 RzkyADS | legend | 5\n` +
            `┃   ${m.prefix}fakeml2 Darling | epic\n` +
            `┃\n` +
            `┃ ✦ *Rank yang tersedia*\n` +
            `┃   warrior, elite, master, grandmaster,\n` +
            `┃   epic, legend, mythic, glory, honor, imo\n` +
            `┃\n` +
            `┃ ✦ *Border* (1-20)\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau bikin card ML siapa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin fake ML card darling~ tunggu sebentar yaa 🎮`)
    
    try {
        let username = 'Zero Two'
        let rank = 'imo'
        let border = 11
        let avatar = DEFAULT_AVATAR
        
        if (query.includes('|')) {
            const parts = query.split('|')
            username = parts[0]?.trim() || 'Zero Two'
            if (parts[1]) {
                const rankInput = parts[1].trim().toLowerCase()
                rank = RANK_LIST[rankInput] || rankInput
            }
            if (parts[2]) {
                border = parseInt(parts[2].trim())
                if (isNaN(border)) border = 11
                if (border < 1) border = 1
                if (border > 20) border = 20
            }
        } else {
            username = query
        }
        
        if (username.length > 30) {
            username = username.substring(0, 27) + '...'
        }
        
        const result = await generateCard({
            avatar: avatar,
            username: username,
            rank: rank,
            border: border
        })
        
        if (!result) {
            m.react('💔')
            return m.reply(
                `💔 *ɢᴀɢᴀʟ*\n\n` +
                `> Gagal generate card ML\n\n` +
                `> Coba lagi ya darling~ 🥺`
            )
        }
        
        let imageBuffer
        if (Buffer.isBuffer(result)) {
            imageBuffer = result
        } else if (typeof result === 'string') {
            const axios = require('axios')
            const imgRes = await axios.get(result, { responseType: 'arraybuffer' })
            imageBuffer = Buffer.from(imgRes.data)
        } else if (result && typeof result === 'object') {
            if (result.image) {
                if (Buffer.isBuffer(result.image)) {
                    imageBuffer = result.image
                } else if (typeof result.image === 'string') {
                    const axios = require('axios')
                    const imgRes = await axios.get(result.image, { responseType: 'arraybuffer' })
                    imageBuffer = Buffer.from(imgRes.data)
                }
            } else if (result.url) {
                const axios = require('axios')
                const imgRes = await axios.get(result.url, { responseType: 'arraybuffer' })
                imageBuffer = Buffer.from(imgRes.data)
            }
        }
        
        if (!imageBuffer) {
            m.react('💔')
            return m.reply(
                `💔 *ɢᴀɢᴀʟ*\n\n` +
                `> Hasil generate tidak valid\n\n` +
                `> Coba lagi ya darling~ 🥺`
            )
        }
        
        const rankDisplay = typeof rank === 'string' && rank.length > 15 ? rank.substring(0, 12) + '...' : rank
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `💕 *ғᴀᴋᴇ ᴍʟ ᴄᴀʀᴅ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ ✅ *ʙᴇʀʜᴀꜱɪʟ*\n` +
                    `┃\n` +
                    `┃ 👤 *ᴜꜱᴇʀɴᴀᴍᴇ*: ${username}\n` +
                    `┃ 🏆 *ʀᴀɴᴋ*: ${rankDisplay}\n` +
                    `┃ 🖼️ *ʙᴏʀᴅᴇʀ*: ${border}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini card ML nya darling~ keren kan? 🎮\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[FakeML2] Error:', err)
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