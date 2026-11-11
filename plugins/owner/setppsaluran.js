const CHANNEL_ID = "120363402057133599@newsletter"

const pluginConfig = {
    name: "setppsaluran",
    alias: ["setppchannel","ppchannel"],
    category: "owner",
    description: "Ganti PP channel dan kirim notifikasi ke channel",
    usage: ".setppsaluran (reply gambar)",
    example: ".setppsaluran",
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

const Jimp = require('jimp') // resize & convert

async function handler(m,{ sock }){

    const quoted = m.quoted
    if(!quoted) return m.reply(
`╭━━〔 *❤️ ZERO TWO SET PP CHANNEL* 〕━━⬣
┃ Reply gambar dengan command ini
┃ lalu kirim *.setppsaluran*
╰━━━━━━━━━━━━━━━━⬣`
    )

    const message = quoted.message
    let imageBuffer = null

    if(message.imageMessage || (message.viewOnceMessage && message.viewOnceMessage.message?.imageMessage)){
        imageBuffer = await quoted.download()
    }

    if(!imageBuffer) return m.reply(
`╭━━〔 *❌ ZERO TWO SET PP CHANNEL* 〕━━⬣
┃ ❌ Pesan yang direply bukan gambar
╰━━━━━━━━━━━━━━━━⬣`
    )

    m.react("⏳")

    try{
        // Resize & convert image
        const image = await Jimp.read(imageBuffer)
        image.resize(720, Jimp.AUTO)
        const finalBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)

        // Update PP channel
        await sock.updateProfilePicture(CHANNEL_ID, finalBuffer)

        // Kirim info ke channel (UI Zero Two)
        const time = new Date().toLocaleTimeString()
        const infoMsg =
`╭─〔 💖 ZERO TWO CHANNEL UPDATE 💖 〕
│
│ Darling, ada PP baru nih 😋
│
│ 👑 Dari : ${m.pushName}
│ ⏰ Waktu : ${time}
│
│ 🎨 PP Channel berhasil diupdate!
│
│ Ara ara~ Terima kasih sudah
│ kirim gambar lucu ini ❤️
╰────────────`

        await sock.sendMessage(CHANNEL_ID,{ text: infoMsg })

        // Feedback ke user
        m.react("✅")
        return m.reply(
`╭━━〔 *❤️ NUSABOT SYSTEM* 〕━━⬣
┃ ✅ PP Channel berhasil diupdate!
┃ Darling, channel sudah dikasih info 😋
╰━━━━━━━━━━━━━━━━⬣`
        )

    }catch(e){
        console.log(e)
        m.react("❌")
        return m.reply(
`╭━━〔 *❌ NUSABOT SYSTEM* 〕━━⬣
┃ ${e.message}
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

}

module.exports = { config: pluginConfig, handler }