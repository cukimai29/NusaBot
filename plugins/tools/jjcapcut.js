const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'jjcapcut',
    alias: ['jjlist', 'jjsearch', 'jjrender', 'capcutjj'],
    category: 'tools',
    description: 'Buat video CapCut dari template',
    usage: '.jjlist / .jjsearch <query> / .jjrender <nomor/id>',
    example: '.jjrender 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
}

class JJCapcut {
    constructor() {
        this.baseUrl = 'https://cc.fgsi.dpdns.org'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://cc.fgsi.dpdns.org',
            'Referer': 'https://cc.fgsi.dpdns.org/'
        }
    }

    async getCookie(templateId = '') {
        try {
            const url = templateId ? `${this.baseUrl}/create/${templateId}` : `${this.baseUrl}/`
            const res = await fetch(url, { headers: this.headers })
            const setCookie = res.headers.get('set-cookie') || ''
            return setCookie.split(';')[0] || ''
        } catch {
            return ''
        }
    }

    async list() {
        try {
            const res = await fetch(`${this.baseUrl}/list`, { headers: this.headers })
            if (res.ok) {
                const json = await res.json()
                return Object.entries(json).map(([key, val]) => ({
                    index: Number(key),
                    id: String(val.id),
                    title: val.title || 'Untitled',
                    mediaCount: Number(val.mediaCount || 1),
                    resolusi: val.resolusi || '9:16'
                }))
            }
        } catch {}

        try {
            const htmlRes = await fetch(`${this.baseUrl}/`, { headers: this.headers })
            if (htmlRes.ok) {
                const html = await htmlRes.text()
                const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)
                if (match) {
                    const data = JSON.parse(match[1])
                    const templates = data?.props?.pageProps?.templates || []
                    return templates.map((val, idx) => ({
                        index: idx + 1,
                        id: String(val.id),
                        title: val.title || 'Untitled',
                        mediaCount: Number(val.mediaCount || 1),
                        resolusi: val.resolusi || '9:16'
                    }))
                }
            }
        } catch (e) {
            throw new Error(`Failed to fetch template list: ${e.message}`)
        }
        return []
    }

    async search(query = '', limit = 10, offset = 0) {
        if (!query) throw new Error('Search query is required.')
        const cookie = await this.getCookie()
        const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
        const headers = { ...this.headers }
        if (cookie) headers['Cookie'] = cookie

        const res = await fetch(url, { headers })
        if (!res.ok) {
            throw new Error(`Search request failed with HTTP ${res.status}`)
        }
        return await res.json()
    }

    async create(templateId, images = []) {
        if (!templateId) throw new Error('Template ID is required.')
        if (!images || images.length === 0) throw new Error('Images are required.')

        const cookie = await this.getCookie(templateId)
        const form = new FormData()
        form.append('id', String(templateId))

        for (let i = 0; i < images.length; i++) {
            let buf = images[i]
            if (typeof buf === 'string') {
                if (fs.existsSync(buf)) {
                    buf = fs.readFileSync(buf)
                } else if (buf.startsWith('http')) {
                    const imgRes = await fetch(buf)
                    buf = Buffer.from(await imgRes.arrayBuffer())
                }
            }
            const blob = new Blob([buf], { type: 'image/jpeg' })
            form.append('files', blob, `image_${i + 1}.jpg`)
        }

        const headers = {
            ...this.headers,
            'Referer': `${this.baseUrl}/create/${templateId}`
        }
        if (cookie) headers['Cookie'] = cookie

        const res = await fetch(`${this.baseUrl}/jj`, {
            method: 'POST',
            body: form,
            headers
        })

        if (!res.ok) {
            const errTxt = await res.text().catch(() => '')
            throw new Error(`Create task failed with HTTP ${res.status}: ${errTxt}`)
        }

        const json = await res.json().catch(() => ({}))
        if (!json.task_id) {
            throw new Error(json.error || json.message || 'Failed to retrieve task_id.')
        }

        return { taskId: json.task_id, cookie, templateId }
    }

    async checkTask(taskId, templateId = '', cookie = '') {
        if (!taskId) throw new Error('Task ID is required.')
        const headers = {
            ...this.headers,
            'Referer': templateId ? `${this.baseUrl}/create/${templateId}` : `${this.baseUrl}/`
        }
        if (cookie) headers['Cookie'] = cookie

        const res = await fetch(`${this.baseUrl}/task/${taskId}`, { headers })
        if (!res.ok) {
            throw new Error(`Check task failed with HTTP ${res.status}`)
        }

        const json = await res.json()
        const videoUrl = json.video?.videoUrl || (typeof json.video === 'string' ? json.video : null) || json.result || json.url || null

        return {
            status: json.status,
            videoUrl,
            error: json.error || null,
            raw: json
        }
    }

    async render(templateId, images = [], options = {}) {
        const { interval = 5000, maxRetries = 50, onProgress = null } = options
        const task = await this.create(templateId, images)
        const { taskId, cookie } = task

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            await new Promise(r => setTimeout(r, interval))
            let result
            try {
                result = await this.checkTask(taskId, templateId, cookie)
            } catch {
                continue
            }

            if (typeof onProgress === 'function') {
                onProgress({ attempt, maxRetries, status: result.status, taskId })
            }

            if (result.videoUrl) {
                return { status: 'success', taskId, templateId, videoUrl: result.videoUrl }
            }

            if (result.status === 'error') {
                const err = result.error || 'Unknown error'
                if (err.includes('503')) {
                    throw new Error('CapCut upstream server is currently down / unavailable (HTTP 503).')
                }
                throw new Error(`Render failed: ${err}`)
            }
        }
        throw new Error('Rendering process timed out.')
    }
}

