const { getDatabase } = require('../../src/lib/database')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'group',
    description: 'Atur mode bot untuk grup ini menggunakan tombol interaktif dengan gambar',
    usage: '.botmode <md/cpanel/pushkontak/store/all>',
    example: '.botmode store',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const MODES = {
    md: {
        name: 'Multi-Device',
        desc: 'Mode default, semua fitur kecuali panel/store/pushkontak',
        allowedCategories: null,
        excludeCategories: ['cpanel', 'pushkontak', 'store']
    },
    cpanel: {
        name: 'CPanel Pterodactyl',
        desc: 'Mode panel, main + group + sticker + owner + tools + panel',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
        excludeCategories: null
    },
    pushkontak: {
        name: 'Push Kontak',
        desc: 'Mode pushkontak, main + group + sticker + owner + pushkontak',
        allowedCategories: ['owner', 'main', 'group', 'sticker', 'pushkontak'],
        excludeCategories: null
    },
    store: {
        name: 'Store/Toko',
        desc: 'Mode store, main + group + sticker + owner + store',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'store'],
        excludeCategories: null
    },
    all: {
        name: 'Full All Features',
        desc: 'Mode full, SEMUA fitur dari semua mode bisa diakses',
        allowedCategories: null,
        excludeCategories: null
    }
}

async function getSafeImageBuffer(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Gagal fetch');
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (err) {
        const fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
        const resFallback = await fetch(fallbackUrl);
        const bufferFallback = await resFallback.arrayBuffer();
        return Buffer.from(bufferFallback);
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const mode = (args[0] || '').toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    const currentMode = groupData.botMode || 'md'
    
    if (!mode || !Object.keys(MODES).includes(mode)) {
        if (mode && !Object.keys(MODES).includes(mode)) {
            await m.reply(`❌ Mode tidak valid. Pilihan: \`md\`, \`cpanel\`, \`pushkontak\`, \`store\`, \`all\``)
        }

        const imageUrl = "https://cdn.phototourl.com/member/2026-08-01-c59efbbc-d2fd-4df0-ab91-7b6032ae2337.jpg";
        let imageBuffer;
        try {
            imageBuffer = await getSafeImageBuffer(imageUrl);
        } catch (e) {
            imageBuffer = null;
        }

        let mediaAttachment = null;
        if (imageBuffer) {
            try {
                mediaAttachment = await prepareWAMessageMedia(
                    { image: imageBuffer },
                    { upload: sock.waUploadToServer }
                );
            } catch (e) {}
        }

        const pesanTeks = 
`💞 *BOT-MODE* 💞

"Darling, kamu mau mengganti bot mode untuk: ${mode ? mode.toUpperCase() : ''}? 

📳 Mode sekarang [${currentMode.toUpperCase()}]

Silakan klik tombol di bawah untuk memilih varian mode yang kamu inginkan!"`;

        const interactiveMsg = generateWAMessageFromContent(m.chat, {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '',
                    hasMediaAttachment: !!mediaAttachment,
                    ...(mediaAttachment || {})
                }),
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: pesanTeks
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: '✨ Pilih varian di bawah'
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '📂 PILIH MODE BOT',
                                sections: [
                                    {
                                        title: `TARGET GRUP: ${m.chat.split('@')[0]}`,
                                        rows: [
                                            { title: '🐳 Mode MD', description: '.botmode md', id: '.botmode md' },
                                            { title: '🤴🏻 Mode CPanel', description: '.botmode cpanel', id: '.botmode cpanel' },
                                            { title: '🏪 Mode Store', description: '.botmode store', id: '.botmode store' },
                                            { title: '⚓ Mode Pushkontak', description: '.botmode pushkontak', id: '.botmode pushkontak' },
                                            { title: '🐋 Mode All', description: '.botmode all', id: '.botmode all' }
                                        ]
                                    }
                                ]
                            })
                        }
                    ]
                }),
                contextInfo: {
                    mentionedJid: [m.sender]
                }
            })
        }, { userJid: m.sender, quoted: m })

        return await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })
    }
    
    const newGroupData = {
        ...groupData,
        botMode: mode
    }
    
    if (mode === 'store') {
        newGroupData.storeConfig = {
            ...(groupData.storeConfig || {}),
            autoorder: false,
            products: groupData.storeConfig?.products || []
        }
    }
    
    db.setGroup(m.chat, newGroupData)
    db.save()
    
    m.react('✅')
    
    let extraInfo = ''
    if (mode === 'store') {
        const products = newGroupData.storeConfig?.products || []
        extraInfo = `\n\n📋 *Manual mode*\n` +
            `> Admin perlu confirm order manual\n` +
            `> Product: \`${products.length}\` item\n\n` +
            `*ᴘᴀɴᴅᴜᴀɴ:*\n` +
            `> \`${m.prefix}addprod <kode> <harga> <nama>\`\n` +
            `> \`${m.prefix}listprod\` - Lihat produk`
    }
    
    return m.reply(
        `✅ *ᴍᴏᴅᴇ ᴅɪᴜʙᴀʜ*\n\n` +
        `> Mode: *${mode.toUpperCase()}* (${MODES[mode].name})\n` +
        `> Grup: *${m.chat.split('@')[0]}*\n` +
        extraInfo +
        `\n\n> Ketik \`${m.prefix}menu\` untuk melihat menu.`
    )
}

function getGroupMode(chatJid, db) {
    if (!chatJid?.endsWith('@g.us')) return 'md'
    const groupData = db.getGroup(chatJid) || {}
    return groupData.botMode || 'md'
}

function getModeCategories(mode) {
    const modeConfig = MODES[mode] || MODES.md
    return {
        allowed: modeConfig.allowedCategories,
        excluded: modeConfig.excludeCategories
    }
}

function filterCategoriesByMode(categories, mode) {
    const modeConfig = MODES[mode] || MODES.md
    
    if (modeConfig.allowedCategories) {
        return categories.filter(cat => modeConfig.allowedCategories.includes(cat.toLowerCase()))
    }
    
    if (modeConfig.excludeCategories) {
        return categories.filter(cat => !modeConfig.excludeCategories.includes(cat.toLowerCase()))
    }
    
    return categories
}

module.exports = {
    config: pluginConfig,
    handler,
    getGroupMode,
    getModeCategories,
    filterCategoriesByMode,
    MODES
}