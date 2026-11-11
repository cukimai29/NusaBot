const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { getAllPlugins } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'aisearch',
    alias: ['scanplugin', 'cekplugin', 'perbaikplugin', 'diagnosa'],
    category: 'owner',
    description: '🔍 Diagnosa plugin LANUX AI – deteksi error & solusi real-time!',
    usage: '.aisearch',
    example: '.aisearch',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

const DATA_DIR = path.join(process.cwd(), 'data')
const SCAN_FILE = path.join(DATA_DIR, 'aisearch_scan.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

function loadScan() {
    try {
        if (fs.existsSync(SCAN_FILE)) {
            return JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'))
        }
    } catch (_) {}
    return { lastScan: null, issues: [] }
}

function saveScan(data) {
    fs.writeFileSync(SCAN_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function getWIBTime() {
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    return wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getWIBDate() {
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    return wib.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 5) return '🌙 Malam'
    if (hour < 12) return '🌅 Pagi'
    if (hour < 15) return '☀️ Siang'
    if (hour < 18) return '🌤️ Sore'
    return '🌙 Malam'
}

function getProgressBar(pct, len = 30) {
    const filled = Math.round((pct / 100) * len)
    const empty = len - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

function getStatusEmoji(pct) {
    if (pct < 20) return '🔍'
    if (pct < 40) return '⚙️'
    if (pct < 60) return '🧬'
    if (pct < 80) return '🚀'
    return '✨'
}

function getStatusText(pct) {
    if (pct < 20) return 'Memindai plugin...'
    if (pct < 40) return 'Menganalisis kode sumber...'
    if (pct < 60) return 'Mendeteksi error & warning...'
    if (pct < 80) return 'Menyusun laporan diagnosa...'
    return 'Diagnosa selesai!'
}

function diagnosePlugin(plugin, index, total) {
    const issues = []
    const name = plugin.config?.name || `plugin_${index}`
    const category = plugin.config?.category || 'unknown'

    if (!plugin.config) {
        issues.push({
            severity: 'critical',
            type: 'Config Hilang',
            message: 'Plugin tidak memiliki config!',
            solution: 'Buat object pluginConfig di file plugin',
            impact: 'Plugin tidak akan terdaftar'
        })
        return { name, category, issues, status: 'critical' }
    }

    if (!plugin.config.name) {
        issues.push({
            severity: 'critical',
            type: 'Nama Plugin Hilang',
            message: 'Plugin tidak memiliki nama!',
            solution: 'Tambahkan name: "nama_plugin" di config',
            impact: 'Plugin tidak bisa dipanggil'
        })
    }

    if (typeof plugin.handler !== 'function') {
        issues.push({
            severity: 'critical',
            type: 'Handler Error',
            message: 'Handler bukan fungsi atau tidak ditemukan!',
            solution: 'Pastikan handler adalah async function handler(m, { sock })',
            impact: 'Plugin tidak bisa dijalankan'
        })
    }

    if (plugin.config.isEnabled === false) {
        issues.push({
            severity: 'warning',
            type: 'Plugin Dinonaktifkan',
            message: 'Plugin dalam keadaan nonaktif (isEnabled: false)',
            solution: 'Set isEnabled: true di config atau aktifkan via command',
            impact: 'Plugin tidak bisa digunakan user'
        })
    }

    if (plugin.config.alias && !Array.isArray(plugin.config.alias)) {
        issues.push({
            severity: 'error',
            type: 'Alias Invalid',
            message: 'Alias bukan array!',
            solution: 'Ubah alias menjadi array: alias: ["nama1", "nama2"]',
            impact: 'Alias tidak akan berfungsi'
        })
    }

    if (!plugin.config.category) {
        issues.push({
            severity: 'warning',
            type: 'Kategori Hilang',
            message: 'Plugin tidak memiliki kategori!',
            solution: 'Tambahkan category: "main" di config',
            impact: 'Plugin tidak masuk daftar kategori menu'
        })
    }

    if (!plugin.config.description) {
        issues.push({
            severity: 'info',
            type: 'Deskripsi Hilang',
            message: 'Plugin tidak memiliki deskripsi!',
            solution: 'Tambahkan description di config',
            impact: 'User tidak tahu fungsi plugin'
        })
    }

    if (plugin.config.cooldown && plugin.config.cooldown > 300) {
        issues.push({
            severity: 'info',
            type: 'Cooldown Tinggi',
            message: `Cooldown terlalu tinggi (${plugin.config.cooldown}s)`,
            solution: `Turunkan cooldown ke 5-30 detik`,
            impact: 'User harus menunggu lama'
        })
    }

    try {
        const handlerStr = plugin.handler.toString()
        if (handlerStr.includes('import ') && !handlerStr.includes('from')) {
            issues.push({
                severity: 'error',
                type: 'Sintaks Import',
                message: 'Kemungkinan error sintaks import!',
                solution: 'Perbaiki sintaks import/export di plugin',
                impact: 'Plugin error saat di-load'
            })
        }
        if (!handlerStr.includes('export')) {
            issues.push({
                severity: 'warning',
                type: 'Export Hilang',
                message: 'Plugin tidak mengekspor handler/config!',
                solution: 'Tambahkan export { pluginConfig as config, handler }',
                impact: 'Plugin tidak terdeteksi'
            })
        }
    } catch (_) {
        issues.push({
            severity: 'error',
            type: 'Handler Corrupt',
            message: 'Handler tidak dapat diakses!',
            solution: 'Periksa sintaks & struktur handler',
            impact: 'Plugin error total'
        })
    }

    if (plugin.path && !fs.existsSync(plugin.path)) {
        issues.push({
            severity: 'error',
            type: 'File Hilang',
            message: 'File plugin tidak ditemukan di path!',
            solution: `Periksa path: ${plugin.path}`,
            impact: 'Plugin tidak bisa di-load'
        })
    }

    let status = 'healthy'
    if (issues.some(i => i.severity === 'critical')) status = 'critical'
    else if (issues.some(i => i.severity === 'error')) status = 'error'
    else if (issues.some(i => i.severity === 'warning')) status = 'warning'
    else if (issues.some(i => i.severity === 'info')) status = 'info'

    return { name, category, issues, status }
}

async function handler(m, { sock }) {
    try {
        await m.react('🔍')

        const userName = m.pushName || 'Darling'
        const greet = getGreeting()
        const time = getWIBTime()
        const date = getWIBDate()

        let allPlugins = []
        try {
            allPlugins = getAllPlugins()
        } catch (_) {
            const pluginsDir = path.join(process.cwd(), 'plugins')
            if (fs.existsSync(pluginsDir)) {
                const walk = (dir) => {
                    let results = []
                    try {
                        const list = fs.readdirSync(dir)
                        for (const file of list) {
                            const fullPath = path.join(dir, file)
                            const stat = fs.statSync(fullPath)
                            if (stat && stat.isDirectory()) {
                                results = results.concat(walk(fullPath))
                            } else if (file.endsWith('.js')) {
                                results.push({ config: { name: path.basename(file, '.js'), category: 'main', isEnabled: true }, handler: () => {}, path: fullPath })
                            }
                        }
                    } catch (_) {}
                    return results
                }
                allPlugins = walk(pluginsDir)
            }
        }

        const initialMsg =
`🔍 *AI SEARCH – DIAGNOSA PLUGIN* 🔍

⏳ *Memindai ${allPlugins.length} plugin...*
📊 *Progress:* [${getProgressBar(0)}] 0%
${getStatusEmoji(0)} ${getStatusText(0)}`

        const firstMsg = await sock.sendMessage(m.chat, { text: initialMsg }, { quoted: m })

        for (let pct = 5; pct <= 100; pct += 5) {
            await new Promise(r => setTimeout(r, 800 + Math.random() * 300))
            const bar = getProgressBar(pct)
            const emoji = getStatusEmoji(pct)
            const status = getStatusText(pct)
            const msg =
`🔍 *AI SEARCH – DIAGNOSA PLUGIN* 🔍

⏳ *Memindai ${allPlugins.length} plugin...*
📊 *Progress:* [${bar}] ${pct}%
${emoji} ${status}`

            await sock.sendMessage(m.chat, { text: msg, edit: firstMsg.key })
        }

        const results = []
        let totalCritical = 0, totalError = 0, totalWarning = 0, totalInfo = 0, totalHealthy = 0

        for (let i = 0; i < allPlugins.length; i++) {
            const result = diagnosePlugin(allPlugins[i], i, allPlugins.length)
            results.push(result)
            if (result.status === 'critical') totalCritical++
            else if (result.status === 'error') totalError++
            else if (result.status === 'warning') totalWarning++
            else if (result.status === 'info') totalInfo++
            else totalHealthy++
        }

        const allIssues = results.flatMap(r => r.issues.map(i => ({ ...i, plugin: r.name, category: r.category })))
        saveScan({ lastScan: new Date().toISOString(), issues: allIssues })

        let msg = `🔍 *AI SEARCH – DIAGNOSA PLUGIN* 🔍\n\n`
        msg += `💕 *${greet}, ${userName}~!* 💕\n`
        msg += `🕐 ${time} WIB · 📅 ${date}\n\n`

        msg += `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`
        msg += `┃ 📊 *STATISTIK DIAGNOSA*\n`
        msg += `┃ ─────────────────────\n`
        msg += `┃ 📦 Total Plugin : ${allPlugins.length}\n`
        msg += `┃ ✅ Sehat        : ${totalHealthy}\n`
        msg += `┃ ℹ️ Info         : ${totalInfo}\n`
        msg += `┃ ⚠️ Warning     : ${totalWarning}\n`
        msg += `┃ ❌ Error       : ${totalError}\n`
        msg += `┃ 🚨 Critical    : ${totalCritical}\n`
        msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`

        const criticalIssues = allIssues.filter(i => i.severity === 'critical')
        const errorIssues = allIssues.filter(i => i.severity === 'error')
        const warningIssues = allIssues.filter(i => i.severity === 'warning')
        const infoIssues = allIssues.filter(i => i.severity === 'info')

        if (criticalIssues.length > 0) {
            msg += `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`
            msg += `┃ 🚨 *CRITICAL (${criticalIssues.length})*\n`
            msg += `┃ ─────────────────────\n`
            for (const issue of criticalIssues.slice(0, 5)) {
                msg += `┃ 📌 *${issue.plugin}*\n`
                msg += `┃    📂 ${issue.category}\n`
                msg += `┃    🔥 ${issue.type}\n`
                msg += `┃    📝 ${issue.message}\n`
                msg += `┃    💡 ${issue.solution}\n`
                msg += `┃    ⚡ Dampak: ${issue.impact}\n`
                msg += `┃    ─────────────────────\n`
            }
            if (criticalIssues.length > 5) {
                msg += `┃ ... dan ${criticalIssues.length - 5} critical lainnya\n`
            }
            msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`
        }

        if (errorIssues.length > 0) {
            msg += `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`
            msg += `┃ ❌ *ERROR (${errorIssues.length})*\n`
            msg += `┃ ─────────────────────\n`
            for (const issue of errorIssues.slice(0, 5)) {
                msg += `┃ 📌 *${issue.plugin}*\n`
                msg += `┃    📂 ${issue.category}\n`
                msg += `┃    🔥 ${issue.type}\n`
                msg += `┃    📝 ${issue.message}\n`
                msg += `┃    💡 ${issue.solution}\n`
                msg += `┃    ⚡ Dampak: ${issue.impact}\n`
                msg += `┃    ─────────────────────\n`
            }
            if (errorIssues.length > 5) {
                msg += `┃ ... dan ${errorIssues.length - 5} error lainnya\n`
            }
            msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`
        }

        if (warningIssues.length > 0) {
            msg += `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`
            msg += `┃ ⚠️ *WARNING (${warningIssues.length})*\n`
            msg += `┃ ─────────────────────\n`
            for (const issue of warningIssues.slice(0, 5)) {
                msg += `┃ ⚠️ *${issue.plugin}*\n`
                msg += `┃    📂 ${issue.category}\n`
                msg += `┃    🔥 ${issue.type}\n`
                msg += `┃    📝 ${issue.message}\n`
                msg += `┃    💡 ${issue.solution}\n`
                msg += `┃    ─────────────────────\n`
            }
            if (warningIssues.length > 5) {
                msg += `┃ ... dan ${warningIssues.length - 5} warning lainnya\n`
            }
            msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`
        }

        if (infoIssues.length > 0) {
            msg += `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`
            msg += `┃ ℹ️ *INFO (${infoIssues.length})*\n`
            msg += `┃ ─────────────────────\n`
            for (const issue of infoIssues.slice(0, 5)) {
                msg += `┃ ℹ️ *${issue.plugin}*\n`
                msg += `┃    📝 ${issue.message}\n`
                msg += `┃    💡 ${issue.solution}\n`
                msg += `┃    ─────────────────────\n`
            }
            if (infoIssues.length > 5) {
                msg += `┃ ... dan ${infoIssues.length - 5} info lainnya\n`
            }
            msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`
        }

        if (allIssues.length === 0) {
            msg += `🎉 *SEMUA PLUGIN DALAM KEADAAN SEHAT!*\n\n`
        }

        msg += `💡 *REKOMENDASI PERBAIKAN:*\n`
        if (criticalIssues.length > 0) {
            msg += `  🚨 Perbaiki plugin CRITICAL terlebih dahulu!\n`
        }
        if (errorIssues.length > 0) {
            msg += `  ❌ Perbaiki plugin ERROR agar bisa berfungsi\n`
        }
        if (warningIssues.length > 0) {
            msg += `  ⚠️ Perhatikan plugin dengan WARNING\n`
        }
        if (allIssues.length === 0) {
            msg += `  ✅ Semua plugin sehat! Tidak perlu perbaikan.\n`
        }
        msg += `  🔄 Jalankan .aisearch lagi setelah perbaikan\n`

        msg += `\n💞 *LANUX AI* – Diagnosa selesai! 💕`
        msg += `\n✨ *Scan terakhir: ${new Date().toLocaleString('id-ID')}* ✨`

        await sock.sendMessage(m.chat, { text: msg, edit: firstMsg.key })
        await m.react('💕')

    } catch (error) {
        console.error('[AISearch Error]', error)
        await m.react('❌')
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> "He~ ada yang salah nih darling~ 🗿"\n\n` +
            `📝 *Error:* ${error.message}\n\n` +
            `💬 Coba lagi nanti ya~ 🌸`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}