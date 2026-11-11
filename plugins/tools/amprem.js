const axios = require('axios')
const config = require('../../config')

const API_BASE_URL =
    process.env.ALIGHT_API_BASE_URL ||
    'https://am.rafaelxd.my.id/api/v1'

const API_KEY =
    process.env.ALIGHT_API_KEY ||
    'alight_live_3809350d937f869762f6de5d3a9a60d0'

const sessions = new Map()
const SESSION_TTL = 10 * 60 * 1000

function sessionKey(m) {
    return `${m.chat}:${m.sender}`
}

function cleanupSessions() {
    const now = Date.now()
    for (const [key, session] of sessions) {
        if (now - session.createdAt > SESSION_TTL) {
            sessions.delete(key)
        }
    }
}

setInterval(cleanupSessions, 60_000).unref?.()

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validLink(link) {
    try {
        const u = new URL(link)
        return /^https?:$/.test(u.protocol)
    } catch {
        return false
    }
}

async function apiPost(endpoint, body) {
    if (!API_KEY) {
        throw new Error('API key belum dikonfigurasi.')
    }

    const response = await axios.post(
        `${API_BASE_URL}/${endpoint}`,
        body,
        {
            timeout: 45_000,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            validateStatus: () => true
        }
    )

    const data = response.data || {}

    if (
        response.status < 200 ||
        response.status >= 300 ||
        data.success === false
    ) {
        throw new Error(
            data.message ||
            data.error ||
            `API mengembalikan HTTP ${response.status}`
        )
    }

    return data
}

const pluginConfig = {
    name: 'amprem',
    alias: ['alightpremium', 'am-prem'],
    category: 'tools',
    description: 'Proses aktivasi Alight Motion melalui API provider',
    usage: '.amprem <email>',
    example: '.amprem user@example.com',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const args = m.args || []
        const subCmd = args[0]?.toLowerCase() || ''
        const email = args[1] || m.text?.trim()

        if (subCmd === 'very' || subCmd === 'verify') {
            const link = args.slice(1).join(' ') || email
            if (!link || !validLink(link)) {
                return m.reply(
                    `❌ *FORMAT SALAH*

Gunakan:
> ${m.prefix}amprem very <link verifikasi>

Contoh:
> ${m.prefix}amprem very https://alight.link/verify?token=xxx`
                )
            }

            const key = sessionKey(m)
            const session = sessions.get(key)

            if (!session || session.stage !== 'waiting_link') {
                return m.reply(
                    `❌ *TIDAK ADA SESI AKTIF*

Kamu belum memulai proses AMPREM atau sesi sudah kedaluwarsa.

Mulai dengan:
> ${m.prefix}amprem email@example.com`
                )
            }

            if (Date.now() - session.createdAt > SESSION_TTL) {
                sessions.delete(key)
                return m.reply(
                    `⌛ *SESI KEDALUWARSA*

Sesi AMPREM sudah kedaluwarsa (10 menit).

Mulai ulang dengan:
> ${m.prefix}amprem ${session.email}`
                )
            }

            await m.react('⏳')

            try {
                const verify = await apiPost('verify-account', {
                    email: session.email,
                    rawLink: link
                })

                const idToken =
                    verify?.idToken ||
                    verify?.data?.idToken ||
                    verify?.result?.idToken

                if (!idToken) {
                    throw new Error(
                        verify?.message ||
                        'Verifikasi tidak mengembalikan idToken.'
                    )
                }

                await apiPost('apply-premium', {
                    email: session.email,
                    idToken
                })

                sessions.delete(key)

                await m.react('✅')

                return m.reply(
                    `✅ *PROSES SELESAI*

📧 Email: *${session.email}*
✨ Status: *Premium berhasil diproses*

Done ya kak ✅`
                )

            } catch (error) {
                await m.react('❌')
                return m.reply(
                    `❌ *VERIFIKASI GAGAL*

> ${error.message || 'Terjadi kesalahan pada API.'}

Coba pastikan link yang kamu kirim sudah benar.
Atau jalankan ulang:
> ${m.prefix}amprem ${session.email}`
                )
            }
        }

        if (!email || !validEmail(email)) {
            return m.reply(
                `✨ *ALIGHT MOTION PREMIUM*

Gunakan:
> ${m.prefix}amprem email@example.com

Atau jika sudah punya link verifikasi:
> ${m.prefix}amprem very <link>

Setelah link verifikasi dikirim, reply pesan bot ini dengan *full link verifikasi* dari email noreply.`
            )
        }

        if (!API_KEY) {
            return m.reply('❌ Fitur AMPREM belum dikonfigurasi.')
        }

        const key = sessionKey(m)

        if (sessions.has(key)) {
            const existing = sessions.get(key)
            return m.reply(
                `⏳ *PROSES SEDANG BERJALAN*

Email: *${existing.email}*

Kirim link verifikasi dengan:
> ${m.prefix}amprem very <link>

Atau reply pesan ini dengan link verifikasinya.

⏱️ Sesi berlaku selama 10 menit.`
            )
        }

        await m.react('⏳')

        await apiPost('send-magiclink', {
            email
        })

        sessions.set(key, {
            email,
            createdAt: Date.now(),
            stage: 'waiting_link'
        })

        await m.react('✅')

        return m.reply(
            `✅ *LINK VERIFIKASI TERKIRIM*

📧 Email: *${email}*

Silakan cek email dari *noreply*.
Kalau tidak ada di Inbox, coba cek folder *Spam/Junk*.

Jika sudah menerima email, kirim link dengan:
> ${m.prefix}amprem very <link>

Atau reply pesan ini dengan full link verifikasinya.

⏱️ Sesi berlaku selama 10 menit.`
        )

    } catch (error) {
        console.error('AMPREM Handler Error:', error)
        await m.react('❌')
        return m.reply(
            `❌ *GAGAL MENGIRIM LINK*

> ${error.message || 'Terjadi kesalahan pada API.'}`
        )
    }
}

