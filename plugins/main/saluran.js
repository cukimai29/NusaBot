const { config } = require('../../config')

const pluginConfig = {
    name: 'saluran',
    alias: ['channel','ch','joinch'],
    category: 'main',
    description: 'Tampilkan tautan resmi NusaBot',
    usage: '.saluran',
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = config.bot?.name || 'NusaBot'
    const channelUrl = config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'
    const groupUrl = config.social?.whatsappGroup || 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'
    const caption = `📢 *${botName} — Tautan Resmi*\n\n` +
        `Ikuti channel untuk mendapatkan update bot dan bergabung ke grup komunitas.`

    await sock.sendMessage(m.chat, {
        text: caption,
        footer: botName,
        interactiveButtons: [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Channel Resmi',
                    url: channelUrl
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '👥 Grup Resmi',
                    url: groupUrl
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
