// plugins/owner/antipm.js

const config = require('../../config')

const pluginConfig = {
    name: 'antipm',
    alias: ['apm'],
    category: 'owner',
    description: 'Mengatur Anti PM (blokir asli WhatsApp untuk PM dari non-owner)',
    usage: '.antipm [on/off]',
    example: '.antipm on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

let antiPM = false

// Cache jid yang udah diblokir di sesi ini, biar gak spam updateBlockStatus tiap pesan
const blockedThisSession = new Set()

function cleanNumber(number = '') {
    return String(number)
        .replace(/@s\.whatsapp\.net/g, '')
        .replace(/\D/g, '')
}

function getOwnerNumbers() {
    const owner = config.owner?.number
    if (!owner) return []

    if (Array.isArray(owner)) {
        return owner.map(n => cleanNumber(n))
    }

    return [cleanNumber(owner)]
}

function getSenderNumber(m) {
    const jid = m.sender || m.key?.participant || m.chat || m.key?.remoteJid
    return cleanNumber(jid)
}

async function handler(m) {
    const args = m.args || []
    const sub = String(args[0] || '').toLowerCase()

    const sender = getSenderNumber(m)
    const owners = getOwnerNumbers()

    // Hanya owner yang boleh mengatur Anti-PM
    if (!owners.includes(sender)) {
        return
    }

    // .antipm on
    if (sub === 'on') {
        antiPM = true

        return m.reply(
            `🛡️ *ANTI PM*\n\n` +
            `Status: ✅ *ON*\n\n` +
            `PM dari nomor yang tidak diizinkan akan langsung *diblokir asli* WhatsApp.`
        )
    }

    // .antipm off
    if (sub === 'off') {
        antiPM = false

        return m.reply(
            `🛡️ *ANTI PM*\n\n` +
            `Status: ❌ *OFF*\n\n` +
            `Bot kembali menerima PM seperti biasa.`
        )
    }

    // .antipm saja → status
    return m.reply(
        `🛡️ *STATUS ANTI PM*\n\n` +
        `Status: ${antiPM ? '✅ *ON*' : '❌ *OFF*'}`
    )
}

/**
 * Dipakai dispatcher/handler.js sebelum menjalankan plugin lain (mode "soft ignore",
 * tanpa block asli). Opsional dipakai kalau mau integrasi manual di messageHandler.
 */
function shouldIgnorePM(m) {
    if (!antiPM) return false

    const jid = m.chat || m.key?.remoteJid

    // Group tidak terpengaruh
    if (jid?.endsWith('@g.us')) return false

    const sender = getSenderNumber(m)
    const owners = getOwnerNumbers()

    // Owner tetap boleh menggunakan bot
    if (owners.includes(sender)) return false

    // PM user lain → abaikan
    return true
}

/**
 * Listener aktif yang beneran nge-block kontak lewat WhatsApp (bukan cuma ignore).
 * Dipanggil sekali di index.js: await setupAntiPMListener(sock)
 *
 * Sebelumnya index.js udah manggil fungsi ini tapi file antipm.js gak pernah
 * export-nya, jadi require() balikin undefined dan langsung TypeError pas
 * dipanggil (ketangkep try/catch di index.js, cuma keliatan di console log).
 * Makanya anti-PM kelihatan "gak berfungsi" walau status di-set ON.
 */
async function setupAntiPMListener(sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        if (!antiPM) return

        for (const msg of messages) {
            try {
                if (!msg.message) continue
                if (msg.key?.fromMe) continue

                const jid = msg.key?.remoteJid
                if (!jid) continue

                // Group & broadcast/status gak kena anti-PM
                if (jid.endsWith('@g.us')) continue
                if (jid === 'status@broadcast') continue

                const senderNumber = cleanNumber(jid)
                const owners = getOwnerNumbers()

                // Owner selalu boleh PM bot
                if (owners.includes(senderNumber)) continue

                // Udah pernah diblokir sesi ini, gak usah diulang
                if (blockedThisSession.has(jid)) continue

                blockedThisSession.add(jid)

                console.log(`[AntiPM] Blokir asli PM dari: ${senderNumber}`)
                await sock.updateBlockStatus(jid, 'block')

            } catch (err) {
                console.error('[AntiPM] Error saat proses pesan:', err.message)
            }
        }
    })
}

module.exports = {
    config: pluginConfig,
    handler,
    shouldIgnorePM,
    setupAntiPMListener
}