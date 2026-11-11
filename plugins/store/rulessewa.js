const config = require('../../config')

const pluginConfig = {
    name: 'rulessewa',
    alias: ['rulesbot', 'aturansewa', 'rules'],
    category: 'store',
    description: 'Menampilkan aturan penggunaan bot sewa',
    usage: '.rulessewa',
    example: '.rulessewa',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {

    const botName = config.bot?.name || "NusaBot"

    let text = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📜 *𝗥𝗨𝗟𝗘𝗦 𝗦𝗘𝗪𝗔 𝗕𝗢𝗧*
╰━━━━━━━━━━━━━━━━━━━━╯

🌸 *Hai darling~*

Sebelum menggunakan *${botName}*
harap membaca aturan ini yaa 💕

╭─❍ 「 *⚠️ 𝗔𝗧𝗨𝗥𝗔𝗡* 」
│
│ ❌ *Dilarang spam command bot*
│ ❌ *Dilarang kick / remove bot*
│ ❌ *Dilarang ubah admin bot*
│ ❌ *Dilarang flood command berat*
│ ❌ *Dilarang gunakan bot untuk spam*
│
╰───────────────

╭─❍ 「 *ℹ️ 𝗜𝗡𝗙𝗢 𝗦𝗘𝗪𝗔* 」
│
│ ⏳ *Bot akan otomatis keluar*
│ jika masa sewa telah habis
│
│ 🔄 *Bisa extend sewa kapan saja*
│ dengan menghubungi owner
│
│ 💬 Jika bot mengalami error
│ silakan lapor ke owner
│
╰───────────────

💖 *Terima kasih sudah menyewa*
*𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗕𝗢𝗧*

Semoga bot ini membantu
dan membuat grup kalian
lebih seru yaa darling~ 😋✨
`

    const button = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "💰 𝗢𝗥𝗗𝗘𝗥 𝗦𝗘𝗪𝗔",
                id: ".ordersewa"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "👑 𝗢𝗪𝗡𝗘𝗥",
                id: ".owner"
            })
        }
    ]

    await sock.sendMessage(m.chat, {
        text: text,
        footer: botName,
        interactiveButtons: button
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}