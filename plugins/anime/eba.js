const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'eba',
    alias: ['ebay', 'animeeba'],
    category: 'anime',
    description: 'Random gambar anime Eba',
    usage: '.eba',
    example: '.eba',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

const URL = 'https://raw.githubusercontent.com/KazukoGans/database/main/nsfw/eba.json'

let cache = []
let lastFetch = 0
const TTL = 5 * 60 * 1000

async function getEba() {
    const now = Date.now()
    if (cache.length && now - lastFetch < TTL) return cache

    try {
        const res = await axios.get(URL)
        const json = res.data
        if (!Array.isArray(json)) return []
        cache = json
        lastFetch = now
        return cache
    } catch (e) {
        console.log('[Eba] Gagal fetch data:', e.message)
        return []
    }
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

async function handler(m, { sock }) {
    const data = await getEba()
    if (!data.length) {
        return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Data Eba tidak tersedia, coba lagi nanti!')
    }

    const img = pickRandom(data)

    await sock.sendMessage(m.chat, {
        image: { url: img },
        caption: `🎀 *Random Anime Eba*\n\n> Klik .eba untuk random lagi!`
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}