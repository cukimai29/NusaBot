const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const pluginConfig = {
    name: 'setwm',
    alias: ['setwatermark', 'wm'],
    category: 'owner',
    description: 'Mengatur watermark untuk sticker yang dibuat (reply sticker)',
    usage: '.setwm <teks watermark>',
    example: '.setwm Rhendyz',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

// Path penyimpanan watermark
const WM_PATH = path.join(__dirname, '..', '..', 'data', 'watermark.json');

function loadWatermark() {
    try {
        if (fs.existsSync(WM_PATH)) {
            return JSON.parse(fs.readFileSync(WM_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('[SetWM] Load error:', e.message);
    }
    return { text: 'NusaBot' };
}

function saveWatermark(data) {
    try {
        const dir = path.dirname(WM_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(WM_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('[SetWM] Save error:', e.message);
        return false;
    }
}

async function handler(m, { sock }) {
    const args = m.args || [];
    const text = args.join(' ').trim();

    if (!text) {
        const wm = loadWatermark();
        return m.reply(
`💗 *SET WATERMARK STICKER*

Watermark saat ini: *${wm.text}*

📌 Cara pakai:
.setwm <teks>

📌 Contoh:
.setwm Rhendyz
.setwm NusaBot

💡 Watermark akan muncul di semua sticker yang dibuat (reply sticker).

💗 *NusaBot* sayang kamu~ 💕`
        );
    }

    // Batasi panjang watermark
    if (text.length > 30) {
        return m.reply(`❌ Watermark terlalu panjang! Maksimal 30 karakter.

Kamu: ${text} (${text.length} karakter)`);
    }

    // Simpan watermark
    const success = saveWatermark({ text: text });
    if (!success) {
        return m.reply(`❌ Gagal menyimpan watermark. Coba lagi.`);
    }

    await m.react('✅');
    return m.reply(
`✅ *Watermark berhasil diubah!*

Watermark baru: *${text}*

💡 Watermark akan digunakan untuk semua sticker yang dibuat.

💗 *NusaBot* sayang kamu~ 💕`
    );
}

// ========== FUNGSI UNTUK MEMBUAT STICKER DENGAN WATERMARK ==========
async function createStickerWithWatermark(inputBuffer, watermarkText, sock, chatId, quoted) {
    try {
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const inputPath = path.join(tempDir, `sticker_input_${Date.now()}.png`);
        const outputPath = path.join(tempDir, `sticker_output_${Date.now()}.webp`);

        fs.writeFileSync(inputPath, inputBuffer);

        // Gunakan ffmpeg untuk menambahkan watermark
        const fontsize = 20;
        const fontcolor = 'white';
        const shadowcolor = 'black';
        const x = 20;
        const y = 20;

        const cmd = `ffmpeg -y -i "${inputPath}" -vf "drawtext=text='${watermarkText}':fontcolor=${fontcolor}:fontsize=${fontsize}:x=${x}:y=${y}:shadowcolor=${shadowcolor}:shadowx=2:shadowy=2" -c:v libwebp -lossless 0 -quality 80 -preset default -loop 0 -an "${outputPath}"`;

        await execAsync(cmd, { timeout: 30000 });

        if (fs.existsSync(outputPath)) {
            const stickerBuffer = fs.readFileSync(outputPath);
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            return stickerBuffer;
        }

        fs.unlinkSync(inputPath);
        return null;
    } catch (e) {
        console.error('[SetWM] Create sticker error:', e.message);
        return null;
    }
}

// ========== EKSPOR FUNGSI UNTUK DIGUNAKAN PLUGIN STICKER ==========
module.exports = {
    config: pluginConfig,
    handler,
    loadWatermark,
    createStickerWithWatermark
};