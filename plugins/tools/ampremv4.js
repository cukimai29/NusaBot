const axios = require('axios')
const crypto = require('crypto')
const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'ampremv4',
    alias: ['amprem4', 'alightpremv4', 'amprem-send', 'amprem-verif'],
    category: 'tools',
    description: 'Generate akun Alight Motion Premium V4 (langsung dari AM)',
    usage: '.ampremv4 send <email> / .ampremv4 verif <email> | <link>',
    example: '.ampremv4 send user@gmail.com',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

const cfg = {
    key: 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0',
    idt: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
    stk: 'https://securetoken.googleapis.com/v1/token',
    vfy: 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
}

const dip = () => [crypto.randomInt(1, 255), crypto.randomInt(0, 255), crypto.randomInt(0, 255), crypto.randomInt(1, 255)].join('.')

const sp = h => ({
    ...h,
    'x-forwarded-for': dip(),
    'x-real-ip': dip(),
    'client-ip': dip(),
    'x-client-ip': dip(),
    'x-originating-ip': dip(),
    'x-cluster-client-ip': dip()
})

const h1 = {
    'content-type': 'application/json',
    'x-android-package': 'com.alightcreative.motion',
    'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
    'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
}

const h2 = {
    'content-type': 'application/json; charset=utf-8',
    'user-agent': 'okhttp/3.12.1',
    'accept-encoding': 'gzip'
}

