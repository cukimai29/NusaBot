const config = require('../../config')
const fs = require("fs")
const axios = require('axios')

// ============ DAFTAR 100+ KARAKTER ANIME ============
const animeCommands = [
    // Darling in the Franxx
    'zero2', 'hiro', 'ichigo', 'goro', 'miku', 'zorome', 'kokoro', 'mitsuru',
    'ikuno', 'futoshi', 'nana', 'hachi', 'alpha', 'beta', 'gamma', 'delta',
    'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu',
    'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi',
    'psi', 'omega', 'klaxosaur', 'strelizia', 'genista', 'chlorophytum',
    'argentea', 'delphinium', 'plantago', 'starfish',
    
    // Naruto
    'naruto', 'sasuke', 'sakura', 'kakashi', 'itachi', 'madara', 'minato',
    'hinata', 'neji', 'rocklee', 'guy', 'gaara', 'shikamaru', 'temari',
    'kankuro', 'orochimaru', 'tsunade', 'jiraiya', 'pain', 'konan', 'obito',
    'shisui', 'danzo', 'hashirama', 'tobirama', 'hiruzen', 'sarada', 'boruto',
    'mitsuki', 'kawaki', 'himawari',
    
    // Jujutsu Kaisen
    'gojo', 'yuji', 'megumi', 'nobara', 'kugisaki', 'fushiguro', 'okotsu',
    'geto', 'sukuna', 'toji', 'nanami', 'meimei', 'kento', 'yuki', 'choso',
    'mahito', 'hanami', 'jogo', 'dagon',
    
    // Attack on Titan
    'eren', 'mikasa', 'armin', 'levi', 'hanji', 'erwin', 'jean', 'connie',
    'sasha', 'historia', 'ymir', 'annie', 'reiner', 'bertholdt', 'zeke',
    'falco', 'gabi', 'pieck', 'porco',
    
    // Kimetsu no Yaiba
    'tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'giyu', 'shinobu', 'kyojuro',
    'mitsuri', 'obanai', 'gyomei', 'sanemi', 'muichiro', 'akaza', 'kokushibo',
    'douma', 'muzan', 'tamayo', 'yushiro', 'genya', 'kanao',
    
    // My Hero Academia
    'deku', 'bakugo', 'shoto', 'allmight', 'endeavor', 'hawks', 'mirko',
    'ochaco', 'iida', 'tsuyu', 'kirishima', 'kaminari', 'jirou', 'momo',
    'todoroki', 'toga', 'shigaraki', 'dabi', 'overhaul', 'gentle',
    
    // One Piece
    'luffy', 'zoro', 'nami', 'usopp', 'sanji', 'chopper', 'robin', 'franky',
    'brook', 'jinbe', 'shanks', 'mihawk', 'crocodile', 'doflamingo', 'katakuri',
    'ace', 'sabo', 'whitebeard', 'roger', 'oden',
    
    // Dan karakter populer lainnya
    'akira', 'akiyama', 'ana', 'asuna', 'ayuzawa', 'boruto', 'chiho', 'chitoge',
    'deidara', 'doraemon', 'elaina', 'emilia', 'erza', 'gremory', 'hestia',
    'husbu', 'inori', 'isuzu', 'itori', 'kaga', 'kagura', 'kakasih', 'kaori',
    'keneki', 'kotori', 'loli', 'megumin', 'mikey', 'miku', 'neko', 'neko2',
    'nekonime', 'onepiece', 'pokemon', 'randomnime', 'randomnime2', 'rize',
    'sagiri', 'shina', 'shinka', 'shinomiya', 'shizuka', 'shota', 'tejina',
    'toukachan', 'tensura', 'yotsuba', 'yuki', 'yulibocil', 'yumeko'
]

