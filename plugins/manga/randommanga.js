const config = require('../../config')
const fs = require("fs")
const axios = require('axios')

// ============ DAFTAR 200+ MANGA CHARACTER ============
const mangaCommands = [
    // ===== BERSERK =====
    'guts', 'griffith', 'casca', 'skullknight', 'zodd', 'schierke', 'farnese',
    'serpico', 'isidro', 'puck', 'ganishka', 'void', 'ubik', 'slan', 'conrad',
    
    // ===== ONE PIECE =====
    'luffy', 'zoro', 'nami', 'usopp', 'sanji', 'chopper', 'robin', 'franky',
    'brook', 'jinbe', 'shanks', 'mihawk', 'crocodile', 'doflamingo', 'katakuri',
    'ace', 'sabo', 'whitebeard', 'roger', 'oden', 'yamato', 'kaido', 'bigmom',
    'blackbeard', 'akainu', 'aokiji', 'kizaru', 'fujitora', 'rayleigh', 'garp',
    'sengoku', 'law', 'kid', 'killer', 'hancock', 'vivi', 'rebecca', 'shirahoshi',
    'perona', 'boa', 'ivankov', 'kuma', 'jinbe', 'noland', 'calgara',
    
    // ===== NARUTO =====
    'naruto', 'sasuke', 'sakura', 'kakashi', 'itachi', 'madara', 'minato',
    'hinata', 'neji', 'rocklee', 'guy', 'gaara', 'shikamaru', 'temari',
    'kankuro', 'orochimaru', 'tsunade', 'jiraiya', 'pain', 'konan', 'obito',
    'shisui', 'danzo', 'hashirama', 'tobirama', 'hiruzen', 'sarada', 'boruto',
    'mitsuki', 'kawaki', 'himawari', 'nagato', 'kisame', 'deidara', 'sasori',
    'hidan', 'kakuzu', 'zabuza', 'haku', 'kimimaro', 'kabuto', 'anko',
    
    // ===== JUJUTSU KAISEN =====
    'gojo', 'yuji', 'megumi', 'nobara', 'sukuna', 'geto', 'toji', 'nanami',
    'okotsu', 'meimei', 'kento', 'yuki', 'choso', 'mahito', 'hanami', 'jogo',
    'dagon', 'uraume', 'higuruma', 'takaba', 'kashimo', 'hakari', 'kirara',
    
    // ===== ATTACK ON TITAN =====
    'eren', 'mikasa', 'armin', 'levi', 'hanji', 'erwin', 'jean', 'connie',
    'sasha', 'historia', 'ymir', 'annie', 'reiner', 'bertholdt', 'zeke',
    'falco', 'gabi', 'pieck', 'porco', 'grisha', 'carla', 'kruger', 'kaya',
    'faye', 'karl', 'frieda', 'uri', 'rod', 'colt', 'udo', 'zofia',
    
    // ===== KIMETSU NO YAIBA =====
    'tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'giyu', 'shinobu', 'kyojuro',
    'mitsuri', 'obanai', 'gyomei', 'sanemi', 'muichiro', 'akaza', 'kokushibo',
    'douma', 'muzan', 'tamayo', 'yushiro', 'genya', 'kanao', 'rengoku',
    'shinobu', 'kanae', 'kaigaku', 'gyutaro', 'daki', 'hantengu', 'gyokko',
    'zohakuten', 'nakime', 'maiden', 'asakusa', 'ubuyashiki', 'kagaya',
    
    // ===== MY HERO ACADEMIA =====
    'deku', 'bakugo', 'shoto', 'allmight', 'endeavor', 'hawks', 'mirko',
    'ochaco', 'iida', 'tsuyu', 'kirishima', 'kaminari', 'jirou', 'momo',
    'todoroki', 'toga', 'shigaraki', 'dabi', 'overhaul', 'gentle', 'laundry',
    'erasure', 'midnight', 'presentmic', 'aizawa', 'allforone', 'gigantomachia',
    'twice', 'mrcompress', 'spinner', 'magne', 'compress',
    
    // ===== DEMON SLAYER (TAMBAHAN) =====
    'tanjiro', 'nezuko', 'zenitsu', 'inosuke',
    
    // ===== DEATH NOTE =====
    'light', 'l', 'misa', 'ryuk', 'near', 'mello', 'matt', 'watari',
    'rem', 'soichiro', 'matsuda', 'aizawa', 'mogi', 'ide', 'kibayashi',
    
    // ===== TOKYO REVENGERS =====
    'takemichi', 'mikey', 'draken', 'hina', 'chifuyu', 'baji', 'kisaki',
    'hanma', 'kazuya', 'keisuke', 'smiley', 'angry', 'pah', 'peh', 'kazutora',
    'mucho', 'sanzu', 'inui', 'koko', 'wakasa', 'benkei', 'izana', 'shion',
    'mochi', 'kakucho', 'kurokawa', 'tetta', 'yuzuha', 'senju', 'takeomi',
    
    // ===== HUNTER X HUNTER =====
    'gon', 'killua', 'kurapika', 'leorio', 'hisoka', 'chrollo', 'netero',
    'meruem', 'pitou', 'pouf', 'youpi', 'kaluto', 'shizuku', 'feitan',
    'nobunaga', 'machi', 'phinks', 'pakunoda', 'shalnark', 'uvogin',
    'ging', 'pariston', 'cheadle', 'bisky', 'hanzo', 'kite',
    
    // ===== BLEACH =====
    'ichigo', 'rukia', 'renji', 'byakuya', 'kenpachi', 'toshiro', 'hitsugaya',
    'yoruichi', 'soifon', 'urahara', 'gin', 'tosen', 'aizen', 'vizard',
    'isshin', 'masaki', 'ryuken', 'ywhach', 'jugram', 'haschwalth', 'bazzb',
    'gremmy', 'lille', 'pernida', 'askin', 'gerard', 'bambietta', 'candice',
    
    // ===== GINTAMA =====
    'gintoki', 'shinpachi', 'kagura', 'okita', 'hijikata', 'kondo', 'otose',
    'catherine', 'tama', 'takasugi', 'katsura', 'sakamoto', 'mutsu',
    'kamui', 'abuto', 'umibozu', 'sarutobi', 'zenzo', 'jiraia',
    
    // ===== FULLMETAL ALCHEMIST =====
    'edward', 'alphonse', 'winry', 'roy', 'rizahawkeye', 'scar', 'ling',
    'lanfan', 'may', 'vanhohenheim', 'dante', 'father', 'pride', 'wrath',
    'gluttony', 'greed', 'sloth', 'lust', 'envy',
    
    // ===== CHAINSAW MAN =====
    'denji', 'power', 'makima', 'aki', 'kishibe', 'reze', 'quanxi',
    'katana', 'angel', 'beam', 'prinz', 'galgali', 'kobeni', 'asamiya',
    'yoru', 'asa', 'famine', 'death', 'nayuta', 'bucky',
    
    // ===== SPY X FAMILY =====
    'anya', 'yor', 'loid', 'bond', 'franky', 'damian', 'becky', 'sherwood',
    'henry', 'yelena', 'olka', 'fiona', 'nightfall', 'daybreak',
    
    // ===== OSHI NO KO =====
    'aqua', 'ruby', 'kana', 'akai', 'melt', 'frill', 'yuki', 'kyun',
    'gotanda', 'pieyon', 'miyako', 'ichigo', 'saitou', 'airi',
    
    // ===== ONE PUNCH MAN =====
    'saitama', 'garou', 'genos', 'tornado', 'fubuki', 'king', 'metalbat',
    'watchdog', 'flash', 'atomic', 'silverfang', 'childemperor', 'zombieman',
    'sweetmask', 'piggod', 'driveknight', 'blast', 'boros', 'homeless',
    
    // ===== JOJO'S BIZARRE ADVENTURE =====
    'jojo', 'dio', 'jonathan', 'joseph', 'jotaro', 'josuke', 'giorno',
    'jolyne', 'johnny', 'gappy', 'will', 'speedwagon', 'straizo', 'caesar',
    'kars', 'esidisi', 'wamuu', 'holhorse', 'kakyoin', 'polnareff',
    'avdol', 'iggy', 'koichi', 'rohan', 'kira', 'yoshikage', 'diablo',
    
    // ===== DAN KARAKTER LAINNYA =====
    'goku', 'vegeta', 'gohan', 'trunks', 'piccolo', 'frieza', 'cell', 'buu',
    'nami', 'robin', 'chopper', 'brook', 'jinbe', 'franky'
]

