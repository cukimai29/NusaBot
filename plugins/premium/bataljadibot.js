const cancelJadibot = new Set()

const pluginConfig = {
  name: "bataljadibot",
  alias: ["canceljadibot", "stopjadibotstart"],
  category: "premium",
  description: "Batalkan proses jadibot yang sedang dimulai",
  usage: ".bataljadibot",
  example: ".bataljadibot",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  cooldown: 5,
  isEnabled: true,
}

async function handler(m) {

  const userJid = m.sender

  cancelJadibot.add(userJid)

  await m.reply(
`🌸 *ZERO TWO NOTICE*

Baik darling~

Proses *jadibot* sudah
Zero Two batalkan ya 💕

Kalau ingin mencoba lagi
silakan ketik *.jadibot* ✨`
  )

}

module.exports = {
  config: pluginConfig,
  handler,
  cancelJadibot
}