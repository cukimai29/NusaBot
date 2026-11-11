const axios = require('axios');
const sharp = require('sharp');
const config = require('../../config');

const pluginConfig = {
    name: 'smeme',
    alias: ['memesticker', 'memes', 'stikermeme'],
    category: 'sticker',
    description: 'Membuat sticker meme dari gambar/sticker',
    usage: '.smeme <top>|<bottom> (reply gambar/sticker)',
    example: '.smeme lu|pendek',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const input = m.args.join(' ');

    if (!input || !input.includes('|')) {
        return m.reply(
            `😂 *ᴍᴇᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n` +
            `> Format: teks atas|teks bawah\n\n` +
            `📌 Contoh: ${m.prefix}smeme lu|pendek`
        );
    }

    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage');
const isSticker = m.isSticker || (m.quoted && m.quoted.type === 'stickerMessage');

if (!isImage && !isSticker) {
    return m.reply('❌ Reply gambar atau stiker dulu Darling~');
}

    const [top, bottom] = input.split('|').map((s) => s.trim());

    m.react('⏳');

    try {
        let mediaBuffer;
        if (m.quoted && m.quoted.isMedia) {
    mediaBuffer = await m.quoted.download();
} else if (m.isMedia) {
    mediaBuffer = await m.download();
        }

        if (!mediaBuffer) {
            m.react('❌');
            return m.reply('❌ Gagal mengunduh media');
        }

        try {
            const { createCanvas, loadImage } = require('@napi-rs/canvas');

            const img = await loadImage(mediaBuffer);
            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');

            const scale = Math.max(512 / img.width, 512 / img.height);
            const sw = img.width * scale;
            const sh = img.height * scale;
            ctx.drawImage(img, (512 - sw) / 2, (512 - sh) / 2, sw, sh);

            const drawText = (text, isTop) => {
                if (!text) return;
                let fontSize = 48;
                ctx.font = `bold ${fontSize}px Impact, Arial`;
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 4;
                ctx.textAlign = 'center';

                while (ctx.measureText(text).width > 480 && fontSize > 16) {
                    fontSize -= 2;
                    ctx.font = `bold ${fontSize}px Impact, Arial`;
                }

                const y = isTop ? fontSize + 10 : 512 - 15;
                ctx.strokeText(text.toUpperCase(), 256, y);
                ctx.fillText(text.toUpperCase(), 256, y);
            };

            drawText(top, true);
            drawText(bottom, false);

            const stickerBuffer = await canvas.encode('webp');

            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, { quoted: m });

            m.react('✅');

        } catch (canvasErr) {
            console.log('[SMEME] Canvas fallback:', canvasErr.message);
            
            const base64 = mediaBuffer.toString('base64');
            const apiUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(top || '_')}/${encodeURIComponent(bottom || '_')}.png?background=${encodeURIComponent(`data:image/png;base64,${base64}`)}`;

            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const stickerBuffer = await sharp(response.data)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp()
                .toBuffer();

            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, { quoted: m });

            m.react('✅');
        }

    } catch (err) {
        console.log('[SMEME] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};