// ============ ALIAS ============
const aliases = {
    // One Piece
    'monkey': 'luffy', 'roronoa': 'zoro', 'catwoman': 'nami', 'pirateking': 'roger',
    'strawhat': 'luffy', 'mosshead': 'zoro', 'tanuki': 'chopper',
    
    // Naruto
    'uzumaki': 'naruto', 'uchiha': 'itachi', 'kakashi': 'kakashi',
    'orange': 'naruto', 'emofox': 'naruto',
    
    // Jujutsu
    'satoru': 'gojo', 'itadori': 'yuji', 'fushiguro': 'megumi', 'ryomen': 'sukuna',
    'kingofcurses': 'sukuna', 'limbo': 'gojo',
    
    // AOT
    'jaeger': 'eren', 'ackerman': 'mikasa', 'captain': 'levi', 'humanity': 'levi',
    'surveycorps': 'eren', 'colossal': 'bertholdt',
    
    // Kimetsu
    'kamado': 'tanjiro', 'flower': 'shinobu', 'flame': 'rengoku', 'insect': 'shinobu',
    'boar': 'inosuke', 'zen': 'zenitsu',
    
    // MHA
    'midoriya': 'deku', 'explosion': 'bakugo', 'icyhot': 'shoto', 'symbol': 'allmight',
    'eraser': 'aizawa', 'handyman': 'overhaul',
    
    // Death Note
    'kira': 'light', 'l': 'l', 'apple': 'ryuk',
    
    // Tokyo Revengers
    'mikey': 'mikey', 'draken': 'draken',
    
    // HxH
    'gon': 'gon', 'killua': 'killua',
    
    // Bleach
    'ichigo': 'ichigo', 'rukia': 'rukia',
    
    // CSM
    'chainsaw': 'denji', 'blood': 'power', 'control': 'makima',
    
    // Spy x Family
    'waku': 'anya', 'assassin': 'yor', 'agent': 'loid',
    
    // Oshi no Ko
    'aquamarine': 'aqua', 'ruby': 'ruby',
    
    // OPM
    'bald': 'saitama', 'hero': 'saitama', 'monster': 'garou',
    
    // Jojo
    'jonathan': 'jojo', 'jotaro': 'jotaro', 'giorno': 'giorno',
    
    // Dragon Ball
    'kakarot': 'goku', 'prince': 'vegeta'
}

