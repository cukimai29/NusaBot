const axios = require('axios');

const pluginConfig = {
  name: 'niatsholat',
  alias: ['niat', 'niatshalat', 'niatpuasa', 'niatwudhu'],
  category: 'islamic',
  description: 'Kumpulan Niat Ibadah Lengkap (Sholat, Puasa, Wudhu, Zakat, Haji, dll)',
  usage: '.niatsholat <nama ibadah>',
  example: '.niatsholat sholat subuh',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true,
};

// Database Niat Ibadah
const NIAT_DATABASE = {
  'sholat subuh': {
    arab: 'اُصَلِّى فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushalli fardhash-shubhi rak\'ataini mustaqbilal qiblati adaa-an lillahi ta\'ala',
    arti: 'Aku niat sholat fardhu subuh dua rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat dzuhur': {
    arab: 'اُصَلِّى فَرْضَ الظُّهْرِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushalli fardhazh-zhuhri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala',
    arti: 'Aku niat sholat fardhu dzuhur empat rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat ashar': {
    arab: 'اُصَلِّى فَرْضَ الْعَصْرِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushalli fardhal-ashri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala',
    arti: 'Aku niat sholat fardhu ashar empat rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat maghrib': {
    arab: 'اُصَلِّى فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushalli fardhal-maghribi tsalatsa raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala',
    arti: 'Aku niat sholat fardhu maghrib tiga rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat isya': {
    arab: 'اُصَلِّى فَرْضَ الْعِشَاءِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushalli fardhal-Isya-i arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala',
    arti: 'Aku niat sholat fardhu isya empat rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat tahajud': {
    arab: 'اُصَلِّى سُنَّةَ التَّهَجُّدِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushalli sunnatat-tahajjudi rak\'ataini mustaqbilal qiblati lillahi ta\'ala',
    arti: 'Aku niat sholat sunnah tahajud dua rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat dhuha': {
    arab: 'اُصَلِّى سُنَّةَ الضُّحَى رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushalli sunnatadh-dhuha rak\'ataini mustaqbilal qiblati lillahi ta\'ala',
    arti: 'Aku niat sholat sunnah dhuha dua rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat tarawih': {
    arab: 'اُصَلِّى سُنَّةَ التَّرَاوِيحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushalli sunnatat-tarawihi rak\'ataini mustaqbilal qiblati lillahi ta\'ala',
    arti: 'Aku niat sholat sunnah tarawih dua rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat witir': {
    arab: 'اُصَلِّى سُنَّةَ الْوِتْرِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushalli sunnatal-witri tsalatsa raka\'atin mustaqbilal qiblati lillahi ta\'ala',
    arti: 'Aku niat sholat sunnah witir tiga rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'sholat taubat': {
    arab: 'اُصَلِّى سُنَّةَ التَّوْبَةِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushalli sunnatat-taubati rak\'ataini mustaqbilal qiblati lillahi ta\'ala',
    arti: 'Aku niat sholat sunnah taubat dua rakaat menghadap kiblat karena Allah Ta\'ala'
  },
  'wudhu': {
    arab: 'نَوَيْتُ الْوُضُوْءَ لِرَفْعِ الْحَدَثِ الْأَصْغَرِ لِلَّهِ تَعَالَى',
    latin: 'Nawaitul wudhu-a li-raf\'il hadatsil ashghari lillahi ta\'ala',
    arti: 'Aku niat wudhu untuk menghilangkan hadats kecil karena Allah Ta\'ala'
  },
  'puasa ramadhan': {
    arab: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ اَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma ghadin \'an ada\'i fardhi syahri ramadhana hadzihis sanati lillahi ta\'ala',
    arti: 'Aku niat puasa esok hari untuk menunaikan fardhu bulan Ramadhan tahun ini karena Allah Ta\'ala'
  },
  'puasa sunnah': {
    arab: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ اَدَاءِ السُّنَّةِ لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma ghadin \'an ada\'is-sunnati lillahi ta\'ala',
    arti: 'Aku niat puasa sunnah esok hari karena Allah Ta\'ala'
  },
  'puasa arafah': {
    arab: 'نَوَيْتُ صَوْمَ عَرَفَةَ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma arafata sunnatan lillahi ta\'ala',
    arti: 'Aku niat puasa Arafah sunnah karena Allah Ta\'ala'
  },
  'puasa asyura': {
    arab: 'نَوَيْتُ صَوْمَ عَاشُوْرَاءَ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma \'asyuuraa-a sunnatan lillahi ta\'ala',
    arti: 'Aku niat puasa Asyura sunnah karena Allah Ta\'ala'
  },
  'zakat fitrah': {
    arab: 'نَوَيْتُ اَخْرَاجَ زَكَاةِ الْفِطْرِ عَنْ نَفْسِيْ وَعَنْ جَمِيْعِ مَا يَلْزَمُنِيْ لِلَّهِ تَعَالَى',
    latin: 'Nawaitu ikhraja zakatil fitri \'an nafsi wa \'an jami\'i ma yalzamuni lillahi ta\'ala',
    arti: 'Aku niat mengeluarkan zakat fitrah untuk diriku dan semua yang menjadi tanggunganku karena Allah Ta\'ala'
  },
  'zakat mal': {
    arab: 'نَوَيْتُ اَخْرَاجَ الزَّكَاةِ عَنْ مَالِى لِلَّهِ تَعَالَى',
    latin: 'Nawaitu ikhraja zakat \'an mali lillahi ta\'ala',
    arti: 'Aku niat mengeluarkan zakat dari hartaku karena Allah Ta\'ala'
  }
};

async function handler(m, { sock, args, text, prefix }) {
  // Gunakan prefix dinamis (bisa . atau ..)
  const p = prefix || '.';
  // Hapus prefix dari text
  const query = text?.replace(new RegExp(`^\\${p}niatsholat\\s*`, 'i'), '').trim();

  if (!query) {
    let list = '🕌 *NIAT IBADAH LENGKAP*\n\n';
    list += `Cara pakai: ${p}niatsholat <nama ibadah>\n`;
    list += `Contoh: ${p}niatsholat sholat subuh\n\n`;
    list += '📋 Daftar Niat Ibadah:\n';
    const keys = Object.keys(NIAT_DATABASE);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      list += `${i+1}. ${key.charAt(0).toUpperCase() + key.slice(1)}\n`;
    }
    list += `\n💗 NusaBot • ${new Date().getFullYear()}`;
    return m.reply(list);
  }

  const niatKey = query.toLowerCase();
  let niat = NIAT_DATABASE[niatKey];

  if (!niat) {
    const match = Object.keys(NIAT_DATABASE).find(key => key.includes(niatKey));
    if (match) {
      niat = NIAT_DATABASE[match];
      const foundKey = match;
      const displayKey = foundKey.charAt(0).toUpperCase() + foundKey.slice(1);
      let caption = `🕌 *NIAT ${displayKey.toUpperCase()}*\n\n`;
      caption += `📜 Arab:\n${niat.arab}\n\n`;
      caption += `🔤 Latin:\n${niat.latin}\n\n`;
      caption += `💡 Artinya:\n${niat.arti}\n\n`;
      caption += `\n📋 *Copy Teks:*\n`;
      caption += `Arab: ${niat.arab}\n`;
      caption += `Latin: ${niat.latin}\n`;
      caption += `\n💗 NusaBot • ${new Date().getFullYear()}`;
      return m.reply(caption);
    }
    return m.reply(`❌ Niat "${query}" tidak ditemukan.\n\n📋 Ketik ${p}niatsholat untuk melihat daftar.`);
  }

  const displayKey = niatKey.charAt(0).toUpperCase() + niatKey.slice(1);
  let caption = `🕌 *NIAT ${displayKey.toUpperCase()}*\n\n`;
  caption += `📜 Arab:\n${niat.arab}\n\n`;
  caption += `🔤 Latin:\n${niat.latin}\n\n`;
  caption += `💡 Artinya:\n${niat.arti}\n\n`;
  caption += `\n📋 *Copy Teks:*\n`;
  caption += `Arab: ${niat.arab}\n`;
  caption += `Latin: ${niat.latin}\n`;
  caption += `\n💗 NusaBot • ${new Date().getFullYear()}`;

  await m.reply(caption);
  await m.react('🕌');
}

module.exports = {
  config: pluginConfig,
  handler,
};