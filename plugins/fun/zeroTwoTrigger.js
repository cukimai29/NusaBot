const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'zeroTwoTrigger',
    alias: ['zttrigger'],
    category: 'fun',
    description: 'Zero Two akan nyapa random kalau ada yang bilang kata kunci',
    usage: '.zttrigger <on/off/list/add/remove>',
    example: '.zttrigger on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

// ========== KATA-KATA BIASA (SEPI, SUNYI, DLL) ==========
const casualReplies = [
    "🗿 *Zero Two*: iya njir~ ada yang manggil? gw lagi mager tau!",
    "😒 *Zero Two*: apa woi? lagi sibuk nih jangan ganggu~",
    "😴 *Zero Two*: hmm? lagi ngantuk nih, entar aja ya darling~",
    "🤙 *Zero Two*: oyy ada apa? santuy dulu napa sih~",
    "😎 *Zero Two*: iya iya sabar, gw lagi scroll tiktok nih~",
    "🥱 *Zero Two*: duh males ah, besok aja ya ngobrolnya~",
    "🙄 *Zero Two*: ih ganggu banget sih, lagi asik nih~",
    "😼 *Zero Two*: ha? siapa? oh kamu~ ada apa coba?",
    "🤔 *Zero Two*: oke oke gw denger, tapi gw lagi mager jawab panjang-panjang~",
    "😤 *Zero Two*: WOY! lagi serius nih! eh tapi siapa ya yang manggil?",
    "🥴 *Zero Two*: hush dulu~ gw lagi pusing nih banyak chat~",
    "😏 *Zero Two*: iya iya elu paling benar, sekarang gw balik tidur dulu~",
    "😁 *Zero Two*: woi woi ada yang bisa gw bantu? cepet soalnya gw buru-buru~",
    "😝 *Zero Two*: gak ada yang seru nih di grup, manggil doang~",
    "🤪 *Zero Two*: aduuh rame amat, lagi apa nih pada?"
]

// ========== KATA-KATA PANGGILAN ZERO TWO (seoi, zerotwo, dll) ==========
const zeroTwoReplies = [
    "🦋 *Zero Two*: He~ ada yang panggil darling~? Ada apa nih? 🎐",
    "🦋 *Zero Two*: Oi oi~ siapa yang manggil? Jangan cuma manggil doang dong~ 💫",
    "🦋 *Zero Two*: Eh~ ada yang butuh darling-nya? Come here~ 🎐",
    "🦋 *Zero Two*: Nani? Ada yang manggil? Jangan malu-malu dong~ 💫",
    "🦋 *Zero Two*: Darling desu~? Ada yang perlu bantuan? 💫",
    "🦋 *Zero Two*: Hora~ siapa yang panggil? Ayo ngaku! 🦋",
    "🦋 *Zero Two*: Nee~ darling manggil? Ada yang seru? 🎐",
    "🦋 *Zero Two*: Moshi moshi~ Zero Two desu! Ada yang perlu? 🦋",
    "🦋 *Zero Two*: Uwaa~ rame banget! Yang manggil siapaa? 💫",
    "🦋 *Zero Two*: Hmm~ siapa nih yang manggil Zero Two? 🦋",
    "🦋 *Zero Two*: ARA ARA~ ada yang manggil? Darling banget deh~ 🎐",
    "🦋 *Zero Two*: Yare yare~ lagi manggil terus, ada apa sih darling? 💫",
    "🦋 *Zero Two*: Oh? Kedengeran suara familiar nih~ siapa hayo? 🦋",
    "🦋 *Zero Two*: Iiih~ ada yang manggil-manggil Zero Two melulu~ 🎐"
]

// ========== TRIGGER UNTUK KATA BIASA ==========
const casualTriggers = ['sepi', 'sunyi', 'rame', 'grup sepi', 'ada yang bisa']

// ========== TRIGGER UNTUK ZERO TWO (PANGGILAN) ==========
const zeroTwoTriggers = ['seoi', 'zero two', 'zerotwo', '02', 'ゼロツー']