// ============ KONFIGURASI ============
const pluginConfig = {
    name: mangaCommands,
    alias: Object.keys(aliases),
    category: 'manga',
    description: 'Random gambar karakter manga favoritmu (200+ karakter!)',
    usage: `.${mangaCommands[0]} atau .${mangaCommands[1]}`,
    example: `.guts\n.denji\n.goku\n.saitama`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

// ============ API ============
const MANGA_API = {
    // API Anime/Manga
    waifu: 'https://www.waifu.im/',
    nekos: 'https://nekos.life/api/v2/img/',
    
    // Manga specific API (kalo ada)
    manga: 'https://api.mangadex.org/',
    
    // Backup
    backup: 'https://api.waifu.pics/sfw/waifu'
}

// ============ FUNGSI UTAMA ============
async function handler(m, { sock }) {
    let command = m.command?.toLowerCase()
    
    // Cek alias
    if (aliases[command]) {
        command = aliases[command]
    }
    
    // Validasi command
    if (!mangaCommands.includes(command)) {
        const total = mangaCommands.length
        return m.reply(
            `📚 *ᴍᴀɴɢᴀ ɢᴀʟʟᴇʀʏ*\n\n` +
            `> Tersedia *${total}+* karakter manga!\n` +
            `> Contoh: \`${m.prefix}guts\`, \`${m.prefix}denji\`, \`${m.prefix}goku\`\n\n` +
            `📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
            `${mangaCommands.slice(0, 30).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
            `_dan ${total - 30} command lainnya_\n\n` +
            `🌟 *Favorit:* .guts .denji .goku .saitama .gon`
        )
    }
    
    try {
        await m.react('📚')
        let imageUrl = null
        
        // ============ AMBIL GAMBAR ============
        try {
            // Coba pake waifu.pics dulu
            const { data } = await axios.get(`${MANGA_API.waifu}waifu`)
            imageUrl = data.url
        } catch(e) {
            try {
                // Fallback ke nekos.life
                const { data } = await axios.get(`${MANGA_API.nekos}waifu`)
                imageUrl = data.url
            } catch(err) {
                // Last resort: random image dari picsum
                const randomId = Math.floor(Math.random() * 1000)
                imageUrl = `https://picsum.photos/seed/${command}${randomId}/800/800`
            }
        }
        
        if (!imageUrl) {
            throw new Error('Gambar tidak ditemukan')
        }
        
        // ============ KIRIM PESAN ============
        const cmdName = command.charAt(0).toUpperCase() + command.slice(1)
        const totalChars = mangaCommands.length
        
        // Cari kategori manga
        let category = 'Manga'
        const categories = {
            'berserk': 'Berserk',
            'onepiece': 'One Piece',
            'naruto': 'Naruto',
            'jujutsu': 'Jujutsu Kaisen',
            'attackontitan': 'Attack on Titan',
            'kimetsu': 'Demon Slayer',
            'myhero': 'My Hero Academia',
            'deathnote': 'Death Note',
            'tokyorevengers': 'Tokyo Revengers',
            'hunter': 'Hunter x Hunter',
            'bleach': 'Bleach',
            'gintama': 'Gintama',
            'fullmetal': 'Fullmetal Alchemist',
            'chainsawman': 'Chainsaw Man',
            'spyxfamily': 'Spy x Family',
            'oshinoko': 'Oshi no Ko',
            'onepunchman': 'One Punch Man',
            'jojo': "JoJo's Bizarre Adventure",
            'dragonball': 'Dragon Ball'
        }
        
        let mangaTitle = 'Manga Character'
        for (let [key, value] of Object.entries(categories)) {
            if (command.includes(key) || key.includes(command)) {
                mangaTitle = value
                break
            }
        }
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `📚 *${cmdName}*\n` +
                    `> *${mangaTitle}*\n` +
                    `> *ʀᴀɴᴅᴏᴍ ᴍᴀɴɢᴀ ɢᴀʟʟᴇʀʏ*\n` +
                    `> *Total Karakter:* ${totalChars}+`,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `📖 ${cmdName}`,
                    body: `${totalChars}+ Manga Characters`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: fs.existsSync('./assets/images/manga-thumb.jpg') ? 
                               fs.readFileSync('./assets/images/manga-thumb.jpg') : null,
                    sourceUrl: 'https://github.com/',
                }
            }
        }, { quoted: m })
        
        await m.react('📖')
        
    } catch (err) {
        console.error('Manga Image Error:', err)
        
        // ============ HANDLE ERROR ============
        try {
            const { data } = await axios.get('https://api.waifu.pics/sfw/waifu')
            await sock.sendMessage(m.chat, {
                image: { url: data.url },
                caption: `📚 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n\n> *ʀᴀɴᴅᴏᴍ ᴍᴀɴɢᴀ ɢᴀʟʟᴇʀʏ*\n> *Source:* Fallback API`
            }, { quoted: m })
            await m.react('📖')
            return
        } catch(e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Karakter *${command}* tidak ditemukan\n> Coba command lain ya!\n\n📋 *Contoh:* .guts, .denji, .goku`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}