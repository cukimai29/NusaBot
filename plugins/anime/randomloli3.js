const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'randomloli3',
    alias: ['loli3', 'lolirandom3', 'randomloli'],
    category: 'anime',
    description: 'Random gambar loli dari API',
    usage: '.randomloli3',
    example: '.randomloli3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    m.react('⏳');

    try {
        const { data } = await axios.get('https://api-faa.my.id/faa/loli', {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        console.log('[RandomLoli3] Response:', typeof data, JSON.stringify(data).slice(0, 300));

        let imageUrl = data?.url || data?.result?.url || data?.data?.url || data?.image || data?.result || data?.data;

        if (typeof data === 'string' && data.startsWith('http')) {
            imageUrl = data;
        }

        if (!imageUrl) {
            m.react('❌');
            return m.reply(`❌ *URL tidak ditemukan!*\n\n> Response: ${JSON.stringify(data).slice(0, 200)}`);
        }

        const imageRes = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const imageBuffer = Buffer.from(imageRes.data);

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `🌸 *Random Loli*\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

    } catch (err) {
        console.error('[RandomLoli3] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};