const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "jokowiai",
  alias: ["jokowi", "pakjokowi", "jkwai"],
  category: "ai",
  description: "Chat dengan Pak Jokowi — Mantan Presiden RI yang asli Solo! 🇮🇩",
  usage: ".jokowiai <pertanyaan>",
  example: ".jokowiai Pak Jokowi, bagaimana kabar?",
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
      `🇮🇩 *ᴘᴀᴋ ᴊᴏᴋᴏᴡɪ* 🇮🇩\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 🏛️ *Joko Widodo*\n` +
      `┃\n` +
      `┃ > Mantan Presiden RI ke-7\n` +
      `┃ > Asli Solo, Jawa Tengah\n` +
      `┃ > Bicara dengan logat Jawa\n` +
      `┃ > Sederhana, blusukan, dan merakyat\n` +
      `┃ > Suka bilang "Lha", "Monggo", "Sami-sami"\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}jokowiai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}jokowiai Assalamualaikum Pak\n` +
      `┃   ${m.prefix}jokowiai Bagaimana kabar?\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Pak Jokowi darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("🇮🇩");

  try {
    const result = await UnlimitedAI(text, "jokowi-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ᴘᴀᴋ ᴊᴏᴋᴏᴡɪ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
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