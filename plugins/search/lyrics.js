const config = require('../../config')
const axios = require("axios")
const cheerio = require("cheerio")
const { CookieJar } = require("tough-cookie")
const { wrapper } = require("axios-cookiejar-support")

const pluginConfig = {
    name: ['lirik', 'lyrics', 'azlyrics', 'liriklagu'],
    alias: ['lyric', 'songlyrics', 'liriklagu'],
    category: 'search',
    description: 'Cari lirik lagu dari Azlyrics',
    usage: '.lirik <judul lagu>',
    example: '.lirik Duvet',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// Konfigurasi
const BASE = "https://www.azlyrics.com"
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (CHIMERA) Chrome/147.0.0.0 Mobile Safari/537.36"

// Cookie jar untuk session
const jar = new CookieJar()

const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 30000,
    decompress: true,
    validateStatus: () => true,
    headers: {
        "user-agent": UA,
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    }
}))

function cleanText(text = "") {
    return text
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.trim().replace(/[ \t]{2,}/g, " "))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

function decodeHtml(html = "") {
    const $ = cheerio.load(`<div id="x">${html}</div>`)
    return $("#x").text()
}

function getGeoToken(js = "") {
    const match = js.match(/name["']\s*,\s*["']x["'][\s\S]*?value["']\s*,\s*["']([^"']+)/i)
    if (match) return match[1]

    const fallback = js.match(/setAttribute\(["']value["'],\s*["']([^"']+)["']\)/i)
    if (fallback) return fallback[1]

    return null
}

function parseAutocomplete(text = "") {
    const match = text.match(/^"(.+?)"\s*-\s*(.+)$/)
    return {
        title: match?.[1]?.trim() || null,
        artist: match?.[2]?.trim() || null
    }
}

function parseLyrics(html = "") {
    const titleMatch = html.match(/SongName\s*=\s*"([^"]+)"/)
    const artistMatch = html.match(/ArtistName\s*=\s*"([^"]+)"/)

    const lyricMatch = html.match(/<!--\s*Usage of azlyrics\.com content[\s\S]*?-->\s*([\s\S]*?)<\/div>/i)
    const rawLyrics = lyricMatch ? lyricMatch[1] : ""

    const normalizedLyrics = rawLyrics
        .replace(/\r?\n/g, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?[^>]+>/g, "")

    const lyrics = cleanText(decodeHtml(normalizedLyrics))

    return {
        title: titleMatch?.[1] || null,
        artist: artistMatch?.[1] || null,
        lyrics
    }
}

async function getToken() {
    await client.get(BASE, {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
    })

    const geo = await client.get(`${BASE}/geo.js`, {
        headers: {
            accept: "*/*",
            referer: `${BASE}/`
        }
    })

    if (geo.status !== 200) {
        throw new Error(`Gagal ambil geo.js: ${geo.status}`)
    }

    const token = getGeoToken(String(geo.data))

    if (!token) {
        throw new Error("Token x tidak ditemukan dari geo.js")
    }

    return token
}

async function searchTop(query) {
    const token = await getToken()

    const url = `${BASE}/suggest/?q=${encodeURIComponent(query)}&x=${encodeURIComponent(token)}`

    const res = await client.get(url, {
        headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "x-requested-with": "XMLHttpRequest",
            referer: `${BASE}/`
        }
    })

    if (res.status !== 200) {
        throw new Error(`Search gagal: ${res.status}`)
    }

    let json

    try {
        json = typeof res.data === "string" ? JSON.parse(res.data) : res.data
    } catch {
        throw new Error("Response search bukan JSON valid")
    }

    const top = json?.songs?.[0] || json?.lyrics?.[0]

    if (!top?.url) {
        return null
    }

    return {
        url: top.url.replace(/\\\//g, "/"),
        autocomplete: top.autocomplete,
        ...parseAutocomplete(top.autocomplete)
    }
}

async function getLyrics(url) {
    const res = await client.get(url, {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            referer: `${BASE}/`
        }
    })

    if (res.status !== 200) {
        throw new Error(`Gagal ambil halaman lyrics: ${res.status}`)
    }

    const parsed = parseLyrics(String(res.data))

    if (!parsed.lyrics) {
        throw new Error("Lirik tidak ditemukan atau struktur halaman berubah")
    }

    return parsed
}

async function searchLyrics(query) {
    const top = await searchTop(query)

    if (!top) {
        return {
            success: false,
            code: 404,
            message: "Lirik tidak ditemukan"
        }
    }

    const lyrics = await getLyrics(top.url)

    return {
        success: true,
        code: 200,
        title: lyrics.title || top.title || "-",
        artist: lyrics.artist || top.artist || "-",
        lyrics: lyrics.lyrics,
        url: top.url
    }
}

async function handler(m, { sock }) {
    let query = m.text || m.quoted?.text || ""

    if (!query) {
        return m.reply(
            `🎵 *AZLYRICS - PENCARI LIRIK*\n\n` +
            `> Cari lirik lagu dari Azlyrics.com\n\n` +
            `📌 *Cara pakai:*\n` +
            `> *${m.prefix}lirik* [judul lagu]\n\n` +
            `✨ *Contoh:*\n` +
            `> ${m.prefix}lirik Duvet\n` +
            `> ${m.prefix}lirik Bohemian Rhapsody\n` +
            `> ${m.prefix}lirik Shape of You\n\n` +
            `> *by Ramzz X Cloud*`
        )
    }

    try {
        await m.react('⏱️')
        await m.reply(`🎵 *Mencari lirik "${query}"...*\n> Mohon tunggu sebentar`)

        const result = await searchLyrics(query)

        if (!result.success) {
            return m.reply(
                `❌ *LIRIK TIDAK DITEMUKAN*\n\n` +
                `> *Query:* ${query}\n` +
                `> *Pesan:* ${result.message || "Coba dengan kata kunci lain"}\n\n` +
                `💡 *Tips:*\n` +
                `◈ Gunakan judul lagu yang lebih spesifik\n` +
                `◈ Coba dengan nama artis + judul lagu\n` +
                `◈ Contoh: *${m.prefix}lirik Ed Sheeran Perfect*\n\n` +
                `> *by Ramzz X Cloud*`
            )
        }

        // Batasi panjang lirik agar tidak kepanjangan
        let lyricsText = result.lyrics
        let isTruncated = false
        
        if (lyricsText.length > 3800) {
            lyricsText = lyricsText.substring(0, 3800)
            isTruncated = true
        }

        const caption = `🎵 *${result.title}*\n` +
            `👤 *Artist:* ${result.artist}\n` +
            `🔗 *Source:* Azlyrics\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${lyricsText}\n\n` +
            `${isTruncated ? "> *⚠️ Lirik dipotong karena terlalu panjang*\n" : ""}` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `> *by Ramzz X Cloud*`

        await sock.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `${result.title} - ${result.artist}`,
                    body: "Lirik lagu dari Azlyrics",
                    thumbnailUrl: "https://azlyrics.com/images/az_logo.svg",
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: result.url
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (err) {
        console.error('Azlyrics Error:', err)
        await m.react('❌')

        return m.reply(
            `❌ *GAGAL MENCARI LIRIK*\n\n` +
            `> *Error:* ${err.message || "Terjadi kesalahan pada server"}\n\n` +
            `💡 *Solusi:*\n` +
            `◈ Coba lagi nanti\n` +
            `◈ Periksa koneksi internet\n` +
            `◈ Coba dengan kata kunci yang berbeda\n\n` +
            `> *by Ramzz X Cloud*`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}