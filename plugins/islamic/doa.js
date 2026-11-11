const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const pluginConfig = {
  name: 'doa',
  alias: ['doaharian', 'doaislam', 'doa'],
  category: 'islamic',
  description: 'Kumpulan Doa Harian lengkap dengan Arab, Latin, Arti, dan Audio',
  usage: '.doa <nama doa>',
  example: '.doa sebelum tidur',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
};

// Database Doa (offline, lengkap)
const DOA_DATABASE = {
  'sebelum tidur': {
    arab: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    latin: 'Bismikallahumma amutu wa ahya',
    arti: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup',
    sumber: 'HR. Bukhari'
  },
  'bangun tidur': {
    arab: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    latin: 'Alhamdulillahilladzi ahyana ba'da ma amatana wa ilaihinnusyur',
    arti: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami dan kepada-Nya lah kami kembali',
    sumber: 'HR. Bukhari'
  },
  'masuk masjid': {
    arab: 'اَللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    latin: 'Allahummaftahli abwaba rahmatik',
    arti: 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu',
    sumber: 'HR. Muslim'
  },
  'keluar masjid': {
    arab: 'اَللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    latin: 'Allahumma inni as-aluka min fadlik',
    arti: 'Ya Allah, aku memohon kepada-Mu karunia-Mu',
    sumber: 'HR. Muslim'
  },
  'sebelum makan': {
    arab: 'اَللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
    latin: 'Allahumma barik lana fima razaqtana waqina adzabannar',
    arti: 'Ya Allah, berkahilah kami dalam rezeki yang Engkau berikan dan peliharalah kami dari siksa neraka',
    sumber: 'HR. Ibnu Sunni'
  },
  'sesudah makan': {
    arab: 'اَلْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    latin: 'Alhamdulillahilladzi ath'amani hadza wa razaqanihi min ghairi haulin minni wa la quwwah',
    arti: 'Segala puji bagi Allah yang telah memberiku makan ini dan telah memberiku rezeki tanpa daya dan kekuatan dariku',
    sumber: 'HR. Abu Dawud'
  },
  'sebelum belajar': {
    arab: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    latin: 'Rabbi syrahli shadri wa yassirli amri',
    arti: 'Ya Tuhanku, lapangkanlah dadaku dan mudahkanlah urusanku',
    sumber: 'QS. Thaha: 25-26'
  },
  'sesudah belajar': {
    arab: 'رَبِّ زِدْنِي عِلْمًا',
    latin: 'Rabbi zidni ilma',
    arti: 'Ya Tuhanku, tambahkanlah aku ilmu',
    sumber: 'QS. Thaha: 114'
  },
  'keluar rumah': {
    arab: 'بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
    latin: 'Bismillahi tawakkaltu 'alallah la haula wa la quwwata illa billah',
    arti: 'Dengan nama Allah, aku bertawakkal kepada Allah, tiada daya dan kekuatan kecuali dengan Allah',
    sumber: 'HR. Abu Dawud'
  },
  'masuk rumah': {
    arab: 'بِسْمِ اللهِ وَلَجْنَا وَبِسْمِ اللهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    latin: 'Bismillahi walajna wa bismillahi kharajna wa 'ala rabbina tawakkalna',
    arti: 'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Tuhan kami kami bertawakkal',
    sumber: 'HR. Abu Dawud'
  },
  'cinta': {
    arab: 'اَللَّهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ وَحُبَّ مَنْ يُحِبُّكَ وَحُبَّ عَمَلٍ يُقَرِّبُنِي إِلَى حُبِّكَ',
    latin: 'Allahumma inni as-aluka hubbaka wa hubba man yuhibbuka wa hubba 'amalin yuqarribuni ila hubbik',
    arti: 'Ya Allah, aku memohon cinta-Mu, cinta orang yang mencintai-Mu, dan cinta amal yang mendekatkanku kepada cinta-Mu',
    sumber: 'HR. Tirmidzi'
  },
  'bercermin': {
    arab: 'اَللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
    latin: 'Allahumma kama hassanta khalqi fahassin khuluqi',
    arti: 'Ya Allah, sebagaimana Engkau telah memperindah penciptaanku, maka perindahlah akhlakku',
    sumber: 'HR. Ahmad'
  },
  'naik kendaraan': {
    arab: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ',
    latin: 'Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinina wa inna ila rabbina lamunqalibun',
    arti: 'Maha Suci Allah yang telah menundukkan ini untuk kami, padahal kami sebelumnya tidak mampu, dan sesungguhnya kami akan kembali kepada Tuhan kami',
    sumber: 'QS. Az-Zukhruf: 13-14'
  }
};

