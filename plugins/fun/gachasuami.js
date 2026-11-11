const pluginConfig = {
    name: "gachasuami",
    category: "fun",
    description: "Gacha suami husbando anime random",
    usage: ".gachasuami",
    cooldown: 3,
    isEnabled: true
}

const husbandoList = [

"Gojo Satoru","Sukuna","Megumi Fushiguro","Yuji Itadori","Nanami Kento","Toji Fushiguro",
"Levi Ackerman","Eren Yeager","Armin Arlert","Erwin Smith","Reiner Braun","Jean Kirstein",
"Naruto Uzumaki","Sasuke Uchiha","Kakashi Hatake","Itachi Uchiha","Minato Namikaze",
"Madara Uchiha","Obito Uchiha","Pain (Nagato)","Gaara",
"Luffy","Zoro","Sanji","Trafalgar Law","Portgas D Ace","Shanks","Mihawk",
"Doflamingo","Katakuri","Sabo",
"Goku","Vegeta","Gohan","Future Trunks","Piccolo","Broly",
"Asta","Yuno","Yami Sukehiro","Nozel Silva","Julius Novachrono",
"Tanjiro Kamado","Zenitsu Agatsuma","Inosuke Hashibira","Giyu Tomioka","Kyojuro Rengoku",
"Tengen Uzui","Muzan Kibutsuji","Akaza","Douma",
"Edward Elric","Alphonse Elric","Roy Mustang",
"Light Yagami","L","Near",
"Ichigo Kurosaki","Byakuya Kuchiki","Kenpachi Zaraki","Urahara Kisuke","Aizen Sosuke",
"Saitama","Genos","Garou","Bang",
"Subaru Natsuki","Reinhard van Astrea",
"Kirito","Eugeo",
"Rudeus Greyrat","Paul Greyrat",
"Seiya Ryuuguuin",
"Rimuru Tempest","Benimaru","Diablo",
"Ainz Ooal Gown","Sebas Tian",
"Cid Kagenou","Shadow","Mordred (Eminence)",
"Denji","Aki Hayakawa","Kishibe",
"Loid Forger","Yuri Briar",
"Anos Voldigoad",
"Vash the Stampede",
"Spike Spiegel",
"Shinji Ikari","Kaworu Nagisa",
"Karma Akabane","Nagisa Shiota",
"Okabe Rintarou",
"Accelerator","Touma Kamijou",
"Isagi Yoichi","Bachira Meguru","Rin Itoshi","Sae Itoshi","Barou Shoei",
"Thorfinn","Askeladd",
"Alucard",
"Guts","Griffith",
"Johan Liebert",
"Koro Sensei",
"Tomoya Okazaki",
"Houtarou Oreki",
"Lelouch Lamperouge",
"Kaneki Ken",
"Hideyoshi Nagachika",
"Ayato Kirishima",
"Shoto Todoroki","Bakugo Katsuki","Izuku Midoriya","All Might","Dabi","Shigaraki Tomura",
"Hawks","Endeavor"

]

async function handler(m){

const name = m.pushName || "Darling"
const husbando = husbandoList[Math.floor(Math.random()*husbandoList.length)]
const love = Math.floor(Math.random()*101)

const statusList = [
"💖 Cinta Sejati",
"💘 Pasangan Serasi",
"💕 Husbando Impian",
"💞 Relationship Goals",
"🔥 Bucin Parah",
"💔 Hubungan Toxic 🗿"
]

const status = statusList[Math.floor(Math.random()*statusList.length)]

const responses = [

`╔═══『 🤵 *GACHA SUAMI* 』═══╗
┃
┃ 👤 Istri : *${name}*
┃ 🤵 Suami : *${husbando}*
┃
┃ 💖 Love Meter : *${love}%*
┃ 📊 Status : *${status}*
┃
┃ Selamat kamu dapat
┃ husbando anime 😋
┃
╚════════════════════╝`,

`┏━━━〔 💙 *HUSBANDO FOUND* 〕━━━┓
┃
┃ 🎉 Selamat!!
┃
┃ 👤 *${name}*
┃ ❤️ *${husbando}*
┃
┃ 💘 Kecocokan : *${love}%*
┃ 📊 Status : *${status}*
┃
┃ Jangan diselingkuhin ya 🗿
┃
┗━━━━━━━━━━━━━━━━━━┛`,

`╭────〔 💍 *NIKAH ONLINE* 〕────╮
│
│ 👤 Player : *${name}*
│ 🤵 Husbando : *${husbando}*
│
│ 💓 Love Level : *${love}%*
│ 📊 Status : *${status}*
│
│ Sistem menjodohkan
│ kalian secara random 😏
│
╰────────────────────╯`

]

const reply = responses[Math.floor(Math.random()*responses.length)]

await m.reply(reply)

}

module.exports = { config: pluginConfig, handler }