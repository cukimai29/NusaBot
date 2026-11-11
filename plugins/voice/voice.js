const config = require('../../config')

const pluginConfig = {
    name: 'voice',
    alias: ['ara', 'lopyou', 'loveyou'],
    category: 'voice',
    description: 'Audio response ara-ara & love you',
    usage: 'ketik ara atau loveyou',
    example: 'ara',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

const araAudioURLs = [
    "https://bucin-livid.vercel.app/audio/ara2.mp3",
    "https://bucin-livid.vercel.app/audio/ara.mp3",
    "https://bucin-livid.vercel.app/audio/audio_ara-ara.mp3"
]

const loveyouAudioURLs = [
    "https://bucin-livid.vercel.app/audio/lopyou.mp3",
    "https://xnuvers007.github.io/mp3/loveyoubaby.mp3",
]

async function handler(m, { sock }) {
    const text = m.text || ''
    
    if (text.match(/(ara ara|ara)/i)) {
        const randomAraAudio = araAudioURLs[Math.floor(Math.random() * araAudioURLs.length)]
        
        try {
            await sock.sendMessage(m.chat, {
                audio: { url: randomAraAudio },
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m })
        } catch (e) {
            console.log('[Voice] Gagal kirim audio ara:', e.message)
            await m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengirim audio!')
        }
    } else if (text.match(/(lopyou|lopyu|loveyou|love|lope|lupyu|iloveyou)/i)) {
        const randomLoveyouAudio = loveyouAudioURLs[Math.floor(Math.random() * loveyouAudioURLs.length)]
        
        try {
            await sock.sendMessage(m.chat, {
                audio: { url: randomLoveyouAudio },
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m })
        } catch (e) {
            console.log('[Voice] Gagal kirim audio loveyou:', e.message)
            await m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengirim audio!')
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}