const pluginConfig = {
    name: "semat",
    alias: ["sematkan","pin"],
    category: "group",
    description: "Menyematkan pesan di grup dengan durasi",
    usage: ".semat | .semat|3d",
    cooldown: 3,
    isEnabled: true
}

function parseDuration(text){

if(!text) return 86400 // default 1 hari

const match = text.match(/(\d+)([dhm])/i)
if(!match) return 86400

const num = parseInt(match[1])
const type = match[2].toLowerCase()

if(type === "d") return num * 86400
if(type === "h") return num * 3600
if(type === "m") return num * 60

return 86400
}

async function handler(m,{ sock }){

if(!m.isGroup){
return m.reply("❌ Perintah ini hanya bisa digunakan di grup.")
}

if(!m.isAdmin){
return m.reply("❌ Hanya admin yang bisa menyematkan pesan.")
}

if(!m.quoted){
return m.reply(
`╭━━〔 📌 SEMAT PESAN 〕━━╮
│
│ Cara pakai:
│ Reply pesan lalu ketik
│ *.semat*
│
│ Atau pakai durasi
│ *.semat|3d*
│
│ Contoh:
│ 1d = 1 hari
│ 12h = 12 jam
│ 30m = 30 menit
│
╰━━━━━━━━━━━━━━╯`
)
}

const body = m.text || ""
const durationText = body.split("|")[1]

const duration = parseDuration(durationText)

try{

await sock.sendMessage(m.chat,{
pin:{
type:1,
time:duration,
key:m.quoted.key
}
})

m.reply(
`╭━━〔 📌 PESAN DISEMATKAN 〕━━╮
│
│ Pesan berhasil disematkan
│ oleh *${m.pushName || "Admin"}*
│
│ ⏱ Durasi :
│ *${durationText || "1d"}*
│
╰━━━━━━━━━━━━━━━━━━╯`
)

}catch(e){

m.reply("❌ Gagal menyematkan pesan.")

}

}

module.exports = { config: pluginConfig, handler }