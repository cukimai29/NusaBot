const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const axios = require('axios');
const config = require('../../config');

const FONT_QUOTE = {
    family: 'arialn',
    url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/ARIALN.ttf',
    localName: 'ARIALN.ttf'
};

const FONT_USERNAME = {
    family: 'Inter',
    url: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/docs/font-files/Inter-Medium.woff2',
    localName: 'Inter-Medium.woff2'
};

const BACKGROUNDS = {
    'l': {
        name: 'L',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/L.png',
        textZone: { x: 775, y: 56, w: 456, h: 1102 },
        usernameFontSize: 28
    },
    'gojo': {
        name: 'Gojo Satoru',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/gok.png',
        textZone: { x: 755, y: 68, w: 466, h: 1027 },
        usernameFontSize: 28
    },
    'yuji': {
        name: 'Itadori Yuji',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/cc.png',
        textZone: { x: 35, y: 68, w: 466, h: 1027 },
        usernameFontSize: 28
    },
    'denji': {
        name: 'Denji',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/denji.png',
        textZone: { x: 655, y: 68, w: 512, h: 1083 },
        usernameFontSize: 28
    },
    'thorfin': {
        name: 'Thorfinn',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/thorfin.png',
        textZone: { x: 65, y: 54, w: 489, h: 992 },
        usernameFontSize: 28
    },
    'naruto': {
        name: 'Naruto Uzumaki',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/Naruto.png',
        textZone: { x: 40, y: 56, w: 481, h: 1065 },
        usernameFontSize: 28
    },
    'light': {
        name: 'Light Yagami',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/LIghtyagami.png',
        textZone: { x: 38, y: 56, w: 493, h: 941 },
        usernameFontSize: 28
    },
    'higuruma': {
        name: 'Higuruma',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/qca/higuruma.png',
        textZone: { x: 755, y: 68, w: 424, h: 920 },
        usernameFontSize: 28
    },
    'elina': {
        name: 'Elina',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/elina.png',
        textZone: { x: 680, y: 101, w: 505, h: 970 },
        usernameFontSize: 28
    },
    'ayanokoji': {
        name: 'Ayanokoji',
        url: 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/ayanolkoji.png',
        textZone: { x: 62, y: 79, w: 505, h: 879 },
        usernameFontSize: 28
    }
};

const CANVAS_SIZE = { width: 1254, height: 1254 };
const ASSETS_DIR = join(process.cwd(), 'assets', 'quoteanime');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');

const charNames = Object.keys(BACKGROUNDS);
const charAliases = charNames.flatMap(c => [`iqc-${c}`, `qc-${c}`, `quote-${c}`]);

const pluginConfig = {
    name: charNames.map(c => `iqc-${c}`),
    alias: charAliases,
    category: 'canvas',
    description: 'Bikin gambar quotes anime dengan 10 karakter berbeda',
    usage: charNames.map(c => `.iqc-${c} <teks>|<username>`).join('\n'),
    example: '.iqc-ayanokoji Semua manusia hanyalah alat|- Ayanokoji',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

async function download(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000
    });
    return Buffer.from(res.data);
}

async function setup(bgKey) {
    const bg = BACKGROUNDS[bgKey];
    await mkdir(FONTS_DIR, { recursive: true });

    const bgLocal = join(ASSETS_DIR, `${bgKey}.png`);
    if (!existsSync(bgLocal)) {
        await writeFile(bgLocal, await download(bg.url));
    }

    const fontQuoteLocal = join(FONTS_DIR, FONT_QUOTE.localName);
    if (!existsSync(fontQuoteLocal)) {
        await writeFile(fontQuoteLocal, await download(FONT_QUOTE.url));
    }
    GlobalFonts.registerFromPath(fontQuoteLocal, FONT_QUOTE.family);

    const fontUsernameLocal = join(FONTS_DIR, FONT_USERNAME.localName);
    if (!existsSync(fontUsernameLocal)) {
        await writeFile(fontUsernameLocal, await download(FONT_USERNAME.url));
    }
    GlobalFonts.registerFromPath(fontUsernameLocal, FONT_USERNAME.family);

    return bgLocal;
}

function wrapText(ctx, text, maxWidth) {
    const out = [];
    text.split('\n').forEach(p => {
        let cur = '';
        p.split(' ').forEach(w => {
            const t = cur ? cur + ' ' + w : w;
            if (ctx.measureText(t).width > maxWidth && cur) { out.push(cur); cur = w; }
            else cur = t;
        });
        out.push(cur);
    });
    return out;
}

function fitTextInZone(ctx, text, zone, initialSize) {
    const minSize = 24;
    let fontSize = initialSize;
    let lines, lh;

    while (fontSize >= minSize) {
        ctx.font = `400 ${fontSize}px arialn, sans-serif`;
        lines = wrapText(ctx, text, zone.w);
        lh = fontSize * 1.2;
        if (lines.length * lh <= zone.h) break;
        fontSize -= 2;
    }
    return { fontSize, lines, lh };
}

