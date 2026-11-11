const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'anime-gen',
    alias: ['animegen', 'aianime', 'genanime'],
    category: 'ai',
    description: 'Generate AI anime art dari prompt',
    usage: '.anime-gen <prompt>',
    example: '.anime-gen girl, vibrant color, smiling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock, args, text }) {
    try {
        const prompt = text || args?.join(' ') || m.text?.replace(/^\.anime-gen\s*/i, '')?.trim();

        if (!prompt) {
            return await m.reply(
`🎨 *ANIME ART GENERATOR*

Generate gambar anime AI dari prompt!

📌 Cara pakai:
.anime-gen <deskripsi>

📌 Contoh:
.anime-gen cute girl with cat ears, blue hair

📌 Tips:
• Gunakan bahasa Inggris
• Prompt detail = hasil lebih bagus`
            );
        }

        await m.react('🎨');

        // API pollinations (gratis, stabil, no apikey)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', anime style, high quality, detailed, 4k')}`;
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎨 *ANIME ART GENERATED*\n\n📝 Prompt: ${prompt}\n\n⚡ *Powered by Pollinations AI*`,
            mentions: [m.sender]
        });

        await m.react('✅');

    } catch (error) {
        console.error('AnimeGen Error:', error);
        await m.react('❌');
        
        // Fallback API kedua
        try {
            const fallbackUrl = `https://api.ryzendesu.vip/api/ai/animegen?text=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(fallbackUrl, { timeout: 60000 });
            
            if (data && data.url) {
                await sock.sendMessage(m.chat, {
                    image: { url: data.url },
                    caption: `🎨 *ANIME ART GENERATED*\n\n📝 Prompt: ${prompt}\n\n⚡ *Ryzendesu AI*`,
                    mentions: [m.sender]
                });
                await m.react('✅');
                return;
            }
        } catch (e) {
            console.log('Fallback error:', e.message);
        }
        
        await m.reply(`❌ *GAGAL GENERATE*\n\nError: ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};