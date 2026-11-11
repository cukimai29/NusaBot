const axios = require('axios');

const manhwaCommands = [
    // ===== SOLO LEVELING =====
    'sungjinwoo', 'sung', 'jinwoo', 'shadow', 'beru', 'igris', 'tusk', 'iron',
    'chahein', 'hein', 'gohun', 'woojin', 'choi', 'baek', 'thomas', 'andre',
    'liu', 'zhigang', 'siddharth', 'christopher', 'reid', 'antares', 'ashborn',

    // ===== THE BEGINNING AFTER THE END =====
    'arthur', 'grey', 'sylvie', 'reggie', 'virion', 'alacrya', 'elijah', 'nico',
    'tessia', 'caera', 'seris', 'cylrit', 'aldir', 'windsom', 'kordri', 'myre',
    'rahdeas', 'glayder', 'lance', 'varay', 'mica', 'aldis', 'draneeve',

    // ===== TOWER OF GOD =====
    'bam', 'twentyfifth', 'khun', 'rak', 'wraithraiser', 'endorosi', 'androssi',
    'sachi', 'hockney', 'yuri', 'zahard', 'urek', 'mazino', 'hoaqin', 'white',
    'karaka', 'wangnan', 'maschenny', 'jinsung', 'ha', 'kallavan', 'lyborick',
    'adori', 'enryu', 'phantaminum', 'arlen', 'v', 'garam', 'hywa', 'novick',

    // ===== NOBLESSE =====
    'rai', 'raizel', 'frankenstein', 'muzaka', 'ludis', 'gradeus', 'lagus',
    'karias', 'rasta', 'tate', 'tao', 'takeo', 'yuna', 'shinwoo', 'ikhan',
    'seira', 'regis', 'gejutel', 'kentas', 'uziel', 'juraki', 'zarga',

    // ===== THE GAMER =====
    'jihan', 'hanjihan', 'gaia', 'ariel', 'lolikiano', 'zen', 'sodam', 'sena',
    'jaehwan', 'young', 'sungjin', 'shin', 'gajib', 'hyu', 'kwon', 'sooyun',

    // ===== ORV (OMNISCIENT READER) =====
    'kimdokja', 'dokja', 'yoojoonghyuk', 'joonghyuk', 'hansooyoung', 'sooyoung',
    'leegilyoung', 'gilyoung', 'shinysung', 'ysung', 'kanghyunmin', 'hyunmin',
    'uriel', 'dionysus', 'persephone', 'hades', 'bihyung', 'hanmyungoh',
    'namwoon', 'kimnamwoon', 'aba', 'ji', 'sung', 'jh', 'hy', 'sy', 'hsy', 'kdj',

    // ===== THE GOD OF HIGH SCHOOL =====
    'jimori', 'mori', 'daewi', 'mira', 'haneul', 'seungchul', 'taejin', 'pum',
    'jaecheondaeseong', 'monkeyking', 'xiao', 'chen', 'ox', 'dragon', 'tiger',
    'phoenix', 'turtle', 'seo', 'hyeon', 'jin', 'mubong', 'satan', 'vivid',

    // ===== TOWER OF GOD ADDED =====
    'evankhell', 'kell', 'hansung', 'yool', 'amigo', 'daniel', 'khel',

    // ===== BERSERK =====
    'guts', 'griffith', 'casca', 'skullknight', 'zodd', 'schierke', 'farnese',
    'serpico', 'isidro', 'puck', 'ganishka', 'void', 'ubik', 'slan', 'conrad',

    // ===== SECOND LIFE RANKER =====
    'cha', 'yeonwoo', 'phanteon', 'edora', 'irene', 'artemis', 'kronos',
    'prometheus', 'zeus', 'gaia', 'uranus', 'cronus', 'rhea', 'tartarus',

    // ===== THE GREAT MAGE AFTER 4000 YEARS =====
    'lukas', 'trowman', 'lucid', 'freya', 'austin', 'diana', 'sylphid',
    'gnome', 'undine', 'salamander', 'melanthia', 'sienna', 'gray',

    // ===== WIND BREAKER =====
    'jay', 'jo', 'vincent', 'mio', 'shelly', 'dom', 'owen', 'harry', 'cameron',
    'sangho', 'yuna', 'junseok', 'woojin', 'hyun', 'seok', 'jae', 'hein',

    // ===== WEAK HERO =====
    'gray', 'yeon', 'sieun', 'rowan', 'ben', 'alex', 'gerard', 'myles', 'jake',
    'stephen', 'donald', 'mike', 'dean', 'hyeong', 'sang', 'ki', 'jin',

    // ===== ETERNAL REGRESSING KNIGHT =====
    'encrid', 'shirley', 'kargoth', 'baldur', 'gale', 'astrid', 'magnus',

    // ===== RETURN OF THE CRAZY DEMON =====
    'yizaha', 'hyeon', 'jeok', 'nar', 'naru', 'hwang', 'jinyang', 'baek',

    // ===== MYST, MIGHT, MAYHEM =====
    'mok', 'gyeongwoon', 'cheon', 'ma', 'yulia', 'sosuke', 'reina', 'klaus',

    // ===== DEVIL RETURNS TO SCHOOL DAYS =====
    'kimhyunsung', 'hyunsung', 'jaehwa', 'minji', 'young', 'seok', 'jin',

    // ===== HEAVENLY DEMON CANNOT LIVE NORMAL =====
    'romandimitri', 'roman', 'demitri', 'baek', 'joonghyuk', 'kairo', 'philia',

    // ===== VILLAINS ARE DESTINED TO DIE =====
    'penelope', 'eckhart', 'callisto', 'derek', 'ivonne', 'osmond', 'emil',

    // ===== KING'S DAUGHTER =====
    'sanghee', 'yeon', 'soo', 'kyung', 'hwa', 'jinsu', 'sunhee', 'bi', 'chu',

    // ===== GOD BLESS YOU =====
    'shineunhye', 'eunhye', 'yun', 'jay', 'angels', 'demon', 'reaper', 'grim',

    // ===== NANO MACHINE =====
    'cheonyeowoon', 'yeowoon', 'cheon', 'nano', 'sword', 'murim', 'heavenly',

    // ===== REAPER OF THE DRIFTING MOON =====
    'reaper', 'moon', 'monarch', 'ghost', 'blade', 'shadow', 'assassin',

    // ===== LEGEND OF THE NORTHERN BLADE =====
    'northern', 'blade', 'snow', 'ice', 'storm', 'iron', 'steel',

    // ===== POISON DRAGON =====
    'poison', 'dragon', 'viper', 'venom', 'serpent', 'green', 'death',

    // ===== BOSS IN SCHOOL =====
    'boss', 'school', 'gang', 'fighter', 'king', 'street',

    // ===== SWORD MASTER ON ROOF =====
    'roof', 'sword', 'master', 'sky', 'blade', 'storm',

    // ===== ETC CHARACTER =====
    'kim', 'lee', 'park', 'choi', 'jung', 'kang', 'yoon', 'jang', 'lim',
    'han', 'oh', 'shin', 'kwon', 'ko', 'young', 'jin', 'seo', 'hwang',
    'shou', 'hajime', 'maou', 'hero', 'saint', 'lord', 'king', 'queen',
    'prince', 'princess', 'duke', 'count', 'baron', 'knight', 'mage',
    'warrior', 'ranger', 'assassin', 'paladin', 'summoner', 'wizard',
    'swordsman', 'archer', 'thief', 'berserker', 'priest', 'shaman'
];

