const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'casetoplugin',
    alias: ['c2p', 'case2cjs', 'casekeplugin'],
    category: 'owner',
    description: 'Convert kode case ke plugin CJS (CommonJS)',
    usage: '.casetoplugin <reply kode case>',
    example: '.casetoplugin',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// Deteksi kategori dari kode
function detectCategory(code, pluginName) {
    const lowerCode = (code + ' ' + pluginName).toLowerCase()
    
    if (lowerCode.includes('anime') || lowerCode.includes('manga')) return 'anime'
    if (lowerCode.includes('download') || lowerCode.includes('yt') || lowerCode.includes('tiktok') || lowerCode.includes('ig')) return 'download'
    if (lowerCode.includes('game') || lowerCode.includes('tebak')) return 'game'
    if (lowerCode.includes('ai') || lowerCode.includes('gpt') || lowerCode.includes('gemini')) return 'ai'
    if (lowerCode.includes('group') || lowerCode.includes('gc')) return 'group'
    if (lowerCode.includes('owner') || lowerCode.includes('admin')) return 'owner'
    if (lowerCode.includes('premium')) return 'premium'
    if (lowerCode.includes('sticker')) return 'sticker'
    if (lowerCode.includes('rpg') || lowerCode.includes('exp') || lowerCode.includes('level')) return 'rpg'
    if (lowerCode.includes('nulis') || lowerCode.includes('text') || lowerCode.includes('maker')) return 'maker'
    if (lowerCode.includes('search') || lowerCode.includes('cari')) return 'search'
    if (lowerCode.includes('tools') || lowerCode.includes('convert')) return 'tools'
    
    return 'other'
}

// Extract nama plugin dari kode case
function extractPluginName(code) {
    // Coba ambil dari module.exports
    const exportMatch = code.match(/module\.exports\s*=\s*{\s*(?:config:\s*pluginConfig,\s*)?handler\s*}/)
    if (exportMatch) {
        const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/)
        if (nameMatch) return nameMatch[1]
    }
    
    // Coba ambil dari handler function name
    const handlerMatch = code.match(/async\s+function\s+(\w+)\s*\(/)
    if (handlerMatch && handlerMatch[1] !== 'handler') return handlerMatch[1]
    
    // Coba ambil dari const nama
    const constMatch = code.match(/const\s+(\w+)\s*=\s*async\s*\(/)
    if (constMatch) return constMatch[1]
    
    // Default random
    return 'plugin_' + Math.random().toString(36).substr(2, 6)
}

// Convert case code ke plugin CJS
function convertCaseToPlugin(caseCode, pluginName, category) {
    let result = caseCode.trim()
    
    // Hapus module.exports yang mungkin ada di case
    result = result.replace(/module\.exports\s*=\s*{\s*config:\s*pluginConfig,\s*handler\s*}\s*;?\s*$/, '')
    result = result.replace(/module\.exports\s*=\s*{\s*handler\s*}\s*;?\s*$/, '')
    result = result.replace(/module\.exports\s*=\s*handler\s*;?\s*$/, '')
    
    // Hapus pluginConfig kalo ada (biar gak double)
    result = result.replace(/const\s+pluginConfig\s*=\s*{[^}]*}\s*;?\s*/, '')
    
    // Cek apakah kode sudah punya handler function
    const hasHandlerFunction = result.includes('async function handler') || 
                               result.includes('function handler') ||
                               result.includes('const handler =')
    
    let handlerCode = result
    
    // Kalo belum punya handler, bungkus
    if (!hasHandlerFunction) {
        // Deteksi apakah kode langsung berisi m.reply dll
        if (result.includes('m.reply') || result.includes('sock.send') || result.includes('await')) {
            handlerCode = `async function handler(m, { sock, args, command, prefix, isOwner, isGroup, isPremium, db }) {\n    ${result}\n}`
        }
    }
    
    // Template plugin CJS lengkap
    const pluginTemplate = `// Plugin: ${pluginName}
// Auto-converted from case by NusaBot
// Date: ${new Date().toLocaleString('id-ID')}

const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: '${pluginName}',
    alias: ['${pluginName}'],
    category: '${category}',
    description: 'Plugin from case ${pluginName}',
    usage: '.${pluginName}',
    example: '.${pluginName}',
    isOwner: ${category === 'owner' ? 'true' : 'false'},
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

${handlerCode}

module.exports = { config: pluginConfig, handler }
`
    
    return pluginTemplate
}

