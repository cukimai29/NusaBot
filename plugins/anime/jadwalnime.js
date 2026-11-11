const axios = require('axios')

const pluginConfig = {
    name: 'jadwalnime',
    alias: ['jadwalrilis', 'jadwalanime', 'release'],
    category: 'anime',
    description: 'Jadwal rilis anime mingguan',
    usage: '.jadwal <jumlah hari>',
    example: '.jadwal 3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://api.emiliabot.my.id/anime/jadwalrilis'
const MAX_DAYS = 7

const jadwalCache = new Map()
const CACHE_TTL = 10 * 60 * 1000
const CACHE_KEY = 'jadwal'

function getCache(key) {
    const item = jadwalCache.get(key)
    if (!item) return null
    if (Date.now() - item.ts > CACHE_TTL) {
        jadwalCache.delete(key)
        return null
    }
    return item.data
}

function setCache(key, data) {
    jadwalCache.set(key, { data, ts: Date.now() })
    if (jadwalCache.size > 50) {
        const first = jadwalCache.keys().next().value
        jadwalCache.delete(first)
    }
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

async function fetchJadwal() {
    const cached = getCache(CACHE_KEY)
    if (cached) return cached

    const { data } = await axiosRetry(API_URL)
    if (!data?.status || !Array.isArray(data.result)) {
        throw new Error('API jadwal tidak valid')
    }

    // filter hari yang ada anime-nya
    const valid = data.result.filter(d => d.anime && d.anime.length > 0)
    setCache(CACHE_KEY, valid)
    return valid
}

function buildDayMessage(dayData, index, total) {
    const day = dayData.day || 'Hari'
    const date = dayData.date || '-'
    const animeList = dayData.anime || []

    let txt = `📅 *ᴊᴀᴅᴡᴀʟ ʀɪʟɪs — ${day.toUpperCase()}*\n`
    txt += `🗓️ _${date}_\n`
    txt += `───────────────\n\n`

    animeList.forEach((a, i) => {
        const ep = a.episode ? ` *${a.episode}*` : ''
        const cat = a.category ? ` ${a.category}` : ''
        const time = a.time ? ` — 🕐 ${a.time}` : ''

        txt += `*${i + 1}. ${a.title}*${ep}\n`
        txt += `   ${cat}${time}\n\n`
    })

    txt += `───────────────\n`
    txt += `> 📺 Total: *${animeList.length}* anime\n`
    txt += `> 📄 Hari ${index + 1} dari ${total}`

    return txt
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
                `> \`${m.prefix}jadwal\` — 1 hari\n` +
                `> \`${m.prefix}jadwal 3\` — 3 hari\n` +
                `> Max: *${MAX_DAYS}* hari`
            )
        }
        if (n > MAX_DAYS) {
            m.react('❌')
            return m.reply(
                `❌ Maksimal *${MAX_DAYS}* hari per command.\n` +
                `> Kamu minta: *${n}*`
            )
        }
        count = n
    }

    m.react('📅')

    try {
        const allDays = await fetchJadwal()
        if (allDays.length === 0) {
            m.react('❌')
            return m.reply('❌ Tidak ada data jadwal rilis.')
        }

        const actualCount = Math.min(count, allDays.length, MAX_DAYS)

        await m.reply(`📅 Mengambil jadwal rilis *${actualCount}* hari...`)

        for (let i = 0; i < actualCount; i++) {
            const txt = buildDayMessage(allDays[i], i, actualCount)
            try {
                await sock.sendMessage(m.chat, {
                    text: txt,
                    interactiveButtons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔄 Refresh',
                                id: `${m.prefix}jadwal ${actualCount}`
                            })
                        }
                    ]
                }, { quoted: m })
            } catch {
                await m.reply(txt)
            }

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