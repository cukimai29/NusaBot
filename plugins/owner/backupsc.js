const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const moment = require('moment-timezone')

const pluginConfig = {
    name: 'backupsc',
    alias: ['backup', 'backupscript', 'backupsource'],
    category: 'owner',
    description: 'Backup script penting 💗',
    usage: '.backupsc',
    isOwner: true,
    cooldown: 60,
    isEnabled: true
}

// ✅ folder penting
const INCLUDE_FOLDERS = [
    'assets',
    'case',
    'data',
    'database',
    'plugins',
    'src',
    'storage',
    'store',
    'session',
    'temp'
]

// ✅ file penting root
const INCLUDE_FILES = [
    'config.js',
    'index.js',
    'package.json',
    'package-lock.json',
    'rename.txt',
    '.gitignore'
]

// ❌ folder berat
const EXCLUDE = [
    'node_modules',
    '.npm',
    '.cache'
]

async function handler(m, { sock }) {

    await m.react('⏳')

    await m.reply(
`📦 *BACKUP DIMULAI*

Tunggu sebentar darling 😈`
    )

    try {

        const root = process.cwd()

        const time =
            moment()
            .tz('Asia/Jakarta')
            .format('YYYY-MM-DD_HH-mm-ss')

        const zipName =
            `ZeroTwo_backup_${time}.zip`

        const zipPath =
            path.join(root, zipName)

        const output =
            fs.createWriteStream(zipPath)

        const archive =
            archiver('zip', {
                zlib: {
                    level: 5
                }
            })

        archive.pipe(output)

        // 🔥 backup folder
        for (const folder of INCLUDE_FOLDERS) {

            if (EXCLUDE.includes(folder))
                continue

            const fullPath =
                path.join(root, folder)

            if (fs.existsSync(fullPath)) {

                archive.directory(
                    fullPath,
                    folder
                )
            }
        }

        // 🔥 backup file root
        for (const file of INCLUDE_FILES) {

            const fullPath =
                path.join(root, file)

            if (fs.existsSync(fullPath)) {

                archive.file(
                    fullPath,
                    { name: file }
                )
            }
        }

        // ❌ skip zip lama
        const files =
            fs.readdirSync(root)

        for (const file of files) {

            if (
                file.endsWith('.zip')
            ) continue
        }

        await archive.finalize()

        await new Promise(resolve => {
            output.on('close', resolve)
        })

        const size =
            (
                fs.statSync(zipPath).size
                / 1024 / 1024
            ).toFixed(2)

        await sock.sendMessage(
            m.chat,
            {
                document:
                    fs.readFileSync(zipPath),

                fileName:
                    zipName,

                mimetype:
                    'application/zip',

                caption:
`💗 *ZERO TWO BACKUP* 💗

📦 File :
${zipName}

📊 Size :
${size} MB

📅 Date :
${moment()
.tz('Asia/Jakarta')
.format('DD/MM/YYYY HH:mm:ss')}

✨ Backup selesai darling 😈`
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (e) {

        console.log(e)

        await m.react('❌')

        m.reply(
`❌ *BACKUP ERROR*

${e.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}