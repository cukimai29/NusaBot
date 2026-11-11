const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'fmeme',
    alias: ['polisimeme', 'meme-polisi', 'fmeme'],
    category: 'canvas',
    description: 'Bikin meme surat tilang polisi',
    usage: '.fmeme <username>|<teks>|<wm>',
    example: '.fmeme Rin|Katanya just friend kok manggil sayang',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 2,
    isEnabled: true
};

const BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/IMG-20260710-WA1772.jpg';
const ASSETS_DIR = join(process.cwd(), 'assets', 'polisimeme');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const BG_LOCAL = join(ASSETS_DIR, 'template_polisi.png');
const TMP_DIR = join(process.cwd(), 'tmp');

const FONT_CONFIGS = [
    {
        url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
        name: 'Inter-Bold.ttf',
        family: 'MemeInterBold'
    }
];

async function uploadUguu(buffer) {
    let form = new FormData();
    form.append('files[]', buffer, 'image.png');

    const { data } = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders(),
        timeout: 30000
    });

    return data.files[0].url;
}

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `👮 *ᴘᴏʟɪsɪ ᴍᴇᴍᴇ*\n\n` +
            `📌 Format: ${m.prefix}fmeme <username>|<teks>|<wm>\n` +
            `📝 Contoh: ${m.prefix}fmeme Rin|Katanya just friend kok manggil sayang|RzkyADS\n\n` +
            `💡 WM optional, default © RzkyADS`
        );
    }

    const parts = text.split('|');
    const userPayload = parts[0]?.trim();
    const textPayload = parts[1]?.trim();
    const wm = parts[2]?.trim() || 'RzkyADS';

    if (!userPayload || !textPayload) {
        return m.reply(
            `❌ *Format salah!*\n\n` +
            `Pastikan pakai pemisah "|"\n` +
            `📝 Contoh: ${m.prefix}fmeme Rin|Katanya just friend kok manggil sayang`
        );
    }

    const txtUsername = userPayload.startsWith('~') ? userPayload : `~ ${userPayload}`;
    const txtMeme = textPayload;

    m.react('⏳');

    try {
        await mkdir(FONTS_DIR, { recursive: true });
        await mkdir(TMP_DIR, { recursive: true });

        for (const f of FONT_CONFIGS) {
            const fPath = join(FONTS_DIR, f.name);
            if (!existsSync(fPath)) {
                const fRes = await axios.get(f.url, {
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 15000
                });
                await writeFile(fPath, Buffer.from(fRes.data));
            }
            GlobalFonts.registerFromPath(fPath, f.family);
        }

        if (!existsSync(BG_LOCAL)) {
            const res = await axios.get(BG_URL, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 15000
            });
            await writeFile(BG_LOCAL, Buffer.from(res.data));
        }

        const bgImg = await loadImage(BG_LOCAL);
        const canvas = createCanvas(bgImg.width, bgImg.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        const paperX = 404;
        const paperY = 324;
        const paperW = 53;
        const paperH = 120;

        let fontSize = 23;
        let lineHeight = 31;

        const senderSize = 15;
        const senderOffset = 0;

        const words = txtMeme.split(/\s+/);
        const lines = [];
        for (let i = 0; i < words.length; i += 2) {
            const pair = words.slice(i, i + 2).join(' ');
            if (pair) lines.push(pair);
        }

        const safetyMargin = senderSize + senderOffset + 10;
        const maxTextHeight = paperH - safetyMargin;

        while (fontSize > 8) {
            const totalHeight = lines.length * lineHeight;
            if (totalHeight <= maxTextHeight) break;
            fontSize -= 1;
            lineHeight -= 1.2;
        }

        const centerX = paperX + (paperW / 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#262626';
        ctx.font = `bold ${senderSize}px MemeInterBold`;
        ctx.fillText(txtUsername, centerX, paperY + paperH - senderOffset);

        const totalTextHeight = lines.length * lineHeight;
        let startY = paperY + ((maxTextHeight - totalTextHeight) / 2);
        if (startY < paperY) startY = paperY;

        ctx.textBaseline = 'top';
        ctx.font = `bold ${fontSize}px MemeInterBold`;

        lines.forEach((line, index) => {
            const currentY = startY + (index * lineHeight);
            if (currentY + fontSize <= paperY + maxTextHeight) {
                ctx.fillText(line, centerX, currentY);
            }
        });

        ctx.fillStyle = 'rgba(38, 38, 38, 0.4)';
        ctx.font = 'bold 20px MemeInterBold';
        ctx.textAlign = 'right';
        ctx.fillText(`© ${wm}`, canvas.width - 15, canvas.height - 15);

        const canvasBuffer = await canvas.encode('png');
        const url = await uploadUguu(canvasBuffer);

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url },
            caption: `👮 *Polisi Meme*\n\n👤 ${txtUsername}\n💬 ${txtMeme}\n\n> © ${wm}`,
            footer: `© ${wm}`
        }, { quoted: m });

    } catch (err) {
        console.error('[FMEME] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};