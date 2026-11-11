const CHANNEL_ID = "120363402057133599@newsletter"

const pluginConfig = {
name: "uppreset",
alias: ["uploadpreset","sendpreset"],
category: "owner",
description: "Upload preset ke channel",
usage: ".uppreset link5mb | linkxml | caption",
example: ".uppreset https://5mb.link | https://xml.link | preset jj anime",
isOwner: true,
cooldown: 5,
isEnabled: true
}

async function handler(m,{ sock }){

if(!m.text) return

const text = m.text.split("|").map(v => v.trim())

const link5mb = text[0]
const linkxml = text[1]
const captionUser = text[2] || "Preset baru"

if(!link5mb || !linkxml){
return m.reply(
`╭━━〔 *❤️ ZERO TWO PRESET UPLOADER* 〕━━⬣
┃
┃ *Format :*
┃
┃ .uppreset link5mb | xml | caption
┃
┃ *Contoh :*
┃ .uppreset https://5mb.link | https://xml.link | preset jj anime
┃
╰━━━━━━━━━━━━━━━━⬣`
)
}

m.react("⏳")

try{

const time = new Date().toLocaleTimeString()

const caption =
`╭━━〔 *❤️ ZERO TWO PRESET STORE* 〕━━⬣
┃
┃ ✨ *${captionUser}*
┃
┃ 📦 *Link 5MB*
┃ ${link5mb}
┃
┃ 📂 *Link XML*
┃ ${linkxml}
┃
┃ 👑 *Uploader*
┃ ${m.pushName}
┃
┃ ⏰ *Waktu*
┃ ${time}
┃
┃ 💌 *Ara Ara Darling~*
┃ *Preset baru sudah rilis ❤️*
┃
╰━━━━━━━━━━━━━━━━⬣`

await sock.sendMessage(
CHANNEL_ID,
{ text: caption }
)

m.react("✅")

return m.reply(
`╭━━〔 *❤️ NUSABOT SYSTEM* 〕━━⬣
┃
┃ ✅ *Preset berhasil dikirim*
┃
┃ 📡 *Sudah masuk ke channel*
┃
┃ 👑 *Uploader*
┃ ${m.pushName}
┃
╰━━━━━━━━━━━━━━━━⬣`
)

}catch(e){

console.log(e)

m.react("❌")

return m.reply(
`╭━━〔 *❌ ERROR SYSTEM* 〕━━⬣
┃
┃ ${e.message}
┃
╰━━━━━━━━━━━━━━━━⬣`
)

}

}

module.exports = {
config: pluginConfig,
handler
}