const config = {
    name: 'kappaupload',
    alias: ['kappa', 'upload'],
    category: 'tools',
    description: 'Upload file/image ke kappa.lol',
    usage: '.upload <path file> atau reply gambar',
    example: '.upload ./images/avatar.jpg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = "https://kappa.lol/api/upload";

async function uploadToKappa(filePath) {
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        return {
            success: false,
            error: "File tidak ditemukan"
        };
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(resolvedPath), {
        filename: path.basename(resolvedPath)
    });

    try {
        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (Chrome/147.0.0.0 Mobile Safari/537.36",
                "Accept": "*/*",
                "Origin": "https://kappa.lol",
                "Referer": "https://kappa.lol/"
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true
        });

        const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
        const url = data?.link || null;

        return {
            success: Boolean(url),
            url: url,
            statusCode: response.status
        };

    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
}

async function handler(m, { sock }) {
    try {
        const args = m.text.split(' ').slice(1);
        let filePath = args[0];
        let isFromQuoted = false;

        if (!filePath && m.quoted && m.quoted.message?.imageMessage) {
            await m.reply('⏳ Mengunduh gambar...');
            
            const media = await m.quoted.download();
            const tempDir = path.join(__dirname, '../../temp');
            
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const tempPath = path.join(tempDir, `temp_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, media);
            filePath = tempPath;
            isFromQuoted = true;
        }

        if (!filePath) {
            return m.reply(`❌ CARA PAKAI\n\n.upload <path file>\natau\nreply gambar lalu ketik .upload`);
        }

        await m.reply('⏳ Mengupload file ke kappa.lol...');

        const result = await uploadToKappa(filePath);

        if (isFromQuoted && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        if (result.success && result.url) {
            await m.reply(`✅ BERHASIL UPLOAD\n\n📎 URL: ${result.url}\n📊 Status Code: ${result.statusCode}`);
        } else {
            await m.reply(`❌ GAGAL UPLOAD\n\n⚠️ Error: ${result.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Kappa Upload Error:', error);
        await m.reply(`❌ ERROR\n\n${error.message}`);
    }
}

module.exports = {
    config,
    handler
}