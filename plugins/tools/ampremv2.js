const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ampremv2',
    alias: ['amprem2', 'alightpremv2'],
    category: 'tools',
    description: 'Proses aktivasi Alight Motion Premium V2',
    usage: '.ampremv2 <email>',
    example: '.ampremv2 email@example.com',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://am.neonode.my.id/api'
const sessions = new Map()

async function sendLink(email) {
    try {
        const { data } = await axios.post(
            `${API_URL}/send-link`,
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

async function verifyLink(email, magicLink) {
    try {
        const { data } = await axios.post(
            `${API_URL}/verify-link`,
            { email, magicLink },
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

async function handler(m, { sock }) {
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase() || ''
    const text = m.text?.trim() || ''

    if (subCmd === 'very' || subCmd === 'verify') {
        const magicLink = args.slice(1).join(' ') || text.replace(/^very\s*/i, '').trim()

        if (!magicLink) {
            return m.reply(
                `❌ *MAGIC LINK BELUM DIBERIKAN*\n\n` +
                `📌 *Format:*\n` +
                `> ${m.prefix}ampremv2 very <magic-link>\n\n` +
                `📌 *Contoh:*\n` +
                `> ${m.prefix}ampremv2 very https://am.neonode.my.id/verify?token=xxx`
            )
        }

        const session = sessions.get(m.sender)
        if (!session) {
            return m.reply(
                `❌ *SESSION TIDAK DITEMUKAN*\n\n` +
                `Silakan mulai ulang dengan:\n` +
                `> ${m.prefix}ampremv2 email@gmail.com`
            )
        }

        await m.react('⏳')
        await m.reply(`⏳ *Memverifikasi magic link...*`)

        const result = await verifyLink(session.email, magicLink)

        if (!result?.success) {
            await m.react('❌')
            return m.reply(
                `❌ *VERIFIKASI GAGAL*\n\n` +
                `> ${result?.message || 'Magic link tidak valid atau sudah kedaluwarsa.'}`
            )
        }

        sessions.delete(m.sender)

        let resMsg = `✅ *BERHASIL DIVERIFIKASI!*\n\n`
        resMsg += `📝 ${result.message || 'Verifikasi berhasil, premium aktif.'}\n\n`

        if (result.data) {
            const d = result.data
            resMsg += `👤 *INFO AKUN*\n`
            resMsg += `┃ • Email: ${d.email || '-'}\n`
            resMsg += `┃ • UID: ${d.uid || '-'}\n`
            resMsg += `┃ • Status: ${d.status || '-'}\n\n`
            resMsg += `💎 *INFO PREMIUM*\n`
            resMsg += `┃ • Plan: ${d.planName || '-'}\n`
            resMsg += `┃ • Tipe: ${d.subscriptionType || '-'}\n`
            resMsg += `┃ • Membership: ${d.membershipStatus || '-'}\n`
            resMsg += `┃ • Order ID: ${d.orderId || '-'}\n`
            resMsg += `┃ • Berlaku Sampai: ${d.validUntil || '-'}`
        }

        await m.react('✅')
        return m.reply(resMsg)
    }

    if (!text) {
        return m.reply(
            `✨ *ALIGHT MOTION PREMIUM V2*\n\n` +
            `Masukkan email kamu.\n\n` +
            `📌 *Format:*\n` +
            `> ${m.prefix}ampremv2 email@gmail.com\n\n` +
            `📌 *Setelah magic link diterima:*\n` +
            `> ${m.prefix}ampremv2 very <magic-link>`
        )
    }

    const email = text.split(/\s+/)[0].trim()

    if (!validEmail(email)) {
        return m.reply(
            `❌ *EMAIL TIDAK VALID*\n\n` +
            `📌 *Contoh:*\n` +
            `> ${m.prefix}ampremv2 email@gmail.com`
        )
    }

    await m.react('⏳')
    await m.reply(
        `⏳ *Mengirim magic link...*\n\n` +
        `📧 Email: ${email}`
    )

    const result = await sendLink(email)

    if (!result?.success) {
        await m.react('❌')
        return m.reply(
            `❌ *GAGAL MENGIRIM MAGIC LINK*\n\n` +
            `> ${result?.message || 'Terjadi kesalahan pada server.'}`
        )
    }

    sessions.set(m.sender, { email, createdAt: Date.now() })

    await m.react('✅')
    return m.reply(
        `✅ *MAGIC LINK BERHASIL DIKIRIM!*\n\n` +
        `📧 Email: ${email}\n\n` +
        `📩 Silakan cek inbox atau folder spam.\n` +
        `🔗 Salin magic link yang dikirim.\n\n` +
        `📌 *Kirim link verifikasi:*\n` +
        `> ${m.prefix}ampremv2 very <magic-link>\n\n` +
        `⚠️ Jangan bagikan magic link kepada orang lain.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}