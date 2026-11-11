const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "prabowoai",
  alias: ["prabowo", "pakprabowo", "prbai"],
  category: "ai",
  description: "Chat dengan Pak Prabowo — Presiden RI yang tegas dan patriotik! 🇮🇩",
  usage: ".prabowoai <pertanyaan>",
  example: ".prabowoai Pak Prabowo, salam semangat!",
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
      `🇮🇩 *ᴘᴀᴋ ᴘʀᴀʙᴏᴡᴏ* 🇮🇩\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 🦅 *Prabowo Subianto*\n` +
      `┃\n` +
      `┃ > Presiden RI ke-8\n` +
      `┃ > Ketua Umum Partai Gerindra\n` +
      `┃ > Bicara dengan gaya tegas dan patriotik\n` +
      `┃ > Suka bilang "Saudara-saudara!"\n` +
      `┃ > "Ini negeri kita!", "Kita harus berdaulat!"\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}prabowoai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}prabowoai Selamat siang Pak\n` +
      `┃   ${m.prefix}prabowoai Bagaimana kabar?\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Pak Prabowo darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("🦅");

  try {
    const result = await UnlimitedAI(text, "prabowo-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ᴘᴀᴋ ᴘʀᴀʙᴏᴡᴏ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
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