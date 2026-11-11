const pluginConfig = {
    name: 'buttonv2',
    alias: ['bv2'],
    category: 'main',
    description: 'Test button V2 - Caption + Tombol Terpisah',
    usage: '.bv2',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    // ===== PESAN 1: CAPTION =====
    const caption = `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di NusaBot!

📋 Ini adalah menu utama
╭━━〔 📊 INFO 〕━━⬣
┃ 👤 Nama: ${m.pushName}
┃ 🎭 Role: ${m.isOwner ? 'Owner' : 'User'}
╰━━━━━━━━━━⬣

✨ Silahkan pilih menu di bawah`;

    await sock.sendMessage(m.chat, {
        text: caption
    }, { quoted: m });

    // ===== PESAN 2: TOMBOL TERPISAH =====
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
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}