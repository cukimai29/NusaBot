const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'randomwaifu',
    alias: ['animepic', 'waifuimg', 'animeimage', 'cariwaifu'],
    category: 'fun',
    description: 'Cari gambar waifu random (SFW/NSFW)',
    usage: '.waifu',
    example: '.waifu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const NSFW = true
const PAGE_SIZE = 3

async function handler(m, { sock }) {
    try {
        const params = new URLSearchParams({
            isNsfw: String(NSFW),
            orderBy: 'Random',
            page: '1',
            pageSize: String(PAGE_SIZE)
        })

        const res = await axios.get(
            `https://api.waifu.im/images?${params}`,
            {
                timeout: 30000,
                validateStatus: () => true
            }
        )

        if (res.status !== 200 || !res.data || !res.data.items) {
            return m.reply(
                `❌ *Gagal mengambil gambar!*\n\n` +
                `> "He~ API lagi error nih darling~ 🗿"\n\n` +
                `💬 Coba lagi nanti ya~ 🌸`
            )
        }

        const images = res.data.items.map(item => item.url).filter(Boolean)

        if (images.length === 0) {
            return m.reply(
                `😅 *Gak ada gambar!*\n\n` +
                `> "Wah~ lagi kosong nih darling~ 🗿"\n\n` +
                `💬 Coba lagi nanti ya~ 🌸`
            )
        }

        const mode = NSFW ? '🔞 NSFW' : '🌸 SFW'
        const total = images.length

        let caption = `🌸 *WAIFU GALLERY* 🌸\n\n`
        caption += `📊 *Mode:* ${mode}\n`
        caption += `📸 *Total:* ${total} gambar\n\n`
        caption += `💬 *Zero Two:* "Ini dia darling~ 🗿"\n`
        caption += `🌸 *Enjoy!* 🌸`

        // Kirim semua gambar
        for (let i = 0; i < images.length; i++) {
            try {
                const imgRes = await axios.get(images[i], {
                    responseType: 'arraybuffer',
                    timeout: 15000
                })

                const isLast = i === images.length - 1
                const imgCaption = isLast ? caption : null

                await sock.sendMessage(m.chat, {
                    image: Buffer.from(imgRes.data),
                    caption: imgCaption
                }, { quoted: m })

            } catch (err) {
                console.error(`[Waifu] Gagal download gambar ${i+1}:`, err.message)
                // Kirim link kalau gagal download
                if (i === images.length - 1) {
                    await m.reply(
                        `${caption}\n\n` +
                        `⚠️ *Beberapa gambar gagal dimuat, tapi linknya ada di bawah:*\n\n` +
                        images.map((url, idx) => `${idx+1}. ${url}`).join('\n')
                    )
                }
            }
        }

    } catch (err) {
        console.error('[Waifu Error]', err)
        await m.reply(
            `❌ *Error!*\n\n` +
            `> "He~ ada yang salah nih darling~ 🗿"\n\n` +
            `📝 *Error:* ${err.message}\n\n` +
            `💬 Coba lagi nanti ya~ 🌸`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}