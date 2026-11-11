const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'amverif',
    alias: ['ampverif', 'verifyam', 'amverify'],
    category: 'tools',
    description: 'Memproses verifikasi melalui API resmi',
    usage: '.amverif email|link',
    example: '.amverif emailkamu@gmail.com|https://example.com/verify',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 5,
    isEnabled: true
}

const API_KEY = process.env.ALIGHT_API_KEY || ''
const API_URL = process.env.ALIGHT_VERIFY_API_URL || ''

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validLink(link) {
    try {
        const url = new URL(link)
        return /^https?:$/.test(url.protocol)
    } catch {
        return false
    }
}

async function handler(m, { sock }) {
    try {
        const args = m.args || []
        const input = args.join(' ').trim()

        if (!input) {
            return m.reply(
                `⚠️ *FORMAT SALAH*\n\n` +
                `Gunakan:\n` +
                `> ${m.prefix}amverif email|link\n\n` +
                `Contoh:\n` +
                `> ${m.prefix}amverif email@example.com|https://example.com/verify`
            )
        }

        const [email, link] = input
            .split('|')
            .map(v => v?.trim())

        if (!validEmail(email || '')) {
            return m.reply(
                `⚠️ *EMAIL TIDAK VALID*\n\n` +
                `Contoh:\n` +
                `> ${m.prefix}amverif email@example.com|https://example.com/verify`
            )
        }

        if (!validLink(link || '')) {
            return m.reply(
                `⚠️ *LINK TIDAK VALID*\n\n` +
                `Masukkan URL HTTP/HTTPS yang valid.`
            )
        }

        if (!API_KEY || !API_URL) {
            return m.reply(
                '❌ API verifikasi belum dikonfigurasi.'
            )
        }

        await m.react('⏳')

        const response = await axios.get(API_URL, {
            params: {
                email,
                link
            },
            headers: {
                'x-api-key': API_KEY,
                'User-Agent': 'KenzieMD'
            },
            timeout: 20_000,
            validateStatus: () => true
        })

        const data = response.data || {}

        if (
            response.status < 200 ||
            response.status >= 300 ||
            data.success === false
        ) {
            await m.react('❌')

            return m.reply(
                `❌ *VERIFIKASI GAGAL*\n\n` +
                `> ${data.message || data.error || `HTTP ${response.status}`}`
            )
        }

        await m.react('✅')

        return m.reply(
            `✅ *VERIFIKASI BERHASIL*\n\n` +
            `📧 *Email:* ${email}\n` +
            `📌 *Status:* ${data.status || 'Success'}\n` +
            `💬 *Pesan:* ${data.message || 'Verifikasi berhasil diproses.'}`
        )

    } catch (error) {
        console.error('[AMVERIF ERROR]', error)

        await m.react('❌')

        return m.reply(
            `❌ *TERJADI KESALAHAN*\n\n` +
            `> ${error.response?.data?.message || error.message || 'Terjadi kesalahan pada API.'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}