const axios = require('axios');
const fs = require('fs');
const path = require('path');

const pluginConfig = {
  name: 'asmaulhusna',
  alias: ['asma', '99nama', 'namasuci', 'allah'],
  category: 'islamic',
  description: '99 Asmaul Husna (Nama-nama Indah Allah) lengkap dengan Arab, Latin, dan Arti',
  usage: '.asmaulhusna [nomor atau nama]',
  example: '.asmaulhusna 1 | .asmaulhusna ar-rahman',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true,
};

// Database 99 Asmaul Husna
const ASMAUL_HUSNA = [
  { nomor: 1, arab: 'الرَّحْمَنُ', latin: 'Ar-Rahman', arti: 'Yang Maha Pengasih' },
  { nomor: 2, arab: 'الرَّحِيمُ', latin: 'Ar-Rahim', arti: 'Yang Maha Penyayang' },
  { nomor: 3, arab: 'الْمَلِكُ', latin: 'Al-Malik', arti: 'Yang Maha Merajai' },
  { nomor: 4, arab: 'الْقُدُّوسُ', latin: 'Al-Quddus', arti: 'Yang Maha Suci' },
  { nomor: 5, arab: 'السَّلاَمُ', latin: 'As-Salam', arti: 'Yang Maha Memberi Kesejahteraan' },
  { nomor: 6, arab: 'الْمُؤْمِنُ', latin: 'Al-Mu\'min', arti: 'Yang Maha Memberi Keamanan' },
  { nomor: 7, arab: 'الْمُهَيْمِنُ', latin: 'Al-Muhaymin', arti: 'Yang Maha Memelihara' },
  { nomor: 8, arab: 'الْعَزِيزُ', latin: 'Al-Aziz', arti: 'Yang Maha Perkasa' },
  { nomor: 9, arab: 'الْجَبَّارُ', latin: 'Al-Jabbar', arti: 'Yang Maha Perkasa (Memaksa)' },
  { nomor: 10, arab: 'الْمُتَكَبِّرُ', latin: 'Al-Mutakabbir', arti: 'Yang Maha Megah' },
  { nomor: 11, arab: 'الْخَالِقُ', latin: 'Al-Khaliq', arti: 'Yang Maha Pencipta' },
  { nomor: 12, arab: 'الْبَارِئُ', latin: 'Al-Bari\'', arti: 'Yang Maha Mengadakan' },
  { nomor: 13, arab: 'الْمُصَوِّرُ', latin: 'Al-Musawwir', arti: 'Yang Maha Membentuk Rupa' },
  { nomor: 14, arab: 'الْغَفَّارُ', latin: 'Al-Ghaffar', arti: 'Yang Maha Pengampun' },
  { nomor: 15, arab: 'الْقَهَّارُ', latin: 'Al-Qahhar', arti: 'Yang Maha Menundukkan' },
  { nomor: 16, arab: 'الْوَهَّابُ', latin: 'Al-Wahhab', arti: 'Yang Maha Pemberi' },
  { nomor: 17, arab: 'الرَّزَّاقُ', latin: 'Ar-Razzaq', arti: 'Yang Maha Pemberi Rezeki' },
  { nomor: 18, arab: 'الْفَتَّاحُ', latin: 'Al-Fattah', arti: 'Yang Maha Pembuka' },
  { nomor: 19, arab: 'الْعَلِيمُ', latin: 'Al-Alim', arti: 'Yang Maha Mengetahui' },
  { nomor: 20, arab: 'الْقَابِضُ', latin: 'Al-Qabid', arti: 'Yang Maha Menyempitkan' },
  { nomor: 21, arab: 'الْبَاسِطُ', latin: 'Al-Basit', arti: 'Yang Maha Melapangkan' },
  { nomor: 22, arab: 'الْخَافِضُ', latin: 'Al-Khafid', arti: 'Yang Maha Merendahkan' },
  { nomor: 23, arab: 'الرَّافِعُ', latin: 'Ar-Rafi\'', arti: 'Yang Maha Meninggikan' },
  { nomor: 24, arab: 'الْمُعِزُّ', latin: 'Al-Mu\'izz', arti: 'Yang Maha Memuliakan' },
  { nomor: 25, arab: 'الْمُذِلُّ', latin: 'Al-Mudhill', arti: 'Yang Maha Menghinakan' },
  { nomor: 26, arab: 'السَّمِيعُ', latin: 'As-Sami\'', arti: 'Yang Maha Mendengar' },
  { nomor: 27, arab: 'الْبَصِيرُ', latin: 'Al-Basir', arti: 'Yang Maha Melihat' },
  { nomor: 28, arab: 'الْحَكَمُ', latin: 'Al-Hakam', arti: 'Yang Maha Menetapkan' },
  { nomor: 29, arab: 'الْعَدْلُ', latin: 'Al-Adl', arti: 'Yang Maha Adil' },
  { nomor: 30, arab: 'اللَّطِيفُ', latin: 'Al-Latif', arti: 'Yang Maha Lembut' },
  { nomor: 31, arab: 'الْخَبِيرُ', latin: 'Al-Khabir', arti: 'Yang Maha Mengetahui' },
  { nomor: 32, arab: 'الْحَلِيمُ', latin: 'Al-Halim', arti: 'Yang Maha Penyantun' },
  { nomor: 33, arab: 'الْعَظِيمُ', latin: 'Al-Azim', arti: 'Yang Maha Agung' },
  { nomor: 34, arab: 'الْغَفُورُ', latin: 'Al-Ghafur', arti: 'Yang Maha Pengampun' },
  { nomor: 35, arab: 'الشَّكُورُ', latin: 'Asy-Syakur', arti: 'Yang Maha Mensyukuri' },
  { nomor: 36, arab: 'الْعَلِيُّ', latin: 'Al-Aliy', arti: 'Yang Maha Tinggi' },
  { nomor: 37, arab: 'الْكَبِيرُ', latin: 'Al-Kabir', arti: 'Yang Maha Besar' },
  { nomor: 38, arab: 'الْحَفِيظُ', latin: 'Al-Hafiz', arti: 'Yang Maha Memelihara' },
  { nomor: 39, arab: 'الْمُقِيتُ', latin: 'Al-Muqit', arti: 'Yang Maha Pemelihara' },
  { nomor: 40, arab: 'الْحَسِيبُ', latin: 'Al-Hasib', arti: 'Yang Maha Membuat Perhitungan' },
  { nomor: 41, arab: 'الْجَلِيلُ', latin: 'Al-Jalil', arti: 'Yang Maha Mulia' },
  { nomor: 42, arab: 'الْكَرِيمُ', latin: 'Al-Karim', arti: 'Yang Maha Pemurah' },
  { nomor: 43, arab: 'الرَّقِيبُ', latin: 'Ar-Raqib', arti: 'Yang Maha Mengawasi' },
  { nomor: 44, arab: 'الْمُجِيبُ', latin: 'Al-Mujib', arti: 'Yang Maha Mengabulkan' },
  { nomor: 45, arab: 'الْوَاسِعُ', latin: 'Al-Wasi\'', arti: 'Yang Maha Luas' },
  { nomor: 46, arab: 'الْحَكِيمُ', latin: 'Al-Hakim', arti: 'Yang Maha Bijaksana' },
  { nomor: 47, arab: 'الْوَدُودُ', latin: 'Al-Wadud', arti: 'Yang Maha Mengasihi' },
  { nomor: 48, arab: 'الْمَجِيدُ', latin: 'Al-Majid', arti: 'Yang Maha Mulia' },
  { nomor: 49, arab: 'الْبَاعِثُ', latin: 'Al-Ba\'its', arti: 'Yang Maha Membangkitkan' },
  { nomor: 50, arab: 'الشَّهِيدُ', latin: 'Asy-Syahid', arti: 'Yang Maha Menyaksikan' },
  { nomor: 51, arab: 'الْحَقُّ', latin: 'Al-Haqq', arti: 'Yang Maha Benar' },
  { nomor: 52, arab: 'الْوَكِيلُ', latin: 'Al-Wakil', arti: 'Yang Maha Memelihara' },
  { nomor: 53, arab: 'الْقَوِيُّ', latin: 'Al-Qawiyy', arti: 'Yang Maha Kuat' },
  { nomor: 54, arab: 'الْمَتِينُ', latin: 'Al-Matin', arti: 'Yang Maha Kokoh' },
  { nomor: 55, arab: 'الْوَلِيُّ', latin: 'Al-Waliyy', arti: 'Yang Maha Melindungi' },
  { nomor: 56, arab: 'الْحَمِيدُ', latin: 'Al-Hamid', arti: 'Yang Maha Terpuji' },
  { nomor: 57, arab: 'الْمُحْصِي', latin: 'Al-Muhsi', arti: 'Yang Maha Menghitung' },
  { nomor: 58, arab: 'الْمُبْدِئُ', latin: 'Al-Mubdi\'', arti: 'Yang Maha Memulai' },
  { nomor: 59, arab: 'الْمُعِيدُ', latin: 'Al-Mu\'id', arti: 'Yang Maha Mengembalikan' },
  { nomor: 60, arab: 'الْمُحْيِي', latin: 'Al-Muhyi', arti: 'Yang Maha Menghidupkan' },
  { nomor: 61, arab: 'الْمُمِيتُ', latin: 'Al-Mumit', arti: 'Yang Maha Mematikan' },
  { nomor: 62, arab: 'الْحَيُّ', latin: 'Al-Hayy', arti: 'Yang Maha Hidup' },
  { nomor: 63, arab: 'الْقَيُّومُ', latin: 'Al-Qayyum', arti: 'Yang Maha Berdiri Sendiri' },
  { nomor: 64, arab: 'الْوَاجِدُ', latin: 'Al-Wajid', arti: 'Yang Maha Penemu' },
  { nomor: 65, arab: 'الْمَاجِدُ', latin: 'Al-Majid', arti: 'Yang Maha Mulia' },
  { nomor: 66, arab: 'الْوَاحِدُ', latin: 'Al-Wahid', arti: 'Yang Maha Tunggal' },
  { nomor: 67, arab: 'الْأَحَدُ', latin: 'Al-Ahad', arti: 'Yang Maha Esa' },
  { nomor: 68, arab: 'الصَّمَدُ', latin: 'As-Samad', arti: 'Yang Maha Dibutuhkan' },
  { nomor: 69, arab: 'الْقَادِرُ', latin: 'Al-Qadir', arti: 'Yang Maha Kuasa' },
  { nomor: 70, arab: 'الْمُقْتَدِرُ', latin: 'Al-Muqtadir', arti: 'Yang Maha Berkuasa' },
  { nomor: 71, arab: 'الْمُقَدِّمُ', latin: 'Al-Muqaddim', arti: 'Yang Maha Mendahulukan' },
  { nomor: 72, arab: 'الْمُؤَخِّرُ', latin: 'Al-Mu\'akhkhir', arti: 'Yang Maha Mengakhirkan' },
  { nomor: 73, arab: 'الْأَوَّلُ', latin: 'Al-Awwal', arti: 'Yang Maha Awal' },
  { nomor: 74, arab: 'الْآخِرُ', latin: 'Al-Akhir', arti: 'Yang Maha Akhir' },
  { nomor: 75, arab: 'الظَّاهِرُ', latin: 'Az-Zahir', arti: 'Yang Maha Nyata' },
  { nomor: 76, arab: 'الْبَاطِنُ', latin: 'Al-Batin', arti: 'Yang Maha Tersembunyi' },
  { nomor: 77, arab: 'الْوَالِي', latin: 'Al-Wali', arti: 'Yang Maha Memerintah' },
  { nomor: 78, arab: 'الْمُتَعَالِي', latin: 'Al-Muta\'ali', arti: 'Yang Maha Tinggi' },
  { nomor: 79, arab: 'الْبَرُّ', latin: 'Al-Barr', arti: 'Yang Maha Penderma' },
  { nomor: 80, arab: 'التَّوَّابُ', latin: 'At-Tawwab', arti: 'Yang Maha Penerima Taubat' },
  { nomor: 81, arab: 'الْمُنْتَقِمُ', latin: 'Al-Muntaqim', arti: 'Yang Maha Pembalas' },
  { nomor: 82, arab: 'الْعَفُوُّ', latin: 'Al-Afuww', arti: 'Yang Maha Pemaaf' },
  { nomor: 83, arab: 'الرَّؤُوفُ', latin: 'Ar-Ra\'uf', arti: 'Yang Maha Belas Kasih' },
  { nomor: 84, arab: 'مَالِكُ الْمُلْكِ', latin: 'Malikul-Mulk', arti: 'Yang Maha Penguasa Kerajaan' },
  { nomor: 85, arab: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', latin: 'Dzul-Jalali wal-Ikram', arti: 'Yang Maha Pemilik Kebesaran dan Kemuliaan' },
  { nomor: 86, arab: 'الْمُقْسِطُ', latin: 'Al-Muqsit', arti: 'Yang Maha Adil' },
  { nomor: 87, arab: 'الْجَامِعُ', latin: 'Al-Jami\'', arti: 'Yang Maha Mengumpulkan' },
  { nomor: 88, arab: 'الْغَنِيُّ', latin: 'Al-Ghaniy', arti: 'Yang Maha Kaya' },
  { nomor: 89, arab: 'الْمُغْنِي', latin: 'Al-Mughni', arti: 'Yang Maha Memberi Kekayaan' },
  { nomor: 90, arab: 'الْمَانِعُ', latin: 'Al-Mani\'', arti: 'Yang Maha Mencegah' },
  { nomor: 91, arab: 'الضَّارُ', latin: 'Ad-Darr', arti: 'Yang Maha Memberi Derita' },
  { nomor: 92, arab: 'النَّافِعُ', latin: 'An-Nafi\'', arti: 'Yang Maha Memberi Manfaat' },
  { nomor: 93, arab: 'النُّورُ', latin: 'An-Nur', arti: 'Yang Maha Bercahaya' },
  { nomor: 94, arab: 'الْهَادِي', latin: 'Al-Hadi', arti: 'Yang Maha Pemberi Petunjuk' },
  { nomor: 95, arab: 'الْبَدِيعُ', latin: 'Al-Badi\'', arti: 'Yang Maha Pencipta' },
  { nomor: 96, arab: 'الْبَاقِي', latin: 'Al-Baqi', arti: 'Yang Maha Kekal' },
  { nomor: 97, arab: 'الْوَارِثُ', latin: 'Al-Warits', arti: 'Yang Maha Pewaris' },
  { nomor: 98, arab: 'الرَّشِيدُ', latin: 'Ar-Rasyid', arti: 'Yang Maha Pandai' },
  { nomor: 99, arab: 'الصَّبُورُ', latin: 'As-Sabur', arti: 'Yang Maha Sabar' }
];

async function handler(m, { sock, args, text }) {
  const query = text?.replace(/^\.asmaulhusna\s*/i, '').trim();

  // Jika tidak ada query, tampilkan semua daftar (1-99)
  if (!query) {
    let list = '🤲 *99 ASMAUL HUSNA*\n\n';
    list += 'Cara pakai: .asmaulhusna <nomor atau nama>\n';
    list += 'Contoh: .asmaulhusna 1\n';
    list += 'Contoh: .asmaulhusna ar-rahman\n\n';
    list += '📋 Daftar 99 Nama Allah:\n';
    for (let i = 0; i < 99; i++) {
      const a = ASMAUL_HUSNA[i];
      const num = String(a.nomor).padStart(2, '0');
      list += `${num}. ${a.latin} (${a.arti})\n`;
      if ((i + 1) % 10 === 0) list += '\n';
    }
    list += '\n💗 *NusaBot* • ' + new Date().getFullYear();
    return m.reply(list);
  }

  // Cari berdasarkan nomor atau nama
  let result = null;
  const lowerQuery = query.toLowerCase();

  // Cari berdasarkan nomor
  const num = parseInt(query);
  if (!isNaN(num) && num >= 1 && num <= 99) {
    result = ASMAUL_HUSNA.find(a => a.nomor === num);
  }

  // Cari berdasarkan nama (latin)
  if (!result) {
    result = ASMAUL_HUSNA.find(a => 
      a.latin.toLowerCase() === lowerQuery || 
      a.latin.toLowerCase().replace(/'/g, '').replace(/ /g, '') === lowerQuery.replace(/ /g, '') ||
      a.arti.toLowerCase().includes(lowerQuery)
    );
  }

  // Cari berdasarkan arab (partial match)
  if (!result) {
    result = ASMAUL_HUSNA.find(a => a.arab.includes(query));
  }

  if (!result) {
    return m.reply(`❌ Asmaul Husna "${query}" tidak ditemukan.\n\n📋 Ketik .asmaulhusna untuk melihat daftar lengkap.`);
  }

  const caption = `🤲 *${result.latin}*\n`;
  caption += `📜 ${result.arab}\n`;
  caption += `📌 Nomor: ${result.nomor} dari 99\n`;
  caption += `💡 Arti: ${result.arti}\n\n`;
  caption += `✨ *Keutamaan:*\n`;
  caption += `• Membaca ${result.latin} akan mendapatkan pahala\n`;
  caption += `• Termasuk zikir yang sangat dianjurkan\n`;
  caption += `• Mendekatkan diri kepada Allah\n\n`;
  caption += `💗 *NusaBot* • ${new Date().getFullYear()}`;

  await m.reply(caption);
  await m.react('🤲');
}

module.exports = {
  config: pluginConfig,
  handler,
};