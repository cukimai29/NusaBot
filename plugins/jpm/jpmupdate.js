const { getDatabase } = require("../../src/lib/database");
const timeHelper = require("../../src/lib/timeHelper");
const { fetchGroupsSafe } = require("../../src/lib/jpmHelper");
const config = require("../../config");
const { loadImage } = require("../../src/lib/assetLoader"); // 🔥 IMPORT HELPER
const fs = require("fs");

// 🔥 HAPUS TOP-LEVEL cachedThumb

const pluginConfig = {
  name: "jpmupdate",
  alias: ["updatejpm", "broadcastupdate", "shareupdate"],
  category: "jpm",
  description: "Kirim update/changelog ke semua grup",
  usage: ".jpmupdate <versi> | <changelog>",
  example: ".jpmupdate v2.0 | Fitur baru:\\n- Quiz Battle\\n- Confession",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();

  if (global.statusjpm) {
    return m.reply(
      `❌ *ɢᴀɢᴀʟ*\n\n> JPM sedang berjalan. Ketik \`${m.prefix}stopjpm\` untuk menghentikan.`,
    );
  }

  let input = m.fullArgs?.trim() || m.text?.trim();

  if (!input) {
    return m.reply(
      `📢 *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ*\n\n` +
        `> Kirim info update ke semua grup\n\n` +
        `╭┈┈⬡「 📋 *ғᴏʀᴍᴀᴛ* 」\n` +
        `┃ .jpmupdate <versi> | <changelog>\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `*Contoh:*\n` +
        `> .jpmupdate v2.5 | ✨ Fitur Baru:\\n- Quiz Battle\\n- Confession\\n- Birthday System\n\n` +
        `> *Note:* Gunakan \\n untuk line break`,
    );
  }

  input = input.replace(/\\n/g, "\n");

  let version = config.bot?.version || "v1.0";
  let changelog = input;

  if (input.includes("|")) {
    const parts = input.split("|");
    version = parts[0].trim();
    changelog = parts.slice(1).join("|").trim();
  }

  if (!changelog) {
    return m.reply(`❌ Changelog tidak boleh kosong!`);
  }

  await m.react("📢");

  try {
    const allGroups = await fetchGroupsSafe(sock);
    let groupIds = Object.keys(allGroups);

    const blacklist = db.setting("jpmBlacklist") || [];
    const blacklistedCount = groupIds.filter((id) =>
      blacklist.includes(id),
    ).length;
    groupIds = groupIds.filter((id) => !blacklist.includes(id));

    if (groupIds.length === 0) {
      await m.react("❌");
      return m.reply(
        `❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada grup yang ditemukan${blacklistedCount > 0 ? ` (${blacklistedCount} grup di-blacklist)` : ""}`,
      );
    }

    const jedaJpm = db.setting("jedaJpm") || 5000;
    const botName = config.bot?.name || "NusaBot";
    const saluranId = config.saluran?.id || "120363402057133599@newsletter";
    const saluranName = config.saluran?.name || botName;

    const dateStr = timeHelper.formatDate("DD MMMM YYYY");

    const updateMessage =
      `╭━━━━━━━━━━━━━━━━━╮\n` +
      `┃  🚀 *ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ ${version}*\n` +
      `╰━━━━━━━━━━━━━━━━━╯\n\n` +
      `📅 *${dateStr}*\n\n` +
      `╭┈┈⬡「 📝 *ᴄʜᴀɴɢᴇʟᴏɢ* 」\n` +
      `${changelog
        .split("\n")
        .map((line) => `┃ ${line}`)
        .join("\n")}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> 💡 Ketik *.menu* untuk melihat fitur\n` +
      `> 📢 Update dari *${botName}*`;

    await m.reply(
      `📢 *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🏷️ ᴠᴇʀsɪ: \`${version}\`\n` +
        `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` grup\n` +
        `┃ ⏱️ ᴊᴇᴅᴀ: \`${jedaJpm}ms\`\n` +
        `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((groupIds.length * jedaJpm) / 60000)} menit\`\n` +
        `╰┈┈⬡\n\n` +
        `> Memulai broadcast update...`,
    );

    global.statusjpm = true;
    let successCount = 0;
    let failedCount = 0;

    // 🔥 FIX: Ambil gambar dari URL
    const thumbBuffer = await loadImage('zerotwo.jpg');

    for (const groupId of groupIds) {
      if (global.stopjpm) {
        delete global.stopjpm;
        delete global.statusjpm;

        await m.reply(
          `⏹️ *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
            `> ✅ Berhasil: \`${successCount}\`\n` +
            `> ❌ Gagal: \`${failedCount}\`\n` +
            `> ⏸️ Sisa: \`${groupIds.length - successCount - failedCount}\``,
        );
        return;
      }

      try {
        await sock.sendMessage(groupId, {
          text: updateMessage,
          contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: saluranId,
              newsletterName: saluranName,
              serverMessageId: 127,
            },
            externalAdReply: thumbBuffer
              ? {
                  title: botName,
                  body: "Update Nichh",
                  thumbnail: thumbBuffer,
                  sourceUrl: config.saluran?.link || "",
                  mediaType: 1,
                  renderLargerThumbnail: true,
                }
              : undefined,
          },
        });
        successCount++;
      } catch {
        failedCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, jedaJpm));
    }

    global.statusjpm = false;
    global.stopjpm = false;

    await m.react("✅");
    await m.reply(
      `✅ *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ!*\n\n` +
        `╭┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
        `┃ ✅ Sukses: ${successCount}\n` +
        `┃ ❌ Gagal: ${failedCount}\n` +
        `┃ 📊 Total: ${groupIds.length}\n` +
        `╰┈┈┈┈┈┈┈┈⬡`,
    );
  } catch (error) {
    global.statusjpm = false;
    global.stopjpm = false;
    await m.react("❌");
    await m.reply(`❌ Error: ${error.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};