const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFile, mkdir, unlink } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'fake-wafat',
    alias: ['fakewafat', 'wafat', 'rip', 'tribute'],
    category: 'canvas',
    description: 'Bikin gambar tribute wafat palsu',
    usage: '.fake-wafat <nama>|<lahir>|<wafat> (reply foto)',
    example: '.fake-wafat Cukii Dijilat|1995|2026',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 3,
    isEnabled: true
};

const BG_URL = 'https://uploader.zenzxz.dpdns.org/uploads/1776848882042.jpeg';
const FONT_URL = 'https://uploader.zenzxz.dpdns.org/uploads/1776849905914.ttf';
const ASSETS_DIR = join(process.cwd(), 'assets', 'wafat');
const FONT_PATH = join(ASSETS_DIR, 'wafatfont.ttf');

async function getBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000
    });
    return Buffer.from(res.data);
}

function drawCircleImg(ctx, img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
}

async function loadAssets() {
    await mkdir(ASSETS_DIR, { recursive: true });

    if (!existsSync(FONT_PATH)) {
        const fontBuffer = await getBuffer(FONT_URL);
        await writeFile(FONT_PATH, fontBuffer);
    }

    GlobalFonts.registerFromPath(FONT_PATH, 'WafatFont');
}

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `🕊️ *ꜰᴀᴋᴇ ᴡᴀꜰᴀᴛ*\n\n` +
            `📌 Format: ${m.prefix}fake-wafat <nama>|<lahir>|<wafat>\n` +
            `📝 Contoh: ${m.prefix}fake-wafat Cukii Dijilat|1995|2026\n\n` +
            `💡 Reply foto untuk gambar custom`
        );
    }

    const parts = text.split('|');
    const nama = parts[0]?.trim() || 'Unknown';
    const lahir = parts[1]?.trim() || '1990';
    const wafat = parts[2]?.trim() || '2026';

    m.react('⏳');

    try {
        await loadAssets();

        let fotoBuffer;
        if (m.quoted?.image) {
            fotoBuffer = await m.quoted.download();
        } else {
            try {
                const ppUrl = await sock.profilePictureUrl(m.sender, 'image');
                fotoBuffer = await getBuffer(ppUrl);
            } catch {
                fotoBuffer = await getBuffer('https://i.pravatar.cc/600');
            }
        }

        const bgBuffer = await getBuffer(BG_URL);

        const bg = await loadImage(bgBuffer);
        const personImg = await loadImage(fotoBuffer);

        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(bg, 0, 0, bg.width, bg.height);

        const centerX = bg.width / 2;
        const fotoSize = 575;

        drawCircleImg(ctx, personImg, centerX, 1210, fotoSize);

        ctx.fillStyle = '#462F29';
        ctx.textAlign = 'center';

        ctx.font = '60px WafatFont';
        ctx.fillText(nama, centerX, 1740);

        const rangeTahun = `${lahir} - ${wafat}`;
        const midY = (1800 + 1830) / 2;

        ctx.font = '40px WafatFont';
        ctx.fillText(rangeTahun, centerX, midY);

        ctx.fillStyle = 'rgba(70, 47, 41, 0.4)';
        ctx.font = '30px WafatFont';
        ctx.fillText('© RzkyADS', centerX, bg.height - 50);

        const tmpDir = join(process.cwd(), 'tmp');
        await mkdir(tmpDir, { recursive: true });
        const outPath = join(tmpDir, `wafat-${Date.now()}.png`);
        await writeFile(outPath, canvas.toBuffer('image/png'));

        await sock.sendMessage(m.chat, {
            image: { url: outPath },
            caption: `🕊️ *Tribute*\n\n👤 ${nama}\n📅 ${lahir} - ${wafat}\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

        m.react('✅');

        setTimeout(async () => {
            try { if (existsSync(outPath)) await unlink(outPath); } catch {}
        }, 60000);

    } catch (err) {
        console.error('[FakeWafat] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal buat gambar!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};