const pluginConfig = {
    name: 'buttonv4',
    alias: ['bv4'],
    category: 'main',
    description: 'Test button V4 - Single Select (Dropdown)',
    usage: '.bv4',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const botName = botConfig.bot?.name || 'NusaBot'
    const ownerNumber = botConfig.owner?.number?.[0] || ''
    const caption = `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di ${botName}!

📋 Pilih menu di bawah ini ya Darling~`;

    await sock.sendMessage(m.chat, {
        text: caption,
        interactiveButtons: [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "📋 Pilih Menu Darling 💕",
                    sections: [
                        {
                            title: "🌸 Menu Utama",
                            rows: [
                                {
                                    title: "💕 Menu",
                                    description: "Lihat menu utama bot",
                                    id: ".menu"
                                },
                                {
                                    title: "🌸 Allmenu",
                                    description: "Lihat semua perintah",
                                    id: ".allmenu"
                                }
                            ]
                        },
                        {
                            title: "👑 Informasi",
                            rows: [
                                {
                                    title: "👑 Owner",
                                    description: "Lihat informasi owner",
                                    id: ".owner"
                                },
                                {
                                    title: "📜 Script",
                                    description: "Dapatkan script bot",
                                    id: ".sc"
                                }
                            ]
                        },
                        {
                            title: "🌐 Lainnya",
                            rows: [
                                {
                                    title: "📊 Status",
                                    description: "Lihat status bot",
                                    id: ".status"
                                },
                                {
                                    title: "🎮 Game",
                                    description: "Main game seru",
                                    id: ".game"
                                }
                            ]
                        }
                    ]
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "💬 Chat Owner",
                    url: `https://wa.me/${ownerNumber}`
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
