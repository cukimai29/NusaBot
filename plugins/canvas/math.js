const {
    renderLatexToPng,
    createMediaUploadFn
} = require('../../src/lib/zerotwo-latex')

const te = require('../../src/lib/zerotwo-error')

const pluginConfig = {
    name: 'math',
    alias: ['latex', 'rumus'],
    category: 'canvas',
    description: 'Render rumus matematika (LaTeX) jadi gambar',
    usage: '.math <latex>',
    example: '.math E = mc^2 | \\frac{a}{b}',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {

    const input = m.text

    if (!input) {
        return await m.reply(
            `📐 *RENDER MATEMATIKA*\n\n` +
            `Contoh:\n` +
            `• ${m.prefix}math E = mc^2\n` +
            `• ${m.prefix}math \\\\frac{a}{b}\n` +
            `• ${m.prefix}math E = mc^2 | \\\\frac{a}{b}`
        )
    }

    try {

        await m.react('🕕')

        const expressions = input
            .split('|')
            .map(v => v.trim())
            .filter(v => v.length > 0)
            .map(v => ({
                latexExpression: v
            }))

        const uploadFn = await createMediaUploadFn(sock)

        await sock.sendLatexInlineImage(
            m.chat,
            m.quoted || m,
            {
                text: '📐 ' + input,
                expressions,
                headerText: 'Rumus Matematika',
                footer: 'Powered by Bot'
            },
            renderLatexToPng,
            uploadFn
        )

        await m.react('✅')

    } catch (error) {

        console.error('Math Error:', error)

        await m.react('☢')

        await m.reply(
            `❌ *GAGAL*\n\n> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}