async function handler(m, { sock }) {
    let caseCode = null
    
    // Ambil kode dari reply
    if (m.quoted) {
        if (m.quoted.text) {
            caseCode = m.quoted.text.trim()
        } else if (m.quoted.message?.conversation) {
            caseCode = m.quoted.message.conversation.trim()
        } else if (m.quoted.message?.extendedTextMessage?.text) {
            caseCode = m.quoted.message.extendedTextMessage.text.trim()
        }
    }
    
    // Kalo gaada reply, cek dari command langsung (format: .casetoplugin\nkode)
    if (!caseCode && m.text) {
        const parts = m.text.split('\n')
        const firstLine = parts[0] || ''
        if (firstLine.includes('.casetoplugin') && parts.length > 1) {
            caseCode = parts.slice(1).join('\n').trim()
        }
    }
    
    if (!caseCode) {
        return m.reply(
            `🔄 *ᴄᴀꜱᴇ ᴛᴏ ᴘʟᴜɢɪɴ ᴄᴊꜱ ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `> Convert kode case ke plugin CJS siap pakai\n\n` +
            `> *Cara pakai:*\n` +
            `> Reply kode case dengan ${m.prefix}casetoplugin\n\n` +
            `> *Contoh case:*\n` +
            `> \`async function zerotwo(m) {\`\n` +
            `> \`    await m.reply('Halo darling~')\`\n` +
            `> \`}\`\n` +
            `> \`module.exports = { zerotwo }\`\n\n` +
            `> *Hasil:* Plugin siap di folder plugins/\n` +
            `> Langsung aktif tanpa restart!`
        )
    }
    
    // Validasi kode minimal panjang
    if (caseCode.length < 30) {
        return m.reply(`❌ *Kode case terlalu pendek!*\n\nPastikan kode case yang di-reply valid.`)
    }
    
    await m.react('🔄')
    
    try {
        // Extract nama plugin
        let pluginName = extractPluginName(caseCode)
        
        // Validasi nama plugin
        if (!/^[a-zA-Z0-9_]+$/.test(pluginName)) {
            pluginName = 'plugin_' + Date.now()
        }
        
        // Deteksi kategori
        const category = detectCategory(caseCode, pluginName)
        
        // Convert ke plugin CJS
        const pluginCode = convertCaseToPlugin(caseCode, pluginName, category)
        
        // Tentukan folder penyimpanan
        const pluginsDir = path.join(process.cwd(), 'plugins', category)
        if (!fs.existsSync(pluginsDir)) {
            fs.mkdirSync(pluginsDir, { recursive: true })
        }
        
        const pluginPath = path.join(pluginsDir, `${pluginName}.js`)
        
        // Backup kalo file udah ada
        let backupMsg = ''
        if (fs.existsSync(pluginPath)) {
            const backupPath = path.join(pluginsDir, `${pluginName}.backup.${Date.now()}.js`)
            fs.copyFileSync(pluginPath, backupPath)
            backupMsg = `\n💾 Backup: ${pluginName}.backup.${Date.now()}.js`
        }
        
        // Tulis file plugin
        fs.writeFileSync(pluginPath, pluginCode, 'utf-8')
        
        // Hot reload
        try {
            const reload = hotReloadPlugin(pluginPath)
            if (reload && reload.success === false) {
                console.log('[CaseToPlugin] Reload warning:', reload.error)
            }
        } catch (reloadErr) {
            console.log('[CaseToPlugin] Reload error:', reloadErr.message)
        }
        
        const lines = pluginCode.split('\n').length
        const size = (Buffer.byteLength(pluginCode, 'utf-8') / 1024).toFixed(2)
        
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴄᴏᴍᴍᴏɴᴊꜱ ᴘʟᴜɢɪɴ*\n\n` +
                  `📁 *Info Plugin:*\n` +
                  `├ 📛 Nama: ${pluginName}.js\n` +
                  `├ 📂 Folder: plugins/${category}/\n` +
                  `├ 📏 Baris: ${lines}\n` +
                  `├ 💾 Ukuran: ${size} KB\n` +
                  `└ 🔄 Status: Active ✓${backupMsg}\n\n` +
                  `📌 *Cara pakai:*\n` +
                  `└ .${pluginName}\n\n` +
                  `💕 *Zero Two:* Case berhasil di-convert darling~ Sekarang bisa langsung pake command .${pluginName}`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        // Kirim kode plugin juga biar bisa dilihat
        await sock.sendMessage(m.chat, {
            text: `📄 *Hasil Convert:*\n\n\`\`\`javascript\n${pluginCode.substring(0, 3900)}${pluginCode.length > 3900 ? '\n\n... (kode dipotong, simpan di file)' : ''}\n\`\`\``
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (error) {
        console.error('[CaseToPlugin] Error:', error)
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ ᴄᴏɴᴠᴇʀᴛ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}