const pluginConfig = {
    name: "autozerotwo",
    alias: [],
    category: "fun",
    description: "Auto respon jika ada yang menyebut Zero Two",
    usage: ".autozerotwo on/off",
    example: ".autozerotwo on",
    cooldown: 3
}

// global agar tidak reset saat hot reload
if (!global.autoZeroTwo) global.autoZeroTwo = false

async function handler(m) {

    const text = (m.text || "").toLowerCase()
    const args = text.split(" ")[1]

    if (!args) {
        return m.reply(
`╭─〔 ❤️ ZERO TWO AUTO RESPON 〕
│
│ 📌 Perintah:
│ • .autozerotwo on
│ • .autozerotwo off
│
│ Zero Two akan otomatis
│ merespon jika namanya disebut.
│
╰────────────`
        )
    }

    if (args === "on") {
        global.autoZeroTwo = true

        return m.reply(
`╭─〔 ❤️ ZERO TWO 〕
│
│ Ara ara~
│ Auto respon sekarang *AKTIF*
│
│ Panggil aku kapan saja
│ Darling~
│
╰────────────`
        )
    }

    if (args === "off") {
        global.autoZeroTwo = false

        return m.reply(
`╭─〔 ZERO TWO 〕
│
│ Hmph!
│ Auto respon dimatikan.
│
│ Sampai jumpa Darling~
│
╰────────────`
        )
    }

}

async function before(m, { sock }) {

    if (!global.autoZeroTwo) return

    const text = (m.text || "").toLowerCase()

    const trigger = [

        "zero two",
        "zerotwo",
        "02",
        "zero-two",
        "zero2",
        "zero two ai",
        "zerotwo ai",
        "bot zero two",
        "zero two bot",
        "02 ai",
        "darling zero two",
        "zerotwooo",
        "zero twooo",
        "02 darling",
        "zerotwo chan",
        "zerotwo-chan"

    ]

    if (!trigger.some(v => text.includes(v))) return

    const name = m.pushName || "Darling"

    const respon = [

`╭─〔 ❤️ ZERO TWO 〕
│
│ Ara ara~
│ ${name} memanggilku?
│
│ Ada yang bisa
│ Zero Two bantu?
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Fufu~
│ Aku mendengar
│ namaku disebut.
│
│ Halo ${name}.
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Eh?
│ ${name} kangen aku ya?
│
│ Darling lucu~
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Ara ara~
│ Jangan panggil aku
│ sembarangan.
│
│ ...tapi kalau kamu
│ boleh ${name}.
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Hmph!
│ Siapa yang memanggil
│ Zero Two?
│
│ Oh ternyata kamu~
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Darling ${name}~
│ Kamu memanggilku?
│
│ Aku datang ❤️
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Fufu~
│ Aku merasa
│ seseorang menyebutku.
│
│ Hai ${name}.
│
╰────────────`,

`╭─〔 ZERO TWO 〕
│
│ Eh ${name}!
│ Kamu memanggil
│ Zero Two?
│
│ Aku disini~
│
╰────────────`

]

    const random = respon[Math.floor(Math.random() * respon.length)]

    await sock.sendMessage(m.chat, { text: random }, { quoted: m })

}

module.exports = {
    config: pluginConfig,
    handler,
    before
}