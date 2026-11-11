const axios = require('axios');
const { uploadImage } = require('../../src/lib/zerotwo-uploader.js');
const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'fakecall',
    alias: ['fakecallwa'],
    category: 'canvas',
    description: 'Membuat gambar fake call WhatsApp',
    usage: '.fakecall <nama> | <durasi>',
    example: '.fakecall Nama | 19.00',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text;
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}fakecall <nama> | <durasi>\`\n\n` +
            `> Contoh: \`${m.prefix}fakecall Marin | 19.00\`\n\n` +
            `💡 *Tips:* Reply gambar untuk custom avatar`
        );
    }
    
    const [nama, durasi] = text.split('|').map(s => s.trim());
    
    if (!nama) {
        return m.reply(`❌ Nama tidak boleh kosong!`);
    }
    
    await m.react('🕕');
    
    try {
        let avatar = 'https://files.catbox.moe/nwvkbt.png';
        
        // Cek apakah ada gambar di reply atau kiriman
        if (m.isImage) {
            try {
                const buffer = await m.download();
                const uploadedUrl = await uploadImage(buffer, 'avatar.jpg');
                if (uploadedUrl) {
                    avatar = uploadedUrl;
                    console.log('[FakeCall] Avatar uploaded from direct image:', avatar);
                }
            } catch (e) {
                console.log('[FakeCall] Failed to upload direct image:', e.message);
            }
        } else if (m.quoted?.isImage) {
            try {
                const buffer = await m.quoted.download();
                const uploadedUrl = await uploadImage(buffer, 'avatar.jpg');
                if (uploadedUrl) {
                    avatar = uploadedUrl;
                    console.log('[FakeCall] Avatar uploaded from quoted image:', avatar);
                }
            } catch (e) {
                console.log('[FakeCall] Failed to upload quoted image:', e.message);
            }
        } else {
            // Coba ambil profile picture
            try {
                avatar = await sock.profilePictureUrl(m.sender, 'image');
                console.log('[FakeCall] Using profile picture');
            } catch (e) {
                console.log('[FakeCall] Failed to get profile picture:', e.message);
            }
        }
        
        const apiUrl = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(nama)}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(avatar)}`;
        console.log('[FakeCall] API URL:', apiUrl);
        
        // Download dari API
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            validateStatus: null
        });
        
        if (response.status !== 200) {
            console.log('[FakeCall] API Error:', response.status);
            m.react('❌');
            return m.reply(`❌ *API Error (${response.status})*\n\n> Gagal membuat fake call\n> Coba lagi nanti`);
        }
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `📞 *Fake Call WhatsApp*\n\n` +
                    `👤 Nama: ${nama}\n` +
                    `⏱️ Durasi: ${durasi}\n\n` +
                    `> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });
        
        m.react('📞');
        
    } catch (err) {
        console.error('[FakeCall] Error:', err.message);
        console.log('[FakeCall] Error Stack:', err.stack);
        m.react('☢');
        
        let errorMsg = `❌ *Gagal!*\n\n`;
        if (err.code === 'ECONNABORTED') {
            errorMsg += `⏰ *Timeout*\n> API terlalu lama merespon\n> Coba lagi nanti`;
        } else if (err.response?.status === 404) {
            errorMsg += `🔍 *API Not Found*\n> Endpoint tidak ditemukan\n> Cek kembali URL API`;
        } else if (err.response?.status === 500) {
            errorMsg += `🔴 *Server Error (500)*\n\n`;
            errorMsg += `> Server sedang bermasalah\n`;
            errorMsg += `> Coba lagi nanti`;
        } else if (err.message.includes('upload')) {
            errorMsg += `📤 *Upload Error*\n\n`;
            errorMsg += `> Gagal mengupload avatar\n`;
            errorMsg += `> Coba gunakan gambar dengan ukuran lebih kecil`;
        } else {
            errorMsg += `> ${err.message}`;
        }
        
        return m.reply(errorMsg);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};