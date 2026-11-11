const config = {
    name: 'doaharian',
    alias: ['doa', 'doaseharihari', 'amalan'],
    category: 'religi',
    description: 'Kumpulan doa sehari-hari lengkap dengan latin dan artinya',
    usage: '.doaharian',
    example: '.doaharian',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const doaList = [
    {
        title: "Doa Sebelum Makan",
        arabic: "اَللّٰهُمَّ بَارِكْ لَنَا فِيْمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
        latin: "Allahumma barik lana fima razaqtana waqina 'adzaban naar",
        translation: "Ya Allah, berkahilah rezeki yang Engkau berikan kepada kami dan lindungilah kami dari siksa neraka"
    },
    {
        title: "Doa Sesudah Makan",
        arabic: "اَلْحَمْدُ لِلَّهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِيْنَ",
        latin: "Alhamdulillahilladzi ath'amana wa saqana wa ja'alana minal muslimin",
        translation: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami termasuk orang-orang muslim"
    },
    {
        title: "Doa Sebelum Tidur",
        arabic: "بِسْمِكَ اللّٰهُمَّ أَحْيَا وَأَمُوْتُ",
        latin: "Bismikallahumma ahya wa amut",
        translation: "Dengan nama-Mu ya Allah, aku hidup dan aku mati"
    },
    {
        title: "Doa Bangun Tidur",
        arabic: "اَلْحَمْدُ لِلَّهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ",
        latin: "Alhamdulillahilladzi ahyana ba'da ma amatana wa ilaihin nusyur",
        translation: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya lah kami kembali"
    },
    {
        title: "Doa Masuk Masjid",
        arabic: "اَللّٰهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ",
        latin: "Allahummaftah li abwaba rahmatik",
        translation: "Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu"
    },
    {
        title: "Doa Keluar Masjid",
        arabic: "اَللّٰهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ",
        latin: "Allahumma inni as-aluka min fadlik",
        translation: "Ya Allah, sesungguhnya aku memohon kepada-Mu karunia-Mu"
    },
    {
        title: "Doa Masuk Kamar Mandi",
        arabic: "اَللّٰهُمَّ إِنِّيْ أَعُوْذُبِكَ مِنَ الْخُبْثِ وَالْخَبَائِثِ",
        latin: "Allahumma inni a'udzubika minal khubutsi wal khabaitsi",
        translation: "Ya Allah, aku berlindung kepada-Mu dari godaan setan laki-laki dan perempuan"
    },
    {
        title: "Doa Keluar Kamar Mandi",
        arabic: "غُفْرَانَكَ الْحَمْدُ لِلَّهِ الَّذِيْ أَذْهَبَ عَنِّي الْأَذَى وَعَافَانِيْ",
        latin: "Ghufranaka alhamdulillahilladzi adzhaba 'annil adza wa 'afani",
        translation: "Aku memohon ampunan-Mu, segala puji bagi Allah yang telah menghilangkan kotoran dariku dan menyehatkanku"
    },
    {
        title: "Doa Menaiki Kendaraan",
        arabic: "سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ",
        latin: "Subhanalladzi sakh-khara lana hadza wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun",
        translation: "Maha Suci Allah yang telah menundukkan kendaraan ini untuk kami, padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Tuhan kami"
    },
    {
        title: "Doa Keluar Rumah",
        arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ",
        latin: "Bismillahi tawakkaltu 'alallah, la haula wa la quwwata illa billah",
        translation: "Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah"
    },
    {
        title: "Doa Masuk Rumah",
        arabic: "اَللّٰهُمَّ إِنِّيْ أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
        latin: "Allahumma inni as-aluka khairal mauliji wa khairal makhraji, bismillahi walajna, wa bismillahi kharajna, wa 'alallahi rabbina tawakkalna",
        translation: "Ya Allah, aku memohon kepada-Mu sebaik-baik tempat masuk dan sebaik-baik tempat keluar. Dengan nama Allah kami masuk, dan dengan nama Allah kami keluar, dan kepada Allah Tuhan kami, kami bertawakal"
    },
    {
        title: "Doa Sebelum Belajar",
        arabic: "رَبِّ زِدْنِيْ عِلْمًا وَارْزُقْنِيْ فَهْمًا",
        latin: "Robbii zidnii 'ilman warzuqnii fahman",
        translation: "Ya Tuhanku, tambahkanlah ilmu kepadaku, dan karuniakanlah aku kefahaman"
    },
    {
        title: "Doa Sesudah Belajar",
        arabic: "اَللّٰهُمَّ إِنِّيْ أَسْتَوْدِعُكَ مَا عَلَّمْتَنِيْهِ فَارْدُدْهُ إِلَيَّ عِنْدَ حَاجَتِيْ إِلَيْهِ",
        latin: "Allahumma inni astaudi'uka ma 'allamtaniihi fardud-hu ilayya 'inda hajati ilaihi",
        translation: "Ya Allah, sesungguhnya aku menitipkan kepada-Mu ilmu yang telah Engkau ajarkan kepadaku, maka kembalikanlah ilmu itu kepadaku ketika aku membutuhkannya"
    },
    {
        title: "Doa Kedua Orang Tua",
        arabic: "رَبِّ اغْفِرْ لِيْ وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِيْ صَغِيْرًا",
        latin: "Rabbighfir li wa liwalidayya warhamhuma kama rabbayani shaghira",
        translation: "Ya Tuhanku, ampunilah aku dan kedua orang tuaku, sayangilah mereka sebagaimana mereka menyayangiku di waktu kecil"
    }
]

async function handler(m) {
    const args = m.text?.trim().split(/\s+/)
    const nomor = parseInt(args[0])
    
    if (!nomor || isNaN(nomor) || nomor < 1 || nomor > doaList.length) {
        let txt = `🤲 *ᴅᴏᴀ ꜱᴇʜᴀʀɪ-ʜᴀʀɪ*\n\n`
        txt += `Kumpulan doa dalam kehidupan sehari-hari\n\n`
        txt += `╭──〔 📋 *ʟɪꜱᴛ ᴅᴏᴀ* 〕───⬣\n`
        for (let i = 0; i < doaList.length; i++) {
            txt += `│  ${i+1}. ${doaList[i].title}\n`
        }
        txt += `╰────────────────⬣\n\n`
        txt += `💡 *Cara pakai:*\n> Ketik .doaharian <nomor>\n> Contoh: .doaharian 1\n\n✨ *“Berdoalah kepada-Ku, niscaya akan Kukabulkan bagimu.”* (QS. Al-Mu’min: 60)`
        
        return m.reply(txt)
    }
    
    const doa = doaList[nomor - 1]
    
    let txt = `🤲 *${doa.title}*\n\n`
    txt += `╭──〔 🕋 *ᴀʀᴀʙ* 〕───⬣\n`
    txt += `│  ${doa.arabic}\n`
    txt += `╰────────────────⬣\n\n`
    txt += `╭──〔 📖 *ʟᴀᴛɪɴ* 〕───⬣\n`
    txt += `│  ${doa.latin}\n`
    txt += `╰────────────────⬣\n\n`
    txt += `╭──〔 🌸 *ᴀʀᴛɪ* 〕───⬣\n`
    txt += `│  ${doa.translation}\n`
    txt += `╰────────────────⬣\n\n`
    txt += `✨ *Rasulullah SAW bersabda:* “Doa adalah ibadah.” (HR. Tirmidzi)`
    
    await m.reply(txt)
}

module.exports = { config, handler }