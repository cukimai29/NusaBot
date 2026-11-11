const fs = require('fs')
const path = require('path')
const config = require('../../config')
const { fileTypeFromBuffer } = require('file-type')

const pluginConfig = {
    name: 'ambilcode',
    alias: ['extractcode', 'getcodefile', 'sourcefile'],
    category: 'tools',
    description: 'Ambil kode dari file yang dikirim ke WhatsApp',
    usage: '.ambilcode (reply file)',
    example: '.ambilcode',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

const SUPPORTED_EXTENSIONS = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.ps1': 'powershell',
    '.txt': 'text',
    '.md': 'markdown',
    '.kt': 'kotlin',
    '.dart': 'dart',
    '.lua': 'lua',
    '.pl': 'perl',
    '.r': 'r',
    '.swift': 'swift',
    '.vb': 'vb',
    '.vbs': 'vbscript',
    '.bat': 'batch',
    '.cmd': 'batch',
    '.dockerfile': 'dockerfile',
    '.tf': 'terraform',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.jsx': 'jsx',
    '.tsx': 'tsx'
}

const TEXT_EXTENSIONS = Object.keys(SUPPORTED_EXTENSIONS)

function extractFileName(quoted, quotedMsg) {
    return (
        quotedMsg?.fileName ||
        quotedMsg?.filename ||
        quoted?.fileName ||
        quoted?.filename ||
        quoted?.message?.documentMessage?.fileName ||
        quoted?.msg?.fileName ||
        ''
    )
}

function extractMimeType(quoted, quotedMsg) {
    return (
        quotedMsg?.mimetype ||
        quotedMsg?.mimeType ||
        quoted?.mimetype ||
        quoted?.message?.documentMessage?.mimetype ||
        ''
    )
}

async function handler(m, { sock }) {
    const quoted = m.quoted

    if (!quoted) {
        return m.reply(
`📂 *ᴇxᴛʀᴀᴄᴛ ᴄᴏᴅᴇ*

Kirim atau reply file kode (.js, .py, .java, dll)

📌 *Format:*
> ${m.prefix}ambilcode (reply file)

📌 *Contoh:*
> ${m.prefix}ambilcode (reply file test.js)`
        )
    }

    const quotedMsg = quoted.msg || quoted.message?.documentMessage || quoted.message || quoted

    const mimeType = extractMimeType(quoted, quotedMsg)
    const fileName = extractFileName(quoted, quotedMsg)

    const isDocument = !!(
        quoted.type === 'documentMessage' ||
        quoted.mtype === 'documentMessage' ||
        quotedMsg.documentMessage ||
        mimeType.includes('document') ||
        mimeType.includes('application')
    )

    const isCodeFile = !!(fileName && TEXT_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext)))

    if (!isDocument && !isCodeFile && !mimeType.includes('text') && !mimeType.includes('application')) {
        return m.reply(`❌ *Bukan file kode!*\n\nReply file .js / .py / .java / dll`)
    }

    if (!fileName) {
        return m.reply(`❌ *Nama file tidak terdeteksi!*\n\nPastikan file dikirim sebagai dokumen (bukan sticker/gambar), lalu reply dengan ${m.prefix}ambilcode.`)
    }

    const ext = path.extname(fileName).toLowerCase()
    const isSupported = !!SUPPORTED_EXTENSIONS[ext]

    if (!isSupported) {
        return m.reply(
`❌ *Format file tidak didukung!*

📁 *${fileName}*

Ekstensi yang didukung:
${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`
        )
    }

    const lang = SUPPORTED_EXTENSIONS[ext] || 'text'

    await m.react('⏳')
    await m.reply(`📥 *Mengambil kode dari:* ${fileName}`)

    try {
        const fileBuffer = await quoted.download()
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('Gagal mendownload file')
        }

        const fileType = await fileTypeFromBuffer(fileBuffer)
        const isTextFile = fileType?.mime?.includes('text') || fileType?.mime?.includes('application/json') || !fileType

        let code
        try {
            code = fileBuffer.toString('utf-8')
        } catch {
            throw new Error('File tidak bisa dibaca sebagai teks')
        }

        const isBinary = /[\x00-\x08\x0E-\x1F]/.test(code.slice(0, 1000))
        if (isBinary && !isTextFile) {
            return m.reply(`❌ *File ini adalah binary!*\n\nHanya file teks yang bisa diekstrak.`)
        }

        const lineCount = code.split('\n').length
        const charCount = code.length
        const sizeKB = (fileBuffer.length / 1024).toFixed(2)

        if (charCount > 10000) {
            const tempDir = path.join(process.cwd(), 'temp')
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

            const tempFile = path.join(tempDir, `code_${Date.now()}${ext}`)
            fs.writeFileSync(tempFile, code)

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(tempFile),
                mimetype: 'text/plain',
                fileName: fileName,
                caption: `📁 *${fileName}*
📊 ${lineCount} baris • ${sizeKB} KB
🔤 ${charCount} karakter
📌 ${ext} → ${lang}

> Karena code terlalu panjang, dikirim sebagai file.`
            }, { quoted: m })

            fs.unlinkSync(tempFile)
            await m.react('✅')
            return
        }

        let caption = `╭━━━〔 📁 *${fileName}* 〕━━━⬣
│
│ 📊 *Info:*
│ ┃ • Ekstensi: ${ext}
│ ┃ • Bahasa: ${lang}
│ ┃ • Baris: ${lineCount}
│ ┃ • Ukuran: ${sizeKB} KB
│ ┃ • Karakter: ${charCount}
│
╰━━━━━━━━━━━━━━━━⬣

\`\`\`${lang}
${code}
\`\`\``

        if (caption.length > 4096) {
            const maxLen = 4000 - `\`\`\`${lang}\n\`\`\``.length
            const truncated = code.slice(0, maxLen)
            caption = `╭━━━〔 📁 *${fileName}* 〕━━━⬣
│
│ 📊 *Info:*
│ ┃ • Ekstensi: ${ext}
│ ┃ • Bahasa: ${lang}
│ ┃ • Baris: ${lineCount}
│ ┃ • Ukuran: ${sizeKB} KB
│ ┃ • Karakter: ${charCount}
│
│ ⚠️ *Code dipotong!*
│ ┃ (${charCount} karakter, hanya tampil ${maxLen})
│
╰━━━━━━━━━━━━━━━━⬣

\`\`\`${lang}
${truncated}
\`\`\`

> 📄 Gunakan ${m.prefix}ambilcode lagi untuk full code`
        }

        await sock.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.saluran?.id || '120363402057133599@newsletter',
                    newsletterName: config.saluran?.name || config.bot?.name || 'NusaBot',
                    serverMessageId: 127
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (err) {
        await m.react('❌')
        console.error('[AMBILCODE Error]', err)
        await m.reply(
`❌ *Gagal mengambil kode!*

> ${err.message}

Coba kirim ulang file atau pastikan file tidak corrupt.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}