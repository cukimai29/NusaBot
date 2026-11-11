const pluginConfig = {
    name: 'cekidgroup',
    alias: ['gid','groupid','cekgrup'],
    category: 'owner',
    description: 'Cek info & ID grup tempat bot berada ala Zero Two',
    usage: '.cekidgroup',
    example: '.cekidgroup',
    isOwner: true,
    isGroup: false,
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        let targetChat = m.isGroup ? m.chat : m.quoted?.chat || m.chat
        if (!targetChat) return m.reply('❌ Tidak ada grup yang bisa dicek 😑')

        const meta = await sock.groupMetadata(targetChat)
        const participants = meta.participants || []

        // Cari owner dari participant list
        let ownerName = 'Tidak diketahui'
        const ownerJid = meta.owner
        if (ownerJid) {
            const ownerData = participants.find(p => p.id === ownerJid)
            if (ownerData) ownerName = ownerData.name || ownerData.pushname || ownerJid.split('@')[0]
        }

        const replyMsg =
`╭━━〔 💖 ZERO TWO GROUP INFO 💖 〕━━⬣
│
│ 🏷 Nama Grup       : *${meta.subject}*
│ 🆔 Group ID        : *${meta.id}*
│ 👑 Owner           : *${ownerName}*
│ 👥 Jumlah Anggota  : *${participants.length}*
│
╰━━━━━━━━━━━━━━━━⬣`

        await m.reply(replyMsg)

    } catch (err) {
        await m.reply(
`╭━━〔 ❌ NUSABOT SYSTEM 〕━━⬣
│
│ ${err.message}
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = { config: pluginConfig, handler }