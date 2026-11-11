const { UnlimitedAI } = require("../../src/scraper/unlimitedai.js");
const te = require("../../src/lib/zerotwo-error.js");

const pluginConfig = {
  name: "waguri-ai",
  alias: ["waguriai", "waguri"],
  category: "ai",
  description: "Chat dengan Waguri-san — Gadis pemalu yang lupa kacamata",
  usage: ".waguri-ai <pertanyaan>",
  example: ".waguri-ai Waguri-san, halo!",
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
      `💕 *WAGURI-SAN* 💕\n\n` +
      `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ 👓 *Waguri-san*\n` +
      `┃\n` +
      `┃ > Gadis pemalu dari\n` +
      `┃ > "The Girl I Like Forgot Her Glasses"\n` +
      `┃ > Manis, perhatian, dan sering salah tingkah~\n` +
      `┃\n` +
      `┃ ✦ *Cara Pakai*\n` +
      `┃\n` +
      `┃   ${m.prefix}waguri-ai <pertanyaan>\n` +
      `┃\n` +
      `┃ ✦ *Contoh*\n` +
      `┃\n` +
      `┃   ${m.prefix}waguri-ai Waguri-san, halo!\n` +
      `┃\n` +
      `┃ 💗 *Zero Two:* Mau ngobrol sama Waguri-san darling~?\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━⬣`
    );
  }

  await m.react("💕");

  try {
    const result = await UnlimitedAI(text, "waguri-ai");

    if (!result.status) {
      await m.react("💔");
      return m.reply(
        `💔 *WAGURI AI ERROR*\n\n` +
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