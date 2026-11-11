const config = require('../../config')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'enhance',
    alias: ['upscale', 'hdimage', 'beautyplus', 'enhanceimage'],
    category: 'tools',
    description: 'Enhance/upscale gambar pakai BeautyPlus AI',
    usage: '.enhance (reply gambar)',
    example: '.enhance',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

const SCENE = 'HD'
const RATIO = 2
const REAL_RATIO = 4

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'
const ORIGIN = 'https://www.beautyplus.com'
const REFERER = 'https://www.beautyplus.com/id/image-enhancer'

const api = axios.create({
    timeout: 60000,
    validateStatus: () => true,
    headers: {
        'user-agent': UA
    }
})

function randomUid() {
    return `bplus-${crypto.randomBytes(16).toString('hex')}`
}

function extMime(file) {
    const ext = path.extname(file).toLowerCase()
    if (ext === '.png') return { suffix: 'png', mime: 'image/png' }
    if (ext === '.webp') return { suffix: 'webp', mime: 'image/webp' }
    return { suffix: 'jpg', mime: 'image/jpeg' }
}

function amzDate(d = new Date()) {
    return d.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function hmac(key, data, enc) {
    return crypto.createHmac('sha256', key).update(data).digest(enc)
}

function getSigningKey(secret, date, region) {
    const kDate = hmac(`AWS4${secret}`, date)
    const kRegion = hmac(kDate, region)
    const kService = hmac(kRegion, 's3')
    return hmac(kService, 'aws4_request')
}

function signPolicy(secret, policy, date, region) {
    return hmac(getSigningKey(secret, date, region), policy, 'hex')
}

function headers(uid) {
    return {
        'accept': 'application/json, text/plain, */*',
        'x-tenant': 'bplus',
        'x-locale': 'id',
        'x-anonymous-uid': uid,
        'origin': ORIGIN,
        'referer': REFERER,
        'user-agent': UA
    }
}

async function getPolicy(file) {
    const { suffix } = extMime(file)
    const url = `https://strategy.pixocial.com/upload/policy?app=BeautyPlusWeb&suffix=${suffix}&type=tmp-photo`

    const res = await api.get(url, {
        headers: {
            'accept': '*/*',
            'origin': ORIGIN,
            'referer': `${ORIGIN}/`,
            'user-agent': UA
        }
    })

    if (res.status !== 200 || !Array.isArray(res.data)) {
        throw new Error('policy_failed')
    }

    return res.data[0].oss
}

async function uploadFile(file, oss) {
    const { mime } = extMime(file)
    const creds = oss.credentials
    const now = new Date()
    const xAmzDate = amzDate(now)
    const date = xAmzDate.slice(0, 8)
    const credential = `${creds.access_key}/${date}/${oss.region}/s3/aws4_request`

    const policyObj = {
        expiration: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        conditions: [
            { bucket: oss.bucket },
            ['starts-with', '$key', 'tmp-photo/'],
            ['starts-with', '$Content-Type', 'image/'],
            { success_action_status: '200' },
            { 'X-Amz-Credential': credential },
            { 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256' },
            { 'X-Amz-Security-Token': creds.session_token },
            { 'X-Amz-Date': xAmzDate }
        ]
    }

    const policy = Buffer.from(JSON.stringify(policyObj)).toString('base64')
    const signature = signPolicy(creds.secret_key, policy, date, oss.region)

    const form = new FormData()
    form.append('key', oss.key)
    form.append('Content-Type', mime)
    form.append('success_action_status', '200')
    form.append('X-Amz-Credential', credential)
    form.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
    form.append('X-Amz-Security-Token', creds.session_token)
    form.append('X-Amz-Date', xAmzDate)
    form.append('Policy', policy)
    form.append('X-Amz-Signature', signature)
    form.append('file', fs.createReadStream(file), {
        filename: path.basename(file),
        contentType: mime
    })

    const res = await api.post(`https://${oss.bucket}.oss-ap-southeast-1.aliyuncs.com/`, form, {
        headers: {
            ...form.getHeaders(),
            'origin': ORIGIN,
            'referer': `${ORIGIN}/`,
            'user-agent': UA,
            'accept': '*/*'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    })

    if (res.status !== 200) {
        throw new Error('upload_failed')
    }

    return oss.data
}

async function checkQuota(uid) {
    const res = await api.get(`https://www.beautyplus.com/core-api/v1/img-enhancer/quota/info?scene=${SCENE}`, {
        headers: headers(uid)
    })

    if (res.status !== 200) {
        throw new Error('quota_failed')
    }

    if (res.data?.needUpgrade) {
        throw new Error('need_upgrade')
    }

    return res.data
}

async function createTask(sourceUrl, uid) {
    const res = await api.post('https://www.beautyplus.com/core-api/v2/img-enhancer/task', {
        sourceUrl,
        scene: SCENE,
        ratio: RATIO,
        realRatio: REAL_RATIO,
        functionRatio: null
    }, {
        headers: {
            ...headers(uid),
            'content-type': 'application/json'
        }
    })

    if (res.status !== 201 || typeof res.data !== 'string') {
        throw new Error('task_failed')
    }

    return res.data
}

async function getResult(taskId, uid) {
    const res = await api.get(`https://www.beautyplus.com/core-api/v2/img-enhancer/query-sse/${taskId}`, {
        responseType: 'stream',
        timeout: 120000,
        headers: {
            ...headers(uid),
            'accept': 'text/event-stream',
            'authorization': ''
        }
    })

    if (res.status !== 200) {
        throw new Error('sse_failed')
    }

    return await new Promise((resolve, reject) => {
        let raw = ''
        let finish = false

        const timer = setTimeout(() => {
            if (!finish) {
                finish = true
                res.data.destroy()
                reject(new Error('timeout'))
            }
        }, 120000)

        res.data.on('data', chunk => {
            raw += chunk.toString()

            for (const match of raw.matchAll(/^data:\s*(.+)$/gm)) {
                try {
                    const data = JSON.parse(match[1])

                    if (data.status === 'success' && data.effectUrl) {
                        finish = true
                        clearTimeout(timer)
                        res.data.destroy()
                        resolve(data.effectUrl)
                        return
                    }

                    if (data.status === 'failed' || data.status === 'error') {
                        finish = true
                        clearTimeout(timer)
                        res.data.destroy()
                        reject(new Error('process_failed'))
                        return
                    }
                } catch {}
            }
        })

        res.data.on('end', () => {
            if (!finish) {
                finish = true
                clearTimeout(timer)
                reject(new Error('empty_result'))
            }
        })

        res.data.on('error', err => {
            if (!finish) {
                finish = true
                clearTimeout(timer)
                reject(err)
            }
        })
    })
}

async function handler(m, { sock }) {
    try {
        const quoted = m.quoted || m
        const isImage = quoted.isImage || (quoted.mimetype && quoted.mimetype.startsWith('image/'))

        if (!isImage) {
            return m.reply(
                `🖼️ *ENHANCE IMAGE - ZERO TWO* 🖼️\n\n` +
                `💫 *"He~ mau enhance gambar apa darling?"* 💫\n\n` +
                `📌 *Cara pakai:*\n` +
                `> Reply gambar lalu ketik ${m.prefix}enhance\n` +
                `> Atau kirim gambar dengan caption ${m.prefix}enhance\n\n` +
                `📝 *Fitur:*\n` +
                `> 🚀 Upscale 2x - 4x\n` +
                `> ✨ HD Quality\n` +
                `> 🤖 AI Enhancement\n\n` +
                `🌸 *Yosh! Semangat!* 🌸`
            )
        }

        await m.reply(`⏳ *Enhancing image...*\n\n🖼️ *"Tunggu sebentar darling~ ini butuh proses AI"* 🦋`)

        // Download gambar
        let mediaBuffer
        try {
            if (quoted.download) {
                mediaBuffer = await quoted.download()
            } else {
                return m.reply(`❌ *Gagal download gambar!*\n\n> "He~ gambarnya gak bisa diambil nih darling~ 🗿"`)
            }
        } catch {
            return m.reply(`❌ *Gagal download gambar!*\n\n> "He~ ada masalah nih darling~ 🗿"`)
        }

        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer) || mediaBuffer.length < 100) {
            return m.reply(`❌ *Gambar tidak valid!*\n\n> "He~ itu bukan gambar yang bener darling~ 🗿"`)
        }

        // Simpan temporary
        const tmpDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true })
        }

        const tmpFile = path.join(tmpDir, `enhance_${Date.now()}.jpg`)
        fs.writeFileSync(tmpFile, mediaBuffer)

        try {
            const uid = randomUid()
            const policy = await getPolicy(tmpFile)
            const sourceUrl = await uploadFile(tmpFile, policy)
            await checkQuota(uid)
            const taskId = await createTask(sourceUrl, uid)
            const resultUrl = await getResult(taskId, uid)

            // Hapus temp file
            try { fs.unlinkSync(tmpFile) } catch (e) {}

            // Download hasil
            const resultRes = await axios.get(resultUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            })

            const resultBuffer = Buffer.from(resultRes.data)

            await sock.sendMessage(m.chat, {
                image: resultBuffer,
                caption: `✅ *ENHANCE SUCCESS!* ✅\n\n` +
                    `🦋 *Zero Two:* "Selesai darling~! 🎉"\n\n` +
                    `┌─〔 📝 *DETAIL* 〕─🦋\n` +
                    `│ 🚀 *Upscale:* ${RATIO}x - ${REAL_RATIO}x\n` +
                    `│ ✨ *Quality:* HD\n` +
                    `│ 🤖 *Engine:* BeautyPlus AI\n` +
                    `└─────────────────────────🦋\n\n` +
                    `💬 *Zero Two:* "Gambarnya jadi lebih keren kan darling~ 🗿"\n` +
                    `🌸 *Yosh! Semangat!* 🌸`
            }, { quoted: m })

        } catch (err) {
            // Hapus temp file
            try { fs.unlinkSync(tmpFile) } catch (e) {}

            if (err.message === 'need_upgrade') {
                return m.reply(`❌ *Kuota habis!*\n\n> "He~ kuota enhance udah habis nih darling~ 🗿"\n\n💬 Coba lagi besok ya~ 🌸`)
            }

            throw err
        }

    } catch (err) {
        console.error('[Enhance Error]', err)
        await m.reply(
            `❌ *Error!*\n\n` +
            `> "He~ ada yang salah nih darling~ 🗿"\n\n` +
            `📝 *Error:* ${err.message}\n\n` +
            `💬 Coba lagi nanti ya~ 🌸`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}