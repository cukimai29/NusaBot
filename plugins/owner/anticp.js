const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'anticp',
    alias: ['antipm', 'nopm'],
    category: 'owner',
    description: 'Anti chat pribadi, command hanya dapat digunakan di grup',
    usage: '.anticp <on/off/status>',
    example: '.anticp on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const ALLOWED_NUMBER = '6283178117902'

function cleanNumber(number = '') {
    return String(number)
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '')
}

function getBotNumber(sock) {
    return cleanNumber(sock?.user?.id || '')
}

async function handler(m, { sock }) {
    const db = getDatabase()

    if (!db.data.anticp) {
        db.data.anticp = {
            enabled: false
        }
        db.save()
    }

    const sub = String(m.args?.[0] || '').toLowerCase()

    if (sub === 'on') {
        db.data.anticp.enabled = true
        db.save()

        return m.reply(
`🛡️ *ANTI CP AKTIF*

Status: ✅ Aktif

📱 Nomor yang tetap diperbolehkan:
> 6283178117902
> Nomor bot

🚫 Nomor lain:
> Chat pribadi tidak akan diproses.
> Command seperti .menu tidak akan dibalas.

👥 Di grup:
> Semua command tetap dapat digunakan.`
        )
    }

    if (sub === 'off') {
        db.data.anticp.enabled = false
        db.save()

        return m.reply(
`🛡️ *ANTI CP NONAKTIF*

Status: ❌ Nonaktif

Bot kembali dapat menerima command dari chat pribadi.`
        )
    }

    if (sub === 'status') {
        return m.reply(
`🛡️ *STATUS ANTI CP*

Status: ${db.data.anticp.enabled ? '✅ AKTIF' : '❌ NONAKTIF'}

📱 Nomor khusus:
> 6283178117902
> Nomor bot

👥 Grup: ${db.data.anticp.enabled ? '✅ Tetap aktif' : '✅ Aktif'}
💬 Private Chat: ${db.data.anticp.enabled ? '🚫 Diblokir' : '✅ Aktif'}`
        )
    }

    return m.reply(
`🛡️ *ANTI CP*

> ${m.prefix}anticp on
> ${m.prefix}anticp off
> ${m.prefix}anticp status

Fungsi:
• Mematikan respon bot di private chat
• Grup tetap normal
• 6283178117902 tetap diperbolehkan
• Nomor bot tetap diperbolehkan`
    )
}


/*
 * GLOBAL ANTI CP LISTENER
 *
 * Penting:
 * Listener ini tidak membalas PM.
 * Jadi orang yang mengirim .menu, .ping, dll
 * dari private chat tidak akan mendapatkan respons.
 */
function setupAntiCPListener(sock) {
    console.log('🛡️ AntiCP listener starting...')

    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages?.[0]

            if (!msg?.message) return
            if (msg.key?.fromMe) return

            const remoteJid = msg.key?.remoteJid

            if (!remoteJid) return

            // Grup selalu diperbolehkan
            if (remoteJid.endsWith('@g.us')) return

            // Hanya proses private chat
            if (!remoteJid.endsWith('@s.whatsapp.net')) return

            const db = getDatabase()

            if (!db.data.anticp?.enabled) return

            const sender = cleanNumber(remoteJid)
            const botNumber = getBotNumber(sock)

            // Nomor khusus tetap diperbolehkan
            if (sender === ALLOWED_NUMBER) return

            // Nomor bot sendiri
            if (sender === botNumber) return

            /*
             * Jangan kirim pesan apa pun.
             *
             * Listener ini hanya memastikan pesan private
             * tidak diproses oleh fitur bot.
             */
            console.log(
                `🚫 AntiCP: mengabaikan private chat dari ${sender}`
            )

        } catch (err) {
            console.error('[AntiCP Listener]', err)
        }
    })

    console.log('✅ AntiCP listener ready!')
}

module.exports = {
    config: pluginConfig,
    handler,
    setupAntiCPListener
}