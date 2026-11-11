const pluginConfig = {
    name: 'cekmmk',
    alias: ['mmkcheck', 'cekmemek', 'cekgoacewk', 'cekhole'],
    category: 'fun',
    description: 'Cek level random (bercanda doang)',
    usage: '.cekmmk <nama>',
    example: '.cekmmk Siti',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const nama = m.text?.trim() || m.pushName || 'Kamu'
    const level = Math.floor(Math.random() * 10) + 1

    const kondisiList = [
        'rapi dan bersih ✨',
        'pink natural 🌸',
        'mulus kayak skincare 😭',
        'hangat dan nyaman 😌',
        'aesthetic banget 🗿',
        'misterius 😏',
        'legendary level 🔥',
        'auto bikin betah 😳',
        'glow up maksimal 💅',
        'vibes mahal 😎'
    ]

    const roastList = [
        'kok kayak goa sepi 🗿',
        'ini mode hemat ya 😭',
        'minimalis banget 🤏',
        'kayak ruang kosong 😅',
        'loading terus kah? 🗿',
        'server kosong 😭'
    ]

    const pujianList = [
        'waduh premium ini 🔥',
        'kelas sultan 😎',
        'auto favorit 💀',
        'gak ada lawan 😭',
        'perfect banget 😳',
        'rare item 💎'
    ]

    const kondisi = kondisiList[Math.floor(Math.random() * kondisiList.length)]

    // 🔥 BAR VISUAL
    const bar = '🌸' + '═'.repeat(level * 2) + '✨'

    let komentar = ''
    if (level <= 3) {
        komentar = roastList[Math.floor(Math.random() * roastList.length)]
    } else if (level >= 8) {
        komentar = pujianList[Math.floor(Math.random() * pujianList.length)]
    } else {
        komentar = 'standar aman 👍'
    }

    let txt = `🌸 *CEK MMK*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Level: *${level}/10*\n`
    txt += `> 💫 Kondisi: *${kondisi}*\n`
    txt += `> ${bar}\n\n`
    txt += `> 💬 ${komentar}`

    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}