const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'berita',
    alias: ['news', 'kompas', 'headline'],
    category: 'tools',
    description: 'Generate gambar berita ala Kompas dengan headline & foto',
    usage: '.berita <teks berita> (reply foto) atau .berita <teks berita>',
    example: '.berita Breaking News: Indonesia Juara Umum Sea Games 2026!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

const NEWS_BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/Fberita.png';
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2';
const PHOTO_SOURCE = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/jpg';

const ASSETS_DIR = join(process.cwd(), 'assets', 'newsrin');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const BG_LOCAL = join(ASSETS_DIR, 'berita.png');
const FONT_LOCAL = join(FONTS_DIR, 'Inter-Bold.ttf');

const BG_W = 962;
const BG_H = 1634;

const beritaConfig = {
    text: {
        x: 30,
        y: 277,
        maxWidth: 1010,
    },
    foto: {
        a: 1025,
        b: 1634,
        c: 0,
        d: 962,
        radius: 0,
    },
    debug: false,
};

function isUrl(src) {
    return /^https?:\/\//i.test(src);
}

async function download(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5,
        timeout: 30000,
    });
    return Buffer.from(res.data);
}

async function setup() {
    await mkdir(FONTS_DIR, { recursive: true });

    if (!existsSync(BG_LOCAL)) {
        await writeFile(BG_LOCAL, await download(NEWS_BG_URL));
    }

    if (!existsSync(FONT_LOCAL)) {
        await writeFile(FONT_LOCAL, await download(FONT_URL));
    }

    GlobalFonts.registerFromPath(FONT_LOCAL, 'InterNews');
}

function wordWrap(text, ctx, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (let i = 0; i < words.length; i++) {
        const test = current + words[i] + ' ';
        if (ctx.measureText(test.trim()).width > maxWidth && i > 0) {
            lines.push(current.trim());
            current = words[i] + ' ';
        } else {
            current = test;
        }
    }
    if (current) lines.push(current.trim());
    return lines;
}

function roundedClipPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

async function drawFoto(ctx, imagePath, zone) {
    const { a, b, c, d, radius } = zone;
    const x = c;
    const y = a;
    const w = d - c;
    const h = b - a;
    const r = radius ?? 0;

    const img = await loadImage(imagePath);
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;

    ctx.save();
    roundedClipPath(ctx, x, y, w, h, r);
    ctx.clip();

    ctx.filter = 'blur(28px)';
    ctx.drawImage(img, x - 40, y - 40, w + 80, h + 80);
    ctx.filter = 'none';

    let fw, fh;
    if (imgRatio > boxRatio) {
        fw = w;
        fh = fw / imgRatio;
    } else {
        fh = h;
        fw = fh * imgRatio;
    }

    ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
    ctx.restore();
}

async function handler(m, { sock, text, prefix, db }) {
    if (!text) {
        return m.reply(
            `❌ *Cara Penggunaan:*\n\n` +
            `> *${prefix}berita <teks berita>* — Generate berita dengan foto default\n` +
            `> *${prefix}berita <teks berita>* (reply foto) — Generate berita dengan foto custom\n\n` +
            `📌 *Contoh:*\n` +
            `> ${prefix}berita Breaking News: Indonesia Juara Umum!\n` +
            `> ${prefix}berita Headline hari ini... (reply foto)`
        );
    }

    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 2;

    if (!m.isOwner && !m.isPremium) {
        const currentEnergy = user?.energi ?? 25;
        if (currentEnergy < energyCost) {
            return m.reply(
                `❌ *Energi tidak cukup!*\n\n` +
                `> Butuh *${energyCost} energi*\n` +
                `> Energimu: *${currentEnergy}*\n` +
                `> Ketik *${prefix}buyenergi* atau tunggu besok ya Darling~`
            );
        }
    }

    m.react('⏳');

    try {
        await setup();

        const newsText = text.replace(/\s+/g, ' ').trim();
        const { x, y, maxWidth } = beritaConfig.text;

        let photoBuffer;
        if (m.quoted?.image) {
            photoBuffer = await m.quoted.download();
        } else {
            photoBuffer = await download(PHOTO_SOURCE);
        }

        const canvas = createCanvas(BG_W, BG_H);
        const ctx = canvas.getContext('2d');
        const bgImg = await loadImage(BG_LOCAL);
        ctx.drawImage(bgImg, 0, 0, BG_W, BG_H);

        await drawFoto(ctx, photoBuffer, beritaConfig.foto);

        const words = newsText.split(' ');
        const fontSize = words.length <= 18 ? 76 : 56;
        const lineGap = words.length <= 18 ? 12 : 18;
        const lineHeight = fontSize + lineGap;

        ctx.font = `700 ${fontSize}px InterNews`;
        ctx.fillStyle = '#eaf2f8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let lines = wordWrap(newsText, ctx, maxWidth);
        if (lines.length > 6) {
            lines = lines.slice(0, 5);
            lines.push('...');
        }

        ctx.save();
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
        ctx.restore();

        const tmpDir = join(process.cwd(), 'tmp');
        await mkdir(tmpDir, { recursive: true });
        const outputPath = join(tmpDir, `berita-${Date.now()}.png`);
        await writeFile(outputPath, await canvas.encode('png'));

        if (!m.isOwner && !m.isPremium) {
            db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
        }

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url: outputPath },
            caption: `📰 *Breaking News!*\n\n${newsText}\n\n> © ${config.bot?.name || 'Bot'} | News Generator`,
            footer: `© ${config.bot?.name || 'Bot'} | Kompas Style`
        }, { quoted: m });

        setTimeout(async () => {
            try { if (existsSync(outputPath)) await unlink(outputPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[Berita] Error:', err.message);
        m.react('❌');
        return m.reply(
            `❌ *Gagal generate berita!*\n\n` +
            `> Error: ${err.message}\n\n` +
            `> Coba lagi nanti ya Darling~`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};