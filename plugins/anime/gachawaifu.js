const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'gacha-waifu',
    alias: ['gacha', 'waifu', 'randomwaifu', 'carawaifu'],
    category: 'anime',
    description: 'Gacha waifu random + biodata (Rem, Ram, Zero Two, dll)',
    usage: '.gacha-waifu\n.gacha-waifu [nama]',
    example: '.gacha-waifu\n.gacha-waifu rem',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

// Daftar karakter dengan query yang lebih akurat
const characters = {
    rem: { keywords: ['rem rezero', 'rem anime', 'rem re:zero'], name: 'Rem' },
    ram: { keywords: ['ram rezero', 'ram anime', 'ram re:zero'], name: 'Ram' },
    zerotwo: { keywords: ['zero two darling', '002 anime', 'zero two franxx'], name: 'Zero Two' },
    louise: { keywords: ['louise zero no tsukaima', 'louise valliere'], name: 'Louise' },
    megumin: { keywords: ['megumin konosuba', 'megumin explosion'], name: 'Megumin' },
    aqua: { keywords: ['aqua konosuba', 'aqua goddess'], name: 'Aqua' },
    asuna: { keywords: ['asuna yuuki', 'asuna sao'], name: 'Asuna' },
    mikasa: { keywords: ['mikasa ackerman', 'mikasa attack on titan'], name: 'Mikasa' },
    hinata: { keywords: ['hinata hyuga', 'hinata naruto'], name: 'Hinata' },
    nezuko: { keywords: ['nezuko kamado', 'nezuko demon slayer'], name: 'Nezuko' },
    emilia: { keywords: ['emilia rezero', 'emilia re:zero'], name: 'Emilia' },
    echidna: { keywords: ['echidna rezero', 'echidna witch'], name: 'Echidna' },
    yuno: { keywords: ['yuno gasai', 'yuno mirai nikki'], name: 'Yuno' },
    kurumi: { keywords: ['kurumi tokisaki', 'kurumi date a live'], name: 'Kurumi' },
    rias: { keywords: ['rias gremory', 'rias high school dxd'], name: 'Rias' },
    miku: { keywords: ['miku nakano', 'miku gotoubun'], name: 'Miku' },
    nino: { keywords: ['nino nakano', 'nino gotoubun'], name: 'Nino' },
    mai: { keywords: ['mai sakurajima', 'mai bunny girl senpai'], name: 'Mai' },
    nobara: { keywords: ['nobara kugisaki', 'nobara jujutsu kaisen'], name: 'Nobara' },
    makima: { keywords: ['makima chainsaw man', 'makima csm'], name: 'Makima' },
    power: { keywords: ['power chainsaw man', 'power csm'], name: 'Power' }
}

// Sifat karakter
const dereTypes = [
    { name: 'Tsundere 💢', desc: 'Panas dingin, kasar di luar tapi lembut di dalam' },
    { name: 'Yandere 🔪', desc: 'Sayang banget tapi posesif, jangan bikin cemburu' },
    { name: 'Kuudere ❄️', desc: 'Dingin dan kalem, tapi care banget sama orang dekat' },
    { name: 'Dandere 😶', desc: 'Pendiam pemalu, tapi aktif kalau sama orang dekat' },
    { name: 'Deredere 😊', desc: 'Baik, ramah, dan manis terus-terusan' },
    { name: 'Kamidere 👑', desc: 'Merasa paling hebat, royal dan angkuh' },
    { name: 'Himedere 👸', desc: 'Berlaku kayak putri, royal dan manja' }
]

// Quotes
const quotes = [
    "Darling~ ini waifu buat kamu! Jangan kebanyakan ngelus layar ya~ 🦋",
    "Hora~ waifu kamu udah datang, terima kasih ya sudah main gacha~ 💖",
    "Nih darling, semoga dapet waifu yang kamu suka~ 🎐",
    "Ciee yang mau punya waifu baru, semoga beruntung ya darling~ 🗿",
    "Ara~ dapet waifu bagus nih, jangan lupain aku ya darling~ 🔥"
]

// Fungsi helper
function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)]
}

function getRandomDere() {
    return dereTypes[Math.floor(Math.random() * dereTypes.length)]
}

function getRandomAge() {
    return Math.floor(Math.random() * (22 - 15 + 1)) + 15
}

function getRandomHeight() {
    return Math.floor(Math.random() * (168 - 148 + 1)) + 148
}

