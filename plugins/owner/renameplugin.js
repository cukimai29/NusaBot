const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/plugins')
const config = require('../../config')

const pluginConfig = {
    name: "renameplugin",
    alias: ["rename", "gantinamaplugin", "editpluginname"],
    category: "owner",
    description: "Mengganti nama plugin (rename file)",
    usage: ".renameplugin <nama_lama> | <nama_baru>",
    example: ".renameplugin ytplay | ytdownload",
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

// Cari file plugin berdasarkan nama
function findPluginFile(pluginsDir, name) {
    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))

        for (const file of files) {
            const base = file.replace(".js", "")
            if (base.toLowerCase() === name.toLowerCase()) {
                return { folder, file, path: path.join(folderPath, file) }
            }
        }
    }
    return null
}

async function handler(m, { sock }) {
    const args = m.args || []
    const fullText = m.text?.trim() || ''
    
    // Parse format: .renameplugin nama_lama | nama_baru
    let oldName = null
    let newName = null
    
    // Cek format dengan pipe |
    if (fullText.includes('|')) {
        const parts = fullText.split('|')
        oldName = parts[0].replace(/\.renameplugin\s*/i, '').trim()
        newName = parts[1].trim()
    } 
    // Cek format tanpa pipe (pake args)
    else if (args.length >= 2) {
        oldName = args[0]
        newName = args.slice(1).join('_')
    }
    
    if (!oldName || !newName) {
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗥𝗘𝗡𝗔𝗠𝗘 𝗣𝗟𝗨𝗚𝗜𝗡 〕───⬣
│
│ ✦ *Cara Pakai*
│
│  𖦹 .renameplugin <lama> | <baru>
│
│ ✦ *Contoh*
│
│  𖦹 .renameplugin ytplay | ytdownload
│  𖦹 .renameplugin berburu | hunt
│
│ ✦ *Note*
│
│  𖦹 Nama hanya huruf, angka, underscore
│  𖦹 Case-sensitive
│  𖦹 Plugin akan otomatis reload
│
╰──────────────────⬣`
        )
    }
    
    // Validasi nama baru
    if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
        return m.reply(
`💔 *NAMA PLUGIN TIDAK VALID!*

┌────────────────────┐
│ Nama hanya boleh:  │
│ • Huruf (a-z)      │
│ • Angka (0-9)      │
│ • Underscore (_)   │
└────────────────────┘

❌ Nama: \`${newName}\`

💕 Coba lagi darling~ 🦋`
        )
    }
    
    // Cek nama lama dan baru sama
    if (oldName.toLowerCase() === newName.toLowerCase()) {
        return m.reply(`💔 Nama lama dan baru sama darling~ Gak usah diganti`)
    }
    
    await m.react("⏳")
    
    try {
        const pluginsDir = path.join(process.cwd(), "plugins")
        const found = findPluginFile(pluginsDir, oldName)
        
        if (!found) {
            await m.react("❌")
            return m.reply(`💔 *Plugin "${oldName}" tidak ditemukan!*\n\nCek lagi nama nya darling~`)
        }
        
        // Cek apakah nama baru sudah ada
        const existing = findPluginFile(pluginsDir, newName)
        if (existing) {
            await m.react("❌")
            return m.reply(`💔 *Plugin "${newName}" sudah ada!*\n\nGanti dengan nama lain darling~`)
        }
        
        const oldPath = found.path
        const newPath = path.join(path.dirname(oldPath), `${newName}.js`)
        
        // Baca isi file
        let content = fs.readFileSync(oldPath, 'utf-8')
        
        // Update nama di dalam file (pluginConfig)
        content = content.replace(
            /name:\s*['"`](.+)['"`]/,
            `name: '${newName}'`
        )
        
        // Update alias (tambahin nama baru)
        if (content.includes('alias:')) {
            content = content.replace(
                /(alias:\s*\[)([^\]]*)(\])/,
                (match, open, middle, close) => {
                    const aliases = middle.split(',').map(a => a.trim().replace(/['"`]/g, ''))
                    if (!aliases.includes(newName)) {
                        aliases.push(newName)
                    }
                    return `${open} '${aliases.join("', '")}' ${close}`
                }
            )
        }
        
        // Tulis file baru
        fs.writeFileSync(newPath, content, 'utf-8')
        
        // Hapus file lama
        fs.unlinkSync(oldPath)
        
        // Reload plugin yang baru
        const reload = hotReloadPlugin(newPath)
        
        await m.react("✅")
        
        return m.reply(
`╭───〔 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 〕───⬣
│
│ ✦ 𝗣𝗟𝗨𝗚𝗜𝗡 𝗥𝗘𝗡𝗔𝗠𝗘𝗗
│
│  ✦ Old : ${oldName}.js
│  ✦ New : ${newName}.js
│  ✦ Folder : ${found.folder}
│
│ ─────────────────
│  Status : Active ✓
│
│  “Sekarang panggilnya ${newName} ya darling~ 💕”
│
╰──────────────────⬣`
        )
        
    } catch (err) {
        console.error('[RenamePlugin] Error:', err)
        await m.react("❌")
        return m.reply(
`💔 *ERROR RENAME PLUGIN!*

┌────────────────────┐
│ ❌ ${err.message.substring(0, 50)}
└────────────────────┘

💕 Coba lagi darling~ 🦋`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}