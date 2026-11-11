const { exec } = require('child_process')
const config = require('../../config')

const pluginConfig = {
    name: 'npm-install',
    alias: ['npmi', 'install'],
    category: 'owner',
    description: 'Install package npm lewat bot',
    usage: '.npm-install axios',
    example: '.npm-install axios',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {

    try {

        const body =
            m.body ||
            m.text ||
            m.message?.conversation ||
            ''

        const pkg =
            body.trim().split(' ').slice(1).join(' ')

        if (!pkg) {
            return await m.reply(
                `❌ Masukkan package\n\nContoh:\n${pluginConfig.example}`
            )
        }

        await m.reply(`📦 Installing package:\n\n${pkg}`)

        exec(`npm install ${pkg}`, async (err, stdout, stderr) => {

            if (err) {

                return await m.reply(
                    `❌ Install gagal\n\n${err.message}`
                )
            }

            if (stderr) {

                return await m.reply(
                    `⚠️ STDERR:\n\n${stderr}`
                )
            }

            await m.reply(
                `✅ Package berhasil diinstall\n\n${stdout}`
            )

        })

    } catch (error) {

        console.error('NPM Install Error:', error)

        await m.reply(
            `❌ *GAGAL*\n\n> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}