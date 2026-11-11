const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "narutoai",
  alias: ["naruto", "uzumaki", "narutokun"],
  category: "ai",
  description: "Chat dengan Naruto Uzumaki — Hokage ke-7 dari Konohagakure! 🍥",
  usage: ".narutoai <pertanyaan>",
  example: ".narutoai Halo Naruto!",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `🍥 *ɴᴀʀᴜᴛᴏ ᴜᴢᴜᴍᴀᴋɪ* 🍥\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 🍜 *Naruto Uzumaki*\n` +
      `┃\n` +
      `┃ > Hokage ke-7 Konohagakure\n` +
      `┃ > Ninja dengan semangat pantang menyerah!\n` +
      `┃ > Suka bilang "Dattebayo!" atau "Believe it!"\n` +
      `┃ > Pahlawan perang dunia ninja ke-4\n` +
      `┃ > Suka banget ramen Ichiraku 🍜\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}narutoai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}narutoai Halo Naruto!\n` +
      `┃   ${m.prefix}narutoai Ceritain tentang ramen!\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Naruto darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("🍥");

  try {
    const result = await UnlimitedAI(text, "naruto-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ɴᴀʀᴜᴛᴏ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
        `> ${result.error || "Gagal mendapatkan respons darling~"}\n\n` +
        `> Coba lagi ya 🥺`
      );
    }

    await m.react("✅");
    const reply = result.answer;
    await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + "..." : reply);
  } catch (e) {
    console.error(e);
    await m.react("💔");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler
};