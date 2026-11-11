const config = require("../../config");
const path = require("path");
const fs = require("fs");
const timeHelper = require("../../src/lib/timeHelper");
const { createCanvas, GlobalFonts, loadImage: canvasLoadImage } = require("@napi-rs/canvas"); // 🔥 RENAME CANVAS LOADER
const { loadImage } = require("../../src/lib/assetLoader"); // 🔥 IMPORT HELPER ASSET

const pluginConfig = {
  name: "nulis",
  alias: ["tulis", "write"],
  category: "tools",
  description: "Generate tulisan tangan di kertas",
  usage: ".nulis <teks>",
  example: ".nulis Aku cinta kamu selamanya",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const fontPath = path.join(process.cwd(), "assets", "fonts", "Zahraaa.ttf");
if (fs.existsSync(fontPath)) {
  try {
    GlobalFonts.registerFromPath(fontPath, "Zahraaa");
  } catch (e) {}
}

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = "📝 *ɴᴜʟɪs*", body = "Tulisan tangan") {
  const saluranId = config.saluran?.id || "120363402057133599@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "NusaBot";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  // 🔥 FIX: Ambil gambar thumbnail dari URL
  try {
    const thumbTools = await loadImage('zerotwo-games.jpg');
    if (thumbTools) {
      contextInfo.externalAdReply = {
        title: title,
        body: body,
        thumbnail: thumbTools,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: config.saluran?.link || "",
      };
    }
  } catch (e) {}

  return contextInfo;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

async function handler(m, { sock }) {
  const text = m.args?.join(" ");

  if (!text) {
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> \`${m.prefix}nulis <teks>\`\n\n` +
        `> Contoh:\n` +
        `> \`${m.prefix}nulis Aku cinta kamu selamanya\``,
    );
  }

  if (text.length > 500) {
    return m.reply(`❌ *ᴛᴇᴋs ᴛᴇʀʟᴀʟᴜ ᴘᴀɴᴊᴀɴɢ*\n\n> Maksimal 500 karakter`);
  }

  // 🔥 BALIKIN KE LOKAL (Ringan & Cepat)
  const inputPath = path.join(process.cwd(), "assets", "kertas", "magernulis1.jpg");

  if (!fs.existsSync(inputPath)) {
    return m.reply(
      `❌ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n> File \`assets/kertas/magernulis1.jpg\` tidak ditemukan`,
    );
  }

  await m.react("⏳");
  await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Membuat tulisan tangan...`);

  try {
    // 🔥 Load gambar kertas dari lokal
    const bgImage = await canvasLoadImage(inputPath);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0);

    const tgl = timeHelper.formatDate("DD/MM/YYYY");
    const hari = timeHelper.formatFull("dddd");

    ctx.font = "20px Zahraaa, Arial";
    ctx.fillStyle = "#1a1a2e";

    ctx.fillText(hari, 806, 78);

    ctx.font = "18px Zahraaa, Arial";
    ctx.fillText(tgl, 806, 102);

    ctx.font = "20px Zahraaa, Arial";
    const maxWidth = 600;
    const lineHeight = 28;
    const startX = 344;
    const startY = 142;

    const lines = wrapText(ctx, text, maxWidth);

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer("image/jpeg");

    await m.react("✅");
    
    // 🔥 FIX: await getContextInfo
    const contextInfo = await getContextInfo();

    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `✅ *ᴛᴜʟɪsᴀɴ ᴛᴀɴɢᴀɴ*\n\n> Hatihati ketahuan! 📖`,
        contextInfo: contextInfo,
      },
      { quoted: m },
    );
  } catch (error) {
    await m.react("❌");
    await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};