const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const config = require('../../config')

const { isNotifActive, EVENTS } = require('./autonotif')

// 🔥 HAPUS KONSTANTA ZERO_IMAGE

const pluginConfig = {
    name: 'addplugin',
    alias: ['addpl','tambahplugin'],
    category: 'owner',
    description: 'Tambah plugin baru dari code reply',
    usage: '.addplugin [namafile] [folder]',
    example: '.addplugin downloader',
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

function extractPluginInfo(code) {
    const info = { name: null, category: null }

    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i)
    if (nameMatch) info.name = nameMatch[1]

    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i)
    if (categoryMatch) info.category = categoryMatch[1]

    return info
}

function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

function cleanNameForDisplay(name) {
    return name.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

async function handler(m, { sock }) {
    const db = getDatabase();
    const quoted = m.quoted

    if (!quoted) {
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗔𝗗𝗗 𝗣𝗟𝗨𝗚𝗜𝗡 〕───⬣
│
│ ✦ Cara Pakai
│
│  𖦹 Reply code plugin
│  𖦹 Ketik .addplugin
│
│  𖦹 Optional:
│     .addplugin nama folder
│
╰──────────────────⬣`)
    }

    let code = quoted.text || quoted.body || ''

    if (quoted.mimetype === 'application/javascript' || quoted.filename?.endsWith('.js')) {
        try {
            code = (await quoted.download()).toString()
        } catch {
            return m.reply('❌ Gagal download file plugin')
        }
    }

    if (!code || code.length < 50) {
        return m.reply('❌ Code terlalu pendek / tidak valid')
    }

    if (!code.includes('module.exports') && !code.includes('pluginConfig')) {
        return m.reply('❌ Format plugin tidak valid')
    }

    const extracted = extractPluginInfo(code)

    const args = m.args || []

    let fileName = args[0] || extracted.name
    let folderName = args[1] || extracted.category

    if (!fileName) {
        return m.reply('❌ Tidak bisa mendeteksi nama plugin')
    }

    if (!folderName) folderName = 'other'

    const originalFileName = fileName
    
    fileName = sanitizeFileName(fileName)
    folderName = folderName.toLowerCase().replace(/[^a-z0-9]/g,'')

    m.react('⏳')

    try {
        const pluginsDir = path.join(process.cwd(),'plugins')
        const folderPath = path.join(pluginsDir,folderName)
        const filePath = path.join(folderPath,`${fileName}.js`)

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath,{ recursive:true })
        }

        if (fs.existsSync(filePath)) {
            m.react('❌')
            return m.reply(`❌ Plugin ${fileName}.js sudah ada`)
        }

        fs.writeFileSync(filePath,code)

        const reloadResult = hotReloadPlugin(filePath)
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        const channelMsg = 
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗨𝗣𝗗𝗔𝗧𝗘 〕───⬣
│
│ ✦ 𝗡𝗘𝗪 𝗣𝗟𝗨𝗚𝗜𝗡 𝗔𝗗𝗗𝗘𝗗
│
│  ✦ Name   : ${originalFileName}.js
│  ✦ Folder : ${folderName}
│  ✦ Size   : ${code.length} bytes
│  ✦ Time   : ${time}
│  ✦ By     : ${m.pushName}
│  ✦ Ch     : ${config.saluran?.link || 'Tidak tersedia'}
│
│ ─────────────────
│  Status : Active ✓
│
│  “Ara ara… plugin baru ya 😋”
│
╰──────────────────⬣`

        if (isNotifActive(db, EVENTS.ADD)) {
            try {
                const CHANNEL_ID = config.saluran?.id
                
                if (CHANNEL_ID) {
                    // 🔥 FIX: Ambil gambar dari URL
                    let thumbBuffer = null
                    try {
                        thumbBuffer = await loadImage('zerotwo-addplugin.jpg')
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
            } catch (e) {
                console.log("Gagal kirim channel:", e)
            }
        } else {
            console.log(`[AddPlugin] Notifikasi ADD dimatikan, skip kirim ke channel`)
        }

        m.react('✅')

        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗔𝗗𝗗𝗘𝗗
│
│  ✦ Name   : ${originalFileName}.js
│  ✦ Folder : ${folderName}
│  ✦ Size   : ${code.length} bytes
│  ✦ Reload : ${reloadResult.success ? 'Success ✓' : 'Pending ⏳'}
│
│ ─────────────────
│  Status : Ready ✓
│
│  “Good job, darling 😋”
│
╰──────────────────⬣`
        )

    } catch (error) {
        console.log(error)
        m.react('❌')
        return m.reply(`╭───〔 𝗘𝗥𝗥𝗢𝗥 〕───⬣\n│\n│ ${error.message}\n│\n╰────────────────⬣`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}