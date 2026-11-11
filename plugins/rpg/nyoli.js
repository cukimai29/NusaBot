const pluginConfig = {
    name: 'nyoli',
    alias: ['coli', 'nnbokep'],
    category: 'rpg',
    description: 'Bekerja nyoli untuk mendapatkan mani',
    usage: '.nyoli',
    example: '.coli/nyoli',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

// Penyimpanan sementara
const users = new Map()

function getUser(m) {
    const id = m.sender || m.participant || m.chat

    if (!users.has(id)) {
        users.set(id, {
            energi: 100,
            uang: 0
        })
    }

    return users.get(id)
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function handler(m) {
    const user = getUser(m)

    // Cek energi
    if (user.energi < 5) {
        return m.reply(
`💦 *mani TIDAK CUKUP!*

Mani kamu: *${user.energi}/100*

Kamu membutuhkan minimal *5 mani*
untuk bekerja nyoli.

💡 Istirahat dulu sebelum bekerja lagi.`
        )
    }

    await m.react('💦')

    // Energi utama
    const energiAwal = user.energi
    const energiPakai = random(5, 15)

    user.energi = Math.max(0, user.energi - energiPakai)

    // Reward
    const reward = random(500, 2500)

    // Peluang terkena cairan
    const kenaCairan = Math.random() < 0.20

    let bonus = 0
    let efek = ''

    if (kenaCairan) {
        bonus = random(3, 8)
        user.energi = Math.max(0, user.energi - bonus)

        efek =
`💦 *KENA CAIRAN!*
Energi tambahan berkurang: *-${bonus}*`
    } else {
        efek = '✨ *Kamu berhasil NYOLI dengan aman!*'
    }

    user.uang += reward

    const totalEnergi = energiAwal - user.energi

    await m.react('✅')

    return m.reply(
` *KERJA NYOLI*

Kamu pergi bekerja nyoli hari ini...

━━━━━━━━━━━━━━━━━━

💦 Mani:
> *-${totalEnergi}* Mani

💦 Rewards:
> *+DOPAMIN${reward.toLocaleString('id-ID')}*

${efek}

━━━━━━━━━━━━━━━━━━

💦  mani sekarang:
> *${user.energi}/100*

♈ dopamin:
> *DOPAMIN${user.uang.toLocaleString('id-ID')}*

🌊 Kerja keras hari ini,
hasilnya bisa kamu nikmati nanti!`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}