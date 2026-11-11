const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'kudeta',
    alias: ['revolusi', 'takeover', 'rebelfit'],
    category: 'owner',
    description: 'Merebut kekuasaan grup - cabut semua admin dan naikkin owner jadi admin',
    usage: '.kudeta',
    example: '.kudeta',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    cooldown: 60,
    energi: 100,
    isEnabled: true
}

async function handler(m, { sock }) {
    const groupId = m.chat
    const ownerNumber = config.owner?.number || config.ownerNumber || '628xxxx'
    const ownerJid = ownerNumber.includes('@') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`
    const senderJid = m.sender
    
    // Cek siapa yang pake command
    if (senderJid !== ownerJid && !config.owner?.includes?.(senderJid.split('@')[0])) {
        await m.reply(`🦋 *ZERO TWO*: "He~ kamu siapa? Gak boleh pake fitur ini darling~ 🎐"`)
        return
    }
    
    
    const confirmMsg = await sock.sendMessage(groupId, {
        text: `⚠️ *KUDETA DIMULAI* ⚠️\n\n` +
               `🦋 *Zero Two:* "Darling, lo yakin mau lancar kudeta? Ini berbahaya banget loh~"\n\n` +
               `📋 *Yang akan terjadi:*\n` +
               `> • Semua admin akan di-demote\n` +
               `> • Owner akan di-promote jadi admin\n` +
               `> • Bot akan jadi superadmin (jika memungkinkan)\n\n` +
               `⏱️ *Waktu konfirmasi: 30 detik*`,
        buttons: [
            { buttonId: 'confirm_kudeta', buttonText: { displayText: '✅ KONFIRM KUDETA' }, type: 1 },
            { buttonId: 'batal_kudeta', buttonText: { displayText: '❌ BATALKAN' }, type: 1 }
        ]
    })
    
    
    let confirmed = false
    let cancelled = false
    
    const buttonCollector = async (update) => {
        try {
            const messages = update.messages || [update]
            const msg = messages[0]
            
            if (!msg || msg.key.remoteJid !== groupId) return
            
            // Cek apakah itu pesan tombol (buttonsResponseMessage)
            if (!msg.message?.buttonsResponseMessage) return
            
            const buttonId = msg.message.buttonsResponseMessage.selectedButtonId
            const sender = msg.key.participant || msg.key.remoteJid
            
            // Cek apakah yang tekan tombol adalah yang execute command
            if (sender !== senderJid) return
            
            if (buttonId === 'confirm_kudeta') {
                confirmed = true
            } else if (buttonId === 'batal_kudeta') {
                cancelled = true
            }
        } catch (err) {
            console.error('Button collector error:', err)
        }
    }
    
    
    sock.ev.on('messages.upsert', buttonCollector)
    
    // Tunggu 30 detik
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    // Hapus listener
    sock.ev.off('messages.upsert', buttonCollector)
    
    // Hapus pesan konfirmasi (coba-coba)
    try {
        await sock.sendMessage(groupId, { delete: confirmMsg.key })
    } catch (err) {
        // Gak masalah
    }
    
    if (cancelled) {
        await sock.sendMessage(groupId, { text: `❌ *KUDETA DIBATALKAN*\n\n> Zero Two: "Huff~ untung batal, aku kaget darling~ 🦋"` })
        return
    }
    
    if (!confirmed) {
        await sock.sendMessage(groupId, { text: `⏰ *KUDETA EXPIRED*\n\n> Zero Two: "Waktu habis darling~ Lain kali cepet konfirm ya 🎐"` })
        return
    }
    
    await sock.sendMessage(groupId, { text: `🕹️ *PROSES KUDETA DIMULAI*\n\n> Zero Two: "Awas ya darling, mulai nih~ 🔥"` })
    
    try {
        // Step 1: Dapetin metadata grup
        const groupMeta = await sock.groupMetadata(groupId)
        const participants = groupMeta.participants || []
        
        // Step 2: Cek apakah bot admin
        const botJid = sock.user.id
        const isBotAdmin = participants.some(p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin'))
        
        if (!isBotAdmin) {
            await sock.sendMessage(groupId, { text: `❌ *KUDETA GAGAL*\n\n> Zero Two: "Aku gak bisa darling! Aku bukan admin di grup ini~ 🎐\n\nBot harus jadi admin dulu buat kudeta!"` })
            return
        }
        
        // Step 3: Kumpulin semua admin (selain bot)
        const admins = participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin') && p.id !== botJid)
        const adminJids = admins.map(a => a.id)
        
        if (adminJids.length === 0) {
            await sock.sendMessage(groupId, { text: `⚠️ *KUDETA GAGAL*\n\n> Zero Two: "Darling, gak ada admin selain aku di sini~ Gak perlu kudeta~ 🦋"` })
            return
        }
        
        await sock.sendMessage(groupId, { text: `🔍 *MENDETEKSI ADMIN...*\n\n> Ditemukan ${adminJids.length} admin:\n${admins.map(a => `> @${a.id.split('@')[0]}`).join('\n')}\n\n> Zero Two: "Siap darling, mau gw cabut jabatan mereka~ 💫"`, mentions: adminJids })
        
        // Step 4: Cabut jabatan semua admin
        let successRemoves = []
        let failedRemoves = []
        
        for (const adminJid of adminJids) {
            try {
                await sock.groupParticipantsUpdate(groupId, [adminJid], 'demote')
                successRemoves.push(adminJid)
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (err) {
                failedRemoves.push({ jid: adminJid, error: err.message })
            }
        }
        
        // Step 5: Naikin owner jadi admin
        let promoteSuccess = false
        try {
            await sock.groupParticipantsUpdate(groupId, [ownerJid], 'promote')
            promoteSuccess = true
        } catch (err) {
            console.error('Gagal promote owner:', err)
        }
        
        // Step 6: Naikin bot jadi superadmin
        let superadminSuccess = false
        try {
            await sock.groupParticipantsUpdate(groupId, [botJid], 'promote')
            superadminSuccess = true
        } catch (err) {}
        
        // Step 7: Kirim laporan
        let resultText = `🦋 *KUDETA BERHASIL!* 🦋\n\n`
        resultText += `╭─〔 🔥 *HASIL KUDETA* 〕─🦋\n`
        resultText += `│ ✅ *Admin dicabut:* ${successRemoves.length} orang\n`
        
        if (successRemoves.length > 0) {
            resultText += `│    ${successRemoves.map(j => `@${j.split('@')[0]}`).join(', ')}\n`
        }
        
        if (failedRemoves.length > 0) {
            resultText += `│ ❌ *Gagal cabut:* ${failedRemoves.length} orang\n`
        }
        
        resultText += `│\n`
        resultText += `│ 👑 *Owner jadi admin:* ${promoteSuccess ? '✅ BERHASIL' : '❌ GAGAL'}\n`
        resultText += `│ 🤖 *Bot superadmin:* ${superadminSuccess ? '✅ BERHASIL' : '⚠️ TIDAK'}\n`
        resultText += `╰─────────────────🦋\n\n`
        
        if (promoteSuccess) {
            resultText += `🎉 *SELAMAT DARLING!* 🎉\n`
            resultText += `> Lo sekarang jadi admin di grup ini!\n`
            resultText += `> Kekuasaan berhasil direbut~ 🔥\n\n`
        }
        
        resultText += `💫 *Zero Two:* "Kudeta selesai darling~ Sekarang lo yang berkuasa!"`
        
        const mentionJids = [...successRemoves, ownerJid]
        
        await sock.sendMessage(groupId, {
            text: resultText,
            mentions: mentionJids
        })
        
        console.log(`🔥 KUDETA di grup ${groupId} oleh ${senderJid}`)
        
    } catch (err) {
        console.error('Kudeta error:', err)
        await sock.sendMessage(groupId, { text: `❌ *KUDETA GAGAL TOTAL*\n\n> Error: ${err.message}\n\n> Zero Two: "Maaf darling, ada yang error nih~ 🦋"` })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}