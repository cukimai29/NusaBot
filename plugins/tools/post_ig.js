// plugins/tools/post-ig.js
const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { Resvg } = require('@resvg/resvg-js');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'post-ig',
    alias: ['postig', 'igpost', 'igstory'],
    category: 'tools',
    description: 'Generate fake Instagram post/story',
    usage: '.post-ig <username>|<like>|<comment>|<repost> (reply foto profil & foto post)',
    example: '.post-ig Nothing|100|31|489',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
};

const BG_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/storyig.png';
const FONT_URL = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Medium.woff2';

const ICON_URLS = {
    like: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/like.svg',
    comment: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/comment.svg',
    repost: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/repost.svg',
    share: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/share.svg',
    save: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/save.svg',
    verify: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/verifyig.svg',
};

const ICON_COLOR = '#f9fdfe';
const VERIFY_COLOR = '#0095F6';

const ASSETS_DIR = join(process.cwd(), 'assets', 'igstory');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const ICONS_DIR = join(ASSETS_DIR, 'icons');
const BG_LOCAL = join(ASSETS_DIR, 'bg.png');
const FONT_LOCAL = join(FONTS_DIR, 'Inter-Medium.woff2');

const CANVAS_W = 1080;
const CANVAS_H = 1564;
const CANVAS_BG_COLOR = '#0c0f14';
const OUTPUT_HEIGHT = 1400;

const ICON_SIZE = 80;
const BOTTOM_BAR_Y_OFFSET = 17;
const ICON_Y = 1264 + BOTTOM_BAR_Y_OFFSET;
const GAP_ICON_TO_TEXT = 24;
const GAP_TEXT_TO_ICON = 43;
const DEFAULT_X = { like: 22, comment: 256, repost: 459, share: 688, save: 978 };

const COUNT_FONT = '500 43px InterIG';
const COUNT_ZONE_Y = 1285 + BOTTOM_BAR_Y_OFFSET;
const COUNT_ZONE_H = 48;

const USERNAME_FONT = '500 38px InterIG';
const USERNAME_X = 159;
const USERNAME_ZONE_Y = 58;
const USERNAME_ZONE_H = 59;
const VERIFY_SIZE = 40;
const VERIFY_Y = 71;
const GAP_USERNAME_VERIFY = 14;

const AVATAR_CX = 83.5, AVATAR_CY = 85.5, AVATAR_R = 48.5;
const AVATAR_DRAW = { x: 35, y: 37, w: 97, h: 97 };

const MAIN_PHOTO_ZONE = { x: -3, y: 157, w: 1089, h: 1089 };
const MAIN_PHOTO_BLUR = 28;

async function download(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5,
        timeout: 30000,
    });
    return Buffer.from(res.data);
}

function isUrl(src) {
    return /^https?:\/\//i.test(src);
}

async function resolveFreshImage(src) {
    const buf = isUrl(src) ? await download(src) : await require('node:fs/promises').readFile(src);
    return loadImage(buf);
}