async function ampremReplyHandler(m) {
    try {
        const key = sessionKey(m)
        const session = sessions.get(key)

        if (!session || session.stage !== 'waiting_link') {
            return false
        }

        if (Date.now() - session.createdAt > SESSION_TTL) {
            sessions.delete(key)
            await m.reply(
                '⌛ Sesi AMPREM sudah kedaluwarsa.\n\nSilakan ketik ".amprem email" lagi.'
            )
            return true
        }

        if (!m.quoted?.id && !m.quoted?.key?.id) {
            return false
        }

        const link = m.body?.trim()

        if (!link || !validLink(link)) {
            await m.reply(
                '❌ Link verifikasi tidak valid.\n\nKirim *full URL verifikasi* dengan:\n> ' + (m.prefix || '.') + 'amprem very <link>'
            )
            return true
        }

        await m.react('⏳')

        try {
            const verify = await apiPost('verify-account', {
                email: session.email,
                rawLink: link
            })

            const idToken =
                verify?.idToken ||
                verify?.data?.idToken ||
                verify?.result?.idToken

            if (!idToken) {
                throw new Error(
                    verify?.message ||
                    'Verifikasi tidak mengembalikan idToken.'
                )
            }

            await apiPost('apply-premium', {
                email: session.email,
                idToken
            })

            sessions.delete(key)
            await m.react('✅')

            return m.reply(
                `✅ *PROSES SELESAI*

📧 Email: *${session.email}*
✨ Status: *Premium berhasil diproses*

Done ya kak ✅`
            )

        } catch (error) {
            console.error('AMPREM Reply Error:', error)
            sessions.delete(key)
            await m.react('❌')
            return m.reply(
                `❌ *PROSES GAGAL*

> ${error.message || 'Terjadi kesalahan pada API.'}

Coba jalankan ulang:
> ${m.prefix || '.'}amprem ${session.email}`
            )
        }

    } catch (error) {
        console.error('AMPREM Reply Error:', error)
        sessions.delete(sessionKey(m))
        await m.react('❌')
        return m.reply(
            `❌ *PROSES GAGAL*

> ${error.message || 'Terjadi kesalahan.'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    ampremReplyHandler
}