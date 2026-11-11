const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, readFile, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'qcwa',
    alias: ['waquote', 'quote-wa', 'wa-quote'],
    category: 'canvas',
    description: 'Bikin fake chat WhatsApp quote dengan PP custom',
    usage: '.qcwa <teks>|<mode> (reply foto/gambar) atau .qcwa <teks>|<mode>',
    example: '.qcwa gw mah ganteng njir|gelap',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 3,
    isEnabled: true
};

const ASSET_DIR = join(process.cwd(), 'assets', 'waquote');
const FONT_DIR = join(ASSET_DIR, 'fonts');
const TMP_DIR = join(process.cwd(), 'tmp');

const FONT_MEDIUM_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/Inter-Medium.otf';
const FONT_REGULAR_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/interregular.ttf';
const APPLE_EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json';
const BACKGROUND_DARK_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/hoh.jpeg';
const BACKGROUND_LIGHT_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/sisis.jpeg';

const FONT_MEDIUM_LOCAL = join(FONT_DIR, 'Inter-Medium.otf');
const FONT_REGULAR_LOCAL = join(FONT_DIR, 'Inter-Regular.ttf');
const BACKGROUND_DARK_LOCAL = join(ASSET_DIR, 'wab.jpeg');
const BACKGROUND_LIGHT_LOCAL = join(ASSET_DIR, 'sisis.jpeg');
const APPLE_EMOJI_JSON_LOCAL = join(FONT_DIR, 'emoji-apple-image.json');

const THEMES = {
    dark: { bubble: '#242625', text: '#f1f3f5', phone: '#7a8285', time: '#aeb4b8' },
    light: { bubble: '#ffffff', text: '#2f3032', phone: '#767a7b', time: '#767a7b' }
};

const USERNAME_COLORS_DARK = ['#25d366', '#53bdeb', '#ffb02e', '#ff6b81', '#b197fc', '#63e6be', '#ffd43b', '#74c0fc', '#f783ac', '#69db7c'];
const USERNAME_COLORS_LIGHT = ['#1fa855', '#1070e0', '#d97706', '#dc2626', '#9333ea', '#db2777', '#0d9488', '#b45309'];

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu;

let fontsReady = false;
let appleEmojiMap = null;
const emojiImageCache = new Map();
const backgroundImageCache = { dark: null, light: null };

async function downloadFile(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5,
        timeout: 15000
    });
    return Buffer.from(res.data);
}

async function ensureFile(url, localPath) {
    if (!existsSync(localPath)) {
        await writeFile(localPath, await downloadFile(url));
    }
}

async function loadFonts() {
    if (fontsReady) return;
    await mkdir(FONT_DIR, { recursive: true });
    await ensureFile(FONT_MEDIUM_URL, FONT_MEDIUM_LOCAL);
    await ensureFile(FONT_REGULAR_URL, FONT_REGULAR_LOCAL);
    GlobalFonts.registerFromPath(FONT_MEDIUM_LOCAL, 'WAQuoteInterMedium');
    GlobalFonts.registerFromPath(FONT_REGULAR_LOCAL, 'WAQuoteInterRegular');
    fontsReady = true;
}

async function loadBackground(mode) {
    if (backgroundImageCache[mode]) return backgroundImageCache[mode];
    await mkdir(ASSET_DIR, { recursive: true });
    const url = mode === 'light' ? BACKGROUND_LIGHT_URL : BACKGROUND_DARK_URL;
    const localPath = mode === 'light' ? BACKGROUND_LIGHT_LOCAL : BACKGROUND_DARK_LOCAL;
    await ensureFile(url, localPath);
    backgroundImageCache[mode] = await loadImage(await readFile(localPath));
    return backgroundImageCache[mode];
}

function randomUsernameColor(mode) {
    const colors = mode === 'light' ? USERNAME_COLORS_LIGHT : USERNAME_COLORS_DARK;
    return colors[Math.floor(Math.random() * colors.length)];
}

