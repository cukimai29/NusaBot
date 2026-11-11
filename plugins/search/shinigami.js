const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'shinigami',
    alias: ['smanga', 'searchmanga', 'carimanga', 'manga'],
    category: 'search',
    description: 'Mencari manga di Shinigami',
    usage: '.shinigami <judul>',
    example: '.shinigami solo leveling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 3,
    isEnabled: true
}

const BASE_URL = 'https://api.shngm.io'
const WEB_URL = 'https://g.shinigami.asia'
const TIMEOUT = 30000

function makeSlug(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function pickTaxonomy(taxonomy, key) {
    if (!taxonomy || !Array.isArray(taxonomy[key])) return []
    return taxonomy[key].map(v => v.name).filter(Boolean)
}

function formatNumber(num) {
    if (!num) return '0'
    return num.toLocaleString()
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const query = args.slice(0).join(' ')

    if (!query) {
        return m.reply(
            `📚 *SHINIGAMI SEARCH - ZERO TWO* 📚\n\n` +
            `💫 *"He~ mau cari manga apa darling?"* 💫\n\n` +
            `📌 *Cara pakai:*\n` +
            `> ${m.prefix}shinigami <judul manga>\n\n` +
            `📝 *Contoh:*\n` +
            `> ${m.prefix}shinigami solo leveling\n` +
            `> ${m.prefix}shinigami romance\n\n` +
            `🌸 *Yosh! Semangat!* 🌸`
        )
    }

    await m.reply(`⏳ *Mencari manga...*\n\n📚 *Query:* ${query}\n\n> "Tunggu sebentar darling~ 🦋"`)

    try {
        const res = await axios.get(`${BASE_URL}/v1/manga/list`, {
            timeout: TIMEOUT,
            params: {
                page: 1,
                page_size: 10,
                q: query
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

        const json = res.data

        if (!json || typeof json !== 'object') {
            return m.reply(`❌ *Gagal!*\n\n> "He~ response dari server error nih darling~ 🗿"`)
        }

        if (json.retcode !== 0) {
            return m.reply(`❌ *Gagal!*\n\n📝 *Error:* ${json.message || 'Unknown error'}\n\n> "Coba lagi nanti ya darling~ 🌸"`)
        }

        const results = Array.isArray(json.data) ? json.data : []

        if (results.length === 0) {
            return m.reply(
                `📚 *SHINIGAMI SEARCH* 📚\n\n` +
                `💫 *"Wah~ gak ketemu nih darling~"* 💫\n\n` +
                `🔍 *Query:* ${query}\n` +
                `📊 *Hasil:* 0\n\n` +
                `💬 Coba pake keyword lain ya~ 🌸`
            )
        }

        let caption = `📚 *SHINIGAMI SEARCH RESULTS* 📚\n\n`
        caption += `🔍 *Query:* ${query}\n`
        caption += `📊 *Total:* ${results.length}\n\n`

        for (let i = 0; i < Math.min(results.length, 10); i++) {
            const item = results[i]
            const genres = pickTaxonomy(item.taxonomy, 'Genre').join(', ') || 'Unknown'
            const status = item.status === 1 ? '🟢 Ongoing' : item.status === 2 ? '✅ Completed' : '❓ Unknown'
            const rating = item.user_rate || 'N/A'

            caption += `┌─〔 ${i + 1} 〕─📖\n`
            caption += `│ 📛 *Title:* ${item.title || 'Unknown'}\n`
            caption += `│ 📊 *Status:* ${status}\n`
            caption += `│ ⭐ *Rating:* ${rating}\n`
            caption += `│ 🏷️ *Genres:* ${genres}\n`
            caption += `│ 📖 *Latest Chapter:* ${item.latest_chapter_number || 'N/A'}\n`
            caption += `│ 🔗 *Url:* ${WEB_URL}/series/${item.manga_id}\n`
            caption += `└─────────────────────────\n\n`
        }

        caption += `💬 *Zero Two:* "Ini dia darling~ 🗿"\n`
        caption += `🌸 *Selamat membaca!* 🌸`

        await m.reply(caption)

    } catch (err) {
        console.error('[Shinigami Search Error]', err)
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