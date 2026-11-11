const fs = require('fs')

const pluginConfig = {
name: 'gantimenu',
alias: ['ganti-zerotwo-menu.jpg'],
category: 'owner',
description: 'Kirim menu dengan UI Zero Two',
usage: '.ganti-zerotwo-menu.jpg',
isOwner: true,
cooldown: 5,
isEnabled: true
}

async function handler(m, { sock }) {

const path = './assets/images/ourin-allmenu.jpg'

if (!fs.existsSync(path)) {
return m.reply('❌ File menu tidak ditemukan!')
}

// UI BOX
let teks = `
╭─❖ 「 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 𝐌𝐄𝐍𝐔 」 ❖─⬣
│ 👤 User : @${m.sender.split('@')[0]}
│ ⚡ Status : Online
│ 📂 Mode : All Menu
╰──────────────⬣

🌸 Silahkan pilih menu yang tersedia
Gunakan tombol dibawah ya darling~

╭─❖
│ 💗 Zero Two Says:
│ "Don't just stare... interact with me~"
╰──────────────⬣
`

await sock.sendMessage(m.chat, {
image: fs.readFileSync(path),
caption: teks,
mentions: [m.sender],
footer: 'NusaBot',
buttons: [
{ buttonId: '.menu', buttonText: { displayText: '📋 Menu' }, type: 1 },
{ buttonId: '.allmenu', buttonText: { displayText: '📚 All Menu' }, type: 1 },
{ buttonId: '.owner', buttonText: { displayText: '👑 Owner' }, type: 1 }
],
headerType: 4
}, { quoted: m })

}

module.exports = {
config: pluginConfig,
handler
}