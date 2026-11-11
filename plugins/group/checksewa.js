const { getDatabase } = require("../../src/lib/database")
const timeHelper = require("../../src/lib/timeHelper")

const pluginConfig = {
  name: "checksewa",
  alias: ["ceksewa", "sisasewa"],
  category: "group",
  description: "Cek sisa waktu sewa bot di grup",
  usage: ".ceksewa",
  example: ".ceksewa",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  isAdmin: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true
}

function formatCountdown(expiredAt) {
  const now = Date.now()
  const diff = expiredAt - now

  if (diff <= 0) return { text: "EXPIRED", expired: true }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  let text = ""
  if (days > 0) text += `${days} hari `
  if (hours > 0) text += `${hours} jam `
  if (minutes > 0 && days === 0) text += `${minutes} menit`

  return { text: text.trim(), expired: false, days }
}

async function handler(m, { sock, config }) {

  const db = getDatabase()

  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} }
    db.db.write()
  }

  if (!db.db.data.sewa.enabled) {
    return m.reply(
`╭━━━〔 ❌ NUSABOT SYSTEM ❌ 〕━━━⬣
┃ Darling...
┃ Sistem sewa sedang tidak aktif.
┃
┃ Hubungi owner jika ini error.
╰━━━━━━━━━━━━━━━━⬣`)
  }

  if (!m.isGroup) {
    return m.reply(
`╭━━━〔 ❤️ NusaBot ❤️ 〕━━━⬣
┃ Hai Darling~
┃
┃ Command ini digunakan untuk
┃ mengecek masa sewa bot di grup.
┃
┃ Silakan gunakan di grup ya~
╰━━━━━━━━━━━━━━━━⬣`)
  }

  const sewaData = db.db.data.sewa.groups[m.chat]

  if (!sewaData) {

    const ownerNumber = config.owner?.number || "6280000000000"

    return sock.sendMessage(m.chat, {
      text:
`╭━━━〔 💔 ZERO TWO INFO 💔 〕━━━⬣
┃ Grup ini belum terdaftar
┃ dalam sistem sewa bot.
┃
┃ Jika ingin menggunakan bot
┃ silakan sewa terlebih dahulu.
╰━━━━━━━━━━━━━━━━⬣`,
      footer: "NusaBot",
      buttons: [
        {
          buttonId: `https://wa.me/${ownerNumber}?text=Bang+saya+mau+sewa+bot+Zero+Two`,
          buttonText: { displayText: "💬 Hubungi Owner" },
          type: 1
        }
      ],
      headerType: 1
    }, { quoted: m })
  }

  const countdown = formatCountdown(sewaData.expiredAt)
  const expiredStr = timeHelper.fromTimestamp(
    sewaData.expiredAt,
    "D MMMM YYYY HH:mm"
  )

  if (countdown.expired) {

    m.react("❌")

    return m.reply(
`╭━━━〔 💀 SEWA EXPIRED 💀 〕━━━⬣
┃ Masa sewa bot di grup ini
┃ sudah habis Darling.
┃
┃ 📅 Berakhir :
┃ ${expiredStr}
┃
┃ Silakan hubungi owner
┃ untuk memperpanjang.
╰━━━━━━━━━━━━━━━━⬣`)
  }

  let status = "🟢 AKTIF"

  if (countdown.days <= 3) {
    status = "🟡 HAMPIR HABIS"
  }

  m.react("⏱️")

  return sock.sendMessage(m.chat, {

    text:
`╭━━━〔 ❤️ ZERO TWO SEWA ❤️ 〕━━━⬣
┃ Hai Darling~
┃ Ini informasi sewa bot di grup.
┃
┃ 📛 Grup :
┃ ${sewaData.name || "Unknown"}
┃
┃ ⏳ Sisa Waktu :
┃ ${countdown.text}
┃
┃ 📅 Berakhir :
┃ ${expiredStr}
┃
┃ 📊 Status :
┃ ${status}
┃
┃ Terima kasih sudah
┃ menggunakan bot Zero Two 💕
╰━━━━━━━━━━━━━━━━⬣`,

    footer: "NusaBot",

    buttons: [
      {
        buttonId: ".rules",
        buttonText: { displayText: "📜 Rules Bot" },
        type: 1
      },
      {
        buttonId: ".ordersewa",
        buttonText: { displayText: "💰 Sewa Bot" },
        type: 1
      }
    ],

    headerType: 1

  }, { quoted: m })
}

module.exports = {
  config: pluginConfig,
  handler
}