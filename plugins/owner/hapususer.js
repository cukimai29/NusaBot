const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'hapususer',
    alias: ['deluser','deleteuser'],
    category: 'owner',
    description: 'Hapus user dari database',
    usage: '.hapususer',
    isOwner: true,
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {

    const db = getDatabase()
    const args = m.args || []

    // ✅ CONFIRM HAPUS
    if (args[0] === '--confirm' && args[1]) {

        const target = args[1]
        const user = db.data.users[target]

        if (!user) {
            return m.reply(`❌ User tidak ditemukan.`)
        }

        delete db.data.users[target]
        db.save()

        return m.reply(
`╭━━━〔 💔 ZERO TWO DELETE 💔 〕━━━⬣
┃
┃ Ara ara~ user berhasil dihapus 😈
┃
┃ 👤 Target : ${target}
┃ 💣 Status : *Terhapus*
┃
┃ Jangan nakal lagi ya darling...
┃ atau kamu berikutnya 😏
┃
╰━━━━━━━━━━━━━━━━━━⬣`
        )
    }

    // 📋 AMBIL USER LIST
    const users = Object.entries(db.data.users || {})

    if (users.length === 0) {
        return m.reply(`❌ Tidak ada user di database.`)
    }

    // 🔽 FORMAT LIST
    const rows = users.slice(0, 50).map(([jid, user]) => ({
        title: user.name || 'No Name',
        description: `💰 Koin: ${user.koin || 0}`,
        id: `${m.prefix}hapususer --confirm ${jid}`
    }))

    // 💗 UI ZERO TWO
    await sock.sendMessage(m.chat, {
        text:
`╭━━━〔 💗 NUSABOT SYSTEM 💗 〕━━━⬣
┃
┃ Hai ${m.pushName || 'Darling'} 😋
┃ Mau hapus siapa nih?
┃
┃ Pilih user di bawah ya~
┃ Jangan salah pilih 😈
┃
╰━━━━━━━━━━━━━━━━━━⬣`,
        footer: 'NusaBot 💗',
        interactiveButtons: [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '💀 Pilih Target',
                    sections: [
                        {
                            title: 'Daftar User',
                            rows
                        }
                    ]
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}