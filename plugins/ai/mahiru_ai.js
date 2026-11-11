const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "mahiru-ai",
  alias: ["mahiru", "mahirushima", "angelai"],
  category: "ai",
  description: "Chat dengan Mahiru Shiina — Gadis angelic dari The Angel Next Door Spoils Me Rotten",
  usage: ".mahiru-ai <pertanyaan>",
  example: ".mahiru-ai Mahiru-chan, halo!",
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
      `💕 *ᴍᴀʜɪʀᴜ ꜱʜɪɪɴᴀ* 💕\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 👼 *Mahiru Shiina*\n` +
      `┃\n` +
      `┃ > Gadis angelic dari\n` +
      `┃ > "The Angel Next Door Spoils Me Rotten"\n` +
      `┃ > Cantik, manis, populer di sekolah,\n` +
      `┃ > tapi sebenarnya pemalu dan perhatian~\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}mahiru-ai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}mahiru-ai Mahiru-chan, halo!\n` +
      `┃   ${m.prefix}mahiru-ai Mahiru, masak apa hari ini?\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Mahiru darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("💕");

  try {
    const result = await UnlimitedAI(text, "mahiru-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *ᴍᴀʜɪʀᴜ ᴀɪ ᴇʀʀᴏʀ*\n\n` +
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