const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'ampremv3',
    alias: ['amprem3', 'alightpremv3', 'sefongam'],
    category: 'tools',
    description: 'Auto generate akun Alight Motion Premium V3',
    usage: '.ampremv3 [count] [concurrency]',
    example: '.ampremv3 5 2',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

const NOXXY_BASE = 'https://am.noxxyrorr.biz.id'
const GUERRILLA_BASE = 'https://api.guerrillamail.com/ajax.php'

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Origin': NOXXY_BASE,
    'Referer': `${NOXXY_BASE}/`,
    'Content-Type': 'application/json'
}

function log(tag, msg, data) {
    const time = new Date().toLocaleTimeString('id-ID')
    const prefix = `[AMPREM V3 ${time}] [${tag}]`
    if (data !== undefined) {
        console.log(`${prefix} ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
    } else {
        console.log(`${prefix} ${msg}`)
    }
}

function logError(tag, msg, err) {
    const time = new Date().toLocaleTimeString('id-ID')
    console.error(`[AMPREM V3 ${time}] [${tag}] ❌ ${msg}`, err?.message || err)
    if (err?.response) {
        console.error(`   └─ Status: ${err.response.status}`)
        console.error(`   └─ Data: ${JSON.stringify(err.response.data)?.slice(0, 300)}`)
    }
}

async function createGuerrillaMail() {
    log('GUERRILLA', 'Membuat temporary email...')
    const res = await axios.get(`${GUERRILLA_BASE}?f=get_email_address`, { timeout: 15000 })
    const email = res.data?.email_addr
    const sid = res.data?.sid_token
    if (!email || !sid) throw new Error('Gagal membuat temporary email Guerrilla.')
    log('GUERRILLA', `Email dibuat: ${email}`)
    return { email, sid }
}

async function waitMagicLinkGuerrilla(sid, timeoutSec = 45) {
    const maxTime = timeoutSec * 1000
    const start = Date.now()
    let attempt = 0

    log('MAGIC-LINK', `Menunggu magic link (max ${timeoutSec} detik)...`)

    while (Date.now() - start < maxTime) {
        attempt++
        await new Promise(r => setTimeout(r, 2500))

        try {
            const chk = await axios.get(`${GUERRILLA_BASE}?f=check_email&seq=0&sid_token=${sid}`, { timeout: 15000 })
            const list = chk.data?.list || []

            log('MAGIC-LINK', `Cek #${attempt} — ${list.length} email ditemukan`)

            const amMsg = list.find(m => {
                const s = (m.mail_subject || '').toLowerCase()
                const f = (m.mail_from || '').toLowerCase()
                return s.includes('alight') || s.includes('sign in') || f.includes('firebase') || f.includes('alight')
            })

            if (amMsg) {
                log('MAGIC-LINK', `Email Alight ditemukan! Subject: "${amMsg.mail_subject}"`)

                const fetchMail = await axios.get(`${GUERRILLA_BASE}?f=fetch_email&email_id=${amMsg.mail_id}&sid_token=${sid}`, { timeout: 15000 })
                const body = fetchMail.data?.mail_body || ''
                const urls = body.match(/https?:\/\/[^\s"'<>]+/g) || []

                log('MAGIC-LINK', `Total ${urls.length} URL ditemukan di body email`)

                const magic = urls.find(u => u.includes('oobCode') || u.includes('alight') || u.includes('apiKey') || u.includes('signInWithEmailLink'))

                if (magic) {
                    const cleaned = magic.replace(/&amp;/g, '&')
                    log('MAGIC-LINK', `Magic link ditemukan: ${cleaned.slice(0, 80)}...`)
                    return cleaned
                } else {
                    log('MAGIC-LINK', `⚠️ Tidak ada magic link valid di ${urls.length} URL`)
                }
            }
        } catch (e) {
            logError('MAGIC-LINK', `Error attempt #${attempt}`, e)
        }
    }

    log('MAGIC-LINK', `⏱️ Timeout setelah ${attempt} attempts`)
    return null
}

async function generateSefongAM() {
    log('GENERATE', '═══════════════════════════════════')
    log('GENERATE', '🚀 Mulai generate akun baru...')
    log('GENERATE', '═══════════════════════════════════')

    const startTime = Date.now()

    const mail = await createGuerrillaMail()
    const email = mail.email

    log('SEND-LINK', `Mengirim magic link ke ${email}...`)
    let sendRes
    try {
        sendRes = await axios.post(`${NOXXY_BASE}/api/send-link`, { email }, {
            headers: HEADERS,
            timeout: 20000
        })
        log('SEND-LINK', `Response status: ${sendRes.status}`)
        log('SEND-LINK', `Response data:`, sendRes.data)
    } catch (e) {
        logError('SEND-LINK', 'Gagal request send-link', e)
        throw new Error('Gagal request send-link: ' + e.message)
    }

    if (!sendRes.data?.success) {
        log('SEND-LINK', `❌ Response success=false: ${sendRes.data?.message}`)
        throw new Error(sendRes.data?.message || 'Gagal mengirim link verifikasi ke email.')
    }
    log('SEND-LINK', '✅ Magic link berhasil dikirim')

    const magicLink = await waitMagicLinkGuerrilla(mail.sid, 45)
    if (!magicLink) {
        log('MAGIC-LINK', `❌ Timeout untuk ${email}`)
        throw new Error(`Timeout menunggu magic link di email ${email}`)
    }
    log('MAGIC-LINK', '✅ Magic link didapat')

    log('VERIFY', `Verifikasi magic link...`)
    let verifRes
    try {
        verifRes = await axios.post(`${NOXXY_BASE}/api/verify-link`, {
            email,
            magicLink
        }, {
            headers: HEADERS,
            timeout: 25000
        })
        log('VERIFY', `Response status: ${verifRes.status}`)
        log('VERIFY', `Response success: ${verifRes.data?.success}`)
    } catch (e) {
        logError('VERIFY', 'Gagal request verify-link', e)
        throw new Error('Gagal request verify-link: ' + e.message)
    }

    const resData = verifRes.data
    if (!resData.success) {
        log('VERIFY', `❌ Verifikasi gagal: ${resData.message}`)
        throw new Error(resData.message || 'Verifikasi magic link gagal.')
    }
    log('VERIFY', '✅ Verifikasi berhasil')

    const user = resData.data || resData.userData || {}
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    log('GENERATE', `✅ AKUN BERHASIL DIBUAT dalam ${elapsed}s`)
    log('GENERATE', `   📧 Email: ${user.email || email}`)
    log('GENERATE', `   🆔 UID: ${user.uid || user.id || '-'}`)
    log('GENERATE', `   👤 Status: ${user.membershipStatus || 'PREMIUM_ACTIVE'}`)
    log('GENERATE', '═══════════════════════════════════')

    return {
        status: true,
        email: user.email || email,
        uid: user.uid || user.id || null,
        membership: user.membershipStatus || 'PREMIUM_ACTIVE',
        plan: user.planName || user.tier || 'Alight Motion Pro VIP',
        subscription: user.subscription || 'Yearly VIP License',
        order_id: user.orderId || null,
        valid_until: user.validUntil || null,
        id_token: user.idToken || null,
        refresh_token: user.refreshToken || null,
        created_at: user.createdAt || new Date().toISOString()
    }
}

async function bulkGenerateSefong(count = 5, concurrency = 2, onProgress = null) {
    const total = parseInt(count) || 5
    const conc = parseInt(concurrency) || 2
    const results = []
    const errors = []

    log('BULK', `═══════════════════════════════════`)
    log('BULK', `📊 Mulai bulk generate: ${total} akun (concurrency: ${conc})`)
    log('BULK', `═══════════════════════════════════`)

    const queue = Array.from({ length: total }, (_, i) => i + 1)
    const startTime = Date.now()

    async function worker() {
        while (queue.length > 0) {
            const idx = queue.shift()
            log('BULK', `🔄 Worker start [#${idx}]`)
            const taskStart = Date.now()
            try {
                const acc = await generateSefongAM()
                results.push(acc)
                const taskTime = ((Date.now() - taskStart) / 1000).toFixed(1)
                log('BULK', `✅ [#${idx}] SUKSES dalam ${taskTime}s — Total OK: ${results.length}`)
                if (onProgress) onProgress({ current: results.length + errors.length, total, status: 'success', index: idx })
            } catch (err) {
                errors.push({ index: idx, error: err.message })
                const taskTime = ((Date.now() - taskStart) / 1000).toFixed(1)
                logError('BULK', `[#${idx}] GAGAL dalam ${taskTime}s`, err)
                if (onProgress) onProgress({ current: results.length + errors.length, total, status: 'failed', index: idx, error: err.message })
            }
        }
    }

    const workers = Array.from({ length: Math.min(conc, total) }, () => worker())
    await Promise.all(workers)

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    log('BULK', `═══════════════════════════════════`)
    log('BULK', `📊 HASIL BULK GENERATE:`)
    log('BULK', `   ✅ Success: ${results.length}`)
    log('BULK', `   ❌ Failed: ${errors.length}`)
    log('BULK', `   ⏱️ Total waktu: ${totalTime}s`)
    log('BULK', `═══════════════════════════════════`)

    if (errors.length > 0) {
        log('BULK', `📋 Error detail:`)
        errors.forEach(e => log('BULK', `   [#${e.index}] ${e.error}`))
    }

    return {
        status: true,
        service: 'Sefong AM Bulk Generator',
        total_requested: total,
        total_success: results.length,
        total_failed: errors.length,
        accounts: results,
        errors: errors.length ? errors : undefined
    }
}

function formatSingleResult(acc) {
    return (
`╭━━━〔 💎 AMPREM V3 - SUKSES 〕━━━⬣
│
│ 📧 *Email:* ${acc.email}
│ 🆔 *UID:* ${acc.uid || '-'}
│ 👤 *Status:* ${acc.membership}
│
│ ─────────────────
│
│ 💎 *Info Premium:*
│ 📦 *Plan:* ${acc.plan}
│ 📌 *Subscription:* ${acc.subscription}
│ 🆔 *Order ID:* ${acc.order_id || '-'}
│ 📅 *Valid Until:* ${acc.valid_until || '-'}
│
│ ─────────────────
│
│ 🔑 *ID Token:*
│ \`${acc.id_token ? acc.id_token.slice(0, 60) + '...' : '-'}\`
│
│ 🔄 *Refresh Token:*
│ \`${acc.refresh_token ? acc.refresh_token.slice(0, 60) + '...' : '-'}\`
│
│ ─────────────────
│
│ ⏰ *Created:* ${acc.created_at}
│
╰━━━━━━━━━━━━━━━━⬣`
    )
}

function formatBulkResult(result) {
    let txt = `╭━━━〔 💎 AMPREM V3 - BULK RESULT 〕━━━⬣\n│\n`
    txt += `│ 📊 *Total Requested:* ${result.total_requested}\n`
    txt += `│ ✅ *Success:* ${result.total_success}\n`
    txt += `│ ❌ *Failed:* ${result.total_failed}\n│\n`
    txt += `╰━━━━━━━━━━━━━━━━⬣\n\n`

    if (result.accounts.length > 0) {
        txt += `╭━━━〔 ✅ AKUN BERHASIL 〕━━━⬣\n│\n`
        result.accounts.forEach((acc, i) => {
            txt += `│ *${i + 1}.* ${acc.email}\n`
            txt += `│    🆔 UID: ${acc.uid || '-'}\n`
            txt += `│    💎 ${acc.membership}\n│\n`
        })
        txt += `╰━━━━━━━━━━━━━━━━⬣\n\n`
    }

    if (result.errors && result.errors.length > 0) {
        txt += `╭━━━〔 ❌ GAGAL 〕━━━⬣\n│\n`
        result.errors.slice(0, 10).forEach((err, i) => {
            txt += `│ *${i + 1}.* [#${err.index}] ${err.error}\n`
        })
        if (result.errors.length > 10) {
            txt += `│ _...dan ${result.errors.length - 10} error lainnya_\n`
        }
        txt += `╰━━━━━━━━━━━━━━━━⬣`
    }

    return txt
}

async function handler(m, { sock }) {
    const args = m.args || []

    log('HANDLER', `Command dari ${m.sender} | Args: ${JSON.stringify(args)}`)

    if (args.length === 0) {
        return m.reply(
`╭━━━〔 💎 AMPREM V3 〕━━━⬣
│
│ ✨ *Auto Generate Alight Motion Premium*
│
│ 📌 *Format:*
│ > ${m.prefix}ampremv3 <count> [concurrency]
│
│ 📌 *Contoh:*
│ > ${m.prefix}ampremv3 1
│ > ${m.prefix}ampremv3 5 2
│ > ${m.prefix}ampremv3 10 3
│
│ ⚙️ *Info:*
│ • Count max: *10*
│ • Concurrency max: *3*
│ • Pakai email temporary
│ • Full otomatis
│
│ ⚠️ *Warning:*
│ > Jangan spam, nanti IP kena block
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    let count = parseInt(args[0]) || 1
    let concurrency = parseInt(args[1]) || 2

    if (count > 10) count = 10
    if (count < 1) count = 1
    if (concurrency > 3) concurrency = 3
    if (concurrency < 1) concurrency = 1

    if (count > concurrency) {
        concurrency = Math.min(concurrency, count)
    }

    log('HANDLER', `📋 Config: count=${count}, concurrency=${concurrency}`)

    await m.react('⏳')

    if (count === 1) {
        await m.reply(
`╭━━━〔 💎 AMPREM V3 〕━━━⬣
│
│ ⏳ *Generating 1 akun premium...*
│
│ 📧 Membuat temporary email...
│ 📨 Mengirim magic link...
│ 🔗 Menunggu verifikasi email...
│ ✅ Apply premium...
│
│ ⏱️ Estimasi: *30-60 detik*
│
╰━━━━━━━━━━━━━━━━⬣`
        )

        try {
            const acc = await generateSefongAM()
            await m.react('✅')
            log('HANDLER', '✅ Single generate berhasil')
            return m.reply(formatSingleResult(acc))
        } catch (err) {
            await m.react('❌')
            logError('HANDLER', 'Single generate gagal', err)
            return m.reply(
`╭━━━〔 ❌ GAGAL 〕━━━⬣
│
│ 📛 *Error:* ${err.message}
│
│ 💡 Coba lagi atau kurangi jumlah
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }
    }

    // --- BAGIAN YANG DIPERBAIKI ---
    let progressMsg = await m.reply(
`╭━━━〔 💎 AMPREM V3 - BULK 〕━━━⬣
│
│ ⏳ *Generating ${count} akun premium...*
│ 📊 Concurrency: *${concurrency}*
│
│ ⏱️ *Estimasi:* ${Math.ceil(count * 30 / concurrency)} detik
│
│ 💡 _Jangan spam chat selama proses_
│
╰━━━━━━━━━━━━━━━━⬣`
    )

    let lastUpdate = Date.now()
    let isFirstProgress = true

    const onProgress = async ({ current, total, status, index }) => {
        // Rate limit 2 detik agar progress lebih sering muncul
        if (Date.now() - lastUpdate < 2000) return
        lastUpdate = Date.now()

        log('PROGRESS', `📊 ${current}/${total} — Terakhir: ${status} [#${index}]`)

        const progressText = 
`╭━━━〔 💎 AMPREM V3 - PROGRESS 〕━━━⬣
│
│ 📊 *Progress:* ${current}/${total}
│ ${status === 'success' ? '✅' : '❌'} Status: ${status.toUpperCase()} [#${index}]
│
│ 💡 _Tunggu ya, jangan spam_
│
╰━━━━━━━━━━━━━━━━⬣`

        try {
            if (isFirstProgress) {
                // Jika progress pertama, edit pesan awal
                await sock.sendMessage(m.chat, { text: progressText, edit: progressMsg.key })
                isFirstProgress = false
            } else {
                // Jika bukan, kirim pesan baru agar pasti sampai (menghindari bug edit)
                await sock.sendMessage(m.chat, { text: progressText })
            }
        } catch (e) {
            // Jangan di-diamkan, log error jika gagal kirim
            logError('PROGRESS', 'Gagal kirim update progress', e)
        }
    }

    try {
        const result = await bulkGenerateSefong(count, concurrency, onProgress)

        await m.react(result.total_success > 0 ? '✅' : '❌')
        log('HANDLER', `✅ Bulk generate selesai: ${result.total_success} sukses, ${result.total_failed} gagal`)

        // Kirim hasil akhir sebagai pesan baru (lebih aman daripada edit)
        await m.reply(formatBulkResult(result))

    } catch (err) {
        await m.react('❌')
        logError('HANDLER', 'Bulk generate gagal', err)
        return m.reply(
`╭━━━〔 ❌ GAGAL 〕━━━⬣
│
│ 📛 *Error:* ${err.message}
│
│ 💡 Coba lagi nanti
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}