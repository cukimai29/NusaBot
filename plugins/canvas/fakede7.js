const axios = require('axios');
const path = require('path');
const { getAssetBuffer } = require('../../src/lib/zerotwo-asset-manager');
const te = require('../../src/lib/zerotwo-error');

// Canvas pake @napi-rs/canvas (CJS version)
const _canvas = require('@napi-rs/canvas');

const pluginConfig = {
    name: 'fakedev7',
    alias: ['fd7'],
    category: 'canvas',
    description: 'Membuat fake developer (Python Theme)',
    usage: '.fakedev7 <nama> (reply/kirim foto)',
    example: '.fakedev7 RzkyADS',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const name = m.text?.trim();
    if (!name) {
        return m.reply(
            `🎮 *ꜰᴀᴋᴇ ᴅᴇᴠᴇʟᴏᴘᴇʀ 7*\n\n` +
            `> Masukkan nama untuk profile\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> 1. Kirim foto + caption \`${m.prefix || '.'}fakedev7 <nama>\`\n` +
            `> 2. Reply foto dengan \`${m.prefix || '.'}fakedev7 <nama>\``
        );
    }

    let buffer = null;

    // ===== AMBIL GAMBAR =====
    if (m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.mtype === 'imageMessage')) {
        try {
            buffer = await m.quoted.download();
        } catch (e) {
            return m.reply(te(m.prefix || '.', m.command, m.pushName));
        }
    } else if (m.isMedia && m.type === 'imageMessage') {
        try {
            buffer = await m.download();
        } catch (e) {
            return m.reply(te(m.prefix || '.', m.command, m.pushName));
        }
    } else {
        try {
            let ppUrl = await sock.profilePictureUrl(m.sender, 'image');
            buffer = Buffer.from((await axios.get(ppUrl, { responseType: 'arraybuffer' })).data);
        } catch (error) {
            // Pake zerotwo-asset-manager
            buffer = getAssetBuffer('pp-kosong');
        }
    }

    if (!buffer) {
        return m.reply(`❌ Kirim/reply gambar untuk dijadikan avatar!`);
    }

    await m.react('⏳');

    try {
        // ===== LOAD IMAGES =====
        const userImage = await _canvas.loadImage(buffer);
        const blueTick = await _canvas.loadImage('https://raw.githubusercontent.com/kayzzaoshi-code/Uploader/main/file_1772220719294.jpeg');
        
        let crown = null;
        let leaf = null;
        try {
            crown = await _canvas.loadImage('https://cdn3.emoji.gg/emojis/3043_Crown.png');
        } catch (e) {
            console.log('[FakeDev7] Gagal load crown:', e.message);
        }
        try {
            leaf = await _canvas.loadImage('https://cdn3.emoji.gg/emojis/6401-leaf.png');
        } catch (e) {
            console.log('[FakeDev7] Gagal load leaf:', e.message);
        }

        const canvas = _canvas.createCanvas(1080, 1080);
        const ctx = canvas.getContext('2d');

        // ==========================================
        // 1. Draw Python Theme Background
        // ==========================================
        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, 1080, 1080);

        ctx.font = 'bold 22px "Consolas", monospace';
        const colors = ['#ffcc00', '#6699cc', '#c594c5', '#99c794', '#fac863'];
        const codeLines = [
            'import numpy as np',
            'import pandas as pd',
            'def analyze_data(dataset):',
            '    if dataset is None:',
            '        raise ValueError("No data!")',
            '    results = np.mean(dataset, axis=0)',
            '    return results',
            'class Developer:',
            '    def __init__(self, name):',
            '        self.name = name',
            '    def code(self):',
            '        print(f"{self.name} is coding...")',
            'if __name__ == "__main__":',
            '    main()'
        ];

        ctx.globalAlpha = 0.6;
        for (let y = 40; y < 1080; y += 40) {
            for (let x = 20; x < 1080; x += 450) {
                const line = codeLines[Math.floor(Math.random() * codeLines.length)];
                let drawX = x;
                const words = line.split(' ');
                for (const word of words) {
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.fillText(word + ' ', drawX, y);
                    drawX += ctx.measureText(word + ' ').width;
                }
            }
        }

        const grad = ctx.createRadialGradient(540, 540, 200, 540, 540, 800);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.globalAlpha = 1.0;

        // ==========================================
        // 2. Draw Avatar & Badges
        // ==========================================
        const centerX = 540;
        const centerY = 540;
        const radius = 263;

        // Avatar (bulat)
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const aspect = userImage.width / userImage.height;
        let sw = userImage.width,
            sh = userImage.height,
            sx = 0,
            sy = 0;
        if (aspect > 1) {
            sw = userImage.height;
            sx = (userImage.width - sw) / 2;
        } else {
            sh = userImage.width;
            sy = (userImage.height - sh) / 2;
        }
        ctx.drawImage(userImage, sx, sy, sw, sh, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();

        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // ==========================================
        // 3. Text Nama Melingkar
        // ==========================================
        ctx.font = 'bold 80px "Segoe UI", Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textRadius = radius + 85;
        const chars = name.toUpperCase().split('');
        const arcSpan = Math.PI * 0.6;
        const n = chars.length;
        const angleIncrement = n > 1 ? arcSpan / (n - 1) : 0;
        const start = Math.PI / 2 + arcSpan / 2;

        for (let i = 0; i < n; i++) {
            const angle = start - i * angleIncrement;
            const tx = centerX + Math.cos(angle) * textRadius;
            const ty = centerY + Math.sin(angle) * textRadius;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angle - Math.PI / 2);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText(chars[i], 0, 0);
            ctx.fillText(chars[i], 0, 0);
            ctx.restore();
        }

        // ==========================================
        // 4. Badges
        // ==========================================
        // Blue Tick
        ctx.drawImage(blueTick, centerX + radius + 10, centerY - 35, 70, 70);

        // Crown
        if (crown) {
            ctx.save();
            ctx.translate(centerX + radius * 0.7, centerY - radius * 0.8);
            ctx.rotate(0.3);
            ctx.drawImage(crown, -70, -70, 140, 140);
            ctx.restore();
        }

        // Leaf
        if (leaf) {
            ctx.save();
            ctx.translate(centerX - radius * 0.6, centerY - radius * 0.7);
            ctx.rotate(-0.5);
            ctx.drawImage(leaf, -50, -50, 100, 100);
            ctx.restore();
        }

        // ==========================================
        // 5. Watermark
        // ==========================================
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('© RzkyADS', 1060, 1060);

        const finalBuffer = await canvas.encode('png');

        await sock.sendMessage(
            m.chat,
            {
                image: finalBuffer,
                caption:
                    `👨‍💻 *FAKE DEVELOPER 7*\n\n` +
                    `👤 Nama:\n${name}\n\n` +
                    `✨ Successfully generated`
            },
            { quoted: m }
        );

        await m.react('✅');

    } catch (error) {
        console.error('[FakeDev7] Error:', error);
        await m.react('❌');
        m.reply(`❌ Terjadi kesalahan saat memproses gambar.\n\n${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};