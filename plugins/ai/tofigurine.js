const axios = require('axios');
const { uploadImage } = require('../../src/lib/zerotwo-uploader.js');

const pluginConfig = {
    name: 'tofigure3',
    alias: ['figurine3', 'tofigure3', 'bandai3', 'actionfigure3'],
    category: 'ai',
    description: 'Ubah foto menjadi action figure/figurine koleksi',
    usage: '.tofigure3 (reply/kirim gambar)',
    example: '.tofigure3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
};

const PROMPT = `Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, 
in a realistic style, in a real environment. The figurine is placed on a computer desk. 
The figurine has a round transparent acrylic base, with no text on the base. 
The content on the computer screen is the modeling process of this figurine. 
Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. 
The packaging features two-dimensional flat illustrations.`;

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'));
    
    if (!isImage) {
        return m.reply(
            `🎭 *ᴛᴏ ꜰɪɢᴜʀ 3*\n\n` +
            `> Kirim/reply gambar untuk diubah ke figurine/action figure\n\n` +
            `\`${m.prefix}tofigure3\``
        );
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
        
        // Upload gambar dulu
        const imageUrl = await uploadImage(buffer, 'image.jpg');
        console.log('[ToFigure3] Image URL:', imageUrl);
        
        // Pake API yang support prompt
        const apiUrl = `https://api-faa.my.id/faa/tofigura?url=${encodeURIComponent(imageUrl)}`;
        console.log('[ToFigure3] API URL:', apiUrl);
        
        const res = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 180000, // 3 menit karena proses AI lama
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*, application/json'
            },
            validateStatus: null
        });
        
        console.log('[ToFigure3] Response Status:', res.status);
        
        // Cek status response
        if (res.status !== 200) {
            try {
                const errorData = JSON.parse(res.data.toString());
                console.log('[ToFigure3] Error JSON:', errorData);
                
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
                m.react('❌');
                return m.reply(`❌ *API Error (${res.status})*\n\n> ${res.data.toString().slice(0, 200)}\n\n💡 Coba lagi nanti`);
            }
        }
        
        m.react('✅');
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🎭 *Action Figure / Figurine*\n\n` +
                    `> Prompt: ${PROMPT.slice(0, 100)}...\n\n` +
                    `© RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });
        
    } catch (error) {
        console.error('[ToFigure3] Error:', error.message);
        console.log('[ToFigure3] Error Stack:', error.stack);
        m.react('☢');
        
        let errorMsg = `❌ *Gagal!*\n\n`;
        if (error.code === 'ECONNABORTED') {
            errorMsg += `⏰ *Timeout*\n> Proses AI terlalu lama\n> Coba lagi nanti`;
        } else if (error.response?.status === 500) {
            errorMsg += `🔴 *Server Error (500)*\n\n`;
            errorMsg += `> Server sedang sibuk\n`;
            errorMsg += `> Coba lagi dalam beberapa menit\n\n`;
            errorMsg += `📌 *Tips:*\n`;
            errorMsg += `• Gunakan gambar yang lebih kecil\n`;
            errorMsg += `• Pastikan gambar tidak buram\n`;
            errorMsg += `• Coba dengan gambar lain`;
        } else if (error.message.includes('upload')) {
            errorMsg += `📤 *Upload Error*\n\n`;
            errorMsg += `> Gagal mengupload gambar ke server\n`;
            errorMsg += `> Coba gunakan gambar dengan ukuran lebih kecil`;
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