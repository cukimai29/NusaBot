const { stopJadibot, isJadibotActive, jadibotSessions } = require('../../src/lib/jadibotManager')
const config = require('../../config')

const pluginConfig = {
    name: 'stopjadibot',
    alias: ['stopjbot', 'endjadibot'],
    category: 'premium',
    description: 'Hentikan jadibot kamu',
    usage: '.stopjadibot',
    example: '.stopjadibot',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const userJid = m.sender
    const id = userJid.replace(/@.+/g, '')
    
    if (!isJadibotActive(userJid)) {
        return m.reply(
`╭━━━〔 ❌ TIDAK AKTIF 〕━━━⬣
┃ Kamu belum jadi bot 😏
┃
┃ Mau coba?
┃ tinggal ketik:
┃ ${m.prefix}jadibot
┃
┃ Jangan cuma liat doang 😤
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    const session = jadibotSessions.get(id)
    if (session && session.ownerJid !== m.sender && !m.isOwner) {
        return m.reply(
`╭━━━〔 🚫 AKSES DITOLAK 〕━━━⬣
┃ Eh... itu bukan punya kamu 😤
┃
┃ Jangan iseng ya
┃ nanti aku marah 😈
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    m.react('⏳')
    
    try {
        await stopJadibot(userJid, false)
        
        m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
`╭━━━〔 💔 JADIBOT BERHENTI 〕━━━⬣
┃ Yah... kamu berhenti 😔
┃
┣━━━〔 📊 STATUS 〕━━━⬣
┃ 👤 Nomor : @${id}
┃ 🔌 Status: OFFLINE
┃ 💾 Session: Tersimpan
┃
┣━━━〔 💬 NOTE 〕━━━⬣
┃ Kamu bisa balik lagi kapan aja 😏
┃ aku bakal nunggu 💗
┃
┃ Ketik:
┃ ${m.prefix}jadibot
╰━━━━━━━━━━━━━━━━⬣`,
            mentions: [userJid]
        }, { quoted: m })

    } catch (error) {
        m.react('❌')

        await m.reply(
`╭━━━〔 ❌ GAGAL STOP 〕━━━⬣
┃ Hmm... gagal nih 😤
┃
┃ ⚠️ Error:
┃ ${error.message}
┃
┃ Coba lagi nanti ya 😈
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}