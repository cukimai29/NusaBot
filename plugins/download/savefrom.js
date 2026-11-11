const config = {
    name: 'savefrom',
    alias: ['sf', 'sfdownload', 'savefromnet'],
    category: 'download',
    description: 'Download video dari berbagai platform (YouTube, TikTok, Facebook, dll) via SaveFrom.net',
    usage: '.savefrom <url>',
    example: '.savefrom https://youtu.be/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 3,
    isEnabled: true
}

const axios = require("axios")
const { JSDOM } = require("jsdom")
const vm = require('vm2')
const fs = require('fs')
const path = require('path')

async function savefrom(videoUrl) {
    const body = new URLSearchParams({
        "sf_url": encodeURI(videoUrl),
        "sf_submit": "",
        "new": 2,
        "lang": "id",
        "app": "",
        "country": "id",
        "os": "Windows",
        "browser": "Chrome",
        "channel": " main",
        "sf-nomad": 1
    })

    const { data } = await axios({
        url: "https://worker.sf-tools.com/savefrom.php",
        method: "POST",
        data: body,
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://id.savefrom.net",
            "referer": "https://id.savefrom.net/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36"
        },
        timeout: 30000
    })

    const dom = new JSDOM(data)
    const document = dom.window.document

    let exec = '[]["filter"]["constructor"](b).call(a);'
    let newData = data.replace(exec, `\ntry {\ni++;\nif (i === 2) scriptResult = ${exec.split(".call")[0]}.toString();\nelse (\n${exec.replace(/;/, "")}\n);\n} catch {}`)
    
    let context = {
        "scriptResult": "",
        "i": 0
    }
    vm.createContext(context)
    new vm.Script(newData).runInContext(context)

    const videoResultMatch = context.scriptResult.match(/window\.parent\.sf\.videoResult\.show\((.*?)\);/)
    
    if (!videoResultMatch) {
        throw new Error('Failed to parse video info')
    }
    
    return JSON.parse(videoResultMatch[1])
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

async function getFileSize(url) {
    try {
        const head = await axios.head(url, { timeout: 10000 })
        return head.headers['content-length']
    } catch {
        return null
    }
}

async function downloadFile(url, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true })
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 180000
    })
    
    const contentDisposition = response.headers['content-disposition']
    let filename = 'download.mp4'
    
    if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match && match[1]) filename = match[1].replace(/['"]/g, '')
    }
    
    if (!filename || filename === 'download.mp4') {
        filename = `video_${Date.now()}.mp4`
    }
    
    const output = path.join(outputDir, filename)
    const writer = fs.createWriteStream(output)
    response.data.pipe(writer)
    
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, file: output, fileName: filename }))
        writer.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const url = args[0]
    const downloadMode = args[1]?.toLowerCase() === 'download'
    
    if (!url) {
        return m.reply(`📥 *ꜱᴀᴠᴇꜰʀᴏᴍ.ɴᴇᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> Download video dari berbagai platform:\n> • YouTube\n> • TikTok\n> • Facebook\n> • Instagram\n> • Twitter/X\n> • dan lainnya\n\n> Contoh:\n> .savefrom https://youtu.be/xxx\n> .savefrom https://youtu.be/xxx download\n\n📝 *Info:*\n> • Menggunakan API SaveFrom.net\n> • Proses 10-20 detik`)
    }
    
    await m.reply(`⏳ *Memproses link...*\n> 🔗 ${url.length > 50 ? url.slice(0, 50) + '...' : url}\n> 🕐 Mohon tunggu 10-20 detik, Darling~`)
    
    try {
        const result = await savefrom(url)
        
        if (!result || !result.count) {
            return m.reply(`❌ *GAGAL MENDAPATKAN VIDEO*\n\n> Video tidak ditemukan atau link tidak didukung.\n> Coba platform lain atau cek linknya, Darling~`)
        }
        
        const videoData = result[0]
        
        if (!videoData || !videoData.url || !videoData.url.length) {
            return m.reply(`❌ *TIDAK ADA LINK DOWNLOAD*\n\n> Tidak ada link download yang tersedia untuk video ini.`)
        }
        
        // Ambil link dengan kualitas terbaik (biasanya terakhir)
        const downloadUrls = videoData.url
        const bestQuality = downloadUrls[downloadUrls.length - 1]
        const allQualities = downloadUrls.map((u, i) => {
            const quality = videoData.quality?.[i] || `Quality ${i+1}`
            return { quality, url: u }
        }).reverse()
        
        let txt = `📥 *ꜱᴀᴠᴇꜰʀᴏᴍ.ɴᴇᴛ ʀᴇꜱᴜʟᴛ*\n\n`
        txt += `╭──〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ* 〕───⬣\n`
        txt += `│  📛 Judul: *${videoData.title || 'Tidak diketahui'}*\n`
        txt += `│  🕐 Durasi: ${videoData.duration || '?'}\n`
        txt += `╰────────────────⬣\n\n`
        
        txt += `╭──〔 📥 *ʟɪɴᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 〕───⬣\n`
        for (const q of allQualities.slice(0, 5)) {
            txt += `│  🎬 ${q.quality}\n`
            txt += `│     └ ${q.url.length > 60 ? q.url.slice(0, 60) + '...' : q.url}\n`
        }
        txt += `╰────────────────⬣\n\n`
        
        if (downloadMode) {
            await m.reply(`⏳ *Mendownload video...*\n> 🎬 Kualitas: ${bestQuality.quality || 'Best'}\n> 📁 Mohon tunggu file sedang diunduh...`)
            
            const tempDir = path.join(process.cwd(), 'temp', 'savefrom')
            const bestUrl = bestQuality.url || bestQuality
            
            try {
                const downloadResult = await downloadFile(bestUrl, tempDir)
                
                if (downloadResult.success && fs.existsSync(downloadResult.file)) {
                    const fileBuffer = fs.readFileSync(downloadResult.file)
                    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2)
                    
                    await sock.sendMessage(m.chat, {
                        video: fileBuffer,
                        caption: `✅ *ᴅᴏᴡɴʟᴏᴀᴅ ꜱᴇʟᴇꜱᴀɪ!*\n\n📛 ${videoData.title || 'Video'}\n💾 ${fileSizeMB} MB\n🎬 Kualitas: ${bestQuality.quality || 'Best'}`
                    })
                    
                    fs.unlinkSync(downloadResult.file)
                } else {
                    await m.reply(`${txt}\n> ⚠️ Gagal mengunduh file. Silahkan download manual melalui link di atas, Darling~`)
                }
            } catch (downloadError) {
                await m.reply(`${txt}\n> ⚠️ Gagal mengunduh file: ${downloadError.message}\n> Silahkan download manual melalui link di atas, Darling~`)
            }
        } else {
            txt += `> 💡 Ketik .savefrom ${url} download untuk download video otomatis\n> ⚠️ File bisa besar, pastikan koneksi stabil`
            await m.reply(txt)
        }
        
    } catch (error) {
        console.error('SaveFrom Error:', error)
        
        let errorMsg = `❌ *ERROR*\n\n`
        errorMsg += `> ${error.message}\n\n`
        errorMsg += `> 💡 Kemungkinan penyebab:\n`
        errorMsg += `> • Link tidak didukung\n`
        errorMsg += `> • Server SaveFrom.net bermasalah\n`
        errorMsg += `> • Video bersifat private/dihapus\n\n`
        errorMsg += `> Coba lagi nanti atau gunakan platform lain, Darling~`
        
        await m.reply(errorMsg)
    }
}

module.exports = {
    config,
    handler
}