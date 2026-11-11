const axios = require("axios");
const crypto = require("crypto");
const {
  generateWAMessage,
  generateWAMessageFromContent,
  jidNormalizedUser,
} = require("zerotwo");
const config = require("../../config");

const pluginConfig = {
  name: "ttsearch",
  alias: ["tiktoksearch", "tts", "searchtiktok"],
  category: "search",
  description: "Cari video TikTok",
  usage: ".ttsearch <query>",
  example: ".ttsearch jj epep",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

async function tiktokSearchVideo(query) {
  try {
    const res = await axios.get(
      `https://labs.shannzx.xyz/api/v1/tiktok?query=${encodeURIComponent(query)}`,
      {
        timeout: 30000,
      },
    );

    if (!res.data?.status || !res.data?.result) {
      return null;
    }

    return res.data.result;
  } catch (e) {
    return null;
  }
}

async function handler(m, { sock }) {
  const query = m.args.join(" ")?.trim();

  if (!query) {
    return m.reply(
      `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ* 」
┃
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}ttsearch <query>\`
┃
╰┈┈⬡

> \`Contoh: ${m.prefix}ttsearch anime\``,
    );
  }

  m.react("🔍");

  try {
    const videos = await tiktokSearchVideo(query);

    if (!videos || videos.length === 0) {
      m.react("❌");
      return m.reply(`❌ Tidak ditemukan video untuk: ${query}`);
    }

    const saluranId = config.saluran?.id || "120363402057133599@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "NusaBot";

    const formatDuration = (sec) => {
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      return `${min}:${s.toString().padStart(2, "0")}`;
    };

    const maxShow = Math.min(videos.length, 5);
    const mediaList = videos.slice(0, maxShow).map((video, index) => ({
      video: { url: video.video },
      mimetype: "video/mp4",
      caption: `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ* 」
┃
┃ 🎬 *${video.title?.substring(0, 50) || "No Title"}*
┃
┃ ㊗ ᴜsᴇʀɴᴀᴍᴇ: @${video.author?.unique_id || "-"}
┃ ㊗ ɴɪᴄᴋɴᴀᴍᴇ: ${video.author?.nickname || "-"}
┃ ㊗ ᴅᴜʀᴀsɪ: ${formatDuration(video.duration || 0)}
┃
╰┈┈⬡

╭┈┈⬡「 📊 *sᴛᴀᴛs* 」
┃ 👁️ ᴠɪᴇᴡs: ${video.stats?.plays?.toLocaleString() || 0}
┃ ❤️ ʟɪᴋᴇ: ${video.stats?.likes?.toLocaleString() || 0}
╰┈┈⬡

> Video ${index + 1}/${maxShow}`,
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: saluranId,
          newsletterName: saluranName,
          serverMessageId: 127,
        },
      },
    }));

    try {
      const opener = generateWAMessageFromContent(
        m.chat,
        {
          messageContextInfo: { messageSecret: crypto.randomBytes(32) },
          albumMessage: {
            expectedImageCount: 0,
            expectedVideoCount: mediaList.length,
          },
        },
        {
          userJid: jidNormalizedUser(sock.user.id),
          quoted: m,
          upload: sock.waUploadToServer,
        },
      );

      await sock.relayMessage(opener.key.remoteJid, opener.message, {
        messageId: opener.key.id,
      });

      for (const content of mediaList) {
        const msg = await generateWAMessage(opener.key.remoteJid, content, {
          upload: sock.waUploadToServer,
        });

        msg.message.messageContextInfo = {
          messageSecret: crypto.randomBytes(32),
          messageAssociation: {
            associationType: 1,
            parentMessageKey: opener.key,
          },
        };

        await sock.relayMessage(msg.key.remoteJid, msg.message, {
          messageId: msg.key.id,
        });
      }
    } catch (albumError) {
      for (const content of mediaList) {
        await sock.sendMessage(m.chat, content, { quoted: m });
      }
    }

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
  tiktokSearchVideo,
};
