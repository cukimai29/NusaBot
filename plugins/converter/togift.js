// plugins/togif.js
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic)

const pluginConfig = {
    name: 'togif',
    alias: ['gif', 'videogif', 'mp4togif'],
    category: 'converter',
    description: 'Ubah video jadi GIF. Bisa atur durasi dan ukuran',
    usage: '.togif [durasi] [start] [ukuran]',
    example: '.togif\n.togif 5\n.togif 10 2 400',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const tempDir = path.join(__dirname, '../../temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

/**
 * Konversi video ke GIF pake ffmpeg
 * @param {string} inputPath - Path file video input
 * @param {number} duration - Durasi GIF dalam detik (default 5)
 * @param {number} startTime - Mulai dari detik ke berapa (default 0)
 * @param {number} size - Ukuran width dalam pixel (default 400)
 * @returns {Promise<string>} - Path file GIF hasil
 */
async function videoToGif(inputPath, duration = 5, startTime = 0, size = 400) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(tempDir, `gif_${Date.now()}.gif`)
        
        ffmpeg(inputPath)
            .setStartTime(startTime)
            .duration(duration)
            .outputOptions([
                `-vf`,

                 `fps=10,scale=${size}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
                '-loop', '0'
            ])
            .output(outputPath)
            .on('end', () => {
                console.log('[ToGif] Konversi selesai')
                resolve(outputPath)
            })
            .on('error', (err) => {
                console.error('[ToGif] Error:', err)
                reject(err)
            })
            .run()
    })
}

// Format durasi biar gampang dibaca
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
        return `${mins} menit ${secs} detik`
    }
    return `${secs} detik`
}

// Parse argumen dari pesan
function parseArgs(text) {
    if (!text) return { duration: 5, startTime: 0, size: 400 }
    
    const args = text.trim().split(/\s+/)
    let duration = 5
    let startTime = 0
    let size = 400
    
    if (args[0] && !isNaN(args[0])) {
        duration = Math.min(parseInt(args[0]), 30) // maks 30 detik
    }
    if (args[1] && !isNaN(args[1])) {
        startTime = parseInt(args[1])
    }
    if (args[2] && !isNaN(args[2])) {
        size = Math.min(parseInt(args[2]), 800) // maks 800px
    }
    
    return { duration, startTime, size }
}

async function handler(m, { sock }) {
    // Cek apakah ada media yang di-quote atau dikirim langsung
    let quotedMessage = m.quoted
    
    // Cari video di pesan yang di-quote atau kiriman langsung
    let videoBuffer = null
    let isQuoted = false
    
    // Case 1: Reply ke pesan yang ada videonya
    if (quotedMessage && (quotedMessage.videoMessage || quotedMessage.documentMessage)) {
        const mediaMsg = quotedMessage.videoMessage || quotedMessage.documentMessage
        if (mediaMsg && mediaMsg.mimetype && mediaMsg.mimetype.includes('video')) {
            videoBuffer = await sock.downloadMediaMessage(quotedMessage)
            isQuoted = true
        }
    }
    
    // Case 2: Kirim video langsung + caption .togif
    if (!videoBuffer && m.message?.videoMessage) {
        videoBuffer = await sock.downloadMediaMessage(m)
    }
    
    // Case 3: Reply ke pesan yang di-forward
    if (!videoBuffer && quotedMessage?.videoMessage) {
        videoBuffer = await sock.downloadMediaMessage(quotedMessage)
        isQuoted = true
    }
    
    if (!videoBuffer) {
        return m.reply(`🎬 *TO GIF*\n\n> Cara penggunaan:\n` +
            `1. *Reply* ke video dengan command \`.togif\`\n` +
            `2. Atau kirim video langsung dengan caption \`.togif [durasi] [start] [ukuran]\`\n\n` +
            `📌 *Contoh:*\n` +
            `• \`.togif\` (default 5 detik)\n` +
            `• \`.togif 10\` (10 detik dari awal)\n` +
            `• \`.togif 8 2\` (8 detik, mulai dari detik 2)\n` +
            `• \`.togif 5 0 300\` (5 detik, ukuran 300px)\n\n` +
            `🦋 *Zero Two:* Kasih video dulu dong darling~ 🗿`)
    }
    
    await m.react('⏳')
    
    try {
        // Parse argumen durasi
        const args = m.text || ''
        const { duration, startTime, size } = parseArgs(args)
        
        await m.reply(`🎬 *Zero Two:* Sedang mengubah video ke GIF...\n\n` +
            `⏱️ *Durasi:* ${formatDuration(duration)}\n` +
            `🎬 *Mulai dari:* detik ${startTime}\n` +
            `📐 *Ukuran:* ${size}px\n\n` +
            `Tunggu sebentar ya darling~ 🔥`)
        
        // Simpan video sementara
        const tempVideo = path.join(tempDir, `video_${Date.now()}.mp4`)
        fs.writeFileSync(tempVideo, videoBuffer)
        
        // Konversi ke GIF
        const gifPath = await videoToGif(tempVideo, duration, startTime, size)
        
        // Baca hasil GIF
        const gifBuffer = fs.readFileSync(gifPath)
        
        // Kirim GIF
        await sock.sendMessage(m.chat, {
            video: gifBuffer,
            mimetype: 'video/gif',
            caption: `🎬 *Konversi Selesai!*\n\n` +
                `⏱️ Durasi: ${formatDuration(duration)}\n` +
                `📐 Ukuran: ${size}px\n\n` +
                `🦋 *Zero Two:* Ini GIF-nya darling~ semoga suka! 💕`
        }, { quoted: m })
        
        // Bersihin file temporary
        try {
            fs.unlinkSync(tempVideo)
            fs.unlinkSync(gifPath)
        } catch (e) {}
        
        await m.react('✅')
        
    } catch (err) {
        console.error('[ToGif] Error:', err)
        await m.react('❌')
        await m.reply(`❌ *Error:* ${err.message}\n\n> Coba lagi ya darling, mungkin video terlalu besar atau durasi terlalu panjang 🗿`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}