const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'file',
    alias: ['getfile', 'ambilfile'],
    category: 'owner',
    description: 'Mengambil file dari folder plugin',
    usage: '.file <nama file>',
    example: '.file setallmenu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function findFile(dir, target) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            const result = findFile(fullPath, target)
            if (result) return result
        } else {
            const name = path.parse(file).name.toLowerCase()
            const fullName = file.toLowerCase()

            if (
                name === target.toLowerCase() ||
                fullName === target.toLowerCase() ||
                fullName === `${target.toLowerCase()}.js`
            ) {
                return fullPath
            }
        }
    }

    return null
}

async function handler(m, { sock }) {
    const target = (m.text || '').trim()

    if (!target) {
        return m.reply(
            `📂 *FILE MANAGER*\n\n` +
            `Contoh:\n` +
            `> ${m.prefix}file setallmenu\n` +
            `> ${m.prefix}file ping\n` +
            `> ${m.prefix}file owner`
        )
    }

    try {
        const pluginDir = path.join(process.cwd(), 'plugins')
        const filePath = findFile(pluginDir, target)

        if (!filePath) {
            return m.reply(`❌ File *${target}* tidak ditemukan.`)
        }

        const buffer = fs.readFileSync(filePath)

        await sock.sendMessage(
            m.chat,
            {
                document: buffer,
                mimetype: 'application/javascript',
                fileName: path.basename(filePath),
                caption:
                    `✅ *FILE DITEMUKAN*\n\n` +
                    `📄 ${path.basename(filePath)}\n` +
                    `📂 ${path.relative(process.cwd(), filePath)}`
            },
            { quoted: m }
        )

    } catch (err) {
        console.error(err)
        m.reply(`❌ Error:\n${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}