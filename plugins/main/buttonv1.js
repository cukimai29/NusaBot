const pluginConfig = {
    name: 'buttonv5',
    alias: ['bv5'],
    category: 'main',
    description: 'Test button V5 - Khusus CJS',
    usage: '.bv5',
    isOwner: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const caption = `🌸 *Halo ${m.pushName}* 🌸

💕 Selamat datang di NusaBot!

📋 Pilih menu di bawah ini ya Darling~`;

    await sock.sendMessage(m.chat, {
        caption: caption, // pake caption bukan text
        footer: "MADE BY RzkyADS || NusaBot",
        templateButtons: [
            { index: 1, quickReplyButton: { displayText: "🌸 Menu", id: ".menu" } },
            { index: 2, quickReplyButton: { displayText: "💕 Owner", id: ".owner" } },
            { index: 3, quickReplyButton: { displayText: "📜 Script", id: ".sc" } }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
