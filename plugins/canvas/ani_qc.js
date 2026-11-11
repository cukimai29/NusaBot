// plugins/canvas/ani-qc.js
const axios = require('axios');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'ani-qc',
    alias: ['aniqc', 'animequote', 'quotesanime'],
    category: 'canvas',
    description: 'Bikin gambar quotes ala anime aesthetic',
    usage: '.ani-qc <teks quotes>|<nama>',
    example: '.ani-qc ketika kamu kesepian, carilah dirimu sendiri|Rin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 0,
    isEnabled: true
};

const RIN_BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/IMG-20260703-WA0651.jpg';
const RIN_DIR = join(process.cwd(), 'assets', 'rinchat');
const RIN_BG_LOCAL = join(RIN_DIR, 'quotes-bg.jpg');
const RIN_TMP = join(process.cwd(), 'tmp');

async function handler(m, { sock }) {
    const text = m.args.join(' ');
    
    if (!text) {
        return m.reply(
            `🌸 *ᴀɴɪ-ǫᴄ*\n\n` +
            `📌 Format: *${m.prefix}ani-qc <teks quotes>|<nama>*\n` +
            `📝 Contoh: *${m.prefix}ani-qc ketika kamu kesepian, carilah dirimu sendiri|Rin*\n\n` +
            `💡 Nama bisa dikosongin`
        );
    }

    const [quotesPayload, namaPayload] = text.split('|');
    if (!quotesPayload) {
        return m.reply(`❌ *Format salah!*\n\n📌 Contoh: *${m.prefix}ani-qc Tetap semangat|Rin*`);
    }

    m.react('⏳');

    try {
        const txt = quotesPayload.trim();
        const namaStr = namaPayload ? namaPayload.trim() : '';

        await mkdir(RIN_DIR, { recursive: true });
        await mkdir(RIN_TMP, { recursive: true });

        if (!existsSync(RIN_BG_LOCAL)) {
            const res = await axios.get(RIN_BG_URL, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' },
                maxRedirects: 5,
                timeout: 15000
            });
            await writeFile(RIN_BG_LOCAL, Buffer.from(res.data));
        }

        const canvas = createCanvas(1280, 946);
        const ctx = canvas.getContext('2d');
        const bgImg = await loadImage(RIN_BG_LOCAL);
        ctx.drawImage(bgImg, 0, 0, 1280, 946);

        const textX = 105;
        const maxWidth = 500;
        const fontSize = 54;
        const gapY = 45;
        const colorText = "#004d26";
        const colorNama = "#2e7d32";
        ctx.font = `bold ${fontSize}px sans-serif`;
        const lineHeight = fontSize * 1.3;

        function wrapText(text, maxWidth) {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                let testLine = currentLine + (currentLine ? ' ' : '') + words[i];
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
            return lines;
        }

        const lines = wrapText(txt, maxWidth);
        const availableHeight = 850 - 100;
        const totalTextHeight = lines.length * lineHeight;
        const totalCombinedHeight = totalTextHeight + (namaStr ? (gapY + 34) : 0);

        let autoTextY = 100 + ((availableHeight - totalCombinedHeight) / 2);
        if (autoTextY < 100) autoTextY = 100;

        ctx.fillStyle = colorText;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i].trim(), textX, autoTextY + (i * lineHeight));
        }

        if (namaStr) {
            const autoUsernameY = autoTextY + totalTextHeight + gapY;
            const autoUsernameX = (textX + (maxWidth / 3)) - (maxWidth * 0.03);

            ctx.fillStyle = colorNama;
            ctx.font = `bold 34px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.fillText(`— ${namaStr}`, autoUsernameX, autoUsernameY);
        }

        const watermarkY = 920;
        ctx.fillStyle = 'rgba(46, 125, 50, 0.5)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('© RzkyADS', 640, watermarkY);

        const rinOut = join(RIN_TMP, `quotes-${Date.now()}.png`);
        await writeFile(rinOut, await canvas.encode('png'));

        await sock.sendMessage(m.chat, {
            image: { url: rinOut },
            caption: `🌸 *Anime Quotes*\n\n💬 *${txt}*\n${namaStr ? `👤 — ${namaStr}\n` : ''}\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        m.react('✅');

        setTimeout(async () => {
            try { if (existsSync(rinOut)) await unlink(rinOut); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[Ani-QC] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal buat quotes!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};