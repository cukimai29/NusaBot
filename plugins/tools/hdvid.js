const videoenhancer = require('../../src/scraper/hdvid')
const sharp = require('sharp')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'hdvid',
    alias: ['hdvideo', 'enhancevid', 'hdv'],
    category: 'tools',
    description: 'Meningkatkan kualitas video menjadi HD dengan AI',
    usage: '.hdvid (reply video)',
    example: '.hdvid',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energi: 3,
    isEnabled: true
}

const WAIT_MESSAGES = [
    `💕 *Zero Two:* Aku lagi ngubah video kamu jadi lebih HD, Darling~ tunggu sebentar ya 🥰`,
    `🌸 *Zero Two:* Sedang memproses video dengan AI, jangan kemana-mana dulu yaa~ ✨`,
    `💫 *Zero Two:* Video kamu lagi aku poles biar makin jernih... sabar ya Darling 💗`,
    `🦋 *Zero Two:* Darling, ini butuh sedikit waktu... hasilnya bakal worth it kok! 💖`,
    `🎀 *Zero Two:* Lagi ngasih sentuhan spesial buat video kamu, bentar lagi selesai~ 😘`,
    `💗 *Zero Two:* Hmm... videonya lagi di-enhance nih, Darling. Tunggu yaaa 💕`
]

const SUCCESS_MESSAGES = [
    `💕 *Zero Two:* Ini dia videonya Darling~ udah lebih HD! Puas? 🥰`,
    `🌸 *Zero Two:* Hasilnya udah jadi! Semoga suka ya, Darling ✨`,
    `💫 *Zero Two:* Tadaa~ video kamu sekarang lebih keren! 💗`,
    `🦋 *Zero Two:* Selesai Darling! Coba liat hasilnya, lebih bagus kan? 💖`,
    `🎀 *Zero Two:* Nah ini dia~ videonya udah aku poles biar makin cakep 😘`
]

function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)]
}

async function handler(m, { sock }) {
    const quoted = m.quoted || m
    const mime = quoted.mimetype || quoted.msg?.mimetype || ''
    
    if (!mime) {
        return m.reply(
            `💕 *ʜᴅ ᴠɪᴅᴇᴏ ᴇɴʜᴀɴᴄᴇʀ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n` +
            `┃\n` +
            `┃ ✦ Reply video yang mau di-HD-kan\n` +
            `┃ ✦ Ketik \`${m.prefix}hdvid\`\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n` +
            `💗 *Zero Two:* Aku bisa bikin video kamu jadi lebih jernih, Darling~\n` +
            `📌 *Catatan:* Proses membutuhkan waktu 30-60 detik\n` +
            `💎 *Fitur Premium*`
        )
    }
    
    if (!/video\/(mp4|mov|avi|mkv|3gp|webm)/.test(mime)) {
        return m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `💔 *Zero Two:* Maaf Darling, format \`${mime}\` gak bisa aku proses~\n` +
            `> Kirim video dengan format MP4 yaa 🥺`
        )
    }
    
    m.react('💕')
    
    const waitMsg = getRandomMessage(WAIT_MESSAGES)
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n${waitMsg}`)
    
    let inputPath = null
    
    try {
        const videoBuffer = await quoted.download?.()
        
        if (!videoBuffer || videoBuffer.length === 0) {
            m.react('💔')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `💔 *Zero Two:* Video nya gak bisa aku download, Darling~\n` +
                `> Coba kirim ulang videonya yaa 🥺`
            )
        }
        
        if (videoBuffer.length > 50 * 1024 * 1024) {
            m.react('💔')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `💔 *Zero Two:* Videonya kegedean Darling! Maksimal 50MB~\n` +
                `> Maaf ya 🥺`
            )
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        
        const timestamp = Date.now()
        inputPath = path.join(tempDir, `input_hd_${timestamp}.mp4`)
        
        fs.writeFileSync(inputPath, videoBuffer)
        
        const result = await videoenhancer(inputPath, '4k')
        
        if (!result || !result.output_url) {
            m.react('💔')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `💔 *Zero Two:* Maaf Darling, proses enhance video nya gagal~\n` +
                `> Coba lagi nanti yaa 🥺`
            )
        }
        
        let jpegThumbnail = null
        try {
            const thumbRes = await axios.get(result.input_url, { responseType: 'arraybuffer', timeout: 30000 })
            jpegThumbnail = await sharp(Buffer.from(thumbRes.data))
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer()
        } catch {}
        
        const videoRes = await axios.get(result.output_url, { 
            responseType: 'arraybuffer',
            timeout: 120000
        })
        
        const successMsg = getRandomMessage(SUCCESS_MESSAGES)
        
        await sock.sendMessage(m.chat, {
            document: Buffer.from(videoRes.data),
            mimetype: 'video/mp4',
            fileName: `hdvid_${timestamp}.mp4`,
            jpegThumbnail: jpegThumbnail || undefined,
            caption: `💕 *ᴢᴇʀᴏ ᴛᴡᴏ ʜᴅ ᴠɪᴅᴇᴏ* 💕\n\n${successMsg}`
        }, { quoted: m })
        
        m.react('💖')
        
    } catch (err) {
        console.error('[HDVID] Error:', err)
        m.react('💔')
        m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `💔 *Zero Two:* Ada masalah nih Darling~\n` +
            `> \`${err.message}\`\n\n` +
            `> Coba lagi nanti yaa 🥺💕`
        )
    } finally {
        if (inputPath && fs.existsSync(inputPath)) {
            setTimeout(() => {
                try { fs.unlinkSync(inputPath) } catch (e) {}
            }, 5000)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}