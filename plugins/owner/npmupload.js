const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const AdmZip = require('adm-zip')
const execAsync = promisify(exec)

const pluginConfig = {
    name: 'npmpublish',
    alias: ['npmup', 'npmzip', 'publishnpm'],
    category: 'owner',
    description: 'Upload file ZIP ke npm registry (reply file zip)',
    usage: '.npmpublish <package-name@version>',
    example: '.npmpublish zerotwo-baileys@0.5.0',
    isOwner: true,
    cooldown: 30,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const packageSpec = args[0]
    
    if (!packageSpec || !packageSpec.includes('@')) {
        return m.reply(
            `💕 *ɴᴘᴍ ᴘᴜʙʟɪꜱʜ* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   Reply file ZIP lalu ketik:\n` +
            `┃   ${m.prefix}npmpublish nama-package@version\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}npmpublish zerotwo-baileys@0.5.0\n` +
            `┃\n` +
            `┃ ✦ *Syarat ZIP*\n` +
            `┃   • Berisi package.json\n` +
            `┃   • Berisi file source code\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau publish package apa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    const [packageName, version] = packageSpec.split('@')
    
    if (!packageName || !version) {
        return m.reply(`❌ Format salah! Gunakan: \`nama-package@version\``)
    }
    
    const quoted = m.quoted
    if (!quoted) {
        return m.reply(`❌ Reply file ZIP yang mau diupload darling~ 🥺`)
    }
    
    m.react('💕')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi publish package npm darling~ tunggu sebentar yaa 📦`)
    
    let mediaBuffer = null
    
    try {
        mediaBuffer = await quoted.download()
        if (!mediaBuffer) throw new Error('Gagal download file')
    } catch (err) {
        m.react('💔')
        return m.reply(`❌ Gagal download file: ${err.message}`)
    }
    
    const tempDir = path.join(process.cwd(), 'tmp', `npm_${Date.now()}`)
    const packageJsonPath = path.join(tempDir, 'package.json')
    
    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        await m.reply(`📂 *ᴇxᴛʀᴀᴄᴛɪɴɢ...*\n> Memproses file ZIP darling~`)
        
        const zip = new AdmZip(mediaBuffer)
        zip.extractAllTo(tempDir, true)
        
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json tidak ditemukan dalam ZIP!')
        }
        
        let packageJson
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        } catch (e) {
            throw new Error('package.json tidak valid!')
        }
        
        const oldName = packageJson.name
        const oldVersion = packageJson.version
        
        packageJson.name = packageName
        packageJson.version = version
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
        
        await m.reply(
            `✅ *ᴇxᴛʀᴀᴄᴛ ʙᴇʀʜᴀꜱɪʟ*\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ 📦 *ɴᴀᴍᴇ*: ${packageName}\n` +
            `┃ 🔢 *ᴠᴇʀꜱɪ*: ${version}\n` +
            `┃ 📝 *ᴅᴇꜱᴄ*: ${packageJson.description || '-'}\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
        
        await m.reply(`🔍 *ᴍᴇᴍᴇʀɪᴋꜱᴀ ʟᴏɢɪɴ...*`)
        
        let whoamiResult
        try {
            const { stdout } = await execAsync('npm whoami', { cwd: tempDir })
            whoamiResult = stdout.trim()
            await m.reply(`✅ *ʟᴏɢɪɴ sᴇʙᴀɢᴀɪ:* \`${whoamiResult}\``)
        } catch {
            return m.reply(
                `❌ *ʙᴇʟᴜᴍ ʟᴏɢɪɴ ᴋᴇ ɴᴘᴍ*\n\n` +
                `> Login dulu di terminal:\n` +
                `> \`npm login\`\n\n` +
                `> Atau pakai token:\n` +
                `> \`npm set //registry.npmjs.org/:_authToken <token>\``
            )
        }
        
        const hasNodeModules = fs.existsSync(path.join(tempDir, 'node_modules'))
        if (!hasNodeModules && fs.existsSync(path.join(tempDir, 'package.json'))) {
            await m.reply(`📦 *ᴍᴇɴɢɪɴꜱᴛᴀʟʟ ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇꜱ...*`)
            try {
                await execAsync('npm install --production', { cwd: tempDir, timeout: 60000 })
                await m.reply(`✅ *ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇꜱ ɪɴꜱᴛᴀʟʟᴇᴅ*`)
            } catch (e) {
                await m.reply(`⚠️ *ᴅᴇᴘᴇɴᴅᴇɴᴄɪᴇꜱ ɢᴀɢᴀʟ ᴅɪɪɴꜱᴛᴀʟʟ* (lanjut publish)`)
            }
        }
        
        await m.reply(`🚀 *ᴍᴇᴍᴜʟᴀɪ ᴘᴜʙʟɪꜱʜ ᴋᴇ ɴᴘᴍ...*`)
        
        const { stdout, stderr } = await execAsync('npm publish --access public', { 
            cwd: tempDir,
            timeout: 120000 
        })
        
        const output = stdout || stderr
        
        await m.reply(
            `✅ *ɴᴘᴍ ᴘᴜʙʟɪꜱʜ ʙᴇʀʜᴀꜱɪʟ!*\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ 📦 *ɴᴀᴍᴇ*: ${packageName}\n` +
            `┃ 🔢 *ᴠᴇʀꜱɪ*: ${version}\n` +
            `┃ 🌐 *ʟɪɴᴋ*: https://www.npmjs.com/package/${packageName}\n` +
            `┃ 📥 *ɪɴꜱᴛᴀʟʟ*: npm install ${packageName}\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n` +
            `💗 *Zero Two:* Package berhasil dipublish darling~ 🎉`
        )
        
        m.react('✅')
        
    } catch (error) {
        console.error('[NPMPublish] Error:', error)
        m.react('💔')
        
        let errorMsg = error.message
        if (errorMsg.includes('You cannot publish over the previously published versions')) {
            errorMsg = `Versi *${version}* sudah pernah dipublish!\n> Gunakan versi lain.`
        } else if (errorMsg.includes('403')) {
            errorMsg = `Akses ditolak (403)!\n> Pastikan nama package unik.`
        } else if (errorMsg.includes('404')) {
            errorMsg = `Package tidak ditemukan!`
        }
        
        await m.reply(
            `💔 *ɴᴘᴍ ᴘᴜʙʟɪꜱʜ ɢᴀɢᴀʟ*\n\n` +
            `> *Error:* ${errorMsg}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
        
    } finally {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true })
        } catch (e) {}
    }
}

module.exports = {
    config: pluginConfig,
    handler
}