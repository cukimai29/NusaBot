const fs = require("fs")
const path = require("path")

const pluginConfig = {
    name: "ambilfileplugin",
    alias: ["getplugin","downloadplugin"],
    category: "owner",
    description: "Ambil file plugin berdasarkan nama",
    usage: ".ambilfileplugin <nama file>",
    example: ".ambilfileplugin bliblidl",
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

// Cari file plugin di folder plugins
function findPluginFile(pluginsDir, name){
    const folders = fs.readdirSync(pluginsDir,{ withFileTypes:true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
    
    for(const folder of folders){
        const folderPath = path.join(pluginsDir,folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))
        for(const file of files){
            const baseName = file.replace(".js","")
            if(baseName.toLowerCase() === name.toLowerCase()){
                return {
                    folder,
                    file,
                    path: path.join(folderPath,file)
                }
            }
        }
    }
    return null
}

async function handler(m,{ sock }){
    const args = m.text?.trim().split(/\s+/)
    const name = args[1] || args[0]

    if(!name){
        return m.reply(
`╭━━〔 💖 ZERO TWO AMBIL FILE PLUGIN 💖 〕━━⬣
┃
┃ Gunakan command dengan nama file plugin
┃ Contoh:
┃ → .ambilfileplugin bliblidl
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    m.react("⏳")

    try{
        const pluginsDir = path.join(process.cwd(),"plugins")
        const found = findPluginFile(pluginsDir,name)

        if(!found){
            m.react("❌")
            return m.reply(`❌ Plugin *${name}* tidak ditemukan 🗿`)
        }

        // UI Zero Two sebelum kirim
        const time = new Date().toLocaleTimeString()
        const uiMsg =
`╭━━〔 💖 ZERO TWO DOWNLOAD PLUGIN 💖 〕━━⬣
┃ Darling, aku download dulu file plugin nya 😋
┃
┃ 📦 Nama : ${found.file}
┃ 📁 Folder : ${found.folder}
┃ ⏰ Waktu : ${time}
╰━━━━━━━━━━━━━━━━⬣`

        await m.reply(uiMsg)

        // Kirim file
        await sock.sendMessage(
            m.chat,
            { document: { url: found.path }, fileName: found.file, mimetype: "application/javascript" }
        )

        m.react("✅")
    }catch(e){
        console.log(e)
        m.react("❌")
        return m.reply(
`╭━━〔 ❌ NUSABOT SYSTEM ❌ 〕━━⬣
┃
┃ ${e.message}
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = { config: pluginConfig, handler }