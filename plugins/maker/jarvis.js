const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'jarvis',
    alias: ['jarvisai', 'zerotwo', 'zerotwoai', 'darling'],
    category: 'maker',
    description: 'Generates a custom NusaBot / Darling Caption Meme',
    usage: '.jarvis <teks>',
    example: '.jarvis Halo Darling, ada yang bisa Zero Two bantu hari ini?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const BG_URL = "https://litter.catbox.moe/ywad11.jpeg";
const FONT_URL = "https://cdn.jsdelivr.net/gh/adrienverge/copr-some-nice-fonts@master/ArialBd.ttf";
const CANVAS_SIZE = { width: 735, height: 678 };
const ASSETS_DIR = join(process.cwd(), 'assets', 'zerotwoai');

let fontRegistered = false;

async function downloadAsset(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
    });
    return Buffer.from(response.data);
}

async function prepareAssets() {
    await mkdir(ASSETS_DIR, { recursive: true });

    const bgLocal = join(ASSETS_DIR, 'zerotwo.jpg');
    if (!existsSync(bgLocal)) {
        await writeFile(bgLocal, await downloadAsset(BG_URL));
    }

    const fontLocal = join(ASSETS_DIR, 'ArialBd.ttf');
    if (!existsSync(fontLocal)) {
        await writeFile(fontLocal, await downloadAsset(FONT_URL));
    }

    if (!fontRegistered) {
        try {
            GlobalFonts.registerFromPath(fontLocal, 'ARIALBD');
        } catch (e) {}
        fontRegistered = true;
    }

    return bgLocal;
}

function drawTextInSafeZone(ctx, text, zone, initialFontSize, align) {
    let fontSize = initialFontSize;
    let lines = [];
    let lh = fontSize * 1.2;

    while (fontSize > 10) {
        lh = fontSize * 1.2;
        ctx.font = `500 ${fontSize}px ARIALBD, sans-serif`;
        lines = [];
        let fits = true;

        const paragraphs = text.split('\n');
        for (const p of paragraphs) {
            let cur = '';
            const words = p.split(' ');

            for (const w of words) {
                const t = cur ? cur + ' ' + w : w;
                if (ctx.measureText(t).width > zone.w) {
                    if (cur) {
                        lines.push(cur);
                        cur = w;
                        if (ctx.measureText(w).width > zone.w) {
                            fits = false;
                            break;
                        }
                    } else {
                        fits = false;
                        break;
                    }
                } else {
                    cur = t;
                }
            }
            if (!fits) break;
            if (cur) lines.push(cur);
        }

        if (fits && (lines.length * lh) <= zone.h) {
            break;
        }

        fontSize -= 2;
    }

    ctx.font = `500 ${fontSize}px ARIALBD, sans-serif`;
    ctx.fillStyle = '#111111';
    ctx.textBaseline = 'middle';
    ctx.textAlign = align;

    const drawX = align === 'center' ? zone.x + zone.w / 2 : align === 'right' ? zone.x + zone.w : zone.x;

    ctx.save();
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    ctx.clip();

    const startY = zone.y + zone.h / 2 - (lines.length * lh) / 2 + lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, drawX, startY + i * lh));
    ctx.restore();
}

async function handler(m, { sock }) {
    const text = m.text || '';
    const prefix = m.prefix || '.';
    const command = m.command || 'jarvis';

    if (!text) {
        return m.reply(`❌ Masukkan teks untuk NusaBot!\n\n*Contoh:* \`${prefix}${command} Halo Darling, apa kabar?\``);
    }

    try {
        await m.react('🌸');

        const bgLocal = await prepareAssets();
        const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

        const bgImg = await loadImage(bgLocal);
        ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

        ctx.save();
        const safeZone_el1 = { x: 20, y: 3, w: 695, h: 237 };
        drawTextInSafeZone(ctx, text, safeZone_el1, 100, 'center');
        ctx.restore();

        const imageBuffer = await canvas.toBuffer('image/png');

        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `🌸 *NusaBot Generator*`
        }, { quoted: m });

        await m.react('✅');

    } catch (err) {
        console.error('[ZeroTwoAI Error]:', err);
        await m.react('❌');
        return m.reply(`⚠️ Gagal merender gambar: ${err.message || err}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};