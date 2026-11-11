const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'douyin',
    alias: ['dy', 'douyindl', 'douyindownload'],
    category: 'download',
    description: 'Download video dari Douyin (TikTok China)',
    usage: '.douyin <url>',
    example: '.douyin https://v.douyin.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim() || m.args[0]
    
    if (!url) {
        return m.reply(
            `💕 *ᴅᴏᴜʏɪɴ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}douyin <url>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}douyin https://v.douyin.com/xxx\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau download video Douyin apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi mengambil video Douyin darling~ tunggu sebentar yaa 🎬`)
    
    try {
        const response = await axios.get(`https://api.diioffc.web.id/api/download/douyin?url=${encodeURIComponent(url)}`)
        const result = response.data
        
        if (!result || !result.result) {
            throw new Error('Gagal mendapatkan data')
        }
        
        const videoUrl = result.result.Video_HD || result.result.Video_SD || result.result.Video
        const audioUrl = result.result.Audio
        const description = result.result.description || 'Douyin Video'
        
        if (!videoUrl) {
            throw new Error('Video URL tidak ditemukan')
        }
        
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `💕 *ᴅᴏᴜʏɪɴ ᴠɪᴅᴇᴏ* 💕\n\n` +
                    `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                    `┃ 📝 *ᴅᴇꜱᴄʀɪᴘꜱɪ*:\n` +
                    `┃ ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n` +
                    `┃\n` +
                    `┃ 💗 *Zero Two:* Ini video nya darling~ 🎬\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m })
        
        if (audioUrl) {
            setTimeout(async () => {
                await sock.sendMessage(m.chat, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: m })
            }, 2000)
        }
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Douyin] Error:', err)
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