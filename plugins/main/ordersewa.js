const config = require("../../config")
const fs = require("fs")
const { loadImage } = require('../../src/lib/assetLoader'); // 🔥 IMPORT HELPER

const pluginConfig = {
  name: "ordersewa",
  alias: ["sewabot", "rentbot"],
  category: "main",
  description: "List harga sewa bot NusaBot",
  usage: ".ordersewa",
  example: ".ordersewa",
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function handler(m, { sock }) {

  const name = m.pushName || "Darling"
  
  // 🔥 FIX: Ambil gambar dari URL
  let image = null;
  try {
    image = await loadImage('zerotwo-sewa.jpg');
  } catch (e) {}

  const caption = `
╭━━━〔 🌸 *NUSABOT SEWA BOT* 🌸 〕━━━⬣
┃ Hai *${name}* 😋
┃ Nih paket sewa + benefit nya 💕
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🧸 *PAKET BIASA* 〕━━⬣
┃ 1D - 2D   : Rp 500 - 2K
┃ 3D - 5D   : Rp 3K - 5K
┃ 7D - 12D  : Rp 6K - 10K
┃ 20D - 30D : Rp 11K - 21K
┃
┃ ✦ Full fitur bot
┃ ✦ Cocok buat pemula
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 💎 *PAKET MEDIUM* 〕━━⬣
┃ 1D - 2D   : Rp 1.5K - 3K
┃ 3D - 5D   : Rp 4K - 6K
┃ 7D - 12D  : Rp 7K - 11K
┃ 20D - 30D : Rp 12K - 22K
┃
┃ ✦ Semua fitur biasa
┃ ✦ Bisa jadi *Owner Bot*
┃   selama masa sewa 😏
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 👑 *PAKET PREMIUM* 〕━━⬣
┃ 1D - 2D   : Rp 2.5K - 4K
┃ 3D - 5D   : Rp 5K - 7K
┃ 7D - 12D  : Rp 8K - 12K
┃ 20D - 30D : Rp 13K - 23K
┃
┃ ✦ Bisa jadi *Partner Bot*
┃ ✦ Bisa dapat *Script*
┃ ✦ Dapet update terbaru
┃ ✦ Bisa request fitur 😈
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🎁 *BONUS* 〕━━⬣
┃ ✦ Bisa custom durasi
┃ ✦ Kadang ada free sewa 😏
╰━━━━━━━━━━━━━━━━━━⬣
`

  if (image) {
    await sock.sendMessage(m.chat, {
      image: image,
      caption: caption
    }, { quoted: m })
  } else {
    await sock.sendMessage(m.chat, {
      text: caption
    }, { quoted: m })
  }

  await sleep(60000)

  const text2 = `
╭━━〔 💌 *ORDER SEWA BOT* 〕━━⬣
┃ Udah pilih paketnya?
┃ Langsung pencet tombol yaa 💕
╰━━━━━━━━━━━━━━━━⬣
`

  await sock.sendMessage(m.chat,{
    text: text2,
    footer: config.bot?.name || "NusaBot",
    buttons: [
      {
        buttonId: ".owner",
        buttonText: { displayText: "👑 Owner" },
        type: 1
      }
    ],
    headerType: 1
  },{ quoted:m })

}

module.exports = {
  config: pluginConfig,
  handler
}
