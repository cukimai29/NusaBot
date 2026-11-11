const afkStorage = global.afkStorage || (global.afkStorage = new Map())

const pluginConfig = {
    name: 'afk',
    alias: ['away', 'brb'],
    category: 'group',
    description: 'Set status AFK dengan alasan',
    usage: '.afk <alasan>',
    example: '.afk lagi makan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function getAfkUser(jid) {
    return afkStorage.get(jid) || null
}

function setAfkUser(jid, reason) {
    afkStorage.set(jid, {
        reason: reason || 'Tidak ada alasan',
        time: Date.now()
    })
}

function removeAfkUser(jid) {
    afkStorage.delete(jid)
}

function isUserAfk(jid) {
    return afkStorage.has(jid)
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
        return `${hours} jam ${minutes % 60} menit`
    } else if (minutes > 0) {
        return `${minutes} menit ${seconds % 60} detik`
    } else {
        return `${seconds} detik`
    }
}

async function handler(m, { sock }) {
    const reason = m.text || 'Tidak ada alasan'
    setAfkUser(m.sender, reason)

    await m.reply(
`╭━━━〔 💗 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 𝐀𝐅𝐊 𝐌𝐎𝐃𝐄 💗 〕━━⬣
┃
┃ 💤 *AFK DIAKTIFKAN*
┃
┃ 👤 User :
┃ @${m.sender.split('@')[0]}
┃
┃ 🍀 Alasan :
┃ *${reason}*
┃
┃ Zero Two akan menjaga pesan
┃ sampai kamu kembali darling~
┃
┃ _Ketik pesan apa saja_
┃ _untuk menonaktifkan AFK._
┃
╰━━━━━━━━━━━━━━━━⬣`,
{ mentions: [m.sender] }
    )
}

async function checkAfk(m, sock) {

    const afkData = getAfkUser(m.sender)

    if (afkData) {

        if (m.isCommand && m.command?.toLowerCase() === 'afk') return

        removeAfkUser(m.sender)

        const duration = formatDuration(Date.now() - afkData.time)

        await m.reply(
`╭━━━〔 💖 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐁𝐀𝐂𝐊 𝐃𝐀𝐑𝐋𝐈𝐍𝐆 💖 〕━━⬣
┃
┃ 👋 *AFK BERAKHIR*
┃
┃ 👤 User :
┃ @${m.sender.split('@')[0]}
┃
┃ ⏳ Durasi AFK :
┃ *${duration}*
┃
┃ Zero Two kangen loh~
┃ jangan lama-lama pergi 😳
┃
╰━━━━━━━━━━━━━━━━⬣`,
{ mentions: [m.sender] }
        )
    }

    if (m.isGroup && m.mentionedJid && m.mentionedJid.length > 0) {

        for (const mentioned of m.mentionedJid) {

            const mentionedAfk = getAfkUser(mentioned)

            if (mentionedAfk) {

                const duration = formatDuration(Date.now() - mentionedAfk.time)

                await m.reply(
`╭━━━〔 💤 𝐔𝐒𝐄𝐑 𝐀𝐅𝐊 💬 〕━━⬣
┃
┃ Husttt... jangan diganggu dulu!
┃
┃ 👤 User :
┃ @${mentioned.split('@')[0]}
┃
┃ 🍀 Alasan :
┃ *${mentionedAfk.reason}*
┃
┃ ⏳ Sejak :
┃ *${duration} yang lalu*
┃
┃ Zero Two bilang
┃ biarin dia istirahat dulu ya~
┃
╰━━━━━━━━━━━━━━━━⬣`,
{ mentions: [mentioned] }
                )
            }

        }

    }

}

module.exports = {
    config: pluginConfig,
    handler,
    checkAfk,
    getAfkUser,
    setAfkUser,
    removeAfkUser,
    isUserAfk
}