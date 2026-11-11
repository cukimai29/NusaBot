const axios = require('axios')

const pluginConfig = {
    name: 'anews',
    alias: ['news', 'animenews', 'beritaanime', 'animeupdate'],
    category: 'anime',
    description: 'Berita anime terbaru dari MyAnimeList',
    usage: '.anews <jumlah>',
    example: '.anews 3',
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
const MAX_NEWS = 10

const newsCache = new Map()
const CACHE_TTL = 5 * 60 * 1000
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

function truncate(str, len = 1200) {
    if (!str) return ''
    str = str.trim()
    if (str.length <= len) return str
    return str.slice(0, len).trim() + '...'
}

function cleanDate(d) {
    if (!d) return '-'
    // hapus prefix kayak "nirererinSep 10" jadi "Sep 10"
    return d.replace(/^[a-zA-Z]+/, '').trim() || d
}

async function sendOneNews(sock, m, item, index, total) {
    const id = extractId(item.link)
    if (!id) return

    let detail
    try {
        detail = await fetchDetail(id)
    } catch (e) {
        // fallback pakai data list kalau detail gagal
        detail = {
            title: item.title,
            date: item.date,
            image: item.image,
            content: null
        }
    }

    const title = detail.title || item.title || 'Berita Anime'
    const date = cleanDate(detail.date || item.date)
    const content = detail.content ? truncate(detail.content, 1200) : null
    const image = detail.image || item.image
    const url = `${API_DETAIL}${id}`

    let caption = `📰 *${title}*\n\n`
    caption += `🗓️ _${date}_\n\n`

    if (content) {
        caption += `${content}\n\n`
    }

    caption += `───────────────\n`
    caption += `🔗 *URL:*\n${url}\n\n`
    caption += `> 📄 Berita ${index + 1} dari ${total}`

    // kirim dengan gambar
    if (image) {
        try {
            await sock.sendMessage(m.chat, {
                image: { url: image },
                caption
            }, { quoted: m })
            return
        } catch (e) {
            caption += `\n\n🖼️ *IMG:*\n${image}`
        }
    }

    await sock.sendMessage(m.chat, { text: caption }, { quoted: m })
}

async function handler(m, { sock, args }) {
    const input = (Array.isArray(args) ? args[0] : (m.text || '')).trim()

    let count = 1
    if (input) {
        const n = parseInt(input)
        if (isNaN(n) || n < 1) {
            m.react('❌')
            return m.reply(
                `❌ Format salah!\n\n` +
                `> \`${m.prefix}anews\` — 1 berita\n` +
                `> \`${m.prefix}anews 3\` — 3 berita\n` +
                `> Max: *${MAX_NEWS}* berita`
            )
        }
        if (n > MAX_NEWS) {
            m.react('❌')
            return m.reply(
                `❌ Maksimal *${MAX_NEWS}* berita per command.\n` +
                `> Kamu minta: *${n}*`
            )
        }
        count = n
    }

    m.react('📰')

    try {
        const list = await fetchList()
        if (list.length === 0) {
            m.react('❌')
            return m.reply('❌ Tidak ada berita anime.')
        }

        const actualCount = Math.min(count, list.length)

        await m.reply(`📰 Mengambil *${actualCount}* berita terbaru...`)

        for (let i = 0; i < actualCount; i++) {
            await sendOneNews(sock, m, list[i], i, actualCount)
            // jeda biar gak kena rate limit WA
            if (i < actualCount - 1) {
                await new Promise(r => setTimeout(r, 1500))
            }
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