const config = require('../../config')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'payment',
    alias: ['bayar', 'pay', 'rekening', 'rek'],
    category: 'store',
    description: 'Tampilkan metode pembayaran dengan QRIS',
    usage: '.payment',
    example: '.payment',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const payments = config.store?.payment || []
    const qrisUrl = config.store?.qris || ''
    const botName = config.bot?.name || 'NusaBot'
    
    if (payments.length === 0) {
        return m.reply(
`╭━━━〔 💳 *𝗣𝗔𝗬𝗠𝗘𝗡𝗧 𝗠𝗘𝗧𝗛𝗢𝗗* 〕━━━⬣
┃
┃ ⚠️ 𝗠𝗲𝘁𝗼𝗱𝗲 𝗽𝗲𝗺𝗯𝗮𝘆𝗮𝗿𝗮𝗻
┃ 𝗯𝗲𝗹𝘂𝗺 𝗱𝗶𝗸𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗮𝘀𝗶
┃
┃ 𝗢𝘄𝗻𝗲𝗿 𝗯𝗶𝘀𝗮 𝗺𝗲𝗻𝗮𝗺𝗯𝗮𝗵𝗸𝗮𝗻
┃ 𝗱𝗶 𝗳𝗶𝗹𝗲 config.js
╰━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    let txt = `╭━━━〔 💳 *${botName} PAYMENT* 〕━━━⬣
┃
┃ 🌸 𝗛𝗮𝗶 𝗱𝗮𝗿𝗹𝗶𝗻𝗴 ~
┃ 𝗦𝗶𝗹𝗮𝗸𝗮𝗻 𝗽𝗶𝗹𝗶𝗵 𝗺𝗲𝘁𝗼𝗱𝗲
┃ 𝗽𝗲𝗺𝗯𝗮𝘆𝗮𝗿𝗮𝗻 𝗱𝗶 𝗯𝗮𝘄𝗮𝗵 💕
┃
`

    for (const pay of payments) {
        txt += `┃ 💰 *${pay.name}*
┃ ├ 📱 𝗡𝗼𝗺𝗼𝗿 : ${pay.number}
┃ └ 👤 𝗔/𝗡 : ${pay.holder}
┃
`
    }

    txt += `┣━━━━━━━━━━━━━━━━━━⬣
┃ 📌 𝗦𝗲𝘁𝗲𝗹𝗮𝗵 𝘁𝗿𝗮𝗻𝘀𝗳𝗲𝗿
┃ 𝗞𝗶𝗿𝗶𝗺 𝗯𝘂𝗸𝘁𝗶 𝗽𝗲𝗺𝗯𝗮𝘆𝗮𝗿𝗮𝗻
┃ 𝗸𝗲 𝗼𝘄𝗻𝗲𝗿 𝘆𝗮 𝗱𝗮𝗿𝗹𝗶𝗻𝗴 ✨
┃
┃ 💬 𝗞𝗼𝗻𝗳𝗶𝗿𝗺𝗮𝘀𝗶 𝗸𝗲 𝗼𝘄𝗻𝗲𝗿
┃ 𝗮𝗴𝗮𝗿 𝗼𝗿𝗱𝗲𝗿 𝗹𝗮𝗻𝗴𝘀𝘂𝗻𝗴
┃ 𝗱𝗶𝗽𝗿𝗼𝘀𝗲𝘀 💗
┃
┃ 𝗧𝗲𝗿𝗶𝗺𝗮 𝗸𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵
┃ 𝗺𝗲𝗻𝗱𝘂𝗸𝘂𝗻𝗴 ${botName}
╰━━━━━━━━━━━━━━━━━━⬣`

    m.react('💳')
    
    const copyButtons = payments.map(pay => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            display_text: `📋 Copy No. ${pay.name}`,
            copy_code: pay.number
        })
    }))
    
    if (qrisUrl) {
        try {
            const response = await fetch(qrisUrl)
            const qrisBuffer = Buffer.from(await response.arrayBuffer())
            
            await sock.sendMessage(m.chat, {
                image: qrisBuffer,
                caption: txt,
                footer: botName,
                interactiveButtons: copyButtons
            }, { quoted: m })
        } catch (e) {
            await sock.sendMessage(m.chat, {
                text: txt,
                footer: botName,
                interactiveButtons: copyButtons
            }, { quoted: m })
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: txt,
            footer: botName,
            interactiveButtons: copyButtons
        }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
