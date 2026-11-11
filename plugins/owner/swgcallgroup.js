const { generateWAMessageContent, generateWAMessageFromContent } = require('ourin')
const crypto = require('crypto')
const { config } = require('../../config')

const pluginConfig = {
name:'swgc-allgroup',
alias:['swgcall','storyallgc'],
category:'owner',
description:'Post story ke semua grup',
usage:'.swgc-allgroup teks / reply media',
example:'.swgc-allgroup Halo semua!',
isOwner:true,
cooldown:20,
isEnabled:true
}

async function sendGroupStatus(sock,jid,content){

const inside = await generateWAMessageContent(content,{
upload:sock.waUploadToServer
})

const messageSecret = crypto.randomBytes(32)

const m = generateWAMessageFromContent(jid,{
messageContextInfo:{messageSecret},
groupStatusMessageV2:{
message:{
...inside,
messageContextInfo:{messageSecret}
}
}
},{})

await sock.relayMessage(jid,m.message,{messageId:m.key.id})

}

async function handler(m,{ sock }){

let text = m.text || ''
let rawContent = {}
let buffer

if(m.quoted && (m.quoted.isImage || m.quoted.isVideo)){

buffer = await m.quoted.download()

if(m.quoted.isImage){
rawContent.image = buffer
rawContent.caption = text || ''
}

if(m.quoted.isVideo){
rawContent.video = buffer
rawContent.caption = text || ''
}

}

else if(m.isImage || m.isVideo){

buffer = await m.download()

if(m.isImage){
rawContent.image = buffer
rawContent.caption = text || ''
}

if(m.isVideo){
rawContent.video = buffer
rawContent.caption = text || ''
}

}

else if(text && text.trim()){

rawContent.text = text
rawContent.font = 0
rawContent.backgroundColor = '#FF5EA8'

}

else{

return m.reply(
`╭━━━〔 ⚠️ CARA PAKAI 〕━━━╮
│
│ .swgc-allgroup Halo semua
│ reply gambar + .swgc-allgroup
│ kirim video + .swgc-allgroup
│
╰━━━━━━━━━━━━━━━━━━╯`)
}

try{

const groups = await sock.groupFetchAllParticipating()
const groupList = Object.entries(groups)

if(groupList.length === 0){
return m.reply('Bot tidak berada di grup.')
}

await m.reply(
`╭━━━〔 💗 ZERO TWO SW ALL GROUP 💗 〕━━━╮
│
│ Mengirim story ke
│ *${groupList.length} grup*
│
│ Mohon tunggu ya 😋
│
╰━━━━━━━━━━━━━━━━━━╯`)

let success = 0
let failed = 0
let failedGroups = []

for(const [id,meta] of groupList){

try{

let content = {}

if(rawContent.image) content = {image:rawContent.image,caption:rawContent.caption || ''}
else if(rawContent.video) content = {video:rawContent.video,caption:rawContent.caption || ''}
else if(rawContent.text) content = {text:rawContent.text}

await sendGroupStatus(sock,id,content)

success++

}catch(err){

failed++

failedGroups.push({
name:meta.subject || 'Unknown Group',
reason:err.message || 'Unknown error'
})

}

}

let report =
`╭━━━〔 💗 ZERO TWO SW REPORT 💗 〕━━━╮
│
│ 📊 HASIL POST STORY
│
│ 🟢 Berhasil : *${success}*
│ 🔴 Gagal : *${failed}*
│`

if(failedGroups.length > 0){

report += `

│ ╭─〔 ❌ GROUP GAGAL 〕
`

failedGroups.slice(0,10).forEach(g=>{
report += `│ • ${g.name}
│   Alasan : ${g.reason}
│
`
})

report += `│ ╰────────────`
}

report += `

╰━━━━━━━━━━━━━━━━━━╯`

await m.reply(report)

}catch(err){

m.reply(`❌ ERROR\n\n${err.message}`)

}

}

module.exports = {
config:pluginConfig,
handler
}