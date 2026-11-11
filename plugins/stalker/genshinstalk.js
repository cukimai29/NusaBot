const te = require('../../src/lib/zerotwo-error.js');
const config = require('../../config.js');

const pluginConfig = {
  name: "genshinstalk",
  alias: ["gstalk"],
  category: "stalker",
  description: "Stalk profil Genshin Impact dari UID",
  usage: ".gstalk <uid>",
  example: ".gstalk 840737446",
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

const API = "https://api.obscuraworks.org/api/stalk/genshin";
const KEY = config.APIkey.obscura;

async function handler(m, { sock }) {
  const uid = m.text?.trim();
  if (!uid || !/^\d{5,9}$/.test(uid)) {
    return m.reply(
      `⚔️ *ɢᴇɴꜱʜɪɴ ꜱᴛᴀʟᴋᴇʀ*\n\n` +
        `- Lihat profil Genshin Impact dari UID\n` +
        `- Masukkan UID yang valid\n\n` +
        `\`${m.prefix}gstalk 840737446\``,
    );
  }

  m.react("🕕");

  try {
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 120000);
    const r = await fetch(`${API}?uid=${uid}`, {
      headers: {
        Accept: "application/json, image/*, audio/*, video/*",
        Authorization: `Bearer ${KEY}`,
      },
      signal: ac.signal,
    });
    clearTimeout(tid);

    const res = await r.json();
    const d = res?.data;

    if (!res?.status || !d) {
      m.react("❌");
      return m.reply(
        `⚔️ *ᴜɪᴅ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
          `- Pastikan UID benar dan profil tidak private`,
      );
    }

    m.react("✅");

    const chars =
      d.characters
        ?.slice(0, 5)
        .map((c) => `  - ${c.name} Lv.${c.level}`)
        .join("\n") || "  - Tidak ada";

    let msg =
      `⚔️ *ɢᴇɴꜱʜɪɴ ꜱᴛᴀʟᴋᴇʀ*\n\n` +
      `- *Nickname* → ${d.nickname || "-"}\n` +
      `- *UID* → \`${d.uid}\`\n` +
      `- *AR* → ${d.level}\n` +
      `- *WL* → ${d.world_level}\n` +
      `- *Achievement* → ${d.achievement}\n` +
      `- *Abyss* → ${d.spiral_abyss || "-"}\n` +
      `- *Signature* → ${d.signature || "-"}\n\n` +
      `🎭 *Characters*\n${chars}`;

    if (d.image) {
      await sock.sendMedia(m.chat, d.image, msg, m, {
        type: "image",
      });
    } else {
      m.reply(msg);
    }
  } catch (e) {
    console.log(e);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}
module.exports = { config: pluginConfig, handler };