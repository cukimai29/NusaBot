const config = require('../../config')

const pluginConfig = {
    name: 'tqto',
    alias: ['thanksto', 'credits', 'kredit'],
    category: 'main',
    description: 'NusaBot Thanks To',
    usage: '.tqto',
    example: '.tqto',
    cooldown: 5,
    isEnabled: true
}

async function handler(m) {
    const botName = config.bot?.name || 'NusaBot'
    const version = config.bot?.version || '1.0.0'
    const developer = config.bot?.developer || 'RzkyADS'

    const credits = [
        { name: 'RzkyADS', role: 'Developer & Owner', icon: '💗' }
    ]

    let txt = `💗 *${botName} - THANKS TO* 💗\n\n`
    txt += `> "Darling... makasih ya udah nemenin aku sampai sejauh ini 💞"\n\n`

    txt += `╭─「 👥 *ᴄᴏɴᴛʀɪʙᴜᴛᴏʀ* 」\n`
    credits.forEach((c, i) => {
        txt += `┃ ${c.icon} \`${c.name}\`\n`
        txt += `┃    └ *${c.role}*\n`
        if (i < credits.length - 1) txt += `┃\n`
    })
    txt += `╰───────────────\n\n`

    txt += `╭─「 📋 *ɪɴꜰᴏ ʙᴏᴛ* 」\n`
    txt += `┃ 🤖 Nama: *${botName}*\n`
    txt += `┃ 📦 Versi: *${version}*\n`
    txt += `┃ 💗 Dev: *${developer}*\n`
    txt += `╰───────────────\n\n`

    txt += `> Dikembangkan oleh ${developer}`

    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
