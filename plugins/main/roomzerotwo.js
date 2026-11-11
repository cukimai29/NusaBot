const { config } = require('../../config')

const pluginConfig = {
    name: 'roomzerotwo',
    alias: ['gczerotwo'],
    category: 'main',
    description: 'Room resmi NusaBot',
    usage: '.roomzerotwo',
    example: '.roomzerotwo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {

const name = m.pushName || "Darling"

const text = `
╭━━〔 💗 ZERO TWO ROOM 💗 〕━━⬣
┃
┃ Hai *${name}*~
┃
┃ Kamu penasaran atau
┃ mau masuk ke group
┃ yang khusus aku yaa? 😋
┃
┃ Boleh kok masuk
┃ tapi jangan ribut
┃ atau spam bot yaa~
┃
┃ Kalau aku kesel
┃ nanti aku keluarkan lagi loh 🗿
┃
┃ Jadi yang baik ya darling ❤️
┃
┃ Tekan tombol di bawah
┃ untuk masuk ke room ku
╰━━━━━━━━⬣
`

await sock.sendMessage(m.chat, {
text: text,
footer: config.bot?.name || "NusaBot",
interactiveButtons: [
{
name: "cta_url",
buttonParamsJson: JSON.stringify({
display_text: "💗 Masuk Room NusaBot",
 url: config.social?.whatsappGroup || "https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T"
})
}
]
}, { quoted: m })

}

module.exports = {
config: pluginConfig,
handler
}
