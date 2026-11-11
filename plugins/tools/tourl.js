const FormData = require('form-data')
const fetch = require('node-fetch')
const axios = require('axios')
const { downloadMediaMessage, getContentType } = require('zerotwo')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

const pluginConfig = {
    name: 'tourl',
    alias: ['upload', 'catbox', 'url', 'toupload'],
    category: 'tools',
    description: 'Upload media ke multiple host dan dapatkan URL',
    usage: '.tourl (reply/kirim media)',
    example: '.tourl',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

// ================= UPLOADERS ================= //

async function uploadToCatbox(buffer, filename) {
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', buffer, { filename })

        const res = await fetch('https://catbox.moe/user/api.php', { 
            method: 'POST', 
            body: form,
            timeout: 30000
        })
        const url = await res.text()
        if (!url || !url.startsWith('http')) throw new Error('Invalid response')
        return { host: 'Catbox', url: url.trim() }
    } catch (e) {
        throw e
    }
}

async function uploadToLitterbox(buffer, filename) {
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('time', '72h')
        form.append('fileToUpload', buffer, { filename })

        const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { 
            method: 'POST', 
            body: form,
            timeout: 30000
        })
        const url = await res.text()
        if (!url || !url.startsWith('http')) throw new Error('Invalid response')
        return { host: 'Litterbox', url: url.trim() }
    } catch (e) {
        throw e
    }
}

async function uploadToTmpFiles(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://tmpfiles.org/api/v1/upload', { 
            method: 'POST', 
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        if (!url) throw new Error('No URL')
        return { host: 'TmpFiles', url }
    } catch (e) {
        throw e
    }
}

