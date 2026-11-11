const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../../config.js')
const { AIRich } = require('../../src/lib/aiRich.js')

const pluginConfig = {
    name: 'getplugin3',
    alias: ['gp3', 'getcode3', 'plugincode3', 'sourcecode3'],
    category: 'owner',
    description: 'Dapatkan source code plugin (force code card)',
    usage: '.getplugin3 <nama plugin>',
    example: '.getplugin3 menu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function searchPlugin(name, pluginsDir) {
    const categories = fs.readdirSync(pluginsDir).filter((f) => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))
        for (const file of files) {
            const baseName = file.replace('.js', '').toLowerCase()
            if (baseName === name.toLowerCase()) {
                return { path: path.join(categoryPath, file), category, file }
            }
        }
    }
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))
        for (const file of files) {
            const filePath = path.join(categoryPath, file)
            try {
                const content = fs.readFileSync(filePath, 'utf-8')
                const aliasMatch = content.match(/alias:\s*\[([^\]]+)\]/)
                if (aliasMatch) {
                    const aliases = aliasMatch[1].match(/['"`]([^'"`]+)['"`]/g)
                    if (aliases) {
                        const cleanAliases = aliases.map((a) => a.replace(/['"`]/g, '').toLowerCase())
                        if (cleanAliases.includes(name.toLowerCase())) {
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
    const categories = fs.readdirSync(pluginsDir).filter((f) => fs.statSync(path.join(pluginsDir, f)).isDirectory())
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))
        for (const file of files) {
            const baseName = file.replace('.js', '').toLowerCase()
            if (baseName.includes(name.toLowerCase()) || name.toLowerCase().includes(baseName)) {
                results.push(`${category}/${file}`)
            }
        }
    }
    return results.slice(0, 5)
}

