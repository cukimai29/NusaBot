const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const ASSETS_DIR = join(__dirname, 'assets');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const TEMPLATE_PATH = join(ASSETS_DIR, 'template.png');
const TEMPLATE_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/qyzwa.png';

const FONT_ASSETS = [
    { name: 'PlusJakartaSans-Regular', file: 'PlusJakartaSans-Regular.ttf', url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Regular.ttf', family: 'Plus Jakarta Sans' },
    { name: 'PlusJakartaSans-Medium', file: 'PlusJakartaSans-Medium.ttf', url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Medium.ttf', family: 'Plus Jakarta Sans' },
    { name: 'PlusJakartaSans-Bold', file: 'PlusJakartaSans-Bold.ttf', url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Bold.ttf', family: 'Plus Jakarta Sans' },
    { name: 'FontAwesome-Solid', file: 'fa-solid-900.ttf', url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/fa-solid-900.ttf', family: 'Font Awesome 6 Free' },
    { name: 'NotoColorEmoji', file: 'NotoColorEmoji.ttf', url: 'https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf', family: 'Noto Color Emoji' }
];

const MENU_ICONS = [
    { unicode: '\uf3e5', text: 'Balas', color: '#000000' },
    { unicode: '\uf064', text: 'Teruskan', color: '#000000' },
    { unicode: '\uf0c5', text: 'Salin', color: '#000000' },
    { unicode: '\uf1ab', text: 'Terjemahkan', color: '#000000' },
    { unicode: '\uf2ed', text: 'Hapus untuk saya', color: '#000000' },
    { unicode: '\uf024', text: 'Laporkan', color: '#ea4335' }
];

const config = {
    topPPX: 183, topPPY: 83, topPPRadius: 42,
    topNameX: 250, topNameY: 82, topNameSize: 34,
    chatPPX: 75, chatPPRadius: 38,
    textX: 175, textY: 962,
    bubbleWidth: 520, textSize: 30,
    bubbleBgColor: '#ffffff', textColor: '#161823'
};

async function fetchBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5
    });
    return Buffer.from(res.data);
}

async function ensureAssets() {
    await mkdir(FONTS_DIR, { recursive: true });
    if (!existsSync(TEMPLATE_PATH)) {
        await writeFile(TEMPLATE_PATH, await fetchBuffer(TEMPLATE_URL));
    }
    for (const font of FONT_ASSETS) {
        const dest = join(FONTS_DIR, font.file);
        if (!existsSync(dest)) {
            await writeFile(dest, await fetchBuffer(font.url));
        }
        GlobalFonts.registerFromPath(dest, font.family);
    }
}

async function loadImageSmart(src) {
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return loadImage(await fetchBuffer(src));
    }
    return loadImage(src);
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/(\s+)/);
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if (!word) continue;
        if (word.trim() === '' && currentLine === '') continue;
        const testLine = currentLine + word;
        if (ctx.measureText(testLine).width > maxWidth) {
            if (currentLine !== '') {
                lines.push(currentLine.trimEnd());
                currentLine = word.trimStart();
            } else {
                lines.push(testLine);
                currentLine = '';
            }
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine.trim()) lines.push(currentLine.trimEnd());
    return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke = null, shadow = false) {
    ctx.save();
    if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;
    }
    ctx.fillStyle = fill;
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
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
}

function drawCircleImage(ctx, img, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
}

async function renderImage(username, chatText, avatarSrc) {
    await ensureAssets();
    const USERNAME = username || 'Ditzzx';
    const CHAT_TEXT = chatText || 'Just friend kok cemburu 😂😂';
    const AVATAR_SRC = avatarSrc || 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/6b71d84a580f385bd7ee36402df5341ead4770a0/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg';

    const templateImage = await loadImage(TEMPLATE_PATH);
    const avatarImage = await loadImageSmart(AVATAR_SRC);

    const canvas = createCanvas(1080 * 2, 2280 * 2);
    const ctx = canvas.getContext('2d');

    ctx.scale(2, 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, 1080, 2280);
    ctx.drawImage(templateImage, 0, 0, 1080, 2280);

    drawCircleImage(ctx, avatarImage, config.topPPX, config.topPPY, config.topPPRadius);

    ctx.font = `bold ${config.topNameSize}px 'Plus Jakarta Sans', 'Noto Color Emoji'`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(USERNAME, config.topNameX, config.topNameY);

    ctx.font = `500 ${config.textSize}px 'Plus Jakarta Sans', 'Noto Color Emoji'`;

    const lines = wrapText(ctx, CHAT_TEXT, config.bubbleWidth - 52);
    const lineH = config.textSize * 1.45;

    let maxW = 0;
    for (const l of lines) {
        const w = ctx.measureText(l).width;
        if (w > maxW) maxW = w;
    }

    const padX = 30,
        padY = 24;
    const bubbleW = Math.max(maxW + padX * 2, 180);
    const bubbleH = lines.length * lineH + padY * 2;
    const bubbleX = config.textX - padX;
    const bubbleY = config.textY - padY;

    drawCircleImage(ctx, avatarImage, config.chatPPX, bubbleY + bubbleH / 2, config.chatPPRadius);
    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 35, config.bubbleBgColor);

    ctx.fillStyle = config.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    lines.forEach((line, i) => {
        const lineY = config.textY + i * lineH + config.textSize / 2;
        ctx.fillText(line, config.textX, lineY);
    });

    const menuX = 90,
        menuY = bubbleY + bubbleH + 28;
    drawRoundedRect(ctx, menuX, menuY, 565, 580, 40, '#ffffff', 'rgba(0,0,0,0.02)', true);

    const itemH = 90,
        iconX = menuX + 60,
        labelX = menuX + 130;
    MENU_ICONS.forEach((item, i) => {
        const cy = menuY + 25 + i * itemH + itemH / 2;
        ctx.fillStyle = item.color;
        ctx.font = `900 34px 'Font Awesome 6 Free'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.unicode, iconX, cy);
        ctx.font = `500 34px 'Plus Jakarta Sans'`;
        ctx.textAlign = 'left';
        ctx.fillText(item.text, labelX, cy);
    });

    ctx.restore();

    const pngData = await canvas.encode('png');
    const outputPath = join(__dirname, `tiktok-chat-${Date.now()}.png`);
    await writeFile(outputPath, pngData);
    return outputPath;
}

const pluginConfig = {
    name: ['tqc', 'tiktokchat', 'ttchat', 'quotetiktok'],
    alias: ['tiktokquote', 'tiktoktext'],
    category: 'maker',
    description: 'Buat quote gaya TikTok chat',
    usage: `.tqc <teks>`,
    example: `.tqc Just friend kok cemburu 😂😂`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text?.trim();
    if (!text) {
        return m.reply(`❌ *Teks kosong!*\n\nContoh: .tqc Just friend kok cemburu 😂😂`);
    }
    try {
        await m.react('⏳');
        const imagePath = await renderImage(null, text, null);
        await sock.sendMessage(m.chat, {
            image: { url: imagePath },
            caption: `🎵 *TikTok Chat Quote*\n\n> *Text:* ${text}`
        }, { quoted: m });
        await m.react('✅');
    } catch (err) {
        console.error('TQC Error:', err);
        return m.reply(`❌ *Error!*\n\n> ${err.message || 'Coba lagi nanti'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};