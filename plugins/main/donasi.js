const config = require('../../config')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'donasi',
    alias: ['donate', 'donation', 'support', 'saweria', 'trakteer'],
    category: 'main',
    description: 'Informasi donasi untuk mendukung bot dengan QRIS',
    usage: '.donasi',
    example: '.donasi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {

    const botName = config.bot?.name || 'NusaBot'
    const ownerName = config.owner?.name || 'Owner'
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || botName
    
    const donasiConfig = config.donasi || {}
    const payments = donasiConfig.payment || []
    const links = donasiConfig.links || []
    const qrisUrl = donasiConfig.qris || ''
    
    const benefits = donasiConfig.benefits || [
        'Server bot tetap hidup 💻',
        'Perbaikan bug lebih cepat ⚙️',
        'Fitur baru lebih sering hadir ✨',
        'Bot makin stabil digunakan 🚀'
    ]

let text = `╭━━━〔 💗 ${botName} DONASI 💗 〕━━━╮\n`
text += `│\n`
text += `│ Hai ${m.pushName || 'Darling'}... 🥺\n`
text += `│\n`
text += `│ ${botName} senang sekali kamu\n`
text += `│ menggunakan *${botName}*\n`
text += `│\n`
text += `│ Tapi tau gak...? \n`
text += `│ Menjalankan bot ini juga\n`
text += `│ butuh server, listrik,\n`
text += `│ dan waktu dari *${ownerName}*.\n`
text += `│\n`
text += `│ Kalau kamu berkenan...\n`
text += `│ kamu bisa mendukung\n`
text += `│ perkembangan bot ini. 💞\n`
text += `│\n`
text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`

if (payments.length > 0 || links.length > 0) {

text += `╭─〔 💳 𝗠𝗘𝗧𝗢𝗗𝗘 𝗗𝗢𝗡𝗔𝗦𝗜 〕─╮\n`

for (const pay of payments) {
text += `│ 🏦 *${pay.name}*\n`
text += `│ ${pay.number}\n`
text += `│ a/n ${pay.holder}\n`
text += `│\n`
}

for (const link of links) {
text += `│ 🔗 *${link.name}*\n`
text += `│ ${link.url}\n`
text += `│\n`
}

text += `╰────────────────────╯\n\n`

}

text += `╭─〔 🎁 𝗕𝗘𝗡𝗘𝗙𝗜𝗧 〕─╮\n`

for (const benefit of benefits) {
text += `│ ✦ ${benefit}\n`
}

text += `╰────────────────────╯\n\n`

text += `💌 *Pesan dari ${botName}*\n`
text += `\n`
text += `“Setiap dukungan kecil dari kamu\n`
text += `akan membuat bot ini terus hidup.”\n`
text += `\n`
text += `Terima kasih sudah menjadi\n`
text += `bagian dari perjalanan bot ini.\n`
text += `\n`
text += `${botName} akan selalu\n`
text += `menemani kamu di sini... 💗\n\n`

text += `Owner : @${config.owner?.number?.[0] || 'owner'}\n`

const copyButtons = payments.map(pay => ({
name: 'cta_copy',
buttonParamsJson: JSON.stringify({
display_text: `📋 Copy ${pay.name}`,
copy_code: pay.number
})
}))

const contextInfo = {
mentionedJid: config.owner?.number?.[0] ? [`${config.owner.number[0]}@s.whatsapp.net`] : [],
forwardingScore: 9999,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: saluranId,
newsletterName: saluranName,
serverMessageId: 127
}
}

if (qrisUrl) {

try {

const response = await fetch(qrisUrl)
const qrisBuffer = Buffer.from(await response.arrayBuffer())

await sock.sendMessage(m.chat, {
image: qrisBuffer,
caption: text,
footer: botName,
contextInfo: contextInfo,
interactiveButtons: copyButtons
}, { quoted: m })

} catch {

await sock.sendMessage(m.chat, {
text: text,
footer: botName,
contextInfo: contextInfo,
interactiveButtons: copyButtons
}, { quoted: m })

}

} else {

await sock.sendMessage(m.chat, {
text: text,
footer: botName,
contextInfo: contextInfo,
interactiveButtons: copyButtons
}, { quoted: m })

}

}

module.exports = {
config: pluginConfig,
handler
}
