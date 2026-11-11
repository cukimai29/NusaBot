const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setownertype',
    alias: ['ownertype', 'ownervariant', 'ownerstyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan owner message',
    usage: '.setownertype',
    example: '.setownertype',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VARIANTS = {
    1: { name: 'Current Design',      desc: 'Tampilan teks + contact card default' },
    2: { name: 'Carousel Cards',      desc: 'Kartu carousel dengan foto owner + button chat' },
    3: { name: 'Multiple Contact',    desc: 'Kirim semua owner dalam 1 contact card list' },
    4: { name: 'AIRich Post',         desc: 'Tampilan post sosial media (AIRich GenAIPostPrimitive)' },
    5: { name: 'AIRich Entity Card',  desc: 'Tampilan kartu entity owner + verified badge (AIRich)' }
}

async function handler(m, { sock, db }) {
    const args    = m.args || []
    const variant = args[0]?.toLowerCase()
    const current = db.setting('ownerType') || 1

    // ==== SET VARIANT ====
    if (variant && /^v?[1-5]$/.test(variant)) {
        const id = parseInt(variant.replace('v', ''))
        db.setting('ownerType', id)
        await db.save()

        await m.reply(
            `💗 *Owner type diubah ke V${id}*~ Darling\n\n` +
            `> 💗 *${VARIANTS[id].name}*\n` +
            `> _${VARIANTS[id].desc}_\n\n` +
            `> Ketik *.owner* untuk lihat hasilnya yaa~ 😳`
        )
        return
    }

    // ==== TAMPILKAN MENU ====
    const buttons = []
    for (const [id, val] of Object.entries(VARIANTS)) {
        const mark = parseInt(id) === current ? ' ✓' : ''
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `V${id}${mark} - ${val.name}`,
                id: `${m.prefix}setownertype v${id}`
            })
        })
    }

    await sock.sendMessage(m.chat, {
        text:
            `💗 *sᴇᴛ ᴏᴡɴᴇʀ ᴛʏᴘᴇ*\n\n` +
            `> Type saat ini: *V${current}*\n` +
            `> _${VARIANTS[current].name}_\n` +
            `> _${VARIANTS[current].desc}_\n\n` +
            `> Pilih variant owner yaa Darling~ 😳💕`,
        footer: config.bot?.name || '𝙕𝙀𝙍𝙊 𝙏𝙒𝙊 𝘼𝙄 💗',
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999
        },
        interactiveButtons: buttons
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}