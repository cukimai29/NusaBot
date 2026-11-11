const { config } = require('../../config')
const { generateWAMessageContent, generateWAMessageFromContent } = require('zerotwo')
const crypto = require('crypto')

const pluginConfig = {
    name: 'leave',
    alias: ['leavegrup','leavegroup','keluar','bye'],
    category: 'owner',
    description: 'Bot keluar dari grup dengan UI interaktif ala Zero Two & pesan perpisahan',
    usage: '.leave (reply/klik grup)',
    example: '.leave',
    isOwner: true,
    cooldown: 10,
    isEnabled: true
}

// pending list leave per user
const pendingLeave = new Map()

async function sendLeaveList(sock, m) {
    try {
        const groups = await sock.groupFetchAllParticipating()
        const groupList = Object.entries(groups)

        if (groupList.length === 0) {
            return m.reply('❌ Bot tidak ada di grup manapun 😑')
        }

        const groupRows = groupList.map(([id, meta]) => ({
            title: meta.subject || 'Group',
            description: id,
            id: `${m.prefix}leave --confirm ${id}`
        }))

        const uiMsg =
`╭━━〔 💖 ZERO TWO LEAVE 💖 〕━━⬣
│ Hai ${m.pushName || 'Darling'} 😋
│
│ Pilih grup yang ingin
│ aku tinggalkan~
│
│ Kamu punya ${groupList.length} grup
╰━━━━━━━━━━━━━━━━⬣`

        await sock.sendMessage(m.chat, {
            text: uiMsg,
            footer: config.bot?.name || 'NusaBot',
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '🏠 Pilih Grup untuk Leave',
                        sections: [
                            {
                                title: 'Daftar Grup',
                                rows: groupRows
                            }
                        ]
                    })
                }
            ]
        })

    } catch (err) {
        await m.reply(`❌ ERROR\n\n${err.message}`)
    }
}

async function handler(m, { sock }) {
    const args = m.args || []

    // confirm leave dari button
    if (args[0] === '--confirm' && args[1]) {
        const targetGroupJid = args[1]
        let groupName = 'Grup'

        try {
            const meta = await sock.groupMetadata(targetGroupJid)
            groupName = meta.subject || groupName
        } catch {}

        try {
            // Kirim pesan perpisahan ke grup dulu
            const farewellMsg =
`╭━━〔 💖 ZERO TWO BYE 💖 〕━━⬣
│ Hai semua 😢
│
│ Aku harus pergi dari grup ini
│ Terima kasih sudah main sama aku!
│ Semoga kalian semua bahagia~ ❤️
╰━━━━━━━━━━━━━━━━⬣`

            await sock.sendMessage(targetGroupJid, { text: farewellMsg })

            // Tunggu sebentar biar pesan terkirim
            await new Promise(r => setTimeout(r, 1000))

            // Baru keluar dari grup
            await sock.groupLeave(targetGroupJid)

            // Konfirmasi ke user
            await m.reply(
`✅ Aku berhasil keluar dari grup:
*${groupName}* 💖
Ara ara~ sampai jumpa!`
            )

        } catch (err) {
            await m.reply(`❌ Gagal keluar dari grup:\n${err.message}`)
        }

        return
    }

    // Kalau nggak ada args, tampilkan list grup
    await sendLeaveList(sock, m)
}

module.exports = { config: pluginConfig, handler }