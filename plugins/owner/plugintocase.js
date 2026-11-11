const config = require('../../config')

const pluginConfig = {
    name: 'plugintocase',
    alias: [ 'p2c', 'pluginkease', 'p2case', 'plugin2case', 'plugintocase' ],
    category: 'owner',
    description: 'Convert plugin CJS ke kode case',
    usage: '.plugintocase <reply plugin>',
    example: '.plugintocase',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// Hapus bagian pluginConfig dari kode plugin
function removePluginConfig(pluginCode) {
    let result = pluginCode
    
    // Hapus const pluginConfig = { ... }
    result = result.replace(/const\s+pluginConfig\s*=\s*\{[^}]*\}\s*;?\s*/s, '')
    
    // Hapus import/require config dan database
    result = result.replace(/const\s+config\s*=\s*require\([^)]+\)\s*;?\s*/, '')
    result = result.replace(/const\s*\{\s*getDatabase\s*\}\s*=\s*require\([^)]+\)\s*;?\s*/, '')
    result = result.replace(/const\s*\{\s*getDatabase\s*\}\s*=\s*require\([^)]+\)\s*;?\s*/, '')
    
    // Hapus module.exports bagian plugin
    result = result.replace(/module\.exports\s*=\s*\{\s*config:\s*pluginConfig,\s*handler\s*\}\s*;?\s*$/, '')
    result = result.replace(/module\.exports\s*=\s*\{\s*handler\s*\}\s*;?\s*$/, '')
    result = result.replace(/module\.exports\s*=\s*handler\s*;?\s*$/, '')
    
    // Hapus baris kosong berlebih
    result = result.replace(/\n{3,}/g, '\n\n')
    
    return result.trim()
}

// Ekstrak nama dari pluginConfig
function extractPluginName(pluginCode) {
    const match = pluginCode.match(/name:\s*['"`]([^'"`]+)['"`]/)
    if (match) return match[1]
    
    // Coba ambil dari alias
    const aliasMatch = pluginCode.match(/alias:\s*\[\s*['"`]([^'"`]+)['"`]/)
    if (aliasMatch) return aliasMatch[1]
    
    // Coba ambil dari handler function
    const handlerMatch = pluginCode.match(/async\s+function\s+(\w+)\s*\(/)
    if (handlerMatch && handlerMatch[1] !== 'handler') return handlerMatch[1]
    
    return 'unknown_plugin'
}

// Cek apakah plugin sudah punya handler
function hasValidHandler(pluginCode) {
    return pluginCode.includes('async function handler') || 
           pluginCode.includes('function handler') ||
           pluginCode.includes('const handler =')
}

// Extract handler code (ambil isi handler function)
function extractHandlerCode(pluginCode) {
    // Coba ambil async function handler
    let match = pluginCode.match(/async\s+function\s+handler\s*\([^)]*\)\s*\{[\s\S]*?\n\}/)
    if (match) return match[0]
    
    // Coba ambil function handler
    match = pluginCode.match(/function\s+handler\s*\([^)]*\)\s*\{[\s\S]*?\n\}/)
    if (match) return match[0]
    
    // Coba ambil const handler
    match = pluginCode.match(/const\s+handler\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[\s\S]*?\n\}/)
    if (match) return match[0]
    
    return pluginCode
}

// Convert plugin ke case
function convertPluginToCase(pluginCode, pluginName) {
    let result = pluginCode
    
    // Hapus pluginConfig
    result = removePluginConfig(result)
    
    // Pastikan ada handler
    if (!hasValidHandler(result)) {
        throw new Error('Plugin tidak memiliki handler function yang valid')
    }
    
    // Ambil handler code aja
    result = extractHandlerCode(result)
    
    // Bersihin
    result = result.trim()
    
    // Format case (tanpa module.exports biar bisa langsung di-reply)
    const caseCode = `${result}

module.exports = { ${pluginName} }`
    
    return caseCode
}

async function handler(m, { sock }) {
    let pluginCode = null
    let pluginName = null
    
    // Ambil kode dari reply
    if (m.quoted) {
        if (m.quoted.text) {
            pluginCode = m.quoted.text.trim()
        } else if (m.quoted.message?.conversation) {
            pluginCode = m.quoted.message.conversation.trim()
        } else if (m.quoted.message?.extendedTextMessage?.text) {
            pluginCode = m.quoted.message.extendedTextMessage.text.trim()
        }
    }
    
    // Kalo gaada reply, cek dari command langsung
    if (!pluginCode && m.text) {
        const parts = m.text.split('\n')
        const firstLine = parts[0] || ''
        if (firstLine.includes('.plugintocase') && parts.length > 1) {
            pluginCode = parts.slice(1).join('\n').trim()
        }
    }
    
    if (!pluginCode) {
        return m.reply(
            `🔄 *ᴘʟᴜɢɪɴ ᴛᴏ ᴄᴀꜱᴇ ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `> Convert plugin CJS ke kode case\n\n` +
            `> *Cara pakai:*\n` +
            `> Reply kode plugin dengan ${m.prefix}plugintocase\n\n` +
            `> *Contoh plugin:*\n` +
            `> \`const pluginConfig = {\`\n` +
            `> \`    name: 'zerotwo',\`\n` +
            `> \`    alias: ['zt'],\`\n` +
            `> \`    category: 'main',\`\n` +
            `> \`}\`\n` +
            `> \`async function handler(m) {\`\n` +
            `> \`    await m.reply('Halo darling~')\`\n` +
            `> \`}\`\n` +
            `> \`module.exports = { config: pluginConfig, handler }\`\n\n` +
            `> *Hasil:* Kode case siap pakai`
        )
    }
    
    // Validasi kode minimal panjang
    if (pluginCode.length < 50) {
        return m.reply(`❌ *Kode plugin terlalu pendek!*\n\nPastikan kode plugin yang di-reply valid.`)
    }
    
    // Validasi apakah ini kode plugin (ada pluginConfig atau handler)
    if (!pluginCode.includes('pluginConfig') && !pluginCode.includes('handler')) {
        return m.reply(`❌ *Bukan kode plugin yang valid!*\n\nPastikan kode mengandung pluginConfig atau handler.`)
    }
    
    await m.react('🔄')
    
    try {
        // Ekstrak nama plugin
        pluginName = extractPluginName(pluginCode)
        
        // Validasi nama
        if (!/^[a-zA-Z0-9_]+$/.test(pluginName)) {
            pluginName = 'converted_plugin'
        }
        
        // Convert ke case
        const caseCode = convertPluginToCase(pluginCode, pluginName)
        
        // Hitung statistik
        const originalLines = pluginCode.split('\n').length
        const caseLines = caseCode.split('\n').length
        const size = (Buffer.byteLength(caseCode, 'utf-8') / 1024).toFixed(2)
        
        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
        
        // Kirim hasil convert
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴘʟᴜɢɪɴ → ᴄᴀꜱᴇ ᴄᴏɴᴠᴇʀᴛᴇᴅ*\n\n` +
                  `📊 *Statistik:*\n` +
                  `├ 📛 Nama: ${pluginName}\n` +
                  `├ 📏 Original: ${originalLines} lines\n` +
                  `├ 📏 Case: ${caseLines} lines\n` +
                  `└ 💾 Ukuran: ${size} KB\n\n` +
                  `📄 *Hasil Convert:*\n` +
                  `\`\`\`javascript\n${caseCode}\n\`\`\``,
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
        
        await m.react('✅')
        
    } catch (error) {
        console.error('[PluginToCase] Error:', error)
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ ᴄᴏɴᴠᴇʀᴛ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}