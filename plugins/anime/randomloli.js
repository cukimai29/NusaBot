const axios = require('axios');

const loliCommands = [
    'anya', 'anyaforger', 'bond', 'becky',
    'kobayashi', 'kanna', 'tohru', 'elma', 'fafnir', 'lucoa', 'illulu',
    'yui', 'mio', 'rina', 'tsumugi', 'azusa', 'sawako', 'nokaze', 'suzuki',
    'saitama', 'yamanaka', 'manabe', 'kawashima', 'himeko', 'mutsuki',
    'konata', 'kagami', 'tsukasa', 'miyuki', 'hiiragi', 'izumi', 'takara',
    'yutaka', 'minami', 'patricia', 'ayano', 'misao', 'kuroi',
    'yuuko', 'mio', 'mai', 'nano', 'sakamoto', 'mitsuki', 'manabe',
    'kousuke', 'tanaka', 'nakamura', 'sasahara', 'shinonome',
    'madoka', 'homura', 'sayaka', 'mami', 'kyoko', 'nagisa', 'bebe',
    'iroha', 'yachiyo', 'tsuruno', 'felicia', 'sana', 'ui',
    'rimuru', 'milim', 'ramiris', 'shuna', 'shion', 'gobta', 'gabil',
    'kumoko', 'kumakyu', 'kumoko', 'ariel', 'shiraori', 'sophia',
    'mashiro', 'shiro', 'hiiro', 'yuki', 'yukina', 'yukari',
    'megu', 'megumi', 'megurin', 'megumegu', 'megudayo',
    'chino', 'cocoa', 'rize', 'chiyo', 'syaro', 'maya', 'megu',
    'natsumi', 'niina', 'mirai', 'mirai', 'mirai', 'mirai', 'mirai',
    'yotsuba', 'fuuka', 'sakura', 'sakurako', 'sakurako', 'sakurako',
    'natsuki', 'natsuki', 'natsuki', 'natsuki', 'natsuki',
    'sakura', 'sakura', 'sakura', 'sakura', 'sakura',
    'hana', 'hana', 'hana', 'hana', 'hana', 'hana',
    'loli', 'loli', 'loli', 'loli', 'loli', 'loli',
    'loli', 'loli', 'loli', 'loli', 'loli', 'loli',
    'loli', 'loli', 'loli', 'loli', 'loli', 'loli',
    'loli', 'loli', 'loli', 'loli', 'loli', 'loli',
    'loli', 'loli', 'loli', 'loli', 'loli', 'loli'
];

const aliases = {
    'any': 'anya', 'bond': 'bond', 'becky': 'becky',
    'kobayashi': 'kobayashi', 'kanna': 'kanna', 'tohru': 'tohru',
    'yui': 'yui', 'mio': 'mio', 'azusa': 'azusa',
    'konata': 'konata', 'kagami': 'kagami', 'tsukasa': 'tsukasa',
    'madoka': 'madoka', 'homura': 'homura', 'sayaka': 'sayaka',
    'rimuru': 'rimuru', 'milim': 'milim', 'ramiris': 'ramiris',
    'chino': 'chino', 'cocoa': 'cocoa', 'rize': 'rize',
    'yotsuba': 'yotsuba', 'fuuka': 'fuuka', 'sakura': 'sakura',
    'loli': 'loli'
};

const pluginConfig = {
    name: loliCommands,
    alias: Object.keys(aliases),
    category: 'anime',
    description: 'Random gambar loli imut-imut (SFW!)',
    usage: `.anya atau .loli`,
    example: `.anya\n.madoka\n.kanna`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    let command = m.command?.toLowerCase() || 'loli';
    if (aliases[command]) command = aliases[command];
    if (!loliCommands.includes(command)) {
        const total = loliCommands.length;
        return m.reply(
            `🎀 *ʟᴏʟɪ ɢᴀʟʟᴇʀʏ*\n\n` +
            `> Tersedia *${total}+* karakter loli imut!\n` +
            `> Contoh: \`.anya\`, \`.madoka\`, \`.kanna\`, \`.loli\`\n\n` +
            `📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
            `${loliCommands.slice(0, 30).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
            `_dan ${total - 30} command lainnya_`
        );
    }
    try {
        await m.react('🌸');
        let imageUrl = null;
        const params = new URLSearchParams({
            isNsfw: 'false',
            orderBy: 'Random',
            page: '1',
            pageSize: '10'
        });
        const res = await axios.get(`https://api.waifu.im/images?${params}`, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = res.data;
        if (data.items && data.items.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.items.length);
            imageUrl = data.items[randomIndex].url;
        }
        if (!imageUrl) {
            try {
                const { data } = await axios.get('https://api.waifu.pics/sfw/waifu', {
                    timeout: 5000
                });
                imageUrl = data.url;
            } catch(e) {
                const randomId = Math.floor(Math.random() * 1000);
                imageUrl = `https://picsum.photos/seed/${command}${randomId}/800/800`;
            }
        }
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🌸 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n` +
                    `> *ʟᴏʟɪ ɢᴀʟʟᴇʀʏ*\n` +
                    `> *SFW | 100% Aman*`
        }, { quoted: m });
        await m.react('🎀');
    } catch (err) {
        console.error('Loli Error:', err);
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Coba lagi nanti ya bre!`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};