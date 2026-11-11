const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'drake-meme',
    alias: ['drake', 'drakememe', 'hotlinebling'],
    category: 'canvas',
    description: 'Bikin meme Drake Hotline Bling',
    usage: '.drake-meme <teks1>|<teks2>',
    example: '.drake-meme Femboy|Tomboy',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const FONTS = [
    {
        family: 'ARIAL',
        url: 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/arial.ttf',
        localName: 'arial.ttf'
    }
];

const BG_URL = 'https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg';
const CANVAS_SIZE = { width: 1200, height: 1200 };

const ASSETS_DIR = join(process.cwd(), 'assets', 'meme');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const TMP_DIR = join(process.cwd(), 'tmp');

async function download(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000
    });
    return Buffer.from(res.data);
}

async function prepareAssets() {
    await mkdir(FONTS_DIR, { recursive: true });

    for (const font of FONTS) {
        const fontLocal = join(FONTS_DIR, font.localName);
        if (!existsSync(fontLocal)) {
            await writeFile(fontLocal, await download(font.url));
        }
        GlobalFonts.registerFromPath(fontLocal, font.family);
    }

    const bgLocal = join(ASSETS_DIR, 'Drake-Hotline-Bling.jpg');
    if (!existsSync(bgLocal)) {
        await writeFile(bgLocal, await download(BG_URL));
    }
    return bgLocal;
}

function drawTextInSafeZone(ctx, text, zone, initialFontSize, fontFamily) {
    let fontSize = initialFontSize;
    let lh = fontSize * 1.2;
    let out = [];
    let minSize = 10;

    while (fontSize >= minSize) {
        ctx.font = `400 ${fontSize}px ${fontFamily}`;
        lh = fontSize * 1.2;
        out = [];
        let fitsWidth = true;

        text.split('\n').forEach(p => {
            let cur = '';
            p.split(' ').forEach(w => {
                const t = cur ? cur + ' ' + w : w;
                if (ctx.measureText(t).width > zone.w && cur) {
                    out.push(cur);
                    cur = w;
                } else {
                    cur = t;
                }
            });
            out.push(cur);
        });

        for (const line of out) {
            if (ctx.measureText(line).width > zone.w) {
                fitsWidth = false;
                break;
            }
        }

        if (fitsWidth && (out.length * lh) <= zone.h) break;
        fontSize -= 2;
    }

    if (fontSize < minSize) {
        fontSize = minSize;
        ctx.font = `400 ${fontSize}px ${fontFamily}`;
        lh = fontSize * 1.2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    ctx.clip();

    const startY = zone.y + zone.h / 2 - (out.length * lh) / 2 + lh / 2;
    out.forEach((l, i) => {
        ctx.fillText(l, zone.x + zone.w / 2, startY + i * lh);
    });
    ctx.restore();
}

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `🦉 *ᴅʀᴀᴋᴇ ᴍᴇᴍᴇ*\n\n` +
            `📌 Format: ${m.prefix}drake-meme <teks1>|<teks2>\n` +
            `📝 Contoh: ${m.prefix}drake-meme Femboy|Tomboy\n\n` +
            `💡 Teks1 = atas (Drake nolak)\n` +
            `💡 Teks2 = bawah (Drake setuju)`
        );
    }

    const parts = text.split('|');
    const teks1 = parts[0]?.trim() || '...';
    const teks2 = parts[1]?.trim() || '...';

    m.react('⏳');

    try {
        const bgLocal = await prepareAssets();

        const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
        const ctx = canvas.getContext('2d');

        const bgImg = await loadImage(bgLocal);
        ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

        ctx.save();
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        drawTextInSafeZone(ctx, teks1, { x: 615, y: 22, w: 571, h: 564 }, 110, 'ARIAL, sans-serif');
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        drawTextInSafeZone(ctx, teks2, { x: 615, y: 623, w: 571, h: 561 }, 110, 'ARIAL, sans-serif');
        ctx.restore();

        ctx.fillStyle = 'rgba(17, 17, 17, 0.3)';
        ctx.font = '24px ARIAL, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('© RzkyADS', CANVAS_SIZE.width - 15, CANVAS_SIZE.height - 15);

        await mkdir(TMP_DIR, { recursive: true });
        const outPath = join(TMP_DIR, `drake-${Date.now()}.png`);
        await writeFile(outPath, await canvas.encode('png'));

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url: outPath },
            caption: `🦉 *Drake Meme*\n\n❌ ${teks1}\n✅ ${teks2}\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        setTimeout(async () => {
            try { if (existsSync(outPath)) await unlink(outPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[Drake] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};