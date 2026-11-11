const axios = require('axios');
const ytdl = require('../../src/scraper/ytdl.js');
const config = require('../../config');

const pluginConfig = {
    name: 'ytmp4',
    alias: ['youtubemp4', 'ytvideo', 'ytv'],
    category: 'download',
    description: 'Download video YouTube',
    usage: '.ytmp4 <url>',
    example: '.ytmp4 https://youtube.com/watch?v=xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 2,
    isEnabled: true
};

async function getVideoDownloadUrl(url) {
    try {
        const { data } = await axios.get(
            `https://firefly.maiku.my.id/api/ytdown?apikey=${config.APIkey.firefly}&url=${encodeURIComponent(url)}`
        );

        if (data?.status && data?.data?.mediaItems) {
            const mediaItems = data.data.mediaItems;
            const video = mediaItems.find(m => m.type === "Video" && m.mediaQuality === "HD") ||
                mediaItems.find(m => m.type === "Video" && m.mediaQuality === "SD") ||
                mediaItems.find(m => m.type === "Video");

            if (video && video.mediaUrl) {
                let attempts = 0;
                while (attempts < 10) {
                    const { data: fileData } = await axios.get(video.mediaUrl);
                    if (fileData?.status === "completed" && fileData?.fileUrl) {
                        return fileData.fileUrl;
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    attempts++;
                }
                throw new Error("Timeout processing video");
            }
        }
    } catch {}

    const fallback = await ytdl(url, "mp4");
    if (fallback?.status && fallback?.dl) {
        return fallback.dl;
    }

    throw new Error(fallback?.mess || "Gagal mendapatkan video download URL");
}

async function handler(m, { sock, db }) {
    const url = m.text?.trim();

    if (!url) {
        return m.reply(
            `🎬 *ʏᴛ ᴍᴘ4*\n\n` +
            `📌 *Cara Pakai:* ${m.prefix}ytmp4 <url>\n` +
            `📝 *Contoh:* ${m.prefix}ytmp4 https://youtube.com/watch?v=xxx`
        );
    }

    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        return m.reply("❌ URL harus YouTube darling~");
    }

    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 2;

    if (!m.isOwner && !m.isPremium && (user?.energi ?? 25) < energyCost) {
        return m.reply(`❌ *Energi tidak cukup!*\n> Butuh ${energyCost} energi, energimu: ${user?.energi ?? 25}`);
    }

    m.react('⏳');

    try {
        const downloadUrl = await getVideoDownloadUrl(url);

        await sock.sendMedia(m.chat, downloadUrl, null, m, {
            type: "video",
        });

        if (!m.isOwner && !m.isPremium) {
            db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
        }

        m.react('✅');

    } catch (err) {
        console.error('[YTMP4] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal mengunduh video!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};