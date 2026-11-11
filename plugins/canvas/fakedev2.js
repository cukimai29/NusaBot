const axios = require('axios');
const { uploadImage } = require('../../src/lib/zerotwo-uploader.js');

const pluginConfig = {
    name: 'fakedev2',
    alias: ['fd2'],
    category: 'canvas',
    description: 'Membuat fake developer profile card',
    usage: '.fakedev2 <nama> (reply gambar)',
    example: '.fakedev2 RzkyADS',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const body = m.body || m.text || '';
    const name = body.trim().split(' ').slice(1).join(' ');

    if (!name) {
        return m.reply(
            `🎮 *FAKE DEVELOPER 2*\n\n` +
            `Masukkan nama profile\n\n` +
            `Contoh:\n${pluginConfig.example}\n\n` +
            `📌 Cara pakai:\n` +
            `• Kirim foto + caption\n` +
            `• Reply foto dengan command`
        );
    }

    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage');

    if (!isImage) {
        return m.reply(
            `🎮 *FAKE DEVELOPER 2*\n\n` +
            `Masukkan nama profile dan gambar\n\n` +
            `Contoh:\n${pluginConfig.example}\n\n` +
            `📌 Cara pakai:\n` +
            `• Kirim foto + caption\n` +
            `• Reply foto dengan command`
        );
    }

    await m.react('⏳');

    try {
        let buffer;

        // ===== AMBIL GAMBAR =====
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }

        if (!buffer) {
            await m.react('❌');
            return m.reply(`❌ Gagal mendownload gambar`);
        }

        // ===== UPLOAD GAMBAR =====
        const imageUrl = await uploadImage(buffer, 'image.jpg');
        console.log('[FakeDev2] Image URL:', imageUrl);

        if (!imageUrl) {
            await m.react('❌');
            return m.reply('❌ Upload gambar gagal\n\nCoba kirim ulang dengan gambar yang lebih kecil');
        }

        // ===== API FAKE DEVELOPER 2 (BUKAN TOFIGURE) =====
        const apiUrl = `https://api.ourin.my.id/api/fake-developer-2?text=${encodeURIComponent(name)}&image=${encodeURIComponent(imageUrl)}`;
        console.log('[FakeDev2] API URL:', apiUrl);

        let res;
        try {
            res = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*, application/json'
                },
                validateStatus: null
            });

            console.log('[FakeDev2] Response Status:', res.status);
        } catch (e) {
            console.log('[FakeDev2] API error:', e.message);
            
            // ===== FALLBACK: BASE64 =====
            console.log('[FakeDev2] Fallback ke Base64...');
            const imageBase64 = buffer.toString('base64');
            const base64Url = `https://api.ourin.my.id/api/fake-developer-2?text=${encodeURIComponent(name)}&image=base64:${imageBase64}`;
            
            try {
                res = await axios.get(base64Url, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*, application/json'
                    },
                    validateStatus: null
                });
                console.log('[FakeDev2] Base64 Response Status:', res.status);
            } catch (e2) {
                console.log('[FakeDev2] Base64 error:', e2.message);
                await m.react('❌');
                return m.reply(`❌ *Gagal!*\n\n> ${e2.message}\n\n💡 Coba lagi nanti`);
            }
        }

        // ===== CEK RESPONSE =====
        if (res.status !== 200) {
            try {
                const errorData = JSON.parse(res.data.toString());
                console.log('[FakeDev2] Error JSON:', errorData);
                
                let errorMsg = `❌ *API Error (${res.status})*\n\n`;
                if (errorData.message) errorMsg += `Message: ${errorData.message}\n`;
                if (errorData.error) errorMsg += `Error: ${errorData.error}\n`;
                errorMsg += `\n💡 *Solusi:*\n`;
                errorMsg += `1. Coba gunakan gambar dengan ukuran lebih kecil\n`;
                errorMsg += `2. Pastikan gambar jelas dan terang\n`;
                errorMsg += `3. Coba lagi nanti (API mungkin maintenance)`;
                
                await m.react('❌');
                return m.reply(errorMsg);
            } catch (e) {
                await m.react('❌');
                return m.reply(`❌ *API Error (${res.status})*\n\n> ${res.data.toString().slice(0, 200)}\n\n💡 Coba lagi nanti`);
            }
        }

        // ===== SEND HASIL =====
        await m.react('✅');

        await sock.sendMessage(
            m.chat,
            {
                image: Buffer.from(res.data),
                caption:
                    `👨‍💻 *FAKE DEVELOPER 2*\n\n` +
                    `👤 Nama:\n${name}\n\n` +
                    `✨ Successfully generated`
            },
            { quoted: m }
        );

    } catch (error) {
        console.error('[FakeDev2] Error:', error.message);
        await m.react('❌');

        let errorMsg = `❌ *Gagal!*\n\n`;
        if (error.code === 'ECONNABORTED') {
            errorMsg += `⏰ *Timeout*\n> API terlalu lama merespon\n> Coba lagi nanti`;
        } else if (error.response?.status === 500) {
            errorMsg += `🔴 *Server Error (500)*\n\n`;
            errorMsg += `> Server tujuan sedang bermasalah\n`;
            errorMsg += `> Kemungkinan API sedang maintenance\n`;
            errorMsg += `> Coba lagi dalam beberapa menit\n\n`;
            errorMsg += `📌 *Tips:*\n`;
            errorMsg += `• Gunakan gambar yang lebih kecil\n`;
            errorMsg += `• Pastikan gambar tidak buram\n`;
            errorMsg += `• Coba dengan gambar lain`;
        } else {
            errorMsg += `> ${error.message}`;
        }

        m.reply(errorMsg);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};