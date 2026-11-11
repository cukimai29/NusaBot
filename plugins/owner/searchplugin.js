const fs = require('fs')
const path = require('path')
const { getAllPlugins } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'searchplugin',
    alias: ['splugin', 'findplugin', 'infoplugin'],
    category: 'owner',
    description: 'Cari dan tampilkan info plugin',
    usage: '.splugin <nama>',
    example: '.splugin sticker',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function findPluginInfo(name) {
    const allPlugins = getAllPlugins()

    for (const plugin of allPlugins) {
        if (!plugin.config) continue

        const rawName = plugin.config.name
        const pName = (Array.isArray(rawName) ? rawName[0] : rawName)?.toLowerCase()
        const aliases = plugin.config.alias || []

        if (
            pName === name.toLowerCase() ||
            aliases.map((a) => a?.toLowerCase()).includes(name.toLowerCase())
        ) {
            return {
                ...plugin.config,
                filePath: plugin.filePath,
                folder: plugin.folder,
                file: plugin.file
            }
        }
    }

    return null
}

function findPluginFromFile(pluginsDir, name) {
    if (!fs.existsSync(pluginsDir)) {
        console.log(`[SearchPlugin] Folder plugins nggak ada: ${pluginsDir}`)
        return null
    }

    const folders = fs
        .readdirSync(pluginsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)

    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'))

        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                const filePath = path.join(folderPath, file)
                try {
                    delete require.cache[require.resolve(filePath)]
                    const mod = require(filePath)
                    return {
                        ...mod.config,
                        folder,
                        file,
                        filePath
                    }
                } catch (e) {
                    return { folder, file, filePath, error: e.message }
                }
            }
        }
    }

    return null
}

