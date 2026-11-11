const fs = require('fs')
const path = require('path')
const { unloadPlugin } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const config = require('../../config')

// Import helper dari autonotif
const { isNotifActive, EVENTS } = require('./autonotif')

// 🔥 HAPUS KONSTANTA ZERO_IMAGE

const pluginConfig = {
    name: 'delplugin',
    alias: ['delpl','hapusplugin','removeplugin','dp'],
    category: 'owner',
    description: 'Hapus plugin berdasarkan nama',
    usage: '.delplugin <nama>',
    example: '.delplugin downloader',
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
            const baseName = file.replace('.js','')
            if(baseName.toLowerCase() === name.toLowerCase()) {
                return { folder, file, path: path.join(folderPath,file) }
            }
        }
    }
    return null
}

async function handler(m,{ sock }) {
    const db = getDatabase();
    const name = m.args?.[0]

    if(!name) {
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗗𝗘𝗟 𝗣𝗟𝗨𝗚𝗜𝗡 〕───⬣
│
│ ✦ Cara Pakai
│
│  𖦹 .delplugin namaplugin
│
│ ✦ Contoh
│
│  𖦹 .delplugin downloader
│
╰──────────────────⬣`
        )
    }

    m.react('⏳')

    try {
        const pluginsDir = path.join(process.cwd(),'plugins')
        const found = findPluginFile(pluginsDir,name)

        if(!found) {
            m.react('❌')
            return m.reply(`❌ Plugin *${name}* tidak ditemukan`)
        }

        const unloadResult = unloadPlugin(name)
        fs.unlinkSync(found.path)

        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        const channelMsg = 
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗨𝗣𝗗𝗔𝗧𝗘 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗘𝗗
│
│  ✦ Name   : ${found.file}
│  ✦ Folder : ${found.folder}
│  ✦ Size   : - bytes
│  ✦ Time   : ${time}
│  ✦ By     : ${m.pushName}
│  ✦ Ch     : ${config.saluran?.link || 'Tidak tersedia'}
│
│ ─────────────────
│  Status : Deleted ✓
│
│  “Hmm… plugin nya dihapus ya 🗿”
│
╰──────────────────⬣`

        // 🔥 CEK NOTIFIKASI PER EVENT DARI PLUGIN AUTONOTIF
        if (isNotifActive(db, EVENTS.DELETE)) {
            try {
                const CHANNEL_ID = config.saluran?.id
                
                if (CHANNEL_ID) {
                    // 🔥 FIX: Ambil gambar dari URL
                    let thumbBuffer = null
                    try {
                        thumbBuffer = await loadImage('zerotwo-delplugin.jpg')
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
            console.log(`[DelPlugin] Notifikasi DELETE dimatikan, skip kirim ke channel`)
        }

        m.react('✅')

        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗘𝗗
│
│  ✦ Name   : ${found.file}
│  ✦ Folder : ${found.folder}
│  ✦ Unload : ${unloadResult.success ? 'Success ✓' : 'Pending ⏳'}
│
│ ─────────────────
│  Status : Not Active ✗
│
│  “Bye bye plugin… 😋”
│
╰──────────────────⬣`
        )

    } catch(error) {
        console.log(error)
        m.react('❌')
        return m.reply(`╭───〔 𝗘𝗥𝗥𝗢𝗥 〕───⬣\n│\n│ ${error.message}\n│\n╰────────────────⬣`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}