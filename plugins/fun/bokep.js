const pluginConfig = {
    name: 'bokep',
    alias: ['vidbokep', 'nontonbokep'],
    category: 'fun',
    description: 'Prank bokep 🤣',
    usage: '.bokep',
    example: '.bokep',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function handler(m) {

    // 🔥 PESAN PERTAMA
    let txt1 = `╭──〔 💗 NusaBot 〕──⬣
│
│ Hai darling~ 😘
│ Lagi nyari yang aneh-aneh yaa?
│ Tenang aku bantu cariin dulu ya~
│
│ 🔍 Searching...
│ 🌐 xhamster, dll...
│
╰──⬣`

    await m.reply(txt1)

    await delay(5000)

    // 🔥 ROAST NYINDIR LEVEL TOBAT 😭
    const prankList = [
        'Eaaaaak 😹 ketahuan niatnya, dosa loh 🗿',
        'Ih kamu gitu banget 😭 Zero Two jadi ilfeel 🗿',
        'Waduh ketangkep basah 😭 langsung tobat gih 😹',
        'Bukannya cari pahala malah cari begituan 😭',
        'Astagfirullah… aku liat histori kamu 😭',
        'Mode mesum aktif ya? 🗿 sayang banget 😭',
        'Server nolak kamu 😹 terlalu nakal katanya 🗿',
        'Zero Two kecewa berat 😭 kirain kamu beda 😹',
        'Ini bukan error… ini peringatan hidup 🗿',
        'Udah deh mending tidur 😭 daripada dosa nambah 😹'
    ]

    let txt2 = `╭──〔 💗 NusaBot 〕──⬣
│
│ ${prankList[Math.floor(Math.random() * prankList.length)]}
│
│ ❌ Video tidak ditemukan
│ ⚠️ Status: Kamu perlu tobat 😭
│
╰──⬣`

    await m.reply(txt2)
}

module.exports = {
    config: pluginConfig,
    handler
}