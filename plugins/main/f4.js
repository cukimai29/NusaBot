const pluginConfig = {
    name: 'float4',
    alias: ['f4'],
    category: 'main',
    description: 'Test floating button V4 - Dropdown',
    usage: '.f4',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    // Kirim caption dulu
    await sock.sendMessage(m.chat, {
        text: `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di NusaBot!

📋 Ini adalah menu utama
╭━━〔 📊 INFO 〕━━⬣
┃ 👤 Nama: ${m.pushName}
┃ 🎭 Role: ${m.isOwner ? 'Owner' : 'User'}
╰━━━━━━━━━━⬣

✨ Klik tombol di bawah untuk pilih menu`
    }, { quoted: m });

    // Kirim tombol DROPDOWN (paling mirip bot Telegram)
    await sock.sendMessage(m.chat, {
        text: `📋 *Pilih menu:*`,
        interactiveButtons: [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "📋 Menu Darling 💕",
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
            }
        ]
    }, { quoted: m });
}

module.exports = {
    config: pluginConfig,
    handler
}