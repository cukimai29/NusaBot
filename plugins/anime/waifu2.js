const axios = require('axios');


const API_BASE_URL = 'https://www.waifu.im/';


const TAGS = [
    'maid', 'waifu', 'oppai', 'selfies', 'uniform', 'kitsune', 'femboy', 
    'cry', 'baka', 'happy', 'dance', 'smile', 'angry', 'blush', 'kill', 
    'nerd', 'nervous', 'sad', 'shy', 'smug', 'surprised', 'think'
];

const pluginConfig = {
    name: ['waifu', ...TAGS], 
    alias: ['w'],
    category: 'anime',
    description: 'Random gambar waifu dari waifu.im (API Stabil!)',
    usage: `.waifu atau .maid`,
    example: `.waifu\n.maid\n.waifu --nsfw`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true
};

async function handler(m, { sock }) {
    let command = m.command?.toLowerCase();
    
    
    let selectedTag = 'waifu'; 
    if (TAGS.includes(command)) {
        selectedTag = command;
    }

    
    const args = m.text?.split(' ') || [];
    const isNsfw = args.includes('--nsfw') || args.includes('-n');
    const isGif = args.includes('--gif') || args.includes('-g');

    try {
        await m.react('⏳');

        
        const params = {
            included_tags: selectedTag,
            is_nsfw: isNsfw,
            gif: isGif,
            
            limit: 2
        };

        
        const { data } = await axios.get(`${API_BASE_URL}/images`, { 
            params,
            headers: {
                'Accept': 'application/json'
            }
        });

        
        if (!data.images || data.images.length === 0) {
            return m.reply(`❌ Tidak ada gambar untuk tag *${selectedTag}*. Coba tag lain!`);
        }

        const image = data.images[0];
        const imageUrl = image.url;

        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎀 *Waifu.im Gallery*\n` +
                    `> Tag: *${selectedTag}*\n` +
                    `> NSFW: ${isNsfw ? '✅' : '❌'}\n` +
                    `> GIF: ${isGif ? '✅' : '❌'}\n` +
                    `> Source: [waifu.im](${image.source})`,
        }, { quoted: m });

        await m.react('✨');

    } catch (err) {
        console.error('Waifu.im Error:', err);
        
        
        return m.reply(`❌ *Error!*\n> ${err.response?.data?.message || err.message || 'Gagal mengambil gambar'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};