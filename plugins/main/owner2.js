const { AIRich } = require('../../src/lib/MessageBuilder.js')

const pluginConfig = {
    name: 'owner2',
    alias: ['ownerairich', 'ownerrich', 'ownerv2'],
    category: 'main',
    description: 'Menampilkan kontak owner bot (AIRich)',
    usage: '.owner2',
    example: '.owner2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    try {
        const botName = botConfig.bot?.name || 'NusaBot'
        const ownerName = botConfig.owner?.name || 'Darling Developer'

        const configOwners = [].concat(botConfig.owner?.number || [])
           .map(n => String(n).replace(/[^0-9]/g, ''))
           .filter(n => n.length >= 10)

        if (configOwners.length === 0) {
            return m.reply('❌ *Belum ada Owner terdaftar~ Darling~* 💗')
        }

        const mainOwnerNumber = configOwners[0]
        const mainOwnerJid = mainOwnerNumber + '@s.whatsapp.net'

        const DEFAULT_PP = 'https://files.catbox.moe/7x8v8n.jpg'
        // FIX 1: WAJIB JPG, JANGAN PNG
        const HEADER_IMAGE = 'https://d.top4top.io/p_3911nin4q0.jpg'

        let ppUrl = DEFAULT_PP
        try {
            ppUrl = await sock.profilePictureUrl(mainOwnerJid, 'image') || DEFAULT_PP
        } catch {}

        const ai = new AIRich(sock)
        ai.setTitle(botName)

        ai.addSection({
            view_model: {
                primitive: {
                    media: {
                        url: HEADER_IMAGE,
                        mime_type: 'image/jpeg',
                        width: 1200,
                        height: 675
                    },
                    imagine_type: 'IMAGE',
                    status: { status: 'READY' },
                    __typename: 'GenAIImaginePrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        ai.addSection({
            view_model: {
                primitive: {
                    __typename: 'GenAICompactEntityPrimitive',
                    title: ownerName,
                    subtitle: `Owner: ${ownerName}`,
                    secondary_subtitle: 'Chat Darling Owner disini~ 💕',
                    entity_id: mainOwnerNumber,
                    entity_url: `https://wa.me/${mainOwnerNumber}`,
                    entity_type: 'PAGE',
                    action_type: 'FOLLOW',
                    is_verified: true,
                    image: {
                        url: ppUrl,
                        url_fallback: DEFAULT_PP
                    }
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        ai.addFOAText(`Owner: ${ownerName}\nBot: ${botName}`)
        ai.addMetadata(botName)

        // FIX 2: bypassDownload false + pake m.chat yang bener
        await ai.send(m.chat, {
            quoted: m.raw || m,
            bypassDownload: false
        })

    } catch (error) {
        console.error('[owner2] Error:', error)
        return m.reply(`❌ *Gagal tampilkan owner AIRich*\n\n> ${error.message}\n\n${error.stack}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
