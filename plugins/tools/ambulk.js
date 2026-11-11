const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ambulk',
    alias: ['amremlist', 'bulkam', 'ambulkgen'],
    category: 'tools',
    description: 'Membuat beberapa akun melalui API',
    usage: '.ambulk <jumlah>',
    example: '.ambulk 3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 10,
    isEnabled: true
}

const API_KEY = process.env.ALIGHT_API_KEY || ''

async function handler(m, { sock }) {
    try {
        const args = m.args || []
        const inputAmount = args[0] || ''
        const amount = parseInt(inputAmount, 10)

        if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
            return m.reply(
                `⚠️ *JUMLAH TIDAK VALID*\n\n` +
                `Gunakan:\n` +
                `> ${m.prefix}ambulk <jumlah>\n\n` +
                `Contoh:\n` +
                `> ${m.prefix}ambulk 3\n\n` +
                `Maksimal: *10*`
            )
        }

        if (!API_KEY) {
            return m.reply('❌ API key belum dikonfigurasi.')
        }

        await m.react('⏳')

        /*
         * Gunakan hanya endpoint API yang memang kamu punya
         * izin untuk gunakan.
         */
        const apiUrl = process.env.ALIGHT_BULK_API_URL

        if (!apiUrl) {
            throw new Error('Endpoint API belum dikonfigurasi.')
        }

        const response = await axios.get(apiUrl, {
            params: {
                key: API_KEY,
                amount
            },
            headers: {
                'User-Agent': 'KenzieMD'
            },
            timeout: 30_000,
            validateStatus: () => true
        })

        const data = response.data || {}

        if (
            response.status < 200 ||
            response.status >= 300 ||
            data.success === false ||
            data.status === false
        ) {
            throw new Error(
                data.message ||
                data.error ||
                `API mengembalikan HTTP ${response.status}`
            )
        }

        if (!Array.isArray(data.data)) {
            throw new Error('Response API tidak memiliki data yang valid.')
        }

        await m.react('✅')

        let caption =
            `✨ *BULK GENERATOR* ✨\n\n` +
            `📦 *Jumlah:* ${data.data.length}\n`

        if (data.limit_left !== undefined) {
            caption += `🪙 *Sisa Limit:* ${data.limit_left}\n`
        }

        caption += `───────────────────\n\n`

        data.data.forEach((item, index) => {
            caption += `*${index + 1}. DATA*\n`

            if (item.account) {
                caption += `📧 *Account:* \`${item.account}\`\n`
            }

            if (item.status) {
                caption += `📊 *Status:* ${item.status}\n`
            }

            if (item.login_url) {
                caption += `🔗 *URL:* ${item.login_url}\n`
            }

            caption += '\n'
        })

        return m.reply(caption.trim())

    } catch (error) {
        console.error('[AMBULK ERROR]', error)

        await m.react('❌')

        return m.reply(
            `❌ *PROSES GAGAL*\n\n` +
            `> ${error.response?.data?.message || error.message || 'Terjadi kesalahan pada API.'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}