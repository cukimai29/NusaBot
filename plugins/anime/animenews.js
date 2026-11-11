const axios = require('axios')

const pluginConfig = {
    name: 'animenews',
    alias: ['anews', 'beritaanime', 'animeupdate'],
    category: 'anime',
    description: 'Berita anime terbaru dari MyAnimeList',
    usage: '.animenews',
    example: '.animenews',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const API_LIST = 'https://api.emiliabot.my.id/anime/berita'
const API_DETAIL = 'https://api.emiliabot.my.id/anime/beritaanime?id='

// cache list sementara biar user bisa pilih detail tanpa fetch ulang
const newsCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 menit

function getCache(key) {
    const item = newsCache.get(key)
    if (!item) return null
    if (Date.now() - item.ts > CACHE_TTL) {
        newsCache.delete(key)
        return null
    }
    return item.data
}

function setCache(key, data) {
    newsCache.set(key, { data, ts: Date.now() })
    // bersihin cache lama
    if (newsCache.size > 50) {
        const first = newsCache.keys().next().value
        newsCache.delete(first)
    }
}

function extractId(link) {
    if (!link) return null
    const match = link.match(/id=(\d+)/)
    return match ? match[1] : null
}

async function fetchList() {
    const cached = getCache('list')
    if (cached) return cached

    const { data } = await axios.get(API_LIST, { timeout: 30000 })
    if (!data?.status || !Array.isArray(data.result)) {
        throw new Error('API list berita tidak valid')
    }

    setCache('list', data.result)
    return data.result
}

async function fetchDetail(id) {
    const cached = getCache(`detail_${id}`)
    if (cached) return cached

    const { data } = await axios.get(API_DETAIL + id, { timeout: 30000 })
    if (!data?.status || !data.result) {
        throw new Error('Detail berita tidak ditemukan')
    }

    setCache(`detail_${id}`, data.result)
    return data.result
}

function truncate(str, len = 800) {
    if (!str) return ''
    if (str.length <= len) return str
    return str.slice(0, len).trim() + '...'
}

async function handler(m, { sock, args }) {
    const input = (Array.isArray(args) ? args.join(' ').trim() : (m.text || '').trim())

    m.react('📰')

    try {
        // ===== MODE DETAIL =====
        if (input) {
            // kalau input angka murni dan panjang < 5, anggap index list
            // kalau angka panjang >= 5, anggap ID berita
            let id = null
            let sourceLabel = ''

            if (/^\d+$/.test(input)) {
                if (input.length >= 5) {
                    // ID langsung
                    id = input
                    sourceLabel = `ID: ${id}`
                } else {
                    // index dari list
                    const idx = parseInt(input) - 1
                    const list = await fetchList()
                    if (idx < 0 || idx >= list.length) {
                        m.react('❌')
                        return m.reply(`❌ Nomor tidak valid. Pilih 1-${list.length}`)
                    }
                    id = extractId(list[idx].link)
                    sourceLabel = `Berita #${input}`
                }
            } else if (input.startsWith('http')) {
                id = extractId(input)
            } else {
                m.react('❌')
                return m.reply(
                    `❌ Format salah!\n\n` +
                    `> \`${m.prefix}anews\` — lihat list\n` +
                    `> \`${m.prefix}anews 3\` — detail berita no. 3\n` +
                    `> \`${m.prefix}anews 74696633\` — detail by ID`
                )
            }

            if (!id) {
                m.react('❌')
                return m.reply(`❌ ID berita tidak ditemukan.`)
            }

            const detail = await fetchDetail(id)

            let caption = `📰 *${detail.title || 'Berita Anime'}*\n\n`
            if (detail.date) caption += `🗓️ _${detail.date.replace(/^[a-zA-Z]+/, '').trim()}_\n\n`
            caption += truncate(detail.content || 'Tidak ada konten.', 1200)
            caption += `\n\n> 🔗 ${sourceLabel} • ${id}`

            // kalau ada image, kirim dengan gambar
            if (detail.image) {
                try {
                    await sock.sendMessage(m.chat, {
                        image: { url: detail.image },
                        caption
                    }, { quoted: m })
                    m.react('✅')
                    return
                } catch (e) {
                    // fallback ke text kalau gambar gagal
                }
            }

            await m.reply(caption)
            m.react('✅')
            return
        }

        // ===== MODE LIST =====
        const list = await fetchList()
        if (list.length === 0) {
            m.react('❌')
            return m.reply('❌ Tidak ada berita anime.')
        }

        const top = list.slice(0, 10)

        let txt = `📰 *ʙᴇʀɪᴛᴀ ᴀɴɪᴍᴇ ᴛᴇʀʙᴀʀᴜ*\n\n`
        top.forEach((item, i) => {
            const t = item.title?.length > 80
                ? item.title.slice(0, 80).trim() + '...'
                : item.title
            txt += `*${i + 1}.* ${t}\n`
            txt += `   _${item.date || '-'}_\n\n`
        })
        txt += `> Total: *${list.length}* berita\n`
        txt += `> Lihat detail: \`${m.prefix}anews 1\``

        // tombol quick reply buat 3 berita teratas
        const buttons = top.slice(0, 3).map((_, i) => ({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `📄 Berita ${i + 1}`,
                id: `${m.prefix}anews ${i + 1}`
            })
        }))
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '🔄 Refresh',
                id: `${m.prefix}anews`
            })
        })

        try {
            await sock.sendMessage(m.chat, {
                text: txt,
                interactiveButtons: buttons
            }, { quoted: m })
        } catch {
            // fallback kalau interactiveButtons gak didukung
            await m.reply(txt)
        }

        m.react('✅')

    } catch (err) {
        m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}