const { pinterest } = require('btch-downloader')
const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'pins',
    alias: ['pinsearch', 'pinterestsearch'],
    category: 'search',
    description: 'Cari gambar di Pinterest (kirim sekaligus jadi satu album)',
    usage: '.pins <query>|<jumlah>',
    example: '.pins Zero Two|5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const input = m.text?.trim() || ''

    if (!input) {
        return m.reply(
            `╭━━━〔 🔍 PINTEREST SEARCH 〕━━━⬣
┃
┃ ✨ *Cari gambar Pinterest!*
┃
┃ 📝 *Format:*
┃ \`${m.prefix}pins <query>|<jumlah>\`
┃
┃ 📌 *Contoh:*
┃ \`${m.prefix}pins Zero Two|5\`
┃ \`${m.prefix}pins Kucing|3\`
┃
┃ ⚙️ *Jumlah maksimal 10 gambar*
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const parts = input.split('|').map(s => s.trim())
    const query = parts[0] || input
    let limit = parseInt(parts[1]) || 5

    if (limit > 10) limit = 10
    if (limit < 1) limit = 1

    await m.react('🔍')
    await m.reply(`⏳ *Mencari ${limit} gambar untuk:* "${query}"`)

    try {
        const data = await pinterest(query)
        const results = data?.result?.result?.result || data?.result || []

        if (!results || results.length === 0) {
            await m.react('❌')
            return m.reply(`❌ Tidak ditemukan hasil untuk: *${query}*`)
        }

        const maxImages = Math.min(results.length, limit)

        // ===== Kumpulin dulu semua URL gambar yang valid =====
        const medias = []
        for (let i = 0; i < maxImages; i++) {
            const item = results[i]
            const imageUrl = item.image_url ||
                item.images?.orig?.url ||
                item.images?.['736x']?.url ||
                item.url ||
                item.thumbnail

            if (!imageUrl) continue

            medias.push({
                image: { url: imageUrl },
                caption: medias.length === 0
                    ? `📌 *Pinterest Results*\n\n📝 *Query:* ${query}\n🖼️ *Sumber:* Pinterest\n💕 *Zero Two*`
                    : undefined
            })
        }

        if (medias.length === 0) {
            await m.react('❌')
            return m.reply(`❌ Gagal mengambil gambar untuk: *${query}*`)
        }

        // ===== Kirim sekaligus jadi 1 album (galeri) =====
        // PENTING: jangan taruh resend/fallback otomatis di sini kalau
        // sendMessage error, karena error itu sering muncul SETELAH gambar
        // beneran udah terkirim (misal gagal di step finalisasi album) —
        // kalau di-resend otomatis, hasilnya gambar kekirim dobel/spam.
        try {
            await sock.sendMessage(
                m.chat,
                { albumMessage: medias },
                { quoted: m }
            )
            await m.react('💗')
        } catch (albumErr) {
            console.log('[Pins] albumMessage error:', albumErr.message)
            await m.react('⚠️')
            await m.reply(
                `⚠️ *Ada kendala saat kirim album*\n\n` +
                `> ${albumErr.message}\n\n` +
                `Kalau gambar sebenernya udah muncul di atas, abaikan pesan ini. ` +
                `Kalau belum ada gambar sama sekali, kirim pesan error ini ke owner buat dicek.`
            )
        }

    } catch (err) {
        console.error('[Pins] Error:', err.message)
        await m.react('❌')
        await m.reply(
`❌ *Error!*

> ${err.message}

Coba lagi nanti ya, Darling~`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}