const aliases = {
    'sjw': 'sungjinwoo', 'sl': 'sungjinwoo', 'jin': 'jinwoo',
    'ar': 'arthur', 'tbate': 'arthur',
    'tog': 'bam', 'baam': 'bam', 'twenty': 'bam',
    'kdj': 'kimdokja', 'orv': 'kimdokja',
    'yoo': 'yoojoonghyuk', 'yjh': 'yoojoonghyuk',
    'sj': 'sungjinwoo', 'hsy': 'hansooyoung',
    'gohs': 'jimori', 'godhs': 'jimori', 'mori': 'jimori',
    'ns': 'rai', 'noblesse': 'rai',
    'tgm': 'lukas', 'tgma': 'lukas',
    'gd': 'shineunhye', 'godbless': 'shineunhye',
    'nano': 'cheonyeowoon', 'machine': 'cheonyeowoon',
    'slr': 'cha', 'rank': 'yeonwoo',
    'berserk': 'guts',
    'myst': 'mok', 'mayhem': 'mok',
    'rom': 'romandimitri', 'hd': 'romandimitri',
    'devil': 'kimhyunsung', 'return': 'kimhyunsung',
    'crazy': 'yizaha', 'mad': 'yizaha',
    'erk': 'encrid', 'eternal': 'encrid',
    'wind': 'jay', 'wb': 'jay',
    'weak': 'gray', 'hero': 'gray',
    'villain': 'penelope', 'vadtd': 'penelope'
};

const pluginConfig = {
    name: manhwaCommands,
    alias: Object.keys(aliases),
    category: 'manhwa',
    description: 'Random gambar karakter Manhwa favoritmu (300+ karakter!)',
    usage: `.sungjinwoo atau .arthur`,
    example: `.sungjinwoo\n.arthur\n.bam\n.kimdokja`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    let command = m.command?.toLowerCase() || 'manhwa';
    if (aliases[command]) command = aliases[command];
    if (!manhwaCommands.includes(command)) {
        const total = manhwaCommands.length;
        return m.reply(
            `📚 *ᴍᴀɴʜᴡᴀ ɢᴀʟʟᴇʀʏ*\n\n` +
            `> Tersedia *${total}+* karakter Manhwa!\n` +
            `> Contoh: \`.sungjinwoo\`, \`.arthur\`, \`.bam\`, \`.kimdokja\`\n\n` +
            `📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
            `${manhwaCommands.slice(0, 30).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
            `_dan ${total - 30} command lainnya_`
        );
    }
    try {
        await m.react('📚');
        let imageUrl = null;
        const apis = [
            'https://api.waifu.pics/sfw/waifu',
            'https://nekos.life/api/v2/img/waifu',
            'https://api.waifu.im/images?isNsfw=false&orderBy=Random&page=1&pageSize=10'
        ];
        for (let api of apis) {
            try {
                const { data } = await axios.get(api, { timeout: 5000 });
                if (data.url) { imageUrl = data.url; break; }
                else if (data.images && data.images.length > 0) {
                    const randomIdx = Math.floor(Math.random() * data.images.length);
                    imageUrl = data.images[randomIdx]?.url;
                    break;
                }
                else if (data.items && data.items.length > 0) {
                    const randomIdx = Math.floor(Math.random() * data.items.length);
                    imageUrl = data.items[randomIdx]?.url;
                    break;
                }
            } catch(e) {}
        }
        if (!imageUrl) {
            const randomId = Math.floor(Math.random() * 1000);
            imageUrl = `https://picsum.photos/seed/${command}${randomId}/800/800`;
        }
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `📚 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n` +
                    `> *ʀᴀɴᴅᴏᴍ ᴍᴀɴʜᴡᴀ ɢᴀʟʟᴇʀʏ*\n` +
                    `> *Total Karakter: ${manhwaCommands.length}+*`
        }, { quoted: m });
        await m.react('🔥');
    } catch (err) {
        console.error('Manhwa Error:', err);
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Coba lagi nanti ya bre!`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};