// Gabungan semua trigger default
const defaultTriggers = [...casualTriggers, ...zeroTwoTriggers]

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    
    if (!db.data.zeroTwoTriggers) {
        db.data.zeroTwoTriggers = {
            enabled: {},
            customTriggers: {}
        }
    }
    
    const isEnabled = db.data.zeroTwoTriggers.enabled[m.chat] === true
    
    if (sub === 'on') {
        if (!m.isAdmin && !m.isOwner) {
            return m.reply(`❌ *ZERO TWO*: "Hmph! Cuma admin yang bisa ngaturin aku darling~ 🦋"`)
        }
        db.data.zeroTwoTriggers.enabled[m.chat] = true
        db.save()
        return m.reply(`✅ *ZERO TWO AKTIF* darling~ Sekarang aku bakal nyapa kalau ada trigger! 🦋`)
    }
    
    if (sub === 'off') {
        if (!m.isAdmin && !m.isOwner) {
            return m.reply(`❌ *ZERO TWO*: "Hmph! Cuma admin yang bisa matiin aku darling~ 🦋"`)
        }
        db.data.zeroTwoTriggers.enabled[m.chat] = false
        db.save()
        return m.reply(`❌ *ZERO TWO NONAKTIF* darling~ Aku gak bakal nyapa dulu~ 🦋`)
    }
    
    if (sub === 'list') {
        const groupTriggers = db.data.zeroTwoTriggers.customTriggers[m.chat] || []
        const allTriggers = [...defaultTriggers, ...groupTriggers]
        return m.reply(
            `🦋 *ZERO TWO TRIGGER LIST* 🦋\n\n` +
            `📊 Status: ${isEnabled ? '✅ AKTIF' : '❌ NONAKTIF'}\n\n` +
            `🎐 *Panggilan Zero Two:*\n` +
            `> ${zeroTwoTriggers.join(', ')}\n\n` +
            `💬 *Kata Biasa:*\n` +
            `> ${casualTriggers.join(', ')}\n\n` +
            `🔧 *Custom:* ${groupTriggers.length ? groupTriggers.join(', ') : 'belum ada'}\n\n` +
            `> ${m.prefix}zttrigger add kata → tambah\n` +
            `> ${m.prefix}zttrigger remove kata → hapus`
        )
    }
    
    if (sub === 'add') {
        if (!m.isAdmin && !m.isOwner) return m.reply(`❌ Hanya admin!`)
        if (!sub2) return m.reply(`🦋 Masukkan kata: ${m.prefix}zttrigger add sepi`)
        
        if (!db.data.zeroTwoTriggers.customTriggers[m.chat]) {
            db.data.zeroTwoTriggers.customTriggers[m.chat] = []
        }
        
        if (db.data.zeroTwoTriggers.customTriggers[m.chat].includes(sub2)) {
            return m.reply(`🦋 "${sub2}" sudah ada darling~`)
        }
        
        db.data.zeroTwoTriggers.customTriggers[m.chat].push(sub2)
        db.save()
        return m.reply(`✅ Trigger "${sub2}" ditambahkan! 🦋`)
    }
    
    if (sub === 'remove') {
        if (!m.isAdmin && !m.isOwner) return m.reply(`❌ Hanya admin!`)
        if (!sub2) return m.reply(`🦋 Masukkan kata: ${m.prefix}zttrigger remove sepi`)
        
        const triggers = db.data.zeroTwoTriggers.customTriggers[m.chat] || []
        const index = triggers.indexOf(sub2)
        
        if (index === -1) return m.reply(`🦋 "${sub2}" tidak ditemukan~`)
        
        triggers.splice(index, 1)
        db.data.zeroTwoTriggers.customTriggers[m.chat] = triggers
        db.save()
        return m.reply(`✅ Trigger "${sub2}" dihapus! 🦋`)
    }
    
    return m.reply(
        `🦋 *ZERO TWO TRIGGER* 🦋\n\n` +
        `📊 Status: ${isEnabled ? '✅ AKTIF' : '❌ NONAKTIF'}\n\n` +
        `🎐 *Panggilan Zero Two:*\n` +
        `> seoi, zero two, zerotwo, 02\n\n` +
        `💬 *Kata Biasa:*\n` +
        `> sepi, sunyi, rame, grup sepi\n\n` +
        `> ${m.prefix}zttrigger on → aktifkan\n` +
        `> ${m.prefix}zttrigger off → nonaktifkan\n` +
        `> ${m.prefix}zttrigger add kata → tambah trigger\n` +
        `> ${m.prefix}zttrigger remove kata → hapus trigger`
    )
}