function recolorSvgAttrs(svgText, color) {
    return svgText
        .replace(/fill="(?!none)[^"]*"/gi, `fill="${color}"`)
        .replace(/stroke="(?!none)[^"]*"/gi, `stroke="${color}"`)
        .replace(/fill:\s*(?!none)[^;"']*/gi, `fill:${color}`)
        .replace(/stroke:\s*(?!none)[^;"']*/gi, `stroke:${color}`);
}

function rasterizeSvg(svgText, size) {
    const resvg = new Resvg(svgText, {
        fitTo: { mode: 'width', value: size },
    });
    return resvg.render().asPng();
}

async function tintImage(img, color) {
    const c = createCanvas(img.width, img.height);
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = color;
    cx.fillRect(0, 0, img.width, img.height);
    return c.encode('png');
}

async function setup() {
    await mkdir(FONTS_DIR, { recursive: true });
    await mkdir(ICONS_DIR, { recursive: true });

    if (!existsSync(BG_LOCAL)) {
        await writeFile(BG_LOCAL, await download(BG_URL));
    }

    if (!existsSync(FONT_LOCAL)) {
        await writeFile(FONT_LOCAL, await download(FONT_URL));
    }
    GlobalFonts.registerFromPath(FONT_LOCAL, 'InterIG');

    const icons = {};
    for (const [name, url] of Object.entries(ICON_URLS)) {
        const targetSize = name === 'verify' ? VERIFY_SIZE : ICON_SIZE;
        const cachePath = join(ICONS_DIR, `${name}.png`);
        if (!existsSync(cachePath)) {
            const svgText = (await download(url)).toString('utf-8');
            const color = name === 'verify' ? VERIFY_COLOR : ICON_COLOR;
            const rawPng = rasterizeSvg(svgText, targetSize * 3);
            const tintedPng = await tintImage(await loadImage(rawPng), color);
            await writeFile(cachePath, tintedPng);
        }
        icons[name] = await loadImage(cachePath);
    }
    return icons;
}

function computeBottomBarLayout(ctx, { like, comment, repost }) {
    ctx.font = COUNT_FONT;

    const likeX = DEFAULT_X.like;
    const likeTextX = likeX + ICON_SIZE + GAP_ICON_TO_TEXT;
    const likeTextW = ctx.measureText(String(like)).width;

    const minCommentX = likeTextX + likeTextW + GAP_TEXT_TO_ICON;
    const commentX = Math.max(DEFAULT_X.comment, minCommentX);
    const commentTextX = commentX + ICON_SIZE + GAP_ICON_TO_TEXT;
    const commentTextW = ctx.measureText(String(comment)).width;

    const minRepostX = commentTextX + commentTextW + GAP_TEXT_TO_ICON;
    const repostX = Math.max(DEFAULT_X.repost, minRepostX);
    const repostTextX = repostX + ICON_SIZE + GAP_ICON_TO_TEXT;
    const repostTextW = ctx.measureText(String(repost)).width;

    const minShareX = repostTextX + repostTextW + GAP_TEXT_TO_ICON;
    const shareX = Math.max(DEFAULT_X.share, minShareX);

    return {
        like: { iconX: likeX, textX: likeTextX },
        comment: { iconX: commentX, textX: commentTextX },
        repost: { iconX: repostX, textX: repostTextX },
        share: { iconX: shareX },
        save: { iconX: DEFAULT_X.save },
    };
}

function computeUsernameLayout(ctx, username) {
    ctx.font = USERNAME_FONT;
    const textW = ctx.measureText(username).width;
    const verifyX = USERNAME_X + textW + GAP_USERNAME_VERIFY;
    return { textX: USERNAME_X, verifyX };
}

function drawIcon(ctx, img, x, y, size) {
    ctx.drawImage(img, x, y, size, size);
}

function drawCountText(ctx, text, x) {
    ctx.save();
    ctx.font = COUNT_FONT;
    ctx.fillStyle = '#f9fdfe';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text), x, COUNT_ZONE_Y + COUNT_ZONE_H / 2);
    ctx.restore();
}

function drawUsernameText(ctx, text, x) {
    ctx.save();
    ctx.font = USERNAME_FONT;
    ctx.fillStyle = '#f9fdfe';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, USERNAME_ZONE_Y + USERNAME_ZONE_H / 2);
    ctx.restore();
}

function drawAvatar(ctx, img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_R, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const sw = img.width, sh = img.height;
    const crop = Math.min(sw, sh);
    const sx = (sw - crop) / 2;
    const sy = (sh - crop) / 2;
    ctx.drawImage(img, sx, sy, crop, crop, AVATAR_DRAW.x, AVATAR_DRAW.y, AVATAR_DRAW.w, AVATAR_DRAW.h);
    ctx.restore();
}

function drawMainPhoto(ctx, img, zone, blurPx = MAIN_PHOTO_BLUR) {
    const { x, y, w, h } = zone;
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    let cw, ch;
    if (imgRatio > boxRatio) {
        ch = h;
        cw = ch * imgRatio;
    } else {
        cw = w;
        ch = cw / imgRatio;
    }
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(img, x - (cw - w) / 2, y - (ch - h) / 2, cw, ch);
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
            `> *${prefix}post-ig <username>|<like>|<comment>|<repost>*\n` +
            `> Reply foto profil (PP) & foto post (gambar kedua)\n\n` +
            `📌 *Contoh:*\n` +
            `> ${prefix}post-ig Nothing|100|31|489\n\n` +
            `💡 *Tips:* Kirim 2 gambar (PP dulu, foto post kedua) lalu reply command ke foto post`
        );
    }

    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 3;

    if (!m.isOwner && !m.isPremium && (user?.energi ?? 25) < energyCost) {
        return m.reply(`❌ *Energi tidak cukup!*\n> Butuh ${energyCost} energi, energimu: ${user?.energi ?? 25}`);
    }

    if (!m.quoted?.image) {
        return m.reply(`❌ *Reply foto post!*\n\n> Reply command ke foto yang mau dijadiin post IG`);
    }

    m.react('⏳');

    try {
        const parts = text.split('|');
        const username = parts[0]?.trim() || 'Nothing';
        const like = parseInt(parts[1]) || 100;
        const comment = parseInt(parts[2]) || 31;
        const repost = parseInt(parts[3]) || 489;

        const mainPhoto = await m.quoted.download();

        let profilePhoto;
        const messages = await sock.loadMessages(m.chat, 3);
        const prevMsg = messages?.find(msg => msg?.image && msg.key.id !== m.quoted.key.id);
        
        if (prevMsg?.image) {
            profilePhoto = await prevMsg.download();
        } else {
            profilePhoto = mainPhoto;
        }

        const icons = await setup();

        const [bgImg, avatarImg, photoImg] = await Promise.all([
            loadImage(BG_LOCAL),
            loadImage(profilePhoto),
            loadImage(mainPhoto),
        ]);

        const canvas = createCanvas(CANVAS_W, CANVAS_H);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = CANVAS_BG_COLOR;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);

        drawMainPhoto(ctx, photoImg, MAIN_PHOTO_ZONE);
        drawAvatar(ctx, avatarImg);

        const uLayout = computeUsernameLayout(ctx, username);
        drawUsernameText(ctx, username, uLayout.textX);
        drawIcon(ctx, icons.verify, uLayout.verifyX, VERIFY_Y, VERIFY_SIZE);

        const bar = computeBottomBarLayout(ctx, { like, comment, repost });
        drawIcon(ctx, icons.like, bar.like.iconX, ICON_Y, ICON_SIZE);
        drawCountText(ctx, like, bar.like.textX);
        drawIcon(ctx, icons.comment, bar.comment.iconX, ICON_Y, ICON_SIZE);
        drawCountText(ctx, comment, bar.comment.textX);
        drawIcon(ctx, icons.repost, bar.repost.iconX, ICON_Y, ICON_SIZE);
        drawCountText(ctx, repost, bar.repost.textX);
        drawIcon(ctx, icons.share, bar.share.iconX, ICON_Y, ICON_SIZE);
        drawIcon(ctx, icons.save, bar.save.iconX, ICON_Y, ICON_SIZE);

        const cropH = Math.min(OUTPUT_HEIGHT, CANVAS_H);
        const finalCanvas = createCanvas(CANVAS_W, cropH);
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.drawImage(canvas, 0, 0, CANVAS_W, cropH, 0, 0, CANVAS_W, cropH);

        const tmpDir = join(process.cwd(), 'tmp');
        await mkdir(tmpDir, { recursive: true });
        const outputPath = join(tmpDir, `igstory-${Date.now()}.png`);
        await writeFile(outputPath, await finalCanvas.encode('png'));

        if (!m.isOwner && !m.isPremium) {
            db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
        }

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: { url: outputPath },
            caption: `📸 *Instagram Post*\n\n👤 *${username}*\n❤️ ${like} 💬 ${comment} 🔄 ${repost}\n\n> Generated with ${config.bot?.name || 'Bot'}`,
            footer: `© ${config.bot?.name || 'Bot'} | IG Story Generator`
        }, { quoted: m });

        setTimeout(async () => {
            try { if (existsSync(outputPath)) await unlink(outputPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[Post-IG] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal generate post!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};