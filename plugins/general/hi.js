const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'halo',
    alias: ['hi','hai','woi','min','kont','ht','yo','yoo','p','bg','bang'],
    category: 'general',
    description: 'Zero Two Chaos Reply (Preview Only)',
    usage: '.halo',
    cooldown: 2,
    isEnabled: true
}

const IMG_DIR = path.join(process.cwd(), 'assets/foto-zerotwo-random')

// 📸 ambil gambar random
function getRandomImage() {
    if (!fs.existsSync(IMG_DIR)) return null

    const files = fs.readdirSync(IMG_DIR)
    const images = files.filter(f =>
        ['.jpg','.jpeg','.png','.webp'].includes(path.extname(f).toLowerCase())
    )

    if (!images.length) return null

    const pick = images[Math.floor(Math.random() * images.length)]
    return path.join(IMG_DIR, pick)
}

async function handler(m, { sock }) {

    // ❌ wajib prefix
    if (!m.isCommand) return

    const name = m.pushName || 'User'

    const responses = [

        // basic
        `Halo ${name} 👋`,
        `Hai ${name} 😄`,
        `Yo ${name} 🔥`,
        `Yoo ${name} 😈`,
        `Woi ${name} 🗿`,
        `Ada apa ${name}? 🤨`,

        // santai
        `Ngapain manggil gw ${name} 😒`,
        `Lu kangen ya ${name}? 🗿`,
        `Santai napa ${name} 😤`,
        `Baru nongol lu ${name} 😏`,
        `Gw denger kok ${name} 😎`,

        // zero two vibe
        `Hmm ${name}... manggil aku? 💗`,
        `Darling ${name} 😈`,
        `Aku di sini kok ${name} 💕`,
        `Jangan kangen terus ${name} 😏`,
        `Ara ara~ ${name} 😈`,

        // chaos
        `P apaan sih ${name} 🗿`,
        `HT kont apaan dah 😭`,
        `Random banget lu ${name} 😭`,
        `Lu kenapa dah ${name} 🗿`,
        `Heh ${name} 😤`,

        // toxic ringan
        `Iya ${name} sabar napa 🗿`,
        `Gak usah panik ${name} 😒`,
        `Gw bukan jin ${name} 🗿`,
        `Dipanggil mulu ${name} 😤`,

        // extra
        `Butuh apa ${name}? 😏`,
        `Gw standby kok ${name} 😎`,
        `Kangen bot ya ${name}? 😈`,
        `Ngapain lagi ${name}?`,
        `Udah makan belum ${name}? 🍜`,
        `Lu gabut ya ${name}? 🗿`,
        `Mode chaos aktif 😈`
    ]

    let caption = responses[Math.floor(Math.random() * responses.length)]

    // 🔥 soft promo
    if (Math.random() < 0.25) {
        caption += `\n\n> 💗 Join saluran biar gak kudet 😈`
    }

    const img = getRandomImage()

    await sock.sendMessage(m.chat, {
        text: caption,
        contextInfo: {
            externalAdReply: {
                title: '💗 NusaBot',
                body: 'Mode Chaos 😈',
                thumbnail: img ? fs.readFileSync(img) : null,
                sourceUrl: 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
