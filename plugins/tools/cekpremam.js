const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'cekpremam',
    alias: ['cekamprem', 'amstatus', 'alightstatus'],
    category: 'tools',
    description: 'Cek status premium Alight Motion',
    usage: '.cekpremam <email>',
    example: '.cekpremam email@example.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://am.neonode.my.id/api'

async function checkPremium(email) {
    try {
        const { data } = await axios.post(
            `${API_URL}/check-premium`,
            { email },
            {
                headers: { 'content-type': 'application/json' },
                timeout: 30000
            }
        )
        return data
    } catch (error) {
        return error.response?.data || { success: false, message: error.message }
    }
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function formatDate(dateStr) {
    if (!dateStr) return '-'
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    } catch {
        return dateStr
    }
}

function formatTimeLeft(expiryDate) {
    if (!expiryDate) return '-'
    try {
        const now = Date.now()
        const exp = new Date(expiryDate).getTime()
        const diff = exp - now
        
        if (diff <= 0) return '⛔ EXPIRED'
        
        const days = Math.floor(diff / 86400000)
        const hours = Math.floor((diff % 86400000) / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        
        if (days > 0) return `${days} hari ${hours} jam`
        if (hours > 0) return `${hours} jam ${minutes} menit`
        return `${minutes} menit`
    } catch {
        return '-'
    }
}

async function handler(m, { sock }) {
    const email = m.text?.trim()

    if (!email) {
        return m.reply(
            `╭━━━〔 🔍 CEK PREMIUM AM 〕━━━⬣
┃
┃ ✨ *Cek status premium Alight Motion*
┃
┃ 📌 *Format:*
┃ > ${m.prefix}cekpremam email@example.com
┃
┃ 📌 *Contoh:*
┃ > ${m.prefix}cekpremam user@gmail.com
┃
┃ 💕 *Cek status premium kamu, Darling~*
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    if (!validEmail(email)) {
        return m.reply(
            `❌ *EMAIL TIDAK VALID*\n\n` +
            `Format email yang benar:\n` +
            `> ${m.prefix}cekpremam email@example.com`
        )
    }

    await m.react('🔍')
    await m.reply(`⏳ *Mengecek status premium untuk:* ${email}`)

    try {
        const result = await checkPremium(email)

        if (!result?.success) {
            await m.react('❌')
            return m.reply(
                `❌ *CEK STATUS GAGAL*\n\n` +
                `> ${result?.message || 'Terjadi kesalahan pada server.'}\n\n` +
                `💡 Coba lagi nanti ya, Darling~`
            )
        }

        const data = result.data || result

        let statusEmoji = '❌'
        let statusText = 'Tidak Aktif'
        
        if (data.isPremium || data.status === 'active' || data.membershipStatus === 'active') {
            statusEmoji = '✅'
            statusText = 'Aktif'
        } else if (data.status === 'expired') {
            statusEmoji = '⛔'
            statusText = 'Kedaluwarsa'
        }

        let replyMsg = 
`╭━━━〔 💎 STATUS PREMIUM AM 〕━━━⬣
│
│ 👤 *Email:* ${data.email || email}
│ 📊 *Status:* ${statusEmoji} ${statusText}
│
│ ─────────────────
│
│ 💎 *Detail Premium:*`

        if (data.isPremium || data.status === 'active') {
            replyMsg += `\n│ ✅ *Premium Active*`
            if (data.planName) replyMsg += `\n│ 📦 *Plan:* ${data.planName}`
            if (data.subscriptionType) replyMsg += `\n│ 📌 *Tipe:* ${data.subscriptionType}`
            if (data.membershipStatus) replyMsg += `\n│ 🏷️ *Membership:* ${data.membershipStatus}`
            if (data.orderId) replyMsg += `\n│ 🆔 *Order ID:* ${data.orderId}`
            if (data.validUntil) {
                replyMsg += `\n│ 📅 *Berlaku Sampai:* ${formatDate(data.validUntil)}`
                replyMsg += `\n│ ⏳ *Sisa Waktu:* ${formatTimeLeft(data.validUntil)}`
            }
            if (data.uid) replyMsg += `\n│ 🆔 *UID:* ${data.uid}`
        } else if (data.status === 'expired') {
            replyMsg += `\n│ ⛔ *Premium Expired*`
            if (data.validUntil) {
                replyMsg += `\n│ 📅 *Berlaku Sampai:* ${formatDate(data.validUntil)}`
            }
        } else {
            replyMsg += `\n│ ❌ *Tidak memiliki premium*`
        }

        replyMsg += `\n│\n╰━━━━━━━━━━━━━━━━⬣`

        if (!data.isPremium && data.status !== 'active') {
            replyMsg += `\n\n💡 *Mau aktivasi premium?*\n` +
                       `> ${m.prefix}ampremv2 ${email}`
        }

        await m.react('✅')
        return m.reply(replyMsg)

    } catch (error) {
        await m.react('❌')
        console.error('[CEKPREMAM] Error:', error)
        return m.reply(
            `❌ *TERJADI KESALAHAN*\n\n` +
            `> ${error.message || 'Unknown error'}\n\n` +
            `💡 Coba lagi nanti ya, Darling~`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}