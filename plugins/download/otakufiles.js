const config = {
    name: 'otakufiles',
    alias: ['otaku', 'otakudl', 'otakufile'],
    category: 'download',
    description: 'Download file dari OtakuFiles (bypass captcha)',
    usage: '.otakufiles <url>',
    example: '.otakufiles https://otakufiles.com/...',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 5,
    isEnabled: true
}

const puppeteer = require("puppeteer")
const axios = require("axios")
const fs = require("fs")
const path = require("path")

function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (!bytes || bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

async function scrapeOtakufiles(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    
    const page = await browser.newPage()
    
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })
        
        const code = await page.$eval("form span", el => el.textContent.trim())
        
        await page.type("input[name='code']", code)
        
        await Promise.all([
            page.click("button[type='submit']"),
            page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
        ])
        
        const downloadLink = await page.$eval("a.btn.btn-dow", el => el.href)
        const fileName = downloadLink.split("/").pop().split("?")[0]
        
        const head = await axios.head(downloadLink)
        const fileSize = head.headers['content-length']
        
        await browser.close()
        
        return {
            success: true,
            link: downloadLink,
            fileName: fileName,
            fileSize: formatSize(fileSize),
            rawSize: fileSize
        }
        
    } catch (err) {
        await browser.close()
        return { success: false, error: err.message }
    }
}

async function downloadFile(url, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true })
    
    const fileName = url.split("/").pop().split("?")[0] || "download.zip"
    const output = path.join(outputDir, fileName)
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 180000
    })
    
    const writer = fs.createWriteStream(output)
    response.data.pipe(writer)
    
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, file: output, fileName: fileName }))
        writer.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const url = args[0]
    const downloadMode = args[1]?.toLowerCase() === 'download'
    
    if (!url) {
        return m.reply(`📥 *ᴏᴛᴀᴋᴜꜰɪʟᴇꜱ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> Download file dari OtakuFiles (bypass captcha)\n\n> Contoh:\n> .otakufiles https://otakufiles.com/...\n> .otakufiles https://otakufiles.com/... download\n\n⚠️ *Peringatan:*\n> • Proses bisa memakan waktu 30-60 detik\n> • Memerlukan koneksi stabil\n> • File besar mungkin butuh waktu lama`)
    }
    
    if (!url.includes('otakufiles.com')) {
        return m.reply(`❌ *URL tidak valid!*\n\n> Pastikan URL dari OtakuFiles.\n> Contoh: https://otakufiles.com/...`)
    }
    
    await m.reply(`⏳ *Memproses link OtakuFiles...*\n> 🔗 ${url.length > 50 ? url.slice(0, 50) + '...' : url}\n> 🕐 Ini mungkin memakan waktu 30-60 detik, Darling~`)
    
    const result = await scrapeOtakufiles(url)
    
    if (!result.success) {
        let errorMsg = `❌ *GAGAL MEMPROSES*\n\n`
        errorMsg += `⚠️ Error: ${result.error}\n\n`
        errorMsg += `> 💡 Kemungkinan penyebab:\n`
        errorMsg += `> • Link tidak valid\n> • Server OtakuFiles bermasalah\n> • Captcha tidak bisa di-bypass\n\n`
        errorMsg += `> Coba lagi nanti atau gunakan link lain, Darling~`
        return m.reply(errorMsg)
    }
    
    let infoTxt = `📥 *ᴏᴛᴀᴋᴜꜰɪʟᴇꜱ ᴅᴇᴛᴀɪʟ*\n\n`
    infoTxt += `╭──〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ* 〕───⬣\n`
    infoTxt += `│  📁 Nama: *${result.fileName}*\n`
    infoTxt += `│  💾 Ukuran: ${result.fileSize}\n`
    infoTxt += `│  🔗 Link: ${result.link}\n`
    infoTxt += `╰────────────────⬣\n\n`
    
    if (downloadMode) {
        await m.reply(`⏳ *Mendownload file...*\n> 📁 ${result.fileName}\n> 💾 ${result.fileSize}\n> 🕐 Mohon tunggu, file sedang diunduh...`)
        
        const tempDir = path.join(process.cwd(), 'temp', 'otakufiles')
        
        try {
            const downloadResult = await downloadFile(result.link, tempDir)
            
            if (downloadResult.success && fs.existsSync(downloadResult.file)) {
                const fileBuffer = fs.readFileSync(downloadResult.file)
                const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2)
                
                await sock.sendMessage(m.chat, {
                    document: fileBuffer,
                    mimetype: 'application/octet-stream',
                    fileName: downloadResult.fileName,
                    caption: `✅ *ᴅᴏᴡɴʟᴏᴀᴅ ꜱᴇʟᴇꜱᴀɪ!*\n\n📁 ${downloadResult.fileName}\n💾 ${fileSizeMB} MB`
                })
                
                fs.unlinkSync(downloadResult.file)
            } else {
                await m.reply(`✅ *Link berhasil didapatkan!*\n\n${infoTxt}\n> 💡 Download manual melalui link di atas, Darling~`)
            }
        } catch (downloadError) {
            await m.reply(`✅ *Link berhasil didapatkan!*\n\n${infoTxt}\n> ⚠️ Gagal mengunduh file: ${downloadError.message}\n> 💡 Download manual melalui link di atas, Darling~`)
        }
    } else {
        infoTxt += `> 💡 Ketik .otakufiles ${url} download untuk langsung download file\n> ⚠️ File besar mungkin butuh waktu lama`
        await m.reply(infoTxt)
    }
}

module.exports = {
    config,
    handler
}