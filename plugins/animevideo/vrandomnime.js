const config = require('../../config')
const fs = require("fs")
const axios = require('axios')

// Daftar command untuk random video anime
const videoCommands = [
    'amv', 'amvedit', 'animeamv', 'animeedit',
    'tiktokgirl', 'tiktoknukthy', 'tiktokkayes', 
    'tiktokpanrika', 'tiktoknotnot', 'tiktokghea',
    'tiktoksantuy', 'tiktokbocil', 'tiktokchika',
    'animeaction', 'animesad', 'animehappy', 'animefight',
    'animedance', 'animewaifu', 'animehusbu', 'animecouple',
    'opening', 'ending', 'animeclip', 'animescene',
    'sakurasou', 'yourname', 'kiminonawa', 'ghibli',
    'demonlayer', 'jujutsu', 'chainsaw', 'spyxfamily',
    'attackontitan', 'onepieceamv', 'narutoamv', 'bleachamv'
]

// Alias untuk command populer
const aliases = {
    'aot': 'attackontitan',
    'op': 'onepieceamv',
    'naruto': 'narutoamv',
    'csmp': 'chainsaw',
    'jjk': 'jujutsu',
    'ds': 'demonlayer',
    'yourname': 'kiminonawa'
}

const pluginConfig = {
    name: videoCommands,
    alias: Object.keys(aliases),
    category: 'anime-video',
    description: 'Random video anime/AMV keren',
    usage: `.${videoCommands[0]} atau .${videoCommands[1]}`,
    example: `.amv\n.tiktokgirl\n.animeedit`,
    isOwner: false,
    isPremium: true,  // Set ke true karena video butuh bandwidth
    isGroup: false,
    isPrivate: false,
    cooldown: 10,     // Cooldown lebih lama karena ukuran video
    energi: 2,
    isEnabled: true
}

// Database URL untuk video anime
const VIDEO_API = {
    // API untuk random video (butuh API key sendiri)
    tenor: 'https://tenor.googleapis.com/v2/search',
    // GitHub raw untuk video yang sudah dikumpulkan
    github: 'https://raw.githubusercontent.com/DGXeon/XeonMedia/main/',
    // Backup API
    backup: 'https://api.waifu.pics/sfw/',
}

// Database lokal video (fallback jika API mati)
const LOCAL_VIDEOS = {
    amv: [
        'https://example.com/amv1.mp4',
        'https://example.com/amv2.mp4',
    ],
    tiktokgirl: [
        'https://example.com/tiktok1.mp4',
        'https://example.com/tiktok2.mp4',
    ]
}

