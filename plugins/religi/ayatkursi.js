const config = {
    name: 'ayatkursi',
    alias: ['kursi', 'ayatsinggasana'],
    category: 'religi',
    description: 'Bacaan Ayat Kursi (QS. Al-Baqarah: 255)',
    usage: '.ayatkursi',
    example: '.ayatkursi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const caption = `╭───〔 🕋 *ᴀʏᴀᴛ ᴋᴜʀꜱɪ* 🕋 〕───⬣
│
│  *Arab:*
│  اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ
│
│  *Latin:*
│  Alloohu laa ilaaha illaa huwal hayyul qoyyuum, laa ta’khudzuhuu sinatuw walaa naum. Lahuu maa fissamaawaati wa maa fil ardli. Man dzal ladzii yasyfa’u ‘indahuu illaa bi idznih. Ya’lamu maa baina aidiihim wamaa kholfahum. Wa laa yuhiithuuna bisyai’im min ‘ilmihii illaa bimaa syaa-a. Wasi’a kursiyyuhus samaawaati wal ardlo. Wa laa ya-uuduhuu hifdhuhumaa. Wahuwal ‘aliyyul ‘adhiim.
│
│  *Terjemahan:*
│  Allah, tidak ada Tuhan (yang berhak disembah) melainkan Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya); tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafa'at di sisi Allah tanpa izin-Nya. Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.
│
│  *(QS. Al-Baqarah: 255)*
│
╰────────────────⬣

✨ *Keutamaan membaca Ayat Kursi:*
> Barang siapa membacanya setelah shalat fardhu, ia akan berada dalam lindungan Allah hingga shalat berikutnya.
> Barang siapa membacanya sebelum tidur, ia akan dijaga oleh Allah sepanjang malam.`

    await m.reply(caption)
}

module.exports = { config, handler }