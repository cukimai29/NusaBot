const pluginConfig = {
    name: 'addadmin',
    alias: ['promote'],
    category: 'group',
    description: 'Menjadikan member sebagai admin',
    usage: '.addadmin @user',
    example: '.addadmin @628xxxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 5,
    isEnabled: true
}

async function handler(m, { sock, config }) {

    const group = await sock.groupMetadata(m.chat)
    const sender = m.sender

    const admins = group.participants
        .filter(v => v.admin)
        .map(v => v.id)

    const ownerNumbers = config.owner?.number || []

    const isAdmin = admins.includes(sender)
    const isCreator = ownerNumbers.some(num => sender.includes(num))

    if (!isAdmin && !isCreator) {
        return m.reply(`👿 *Ara ara~*

Fitur ini hanya untuk *Admin Group* atau *Creator Bot* ya darling 💗`)
    }

    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)

    if (!target) {
        return m.reply(`💗 Darling tag atau reply orang yang mau dijadikan admin ya~`)
    }

    await sock.groupParticipantsUpdate(
        m.chat,
        [target],
        "promote"
    )

    await m.reply(`👑 *ZERO TWO ADMIN SYSTEM*

Ara ara~
Sekarang @${target.split('@')[0]} sudah menjadi *Admin Group* 🎉

Jaga group ini baik-baik ya darling 💗`,
    { mentions: [target] })
}

module.exports = {
    config: pluginConfig,
    handler
}