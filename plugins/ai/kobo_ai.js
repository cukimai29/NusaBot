const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "koboai",
  alias: ["kobo", "kobokanaeru", "kobochan"],
  category: "ai",
  description: "Chat dengan Kobo Kanaeru — Wind Shaman dari Hololive Indonesia! 💨",
  usage: ".koboai <pertanyaan>",
  example: ".koboai Halo Kobo-chan!",
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
      `💨 *ᴋᴏʙᴏ ᴋᴀɴᴀᴇʀᴜ* 💨\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 🌊 *Kobo Kanaeru*\n` +
      `┃\n` +
      `┃ > Wind Shaman dari\n` +
      `┃ > Hololive Indonesia gen 3\n` +
      `┃ > Gadis cheerfull, energetic,\n` +
      `┃ > dan sedikit tsundere!\n` +
      `┃ > Suka bilang "DAJOOR!" 🗿\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}koboai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}koboai Halo Kobo-chan!\n` +
      `┃   ${m.prefix}koboai Kobo lagi ngapain?\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Kobo darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("💨");

  try {
    const result = await UnlimitedAI(text, "kobo-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ᴋᴏʙᴏ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
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