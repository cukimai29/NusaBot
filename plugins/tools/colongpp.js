const config = require("../../config")

const pluginConfig = {
  name: "colongpp",
  alias: ["stealpp","getpp","ambilpp"],
  category: "tools",
  description: "Ambil foto profil orang",
  usage: ".colongpp @tag / nomor / reply",
  example: ".colongpp @628xxxx",
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

async function handler(m,{ sock }){

let target

// TAG
if (m.mentionedJid && m.mentionedJid[0]) {
target = m.mentionedJid[0]
}

// REPLY
else if (m.quoted) {
target = m.quoted.sender
}

// NOMOR
else if (m.args && m.args[0]) {
let number = m.args[0].replace(/[^0-9]/g,'')
target = number + "@s.whatsapp.net"
}

else {
return m.reply(`
╭━━━〔 💗 *ZERO TWO COLONG PP* 💗 〕━━━⬣
┃
┃ Hai darling 😋
┃ Kamu belum menentukan
┃ siapa yang mau di colong PP nya
┃
┃ 📌 *Cara pakai*
┃
┃ • .colongpp @tag
┃ • .colongpp nomor
┃ • reply pesan + .colongpp
┃
┃ Contoh:
┃ .colongpp @user
┃
╰━━━━━━━━━━━━━━━━━━⬣
`)
}

try{

let pp = await sock.profilePictureUrl(target,"image")

let text = `
╭━━━〔 💗 *PP BERHASIL DICOLONG* 💗 〕━━━⬣
┃
┃ Zero Two berhasil
┃ mengambil foto profil
┃ target kamu 😋
┃
┃ Target:
┃ @${target.split("@")[0]}
┃
╰━━━━━━━━━━━━━━━━━━⬣
`

await sock.sendMessage(m.chat,{
image:{ url: pp },
caption: text,
mentions:[target]
},{ quoted:m })

}catch{

let text = `
╭━━━〔 ⚠️ *PP TIDAK TERSEDIA* ⚠️ 〕━━━⬣
┃
┃ Maaf darling 🥺
┃ Target tidak memiliki
┃ foto profil
┃
┃ Atau privasi nya
┃ disembunyikan
┃
╰━━━━━━━━━━━━━━━━━━⬣
`

m.reply(text)

}

}

module.exports = {
config: pluginConfig,
handler
}