// Fungsi fetch gambar pake Pinterest API (lebih akurat)
async function fetchWaifuImage(keyword) {
    try {
        // Pake Pinterest API via alternative endpoint
        const searchQuery = `${keyword} anime cute`
        const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(searchQuery)}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodeURIComponent(searchQuery)}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1735123456789`
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        // Parse response buat dapetin image url
        if (response.data && response.data.resource_response && response.data.resource_response.data) {
            const results = response.data.resource_response.data.results
            if (results && results.length > 0) {
                // Filter yang punya gambar
                const validImages = results.filter(r => r.images && r.images.orig)
                if (validImages.length > 0) {
                    const randomIndex = Math.floor(Math.random() * validImages.length)
                    return validImages[randomIndex].images.orig.url
                }
            }
        }
        
        throw new Error('No image found')
    } catch (error) {
        console.log('[GachaWaifu] Pinterest error, pake fallback:', error.message)
        
        // Fallback ke API image random
        try {
            const fallbackUrl = `https://api.waifu.pics/sfw/waifu`
            const fallbackRes = await axios.get(fallbackUrl, { timeout: 5000 })
            if (fallbackRes.data && fallbackRes.data.url) {
                return fallbackRes.data.url
            }
        } catch (e) {
            console.log('[GachaWaifu] Fallback juga error')
        }
        
        // Last resort: pake placeholder image dengan nama karakter
        return `https://placehold.co/800x600/ff69b4/white?text=${encodeURIComponent(keyword)}`
    }
}

// Fungsi utama gacha
async function gachaWaifu(charName = null) {
    let charKey = null
    let displayName = null
    let searchKeyword = null
    
    // Kalo random
    if (!charName) {
        const charList = Object.keys(characters)
        charKey = charList[Math.floor(Math.random() * charList.length)]
        displayName = characters[charKey].name
        searchKeyword = characters[charKey].keywords[0]
    } 
    // Kalo spesifik
    else {
        const input = charName.toLowerCase()
        let found = false
        
        for (const [key, data] of Object.entries(characters)) {
            if (key === input || data.keywords.some(k => k.toLowerCase().includes(input))) {
                charKey = key
                displayName = data.name
                searchKeyword = data.keywords[0]
                found = true
                break
            }
        }
        
        if (!found) {
            // Kalo ga dikenal, pake random
            const charList = Object.keys(characters)
            charKey = charList[Math.floor(Math.random() * charList.length)]
            displayName = characters[charKey].name
            searchKeyword = characters[charKey].keywords[0]
        }
    }
    
    // Fetch gambar
    let imageUrl = await fetchWaifuImage(searchKeyword)
    
    // Generate biodata
    const dere = getRandomDere()
    const age = getRandomAge()
    const height = getRandomHeight()
    const quote = getRandomQuote()
    
    const hobbies = ['Membaca manga', 'Nonton anime', 'Masak', 'Main game', 'Tidur', 'Jalan-jalan', 'Nyanyi', 'Olahraga']
    const foods = ['Ramen 🍜', 'Sushi 🍣', 'Onigiri 🍙', 'Takoyaki 🐙', 'Matcha 🍵', 'Dorayaki 🥞']
    
    const randomHobby = hobbies[Math.floor(Math.random() * hobbies.length)]
    const randomFood = foods[Math.floor(Math.random() * foods.length)]
    
    // Format caption
    const caption = `╭━━❀✿❀━━「 *🎴 WAIFU GACHA* 」━━❀✿❀━━⬣
┃
┃ 📛 *Nama:* ${displayName}
┃ 🎂 *Umur:* ${age} tahun
┃ 📏 *Tinggi:* ${height} cm
┃ 💢 *Sifat:* ${dere.name}
┃ 📝 *Deskripsi:* ${dere.desc}
┃ 🍱 *Hobi:* ${randomHobby}
┃ 🍜 *Food:* ${randomFood}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

🦋 *Zero Two:* "${quote}"

🔎 *Tags:* #${displayName.replace(/\s/g, '')} #Waifu #AnimeGacha`
    
    return {
        imageUrl,
        caption,
        displayName,
        charKey
    }
}

// Handler utama
async function handler(m, { sock, args }) {
    try {
        await m.react('🎴')
        
        let character = args && args.length > 0 ? args.join(' ').trim() : null
        
        // Filter kata kasar
        const badWords = ['nsfw', 'bokep', 'vulgar', 'porno', 'bugil', 'telanjang', 'hentai', 'sex']
        if (character && badWords.some(word => character.toLowerCase().includes(word))) {
            await m.react('❌')
            return m.reply(`❌ *Zero Two:* He~ jangan minta yang aneh-aneh ya darling~ 🦋`)
        }
        
        // Kasih tau loading
        await m.reply(`🎴 *Zero Two:* "Lagi gacha waifu buat darling~ sabar ya..." 🦋`)
        
        // Gacha
        const result = await gachaWaifu(character)
        
        // Kirim hasil
        await sock.sendMessage(m.chat, {
            image: { url: result.imageUrl },
            caption: result.caption
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (error) {
        console.error('[GachaWaifu Error]:', error)
        await m.react('❌')
        await m.reply(`❌ *Error:* Waifu lagi sibuk darling, coba lagi nanti ya~ 🦋\n\n*Pesan error:* ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}