async function handler(m, ctx) {
    const { sock } = ctx

    // ===== Ambil argumen =====
    // Coba dari ctx.args dulu, kalau nggak ada baru parsing dari m.text
    let name = ''

    if (Array.isArray(ctx.args) && ctx.args.length > 0) {
        name = ctx.args.join(' ').trim()
    } else if (typeof ctx.text === 'string' && ctx.text.trim()) {
        name = ctx.text.trim()
    } else if (typeof m.text === 'string' && m.text.trim()) {
        // Kalau m.text ada prefix + command, buang dulu
        const prefix = m.prefix || '.'
        name = m.text.replace(new RegExp(`^\\${prefix}\\S+\\s*`), '').trim()
    }

    if (!name) {
        return m.reply(
            `🔍 *sᴇᴀʀᴄʜ ᴘʟᴜɢɪɴ*\n\n` +
            `> Cari dan tampilkan info plugin\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix || '.'}splugin sticker\`\n` +
            `> \`${m.prefix || '.'}splugin menu\``
        )
    }

    if (sock?.react) {
        try { await sock.react(m, '🔍') } catch {}
    }

    try {
        let info = findPluginInfo(name)
        let source = 'cache (getAllPlugins)'

        if (!info) {
            const pluginsDir = path.join(process.cwd(), 'plugins')
            info = findPluginFromFile(pluginsDir, name)
            source = 'scan folder plugins/'
        }

        // ===== LOG KE TERMINAL =====
        console.log('\n══════════════════════════════════════════')
        console.log(`[SearchPlugin] Query      : ${name}`)
        console.log(`[SearchPlugin] Sumber     : ${source}`)
        if (info) {
            console.log(`[SearchPlugin] Name       : ${info.name || '-'}`)
            console.log(`[SearchPlugin] Folder     : ${info.folder || '-'}`)
            console.log(`[SearchPlugin] File       : ${info.file || '-'}`)
            console.log(`[SearchPlugin] LOKASI ASLI: ${info.filePath || '-'}`)
            console.log(`[SearchPlugin] Category   : ${info.category || '-'}`)
            console.log(`[SearchPlugin] Cooldown   : ${info.cooldown || 0}s`)
            console.log(`[SearchPlugin] Energi     : ${info.energi || 0}`)
            console.log(`[SearchPlugin] Owner Only : ${info.isOwner ? 'Ya' : 'Tidak'}`)
            console.log(`[SearchPlugin] Enabled    : ${info.isEnabled !== false ? 'Ya' : 'Tidak'}`)
        } else {
            console.log(`[SearchPlugin] Hasil      : TIDAK DITEMUKAN`)
        }
        console.log('══════════════════════════════════════════\n')

        if (!info) {
            if (sock?.react) {
                try { await sock.react(m, '❌') } catch {}
            }
            return m.reply(
                `❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
                `> Plugin \`${name}\` tidak ditemukan\n\n` +
                `> Cek terminal buat log lengkap`
            )
        }

        if (info.error) {
            if (sock?.react) {
                try { await sock.react(m, '⚠️') } catch {}
            }
            return m.reply(
                `⚠️ *ᴘʟᴜɢɪɴ ᴇʀʀᴏʀ*\n\n` +
                `> File: \`${info.file}\`\n` +
                `> Folder: \`${info.folder}\`\n` +
                `> Lokasi: \`${info.filePath}\`\n` +
                `> Error: \`${info.error}\``
            )
        }

        const aliases = info.alias?.join(', ') || '-'
        const isEnabled = info.isEnabled !== false ? '✅ Ya' : '❌ Tidak'
        const isOwner = info.isOwner ? '✅ Ya' : '❌ Tidak'
        const isPremium = info.isPremium ? '✅ Ya' : '❌ Tidak'
        const isGroup = info.isGroup ? '✅ Ya' : '❌ Tidak'
        const isPrivate = info.isPrivate ? '✅ Ya' : '❌ Tidak'
        const isAdmin = info.isAdmin ? '✅ Ya' : '❌ Tidak'

        // Path relatif dari root project
        const relPath = info.filePath
            ? path.relative(process.cwd(), info.filePath)
            : '-'

        if (sock?.react) {
            try { await sock.react(m, '✅') } catch {}
        }

        return m.reply(
            `📋 *ɪɴꜰᴏ ᴘʟᴜɢɪɴ*\n\n` +
            `╭┈┈⬡「 📝 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📛 ɴᴀᴍᴀ: \`${info.name || '-'}\`\n` +
            `┃ 🏷️ ᴀʟɪᴀs: \`${aliases}\`\n` +
            `┃ 📁 ᴄᴀᴛᴇɢᴏʀʏ: \`${info.category || '-'}\`\n` +
            `┃ 📄 ᴅᴇsᴄ: ${info.description || '-'}\n` +
            `┃ 📝 ᴜsᴀɢᴇ: \`${info.usage || '-'}\`\n` +
            `┃ 📌 ᴇxᴀᴍᴘʟᴇ: \`${info.example || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📂 *ʟᴏᴋᴀsɪ* 」\n` +
            `┃ 📁 ꜰᴏʟᴅᴇʀ: \`${info.folder || '-'}\`\n` +
            `┃ 📄 ꜰɪʟᴇ: \`${info.file || '-'}\`\n` +
            `┃ 🗂️ ʀᴇʟᴀᴛɪᴠᴇ: \`${relPath}\`\n` +
            `┃ 💾 ᴀʙsᴏʟᴜᴛ: \`${info.filePath || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 ⚙️ *sᴇᴛᴛɪɴɢs* 」\n` +
            `┃ 🔓 ᴇɴᴀʙʟᴇᴅ: ${isEnabled}\n` +
            `┃ 👑 ᴏᴡɴᴇʀ ᴏɴʟʏ: ${isOwner}\n` +
            `┃ 💎 ᴘʀᴇᴍɪᴜᴍ: ${isPremium}\n` +
            `┃ 👥 ɢʀᴏᴜᴘ ᴏɴʟʏ: ${isGroup}\n` +
            `┃ 💬 ᴘʀɪᴠᴀᴛᴇ ᴏɴʟʏ: ${isPrivate}\n` +
            `┃ 🛡️ ᴀᴅᴍɪɴ ᴏɴʟʏ: ${isAdmin}\n` +
            `┃ ⏱️ ᴄᴏᴏʟᴅᴏᴡɴ: \`${info.cooldown || 0}s\`\n` +
            `┃ 🔋 ᴇɴᴇʀɢɪ: \`${info.energi || 0}\`\n` +
            `╰┈┈⬡`
        )

    } catch (error) {
        console.log('[SearchPlugin] Error:', error)
        if (sock?.react) {
            try { await sock.react(m, '❌') } catch {}
        }
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}