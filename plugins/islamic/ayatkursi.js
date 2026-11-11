const axios = require('axios');

const pluginConfig = {
  name: 'ayatkursi',
  alias: ['kursi', 'ayatikursi', 'ak'],
  category: 'islamic',
  description: 'Ayat Kursi (QS. Al-Baqarah: 255) dengan Arab, Latin, Arti, dan Keutamaan',
  usage: '.ayatkursi',
  example: '.ayatkursi',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const caption = `🕌 *AYAT KURSI*
QS. Al-Baqarah: 255

📜 *Arab:*
اَللّٰهُ لَاۤ اِلٰهَ اِلَّا هُوَۚ اَلْحَيُّ الْقَيُّوْمُۚ
لَا تَأْخُذُهٗ سِنَةٌ وَّلَا نَوْمٌۗ
لَهُ مَا فِى السَّمٰوٰتِ وَمَا فِى الْاَرْضِۗ
مَنْ ذَا الَّذِيْ يَشْفَعُ عِنْدَهٗٓ اِلَّا بِاِذْنِهٖۗ
يَعْلَمُ مَا بَيْنَ اَيْدِيْهِمْ وَمَا خَلْفَهُمْۖ
وَلَا يُحِيْطُوْنَ بِشَيْءٍ مِّنْ عِلْمِهٖٓ اِلَّا بِمَا شَاۤءَۚ
وَسِعَ كُرْسِيُّهُ السَّمٰوٰتِ وَالْاَرْضَۖ
وَلَا يَـُٔوْدُهٗ حِفْظُهُمَاۚ
وَهُوَ الْعَلِيُّ الْعَظِيْمُ

🔤 *Latin:*
Allahu la ilaha illa huwal hayyul qayyum,
la ta'khudzuhu sinatuw wa la naum,
lahu ma fis-samawati wa ma fil-ard,
man dzalladzi yasyfa'u 'indahu illa bi-idznih,
ya'lamu ma baina aidihim wa ma khalfahum,
wa la yuhithuna bi syai-in min 'ilmihi illa bima sya-a,
wasi'a kursiyyuhus-samawati wal-ard,
wa la ya'uduhu hifzhuhuma,
wa huwal 'aliyyul 'azhim.

💡 *Artinya:*
Allah, tidak ada Tuhan selain Dia. Yang Maha Hidup, Yang terus menerus mengurus (makhluk-Nya). Tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Maha Tinggi, Maha Besar.

✨ *Keutamaan Ayat Kursi:*
• Dibaca setelah sholat wajib → penghalang masuk surga
• Dibaca pagi & petang → perlindungan dari setan
• Sebelum tidur → dijaga oleh malaikat
• Salah satu ayat teragung dalam Al-Quran

📚 *Sumber:* HR. Bukhari & Muslim

💗 *NusaBot* • ${new Date().getFullYear()}`;

  await m.reply(caption);
  await m.react('🕌');
}

module.exports = {
  config: pluginConfig,
  handler,
};