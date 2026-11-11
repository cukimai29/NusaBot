const {
  enableAutoBackup,
  disableAutoBackup,
  getBackupStatus,
  triggerManualBackup,
} = require("../../src/lib/autoBackup")

const timeHelper = require("../../src/lib/timeHelper")
const config = require("../../config")

const pluginConfig = {
  name: "autobackup",
  alias: ["backup","ab"],
  category: "owner",
  description: "Sistem auto backup bot",
  usage: ".autobackup <on/off/status/now>",
  example: ".autobackup on 6h",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

async function handler(m,{ sock }){

const args = m.text?.trim().split(/\s+/) || []
const action = args[0]?.toLowerCase()

if(!action){

const status = getBackupStatus()
const ownerNum = config.owner?.number?.[0] || "Owner"

let txt = `💗 *Zero Two Auto Backup System*\n\n`

txt += `╭─〔 📊 STATUS SYSTEM 〕\n`
txt += `│ 🔘 Status : ${status.enabled ? "✅ Aktif" : "❌ Nonaktif"}\n`
txt += `│ ⏱ Interval : ${status.interval}\n`
txt += `│ 📦 Total Backup : ${status.backupCount}\n`
txt += `│ 📅 Last Backup : ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup,"DD MMMM YYYY HH:mm:ss") : "-"}\n`
txt += `│ 👑 Owner : ${ownerNum}\n`
txt += `╰─────────────\n\n`

txt += `✨ *Perintah:*\n`
txt += `> ${m.prefix}autobackup on 6h\n`
txt += `> ${m.prefix}autobackup off\n`
txt += `> ${m.prefix}autobackup status\n`
txt += `> ${m.prefix}autobackup now\n\n`

txt += `Ara ara darling~\nZero Two siap menjaga data bot kamu 💕`

return m.reply(txt)

}

switch(action){

case "on":
case "enable":

const interval = args[1]

if(!interval){

return m.reply(`💢 Darling...

Kamu belum memberi interval backup.

Contoh:
${m.prefix}autobackup on 6h
${m.prefix}autobackup on 1d`)
}

const result = enableAutoBackup(interval,sock)

if(!result.success){
return m.reply(`❌ Gagal mengaktifkan backup\n\n${result.error}`)
}

m.react("✅")

return m.reply(`💗 *Auto Backup Aktif*

╭─〔 ⚙️ PENGATURAN 〕
│ ⏱ Interval : ${result.interval}
│ 📦 Backup : Session + Database + Plugin
│ 👑 Target : Owner
╰─────────────

Ara ara darling~
Zero Two akan menjaga semua data botmu 💕`)



case "off":
case "disable":

disableAutoBackup()

m.react("✅")

return m.reply(`💔 *Auto Backup Dimatikan*

Backup otomatis telah dihentikan.

Gunakan:
${m.prefix}autobackup on 6h

Jika ingin mengaktifkan kembali.`)



case "status":

const status = getBackupStatus()
const ownerNum = config.owner?.number?.[0] || "Owner"

let txt = `💗 *STATUS BACKUP BOT NUSABOT*\n\n`

txt += `╭─〔 📊 SYSTEM INFO 〕\n`
txt += `│ 🔘 Aktif : ${status.enabled ? "Ya" : "Tidak"}\n`
txt += `│ ⏱ Interval : ${status.interval}\n`
txt += `│ 🔄 Running : ${status.isRunning ? "Ya" : "Tidak"}\n`
txt += `│ 📦 Total Backup : ${status.backupCount}\n`
txt += `│ 📅 Last Backup : ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup,"DD MMMM YYYY HH:mm:ss") : "-"}\n`
txt += `│ 👑 Owner : ${ownerNum}\n`
txt += `╰─────────────`

return m.reply(txt)



case "now":

m.react("⏳")

await m.reply(`⏳ *Zero Two sedang membuat backup...*

Tunggu sebentar ya darling~
Aku sedang menyimpan semua data botmu 💗`)

try{

await triggerManualBackup(sock)

m.react("✅")

return m.reply(`💗 *Backup Selesai*

File backup telah dikirim ke owner.

Ara ara~
Jaga baik-baik file backup itu ya darling 💕`)

}catch(e){

m.react("❌")

return m.reply(`💢 Aduh darling...

Backup gagal dibuat.`)

}

default:

return m.reply(`💢 Perintah tidak dikenal.

Gunakan:
${m.prefix}autobackup on
${m.prefix}autobackup off
${m.prefix}autobackup status
${m.prefix}autobackup now`)

}

}

module.exports = {
config: pluginConfig,
handler
}