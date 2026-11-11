const { startJadibot, isJadibotActive } = require('../../src/lib/jadibotManager')
const config = require('../../config')

const pluginConfig = {
    name: 'jadibot',
    alias: ['jbot', 'rentbot'],
    category: 'premium',
    description: 'Jadikan nomor kamu sebagai bot sementara',
    usage: '.jadibot',
    example: '.jadibot',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const userJid = m.sender
    
    if (isJadibotActive(userJid)) {
        return m.reply(
`╭━━━〔 ❌ JADIBOT AKTIF 〕━━━⬣
┃ Hei... kamu udah jadi bot 😏
┃
┃ Jangan rakus dong 😤
┃ Satu dulu aja dipake
┃
┃ 🔁 Stop dulu:
┃ ${m.prefix}stopjadibot
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || '𝙕𝙀𝙍𝙊 𝙏𝙒𝙊 𝘼𝙄'
    
    await sock.sendMessage(m.chat, {
        text:
`╭━━━〔 😈 ZERO TWO JADIBOT 〕━━━⬣
┃ Hai kamu... mau jadi bot ya? 😏
┃
┃ Tenang aja 💗
┃ Aku bakal bantu kamu
┃
┣━━━〔 ⚙️ PROSES 〕━━━⬣
┃ ⏳ Sedang menyiapkan sistem...
┃ 🔐 Mengambil pairing code...
┃
┣━━━〔 ⚠️ PERINGATAN 〕━━━⬣
┃ • Bot ini sementara
┃ • Akan mati saat restart
┃ • Jangan disalahgunakan 😤
┃
┃ Sabar ya darling... 😈
╰━━━━━━━━━━━━━━━━⬣`,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('⏳')
    
    try {
        const result = await startJadibot(sock, m, userJid, true)
        
        if (result.pairingCode) {
            m.react('✅')

            await sock.sendMessage(m.chat, {
                text:
`╭━━━〔 ✅ JADIBOT BERHASIL 〕━━━⬣
┃ Nah... udah jadi bot 😈
┃
┃ Gunakan dengan baik ya
┃ jangan bikin aku kecewa 😤
┃
┃ 🔐 Pairing berhasil
┃ 📡 Status: Online
┃
┃ Selamat bermain darling 💗
╰━━━━━━━━━━━━━━━━⬣`
            }, { quoted: m })
        }

    } catch (error) {
        m.react('❌')

        await m.reply(
`╭━━━〔 ❌ JADIBOT GAGAL 〕━━━⬣
┃ Yah... gagal 😔
┃
┃ ⚠️ Error:
┃ ${error.message}
┃
┃ Coba lagi nanti ya 😤
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}