const config = {
    name: 'mlstalk',
    alias: ['ml', 'mobilelegends', 'stalkml'],
    category: 'search',
    description: 'Stalk akun Mobile Legends',
    usage: '.mlstalk <id> <server>',
    example: '.mlstalk 1264042367 15139',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const REGION_MAP = {
    "1": "Indonesia", "2": "Indonesia", "3": "Indonesia", "4": "Indonesia",
    "5": "Indonesia", "6": "Indonesia", "7": "Indonesia", "8": "Indonesia", "9": "Indonesia",
    "10": "Malaysia / SG / BN", "11": "Philippines", "12": "Thailand",
    "13": "Vietnam", "14": "Cambodia", "15": "Myanmar", "16": "Laos",
    "17": "Timor-Leste", "19": "Middle East", "20": "North America",
    "21": "Europe", "22": "South America"
}

function getRegion(serverId) {
    const s = String(serverId)
    return REGION_MAP[s.slice(0, 2)] ?? REGION_MAP[s.slice(0, 1)] ?? "Unknown"
}

async function stalkML(userId, serverId) {
    const axios = require('axios')
    
    try {
        const response = await axios.get(
            `https://api.isan.eu.org/nickname/ml?id=${userId}&server=${serverId}`,
            {
                headers: {
                    "User-Agent": "StalkML/1.0",
                    "Accept": "application/json"
                },
                timeout: 15000,
                validateStatus: () => true
            }
        )
        
        if (response.data?.success && response.data?.name) {
            return {
                success: true,
                statusCode: response.status,
                username: response.data.name
            }
        } else {
            return {
                success: false,
                statusCode: response.status,
                username: null,
                message: response.data?.message || "User tidak ditemukan"
            }
        }
    } catch (error) {
        return {
            success: false,
            statusCode: error.response?.status || 500,
            username: null,
            message: error.message
        }
    }
}

async function handler(m) {
    const args = m.text?.trim().split(/\s+/)
    const userId = args[0]
    const serverId = args[1]
    
    if (!userId || !serverId) {
        return m.reply(`🎮 *ᴍᴏʙɪʟᴇ ʟᴇɢᴇɴᴅꜱ ꜱᴛᴀʟᴋᴇʀ*\n\n> Cari username akun ML\n\n> Contoh: .mlstalk 1264042367 15139\n\n📝 *Info:*\n> • ID: ID akun Mobile Legends\n> • Server: Server ID (contoh: 15139)\n> • Region akan otomatis terdeteksi dari server`)
    }
    
    if (!/^\d+$/.test(userId) || !/^\d+$/.test(serverId)) {
        return m.reply(`❌ *ID tidak valid!*\n\n> ID dan Server harus berupa angka.\n> Contoh: .mlstalk 1264042367 15139`)
    }
    
    await m.reply(`⏳ *Mencari akun ML...*\n> 🆔 ID: ${userId}\n> 🖥️ Server: ${serverId}`)
    
    const result = await stalkML(userId, serverId)
    const region = getRegion(serverId)
    
    if (!result.success || !result.username) {
        let errorMsg = `❌ *AKUN TIDAK DITEMUKAN*\n\n`
        errorMsg += `╭──〔 📋 *ɪɴꜰᴏ ᴘᴇɴᴄᴀʀɪᴀɴ* 〕───⬣\n`
        errorMsg += `│  🆔 ID: ${userId}\n`
        errorMsg += `│  🖥️ Server: ${serverId}\n`
        errorMsg += `│  🌏 Region: ${region}\n`
        errorMsg += `╰────────────────⬣\n\n`
        errorMsg += `> 💡 Pastikan ID dan server benar, Darling~\n> Atau coba cek akunnya di Mobile Legends dulu.`
        return m.reply(errorMsg)
    }
    
    let txt = `🎮 *ᴍᴏʙɪʟᴇ ʟᴇɢᴇɴᴅꜱ ꜱᴛᴀʟᴋᴇʀ*\n\n`
    txt += `╭──〔 📋 *ʜᴀꜱɪʟ* 〕───⬣\n`
    txt += `│  🆔 ID: ${userId}\n`
    txt += `│  🖥️ Server: ${serverId}\n`
    txt += `│  🌏 Region: ${region}\n`
    txt += `│  👤 Username: *${result.username}*\n`
    txt += `╰────────────────⬣\n\n`
    txt += `> 💡 Cara add teman: \`${result.username}\` (${userId}@${serverId})`
    
    await m.reply(txt)
}

module.exports = {
    config,
    handler
}