function emojiToUnicode(emoji) {
    return [...emoji].map(v => v.codePointAt(0).toString(16).padStart(4, '0')).join('-');
}

async function loadAppleEmojiMap() {
    if (appleEmojiMap) return appleEmojiMap;
    await mkdir(FONT_DIR, { recursive: true });
    if (!existsSync(APPLE_EMOJI_JSON_LOCAL)) {
        await writeFile(APPLE_EMOJI_JSON_LOCAL, await downloadFile(APPLE_EMOJI_JSON_URL));
    }
    const raw = await readFile(APPLE_EMOJI_JSON_LOCAL, 'utf-8');
    appleEmojiMap = JSON.parse(raw);
    return appleEmojiMap;
}

async function getEmojiImage(emoji) {
    if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);
    const map = await loadAppleEmojiMap();
    const base = emojiToUnicode(emoji);
    const variants = [
        base, base.replace(/-fe0f/gi, ''), `${base.replace(/-fe0f/gi, '')}-fe0f`,
        base.toUpperCase(), base.replace(/-fe0f/gi, '').toUpperCase(), `${base.replace(/-fe0f/gi, '').toUpperCase()}-FE0F`
    ];
    let b64 = null;
    for (const variant of variants) {
        if (map[variant]) { b64 = map[variant]; break; }
    }
    if (!b64) return null;
    const img = await loadImage(Buffer.from(b64, 'base64'));
    emojiImageCache.set(emoji, img);
    return img;
}

async function drawAppleEmoji(ctx, emoji, x, y, size) {
    const img = await getEmojiImage(emoji);
    if (!img) { ctx.fillText(emoji, x, y); return; }
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

function measureTextCustom(ctx, text, fontSize) {
    const parts = String(text).split(EMOJI_REGEX);
    let width = 0;
    for (const part of parts) {
        if (!part) continue;
        EMOJI_REGEX.lastIndex = 0;
        if (EMOJI_REGEX.test(part)) { width += fontSize * 1.05; }
        else { width += ctx.measureText(part).width; }
        EMOJI_REGEX.lastIndex = 0;
    }
    return width;
}

async function drawTextWithEmojis(ctx, text, x, y, fontSize) {
    const parts = String(text).split(EMOJI_REGEX);
    let currentX = x;
    for (const part of parts) {
        if (!part) continue;
        EMOJI_REGEX.lastIndex = 0;
        if (EMOJI_REGEX.test(part)) {
            const emojiSize = fontSize * 1.05;
            await drawAppleEmoji(ctx, part, currentX + emojiSize / 2, y, emojiSize);
            currentX += emojiSize;
        } else {
            ctx.fillText(part, currentX, y);
            currentX += ctx.measureText(part).width;
        }
        EMOJI_REGEX.lastIndex = 0;
    }
}

function drawBackgroundCover(ctx, img, canvasW, canvasH) {
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasW / canvasH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgAspect > canvasAspect) {
        sw = img.height * canvasAspect;
        sx = (img.width - sw) / 2;
    } else {
        sh = img.width / canvasAspect;
        sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

function bubblePath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + 26);
    ctx.quadraticCurveTo(x - 4, y + 10, x - 18, y + 4);
    ctx.quadraticCurveTo(x - 22, y + 2, x - 20, y);
    ctx.quadraticCurveTo(x - 10, y, x + r, y);
    ctx.closePath();
}

function drawCircleImage(ctx, img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
}