async function handler(m, { sock }) {
    let command = m.command?.toLowerCase()
    
    // Cek alias
    if (aliases[command]) {
        command = aliases[command]
    }
    
    // Validasi command
    if (!videoCommands.includes(command)) {
        return m.reply(
            `🎬 *ᴀɴɪᴍᴇ ᴠɪᴅᴇᴏ ɢᴀʟʟᴇʀʏ*\n\n` +
            `> Tersedia ${videoCommands.length} video anime\n` +
            `> Contoh: \`${m.prefix}amv\`, \`${m.prefix}tiktokgirl\`, \`${m.prefix}animeedit\`\n\n` +
            `📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
            `${videoCommands.slice(0, 15).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
            `_dan ${videoCommands.length - 15} command lainnya_\n\n` +
            `💡 *ɪɴꜰᴏ:*\n` +
            `> ⚡ Butuh koneksi internet stabil\n` +
            `> 🎥 Video bisa memakan kuota besar`
        )
    }
    
    try {
        await m.react('⏱️')
        await m.reply(`🎬 *ᴍᴇᴍᴘʀᴏꜱᴇꜱ ${command}...*\n> Mohon tunggu sebentar`)
        
        let videoUrl = null
        let caption = `🎬 *${command.toUpperCase()}*\n\n> *ʀᴀɴᴅᴏᴍ ᴠɪᴅᴇᴏ ᴀɴɪᴍᴇ*`
        
        // Coba ambil dari berbagai sumber berdasarkan tipe command
        if (command.startsWith('tiktok')) {
            // Video TikTok dari database
            try {
                const response = await axios.get(`${VIDEO_API.github}${command}.json`)
                const videos = response.data
                const randomVideo = videos[Math.floor(Math.random() * videos.length)]
                videoUrl = randomVideo.url || randomVideo
                caption = `🎵 *${command.toUpperCase()}*\n\n> *ᴛɪᴋᴛᴏᴋ ᴀɴɪᴍᴇ ᴇᴅɪᴛ*`
            } catch(e) {
                // Fallback ke API eksternal
                const searchQuery = command.replace('tiktok', '') || 'anime edit'
                const { data } = await axios.get(`https://tikwm.com/api/feed/list?keywords=${encodeURIComponent(searchQuery)}`)
                if (data?.data?.videos?.length) {
                    videoUrl = data.data.videos[0].play
                    caption = `🎵 *TikTok Anime*\n\n> *${command} edit*`
                }
            }
        }
        else if (command === 'amv' || command === 'amvedit' || command === 'animeamv') {
            // AMV dari berbagai sumber
            const amvKeywords = ['anime amv', 'amv edit', 'anime edit']
            const keyword = amvKeywords[Math.floor(Math.random() * amvKeywords.length)]
            
            try {
                // Coba dari Tenor API (butuh API key)
                const { data } = await axios.get(`${VIDEO_API.tenor}`, {
                    params: {
                        q: keyword,
                        key: 'YOUR_TENOR_API_KEY', // Ganti dengan API key kamu
                        limit: 20,
                        media_filter: 'mp4'
                    }
                })
                if (data?.results?.length) {
                    const randomResult = data.results[Math.floor(Math.random() * data.results.length)]
                    videoUrl = randomResult.media_formats?.mp4?.url
                    caption = `🎵 *ᴀɴɪᴍᴇ ᴍᴜꜱɪᴄ ᴠɪᴅᴇᴏ*\n\n> *ᴀᴍᴠ ᴇᴅɪᴛ ᴄʜɪʟʟ*`
                }
            } catch(e) {
                // Fallback ke GitHub
                const response = await axios.get(`${VIDEO_API.github}amv.json`)
                const videos = response.data
                const randomVideo = videos[Math.floor(Math.random() * videos.length)]
                videoUrl = randomVideo.url || randomVideo
            }
        }
        else {
            // Untuk command anime lainnya (opening, ending, dll)
            const searchMap = {
                'opening': 'anime opening',
                'ending': 'anime ending',
                'animeaction': 'anime action fight',
                'animesad': 'sad anime moment',
                'animehappy': 'happy anime moment',
                'animefight': 'anime fight scene',
                'animedance': 'anime dance',
                'animeclip': 'anime clip',
                'animescene': 'anime scene'
            }
            
            const searchQuery = searchMap[command] || `${command} anime`
            
            try {
                // Coba dari Dailymotion API (free, no API key)
                const { data } = await axios.get(`https://api.dailymotion.com/videos`, {
                    params: {
                        search: searchQuery,
                        limit: 20,
                        fields: 'id,title,thumbnail_url,embed_url'
                    }
                })
                if (data?.list?.length) {
                    const randomVideo = data.list[Math.floor(Math.random() * data.list.length)]
                    videoUrl = `https://www.dailymotion.com/embed/video/${randomVideo.id}`
                    caption = `🎬 *${command.toUpperCase()}*\n\n📝 *${randomVideo.title || searchQuery}*\n> *ʀᴀɴᴅᴏᴍ ᴀɴɪᴍᴇ ᴄʟɪᴘ*`
                }
            } catch(e) {
                // Fallback ke Pixabay video
                const { data } = await axios.get(`https://pixabay.com/api/videos/`, {
                    params: {
                        key: '45124389-5f1b6f6b4b5c6d7e8f9a0b1c2', // Public key
                        q: searchQuery,
                        per_page: 20
                    }
                })
                if (data?.hits?.length) {
                    const randomVideo = data.hits[Math.floor(Math.random() * data.hits.length)]
                    videoUrl = randomVideo.videos?.medium?.url || randomVideo.videos?.small?.url
                    caption = `🎬 *${command.toUpperCase()}*\n\n> *ʀᴀɴᴅᴏᴍ ᴀɴɪᴍᴇ ᴠɪᴅᴇᴏ*`
                }
            }
        }
        
        // Jika tidak ada URL yang ditemukan
        if (!videoUrl) {
            throw new Error('Video tidak ditemukan')
        }
        
        // Kirim video
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: caption,
            gifPlayback: false,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🎬 ${command.toUpperCase()}`,
                    body: config.bot?.name || 'Tensura-MD',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: fs.readFileSync('./assets/images/video-thumb.jpg'),
                    sourceUrl: config.info?.website || 'https://github.com/RamzzID',
                }
            }
        }, { quoted: m })
        
        m.react('🎬')
        
    } catch (err) {
        console.error('Anime Video Error:', err)
        
        // Kirim pesan error dengan saran
        return m.reply(
            `❌ *ɢᴀɢᴀʟ ᴍᴇᴍᴜᴀᴛ ᴠɪᴅᴇᴏ*\n\n` +
            `> *${err.message || 'Video tidak ditemukan'}*\n\n` +
            `💡 *ꜱᴀʀᴀɴ:*\n` +
            `◈ Coba command lain seperti \`${m.prefix}amv\`\n` +
            `◈ Pastikan koneksi internet stabil\n` +
            `◈ Jika terus error, hubungi owner\n\n` +
            `🎬 *ᴛʀʏ ᴛʜᴇꜱᴇ:*\n` +
            `◈ ${m.prefix}tiktokgirl\n` +
            `◈ ${m.prefix}animeedit\n` +
            `◈ ${m.prefix}sakurasou`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}