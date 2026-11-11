const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'mangadetail',
    alias: ['mdetail', 'detailmanga', 'infomanga'],
    category: 'search',
    description: 'Melihat detail manga dari Shinigami',
    usage: '.mangadetail <url atau id>',
    example: '.mangadetail https://g.shinigami.asia/series/fc727dec-d1f5-43e8-a77d-37382f636659',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const BASE_URL = 'https://api.shngm.io'
const WEB_URL = 'https://g.shinigami.asia'
const TIMEOUT = 30000
const PAGE_SIZE = 10

function getUuid(input) {
    const text = String(input || '').trim()
    const uuid = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    return uuid ? uuid[0] : null
}

function pickTaxonomy(taxonomy, key) {
    if (!taxonomy || !Array.isArray(taxonomy[key])) return []
    return taxonomy[key].map(v => v.name).filter(Boolean)
}

function makeChapterUrl(chapterId) {
    return chapterId ? `${WEB_URL}/chapter/${chapterId}` : null
}

function makeChapterName(item) {
    const number = item.chapter_number ?? null
    const title = String(item.chapter_title || '').trim()

    if (number && title) return `Chapter ${number} - ${title}`
    if (number) return `Chapter ${number}`
    if (title) return title
    return null
}

function formatNumber(num) {
    if (!num) return '0'
    return num.toLocaleString()
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const input = args[0]

    if (!input) {
        return m.reply(
            `📖 *MANGA DETAIL - ZERO TWO* 📖\n\n` +
            `💫 *"He~ mau lihat detail manga apa darling?"* 💫\n\n` +
            `📌 *Cara pakai:*\n` +
            `> ${m.prefix}mangadetail <url atau id>\n\n` +
            `📝 *Contoh:*\n` +
            `> ${m.prefix}mangadetail https://g.shinigami.asia/series/fc727dec-d1f5-43e8-a77d-37382f636659\n` +
            `> ${m.prefix}mangadetail fc727dec-d1f5-43e8-a77d-37382f636659\n\n` +
            `🌸 *Yosh! Semangat!* 🌸`
        )
    }

    const mangaId = getUuid(input)

    if (!mangaId) {
        return m.reply(`❌ *Manga ID tidak ditemukan!*\n\n> "He~ itu bukan link yang bener darling~ 🗿"`)
    }

    await m.reply(`⏳ *Mengambil detail manga...*\n\n📖 *ID:* ${mangaId}\n\n> "Tunggu sebentar darling~ 🦋"`)

    try {
        const detailRes = await axios.get(`${BASE_URL}/v1/manga/detail/${mangaId}`, {
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': `${WEB_URL}/`,
                'Origin': WEB_URL,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true
        })

        const detailJson = detailRes.data

        if (!detailJson || typeof detailJson !== 'object' || detailJson.retcode !== 0) {
            return m.reply(`❌ *Gagal mengambil detail manga!*\n\n> "He~ ada masalah nih darling~ 🗿"`)
        }

        const data = detailJson.data
        const genres = pickTaxonomy(data.taxonomy, 'Genre').join(', ') || 'Unknown'
        const authors = pickTaxonomy(data.taxonomy, 'Author').join(', ') || 'Unknown'
        const artists = pickTaxonomy(data.taxonomy, 'Artist').join(', ') || 'Unknown'
        const status = data.status === 1 ? '🟢 Ongoing' : data.status === 2 ? '✅ Completed' : '❓ Unknown'

        // Ambil chapter list
        const chapterRes = await axios.get(`${BASE_URL}/v1/chapter/${mangaId}/list`, {
            timeout: TIMEOUT,
            params: {
                page: 1,
                page_size: PAGE_SIZE,
                sort_by: 'chapter_number',
                sort_order: 'desc'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': `${WEB_URL}/`,
                'Origin': WEB_URL,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true
        })

        const chapterJson = chapterRes.data
        const chapters = Array.isArray(chapterJson.data) ? chapterJson.data : []

        let caption = `📖 *MANGA DETAIL* 📖\n\n`
        caption += `┌─〔 📝 *INFORMASI* 〕─📖\n`
        caption += `│ 📛 *Title:* ${data.title || 'Unknown'}\n`
        caption += `│ 🔄 *Status:* ${status}\n`
        caption += `│ ⭐ *Rating:* ${data.user_rate || 'N/A'}\n`
        caption += `│ 👁️ *Views:* ${formatNumber(data.view_count)}\n`
        caption += `│ 🔖 *Bookmarks:* ${formatNumber(data.bookmark_count)}\n`
        caption += `│ 📅 *Release:* ${data.release_year || 'N/A'}\n`
        caption += `│ 🏷️ *Genres:* ${genres}\n`
        caption += `│ ✍️ *Author:* ${authors}\n`
        caption += `│ 🎨 *Artist:* ${artists}\n`
        caption += `│ 📖 *Latest Chapter:* ${data.latest_chapter_number || 'N/A'}\n`
        caption += `└─────────────────────────\n\n`

        if (data.description) {
            const desc = data.description.length > 200 ? data.description.slice(0, 200) + '...' : data.description
            caption += `┌─〔 📝 *DESKRIPSI* 〕─📖\n`
            caption += `│ ${desc}\n`
            caption += `└─────────────────────────\n\n`
        }

        if (chapters.length > 0) {
            caption += `┌─〔 📚 *CHAPTER LIST* 〕─📖\n`
            for (let i = 0; i < Math.min(chapters.length, 10); i++) {
                const ch = chapters[i]
                const title = makeChapterName(ch) || `Chapter ${ch.chapter_number || 'N/A'}`
                caption += `│ ${i + 1}. ${title}\n`
                caption += `│    🔗 ${makeChapterUrl(ch.chapter_id)}\n`
            }
            if (chapters.length > 10) {
                caption += `│\n│ _...dan ${chapters.length - 10} chapter lainnya_\n`
            }
            caption += `└─────────────────────────\n\n`
        }

        caption += `💬 *Zero Two:* "Ini dia detailnya darling~ 🗿"\n`
        caption += `🌸 *Selamat membaca!* 🌸`

        // Kirim cover kalau ada
        if (data.cover_image_url) {
            try {
                const coverRes = await axios.get(data.cover_image_url, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                })
                await sock.sendMessage(m.chat, {
                    image: Buffer.from(coverRes.data),
                    caption: caption
                }, { quoted: m })
            } catch {
                await m.reply(caption)
            }
        } else {
            await m.reply(caption)
        }

    } catch (err) {
        console.error('[MangaDetail Error]', err)
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