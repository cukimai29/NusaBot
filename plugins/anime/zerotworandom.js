const { fetchVideo } = require('../../src/scraper/video-random-zerotwo')

const pluginConfig = {
    name: 'randomzerotwo',
    alias: ['rz','random02','zerotwo'],
    category: 'anime',
    description: 'Random video Zero Two 😈',
    usage: '.randomzerotwo',
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {

    const captionList = [
        'Ara ara~ kamu suka yang ini ya? 😈',
        'Aku pilihkan yang terbaik buat kamu 💗',
        'Jangan lihat yang lain... cukup aku aja 😏',
        'Video ini cuma buat kamu loh darling~ 💕',
        'Kalau kamu pergi... aku marah 😈'
    ]

    const caption = captionList[Math.floor(Math.random() * captionList.length)]

    try {

        m.react('⏳')

        let videoBuffer = null

        // 🔥 RETRY SYSTEM (biar gak gagal sekali langsung mati)
        for (let i = 0; i < 3; i++) {
            try {
                videoBuffer = await fetchVideo()
                if (videoBuffer && videoBuffer.length > 10000) break
            } catch {}
        }

        // ❌ kalau tetap gagal
        if (!videoBuffer || videoBuffer.length < 10000) {
            throw new Error('Video kosong / gagal diambil')
        }

        m.react('📤')

        // 🔥 CEK SIZE (WA limit ±16–64MB tergantung device)
        const sizeMB = videoBuffer.length / (1024 * 1024)

        // =========================
        // 🧠 MODE SMART SEND
        // =========================

        if (sizeMB > 15) {
            // ❗ terlalu besar → kirim sebagai document
            await sock.sendMessage(m.chat, {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `zerotwo_${Date.now()}.mp4`
            }, { quoted: m })

        } else {
            // ✅ normal → kirim sebagai video
            await sock.sendMessage(m.chat, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: `╭━━━〔 💗 ZERO TWO RANDOM 💗 〕━━━⬣
┃
┃ ${caption}
┃
╰━━━━━━━━━━━━━━━━━━⬣`
            }, { quoted: m })
        }

        m.react('✅')

    } catch (err) {

        console.log(err)

        m.react('❌')

        m.reply(
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃
┃ Gagal ambil video 😢
┃
┃ Kemungkinan:
┃ • Link mati
┃ • Server lambat
┃ • Video terlalu besar
┃
┃ Coba lagi ya darling 💕
╰━━━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}