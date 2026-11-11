const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'getpluginfile',
    alias: ['gpfile', 'getplugin'],
    category: 'owner',
    description: 'Ambil file plugin langsung dari folder plugin (Zero Two vibes)',
    usage: '.getpluginfile <nama_plugin>',
    example: '.getpluginfile menu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

let cachedThumb = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    if (fs.existsSync(thumbPath)) cachedThumb = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo() {
    // Ganti ke saluran punya lo dan nama bot jadi NusaBot
    const saluranId = '120363402057133599@newsletter' // ganti ini ke ID lo
    const saluranName = 'NusaBot'
    
    return {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `Zero Two Plugin Sender 💗`,
            body: saluranName,
            sourceUrl: config.saluran?.link || '',
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnail: cachedThumb
        }
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    let pluginName = args[0]?.toLowerCase() || ''
    const prefix = config.command?.prefix || '.'

    if (!pluginName) {
        return m.reply(`❌ *Gunakan:*\n${prefix}getpluginfile <nama_plugin>\nContoh: ${prefix}getpluginfile menu`)
    }

    // Hapus ekstensi .js jika ada
    pluginName = pluginName.replace(/\.js$/i, '')

    const pluginFolder = path.join(process.cwd(), 'plugins')
    const pluginFile = path.join(pluginFolder, `${pluginName}.js`)

    if (!fs.existsSync(pluginFile)) {
        return m.reply(`❌ *Plugin tidak ditemukan*\n> Pastikan nama plugin benar: \`${pluginName}.js\``)
    }

    try {
        // Kirim dulu sapaan ala Zero Two
        await sock.sendMessage(m.chat, {
            text:
`╭━━━〔 💗 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 💗 〕━━━╮
│
│ Hai Darling 😋
│ Aku akan mengirim plugin
│ yang kamu minta: *${pluginName}.js*
│
│ Tunggu sebentar ya 💖
╰━━━━━━━━━━━━━━━━━━━━╯`,
            contextInfo: getContextInfo()
        }, { quoted: m })

        // Kirim file plugin
        await sock.sendMessage(m.chat, {
            document: { url: pluginFile },
            fileName: `${pluginName}.js`,
            mimetype: 'application/javascript',
            caption: `💌 *Plugin ${pluginName}.js sudah siap, Darling!*`
        }, { quoted: m })

    } catch (error) {
        console.error('[getpluginfile]', error)
        m.reply(`❌ *Error saat mengirim file*\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}