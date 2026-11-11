const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'getplugin',
    alias: ['gp', 'getcode', 'plugincode', 'sourcecode'],
    category: 'owner',
    description: 'Dapatkan source code plugin',
    usage: '.getplugin <nama plugin>',
    example: '.getplugin menu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function searchPlugin(name, pluginsDir) {
    const categories = fs.readdirSync(pluginsDir).filter(f =>
        fs.statSync(path.join(pluginsDir, f)).isDirectory()
    )

    for (const category of categories) {
        const files = fs.readdirSync(path.join(pluginsDir, category)).filter(f => f.endsWith('.js'))
        for (const file of files) {
            if (file.replace('.js', '').toLowerCase() === name.toLowerCase()) {
                return { path: path.join(pluginsDir, category, file), category, file }
            }
        }
    }

    for (const category of categories) {
        const files = fs.readdirSync(path.join(pluginsDir, category)).filter(f => f.endsWith('.js'))
        for (const file of files) {
            const filePath = path.join(pluginsDir, category, file)
            try {
                const content = fs.readFileSync(filePath, 'utf-8')
                const aliasMatch = content.match(/alias:\s*\[([^\]]+)\]/)
                if (aliasMatch) {
                    const aliases = aliasMatch[1].match(/['"`]([^'"`]+)['"`]/g)
                    if (aliases) {
                        const clean = aliases.map(a => a.replace(/['"`]/g, '').toLowerCase())
                        if (clean.includes(name.toLowerCase())) {
                            return { path: filePath, category, file }
                        }
                    }
                }
            } catch {}
        }
    }

    return null
}

function getSimilarPlugins(name, pluginsDir) {
    const results = []
    const categories = fs.readdirSync(pluginsDir).filter(f =>
        fs.statSync(path.join(pluginsDir, f)).isDirectory()
    )

    for (const category of categories) {
        const files = fs.readdirSync(path.join(pluginsDir, category)).filter(f => f.endsWith('.js'))
        for (const file of files) {
            const base = file.replace('.js', '').toLowerCase()
            if (base.includes(name.toLowerCase()) || name.toLowerCase().includes(base)) {
                results.push(`${category}/${file}`)
            }
        }
    }

    return results.slice(0, 5)
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ Owner Only!')
    }

    const pluginName = m.args?.[0]?.trim()

    if (!pluginName) {
        return m.reply(
`╭━━━〔 📦 GET PLUGIN 〕━━━⬣
┃ Mau ngambil plugin ya? 😏
┃
┃ Format:
┃ ${m.prefix}getplugin <nama>
┃
┃ Contoh:
┃ ${m.prefix}getplugin menu
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const pluginsDir = path.join(process.cwd(), 'plugins')
    let pluginInfo = null

    if (pluginName.includes('/')) {
        const [category, file] = pluginName.split('/')
        const filePath = path.join(pluginsDir, category, file.endsWith('.js') ? file : file + '.js')
        if (fs.existsSync(filePath)) {
            pluginInfo = { path: filePath, category, file }
        }
    } else {
        pluginInfo = searchPlugin(pluginName, pluginsDir)
    }

    if (!pluginInfo) {
        const similar = getSimilarPlugins(pluginName, pluginsDir)

        let text =
`╭━━━〔 ❌ TIDAK DITEMUKAN 〕━━━⬣
┃ Plugin "${pluginName}" gak ada 😤
┃
┃ Coba cek lagi ya
╰━━━━━━━━━━━━━━━━⬣`

        if (similar.length) {
            text += `\n\nMungkin maksud kamu:\n`
            similar.forEach(s => text += `> ${s}\n`)
        }

        return m.reply(text)
    }

    // 😈 UI DELAY
    await sock.sendMessage(m.chat, {
        text:
`╭━━━〔 😈 ZERO TWO 〕━━━⬣
┃ Siap darling~ 💗
┃
┃ Plugin nya aku ambil dulu ya...
┃ Jangan kemana-mana 😏
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })

    await new Promise(r => setTimeout(r, 1000))

    try {
        const code = fs.readFileSync(pluginInfo.path, 'utf-8')

        await sock.sendMessage(m.chat, {
            text:
`╭━━━〔 📦 ${pluginInfo.file} 〕━━━⬣
┃ Nih ya... aku kasih 😈
┃
┃ Jangan disalahgunakan 😤
╰━━━━━━━━━━━━━━━━⬣

\`\`\`javascript
${code}
\`\`\`
`,
            footer: 'NusaBot',
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true
            },
            interactiveButtons: [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copy Plugin',
                        copy_code: code
                    })
                }
            ]
        }, { quoted: m })

    } catch (e) {
        m.reply(
`╭━━━〔 ❌ ERROR 〕━━━⬣
┃ Gagal ambil plugin 😔
┃
┃ ${e.message}
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}