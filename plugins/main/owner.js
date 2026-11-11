const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Menampilkan kontak owner bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const ownerType = db.setting('ownerType') || 1
    const botName = botConfig.bot?.name || 'NusaBot'

    function getOwnerName(cleanNumber) {
        const names = db.setting('ownerNames') || {}
        if (names[cleanNumber]) return names[cleanNumber]
        const userDb = db.getUser(cleanNumber + '@s.whatsapp.net') || db.getUser(cleanNumber)
        return userDb?.name || botConfig.owner?.name || 'Darling Developer'
    }

    const configOwners = [].concat(botConfig.owner?.number || [])
       .map(n => String(n).replace(/[^0-9]/g, ''))
       .filter(n => n.length >= 10)

    const dbOwners = (Array.isArray(db.data.owner)? db.data.owner : [])
       .map(n => String(n).replace(/[^0-9]/g, ''))
       .filter(n => n.length >= 10 &&!configOwners.includes(n))

    const ownerList = [
       ...configOwners.map(num => ({ num, label: '💗 Owner Utama' })),
       ...dbOwners.map((num, i) => ({ num, label: `🌸 Owner ${i + 1}` }))
    ]

    if (ownerList.length === 0) {
        return m.reply(`❌ *Belum ada Owner terdaftar~ Darling~* 💗`)
    }

    if (ownerType === 1) {
        let ownerText = `💗 *${botName} OWNER INFO*\n\n`
        ownerText += `╭┈┈⬡「 🌸 *ᴅᴇᴛᴀɪʟ* 」\n`
        ownerText += `┃ 🤖 ʙᴏᴛ: *${botName}*\n`
        ownerText += `┃ 💗 ᴏᴡɴᴇʀ ᴜᴛᴀᴍᴀ: *${configOwners.length}*\n`
        ownerText += `┃ 🌸 ᴏᴡɴᴇʀ ʟᴀɪɴɴʏᴀ: *${dbOwners.length}*\n`
        ownerText += `┃ 🟢 sᴛᴀᴛᴜs: *Online*\n`
        ownerText += `╰┈┈⬡\n\n`
        ownerText += `> _Hubungi Darling Owner via contact card di bawah yaa~ 💕_`
        await m.reply(ownerText)
        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName} (${label})\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            await sock.sendMessage(m.chat, { contacts: { displayName, contacts: [{ vcard }] } }, { quoted: m.raw || m })
        }

    } else if (ownerType === 2) {
        const cards = []
        const DEFAULT_PP = 'https://files.catbox.moe/7x8v8n.jpg'
        for (const { num, label } of ownerList) {
            const jid = num + '@s.whatsapp.net'
            const displayName = getOwnerName(num)
            let ppUrl = DEFAULT_PP
            try { ppUrl = await sock.profilePictureUrl(jid, 'image') } catch {}
            cards.push({
                image: { url: ppUrl },
                body: `${label}\n${displayName}\n\n💗 Rules:\n• Jangan spam Darling~\n• Jangan VidCall/Call sembarangan\n• Jangan jadiin bahan bug/banned\n• Chat yang sopan yaa~ 😳`,
                footer: `${botName} • Owner Contact`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '💬 Chat Owner 💕', url: `https://wa.me/${num}` }) }]
            })
        }
        await sock.sendMessage(m.chat, { text: `Haiii *${m.pushName}* 💕\n\nKamu mau menghubungi owner ${botName}?\n\nPilih kontak di bawah ini 👇`, title: `👑 Owner ${botName}`, footer: `${botName} • Owner Contact`, cards }, { quoted: m.raw || m })

    } else if (ownerType === 3) {
        const contacts = []
        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName} (${label} ${botName})\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            contacts.push({ vcard })
        }
        await sock.sendMessage(m.chat, { contacts: { displayName: `${botName} Owners 💗`, contacts } }, { quoted: m.raw || m })

    } else if (ownerType === 4) {
        const { AIRich } = require('../../src/lib/MessageBuilder.js')
        const DEFAULT_PP = 'https://files.catbox.moe/7x8v8n.jpg' // FIX: jangan png
        const posts = []
        for (const { num, label } of ownerList) {
            const jid = num + '@s.whatsapp.net'
            const displayName = getOwnerName(num)
            let ppUrl = DEFAULT_PP
            try { ppUrl = await sock.profilePictureUrl(jid, 'image') } catch {}
            posts.push({
                profile_url: ppUrl, username: `~ ${displayName}`, caption: label, subtitle: `${label} • ${botName}`,
                thumbnail: ppUrl, footer: `Ketuk untuk chat ${displayName}~ 💖`, verified: configOwners.includes(num),
                    source: botName, orientation: 'LANDSCAPE', post_type: 'PHOTO', like: 0, comment: 0, share: 0,
                post_url: `https://wa.me/${num}?text=Hai%20${encodeURIComponent(displayName)}~`,
                post_deeplink: `https://wa.me/${num}?text=Hai%20${encodeURIComponent(displayName)}~`
            })
        }
        await new AIRich(sock).addPost(posts).send(m.chat, { quoted: m.raw || m, bypassDownload: false })

    } else if (ownerType === 5) {
        const { AIRich } = require('../../src/lib/MessageBuilder.js')
        const rich = new AIRich(sock)

        // FIX KEK OWNER2: WAJIB JPG JANGAN PNG + setTitle
        const HEADER_IMAGE_URL = 'https://d.top4top.io/p_3911nin4q0.jpg'

        rich.setTitle(botName)

        rich.addSection({
            view_model: {
                primitive: {
                    media: {
                        url: HEADER_IMAGE_URL,
                        mime_type: 'image/jpeg',
                        width: 1280,
                        height: 720
                    },
                    imagine_type: 'IMAGE',
                    status: { status: 'READY' },
                    __typename: 'GenAIImaginePrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const isMainOwner = configOwners.includes(num)
            let ppUrl = 'https://k.top4top.io/p_39080gmjo0.jpg'
            try { ppUrl = await sock.profilePictureUrl(num + '@s.whatsapp.net', 'image') } catch {}

            rich.addSection({
                view_model: {
                    primitive: {
                        __typename: 'GenAICompactEntityPrimitive',
                        title: displayName,
                        subtitle: label,
                        secondary_subtitle: isMainOwner? `💗 Owner Utama • ${botName}` : `🌸 Owner • ${botName}`,
                        entity_id: num,
                        entity_url: `https://wa.me/${num}`,
                        entity_type: 'PERSON',
                        action_type: 'MESSAGE',
                        is_verified: isMainOwner,
                        image: { url: ppUrl }
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            })
        }

        rich.addFOAText(`Pusat Kontak Owner ${botName} 💕`)
        rich.addMetadata(botName)

        await rich.send(m.chat, { quoted: m.raw || m, bypassDownload: false })
    }

    const socialLines = []
    if (botConfig.social?.instagram) socialLines.push(`📸 Instagram: ${botConfig.social.instagram}`)
    if (botConfig.social?.youtube) socialLines.push(`▶️ YouTube: ${botConfig.social.youtube}`)
    if (socialLines.length) {
        await m.reply(`🌐 *Sosial media ${botName} / owner*\n${socialLines.join('\n')}`)
    }
}

module.exports = { config: pluginConfig, handler }
