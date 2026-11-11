const config = require('../../config')

const pluginConfig = {
    name: "upinfo",
    alias: ["sendinfo","upch"],
    category: "owner",
    description: "Upload info ke channel",
    usage: ".upinfo (reply pesan)",
    example: ".upinfo",
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

async function handler(m,{ sock }){
    const quoted = m.quoted
    if(!quoted){
        return m.reply(
`╭─❖「 💗 ZERO TWO INFO 」❖─
│
│ Reply pesan lalu ketik:
│ *.upinfo*
│
│ Support:
│ 📷 Image
│ 🎬 Video
│ 🎵 Audio
│ 🎙 Voice
│ 💬 Text
│ 😂 Sticker
╰────────────`
        )
    }

    const CHANNEL_ID = config.saluran?.id
    if (!CHANNEL_ID) {
        return m.reply("❌ ID Saluran tidak ditemukan di config!\n\n> Cek bagian `saluran.id` di config.js")
    }

    m.react("⏳")

    try{
        const time = new Date().toLocaleTimeString()

        const header =
`╭─❖「 💗 ZERO TWO UPDATE 」❖─
│ ✦ Ara Ara~ Info baru nih 😋
│
│ 👑 By : ${m.pushName}
│ ⏰ Time : ${time}
╰────────────`

        await sock.sendMessage(CHANNEL_ID,{ text: header })

        let msg = quoted.message

        if (msg?.ephemeralMessage) msg = msg.ephemeralMessage.message
        if (msg?.viewOnceMessage) msg = msg.viewOnceMessage.message
        if (msg?.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message

        const type = Object.keys(msg)[0]

        if(type === "conversation" || type === "extendedTextMessage"){
            await sock.sendMessage(CHANNEL_ID,{
                text: quoted.text || msg.conversation
            })
        } else {
            const buffer = await quoted.download()
            if(!buffer) return m.reply("❌ Gagal download media")

            let payload = {}

            switch(type){
                case "imageMessage":
                    payload = {
                        image: buffer,
                        caption: msg.imageMessage?.caption || ""
                    }
                    break

                case "videoMessage":
                    payload = {
                        video: buffer,
                        caption: msg.videoMessage?.caption || ""
                    }
                    break

                case "audioMessage":
                    payload = {
                        audio: buffer,
                        mimetype: "audio/mpeg",
                        ptt: msg.audioMessage?.ptt || false
                    }
                    break

                case "stickerMessage":
                    payload = { sticker: buffer }
                    break

                case "documentMessage":
                    payload = {
                        document: buffer,
                        fileName: msg.documentMessage?.fileName || "file",
                        mimetype: msg.documentMessage?.mimetype
                    }
                    break

                default:
                    return m.reply("❌ Tidak support")
            }

            await sock.sendMessage(CHANNEL_ID,payload)
        }

        m.react("✅")

        return m.reply(
`╭─❖「 💗 NUSABOT SYSTEM 」❖─
│
│ ✅ Info berhasil dikirim
│ ke channel darling 😋
│
╰────────────`
        )

    } catch(e){
        console.log(e)
        m.react("❌")
        return m.reply(
`╭─❖「 ❌ ERROR 」❖─
│ ${e.message}
╰────────────`
        )
    }
}

module.exports = { config: pluginConfig, handler }