const config = {
    name: 'upscale',
    alias: ['hdr', 'hdrimage', 'enhance', 'perjelas'],
    category: 'tools',
    description: 'Upscale/Perjelas gambar dengan AI (HD/4K)',
    usage: '.upscale (reply gambar)',
    example: '.upscale',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

const axios = require('axios')
const cheerio = require('cheerio')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

async function getToken() {
    try {
        const html = await axios.get('https://www.iloveimg.com/upscale-image', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        })
        
        const $ = cheerio.load(html.data)
        const script = $('script')
            .filter((i, el) => $(el).html()?.includes('ilovepdfConfig ='))
            .html()
        
        if (!script) throw new Error('Token script not found')
        
        const jsonS = script.split('ilovepdfConfig = ')[1].split(';')[0]
        const json = JSON.parse(jsonS)
        const csrf = $('meta[name="csrf-token"]').attr('content')
        
        return { token: json.token, csrf }
    } catch (err) {
        throw new Error('Failed to get token: ' + err.message)
    }
}

async function uploadImage(server, headers, buffer, task) {
    const form = new FormData()
    form.append('name', 'image.jpg')
    form.append('chunk', '0')
    form.append('chunks', '1')
    form.append('task', task)
    form.append('preview', '1')
    form.append('file', buffer, 'image.jpg')
    
    const res = await axios.post(`https://${server}.iloveimg.com/v1/upload`, form, {
        headers: {
            ...headers,
            ...form.getHeaders(),
        },
        timeout: 60000
    })
    
    return res.data
}

async function hdr(buffer, scale = 4) {
    const { token, csrf } = await getToken()
    
    const servers = [
        'api1g', 'api2g', 'api3g', 'api8g', 'api9g', 'api10g', 'api11g', 'api12g',
        'api13g', 'api14g', 'api15g', 'api16g', 'api17g', 'api18g', 'api19g',
        'api20g', 'api21g', 'api22g', 'api24g', 'api25g'
    ]
    const server = servers[Math.floor(Math.random() * servers.length)]
    
    const task = 'r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6yqgx7c8vg7sfbqnrr42qb16v0gj8jl5s0kq1kgp26mdyjjspd8c5A2wk8b4Adbm6vf5tpwbqlqdr8A9tfn7vbqvy28ylphlxdl379psxpd8r70nzs3sk1'
    
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Origin': 'https://www.iloveimg.com/',
        'Cookie': '_csrf=' + csrf,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    const upload = await uploadImage(server, headers, buffer, task)
    
    const form = new FormData()
    form.append('task', task)
    form.append('server_filename', upload.server_filename)
    form.append('scale', scale)
    
    const res = await axios.post(`https://${server}.iloveimg.com/v1/upscale`, form, {
        headers: {
            ...headers,
            ...form.getHeaders(),
        },
        responseType: 'arraybuffer',
        timeout: 120000
    })
    
    return res.data
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    let scale = parseInt(args[0])
    
    if (!scale || scale < 2 || scale > 8) {
        scale = 4
    }
    
    if (!m.quoted || !m.quoted.message?.imageMessage) {
        return m.reply(`🖼️ *ᴜᴘꜱᴄᴀʟᴇ ɪᴍᴀɢᴇ*\n\n> Perjelas/upscale gambar dengan AI (hingga 8x)\n\n> Contoh:\n> • .upscale (reply gambar) - skala 4x\n> • .upscale 2 (reply gambar) - skala 2x\n> • .upscale 8 (reply gambar) - skala 8x\n\n📝 *Info:*\n> • Support skala 2x, 4x, 6x, 8x\n> • Proses memakan waktu 20-40 detik\n> • Hasil gambar akan dikirim kembali`)
    }
    
    if (scale !== 2 && scale !== 4 && scale !== 6 && scale !== 8) {
        return m.reply(`❌ *SKALA TIDAK VALID*\n\n> Gunakan skala: 2, 4, 6, atau 8\n> Contoh: .upscale 4`)
    }
    
    await m.reply(`⏳ *Memproses gambar...*\n> 📐 Skala: ${scale}x\n> 🕐 Mohon tunggu 20-40 detik, Darling~`)
    
    try {
        const media = await m.quoted.download()
        
        if (media.length > 8 * 1024 * 1024) {
            return m.reply(`❌ *GAMBAR TERLALU BESAR*\n\n> Maksimal ukuran gambar 8MB.\n> Ukuran: ${(media.length / 1024 / 1024).toFixed(2)} MB`)
        }
        
        const resultBuffer = await hdr(media, scale)
        
        if (resultBuffer && resultBuffer.length > 0) {
            await sock.sendMessage(m.chat, {
                image: resultBuffer,
                caption: `✅ *ᴜᴘꜱᴄᴀʟᴇ ꜱᴇʟᴇꜱᴀɪ!*\n\n📐 Skala: ${scale}x\n📊 Ukuran hasil: ${(resultBuffer.length / 1024 / 1024).toFixed(2)} MB\n\n> *Sebelum vs Sesudah* - Gambar jadi lebih tajam, Darling~`
            })
        } else {
            await m.reply(`❌ *GAGAL UPLOAD HASIL*\n\n> Coba lagi nanti dengan gambar yang lebih kecil, Darling~`)
        }
        
    } catch (error) {
        console.error('Upscale Error:', error)
        
        let errorMsg = `❌ *ERROR*\n\n`
        errorMsg += `> ${error.message}\n\n`
        errorMsg += `> 💡 Kemungkinan penyebab:\n`
        errorMsg += `> • Server iLoveIMG sibuk\n`
        errorMsg += `> • Gambar terlalu kompleks\n`
        errorMsg += `> • Koneksi bermasalah\n\n`
        errorMsg += `> Coba lagi nanti dengan gambar lain, Darling~`
        
        await m.reply(errorMsg)
    }
}

module.exports = {
    config,
    handler
}