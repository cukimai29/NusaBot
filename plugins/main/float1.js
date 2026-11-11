const pluginConfig = {
    name: 'float1',
    alias: ['f1'],
    category: 'main',
    description: 'Test floating button V1 - Interactive Buttons',
    usage: '.f1',
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

✨ Silahkan pilih menu di bawah`
    }, { quoted: m });

    // Kirim tombol TERPISAH pake interactiveButtons
    await sock.sendMessage(m.chat, {
        text: `⚡ *Pilih aksi:*`,
        interactiveButtons: [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🌸 Menu",
                    id: ".menu"
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "💕 Owner",
                    id: ".owner"
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📜 Script",
                    id: ".sc"
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "🌐 Saluran",
                    url: "https://example.com"
                })
            }
        ]
    }, { quoted: m });
}

module.exports = {
    config: pluginConfig,
    handler
}