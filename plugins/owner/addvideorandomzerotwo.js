const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'add-video-randomzerotwo',
    alias: ['addvz','addvideo02'],
    category: 'owner',
    description: 'Tambah link video Zero Two',
    usage: '.addvz <link>',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
}

const dbPath = path.join(process.cwd(), 'src/scraper/zerotwo-videos.json')

// 🔥 ambil database
function getDB(){
    if (!fs.existsSync(dbPath)) return []
    return JSON.parse(fs.readFileSync(dbPath))
}

// 🔥 simpan database
function saveDB(data){
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

async function handler(m) {

    const args = m.args

    // ❌ gak ada link
    if (!args[0]) {
        return m.reply(
`╭━━━〔 ⚠️ CARA PAKAI 〕━━━⬣
┃
┃ .addvz <link video>
┃
┃ Contoh:
┃ .addvz https://a.top4top.io/video.mp4
┃
╰━━━━━━━━━━━━━━━━━━⬣`)
    }

    const url = args[0]

    // 🔥 validasi sederhana
    if (!/^https?:\/\//.test(url)) {
        return m.reply('❌ Link tidak valid 🗿')
    }

    try {

        let db = getDB()

        // ❌ cek duplikat
        if (db.includes(url)) {
            return m.reply('⚠️ Link sudah ada di database 🗿')
        }

        // 🔥 tambah
        db.push(url)

        // 🔥 simpan
        saveDB(db)

        m.reply(
`╭━━━〔 💗 ZERO TWO DATABASE 💗 〕━━━⬣
┃
┃ Link berhasil ditambahkan 😈
┃
┃ 🔗 ${url}
┃
┃ 📊 Total : ${db.length} video
┃
╰━━━━━━━━━━━━━━━━━━⬣`
        )

    } catch (err) {

        console.log(err)

        m.reply(`❌ Gagal simpan link 😢`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}