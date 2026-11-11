const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const config = require('../../config')

// Import helper dari autonotif
const { isNotifActive, EVENTS } = require('./autonotif')

// 🔥 HAPUS KONSTANTA ZERO_IMAGE

const pluginConfig = {
    name: "gantiplugin",
    alias: ["replaceplugin","updateplugin"],
    category: "owner",
    description: "Ganti plugin lama dengan code baru",
    usage: ".gantiplugin namaplugin",
    example: ".gantiplugin ytplay",
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

function findPluginFile(pluginsDir,name) {
    const folders = fs.readdirSync(pluginsDir,{ withFileTypes:true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

    for(const folder of folders) {
        const folderPath = path.join(pluginsDir,folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))

        for(const file of files) {
            const base = file.replace(".js","")
            if(base.toLowerCase() === name.toLowerCase()) {
                return { folder, file, path: path.join(folderPath,file) }
            }
        }
    }
    return null
}

async function handler(m,{ sock }) {
    const db = getDatabase();
    const quoted = m.quoted
    const name = m.args?.[0]

    if(!quoted || !name) {
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗥𝗘𝗣𝗟𝗔𝗖𝗘 𝗣𝗟𝗨𝗚𝗜𝗡 〕───⬣
│
│ ✦ Cara Pakai
│
│  𖦹 Reply code plugin baru
│  𖦹 .gantiplugin namaplugin
│
│ ✦ Contoh
│
│  𖦹 .gantiplugin ytplay
│
╰──────────────────⬣`
        )
    }

    let code = quoted.text || quoted.body || ""

    if(code.length < 50) {
        return m.reply("❌ Code plugin tidak valid")
    }

    m.react("⏳")

    try {
        const pluginsDir = path.join(process.cwd(),"plugins")
        const found = findPluginFile(pluginsDir,name)

        if(!found) {
            m.react("❌")
            return m.reply(`❌ Plugin *${name}* tidak ditemukan`)
        }

        fs.writeFileSync(found.path,code)

        const reload = hotReloadPlugin(found.path)
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        const channelMsg =
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗨𝗣𝗗𝗔𝗧𝗘 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗨𝗣𝗗𝗔𝗧𝗘𝗗
│
│  ✦ Name   : ${name}.js
│  ✦ Folder : ${found.folder}
│  ✦ Time   : ${time}
│  ✦ By     : ${m.pushName}
│  ✦ Ch     : ${config.saluran?.link || 'Tidak tersedia'}
│
│ ─────────────────
│  Status : Updated ✓
│
│  “Hehe… plugin nya di-upgrade 😋”
│
╰──────────────────⬣`

        // 🔥 CEK NOTIFIKASI PER EVENT DARI PLUGIN AUTONOTIF
        if (isNotifActive(db, EVENTS.UPDATE)) {
            try {
                const CHANNEL_ID = config.saluran?.id
                
                if (CHANNEL_ID) {
                    // 🔥 FIX: Ambil gambar dari URL
                    let thumbBuffer = null
                    try {
                        thumbBuffer = await loadImage('zerotwo-gantiplugin.jpg')
                    } catch (e) {}

                    if (thumbBuffer) {
                        await sock.sendMessage(CHANNEL_ID, {
                            image: thumbBuffer,
                            caption: channelMsg
                        })
                    } else {
                        await sock.sendMessage(CHANNEL_ID, { text: channelMsg })
                    }
                }
            } catch(e) {
                console.log("Gagal kirim channel:", e)
            }
        } else {
            console.log(`[GantiPlugin] Notifikasi UPDATE dimatikan, skip kirim ke channel`)
        }

        m.react("✅")

        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗨𝗣𝗗𝗔𝗧𝗘𝗗
│
│  ✦ Name   : ${name}.js
│  ✦ Folder : ${found.folder}
│  ✦ Reload : ${reload.success ? "Success ✓" : "Pending ⏳"}
│
│ ─────────────────
│  Status : Active ✓
│
│  “Nice update, darling 😋”
│
╰──────────────────⬣`
        )

    } catch(e) {
        console.log(e)
        m.react("❌")
        return m.reply(`╭───〔 𝗘𝗥𝗥𝗢𝗥 〕───⬣\n│\n│ ${e.message}\n│\n╰────────────────⬣`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}