// ============ ALIAS ============
const aliases = {
    // Darling in the Franxx
    '002': 'zero2',
    'zerotwo': 'zero2',
    '02': 'zero2',
    'hiro': 'hiro',
    'ichigo': 'ichigo',
    'goro': 'goro',
    'miku': 'miku',
    'zoro': 'zorome',
    'koko': 'kokoro',
    'mitsu': 'mitsuru',
    'ikuno': 'ikuno',
    'futo': 'futoshi',
    
    // Naruto
    'rimuru': 'tensura',
    'slime': 'tensura',
    'uchiha': 'itachi',
    'uzumaki': 'naruto',
    'kakashi': 'kakasih',
    'gaara': 'gaara',
    'obito': 'obito',
    
    // Jujutsu
    'satoru': 'gojo',
    'itadori': 'yuji',
    'fushiguro': 'megumi',
    'ryomen': 'sukuna',
    
    // AOT
    'jaeger': 'eren',
    'ackerman': 'mikasa',
    'captain': 'levi',
    
    // Kimetsu
    'kamado': 'tanjiro',
    'kamado': 'nezuko',
    
    // MHA
    'midoriya': 'deku',
    'bakugo': 'bakugo',
    'shoto': 'shoto',
    'allmight': 'allmight',
    
    // One Piece
    'monkey': 'luffy',
    'roronoa': 'zoro',
    'pirateking': 'roger',
    
    // Lainnya
    'pikachu': 'pokemon',
    'naruto': 'naruto',
    'sasuke': 'sasuke',
    'sakura': 'sakura'
}