// ========== TTS FUNCTION ==========
async function textToSpeech(text, lang = 'id') {
  const tempDir = path.join(__dirname, '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const fileName = `doa_${Date.now()}`;
  const mp3Path = path.join(tempDir, `${fileName}.mp3`);
  const oggPath = path.join(tempDir, `${fileName}.ogg`);

  try {
    // Gunakan API TTS gratis
    const url = `https://api.voicerss.org/?key=6e14266f281a41ad8e2b65078ad0c954&hl=id-id&src=${encodeURIComponent(text)}&c=MP3`;
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    fs.writeFileSync(mp3Path, Buffer.from(response.data));

    // Konversi ke OGG/Opus untuk WhatsApp
    try {
      await execAsync(`ffmpeg -y -i "${mp3Path}" -c:a libopus -b:a 32k -ar 24000 "${oggPath}"`, { timeout: 30000 });
      if (fs.existsSync(oggPath)) {
        fs.unlinkSync(mp3Path);
        return oggPath;
      }
    } catch (ffmpegError) {
      console.log('[DOA] FFmpeg error, using MP3:', ffmpegError.message);
    }

    return mp3Path;
  } catch (error) {
    console.error('[DOA TTS] Error:', error.message);
    return null;
  }
}

async function handler(m, { sock, args, text }) {
  const query = text?.replace(/^\.doa\s*/i, '').trim();

  if (!query) {
    let list = '🤲 *ZERO TWO - KUMPULAN DOA HARIAN*\n\n';
    list += 'Cara pakai: .doa <nama doa>\n';
    list += 'Contoh: .doa sebelum tidur\n\n';
    list += '📋 Daftar Doa:\n';
    const keys = Object.keys(DOA_DATABASE);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      list += `${i+1}. ${key.charAt(0).toUpperCase() + key.slice(1)}\n`;
    }
    list += `\n💗 NusaBot • ${new Date().getFullYear()}`;
    return m.reply(list);
  }

  const doaKey = query.toLowerCase();
  let doa = DOA_DATABASE[doaKey];
  let foundKey = doaKey;

  if (!doa) {
    const match = Object.keys(DOA_DATABASE).find(key => key.includes(doaKey));
    if (match) {
      doa = DOA_DATABASE[match];
      foundKey = match;
    } else {
      return m.reply(`❌ Doa "${query}" tidak ditemukan.\n\n📋 Ketik .doa untuk melihat daftar doa.`);
    }
  }

  const displayKey = foundKey.charAt(0).toUpperCase() + foundKey.slice(1);

  let caption = `🤲 *DOA ${displayKey.toUpperCase()}*\n\n`;
  caption += `📜 *Arab:*\n${doa.arab}\n\n`;
  caption += `🔤 *Latin:*\n${doa.latin}\n\n`;
  caption += `💡 *Artinya:*\n${doa.arti}\n\n`;
  caption += `📚 *Sumber:* ${doa.sumber}\n`;
  caption += `\n💗 NusaBot • ${new Date().getFullYear()}`;

  // Kirim teks dulu
  await m.reply(caption);
  await m.react('🤲');

  // Generate & kirim audio
  try {
    const audioPath = await textToSpeech(doa.arti);
    if (audioPath && fs.existsSync(audioPath)) {
      const audioBuffer = fs.readFileSync(audioPath);
      await sock.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: true,
      }, { quoted: m });

      // Hapus file setelah dikirim
      fs.unlinkSync(audioPath);
    } else {
      console.log('[DOA] Audio generation failed, skipping audio.');
    }
  } catch (audioError) {
    console.error('[DOA] Audio error:', audioError.message);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};