function extractMeta(content) {
    const meta = {}
    const pick = (regex) => {
        const m = content.match(regex)
        return m ? m[1].trim().replace(/['"`,]$/g, '').trim() : null
    }
    meta.name = pick(/name:\s*['"`]([^'"`]+)['"`]/)
    meta.category = pick(/category:\s*['"`]([^'"`]+)['"`]/)
    meta.description = pick(/description:\s*['"`]([^'"`]+)['"`]/)
    meta.usage = pick(/usage:\s*['"`]([^'"`]+)['"`]/)
    meta.owner = pick(/isOwner:\s*(true|false)/)
    meta.premium = pick(/isPremium:\s*(true|false)/)
    meta.group = pick(/isGroup:\s*(true|false)/)
    meta.private = pick(/isPrivate:\s*(true|false)/)
    meta.cooldown = pick(/cooldown:\s*(\d+)/)
    meta.energi = pick(/energi:\s*(\d+)/)
    meta.enabled = pick(/isEnabled:\s*(true|false)/)
    const aliasMatch = content.match(/alias:\s*\[([^\]]+)\]/)
    if (aliasMatch) {
        const aliases = aliasMatch[1].match(/['"`]([^'"`]+)['"`]/g)
        meta.aliases = aliases ? aliases.map((a) => a.replace(/['"`]/g, '')) : []
    } else { meta.aliases = [] }
    return meta
}

function boolIcon(val) {
    if (val === 'true') return '✅ Ya'
    if (val === 'false') return '❌ Tidak'
    return '❔ -'
}

async function handler(m, { sock, args }) {
    if (!m.isOwner) return m.reply('❌ *Owner Only!*')

    const pluginName = (Array.isArray(args) ? args[0] : m.args?.[0])?.trim()
    if (!pluginName) {
        return m.reply(`📦 *ɢᴇᴛ ᴘʟᴜɢɪɴ*\n\n> Dapatkan source code plugin\n\n╭┈┈⬡「 📋 *ғᴏʀᴍᴀᴛ* 」\n┃.getplugin3 <nama>\n╰┈┈┈┈┈┈┈┈⬡\n\n*Contoh:*\n>.getplugin3 menu`)
    }

    const pluginsDir = path.join(process.cwd(), 'plugins')
    let pluginInfo = null
    if (pluginName.includes('/')) {
        const [category, file] = pluginName.split('/')
        const filePath = path.join(pluginsDir, category, file.endsWith('.js') ? file : `${file}.js`)
        if (fs.existsSync(filePath)) {
            pluginInfo = { path: filePath, category, file: file.endsWith('.js') ? file : `${file}.js` }
        }
    } else {
        pluginInfo = searchPlugin(pluginName, pluginsDir)
    }

    if (!pluginInfo) {
        const similar = getSimilarPlugins(pluginName, pluginsDir)
        let text = `❌ *ᴘʟᴜɢɪɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Plugin \`${pluginName}\` tidak ditemukan\n\n`
        if (similar.length > 0) {
            text += `*Mungkin maksud kamu:*\n`
            similar.forEach((s) => { text += `> - \`${s}\`\n` })
        }
        return m.reply(text)
    }

    const code = fs.readFileSync(pluginInfo.path)
    const codeStr = code.toString('utf-8')
    const meta = extractMeta(codeStr)

    // ═══════════════════════════════════════════
    // 🔥 FORCE CODE CARD (pake relayMessage + bot node)
    // ═══════════════════════════════════════════
    try {
        let ai = new AIRich(sock)
        ai.setTitle(`Info Plugin: ${pluginInfo.file}`)
        ai.addText(`🍿 Hallo Ownerku *${m.pushName}*, berikut info plugin yang kamu minta:`)

        // 1. TABLE
        const tableData = [
            ['Info', 'Value'],
            ['File', pluginInfo.file],
            ['Category', pluginInfo.category],
            ['Nama', meta.name || '-'],
            ['Cooldown', `${meta.cooldown || 0}s`],
            ['Energi', String(meta.energi || 0)],
            ['Owner Only', boolIcon(meta.owner)],
            ['Premium Only', boolIcon(meta.premium)],
            ['Group Only', boolIcon(meta.group)],
            ['Private Only', boolIcon(meta.private)],
            ['Aktif', boolIcon(meta.enabled)],
        ]
        if (meta.aliases?.length) tableData.push(['Alias', meta.aliases.join(', ')])
        ai.addTable(tableData)

        // 2. DESKRIPSI + USAGE
        if (meta.description) ai.addText(`📝 *Deskripsi:*\n> ${meta.description}`)
        if (meta.usage) ai.addText(`📖 *Usage:*\n> ${meta.usage}`)

        // 3. CODE CARD
        ai.addText('💻 *Source Code:*')
        ai.addCode('javascript', codeStr)

        // 4. Footer
        ai.setFooter(`© ${config.bot?.name || 'Hoshino Ai'}`)

        // 5. BUILD + FORCE KIRIM
        const builtMsg = ai.build({ forwarded: true })

        // 🔥 INJECT contextInfo biar WA server nampilin rich response
        if (builtMsg.botForwardedMessage?.message?.richResponseMessage) {
            builtMsg.botForwardedMessage.message.richResponseMessage.contextInfo = {
                ...(builtMsg.botForwardedMessage.message.richResponseMessage.contextInfo || {}),
                forwardingScore: 9999,
                isForwarded: true,
                forwardOrigin: 4,
                forwardedAiBotMessageInfo: { botJid: '0@bot' },
                messageSecret: crypto.randomBytes(32)
            }
        }

        // 🔥 PAKSA KIRIM pake relayMessage + bot node
        await sock.relayMessage(m.chat, builtMsg, {
            messageId: crypto.randomBytes(8).toString('hex').toUpperCase(),
            additionalNodes: [
                {
                    tag: 'bot',
                    attrs: { biz_bot: '1' }
                }
            ]
        })

        console.log('[GetPlugin3] ✅ Code card terkirim (force mode)')

    } catch (err) {
        console.log('[GetPlugin3] ❌ FORCE ERROR:', err)
        console.log('[GetPlugin3] Stack:', err.stack)

        // ═══════════════════════════════════════════
        // FALLBACK: kirim sebagai text code block
        // ═══════════════════════════════════════════
        try {
            let caption = `📦 *ɪɴꜰᴏ ᴘʟᴜɢɪɴ*\n\n`
            caption += `╭━━━━━━━━━━━━━━━━━━━━╮\n`
            caption += `┃ 📄 File : ${pluginInfo.file}\n`
            caption += `┃ 📂 Category : ${pluginInfo.category}\n`
            caption += `┃ 🔖 Nama : ${meta.name || '-'}\n`
            caption += `┃ ⚡ Cooldown : ${meta.cooldown || 0}s\n`
            caption += `┃ 🔋 Energi : ${meta.energi || 0}\n`
            caption += `┃ 👑 Owner : ${boolIcon(meta.owner)}\n`
            caption += `┃ 💎 Premium : ${boolIcon(meta.premium)}\n`
            caption += `┃ 👥 Group : ${boolIcon(meta.group)}\n`
            caption += `┃ 💬 Private : ${boolIcon(meta.private)}\n`
            caption += `┃ 🟢 Aktif : ${boolIcon(meta.enabled)}\n`
            caption += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`
            if (meta.aliases?.length) caption += `🔖 *Alias:* ${meta.aliases.map(a => `\`${a}\``).join(', ')}\n\n`
            if (meta.description) caption += `📝 *Deskripsi:*\n> ${meta.description}\n\n`

            await sock.sendMessage(m.chat, { text: caption }, { quoted: m })

            // Kirim code sebagai text code block
            const CHUNK = 3500
            if (codeStr.length <= CHUNK) {
                await sock.sendMessage(m.chat, {
                    text: '```javascript\n' + codeStr + '\n```'
                }, { quoted: m })
            } else {
                // Kirim dokumen kalau kepanjangan
                await sock.sendMessage(m.chat, {
                    document: code,
                    fileName: pluginInfo.file,
                    mimetype: 'text/javascript',
                    caption: `💻 *Source Code:* ${pluginInfo.file}`
                }, { quoted: m })
            }

        } catch (fallbackErr) {
            console.log('[GetPlugin3] ❌ FALLBACK ERROR:', fallbackErr)
            await m.reply(`❌ *Gagal kirim code*\n\n\`${err.message}\``)
        }
    }
}

module.exports = { config: pluginConfig, handler }