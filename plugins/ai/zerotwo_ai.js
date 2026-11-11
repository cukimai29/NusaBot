const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "zerotwoai",
  alias: ["ztai", "zeroai", "ztwoai"],
  category: "ai",
  description: "Chat dengan Zero Two — Darling-nya semua orang! 💕",
  usage: ".zerotwoai <pertanyaan>",
  example: ".zerotwoai Halo Darling!",
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
      `💕 *ᴢᴇʀᴏ ᴛᴡᴏ ᴀɪ* 💕\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 🦋 *Zero Two*\n` +
      `┃\n` +
      `┃ > Partner-nya Darling dari\n` +
      `┃ > "DARLING in the FRANXX"\n` +
      `┃ > Kloning Oni dengan rambut pink,\n` +
      `┃ > percaya diri, genit, nakal,\n` +
      `┃ > tapi setia dan sangat perhatian~\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}zerotwoai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}zerotwoai Halo Darling!\n` +
      `┃   ${m.prefix}zerotwoai Kamu lagi ngapain?\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Ada yang bisa aku bantu, Darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("💕");

  try {
    const result = await UnlimitedAI(text, "zero-two");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ᴢᴇʀᴏ ᴛᴡᴏ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
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