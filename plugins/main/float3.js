const pluginConfig = {
    name: 'float3',
    alias: ['f3'],
    category: 'main',
    description: 'Test floating button V3 - 2 Pesan',
    usage: '.f3',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    // ===== PESAN 1: CAPTION =====
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

    // ===== PESAN 2: TOMBOL =====
    await sock.sendMessage(m.chat, {
        text: `╭━━〔 ⚡ *PILIH AKSI* 〕━━⬣
┃ Klik tombol di bawah ini
╰━━━━━━━━━━⬣`,
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
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📊 Status",
                    id: ".status"
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