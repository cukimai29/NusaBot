const axios = require('axios')
const yts = require('yt-search')
const config = require('../../config')

const pluginConfig = {
    name: 'tebaklagu',
    alias: ['guesssong', 'tebaklirik'],
    category: 'game',
    description: 'Tebak lagu dari lirik',
    usage: '.tebaklagu',
    example: '.tebaklagu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 40,
    energi: 1,
    isEnabled: true
}

let activeGames = {}

async function getRandomSong() {
    const queries = ['pop indonesia', 'jpop', 'kpop', 'anime song', 'western pop']
    const query = queries[Math.floor(Math.random() * queries.length)]
    
    const results = await yts(query)
    const videos = results.videos.slice(0, 20)
    const randomVideo = videos[Math.floor(Math.random() * videos.length)]
    
    return {
        title: randomVideo.title,
        url: randomVideo.url,
        thumbnail: randomVideo.thumbnail
    }
}

function getLirikHint(title) {
    const words = title.split(' ')
    if (words.length <= 2) return title
    const hintWords = words.slice(0, Math.floor(words.length / 2))
    return hintWords.join(' ') + '...'
}

async function handler(m, { sock, db }) {
    const chatId = m.chat
    
    if (activeGames[chatId]) {
        return m.reply(`⏳ *ᴍᴀꜱɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ʏᴀɴɢ ʙᴇʀʟᴀɴɢꜱᴜɴɢ!*`)
    }
    
    m.react('🎵')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ʟᴀɢᴜ...*`)
    
    const song = await getRandomSong()
    const hint = getLirikHint(song.title)
    
    activeGames[chatId] = {
        jawaban: song.title.toLowerCase(),
        time: setTimeout(() => {
            if (activeGames[chatId]) {
                m.reply(`⏰ *ᴡᴀᴋᴛᴜ ʜᴀʙɪꜱ!*\n\n> Jawabannya: *${song.title}*`)
                delete activeGames[chatId]
            }
        }, 45000)
    }
    
    await sock.sendMessage(m.chat, {
        image: { url: song.thumbnail },
        caption: `🎵 *ᴛᴇʙᴀᴋ ʟᴀɢᴜ* 🎵\n\n` +
                `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                `┃ 📝 *ᴘᴇᴛᴜɴᴊᴜᴋ*:\n` +
                `┃ ${hint}\n` +
                `┃\n` +
                `┃ ⏱️ *ᴡᴀᴋᴛᴜ*: 45 detik\n` +
                `┃ 💰 *ʜᴀᴅɪᴀʜ*: 60 limit\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })
}

async function answerHandler(m, { sock, db }) {
    const chatId = m.chat
    const game = activeGames[chatId]
    
    if (!game) return false
    
    const userAnswer = m.text?.toLowerCase().trim()
    if (userAnswer === game.jawaban) {
        clearTimeout(game.time)
        delete activeGames[chatId]
        
        const user = db.getUser(m.sender)
        user.limit = (user.limit || 0) + 60
        db.setUser(m.sender, user)
        
        await m.reply(`🎉 *ʙᴇɴᴀʀ!*\n\n> Kamu dapat +60 limit! 🎁`)
        await m.react('🎉')
        return true
    }
    return false
}

module.exports = { config: pluginConfig, handler, answerHandler }