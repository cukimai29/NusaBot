// plugins/taubat.js

const pluginConfig = {
  name: 'taubatnasuha',
  alias: ['taubatnasuha', 'doataubat'],
  description: 'Panduan taubat nasuha dan doa taubat',
  usage: '.taubatnasuha'
}

async function handler(m, { conn }) {
  const text = `
╭━━━〔 🕌 TAUBAT NASUHA 〕━━━╮

🌙 *Apa itu Taubat Nasuha?*

Taubat nasuha adalah taubat yang dilakukan dengan sungguh-sungguh kepada Allah SWT, menyesali dosa yang telah dilakukan, meninggalkannya, dan bertekad untuk tidak mengulanginya lagi.

╰━━━━━━━━━━━━━━━━━━━━╯

📖 *CARA TAUBAT NASUHA*

1️⃣ *Meninggalkan dosa*
Segera berhenti dari perbuatan dosa yang dilakukan.

2️⃣ *Menyesali dosa*
Menyadari bahwa perbuatan tersebut salah dan benar-benar menyesalinya.

3️⃣ *Memohon ampun kepada Allah*
Perbanyak membaca istighfar dan berdoa kepada Allah SWT.

4️⃣ *Berjanji tidak mengulangi*
Bertekad dengan sungguh-sungguh untuk tidak kembali melakukan dosa tersebut.

5️⃣ *Mengembalikan hak orang lain*
Jika dosa berkaitan dengan hak orang lain, maka hak tersebut harus dikembalikan atau diselesaikan dengan cara yang benar.

━━━━━━━━━━━━━━━━━━━━

🤲 *DOA TAUBAT*

اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ

📜 *Latin:*

Allahumma inni zhalamtu nafsi zhulman katsiran, wa laa yaghfirudz-dzunuuba illaa anta, faghfir lii maghfiratan min 'indika, warhamnii, innaka antal-ghafuurur-rahiim.

💬 *Artinya:*

"Ya Allah, sesungguhnya aku telah menzalimi diriku dengan kezaliman yang banyak. Tidak ada yang dapat mengampuni dosa kecuali Engkau. Maka ampunilah aku dengan ampunan dari sisi-Mu dan rahmatilah aku. Sesungguhnya Engkau Maha Pengampun lagi Maha Penyayang."

━━━━━━━━━━━━━━━━━━━━

🤲 *ISTIGHFAR*

أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ

📜 *Latin:*

Astaghfirullaaha wa atuubu ilaih.

💬 *Artinya:*

"Aku memohon ampun kepada Allah dan aku bertaubat kepada-Nya."

━━━━━━━━━━━━━━━━━━━━

🕊️ *SETELAH BERBUAT DOSA*

Jangan merasa bahwa dosa membuatmu tidak pantas kembali kepada Allah.

Segeralah bertaubat, perbanyak istighfar, tinggalkan dosa tersebut, dan berusaha memperbaiki diri.

Allah SWT berfirman:

وَلَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ

"Janganlah kamu berputus asa dari rahmat Allah."

(QS. Az-Zumar: 53)

━━━━━━━━━━━━━━━━━━━━

🌿 *LANGKAH SEDERHANA*

🤍 Berhenti dari dosa
🤍 Menyesalinya
🤍 Istighfar
🤍 Bertekad tidak mengulanginya
🤍 Perbanyak amal baik
🤍 Perbaiki kesalahan kepada orang lain

╰━━━〔 🕌 SEMOGA BERMANFAAT 〕━━━╯
`

  await conn.sendMessage(
    m.chat,
    {
      text: text,
      contextInfo: {
        externalAdReply: {
          title: '🕌 Panduan Taubat Nasuha',
          body: 'Doa • Latin • Arti • Cara Taubat',
          thumbnailUrl: 'https://files.catbox.moe/placeholder.jpg',
          sourceUrl: 'https://quran.com/',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    },
    { quoted: m }
  )
}

handler.help = ['taubat']
handler.tags = ['islam']
handler.command = /^(taubat|taubatnasuha|doataubat)$/i

module.exports = handler