async function uploadToGofile(buffer, filename) {
    try {
        const serverRes = await fetch('https://api.gofile.io/servers', { timeout: 10000 })
        const serverData = await serverRes.json()
        const server = serverData?.data?.servers?.[0]?.name
        if (!server) throw new Error('No server')

        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch(`https://${server}.gofile.io/uploadFile`, { 
            method: 'POST', 
            body: form,
            timeout: 60000
        })
        const data = await res.json()
        const url = data?.data?.downloadPage
        if (!url) throw new Error('No URL')
        return { host: 'Gofile', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTermai(buffer, filename) {
    try {
        const form = new FormData()
        form.append("file", buffer, { filename })

        const res = await axios.post(
            "https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 30000
            }
        )

        const url = res?.data?.data?.url
        if (!res.data?.status || !url) throw new Error('No URL')
        return { host: 'Termai', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTop4top(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, filename)

        const res = await axios.post(
            'https://www.top4top.io/index.php',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 30000
            }
        )

        const html = res.data
        const match = html.match(/https?:\/\/[a-z]\.top4top\.io\/[^\s"']+/)
        if (!match) throw new Error('Parse failed')
        return { host: 'Top4Top', url: match[0] }
    } catch (e) {
        throw e
    }
}

async function uploadToImgBB(buffer, filename) {
    try {
        const form = new FormData()
        form.append('image', buffer.toString('base64'))

        const res = await fetch('https://api.imgbb.com/1/upload?key=2e2bcb7d6e18dc7c69e35fd50b6dfd84', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.data?.url
        if (!url) throw new Error('No URL')
        return { host: 'ImgBB', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTelegraph(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://telegra.ph/upload', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.[0]?.src
        if (!url) throw new Error('No URL')
        return { host: 'Telegraph', url: `https://telegra.ph${url}` }
    } catch (e) {
        throw e
    }
}

// 🔥 PAKE FILE.IO (ALTERNATIF)
async function uploadToFileIo(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://file.io/', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.link
        if (!url) throw new Error('No URL')
        return { host: 'File.io', url }
    } catch (e) {
        throw e
    }
}

// ================= LIST UPLOADERS (URUTAN PRIORITAS) ================= //

const UPLOADERS = [
    { name: 'Catbox', fn: uploadToCatbox },
    { name: 'Litterbox', fn: uploadToLitterbox },
    { name: 'TmpFiles', fn: uploadToTmpFiles },
    { name: 'ImgBB', fn: uploadToImgBB },
    { name: 'Telegraph', fn: uploadToTelegraph },
    { name: 'Termai', fn: uploadToTermai },
    { name: 'Top4Top', fn: uploadToTop4top },
    { name: 'Gofile', fn: uploadToGofile },
    { name: 'File.io', fn: uploadToFileIo }
]

// ================= HANDLER ================= //

async function handler(m, { sock }) {
    let media = null
    let filename = 'file.bin'
    let mimetype = 'application/octet-stream'

    const msg = m.quoted || m
    const type = getContentType(msg.message)

    if (!type || type === 'conversation') {
        return m.reply(
            `💕 *ᴛᴏᴜʀʟ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   Kirim atau reply gambar/video/audio\n` +
            `┃   dengan caption \`.tourl\`\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau upload media apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }

    try {
        media = await downloadMediaMessage(msg, 'buffer', {})
        
        if (!media || media.length === 0) {
            throw new Error('Gagal download media')
        }

        const msgType = msg.message[type]
        mimetype = msgType?.mimetype || 'application/octet-stream'
        const ext = mimetype.split('/')[1] || 'bin'
        filename = `file.${ext}`

        if (media.length > 50 * 1024 * 1024) {
            return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> File terlalu besar! Maksimal 50MB darling~ 🥺`)
        }

    } catch (err) {
        console.error('[Tourl] Download error:', err)
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n> ${err.message}`)
    }

    m.react('💕')
    await m.reply(`⏳ *ᴜᴘʟᴏᴀᴅɪɴɢ...*\n\n💗 *Zero Two:* Lagi upload media darling~ tunggu sebentar yaa 📤`)

    const results = []
    const failed = []

    for (const uploader of UPLOADERS) {
        try {
            const result = await uploader.fn(media, filename)
            if (result?.url) {
                results.push(result)
                console.log(`[Tourl] ✅ ${uploader.name} success: ${result.url}`)
            } else {
                failed.push(uploader.name)
            }
        } catch (err) {
            console.log(`[Tourl] ❌ ${uploader.name} failed:`, err.message)
            failed.push(uploader.name)
        }
        await new Promise(r => setTimeout(r, 500))
    }

    if (results.length === 0) {
        m.react('💔')
        return m.reply(
            `💔 *ᴜᴘʟᴏᴀᴅ ɢᴀɢᴀʟ*\n\n` +
            `> Semua host upload gagal darling~ 🥺\n\n` +
            `> Coba lagi nanti yaa`
        )
    }

    const mainUrl = results[0].url
    const fileSizeMB = (media.length / 1024 / 1024).toFixed(2)

    let caption = 
`💕 *ᴛᴏᴜʀʟ* 💕\n\n` +
`╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
`┃ 📦 *ᴜᴋᴜʀᴀɴ*: ${fileSizeMB} MB\n` +
`┃ 📁 *ᴛɪᴘᴇ*: ${mimetype}\n` +
`┃ ✅ *ʜᴏꜱᴛ*: ${results.length}/${UPLOADERS.length} berhasil\n` +
`╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`

    for (let i = 0; i < results.length; i++) {
        const r = results[i]
        caption += 
`╭━━━〔 ${i + 1}. ${r.host} 〕━━━⬣\n` +
`┃ 🔗 ${r.url}\n` +
`╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
    }

    if (failed.length > 0) {
        caption += `⚠️ *ɢᴀɢᴀʟ*: ${failed.join(', ')}\n\n`
    }

    caption += `💗 *Zero Two:* Ini hasil uploadnya darling~ 📎`

    try {
        await sock.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `📤 UPLOAD SUCCESS`,
                    body: `${results.length} host berhasil`,
                    thumbnailUrl: 'https://i.imgur.com/upload-icon.png',
                    sourceUrl: mainUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        await m.reply(caption)
        m.react('✅')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}