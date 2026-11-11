const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, 'font');
const BG_PATH = path.join(FONT_DIR, 'bg-template.jpg');
const BG_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/_20260430144912806.jpg';
const FONT_URLS = [
    { url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/Inter-SemiBold.otf', file: 'Inter-SemiBold.otf' },
    { url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/Inter-Bold.otf', file: 'Inter-Bold.otf' }
];

async function ensureFile(url, filepath) {
    if (!fs.existsSync(filepath)) {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(filepath, Buffer.from(res.data));
    }
}

function loadFonts() {
    const semiBold = path.join(FONT_DIR, 'Inter-SemiBold.otf');
    const bold = path.join(FONT_DIR, 'Inter-Bold.otf');
    if (fs.existsSync(semiBold)) {
        global.fonts?.register?.(semiBold, 'Inter-SB');
    }
    if (fs.existsSync(bold)) {
        global.fonts?.register?.(bold, 'Inter-B');
    }
}

async function generateImage(ppUrl, name, text) {
    if (!fs.existsSync(FONT_DIR)) fs.mkdirSync(FONT_DIR, { recursive: true });
    await ensureFile(BG_URL, BG_PATH);
    for (const font of FONT_URLS) {
        await ensureFile(font.url, path.join(FONT_DIR, font.file));
    }
    loadFonts();

    const bg = await loadImage(BG_PATH);
    const avatar = await loadImage(ppUrl);

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(bg, 0, 0);

    const header = { x: 115, y: 388, gap: 25 };
    const p = { cx: header.x, cy: header.y, r: 68 };

    const SAFE_PADDING_X = 100;
    const SAFE_PADDING_TOP = 480;
    const SAFE_PADDING_BOTTOM = 480;

    const safeLeft = SAFE_PADDING_X;
    const safeRight = bg.width - SAFE_PADDING_X;
    const safeTop = SAFE_PADDING_TOP;
    const safeBottom = bg.height - SAFE_PADDING_BOTTOM;
    const safeW = safeRight - safeLeft;
    const safeH = safeBottom - safeTop;
    const safeCX = bg.width / 2;
    const safeCY = (safeTop + safeBottom) / 2;

    const s = Math.min(avatar.width, avatar.height);
    const sx = (avatar.width - s) / 2;
    const sy = (avatar.height - s) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, sx, sy, s, s, p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    ctx.restore();

    ctx.font = 'bold 55px "Inter-SB"';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(name, p.cx + p.r + header.gap, p.cy);

    function parseTokens(input) {
        const tokens = [];
        const regex = /\(([^)]*)\)/g;
        let last = 0, match;
        while ((match = regex.exec(input)) !== null) {
            if (match.index > last) tokens.push({ text: input.slice(last, match.index), red: false });
            tokens.push({ text: match[1], red: true });
            last = regex.lastIndex;
        }
        if (last < input.length) tokens.push({ text: input.slice(last), red: false });
        return tokens;
    }

    function measureToken(ctx, token, fsz) {
        ctx.font = `bold ${fsz}px "${token.red ? 'Inter-B' : 'Inter-SB'}"`;
        return ctx.measureText(token.text).width;
    }

    function wrapTokens(ctx, tokens, maxWidth, fsz) {
        const lines = [];
        let curLine = [];
        let curW = 0;
        const words = [];
        for (const tok of tokens) {
            const parts = tok.text.split(/(\s+)/);
            for (const p of parts) {
                if (p === '') continue;
                words.push({ text: p, red: tok.red });
            }
        }
        for (const word of words) {
            if (/^\s+$/.test(word.text)) {
                if (curLine.length > 0) {
                    ctx.font = `bold ${fsz}px "Inter-SB"`;
                    const spaceW = ctx.measureText(' ').width;
                    curW += spaceW;
                    const last = curLine[curLine.length - 1];
                    if (last.red === word.red) last.text += word.text;
                    else curLine.push({ text: word.text, red: word.red });
                }
                continue;
            }
            ctx.font = `bold ${fsz}px "${word.red ? 'Inter-B' : 'Inter-SB'}"`;
            const wordW = ctx.measureText(word.text).width;
            ctx.font = `bold ${fsz}px "Inter-SB"`;
            const spaceW = ctx.measureText(' ').width;
            const addW = curLine.length > 0 ? spaceW + wordW : wordW;
            if (curW + addW > maxWidth && curLine.length > 0) {
                lines.push(curLine);
                curLine = [{ text: word.text, red: word.red }];
                curW = wordW;
            } else {
                if (curLine.length > 0) {
                    const last = curLine[curLine.length - 1];
                    if (last.red === word.red) {
                        last.text += ' ' + word.text;
                    } else {
                        curLine.push({ text: ' ', red: false });
                        curLine.push({ text: word.text, red: word.red });
                    }
                    curW += spaceW + wordW;
                } else {
                    curLine.push({ text: word.text, red: word.red });
                    curW = wordW;
                }
            }
        }
        if (curLine.length > 0) lines.push(curLine);
        return lines;
    }

    function lineWidth(ctx, segments, fsz) {
        return segments.reduce((sum, seg) => {
            ctx.font = `bold ${fsz}px "${seg.red ? 'Inter-B' : 'Inter-SB'}"`;
            return sum + ctx.measureText(seg.text).width;
        }, 0);
    }

    function drawScaledText(ctx, input) {
        const tokens = parseTokens(input.trim());
        const MAX_FONT = 65;
        const MIN_FONT = 18;
        let fsz = MAX_FONT;
        let lines, totalH, lh;
        do {
            lh = fsz * 1.25;
            lines = wrapTokens(ctx, tokens, safeW, fsz);
            totalH = lines.length * lh;
            if (totalH <= safeH) break;
            fsz -= 1;
        } while (fsz > MIN_FONT);
        if (totalH > safeH) {
            const maxLines = Math.floor(safeH / lh);
            lines = lines.slice(0, maxLines);
            if (lines.length > 0) {
                let lastLine = lines[lines.length - 1];
                ctx.font = `bold ${fsz}px "Inter-SB"`;
                const dotsW = ctx.measureText('...').width;
                while (lineWidth(ctx, lastLine, fsz) + dotsW > safeW) {
                    const last = lastLine[lastLine.length - 1];
                    if (last.text.length > 1) {
                        last.text = last.text.slice(0, -1).trimEnd();
                    } else {
                        lastLine.pop();
                        if (lastLine.length === 0) break;
                    }
                }
                lastLine.push({ text: '...', red: false });
            }
            totalH = lines.length * lh;
        }
        let startY = safeCY - totalH / 2 + lh / 2;
        ctx.textBaseline = 'middle';
        for (let i = 0; i < lines.length; i++) {
            const segments = lines[i];
            const totalW = lineWidth(ctx, segments, fsz);
            let x = safeCX - totalW / 2;
            const y = startY + i * lh;
            for (const seg of segments) {
                ctx.font = `bold ${fsz}px "${seg.red ? 'Inter-B' : 'Inter-SB'}"`;
                ctx.fillStyle = seg.red ? '#e51a1a' : '#000000';
                ctx.textAlign = 'left';
                ctx.fillText(seg.text, x, y);
                x += ctx.measureText(seg.text).width;
            }
        }
    }

    drawScaledText(ctx, text);
    return canvas.toBuffer('image/png');
}

const pluginConfig = {
    name: ['igstory', 'fakestory', 'fakestory2', 'fakestory3'],
    alias: ['fstory', 'igfake'],
    category: 'maker',
    description: 'Buat fake Instagram story',
    usage: `.igstory <teks>`,
    example: `.igstory (Halo) semua (kenalan) yuk`,
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
        return m.reply(`❌ *Teks kosong!*\n\nContoh: .igstory (Halo) semua (kenalan) yuk`);
    }

    try {
        await m.react('⏳');
        const pp = m.senderProfile?.profilePicture || 'https://raw.githubusercontent.com/uploader762/dat4/main/uploads/e0f993-1777126212302.jpg';
        const name = m.pushName || 'User';
        const imageBuffer = await generateImage(pp, name, text);
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `📸 *Fake Instagram Story*\n\n> *Text:* ${text}`
        }, { quoted: m });
        await m.react('✅');
    } catch (err) {
        console.error('IG Story Error:', err);
        return m.reply(`❌ *Error!*\n\n> ${err.message || 'Coba lagi nanti'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};