const jj = new JJCapcut()

async function compressImageBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', 'pipe:0',
            '-vf', "scale='min(720,iw)':-1",
            '-q:v', '5',
            '-f', 'image2',
            '-c:v', 'mjpeg',
            'pipe:1'
        ]
        const ffmpegProcess = spawn('ffmpeg', args)
        let chunks = []

        ffmpegProcess.stdout.on('data', chunk => chunks.push(chunk))
        ffmpegProcess.on('close', code => {
            if (code === 0) resolve(Buffer.concat(chunks))
            else reject(new Error(`FFmpeg exited with code ${code}`))
        })
        ffmpegProcess.on('error', reject)

        ffmpegProcess.stdin.write(buffer)
        ffmpegProcess.stdin.end()
    })
}

async function compressVideoBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', 'pipe:0',
            '-vcodec', 'libx264',
            '-crf', '28',
            '-preset', 'ultrafast',
            '-f', 'mp4',
            '-movflags', 'frag_keyframe+empty_moov',
            'pipe:1'
        ]

        const ffmpegProcess = spawn('ffmpeg', args)
        let chunks = []

        ffmpegProcess.stdout.on('data', chunk => chunks.push(chunk))
        ffmpegProcess.on('close', code => {
            if (code === 0) resolve(Buffer.concat(chunks))
            else reject(new Error(`FFmpeg exited with code ${code}`))
        })
        ffmpegProcess.on('error', reject)

        ffmpegProcess.stdin.write(buffer)
        ffmpegProcess.stdin.end()
    })
}

