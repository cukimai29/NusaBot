const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const config = require('../../config');

const pluginConfig = {
    name: 'notiig',
    alias: ['noteig', 'ig-note', 'ignote'],
    category: 'canvas',
    description: 'Bikin fake Instagram Note dengan PP custom atau auto PP WhatsApp',
    usage: '.notiig <username>|<note>|<waktu> (reply foto untuk PP custom)',
    example: '.notiig Rin imup|Jujur ini janggal|3m',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

const BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/bf3903f6-ae57-4d75-96a4-5c2e00c441c1.png';
const DEFAULT_AVATAR = 'https://i.ibb.co/4pDNDk1/avatar.png';

const ASSETS_DIR = join(process.cwd(), 'assets', 'ignotes');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const BG_LOCAL = join(ASSETS_DIR, 'template.png');
const TMP_DIR = join(process.cwd(), 'tmp');

const INTER_FONTS = [
    {
        url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
        file: 'Inter-Medium.ttf'
    },
    {
        url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
        file: 'Inter-SemiBold.ttf'
    }
];

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `📸 *ɪɴꜱᴛᴀɢʀᴀᴍ ɴᴏᴛᴇ*\n\n` +
            `📌 Format: ${m.prefix}notiig <username>|<note>|<waktu>\n` +
            `📝 Contoh: ${m.prefix}notiig Rin imup|Jujur ini janggal|3m\n\n` +
            `💡 Max 7 kata ya biar nggak kepanjangan`
        );
    }

    const [userPayload, notePayload, timePayload] = text.split('|');
    const username = userPayload ? userPayload.trim() : 'rin imup';
    const noteText = notePayload ? notePayload.trim() : 'Jujur ini janggal';
    const timeStr = timePayload ? timePayload.trim() : '3m';

    m.react('⏳');

    try {
        await mkdir(FONTS_DIR, { recursive: true });
        await mkdir(TMP_DIR, { recursive: true });

        for (const font of INTER_FONTS) {
            const fontPath = join(FONTS_DIR, font.file);
            if (!existsSync(fontPath)) {
                const fRes = await axios.get(font.url, { responseType: 'arraybuffer', timeout: 15000 });
                await writeFile(fontPath, Buffer.from(fRes.data));
            }
            GlobalFonts.registerFromPath(fontPath, 'InterCustom');
        }

        if (!existsSync(BG_LOCAL)) {
            const res = await axios.get(BG_URL, { responseType: 'arraybuffer', timeout: 15000 });
            await writeFile(BG_LOCAL, Buffer.from(res.data));
        }

        let ppBuffer;
        if (m.quoted?.image) {
            ppBuffer = await m.quoted.download();
        } else {
            try {
                const ppUrl = await sock.profilePictureUrl(m.sender, 'image');
                const ppRes = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
                ppBuffer = Buffer.from(ppRes.data);
            } catch {
                const ppRes = await axios.get(DEFAULT_AVATAR, { responseType: 'arraybuffer', timeout: 10000 });
                ppBuffer = Buffer.from(ppRes.data);
            }
        }

        const canvas = createCanvas(1080, 1920);
        const ctx = canvas.getContext('2d');

        const bgImg = await loadImage(BG_LOCAL);
        ctx.drawImage(bgImg, 0, 0, 1080, 1920);
        const ppImg = await loadImage(ppBuffer);

        const ppX = 310, ppY = 779, ppRadius = 75;
        const userX = 534, userY = 624, userSize = 36;
        const cardX = 384, cardY = 777, baseTextSize = 40;
        const msgX = 78, msgY = 1011, msgSize = 46;
        const fontName = 'InterCustom';

        ctx.save();
        ctx.beginPath();
        ctx.arc(ppX, ppY, ppRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(ppImg, ppX - ppRadius, ppY - ppRadius, ppRadius * 2, ppRadius * 2);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${userSize}px ${fontName}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${username}  ·  ${timeStr}`, userX, userY);

        let displayNoteText = noteText;
        const words = displayNoteText.trim().split(/\s+/).filter(Boolean);
        if (words.length > 7) {
            displayNoteText = 'max';
        }

        ctx.font = `500 ${baseTextSize}px ${fontName}`;
        const textMetrics = ctx.measureText(displayNoteText).width;
        const paddingX = 32;
        const paddingY = 20;
        const bubbleW = textMetrics + (paddingX * 2);
        const bubbleH = baseTextSize + (paddingY * 2);
        const radius = bubbleH / 2;

        ctx.fillStyle = '#434954';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY - (bubbleH / 2), bubbleW, bubbleH, radius);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cardX - 6, cardY + 2, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayNoteText, cardX + paddingX, cardY);

        ctx.fillStyle = '#727272';
        ctx.font = `500 ${msgSize}px ${fontName}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Message ${username}`, msgX, msgY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `500 28px ${fontName}`;
        ctx.textAlign = 'center';
        ctx.fillText('© RzkyADS', 540, 1880);

        const outPath = join(TMP_DIR, `ignote-${Date.now()}.png`);
        await writeFile(outPath, await canvas.encode('png'));

        await sock.sendMessage(m.chat, {
            image: { url: outPath },
            caption: `📸 *Instagram Note*\n\n👤 ${username}\n💬 ${displayNoteText}\n⏰ ${timeStr}\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        m.react('✅');

        setTimeout(async () => {
            try { if (existsSync(outPath)) await unlink(outPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[NotiIG] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal buat note!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};