function log(tag, msg, data) {
    const time = new Date().toLocaleTimeString('id-ID')
    const prefix = `[AMPREM V4 ${time}] [${tag}]`
    if (data !== undefined) {
        console.log(`${prefix} ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
    } else {
        console.log(`${prefix} ${msg}`)
    }
}

function logError(tag, msg, err) {
    const time = new Date().toLocaleTimeString('id-ID')
    console.error(`[AMPREM V4 ${time}] [${tag}] ❌ ${msg}`, err?.message || err)
}

const bad = e => {
    const d = e.response?.data
    return d ? (typeof d === 'object' ? JSON.stringify(d) : String(d)) : e.message
}

async function link(email) {
    log('LINK', `Mengirim magic link ke ${email}...`)

    const c1 = { identifier: email, continueUri: 'http://localhost' }
    const c2 = {
        requestType: 6,
        email: email,
        androidInstallApp: true,
        canHandleCodeInApp: true,
        continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
        iosBundleId: 'com.alightcreative.motion',
        androidPackageName: 'com.alightcreative.motion',
        androidMinimumVersion: '585',
        clientType: 'CLIENT_TYPE_ANDROID'
    }

    try {
        await axios.post(`${cfg.idt}/createAuthUri?key=${cfg.key}`, c1, { headers: sp(h1) })
        log('LINK', 'createAuthUri OK')
        const r = await axios.post(`${cfg.idt}/getOobConfirmationCode?key=${cfg.key}`, c2, { headers: sp(h1) })
        log('LINK', 'getOobConfirmationCode OK', r.data)
        return { ok: true, r: r.data }
    } catch (e) {
        logError('LINK', 'Gagal kirim link', e)
        return { ok: false, why: bad(e) }
    }
}

function code(raw) {
    if (!raw) return null
    let s = String(raw).replace(/&amp;/g, '&')
    try {
        s = decodeURIComponent(s)
    } catch {}

    try {
        const u = new URL(s)
        let c = u.searchParams.get('oobCode')
        if (!c) {
            const n = u.searchParams.get('link') || u.searchParams.get('q') || u.searchParams.get('url')
            if (n) {
                try {
                    c = new URL(n).searchParams.get('oobCode')
                } catch {}
            }
        }
        if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '')
    } catch {}

    const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i)
    if (m) return m[1]

    const t = raw.trim()
    if (/^[a-zA-Z0-9_-]{10,}$/.test(t) && !t.includes('://')) return t

    return null
}

async function auth(email, raw) {
    log('AUTH', `Verifikasi untuk ${email}...`)
    const c = code(raw)
    if (!c) {
        log('AUTH', '❌ OobCode tidak ditemukan')
        return { ok: false, why: 'Code tidak ditemukan' }
    }
    log('AUTH', `OobCode ditemukan: ${c.slice(0, 20)}...`)

    try {
        const a = await axios.post(`${cfg.idt}/emailLinkSignin?key=${cfg.key}`, {
            email: email,
            oobCode: c,
            clientType: 'CLIENT_TYPE_ANDROID'
        }, { headers: sp(h1) })

        log('AUTH', 'emailLinkSignin OK — UID:', a.data.localId)

        let u = null
        try {
            const b = await axios.post(`${cfg.idt}/getAccountInfo?key=${cfg.key}`, {
                idToken: a.data.idToken
            }, { headers: sp(h1) })
            u = b.data?.users?.[0] || null
            log('AUTH', 'getAccountInfo OK')
        } catch {}

        return {
            ok: true,
            email: email,
            id: a.data.idToken,
            ref: a.data.refreshToken,
            uid: a.data.localId,
            baru: !!a.data.isNewUser,
            user: u
        }
    } catch (e) {
        logError('AUTH', 'Gagal verifikasi', e)
        return { ok: false, why: bad(e) }
    }
}

async function pro(id) {
    log('PRO', 'Mempromosikan akun...')

    const o = 'neo-' + crypto.randomBytes(6).toString('hex')
    const b = {
        data: {
            productId: 'am.full.sub.annual.19q4',
            token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
            skuType: 'subs',
            orderId: o
        }
    }

    const h = {
        ...h2,
        authorization: 'Bearer ' + id,
        'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'
    }

    try {
        const r = await axios.post(cfg.vfy, b, { headers: sp(h) })
        log('PRO', `✅ Premium aktif! Order ID: ${o}`)
        return { ok: true, order: o, r: r.data }
    } catch (e) {
        logError('PRO', 'Gagal promosikan', e)
        return { ok: false, why: bad(e) }
    }
}

async function re(ref) {
    try {
        const r = await axios.post(`${cfg.stk}?key=${cfg.key}`, {
            grant_type: 'refresh_token',
            refresh_token: ref
        })
        return { ok: true, id: r.data.id_token, ref: r.data.refresh_token }
    } catch (e) {
        return { ok: false, why: bad(e) }
    }
}

const sessions = new Map()

async function handler(m, { sock }) {
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase() || ''
    const text = m.text?.trim() || ''

    log('HANDLER', `Command dari ${m.sender} | Sub: ${subCmd}`)

    const safeReply = async (txt) => {
        try {
            if (txt.length > 4000) {
                const chunks = txt.match(/[\s\S]{1,3900}/g) || []
                for (const chunk of chunks) {
                    await m.reply(chunk)
                    await new Promise(r => setTimeout(r, 500))
                }
            } else {
                await m.reply(txt)
            }
        } catch (e) {
            logError('SAFE-REPLY', 'Gagal kirim pesan', e)
        }
    }

    if (subCmd === 'send') {
        const email = args[1]
        if (!email) {
            return safeReply(
`╭━━━〔 💎 AMPREM V4 〕━━━⬣
│
│ 📌 *Format:*
│ > ${m.prefix}ampremv4 send <email>
│
│ 📌 *Contoh:*
│ > ${m.prefix}ampremv4 send user@gmail.com
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }

        try { await m.react('⏳') } catch {}

        const r = await link(email)

        if (r.ok) {
            sessions.set(m.sender, { email, createdAt: Date.now() })

            try { await m.react('✅') } catch {}

            return safeReply(
`╭━━━〔 💎 AMPREM V4 - LINK TERKIRIM 〕━━━⬣
│
│ ✅ *Magic link berhasil dikirim!*
│
│ 📧 *Email:* ${email}
│ 📬 Cek inbox atau folder spam
│
│ ─────────────────
│
│ 📌 *Langkah selanjutnya:*
│ > Copy link dari email
│ > Kirim ke bot dengan format:
│ > ${m.prefix}ampremv4 verif ${email} | <link>
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        } else {
            try { await m.react('❌') } catch {}
            return safeReply(
`╭━━━〔 ❌ GAGAL KIRIM LINK 〕━━━⬣
│
│ 📛 *Error:* ${r.why.slice(0, 200)}
│
│ 💡 Coba lagi nanti
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }
    }

    if (subCmd === 'verif') {
        let em, linkUrl

        if (text.includes('|')) {
            const parts = text.replace(/^verif\s*/i, '').split('|').map(p => p.trim())
            em = parts[0]
            linkUrl = parts[1]
        } else {
            em = args[1]
            linkUrl = args.slice(2).join(' ')
        }

        if (!em || !linkUrl) {
            return safeReply(
`╭━━━〔 💎 AMPREM V4 〕━━━⬣
│
│ 📌 *Format:*
│ > ${m.prefix}ampremv4 verif <email> | <link>
│
│ 📌 *Contoh:*
│ > ${m.prefix}ampremv4 verif user@gmail.com | https://...
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }

        try { await m.react('⏳') } catch {}
        await safeReply(`⏳ *Verifikasi & memproses premium...*\n\n📧 Email: ${em}`)

        const v = await auth(em, linkUrl)
        if (!v.ok) {
            try { await m.react('❌') } catch {}
            return safeReply(
`╭━━━〔 ❌ VERIFIKASI GAGAL 〕━━━⬣
│
│ 📛 *Error:* ${v.why.slice(0, 200)}
│
│ 💡 Pastikan link valid & belum expired
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }

        log('HANDLER', `✅ Auth OK: UID ${v.uid}`)
        await safeReply(`✅ *Login berhasil!*\n\n📧 Email: ${v.email}\n🆕 Akun baru: ${v.baru ? 'Ya' : 'Tidak'}\n\n⏳ *Mempromosikan akun...*`)

        const q = await pro(v.id)

        if (q.ok) {
            sessions.set(m.sender, {
                email: em,
                id: v.id,
                ref: v.ref,
                uid: v.uid,
                pro: true,
                order: q.order
            })

            try { await m.react('💗') } catch {}

            return safeReply(
`╭━━━〔 💎 AMPREM V4 - SUKSES 〕━━━⬣
│
│ 🎉 *PREMIUM SUCCESS!*
│
│ ─────────────────
│
│ 📧 *Email:* ${em}
│ 🆔 *UID:* ${v.uid}
│ 📌 *Order ID:* ${q.order}
│ ✨ *Status:* Premium Active
│ 💎 *Plan:* Alight Motion Pro VIP
│ 📅 *Subscription:* Yearly License
│
│ ─────────────────
│
│ 🔑 *ID Token:*
│ \`${v.id ? v.id.slice(0, 60) + '...' : '-'}\`
│
│ 🔄 *Refresh Token:*
│ \`${v.ref ? v.ref.slice(0, 60) + '...' : '-'}\`
│
│ ─────────────────
│
│ 💕 *Nikmati premiumnya, Darling~*
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        } else {
            try { await m.react('❌') } catch {}
            return safeReply(
`╭━━━〔 ❌ PREMIUM GAGAL 〕━━━⬣
│
│ 📛 *Error:* ${q.why.slice(0, 200)}
│
│ 💡 Login berhasil tapi premium gagal
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }
    }

    return safeReply(
`╭━━━〔 💎 AMPREM V4 〕━━━⬣
│
│ ✨ *Alight Motion Premium Generator V4*
│
│ 📌 *Cara Pakai:*
│
│ *1. Kirim magic link:*
│ > ${m.prefix}ampremv4 send <email>
│
│ *2. Verifikasi & Premium:*
│ > ${m.prefix}ampremv4 verif <email> | <link>
│
│ ─────────────────
│
│ ⚙️ *Info:*
│ • Langsung dari server Alight Motion
│ • Support custom Order ID
│ • Pakai email asli (bukan temporary)
│ • Full otomatis
│
│ ⚠️ *Warning:*
│ > Gunakan email yang valid
│ > Link verifikasi cuma berlaku sekali
│
╰━━━━━━━━━━━━━━━━⬣`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}