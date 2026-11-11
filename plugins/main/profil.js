const axios = require('axios')

const pluginConfig = {
  name: 'profil',
  alias: ['profile','me'],
  category: 'main',
  description: 'Lihat profil user',
  usage: '.profil',
  example: '.profil',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 3,
  isEnabled: true
}

async function handler(m, { sock }) {

let user = global.db.data.users[m.sender]

let name = m.pushName || "Unknown"

let xp = user?.xp || 0
let level = user?.level || 0
let rank = user?.rank || "Newbie"
let jabatan = user?.jabatan || "Member"
let status = user?.premium ? "Premium" : "Free"

let id = m.sender.split('@')[0]

let pp

try {
pp = await sock.profilePictureUrl(m.sender, 'image')
} catch {
pp = 'https://i.imgur.com/Blank.png'
}

let teks = `
╭──〔 F02 USER PROFILE 〕

👤 Nama : ${name}
🆔 ID : F02-${id}

⭐ XP : ${xp}
📈 Level : ${level}
🏆 Rank : ${rank}

🎖 Jabatan : ${jabatan}
💎 Status : ${status}

╰──────────────
`

await sock.sendMessage(m.chat, {
image: { url: pp },
caption: teks
}, { quoted: m })

}

module.exports = {
pluginConfig,
handler
}