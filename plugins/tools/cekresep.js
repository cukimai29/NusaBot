const axios = require('axios');
const config = require('../../config.js');

const pluginConfig = {
  name: 'cekresep',
  alias: ['resep', 'masakan', 'food', 'recipe'],
  category: 'tools',
  description: 'Mencari resep masakan lengkap (bahan, langkah, durasi, asal, dll)',
  usage: '.cekresep <nama masakan>',
  example: '.cekresep nasi goreng',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const query = m.text?.replace(/^\.cekresep\s*/i, '').trim();
  if (!query) {
    return m.reply(`🍳 *Cari Resep Masakan*

Cari resep masakan dari seluruh dunia dengan detail lengkap.

📌 Cara pakai:
.cekresep <nama masakan>

📌 Contoh:
.cekresep nasi goreng
.cekresep ayam geprek
.cekresep spaghetti
.cekresep sushi

💡 Dapatkan informasi:
🥘 Bahan-bahan, 📝 Langkah memasak,
⏱️ Durasi, 🌍 Asal masakan, 🍽️ Porsi, dan lainnya.`);
  }

  try {
    await m.react('🔍');

    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
      { timeout: 15000 }
    );

    const meals = response.data.meals;
    if (!meals || meals.length === 0) {
      return m.reply(`❌ Resep "${query}" tidak ditemukan. Coba kata kunci lain (gunakan bahasa Inggris atau Indonesia).`);
    }

    const recipe = meals[0];

    // Ambil data
    const name = recipe.strMeal || 'Unknown';
    const category = recipe.strCategory || 'Unknown';
    const area = recipe.strArea || 'Unknown';
    const instructions = recipe.strInstructions || 'Tidak ada langkah.';
    const image = recipe.strMealThumb || '';
    const youtube = recipe.strYoutube || '';
    const source = recipe.strSource || '';
    const tags = recipe.strTags || 'Tidak ada';
    const drink = recipe.strDrinkAlternate || '-';

    // Kumpulkan bahan & ukuran
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push(`${ing} (${measure || 'secukupnya'})`);
      }
    }

    // Potong instruksi jika terlalu panjang
    let shortInstructions = instructions;
    if (instructions.length > 800) {
      shortInstructions = instructions.substring(0, 800) + '... (lanjut di link)';
    }

    // Hitung durasi (perkiraan)
    let duration = '~30 menit';
    if (category.toLowerCase().includes('cake') || category.toLowerCase().includes('bread')) {
      duration = '~60 menit';
    } else if (category.toLowerCase().includes('soup') || category.toLowerCase().includes('salad')) {
      duration = '~15 menit';
    } else if (category.toLowerCase().includes('dessert')) {
      duration = '~45 menit';
    }

    // Emoji random
    const emojis = ['🍳', '🥘', '🍲', '🍛', '🥗', '🍝', '🍜', '🥘'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    let caption = `${emoji} *${name}*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📂 *Kategori* : ${category}\n`;
    caption += `🌍 *Asal*     : ${area}\n`;
    caption += `⏱️ *Durasi*   : ${duration}\n`;
    caption += `🍽️ *Porsi*    : ${ingredients.length > 4 ? '~4 orang' : '~2 orang'}\n`;
    caption += `🏷️ *Tags*     : ${tags}\n`;
    caption += `🍹 *Minuman*  : ${drink}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━\n`;
    caption += `🛒 *Bahan-bahan:*\n`;
    for (const ing of ingredients.slice(0, 15)) {
      caption += `  • ${ing}\n`;
    }
    if (ingredients.length > 15) {
      caption += `  • ... dan ${ingredients.length - 15} bahan lainnya.\n`;
    }
    caption += `━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📝 *Cara Memasak:*\n${shortInstructions}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━\n`;
    if (youtube) caption += `🎥 *Video:* ${youtube}\n`;
    if (source) caption += `🔗 *Sumber:* ${source}\n`;
    caption += `\n💗 *YAE MIKO AI* • ${new Date().getFullYear()}`;

    if (image) {
      await sock.sendMessage(m.chat, {
        image: { url: image },
        caption: caption,
      }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
    }

    await m.react('🍳');
  } catch (err) {
    console.error('[CekResep] Error:', err.message);
    await m.react('❌');
    await m.reply(`❌ Gagal mencari resep: ${err.message}\n\n💡 Coba kata kunci lain atau cek koneksi internet.`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};