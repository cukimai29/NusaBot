const ttdown = require('../../src/scraper/tiktok');
const config = require('../../config');
const { loadImage } = require('../../src/lib/assetLoader'); // 🔥 IMPORT HELPER
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');
const path = require('path');
const fs = require('fs');

const pluginConfig = {
    name: ['ttmp3'],
    alias: ['ttmusic', 'tiktokmusic'],
    category: 'download',
    description: 'Download audio TikTok (MP3)',
    usage: '.ttmp3 <url>',
    example: '.ttmp3 https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock, config: botConfig }) {
    const url = m.text?.trim();

    if (!url) {
        return m.reply(
            `💕 *ᴛᴛ ᴍᴘ3* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃   ${m.prefix}ttmp3 <url>\n` +
            `┃ ✦ *Contoh*\n` +
            `┃   ${m.prefix}ttmp3 https://vt.tiktok.com/xxx\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        );
    }

    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(`💔 *ᴇʀʀᴏʀ*\n\n> URL tidak valid darling~ 🥺`);
    }

    m.react('💕');

    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot';

    // 🔥 FIX: Ambil gambar dari URL
    let mediaAttachment = null;
    try {
        const imageBuffer = await loadImage('respon-bot-zerotwo.jpg');
        if (imageBuffer) {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            );
        }
    } catch (e) {
        console.log('[TTMP3] Gagal upload gambar:', e.message);
    }

    try {
        const result = await ttdown(url);
        const audioData = result.downloads.find(d => d.type == 'mp3');

        if (!audioData) {
            m.react('💔');
            return m.reply(`💔 *ɢᴀɢᴀʟ*\n\n> Audio tidak ditemukan darling~ 🥺`);
        }

        // PESAN 1: KIRIM AUDIO
        await sock.sendMessage(m.chat, {
            audio: { url: audioData.url },
            mimetype: 'audio/mpeg',
            fileName: `TikTok_Audio_${Date.now()}.mp3`,
            ptt: false
        }, { quoted: m });

        m.react('✅');

        // PESAN 2: INTERACTIVE MESSAGE SUKSES
        const interactiveMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `✅ ᴅᴏᴡɴʟᴏᴀᴅ ʙᴇʀʜᴀꜱɪʟ`,
                            hasMediaAttachment: !!mediaAttachment,
                            ...(mediaAttachment || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: `🎵 *Audio TikTok berhasil di download!*\n\n💗 *Zero Two:* Nih audio-nya darling~ 😘💕`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© RzkyADS | ${new Date().getFullYear()}`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎵 Download Lagi',
                                        id: '.ttmp3'
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '📋 Menu',
                                        id: '.menu'
                                    })
                                }
                            ]
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 143
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });

    } catch (err) {
        console.error('[TTMP3] Error:', err);
        m.react('💔');
        return m.reply(`💔 *ɢᴀɢᴀʟ*\n\n> ${err.message}\n\n> Coba lagi ya darling~ 🥺`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};