async function handler(m, { sock }) {
    try {
        const command = m.command?.toLowerCase() || ''
        const text = m.text?.trim() || ''

        if (command === 'jjlist') {
            await m.react('🔄')
            await m.reply('🔄 *Mengambil daftar template...*')
            const templates = await jj.list()
            if (!templates.length) {
                await m.react('❌')
                return m.reply('❌ Gagal mengambil atau daftar kosong.')
            }

            let txt = `╭━━━〔 🎬 JJ CAPCUT TEMPLATE 〕━━━⬣\n│\n`
            templates.forEach((t) => {
                txt += `│ *${t.index}.* ${t.title}\n`
                txt += `│ ↳ 🆔 ID: \`${t.id}\`\n`
                txt += `│ ↳ 📸 Butuh: ${t.mediaCount} Foto | 📐 Rasio: ${t.resolusi}\n│\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━⬣\n\n`
            txt += `💡 *Cara Pakai:*\n`
            txt += `> Kirim/balas gambar dengan caption\n`
            txt += `> ${m.prefix}jjrender <nomor/id>`
            await m.react('✅')
            return m.reply(txt.trim())
        }

        if (command === 'jjsearch') {
            if (!text) {
                return m.reply(
                    `❓ *Masukkan kata kunci!*\n\n` +
                    `📌 Contoh:\n> ${m.prefix}jjsearch jedag jedug`
                )
            }

            await m.react('🔍')
            await m.reply(`🔍 *Mencari template:* ${text}`)

            const results = await jj.search(text, 5, 0)
            if (!results.length) {
                await m.react('❌')
                return m.reply('❌ Template tidak ditemukan.')
            }

            let txt = `╭━━━〔 🔍 HASIL PENCARIAN 〕━━━⬣\n│\n`
            results.forEach((item, i) => {
                txt += `│ *${i + 1}.* ${item.title}\n`
                txt += `│ ↳ 🆔 ID: \`${item.id}\`\n`
                txt += `│ ↳ 👤 Author: ${item.author?.name || 'Unknown'}\n│\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━⬣`
            await m.react('✅')
            return m.reply(txt.trim())
        }

        if (command === 'jjrender') {
            let input = text.trim()
            if (!input) {
                return m.reply(
                    `❓ *Masukkan nomor urut atau ID Template!*\n\n` +
                    `📌 Contoh pakai nomor:\n> ${m.prefix}jjrender 1\n\n` +
                    `📌 Contoh pakai ID:\n> ${m.prefix}jjrender 7649585745329540360`
                )
            }

            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || ''
            if (!mime.includes('image')) {
                return m.reply(
                    `📸 Kirim atau balas sebuah gambar dengan caption:\n` +
                    `> ${m.prefix}jjrender ${input}`
                )
            }

            let templateId = input
            let mediaCount = 1

            if (input.length < 5 && !isNaN(input)) {
                const templates = await jj.list()
                const found = templates.find(t => t.index === Number(input))

                if (!found) {
                    await m.react('❌')
                    return m.reply('❌ Nomor template tidak ditemukan di daftar *.jjlist*.')
                }

                templateId = found.id
                mediaCount = found.mediaCount || 1
            } else {
                const templates = await jj.list()
                const found = templates.find(t => t.id === input)
                if (found) mediaCount = found.mediaCount || 1
            }

            await m.react('⏳')
            await m.reply(`⏳ *Memproses template* (butuh ${mediaCount} foto)\n\n> Bot sedang mengunduh & mengkompres gambar...`)

            let buffer = await q.download()
            if (!buffer) {
                await m.react('❌')
                return m.reply('❌ Gagal mengunduh gambar.')
            }

            try {
                buffer = await compressImageBuffer(buffer)
            } catch (compressErr) {
                console.log('Gagal kompres gambar:', compressErr)
            }

            let imagesToRender = Array(mediaCount).fill(buffer)

            const result = await jj.render(templateId, imagesToRender, {
                interval: 5000,
                maxRetries: 100
            })

            await m.reply(`✅ *Video berhasil dibuat!*\n\n> Sedang melakukan kompresi video sebelum dikirim...`)

            let videoBuffer
            try {
                const vidRes = await fetch(result.videoUrl)
                const arrayBuf = await vidRes.arrayBuffer()
                videoBuffer = Buffer.from(arrayBuf)
                videoBuffer = await compressVideoBuffer(videoBuffer)
            } catch (err) {
                console.log('Gagal kompres video, menggunakan URL asli. Error:', err.message)
                videoBuffer = { url: result.videoUrl }
            }

            await sock.sendMessage(m.chat, {
                video: Buffer.isBuffer(videoBuffer) ? videoBuffer : videoBuffer,
                caption: `✅ *Render & Kompresi Berhasil!*\n\n🆔 ID Template: ${templateId}\n\n💕 *NusaBot*`
            }, { quoted: m })

            await m.react('💗')
        }

    } catch (error) {
        console.error('[JJCAPCUT Error]', error)
        await m.react('❌')
        await m.reply(`❌ *Terjadi Kesalahan:*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}