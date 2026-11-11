const { getDatabase } = require("../../src/lib/database");
const timeHelper = require("../../src/lib/timeHelper");

const pluginConfig = {
  name: "perpanjangsewa",
  alias: ["renewsewa", "extends ewa"],
  category: "owner",
  description: "Memperpanjang masa sewa bot di grup",
  usage: ".perpanjangsewa <link grup> <durasi>",
  example: ".perpanjangsewa https://chat.whatsapp.com/xxx 7d",
  isOwner: true,
  cooldown: 5,
  isEnabled: true,
};

function parseDuration(str) {
  const match = str.match(/^(\d+)([dDmMyYhH])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  let ms = 0;

  switch (unit) {
    case "h":
      ms = value * 60 * 60 * 1000;
      break;
    case "d":
      ms = value * 24 * 60 * 60 * 1000;
      break;
    case "m":
      ms = value * 30 * 24 * 60 * 60 * 1000;
      break;
    case "y":
      ms = value * 365 * 24 * 60 * 60 * 1000;
      break;
  }

  return ms;
}

function formatDuration(str) {
  const match = str.match(/^(\d+)([dDmMyYhH])$/);
  if (!match) return str;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const units = {
    h: "Jam",
    d: "Hari",
    m: "Bulan",
    y: "Tahun",
  };

  return `${value} ${units[unit]}`;
}

async function handler(m, { sock }) {

  const db = getDatabase();
  const args = m.args;

  if (!db.db.data.sewa) {
    db.db.data.sewa = { groups: {} };
  }

  if (args.length < 2) {
    return m.reply(
`🌸 *ZERO TWO SEWA SYSTEM*

╭─❍
│ Format :
│ .perpanjangsewa <link> <durasi>
│
│ Contoh :
│ .perpanjangsewa https://chat.whatsapp.com/xxx 7d
│
│ Durasi :
│ 7d = 7 Hari
│ 1m = 1 Bulan
│ 1y = 1 Tahun
╰─❍`
    );
  }

  const link = args[0];
  const durationStr = args[1];

  if (!link.includes("chat.whatsapp.com/")) {
    return m.reply(`❌ Link grup tidak valid darling...`);
  }

  const durationMs = parseDuration(durationStr);

  if (!durationMs) {
    return m.reply(`❌ Format durasi salah\nContoh : 7d / 1m / 1y`);
  }

  try {

    const inviteCode = link.split("chat.whatsapp.com/")[1].split(/[?\s]/)[0];
    const metadata = await sock.groupGetInviteInfo(inviteCode);

    const groupId = metadata.id;
    const groupName = metadata.subject || "Unknown Group";

    const groupData = db.db.data.sewa.groups[groupId];

    if (!groupData) {
      return m.reply(`❌ Grup ini tidak ada dalam daftar sewa bot.`);
    }

    const now = Date.now();

    if (groupData.expiredAt < now) {
      groupData.expiredAt = now + durationMs;
    } else {
      groupData.expiredAt += durationMs;
    }

    db.db.write();

    const expiredStr = timeHelper.fromTimestamp(
      groupData.expiredAt,
      "D MMMM YYYY HH:mm"
    );

    const durationNice = formatDuration(durationStr);

    m.react("✅");

    /* ====================== */
    /* KIRIM PESAN KE OWNER */
    /* ====================== */

    await m.reply(
`🌸 *SEWA BERHASIL DIPERPANJANG*

╭─❍ 「 DETAIL SEWA 」
│ 🏷️ Grup :
│ ${groupName}
│
│ ⏳ Tambahan :
│ ${durationNice}
│
│ 📅 Expired Baru :
│ ${expiredStr}
╰─❍

Zero Two masih akan tinggal disini ya darling 💕`
    );

    /* ====================== */
    /* PESAN KE GRUP */
    /* ====================== */

    await sock.sendMessage(groupId,{
text:
`🌸 *ZERO TWO NOTICE*

Waahhh~

Owner ku baru saja memperpanjang
masa sewa *NusaBot* di grup ini loh~ 💕

╭─❍
│ ⏳ Tambahan :
│ ${durationNice}
│
│ 📅 Expired Baru :
│ ${expiredStr}
╰─❍

Terima kasih sudah menggunakan
NusaBot darling ✨`
    });

  } catch (error) {

    m.react("❌");

    m.reply(
`❌ *ERROR*

${error.message}`
    );

  }

}

module.exports = {
  config: pluginConfig,
  handler,
};