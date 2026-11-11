const axios = require('axios')

const pluginConfig = {
    name: 'pingweb',
    alias: ['webping', 'ping'],
    category: 'tools',
    description: 'Ping website menggunakan Base API',
    usage: '.pingweb <url>',
    example: '.pingweb https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
`🌐 *WEB PING*

Contoh:
${m.prefix}pingweb https://google.com
${m.prefix}pingweb https://github.com`
        )
    }

    await m.react('⏳')

    try {
        const { data } = await axios.get(
            'https://tio-base-api.lovable.app/api/public',
            {
                params: {
                    url
                },
                timeout: 30000
            }
        )

        if (!data.status) throw new Error(data.message)

        const result = data.result || data.data || {}

        await m.react('✅')

        return m.reply(
`🏓 *WEB PING RESULT*

🌍 URL :
> ${url}

📡 Status :
> ${result.status || 'Online'}

⚡ Ping :
> ${result.ping || result.latency || '-'} ms

🌐 IP :
> ${result.ip || '-'}

🖥 Server :
> ${result.server || '-'}

📝 Message :
> ${data.message || 'Success'}`
        )

    } catch (e) {
        await m.react('❌')

        return m.reply(
`❌ *PING GAGAL*

${e.response?.data?.message || e.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}