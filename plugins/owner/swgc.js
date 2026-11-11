const { fileTypeFromBuffer } = require('file-type')
const fs = require('fs')
const path = require('path')
const { config } = require('../../config')
const { generateWAMessageContent, generateWAMessageFromContent } = require('zerotwo')
const crypto = require('crypto')

const botConfig = config

const pluginConfig = {
    name: 'swgc',
    alias: ['statusgrup','swgroup','groupstory','toswgc'],
    category: 'owner',
    description: 'Post Group Story dengan vibes Zero Two',
    usage: '.swgc <teks> atau reply media',
    example: '.swgc Halo semua!',
    isOwner: true,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const pendingSwgc = new Map()

async function sendGroupStatus(sock, jid, content) {

    const inside = await generateWAMessageContent(content,{
        upload: sock.waUploadToServer
    })

    const messageSecret = crypto.randomBytes(32)

    const m = generateWAMessageFromContent(jid,{
        messageContextInfo:{ messageSecret },
        groupStatusMessageV2:{
            message:{
                ...inside,
                messageContextInfo:{ messageSecret }
            }
        }
    },{})

    await sock.relayMessage(jid,m.message,{ messageId:m.key.id })
    return m
}

async function handler(m,{ sock }) {

const args = m.args || []
const text = m.text || ''

// CONFIRM POST
if (args[0] === '--confirm' && args[1]) {

    const targetGroupId = args[1]
    const pendingData = pendingSwgc.get(m.sender)

    if (!pendingData) {
        return m.reply(`⚠️ Tidak ada data pending.`)
    }

    try {

        let groupName = 'Grup'

        try {
            const meta = await sock.groupMetadata(targetGroupId)
            groupName = meta.subject
        } catch {}

        await m.reply(
`╭━━━〔 💗 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 💗 〕━━━╮
│
│ Mengirim story ke
│ *${groupName}*
│
│ Mohon tunggu ya 😋
│
╰━━━━━━━━━━━━━━━━━━╯`)

        const rawContent = pendingData.rawContent
        let content = {}

        if (rawContent.image) content = { image: rawContent.image, caption: rawContent.caption || '' }
        else if (rawContent.video) content = { video: rawContent.video, caption: rawContent.caption || '' }
        else if (rawContent.text) content = { text: rawContent.text }

        await sendGroupStatus(sock,targetGroupId,content)

        const mediaType =
            rawContent.text ? 'Teks'
            : rawContent.image ? 'Gambar'
            : 'Video'

const successMsg =
`╭━━━〔 💗 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗧𝗢𝗥𝗬 💗 〕━━━╮
│
│ Story berhasil diposting!
│
│ ╭─〔 📋 DETAIL 〕
│ │ 🏠 Grup : *${groupName}*
│ │ 📦 Media : *${mediaType}*
│ │ 📡 Status : *Berhasil*
│ ╰──────────
│
│ Sekarang icon grup
│ memiliki *border hijau* ✨
│
│ Member bisa melihat
│ story grup nya!
│
╰━━━━━━━━━━━━━━━━━━━━╯`

        await m.reply(successMsg)

        pendingSwgc.delete(m.sender)

    } catch (err) {

        await m.reply(
`❌ *ERROR*

${err.message}`)

    }

    return
}

// PROSES MEDIA
let rawContent = {}
let buffer

const tempDir = path.join(process.cwd(),'temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir,{recursive:true})

if (m.quoted && (m.quoted.isImage || m.quoted.isVideo)) {

    buffer = await m.quoted.download()

    const type = await fileTypeFromBuffer(buffer)

    if (m.quoted.isImage) {
        rawContent.image = buffer
        rawContent.caption = text || ''
    }

    if (m.quoted.isVideo) {
        rawContent.video = buffer
        rawContent.caption = text || ''
    }

}

else if (m.isImage || m.isVideo) {

    buffer = await m.download()

    const type = await fileTypeFromBuffer(buffer)

    if (m.isImage) {
        rawContent.image = buffer
        rawContent.caption = text || ''
    }

    if (m.isVideo) {
        rawContent.video = buffer
        rawContent.caption = text || ''
    }

}

else if (text && text.trim()) {

    rawContent.text = text
    rawContent.font = 0
    rawContent.backgroundColor = '#FF5EA8'

}

else {

return m.reply(
`╭━━━〔 ⚠️ 𝗖𝗔𝗥𝗔 𝗣𝗔𝗞𝗔𝗜 〕━━━╮
│
│ 📝 Story teks
│ .swgc Halo semua
│
│ 🖼 Reply gambar
│ reply gambar lalu
│ ketik .swgc
│
│ 🎥 Video story
│ kirim video + .swgc
│
╰━━━━━━━━━━━━━━━━━━╯`)
}

pendingSwgc.set(m.sender,{
    rawContent:rawContent,
    timestamp:Date.now()
})

// AMBIL LIST GRUP
try {

const groups = await sock.groupFetchAllParticipating()

const groupList = Object.entries(groups)

if (groupList.length === 0) {
return m.reply(`Bot tidak ada di grup.`)
}

const groupRows = groupList.map(([id,meta])=>({
    title:meta.subject || 'Group',
    description:id,
    id:`${m.prefix}swgc --confirm ${id}`
}))

const mediaType =
rawContent.text ? 'Teks'
: rawContent.image ? 'Gambar'
: 'Video'

await sock.sendMessage(m.chat,{
text:
`╭━━━〔 💗 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗪𝗚𝗖 💗 〕━━━╮
│
│ Hai ${m.pushName || 'Darling'} 😋
│
│ Kamu akan membuat
│ *Story Grup*
│
│ ╭─〔 📦 INFO 〕
│ │ Media : *${mediaType}*
│ │ Grup : *${groupList.length}*
│ ╰────────
│
│ Pilih grup untuk
│ memposting story!
│
╰━━━━━━━━━━━━━━━━━━╯`,
footer:botConfig.bot?.name || 'NusaBot',
interactiveButtons:[
{
name:'single_select',
buttonParamsJson:JSON.stringify({
title:'🏠 Pilih Grup',
sections:[
{
title:'Daftar Grup',
rows:groupRows
}
]
})
}
]
})

} catch(err){

await m.reply(
`❌ ERROR

${err.message}`)

pendingSwgc.delete(m.sender)

}

}

module.exports = {
config:pluginConfig,
handler
}