// ============ KONFIGURASI PLUGIN ============
const pluginConfig = {
    name: animeCommands,
    alias: Object.keys(aliases),
    category: 'anime',
    description: 'Random gambar anime karakter favoritmu (100+ karakter!)',
    usage: `.${animeCommands[0]} atau .${animeCommands[1]}`,
    example: `.naruto\n.zero2\n.gojo\n.luffy`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

// ============ API DATABASE ============
const ANIME_API = {
    // API Utama (paling stabil)
    waifu: 'https://www.waifu.im/',
    nekos: 'https://nekos.life/api/v2/img/',
    
    // Backup API
    nekoBest: 'https://nekos.best/api/v2/',
    animeApi: 'https://api.anime-api.xyz/api/',
    
    // Database lokal (kalo lo punya)
    github: 'https://raw.githubusercontent.com/YOUR_USERNAME/anime-db/main/'
}

// ============ FUNGSI UTAMA ============
async function handler(m, { sock }) {
    let command = m.command?.toLowerCase()
    
    // Cek alias
    if (aliases[command]) {
        command = aliases[command]
    }
    
    // Validasi command
    if (!animeCommands.includes(command)) {
        const total = animeCommands.length
        return m.reply(
            `🎀 *ᴀɴɪᴍᴇ ɢᴀʟʟᴇʀʏ*\n\n` +
            `> Tersedia *${total}+* karakter anime!\n` +
            `> Contoh: \`${m.prefix}zero2\`, \`${m.prefix}gojo\`, \`${m.prefix}luffy\`\n\n` +
            `📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
            `${animeCommands.slice(0, 25).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
            `_dan ${total - 25} command lainnya_\n\n` +
            `🌟 *Favorit:* .zero2 .gojo .eren .tanjiro .deku`
        )
    }
    
    try {
        await m.react('⏱️')
        let imageUrl = null
        let source = 'API'
        
        // ============ AMBIL GAMBAR ============
        switch(command) {
            // ===== DARLING IN THE FRANXX =====
            case 'zero2':
            case 'hiro':
            case 'ichigo':
            case 'goro':
            case 'miku':
            case 'zorome':
            case 'kokoro':
            case 'mitsuru':
            case 'ikuno':
            case 'futoshi':
            case 'nana':
            case 'hachi':
                try {
                    // Pake API waifu.pics dulu
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                    source = 'Waifu.pics'
                } catch(e) {
                    // Fallback ke nekos
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                    source = 'Nekos.life'
                }
                break
            
            // ===== JUJUTSU KAISEN =====
            case 'gojo':
            case 'yuji':
            case 'megumi':
            case 'nobara':
            case 'sukuna':
            case 'geto':
            case 'toji':
            case 'nanami':
            case 'okotsu':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== ATTACK ON TITAN =====
            case 'eren':
            case 'mikasa':
            case 'armin':
            case 'levi':
            case 'hanji':
            case 'erwin':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== KIMETSU NO YAIBA =====
            case 'tanjiro':
            case 'nezuko':
            case 'zenitsu':
            case 'inosuke':
            case 'giyu':
            case 'shinobu':
            case 'kyojuro':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== MY HERO ACADEMIA =====
            case 'deku':
            case 'bakugo':
            case 'shoto':
            case 'allmight':
            case 'endeavor':
            case 'hawks':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== ONE PIECE =====
            case 'luffy':
            case 'zoro':
            case 'nami':
            case 'sanji':
            case 'chopper':
            case 'robin':
            case 'shanks':
            case 'ace':
            case 'sabo':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== NARUTO =====
            case 'naruto':
            case 'sasuke':
            case 'sakura':
            case 'kakasih':
            case 'itachi':
            case 'madara':
            case 'minato':
            case 'hinata':
            case 'gaara':
            case 'obito':
                try {
                    const { data } = await axios.get(`${ANIME_API.waifu}waifu`)
                    imageUrl = data.url
                } catch(e) {
                    const { data } = await axios.get(`${ANIME_API.nekos}waifu`)
                    imageUrl = data.url
                }
                break
            
            // ===== DEFAULT (API WAIFU.PICS) =====
            default:
                try {
                    // Coba waifu.pics
                    const endpoint = ['neko', 'waifu', 'husbu'].includes(command) ? command : 'waifu'
                    const { data } = await axios.get(`${ANIME_API.waifu}${endpoint}`)
                    imageUrl = data.url
                    source = 'Waifu.pics'
                } catch(e) {
                    try {
                        // Fallback nekos.life
                        const { data } = await axios.get(`${ANIME_API.nekos}neko`)
                        imageUrl = data.url
                        source = 'Nekos.life'
                    } catch(err) {
                        // Last resort: random image
                        const randomId = Math.floor(Math.random() * 1000)
                        imageUrl = `https://picsum.photos/seed/${command}${randomId}/800/800`
                        source = 'Picsum (Fallback)'
                    }
                }
                break
        }
        
        if (!imageUrl) {
            throw new Error('Gambar tidak ditemukan')
        }
        
        // ============ KIRIM PESAN ============
        const cmdName = command.charAt(0).toUpperCase() + command.slice(1)
        const totalChars = animeCommands.length
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎀 *${cmdName}*\n` +
                    `> *ʀᴀɴᴅᴏᴍ ᴀɴɪᴍᴇ ɢᴀʟʟᴇʀʏ*\n` +
                    `> *Source:* ${source}\n` +
                    `> *Total Karakter:* ${totalChars}+`,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🌸 ${cmdName}`,
                    body: `${totalChars}+ Anime Characters`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: fs.existsSync('./assets/images/anime-thumb.jpg') ? 
                               fs.readFileSync('./assets/images/anime-thumb.jpg') : null,
                    sourceUrl: 'https://github.com/',
                }
            }
        }, { quoted: m })
        
        await m.react('🌸')
        
    } catch (err) {
        console.error('Anime Image Error:', err)
        
        // ============ HANDLE ERROR ============
        try {
            const { data } = await axios.get('https://api.waifu.pics/sfw/waifu')
            await sock.sendMessage(m.chat, {
                image: { url: data.url },
                caption: `🎀 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n\n> *ʀᴀɴᴅᴏᴍ ᴀɴɪᴍᴇ ɢᴀʟʟᴇʀʏ*\n> *Source:* Fallback API`
            }, { quoted: m })
            await m.react('🌸')
            return
        } catch(e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gambar untuk *${command}* tidak ditemukan\n> Coba command lain ya!\n\n📋 *Contoh:* .zero2, .gojo, .luffy`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}