function drawJustifiedLine(ctx, line, x, y, targetWidth) {
    const words = line.split(' ');
    if (words.length === 1) {
        ctx.textAlign = 'center';
        ctx.fillText(line, x + targetWidth / 2, y);
        return;
    }
    const wordWidths = words.map(w => ctx.measureText(w).width);
    const totalWordsWidth = wordWidths.reduce((a, b) => a + b, 0);
    const spaceWidth = (targetWidth - totalWordsWidth) / (words.length - 1);

    ctx.textAlign = 'left';
    let cx = x;
    words.forEach((w, i) => {
        ctx.fillText(w, cx, y);
        cx += wordWidths[i] + spaceWidth;
    });
}

function drawQuoteText(ctx, text, zone) {
    const { fontSize, lines, lh } = fitTextInZone(ctx, text, zone, 75);
    ctx.font = `400 ${fontSize}px arialn, sans-serif`;

    ctx.save();
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    ctx.clip();
    const startY = zone.y + zone.h / 2 - (lines.length * lh) / 2 + lh / 2;

    lines.forEach((l, i) => {
        const y = startY + i * lh;
        const isLastLine = i === lines.length - 1;
        if (isLastLine) {
            ctx.textAlign = 'center';
            ctx.fillText(l, zone.x + zone.w / 2, y);
        } else {
            drawJustifiedLine(ctx, l, zone.x, y, zone.w);
        }
    });
    ctx.restore();

    return startY + (lines.length - 1) * lh + lh / 2;
}

function drawUsernameText(ctx, text, x, y, fontSize, maxWidth) {
    ctx.font = `500 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    const lh = fontSize * 1.2;
    const lines = wrapText(ctx, text, maxWidth);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
}

async function handler(m, { sock }) {
    let cmd = m.command?.toLowerCase();
    
    if (cmd.startsWith('iqc-')) cmd = cmd.replace('iqc-', '');
    else if (cmd.startsWith('qc-')) cmd = cmd.replace('qc-', '');
    else if (cmd.startsWith('quote-')) cmd = cmd.replace('quote-', '');

    const bg = BACKGROUNDS[cmd];

    if (!bg) {
        const list = Object.entries(BACKGROUNDS).map(([k, v]) => `◈ .iqc-${k} — ${v.name}`).join('\n');
        return m.reply(
            `🎨 *ᴀɴɪᴍᴇ ǫᴜᴏᴛᴇs ɢᴇɴ*\n\n` +
            `📋 *List Karakter:*\n${list}\n\n` +
            `📝 *Format:* .iqc-<karakter> <teks>|<username>\n` +
            `📌 *Contoh:* .iqc-ayanokoji Semua manusia hanyalah alat|- Ayanokoji`
        );
    }

    const text = m.args.join(' ');
    if (!text) {
        return m.reply(
            `🎨 *${bg.name} ǫᴜᴏᴛᴇs*\n\n` +
            `📌 Format: ${m.prefix}iqc-${cmd} <teks>|<username>\n` +
            `📝 Contoh: ${m.prefix}iqc-${cmd} Semua manusia hanyalah alat|- ${bg.name}`
        );
    }

    const parts = text.split('|');
    const quoteText = parts[0]?.trim() || '...';
    const username = parts[1]?.trim() || '';

    m.react('⏳');

    try {
        const bgLocal = await setup(cmd);

        const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
        const ctx = canvas.getContext('2d');

        const bgImg = await loadImage(bgLocal);
        ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

        ctx.save();
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        const quoteEndY = drawQuoteText(ctx, quoteText, bg.textZone);
        ctx.restore();

        if (username) {
            ctx.save();
            ctx.fillStyle = '#121212';
            ctx.textBaseline = 'middle';
            const ux = bg.textZone.x + bg.textZone.w / 2;
            const uy = quoteEndY + 40;
            drawUsernameText(ctx, username, ux, uy, bg.usernameFontSize, bg.textZone.w);
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(17, 17, 17, 0.3)';
        ctx.font = '20px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('© RzkyADS', CANVAS_SIZE.width - 20, CANVAS_SIZE.height - 15);

        const tmpDir = join(process.cwd(), 'tmp');
        await mkdir(tmpDir, { recursive: true });
        const outPath = join(tmpDir, `iqc-${cmd}-${Date.now()}.png`);
        await writeFile(outPath, await canvas.encode('png'));

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url: outPath },
            caption: `🎨 *${bg.name} Quotes*\n\n💬 ${quoteText}\n${username ? `👤 ${username}\n` : ''}\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        setTimeout(async () => {
            try { if (existsSync(outPath)) await unlink(outPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[IQC] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};