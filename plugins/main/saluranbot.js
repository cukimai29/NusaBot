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

    const chBot = config.saluran?.link || 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12'
    const chGroup = config.social?.whatsappGroup || 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'

    const botName = config.bot?.name || 'NusaBot'
    const caption = `📢 *${botName} — Tautan Resmi*\n\n` +
        `Ikuti channel untuk mendapatkan update bot dan bergabung ke grup komunitas.`

    try {

        await sock.sendMessage(m.chat, {
            text: caption,
            footer: botName,
            interactiveButtons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '💗 Join Saluran Bot',
                        url: chBot
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '👥 Grup Resmi',
                        url: chGroup
                    })
                }
            ]
        }, { quoted: m })

    } catch (err) {
        console.log(err)
        m.reply('❌ Gagal kirim saluran 😢')
    }

}

module.exports = {
    config: pluginConfig,
    handler
}
