const axios = require('axios');
const { uploadImage } = require('../../src/lib/zerotwo-uploader.js');
const { f } = require('../../src/lib/zerotwo-http.js');
const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'tofigure',
    alias: ['figure', 'figurestyle'],
    category: 'ai',
    description: 'Ubah gambar ke style Figure/Action',
    usage: '.tofigure (reply gambar)',
    example: '.tofigure',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage');
    
    if (!isImage) {
        return m.reply(`🎭 *ꜰɪɢᴜʀᴇ sᴛʏʟᴇ*\n\n> Kirim/reply gambar untuk diubah ke style Figure\n\n\`${m.prefix}tofigure\``);
    }
    
    m.react('🕕');
    try {
        let buffer;
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }
        
        if (!buffer) {
            m.react('❌');
            return m.reply(`❌ Gagal mendownload gambar`);
        }
        
        const imageUrl = await uploadImage(buffer, 'image.jpg');
        console.log('[ToFigure] Image URL:', imageUrl);
        
        // Coba test API dulu
        const apiUrl = `https://api-faa.my.id/faa/tofigura?url=${encodeURIComponent(imageUrl)}`;
        console.log('[ToFigure] API URL:', apiUrl);
        
        const res = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*, application/json'
            },
            validateStatus: null // Biar gak throw error
        });
        
        console.log('[ToFigure] Response Status:', res.status);
        console.log('[ToFigure] Response Headers:', res.headers);
        
        // Cek status response
        if (res.status !== 200) {
            // Coba parse JSON error
            try {
                const errorData = JSON.parse(res.data.toString());
                console.log('[ToFigure] Error JSON:', errorData);
                
                let errorMsg = `❌ *API Error (${res.status})*\n\n`;
                if (errorData.message) errorMsg += `Message: ${errorData.message}\n`;
                if (errorData.error) errorMsg += `Error: ${errorData.error}\n`;
                errorMsg += `\n💡 *Solusi:*\n`;
                errorMsg += `1. Coba gunakan gambar dengan ukuran lebih kecil\n`;
                errorMsg += `2. Pastikan gambar jelas dan terang\n`;
                errorMsg += `3. Coba lagi nanti (API mungkin maintenance)`;
                
                m.react('❌');
                return m.reply(errorMsg);
            } catch (e) {
                // Kalo bukan JSON
                m.react('❌');
                return m.reply(`❌ *API Error (${res.status})*\n\n> ${res.data.toString().slice(0, 200)}\n\n💡 Coba lagi nanti`);
            }
        }
        
        m.react('✅');
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🎭 *Figure Style*\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });
        
    } catch (error) {
        console.error('[ToFigure] Error:', error.message);
        console.log('[ToFigure] Error Stack:', error.stack);
        m.react('☢');
        
        // Kasih pesan error yang lebih informatif
        let errorMsg = `❌ *Gagal!*\n\n`;
        if (error.code === 'ECONNABORTED') {
            errorMsg += `⏰ *Timeout*\n> API terlalu lama merespon\n> Coba lagi nanti`;
        } else if (error.response?.status === 500) {
            errorMsg += `🔴 *Server Figure AI Error (500)*\n\n`;
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