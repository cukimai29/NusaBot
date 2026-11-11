const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER

const pluginConfig = {
    name: 'berburu',
    alias: ['huntanimal', 'buru'],
    category: 'rpg',
    description: 'Berburu hewan untuk mendapat item',
    usage: '.berburu',
    example: '.berburu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS VARIABEL TOP-LEVEL thumbRpg

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 25
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk berburu\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('🏹')
    await m.reply(`🏹 *sᴇᴅᴀɴɢ ʙᴇʀʙᴜʀᴜ...*`)
    await new Promise(r => setTimeout(r, 3000))
    
    // 🔥 FIX: Ambil gambar dari URL di dalam handler
    let thumbRpg = null
    try {
        thumbRpg = await loadImage('zerotwo-rpg.jpg')
    } catch (e) {}

    const animals = [
        { name: '🐰 Kelinci', item: 'daging_kelinci', chance: 80, min: 1, max: 3, exp: 50, money: 500 },
        { name: '🦌 Rusa', item: 'daging_rusa', chance: 50, min: 1, max: 2, exp: 100, money: 1500 },
        { name: '🐗 Babi Hutan', item: 'daging_babi', chance: 40, min: 1, max: 2, exp: 150, money: 2000 },
        { name: '🦊 Rubah', item: 'bulu_rubah', chance: 30, min: 1, max: 1, exp: 200, money: 3000 },
        { name: '🐻 Beruang', item: 'cakar_beruang', chance: 15, min: 1, max: 1, exp: 500, money: 10000 },
        { name: '🦁 Singa', item: 'taring_singa', chance: 5, min: 1, max: 1, exp: 1000, money: 25000 }
    ]
    
    const caught = animals.filter(a => Math.random() * 100 <= a.chance)
    
    if (caught.length === 0) {
        await m.react('😢')
        db.save()
        
        let txtFail = `🏹 *ʙᴇʀʙᴜʀᴜ ɢᴀɢᴀʟ*\n\n` +
            `> Kamu tidak mendapat buruan kali ini\n` +
            `> Stamina: *-${staminaCost}*`
        
        // 🔥 KIRIM PRODUCT MESSAGE JUGA KALO GAGAL
        if (thumbRpg) {
            await sock.sendMessage(m.chat, {
                productMessage: {
                    title: `🏹 BERBURU GAGAL`,
                    description: `Zero Two RPG - Hasil Berburu`,
                    thumbnail: thumbRpg,
                    productId: 'BERBURU_FAIL',
                    retailerId: config.bot?.name || 'ZeroTwo AI',
                    
                    body: txtFail,
                    footer: `© ${config.bot?.name || 'ZeroTwo AI'} 2026`,
                    
                    priceAmount1000: 0,
                    currencyCode: 'IDR',
                    
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🏹 Buru Lagi',
                                id: `.berburu`
                            })
                        }
                    ]
                }
            }, { quoted: m })
        } else {
            await m.reply(txtFail)
        }
        return
    }
    
    let results = []
    let totalExp = 0
    let totalMoney = 0
    
    for (const animal of caught.slice(0, 3)) {
        const qty = Math.floor(Math.random() * (animal.max - animal.min + 1)) + animal.min
        user.inventory[animal.item] = (user.inventory[animal.item] || 0) + qty
        totalExp += animal.exp * qty
        totalMoney += animal.money * qty
        results.push({ name: animal.name, qty, money: animal.money * qty })
    }
    
    user.koin = (user.koin || 0) + totalMoney
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, totalExp)
    
    db.save()
    
    await m.react('✅')
    
    let txt = `🏹 *ʙᴇʀʙᴜʀᴜ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 🎯 *ʜᴀsɪʟ ʙᴜʀᴜᴀɴ* 」\n`
    for (const r of results) {
        txt += `┃ ${r.name}: *+${r.qty}*\n`
    }
    txt += `┃ ─────────\n`
    txt += `┃ 💵 Jual: *+Rp ${totalMoney.toLocaleString('id-ID')}*\n`
    txt += `┃ 🚄 Exp: *+${totalExp}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    // 🔥 KIRIM PRODUCT MESSAGE DENGAN GAMBAR
    if (thumbRpg) {
        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `🏹 BERBURU BERHASIL`,
                description: `Zero Two RPG - Hasil Berburu`,
                thumbnail: thumbRpg,
                productId: 'BERBURU_SUCCESS',
                retailerId: config.bot?.name || 'ZeroTwo AI',
                
                body: txt,
                footer: `© ${config.bot?.name || 'ZeroTwo AI'} 2026`,
                
                priceAmount1000: 0,
                currencyCode: 'IDR',
                
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🏹 Buru Lagi',
                            id: `.berburu`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📦 Inventori',
                            id: `.inventory`
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