async function setupTriggerListener(sock) {
    console.log('🦋 Starting Zero Two Trigger Listener (Gaul Version)...')
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0]
            
            if (msg.key.fromMe) return
            
            let text = ''
            if (msg.message?.conversation) {
                text = msg.message.conversation
            } else if (msg.message?.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text
            } else if (msg.message?.imageMessage?.caption) {
                text = msg.message.imageMessage.caption
            } else if (msg.message?.videoMessage?.caption) {
                text = msg.message.videoMessage.caption
            }
            
            if (!text) return
            
            const chatId = msg.key.remoteJid
            if (!chatId || !chatId.endsWith('@g.us')) return
            
            const db = getDatabase()
            
            if (!db.data.zeroTwoTriggers) {
                db.data.zeroTwoTriggers = {
                    enabled: {},
                    customTriggers: {}
                }
                db.save()
            }
            
            const isEnabled = db.data.zeroTwoTriggers.enabled[chatId] === true
            if (!isEnabled) return
            
            const groupTriggers = db.data.zeroTwoTriggers.customTriggers[chatId] || []
            const allTriggers = [...defaultTriggers, ...groupTriggers]
            
            const lowerText = text.toLowerCase()
            let matchedTrigger = null
            let isZeroTwoCall = false
            
            // Cek trigger mana yang kena
            for (const trigger of allTriggers) {
                if (lowerText.includes(trigger.toLowerCase())) {
                    matchedTrigger = trigger
                    // Cek apakah termasuk panggilan Zero Two
                    if (zeroTwoTriggers.some(t => trigger.toLowerCase().includes(t) || t.includes(trigger.toLowerCase()))) {
                        isZeroTwoCall = true
                    }
                    break
                }
            }
            
            if (!matchedTrigger) return
            
            // Random delay biar natural
            const delay = Math.floor(Math.random() * 2000) + 500
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // Pilih balasan berdasarkan jenis trigger
            let replyText = ''
            if (isZeroTwoCall) {
                const randomIndex = Math.floor(Math.random() * zeroTwoReplies.length)
                replyText = zeroTwoReplies[randomIndex]
            } else {
                const randomIndex = Math.floor(Math.random() * casualReplies.length)
                replyText = casualReplies[randomIndex]
            }
            
            const participantJid = msg.key.participant || msg.key.remoteJid
            
            // KIRIM SEBAGAI REPLY ke pesan yang ngetrigger!
            await sock.sendMessage(chatId, {
                text: replyText,
                mentions: [participantJid],
                contextInfo: {
                    quotedMessage: msg.message,
                    mentionedJid: [participantJid]
                }
            })
            
            console.log(`🦋 Zero Two triggered di ${chatId} | Trigger: ${matchedTrigger} | Type: ${isZeroTwoCall ? 'PANGGILAN' : 'BIASA'}`)
            
        } catch (err) {
            console.error('Zero Two Error:', err)
        }
    })
    
    console.log('✅ Zero Two Trigger Listener READY! 🦋')
    console.log('   📝 Casual replies: 15+ kata gaul')
    console.log('   🦋 Zero Two replies: 14+ panggilan manis')
    console.log('   💬 Reply mode: ON (membalas pesan)')
}

module.exports = {
    config: pluginConfig,
    handler,
    setupTriggerListener
}