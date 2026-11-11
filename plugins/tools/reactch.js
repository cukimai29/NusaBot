const https = require('node:https')
const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'reactch',
    alias: ['reactchannel', 'rxch'],
    category: 'tools',
    description: 'Auto react ke channel WhatsApp',
    usage: '.reactch <url_channel> <emoji1,emoji2> [count]',
    example: '.reactch https://whatsapp.com/channel/xxx 👍,❤️,🔥 3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const BASE = 'https://react.zfile.web.id'

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function genSessionId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = 'zx_'

    for (let i = 0; i < 16; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
    }

    return id
}

function parseCookies(headers, cookies) {
    const setCookie = headers['set-cookie']
    if (!setCookie) return

    const arr = Array.isArray(setCookie) ? setCookie : [setCookie]

    for (const cookie of arr) {
        const match = cookie.match(/^([^=]+)=([^;]+)/)

        if (match) {
            cookies[match[1]] = match[2]
        }
    }
}

function cookieHeader(cookies) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
}

function req(method, path, body = null, extra = {}, cookies = {}) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(path)

            const headers = {
                'User-Agent': UA,
                'Accept': 'application/json',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
                'Origin': BASE,
                'Referer': `${BASE}/`,
                ...extra
            }

            const cookie = cookieHeader(cookies)

            if (cookie) {
                headers.Cookie = cookie
            }

            if (body && !headers['Content-Length']) {
                const payload =
                    typeof body === 'string'
                        ? body
                        : JSON.stringify(body)

                headers['Content-Length'] = Buffer.byteLength(payload)
            }

            const options = {
                method,
                hostname: url.hostname,
                port: 443,
                path: `${url.pathname}${url.search}`,
                headers
            }

            const request = https.request(options, response => {
                parseCookies(response.headers, cookies)

                let data = ''

                response.on('data', chunk => {
                    data += chunk
                })

                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data))
                    } catch {
                        resolve(data)
                    }
                })
            })

            request.on('error', reject)

            request.setTimeout(30000, () => {
                request.destroy()
                reject(new Error('Request timeout'))
            })

            if (body) {
                request.write(
                    typeof body === 'string'
                        ? body
                        : JSON.stringify(body)
                )
            }

            request.end()
        } catch (error) {
            reject(error)
        }
    })
}

async function getTicket(sessionId, cookies) {
    const data = await req(
        'GET',
        `${BASE}/api/challenge`,
        null,
        {
            'X-Session-Id': sessionId
        },
        cookies
    )

    if (!data?.ok) {
        throw new Error(
            data?.message || 'Challenge gagal'
        )
    }

    return data
}

async function sendReact(url, reactions, ticket, sessionId, cookies) {
    return req(
        'POST',
        `${BASE}/api/react`,
        {
            url,
            reactions,
            ticket
        },
        {
            'Content-Type': 'application/json',
            'X-ZX-Request': 'zx-reactch',
            'X-Session-Id': sessionId
        },
        cookies
    )
}

function formatResult(data) {
    const lines = []

    lines.push('╭━━━〔 💗 REACTCH RESULT 💗 〕━━━⬣')
    lines.push('│')
    lines.push(`│ 🎯 Target : ${data.target}`)
    lines.push(`│ 💠 Emoji  : ${data.emojis.join(' ')}`)
    lines.push(`│ 📊 Total  : ${data.total}`)
    lines.push(`│ ✅ Success: ${data.success}`)
    lines.push(`│ ❌ Failed : ${data.failed}`)
    lines.push('│')
    lines.push('╰━━━━━━━━━━━━━━━━⬣')
    lines.push('')

    if (data.results?.length) {
        lines.push('╭━━━〔 📋 DETAIL 〕━━━⬣')
        lines.push('│')

        for (const result of data.results) {
            const icon = result.success ? '✅' : '❌'
            lines.push(`│ ${icon} #${result.index} — ${result.message}`)
        }

        lines.push('╰━━━━━━━━━━━━━━━━⬣')
    }

    lines.push('')
    lines.push('_💕 NusaBot_')

    return lines.join('\n')
}

async function handler(m, { sock }) {
    const args = m.args || []

    if (args.length < 2) {
        return m.reply(
            `╭━━━〔 💗 REACTCH 💗 〕━━━⬣\n` +
            `│\n` +
            `│ ✨ *Auto React ke Channel WA*\n` +
            `│\n` +
            `│ 📌 *Format:*\n` +
            `│ > ${m.prefix}reactch <url> <emoji> [count]\n` +
            `│\n` +
            `│ 📌 *Contoh:*\n` +
            `│ > ${m.prefix}reactch https://whatsapp.com/channel/xxx 👍,❤️,🔥 3\n` +
            `│\n` +
            `│ ⚙️ *Info:*\n` +
            `│ • Emoji dipisah koma\n` +
            `│ • Count max 20\n` +
            `│ • Premium only\n` +
            `│\n` +
            `╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const url = args[0]

    let emojis = args[1]
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)

    const count = Math.max(
        1,
        Math.min(
            parseInt(args[2]) || 1,
            20
        )
    )

    if (!/^https?:\/\//i.test(url)) {
        return m.reply(
            `❌ *URL TIDAK VALID*\n\n` +
            `> Gunakan URL channel WhatsApp yang lengkap.`
        )
    }

    if (!emojis.length) {
        return m.reply(
            `❌ *EMOJI TIDAK BOLEH KOSONG*`
        )
    }

    await m.react('⏳')

    const results = []

    let success = 0
    let failed = 0

    for (let i = 1; i <= count; i++) {
        const sessionId = genSessionId()
        const cookies = {}

        try {
            const challenge = await getTicket(
                sessionId,
                cookies
            )

            const ticket = challenge?.ticket

            if (!ticket) {
                throw new Error(
                    'Ticket challenge tidak ditemukan'
                )
            }

            const delay = Math.max(
                2500,
                Number(challenge?.minAgeMs) || 2500
            )

            await sleep(delay)

            const response = await sendReact(
                url,
                emojis,
                ticket,
                sessionId,
                cookies
            )

            const isSuccess =
                response?.success === true

            results.push({
                index: i,
                success: isSuccess,
                message:
                    response?.message ||
                    (isSuccess
                        ? 'Success'
                        : 'Unknown'),
                delay_used: delay
            })

            if (isSuccess) {
                success++
            } else {
                failed++
            }
        } catch (error) {
            results.push({
                index: i,
                success: false,
                message:
                    error?.message ||
                    'Request gagal'
            })

            failed++
        }

        if (i < count) {
            await sleep(1000)
        }
    }

    const result = {
        status: success > 0,
        target: url,
        emojis,
        total: count,
        success,
        failed,
        results
    }

    await m.react(result.status ? '✅' : '❌')

    return m.reply(
        formatResult(result)
    )
}

module.exports = {
    config: pluginConfig,
    handler
}