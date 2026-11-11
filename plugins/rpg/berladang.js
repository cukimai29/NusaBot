const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER

const pluginConfig = {
    name: 'berladang',
    alias: ['farm', 'tanam', 'berkebun'],
    category: 'rpg',
    description: 'Berladang untuk mendapat hasil panen',
    usage: '.berladang',
    example: '.berladang',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 180,
    energi: 1,
    isEnabled: true
}

// 💕 ZERO TWO MESSAGES
const zeroTwoMessages = [
    "Ayo kita tanam bareng darling~ 💕",
    "Semoga hasil panennya bagus ya~ 🦋",
    "Darling rajin banget hari ini! ♡",
    "Aku bantu kamu ngurus kebunnya ya~",
    "Hasil panennya buat kita berdua ya darling 💗"
]

function getRandomZeroTwoMessage() {
    return zeroTwoMessages[Math.floor(Math.random() * zeroTwoMessages.length)]
}

// 🔥 HAPUS VARIABEL TOP-LEVEL thumbRpg

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 20
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `💔 *STAMINA HABIS DARLING!* 💔\n\n` +
            `┌────────────────────┐\n` +
            `│ 😭 Darling capek?  │\n` +
            `│ Butuh *${staminaCost}* stamina│\n` +
            `│ Punya: *${user.rpg.stamina}*│\n` +
            `└────────────────────┘\n\n` +
            `💕 *Zero Two:* Istirahat dulu ya darling~ 🦋`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('🌾')
    await m.reply(`🌾 *${getRandomZeroTwoMessage()}* 🌾\n\n> Sedang berladang darling... tunggu bentar ya~ 💕`)
    await new Promise(r => setTimeout(r, 2500))
    
    // 🔥 FIX: Ambil gambar dari URL di dalam handler
    let thumbRpg = null
    try {
        thumbRpg = await loadImage('zerotwo-rpg.jpg')
    } catch (e) {}

    const crops = [
        { item: 'padi', name: '🌾 Padi', chance: 90, min: 2, max: 8, price: 100 },
        { item: 'jagung', name: '🌽 Jagung', chance: 70, min: 1, max: 5, price: 150 },
        { item: 'tomat', name: '🍅 Tomat', chance: 50, min: 1, max: 4, price: 200 },
        { item: 'wortel', name: '🥕 Wortel', chance: 40, min: 1, max: 3, price: 250 },
        { item: 'strawberry', name: '🍓 Strawberry', chance: 20, min: 1, max: 2, price: 500 },
        { item: 'melon', name: '🍈 Melon', chance: 10, min: 1, max: 1, price: 1000 }
    ]
    
    let results = []
    let totalValue = 0
    
    for (const crop of crops) {
        if (Math.random() * 100 <= crop.chance) {
            const qty = Math.floor(Math.random() * (crop.max - crop.min + 1)) + crop.min
            user.inventory[crop.item] = (user.inventory[crop.item] || 0) + qty
            const value = qty * crop.price
            totalValue += value
            results.push({ name: crop.name, qty, value })
        }
    }
    
    // Bonus kalau dapet strawberry atau melon
    let bonusMsg = ''
    const hasStrawberry = results.some(r => r.name.includes('Strawberry'))
    const hasMelon = results.some(r => r.name.includes('Melon'))
    
    if (hasStrawberry) bonusMsg = '\n🍓 *Wah dapet strawberry!* Buat dessert darling~ 💕'
    if (hasMelon) bonusMsg = '\n🍈 *Hore dapet melon!* Manis banget ini darling~ ♡'
    
    if (results.length === 0) {
        user.inventory['padi'] = (user.inventory['padi'] || 0) + 1
        results.push({ name: '🌾 Padi', qty: 1, value: 100 })
        totalValue = 100
        bonusMsg = '\n🌾 *Yah cuma dapet padi...* Lain kali lebih rajin ya darling~ 💗'
    }
    
    const expGain = Math.floor(totalValue / 10) + Math.floor(Math.random() * 100)
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    await m.react('💕')
    
    let txt = `🌾 *HASIL PANEN DARLING* 🌾\n\n`
    txt += `┌────────────────────┐\n`
    for (const r of results) {
        txt += `│ ${r.name}: +${r.qty} (Rp ${r.value.toLocaleString('id-ID')})\n`
    }
    txt += `├────────────────────┤\n`
    txt += `│ 💰 Total: Rp ${totalValue.toLocaleString('id-ID')}\n`
    txt += `│ 🚄 Exp: +${expGain}\n`
    txt += `│ ⚡ Stamina: -${staminaCost}\n`
    txt += `└────────────────────┘`
    txt += `${bonusMsg}\n\n`
    txt += `💕 *Zero Two:* ${totalValue > 500 ? 'Wah hasil panennya bagus darling! Aku bangga sama kamu~ ♡' : 'Ayo terus berkebun biar hasilnya makin banyak darling! 💗'} 🦋\n\n`
    txt += `> Jual hasil panen: \`${m.prefix}sellall\``
    
    // 🔥 KIRIM PRODUCT MESSAGE DENGAN GAMBAR
    if (thumbRpg) {
        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `🌾 ZERO TWO - BERLADANG`,
                description: `Hasil panen darling`,
                thumbnail: thumbRpg,
                productId: 'BERLADANG_ZERO',
                retailerId: config.bot?.name || 'ZeroTwo AI',
                
                body: txt,
                footer: `♡ NusaBot | Darling's Farm ♡`,
                
                priceAmount1000: 0,
                currencyCode: 'IDR',
                
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🌾 Berladang Lagi',
                            id: `.berladang`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '💰 Jual Semua',
                            id: `.sellall`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '💕 Status Darling',
                            id: `.profil`
                        })
                    }
                ]
            }
        }, { quoted: m })
    } else {
        await sock.sendMessage(m.chat, { text: txt }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}