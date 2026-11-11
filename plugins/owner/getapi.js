const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'getapi',
    alias: ['cekapi'],
    category: 'owner',
    description: 'Melihat API yang dipakai plugin',
    usage: '.getapi <plugin>',
    example: '.getapi openai',
    isOwner: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m) {

    const args = m.args || []

    if (!args[0]) {
        return m.reply(
`╭━━〔 💗 ZERO TWO API CHECK 💗 〕━━⬣
┃
┃ Darling, masukkan nama plugin
┃
┃ Contoh :
┃ .getapi tomediafire
┃
╰━━━━━━━━━━━━━━━━⬣`)
    }

    const pluginName = args[0]
    const pluginPath = path.join(process.cwd(), 'plugins', `${pluginName}.js`)

    if (!fs.existsSync(pluginPath)) {
        return m.reply(
`╭━━〔 ❌ NUSABOT SYSTEM 〕━━⬣
┃ Plugin *${pluginName}* tidak ditemukan
╰━━━━━━━━━━━━━━━━⬣`)
    }

    try {

        const file = fs.readFileSync(pluginPath, 'utf8')

        const apiRegex = /(apiKey|apikey|API_KEY)\s*[:=]\s*['"`](.*?)['"`]/gi

        let result
        let apis = []

        while ((result = apiRegex.exec(file)) !== null) {
            apis.push(result[2])
        }

        if (apis.length === 0) {
            return m.reply(
`╭━━〔 ⚠️ NUSABOT SYSTEM 〕━━⬣
┃ Plugin *${pluginName}*
┃ tidak menggunakan API
╰━━━━━━━━━━━━━━━━⬣`)
        }

        const apiList = apis.map((v,i)=>`┃ ${i+1}. ${v}`).join('\n')

        await m.reply(
`╭━━〔 💗 ZERO TWO API INFO 💗 〕━━⬣
┃
┃ Plugin : *${pluginName}*
┃
${apiList}
┃
┃ Darling ini API nya 😋
╰━━━━━━━━━━━━━━━━⬣`
        )

    } catch (err) {

        m.reply(
`╭━━〔 ❌ ZERO TWO ERROR 〕━━⬣
┃ ${err.message}
╰━━━━━━━━━━━━━━━━⬣`)
    }

}

module.exports = {
    config: pluginConfig,
    handler
}