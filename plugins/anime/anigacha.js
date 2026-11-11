const pluginConfig = {
    name: 'anigacha',
    alias: ['animegacha', 'gacha', 'rollanime', 'animeroll'],
    category: 'anime',
    description: 'Gacha karakter anime random! Dapetin karakter favoritmu~',
    usage: '.anigacha',
    example: '.anigacha',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

// ============ WARNA RARITY (BUAT TEKS) ============
const rarityColors = {
    common: { name: 'COMMON', emoji: '⚪', color: '⬜' },
    rare: { name: 'RARE', emoji: '🔵', color: '🔵' },
    sr: { name: 'SUPER RARE', emoji: '🟣', color: '🟣' },
    ssr: { name: 'SSR', emoji: '🟠', color: '🟠' },
    legendary: { name: 'LEGENDARY', emoji: '👑', color: '👑' }
}

// ============ DATABASE KARAKTER ============
const characters = [
    // 👑 LEGENDARY (1%)
    { name: "Zero Two", anime: "Darling in the Franxx", rarity: "legendary", emoji: "🦋", atk: 9999, def: 9999, quote: "Aku darling-mu selamanya~" },
    { name: "Gojo Satoru", anime: "Jujutsu Kaisen", rarity: "legendary", emoji: "👁️", atk: 9999, def: 9999, quote: "Kamu lemah, makanya aku yang paling kuat~" },
    { name: "Luffy Gear 5", anime: "One Piece", rarity: "legendary", emoji: "👒", atk: 9999, def: 9999, quote: "Aku akan jadi Raja Bajak Laut!" },
    { name: "Saitama", anime: "One Punch Man", rarity: "legendary", emoji: "👊", atk: 9999, def: 9999, quote: "Satu pukulan sudah cukup~" },
    
    // ⭐⭐⭐⭐ SSR (4%)
    { name: "Levi Ackerman", anime: "Attack on Titan", rarity: "ssr", emoji: "⚔️", atk: 9500, def: 8800, quote: "Dedikasikan hatimu!" },
    { name: "Naruto (Sage Mode)", anime: "Naruto", rarity: "ssr", emoji: "🍥", atk: 9300, def: 9200, quote: "Believe it!" },
    { name: "Sasuke (Rinnegan)", anime: "Naruto", rarity: "ssr", emoji: "⚡", atk: 9400, def: 8900, quote: "Aku akan membalasnya..." },
    { name: "Tanjiro (Sun)", anime: "Demon Slayer", rarity: "ssr", emoji: "🌊", atk: 9200, def: 9100, quote: "Jangan pernah menyerah!" },
    { name: "Eren Yeager", anime: "AoT", rarity: "ssr", emoji: "🕊️", atk: 9600, def: 9500, quote: "Kebebasan!" },
    
    // ⭐⭐⭐ SUPER RARE (10%)
    { name: "Mikasa Ackerman", anime: "AoT", rarity: "sr", emoji: "💔", atk: 8800, def: 8500, quote: "Eren... pulanglah." },
    { name: "Kakashi Hatake", anime: "Naruto", rarity: "sr", emoji: "📖", atk: 8700, def: 8900, quote: "Maaf aku telat..." },
    { name: "Anya Forger", anime: "Spy x Family", rarity: "sr", emoji: "🥜", atk: 8000, def: 7500, quote: "Waku waku!" },
    { name: "Nezuko Kamado", anime: "Demon Slayer", rarity: "sr", emoji: "🎀", atk: 8500, def: 9000, quote: "Hmm... hmm!" },
    { name: "Rengoku Kyojuro", anime: "Demon Slayer", rarity: "sr", emoji: "🔥", atk: 9500, def: 9200, quote: "UMAI!" },
    
    // ⭐⭐ RARE (25%)
    { name: "Inosuke", anime: "Demon Slayer", rarity: "rare", emoji: "🐗", atk: 8200, def: 8000, quote: "Tonjok!" },
    { name: "Zenitsu", anime: "Demon Slayer", rarity: "rare", emoji: "⚡", atk: 8500, def: 7500, quote: "AAAA NEZUKO-CHAN!" },
    { name: "Hinata Shoyo", anime: "Haikyuu", rarity: "rare", emoji: "🏐", atk: 8000, def: 7900, quote: "GERO GERO!" },
    { name: "Kageyama", anime: "Haikyuu", rarity: "rare", emoji: "🏐", atk: 7800, def: 8200, quote: "Bokuto-san!" },
    
    // ⭐ COMMON (60%)
    { name: "Komi-san", anime: "Komi-san", rarity: "common", emoji: "😶", atk: 7000, def: 7500, quote: "..." },
    { name: "Chika Fujiwara", anime: "Kaguya-sama", rarity: "common", emoji: "🎶", atk: 7200, def: 6800, quote: "Hayaku!" },
    { name: "Nami", anime: "One Piece", rarity: "common", emoji: "🍊", atk: 7300, def: 7000, quote: "Uang!" },
    { name: "Aqua", anime: "Konosuba", rarity: "common", emoji: "💧", atk: 7500, def: 6500, quote: "Kazuma!" },
    { name: "Megumin", anime: "Konosuba", rarity: "common", emoji: "💥", atk: 8500, def: 6000, quote: "Ekusupuroooosion!" }
]

// Roll rarity
function rollRarity() {
    const roll = Math.random() * 100
    if (roll < 1) return 'legendary'    // 1%
    if (roll < 5) return 'ssr'          // 4%
    if (roll < 15) return 'sr'          // 10%
    if (roll < 40) return 'rare'        // 25%
    return 'common'                     // 60%
}

// Dapetin karakter berdasarkan rarity
function getRandomCharacter(rarity) {
    const filtered = characters.filter(c => c.rarity === rarity)
    return filtered[Math.floor(Math.random() * filtered.length)]
}

// Simpen data user
const userGachaHistory = new Map()

async function handler(m, { sock }) {
    const userId = m.sender
    const isFirst = !userGachaHistory.has(userId)
    
    await m.react('🎲')
    
    try {
        // Roll karakter
        const rarity = rollRarity()
        const char = getRandomCharacter(rarity)
        const rarityData = rarityColors[rarity]
        
        // Simpan history
        if (!userGachaHistory.has(userId)) {
            userGachaHistory.set(userId, { count: 0, legendary: 0 })
        }
        const history = userGachaHistory.get(userId)
        history.count++
        if (rarity === 'legendary') history.legendary++
        
        // Format caption
        let caption = `🎮 *ZERO TWO GACHA* 🎮\n\n`
        
        if (isFirst) {
            caption += `✨ *GACHA PERDANA!* ✨\n\n`
        }
        
        caption += `${rarityData.emoji} *${rarityData.name}* ${rarityData.emoji}\n`
        caption += `━━━━━━━━━━━━━━━━━━━━\n\n`
        caption += `${char.emoji} *${char.name}*\n`
        caption += `📺 *${char.anime}*\n\n`
        caption += `⚔️ *STATS*\n`
        caption += `💪 ATK: ${char.atk}\n`
        caption += `🛡️ DEF: ${char.def}\n\n`
        caption += `💬 *“${char.quote}”*\n\n`
        caption += `📊 *Total roll:* ${history.count} | 👑 *Legendary:* ${history.legendary}\n\n`
        caption += `🦋 *Zero Two:* ${rarity === 'legendary' ? 'WAH LEGENDARY! Kamu beruntung banget darling~! 🎉' : 'Coba lagi ya darling, siapa tau dapet Legendary! 💕'}`
        
        await m.reply(caption)
        
        if (rarity === 'legendary') {
            await m.react('👑')
        } else {
            await m.react('✅')
        }
        
    } catch (err) {
        console.error('[AniGacha] Error:', err)
        await m.react('❌')
        await m.reply(`❌ Error: ${err.message}\n\nCoba lagi ya darling~ 🦋`)
    }
}

module.exports = { config: pluginConfig, handler }