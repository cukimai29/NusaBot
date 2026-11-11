const axios = require('axios');

const pluginConfig = {
  name: 'kajian',
  alias: ['kajianislam', 'ceramah', 'ngaji'],
  category: 'islamic',
  description: 'Jadwal Kajian Islam Online dari berbagai platform (Youtube, Telegram, dll)',
  usage: '.kajian',
  example: '.kajian',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
};

// Database Kajian Islam (update manual)
const KAJIAN_DATABASE = [
  {
    nama: 'Habib Umar bin Hafidz',
    topik: 'Tafsir & Tasawuf',
    jadwal: 'Setiap Malam (ba\'da Maghrib)',
    platform: 'YouTube & Telegram',
    link: 'https://youtube.com/@darulmustafa',
    deskripsi: 'Kajian rutin dari Darul Mustafa, Tarim-Yaman'
  },
  {
    nama: 'Ustadz Adi Hidayat',
    topik: 'Tafsir, Fiqih, & Akidah',
    jadwal: 'Setiap Pagi (ba\'da Subuh)',
    platform: 'YouTube',
    link: 'https://youtube.com/@adihidayatofficial',
    deskripsi: 'Kajian rutin dari Ustadz Adi Hidayat Official'
  },
  {
    nama: 'Ustadz Abdul Somad',
    topik: 'Fiqih & Dakwah',
    jadwal: 'Setiap Malam (ba\'da Isya)',
    platform: 'YouTube',
    link: 'https://youtube.com/@UstadzAbdulSomadOfficial',
    deskripsi: 'Kajian dari Ustadz Abdul Somad Official'
  },
  {
    nama: 'Habib Novel Alaydrus',
    topik: 'Tasawuf & Akhlak',
    jadwal: 'Setiap Malam (ba\'da Maghrib)',
    platform: 'YouTube & Instagram',
    link: 'https://youtube.com/@habibnovelalaydrus',
    deskripsi: 'Kajian dari Habib Novel Alaydrus'
  },
  {
    nama: 'Ustadz Khalid Basalamah',
    topik: 'Tafsir & Sejarah Islam',
    jadwal: 'Setiap Pagi (ba\'da Subuh)',
    platform: 'YouTube',
    link: 'https://youtube.com/@khalidbasalamah',
    deskripsi: 'Kajian dari Ustadz Khalid Basalamah'
  },
  {
    nama: 'Habib Segaf Baharun',
    topik: 'Tasawuf & Doa',
    jadwal: 'Setiap Malam (ba\'da Isya)',
    platform: 'YouTube',
    link: 'https://youtube.com/@habibsegafbaharun',
    deskripsi: 'Kajian dari Habib Segaf Baharun'
  },
  {
    nama: 'Ustadz Evie Effendi',
    topik: 'Fiqih Wanita & Keluarga',
    jadwal: 'Setiap Kamis Malam',
    platform: 'YouTube & Telegram',
    link: 'https://youtube.com/@evieeffendi',
    deskripsi: 'Kajian khusus untuk wanita dan keluarga'
  },
  {
    nama: 'Gus Baha',
    topik: 'Tafsir & Tasawuf',
    jadwal: 'Setiap Malam (ba\'da Isya)',
    platform: 'YouTube',
    link: 'https://youtube.com/@gusbaha',
    deskripsi: 'Kajian dari KH. Bahauddin Nursalim (Gus Baha)'
  },
  {
    nama: 'Ustadz Hanan Attaki',
    topik: 'Dakwah & Pemuda',
    jadwal: 'Setiap Malam (ba\'da Isya)',
    platform: 'YouTube & Instagram',
    link: 'https://youtube.com/@hananattaki',
    deskripsi: 'Kajian dari Ustadz Hanan Attaki'
  },
  {
    nama: 'Habib Jindan bin Novel',
    topik: 'Tasawuf & Akhlak',
    jadwal: 'Setiap Malam (ba\'da Maghrib)',
    platform: 'YouTube',
    link: 'https://youtube.com/@habibjindan',
    deskripsi: 'Kajian dari Habib Jindan bin Novel'
  }
];

async function handler(m, { sock, args, text, prefix }) {
  const p = prefix || '.';
  const query = text?.replace(new RegExp(`^\\${p}kajian\\s*`, 'i'), '').trim();

  // Jika ada keyword pencarian
  if (query) {
    const results = KAJIAN_DATABASE.filter(k => 
      k.nama.toLowerCase().includes(query.toLowerCase()) ||
      k.topik.toLowerCase().includes(query.toLowerCase()) ||
      k.deskripsi.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      return m.reply(`❌ Kajian "${query}" tidak ditemukan.\n\n📋 Ketik ${p}kajian untuk melihat semua jadwal.`);
    }

    let caption = '🕌 *JADWAL KAJIAN ISLAM*\n\n';
    for (const k of results) {
      caption += `📌 *${k.nama}*\n`;
      caption += `📚 Topik: ${k.topik}\n`;
      caption += `⏰ Jadwal: ${k.jadwal}\n`;
      caption += `📱 Platform: ${k.platform}\n`;
      caption += `🔗 Link: ${k.link}\n`;
      caption += `📝 ${k.deskripsi}\n\n`;
    }
    caption += `💗 NusaBot • ${new Date().getFullYear()}`;
    return m.reply(caption);
  }

  // Tampilkan semua jadwal (dibagi per 5)
  let caption = '🕌 *JADWAL KAJIAN ISLAM ONLINE*\n\n';
  caption += `📌 Total ${KAJIAN_DATABASE.length} kajian aktif\n\n`;

  for (let i = 0; i < KAJIAN_DATABASE.length; i++) {
    const k = KAJIAN_DATABASE[i];
    caption += `${i+1}. *${k.nama}*\n`;
    caption += `   📚 ${k.topik}\n`;
    caption += `   ⏰ ${k.jadwal}\n`;
    caption += `   📱 ${k.platform}\n`;
    caption += `   🔗 ${k.link}\n\n`;
  }

  caption += `💡 Cari kajian tertentu:\n`;
  caption += `${p}kajian <nama/topik>\n`;
  caption += `Contoh: ${p}kajian adi hidayat\n\n`;
  caption += `💗 NusaBot • ${new Date().getFullYear()}`;

  await m.reply(caption);
  await m.react('🕌');
}

module.exports = {
  config: pluginConfig,
  handler,
};