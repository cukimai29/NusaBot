const config = {
    info: {
        website: 'https://zer-oz-store-app.vercel.app/',
        website2: 'https://zeroz-app-id.vercel.app/',
        website3: 'https://zeroz-searchid.vercel.app/',
    },
    social: {
        instagram: 'https://www.instagram.com/_rzkyy.p/',
        youtube: 'https://www.youtube.com/@rzkyads',
        whatsappGroup: 'https://chat.whatsapp.com/BAHlbgB6AD5FobDBScZ99T'
    },
    owner: {
        name: 'RzkyAds',
        number: ['6285704682918']
    },
    session: {
        pairingNumber: '',
        usePairingCode: true
    },
    bot: {
        name: 'NusaBot',
        version: '3.3',
        developer: 'RzkyADS'
    },
    mode: 'public',
    command: {
        prefix: '.'
    },
    nsfw: false,
    APIkey: {
    lolhuman: 'APIKey-Milik-Bot-ZERO TWO AI',
    neoxr: 'Milik-Bot-ZERO TWO AI',
    google: '',
    groq: '',
    pixiv: 'Milik-Bot-ZERO TWO AI',
    pixivRefresh: '' // 🔑 ISI INI

    },
    vercel: {
        token: ''
    },
    store: {
        payment: [],
        qris: ''
    },
    donasi: {
        payment: [],
        links: [],
        benefits: [
            '🚀 Mendukung development bot',
            '⚡ Server lebih stabil',
            '🆕 Fitur baru lebih cepat',
            '💎 Priority support'
        ],
        qris: ''
    },
    limits: {
        default: 25,
        premium: 20,
        owner: -1
    },
    sticker: {
        packname: 'NusaBot',
        author: 'RzkyADS'
    },
    saluran: {
        id: '120363409623385879@newsletter',
        id2: '120363428390908535@newsletter',
        id3: '120363431436026396@newsletter',
        name: 'RzkyAds',
        name2: 'Brianzpreset',
        name3: 'testimoni nokos febxyZ',
        link: 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12',
        url: 'https://whatsapp.com/channel/0029Vb9jL3GKQuJBjRdpKO12',
        link2: 'https://whatsapp.com/channel/0029VbDtym64Crfrljl0Qe1d',
        link3: 'https://whatsapp.com/channel/0029VbDKMKZAojYjlTkesD1i'
    },
    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true,
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },
    registration: {
        enabled: false,
        rewards: {
            koin: 30000,
            energi: 900000,
            exp: 300000
        }
    },
    welcome: {
        defaultEnabled: false
    },
    goodbye: {
        defaultEnabled: false
    },
    premiumUsers: [],
    partnerUsers: [],
    bannedUsers: [],
    dynamicOwners: [],
    dynamicPremium: [],
    ui: {
        menuVariant: 3
    },
    messages: {
        wait: '⏳ 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗔𝗜 sedang memproses permintaan kamu... sabar yaa~ 💫',
        success: '✅ Yeayyy~ permintaan berhasil diselesaikan dengan sempurna ✨',
        error: '❌ Aduhh... sistem lagi error nih 🥲 coba lagi beberapa saat yaa~',
        ownerOnly: '👑 Fitur ini khusus Owner bot yaa~ jangan maksa 😼',
        premiumOnly: '💎 Eitss~ fitur ini cuma buat user Premium yaa ✨ ketik *.benefitpremium* buat info upgrade 🚀',
        groupOnly: '👥 Yahhh~ fitur ini cuma bisa dipakai di dalam grup 😵‍💫',
        privateOnly: '💌 Fitur ini cuma bisa dipakai di private chat bot yaa~',
        adminOnly: '🛡️ Kamu harus jadi admin grup dulu buat pakai fitur ini 😼',
        botAdminOnly: '🤖 Jadikan bot sebagai admin dulu yaa biar bisa menjalankan fitur ini ✨',
        cooldown: '⏳ Sabar dongg 😭 kamu masih cooldown~ tunggu %time% detik lagi yaa',
        limitExceeded: '⚠️ Limit harian kamu habis 😵‍💫 tunggu reset besok atau upgrade ke Premium 💎',
        banned: '🚫 Kamu sedang dibanned dari penggunaan bot ini karena melanggar rules 🥀'
    },
    database: {
        path: './database/main'
    },
    backup: {
        enabled: false,
        intervalHours: 24,
        retainDays: 7
    },
    scheduler: {
        resetHour: 0,
        resetMinute: 0
    },
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,
        watchSrc: false,
        debugLog: false
    },
    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server2: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server3: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server4: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server5: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        }
    },
    digitalocean: {
        token: '',
        region: 'sgp1',
        sellers: [],
        ownerPanels: []
    },
    pakasir: {
        enabled: true,
        slug: '',
        apiKey: '',
        defaultMethod: 'qris',
        sandbox: false,
        pollingInterval: 5000
    },
    jasaotp: {
        apiKey: '',
        markup: 2000,
        timeout: 300
    }
}

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    if (!cleanNumber) return false
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        const cleanNumber = number?.replace(/[^0-9]/g, '') || ''
        if (!cleanNumber) return false
        if (config.owner && config.owner.number && config.owner.number.includes(cleanNumber)) {
            return true
        }
        if (db && db.data && Array.isArray(db.data.owner)) {
            if (db.data.owner.includes(cleanNumber)) return true
        }
        if (db) {
            const definedOwner = db.setting('ownerNumbers')
            if (Array.isArray(definedOwner) && definedOwner.includes(cleanNumber)) return true
        }
        return false
    } catch {
        return false
    }
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const premiumList = config.premiumUsers || []
    const inConfig = premiumList.some(premium => {
        if (!premium) return false
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium ||
            cleanNumber.endsWith(cleanPremium) ||
            cleanPremium.endsWith(cleanNumber)
    })
    if (inConfig) return true
    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPremium(cleanNumber)) return true
    } catch { }
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.premium)) {
            const now = Date.now()
            const found = db.data.premium.find(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })
            if (found) {
                if (typeof found === 'string') return true
                if (found.expired && found.expired < now) return false
                return true
            }
        }
        if (db) {
            const savedPremium = db.setting('premiumUsers') || []
            const inDb = savedPremium.some(premium => {
                if (!premium) return false
                const cleanPremium = premium.replace(/[^0-9]/g, '')
                return cleanNumber === cleanPremium ||
                    cleanNumber.endsWith(cleanPremium) ||
                    cleanPremium.endsWith(cleanNumber)
            })
            if (inDb) return true
        }
    } catch { }
    return false
}

function isPartner(number) {
    if (!number) return false
    if (isOwner(number)) return true
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []
    const inConfig = partnerList.some(partner => {
        if (!partner) return false
        const cleanPartner = partner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPartner ||
            cleanNumber.endsWith(cleanPartner) ||
            cleanPartner.endsWith(cleanNumber)
    })
    if (inConfig) return true
    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPartner(cleanNumber)) return true
    } catch { }
    return false
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned ||
            cleanNumber.endsWith(cleanBanned) ||
            cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) {
        config.bot.number = number.replace(/[^0-9]/g, '')
    }
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) ||
        botNumber.includes(cleanNumber)
}

function getConfig() {
    return config
}

function getApiKey(keyName) {
    if (config.APIkey && config.APIkey[keyName]) {
        return config.APIkey[keyName]
    }
    if (config.APIkey && config.APIkey.neoxr) {
        return config.APIkey.neoxr
    }
    return 'Milik-Bot-ZeroTwo'
}

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPartner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf,
    getApiKey
}
