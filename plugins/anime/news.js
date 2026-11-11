const axios = require('axios')

const pluginConfig = {
    name: 'news',
    alias: ['anews', 'animenews', 'beritaanime', 'animeupdate'],
    category: 'anime',
    description: 'Berita anime terbaru dari MyAnimeList',
    usage: '.news',
    example: '.news 2',
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

// cache biar gak fetch ulang terus
const newsCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 menit
const LIST_KEY = 'list_news'

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
    if (newsCache.size > 100) {
        const first = newsCache.keys().next().value
        newsCache.delete(first)
    }
}

function extractId(link) {
    if (!link) return null
    const match = link.match(/id=(\d+)/)
    return match ? match[1] : null
}

async function axiosRetry(url, retries = 2) {
    let lastErr
    for (let i = 0; i <= retries; i++) {
        try {
            return await axios.get(url, { timeout: 30000 })
        } catch (e) {
            lastErr = e
            if (i < retries) await new Promise(r => setTimeout(r, 1500))
        }
    }
    throw lastErr
}

async function fetchList() {
    const cached = getCache(LIST_KEY)
    if (cached) return cached

    const { data } = await axiosRetry(API_LIST)
    if (!data?.status || !Array.isArray(data.result)) {
        throw new Error('API list berita tidak valid')
    }

    setCache(LIST_KEY, data.result)
    return data.result
}

async function fetchDetail(id) {
    const cached = getCache(`detail_${id}`)
    if (cached) return cached

    const { data } = await axiosRetry(API_DETAIL + id)
    if (!data?.status || !data.result) {
        throw new Error('Detail berita tidak ditemukan')
    }

    setCache(`detail_${id}`, data.result)
    return data.result
}

function truncate(str, len = 1500) {
    if (!str) return ''
    str = str.trim()
    if (str.length <= len) return str
    return str.slice(0, len).trim() + '...'
}

async function sendList(m, sock) {
    const list = await fetchList()
    if (list.length === 0) {
        m.react('❌')
        return m.reply('❌ Tidak ada berita anime.')
    }

    const top = list.slice(0, 10)

    let txt = `📰 *ʙᴇʀɪᴛᴀ ᴀɴɪᴍᴇ ᴛᴇʀʙᴀʀᴜ*\n\n`
    top.forEach((item, i) => {
        const t = item.title?.length > 75
            ? item.title.slice(0, 75).trim() + '...'
            : item.title
        txt += `*${i + 1}.* ${t}\n`
        txt += `   🗓️ _${item.date || '-'}_\n\n`
    })
    txt += `> Total: *${list.length}* berita\n`
    txt += `> Lihat detail: \`${m.prefix}news 1\` s/d \`${m.prefix}news ${top.length}\``

    // tombol quick reply 5 teratas
    const buttons = top.slice(0, 5).map((_, i) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: `📄 Berita ${i + 1}`,
            id: `${m.prefix}news ${i + 1}`
        })
    }))

    try {
        await sock.sendMessage(m.chat, {
            text: txt,
            interactiveButtons: buttons
        }, { quoted: m })
    } catch {
        await m.reply(txt)
    }

    m.react('✅')
}

async function sendDetail(m, sock, input) {
    let id = null
    let label = ''

    // input angka murni
    if (/^\d+$/.test(input)) {
        if (input.length >= 5) {
            // anggap ID berita
            id = input
            label = `ID: ${id}`
        } else {
            // anggap index dari list
            const idx = parseInt(input) - 1
            const list = await fetchList()
            if (idx < 0 || idx >= list.length) {
                m.react('❌')
                return m.reply(`❌ Nomor tidak valid. Pilih 1-${list.length}`)
            }
            const item = list[idx]
            id = extractId(item.link)
            label = `Berita #${input}`
        }
    } else if (input.startsWith('http')) {
        id = extractId(input)
        label = `Dari URL`
    } else {
        m.react('❌')
        return m.reply(
            `❌ Format salah!\n\n` +
            `> \`${m.prefix}news\` — lihat list\n` +
            `> \`${m.prefix}news 2\` — detail berita no. 2\n` +
            `> \`${m.prefix}news 74696633\` — detail by ID`
        )
    }

    if (!id) {
        m.react('❌')
        return m.reply(`❌ ID berita tidak ditemukan.`)
    }

    const detail = await fetchDetail(id)

    // bersihin prefix tanggal aneh kayak "nirererinSep 10"
    let date = detail.date || '-'
    date = date.replace(/^[a-zA-Z]+/, '').trim() || date

    const title = detail.title || 'Berita Anime'
    const content = truncate(detail.content || 'Tidak ada konten.', 1500)
    const image = detail.image
    const url = `${API_DETAIL}${id}`

    let caption = `📰 *${title}*\n\n`
    caption += `🗓️ _${date}_\n\n`
    caption += `${content}\n\n`
    caption += `───────────────\n`
    caption += `🔗 *URL:*\n${url}\n\n`
    caption += `> ${label}`

    // kirim dengan gambar kalau ada
    if (image) {
        try {
            await sock.sendMessage(m.chat, {
                image: { url: image },
                caption
            }, { quoted: m })
            m.react('✅')
            return
        } catch (e) {
            // fallback kalau gambar gagal, kirim sebagai text + URL gambar
            caption += `\n🖼️ *IMG:*\n${image}`
        }
    } else {
        caption += `\n> 🖼️ _Tidak ada gambar_`
    }

    await m.reply(caption)
    m.react('✅')
}

async function handler(m, { sock, args }) {
    const input = (Array.isArray(args) ? args.join(' ').trim() : (m.text || '').trim())

    m.react('📰')

    try {
        if (!input) {
            // ===== MODE LIST =====
            await sendList(m, sock)
        } else {
            // ===== MODE DETAIL =====
            await sendDetail(m, sock, input)
        }
    } catch (err) {
        m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}