function imageAreaPath(ctx, x, y, w, h, r) {
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

function wrapTextFullWidth(ctx, text, maxWidth, fontSize) {
    const words = String(text).split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if (word.includes('\n')) {
            const parts = word.split('\n');
            for (let i = 0; i < parts.length; i++) {
                const test = current ? `${current} ${parts[i]}` : parts[i];
                if (measureTextCustom(ctx, test, fontSize) > maxWidth && current) {
                    lines.push(current);
                    current = parts[i];
                } else { current = test; }
                if (i < parts.length - 1) { lines.push(current); current = ''; }
            }
            continue;
        }
        const test = current ? `${current} ${word}` : word;
        if (measureTextCustom(ctx, test, fontSize) > maxWidth && current) {
            lines.push(current);
            current = word;
        } else { current = test; }
    }
    if (current) lines.push(current);
    return lines;
}

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `💬 *ᴡᴀ ǫᴜᴏᴛᴇ*\n\n` +
            `📌 Format: ${m.prefix}qcwa <teks>|<mode>\n` +
            `📝 Contoh: ${m.prefix}qcwa gw ganteng|gelap\n\n` +
            `💡 Mode: gelap/terang/dark/light\n` +
            `🖼️ Reply gambar untuk foto di chat`
        );
    }

    const parts = text.split('|');
    const quoteText = parts[0]?.trim() || '...';
    let mode = 'dark';

    if (parts[1]) {
        const m = parts[1].trim().toLowerCase();
        if (m === 'terang' || m === 'light') mode = 'light';
        else if (m === 'gelap' || m === 'dark') mode = 'dark';
    }

    m.react('⏳');

    try {
        await loadFonts();
        await loadAppleEmojiMap();
        await mkdir(TMP_DIR, { recursive: true });

        const themeColors = THEMES[mode];

        let ppBuffer;
        try {
            const ppUrl = await sock.profilePictureUrl(m.sender, 'image');
            ppBuffer = await downloadFile(ppUrl);
        } catch {
            ppBuffer = await downloadFile('https://telegra.ph/file/320b066dc81928b782c7b.png');
        }

        let mainImageBuffer = null;
        if (m.quoted?.image) {
            mainImageBuffer = await m.quoted.download();
        }

        const hasImage = Boolean(mainImageBuffer);
        const phone = m.sender?.split('@')[0]?.slice(0, 14) || 'User';
        const username = m.pushName || 'Someone';

        const width = 1024;
        const usernameSize = 31;
        const phoneSize = 29;
        const textSize = 40;
        const timeSize = 29;

        const bubbleX = 108;
        const bubbleY = 60;
        const bubbleRadius = 24;
        const paddingX = 38;
        const paddingRight = 36;
        const lineHeight = 56;

        const avatarSize = 72;
        const avatarX = 12;
        const avatarY = bubbleY;

        const time = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(':', '.');

        const measureCanvas = createCanvas(10, 10);
        const mctx = measureCanvas.getContext('2d');

        mctx.font = `${usernameSize}px WAQuoteInterMedium`;
        const usernameWidth = measureTextCustom(mctx, username, usernameSize);

        mctx.font = `${phoneSize}px WAQuoteInterRegular`;
        const phoneWidth = measureTextCustom(mctx, phone, phoneSize);

        mctx.font = `${timeSize}px WAQuoteInterRegular`;
        const timeWidth = mctx.measureText(time).width;

        const headerGap = 40;
        const minHeaderWidth = usernameWidth + headerGap + phoneWidth + paddingX + paddingRight;

        const maxBubbleW = width - bubbleX - 24;
        const contentX = bubbleX + paddingX - 5;
        const textMaxWidth = Math.max(260, maxBubbleW - paddingRight - 18 - contentX + bubbleX);

        mctx.font = `${textSize}px WAQuoteInterRegular`;
        const lines = quoteText ? wrapTextFullWidth(mctx, quoteText, textMaxWidth, textSize) : [];
        const hasCaption = lines.length > 0;

        let bubbleWidth = Math.max(minHeaderWidth, maxBubbleW);
        if (bubbleWidth > maxBubbleW) bubbleWidth = maxBubbleW;

        const phoneX = bubbleX + bubbleWidth - phoneWidth - paddingRight;

        const avatar = await loadImage(ppBuffer);
        const background = await loadBackground(mode);

        let mainImage = null;
        let imageAreaX = bubbleX + 8;
        let imageAreaW = bubbleWidth - 16;
        let imageDrawH = 0;

        if (hasImage) {
            mainImage = await loadImage(mainImageBuffer);
            const imgAspect = mainImage.width / mainImage.height;
            imageDrawH = Math.round(imageAreaW / imgAspect);
        }

        const headerBlockH = 76;
        const headerY = bubbleY + 34;

        const imageTopGap = 0;
        const imageBottomGap = hasImage ? (hasCaption ? 20 : 8) : 0;
        const imageBlockH = hasImage ? (imageTopGap + imageDrawH + imageBottomGap) : 0;
        const textBlockH = lines.length * lineHeight;
        const timeRowH = (!hasImage && hasCaption) ? 26 : 0;
        const bottomPad = hasImage ? (hasCaption ? 20 : 8) : 0;

        const bubbleHeight = Math.max(100, headerBlockH + imageBlockH + textBlockH + timeRowH + bottomPad);
        const imageY = bubbleY + headerBlockH + imageTopGap;

        const textStartY = hasImage
            ? imageY + imageDrawH + imageBottomGap + (lineHeight / 2) - 6
            : bubbleY + headerBlockH + (textSize / 2) + 2;

        const height = Math.round(bubbleY + bubbleHeight + 70);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        drawBackgroundCover(ctx, background, width, height);

        ctx.fillStyle = themeColors.bubble;
        bubblePath(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
        ctx.fill();

        drawCircleImage(ctx, avatar, avatarX, avatarY, avatarSize);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.font = `${usernameSize}px WAQuoteInterMedium`;
        ctx.fillStyle = randomUsernameColor(mode);
        await drawTextWithEmojis(ctx, username, contentX, headerY, usernameSize);

        ctx.font = `${phoneSize}px WAQuoteInterRegular`;
        ctx.fillStyle = themeColors.phone;
        await drawTextWithEmojis(ctx, phone, phoneX, headerY, phoneSize);

        if (hasImage && mainImage) {
            ctx.save();
            imageAreaPath(ctx, imageAreaX, imageY, imageAreaW, imageDrawH, 20);
            ctx.clip();
            ctx.drawImage(mainImage, imageAreaX, imageY, imageAreaW, imageDrawH);
            ctx.restore();
        }

        ctx.font = `${textSize}px WAQuoteInterRegular`;
        ctx.fillStyle = themeColors.text;
        ctx.textBaseline = 'middle';

        for (let i = 0; i < lines.length; i++) {
            await drawTextWithEmojis(ctx, lines[i], contentX, textStartY + i * lineHeight, textSize);
        }

        ctx.font = `${timeSize}px WAQuoteInterRegular`;
        ctx.textBaseline = 'alphabetic';

        if (hasImage && !hasCaption) {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            const imgTimeX = imageAreaX + imageAreaW - 20;
            const imgTimeY = imageY + imageDrawH - 18;
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(time, imgTimeX, imgTimeY);
            ctx.restore();
        } else {
            ctx.fillStyle = themeColors.time;
            ctx.textAlign = 'right';
            const timeYOffset = !hasImage ? 13 : 16;
            const timeY = bubbleY + bubbleHeight - timeYOffset;
            const timeX = bubbleX + bubbleWidth - 20;
            ctx.fillText(time, timeX, timeY);
        }

        ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
        ctx.font = '18px WAQuoteInterRegular';
        ctx.textAlign = 'right';
        ctx.fillText('© RzkyADS', width - 15, height - 10);

        const outPath = join(TMP_DIR, `waquote-${Date.now()}.png`);
        await writeFile(outPath, await canvas.encode('png'));

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url: outPath },
            caption: `💬 *WA Quote*\n\n📝 ${quoteText}\n🎨 Mode: ${mode === 'dark' ? '🌙 Gelap' : '☀️ Terang'}\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        setTimeout(async () => {
            try { if (existsSync(outPath)) await unlink(outPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[QCWA] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};