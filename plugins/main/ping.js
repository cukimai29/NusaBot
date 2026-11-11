const { createCanvas } = require('@napi-rs/canvas')
const { performance } = require('perf_hooks')
const os = require('os')
const { execSync } = require('child_process')
const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const THEME = {
    bg: '#0a050f',
    bgCard: '#1a0b1a', 
    primary: '#ff2a6d',     // Zero Two signature red/pink
    secondary: '#ff69b4',   // pink cerah
    tertiary: '#a855f7',    // ungu
    success: '#10b981',     // hijau neon
    warning: '#fbbf24',     // kuning
    danger: '#ef4444',      // merah
    cyan: '#06b6d4',        // cyan
    textPrimary: '#ffffff', 
    textSecondary: '#c084fc', 
    border: '#ff2a6d', 
}

const pluginConfig = {
    name: 'ping',
    alias: ['speed', 'p', 'latency', 'sys', 'status'],
    category: 'main',
    description: 'Cek kecepatan respon bot dengan dashboard lengkap',
    usage: '.ping',
    example: '.ping',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

const formatTime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

/** Draw love/heart symbol instead of star */
function drawLove(ctx, cx, cy, size, color, alpha = 1, blur = 0) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    if (blur > 0) { ctx.shadowColor = color; ctx.shadowBlur = blur }
    ctx.beginPath()
    const s = size
    ctx.moveTo(cx, cy - s * 0.8)
    ctx.bezierCurveTo(cx - s, cy - s * 0.8, cx - s, cy + s * 0.4, cx, cy + s)
    ctx.bezierCurveTo(cx + s, cy + s * 0.4, cx + s, cy - s * 0.8, cx, cy - s * 0.8)
    ctx.fill()
    ctx.restore()
}

/** Scatter decorative loves on background */
function drawLoveField(ctx, W, H) {
    const loves = [
        [40, 25, 6, 0.9, THEME.primary],
        [W - 40, 25, 5, 0.8, THEME.secondary],
        [W / 2, 15, 4, 0.7, THEME.tertiary],
        [70, H - 25, 6, 0.8, THEME.primary],
        [W - 70, H - 25, 7, 0.9, THEME.secondary],
        [W - 20, H / 2, 3, 0.5, THEME.tertiary],
        [15, H / 2, 4, 0.6, THEME.primary],
        [W * 0.75, 18, 3, 0.6, THEME.secondary],
        [W * 0.25, H - 18, 3, 0.6, THEME.tertiary],
    ]
    loves.forEach(([cx, cy, r, a, col]) => drawLove(ctx, cx, cy, r, col, a, r * 2))

    ctx.save()
    const dots = [[200, 12, 2], [W - 200, 12, 1.5], [100, H - 12, 1.5], [W - 100, H - 12, 2]]
    dots.forEach(([x, y, r]) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = THEME.textPrimary; ctx.globalAlpha = 0.35
        ctx.shadowColor = THEME.primary; ctx.shadowBlur = 6
        ctx.fill()
    })
    ctx.restore()
}

/**
 * Glowing arc gauge — NO emoji, uses plain text icon
 */
function drawGlowCircle(ctx, x, y, radius, percent, color, label, valueText, iconText) {
    ctx.save()

    ctx.beginPath()
    ctx.arc(x, y, radius + 10, 0, Math.PI * 2)
    ctx.fillStyle = `${color}12`
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `${THEME.border}cc`
    ctx.lineWidth = 9
    ctx.stroke()

    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (Math.PI * 2 * Math.min(percent, 100) / 100)
    ctx.beginPath()
    ctx.arc(x, y, radius, startAngle, endAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 22
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = color
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fillText(iconText, x, y - 10)
    ctx.shadowBlur = 0

    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 13px Arial'
    ctx.fillText(valueText, x, y + 12)

    ctx.fillStyle = THEME.textSecondary
    ctx.font = '9px Arial'
    ctx.fillText(label, x, y + radius + 20)

    ctx.restore()
}

/** Glassmorphism card with top-left corner accent */
function drawCard(ctx, x, y, w, h, color) {
    ctx.save()
    roundRect(ctx, x, y, w, h, 13)
    const grad = ctx.createLinearGradient(x, y, x + w, y + h)
    grad.addColorStop(0, `${color}1a`)
    grad.addColorStop(1, `${color}05`)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `${color}55`
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x, y + 14)
    ctx.lineTo(x, y + 3)
    ctx.quadraticCurveTo(x, y, x + 3, y)
    ctx.lineTo(x + 28, y)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.restore()
}

/** Card header — plain text, no emoji */
function drawCardHeader(ctx, x, y, text, color) {
    ctx.save()
    ctx.fillStyle = color
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillText(text, x, y)
    ctx.shadowBlur = 0
    ctx.restore()
}

function drawStatRow(ctx, x, y, label, value, color, maxWidth = 200) {
    ctx.save()
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y)

    ctx.fillStyle = color || THEME.textPrimary
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'right'
    let displayVal = String(value)
    if (ctx.measureText(displayVal).width > maxWidth * 0.55) displayVal = displayVal.substring(0, 18) + '..'
    ctx.fillText(displayVal, x + maxWidth, y)
    ctx.restore()
}

function drawMiniBar(ctx, x, y, w, h, percent, color) {
    roundRect(ctx, x, y, w, h, h / 2)
    ctx.fillStyle = `${THEME.border}aa`
    ctx.fill()
    if (percent > 0) {
        const fillW = Math.max(h, w * Math.min(percent, 100) / 100)
        ctx.save()
        roundRect(ctx, x, y, fillW, h, h / 2)
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
    }
}

async function renderDashboard(stats) {
    const W = 900
    const H = 580
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0a050f')
    bgGrad.addColorStop(0.45, '#1a0b2e')
    bgGrad.addColorStop(1, '#0a050f')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    const glow1 = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, 420)
    glow1.addColorStop(0, `${THEME.secondary}20`)
    glow1.addColorStop(1, 'transparent')
    ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H)

    const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.85, 0, W * 0.1, H * 0.85, 380)
    glow2.addColorStop(0, `${THEME.primary}18`)
    glow2.addColorStop(1, 'transparent')
    ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H)

    ctx.globalAlpha = 0.022
    ctx.strokeStyle = THEME.primary; ctx.lineWidth = 0.5
    for (let i = 0; i < H; i += 28) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
    }
    ctx.globalAlpha = 1

    drawLoveField(ctx, W, H)

    drawLove(ctx, 28, 40, 12, THEME.primary, 1, 20)

    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 18
    ctx.fillText('NUSABOT SYSTEM', 52, 36)
    ctx.shadowBlur = 0

    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'italic 11px Arial'
    ctx.shadowColor = THEME.secondary; ctx.shadowBlur = 6
    ctx.fillText(`♡ ${config.bot?.name || 'NusaBot'} — Real-time Monitoring ♡`, 52, 58)
    ctx.shadowBlur = 0

    const pingColor = stats.ping < 100 ? THEME.success : stats.ping < 300 ? THEME.warning : THEME.danger
    const pingStatus = stats.ping < 100 ? '♡ EXCELLENT ♡' : stats.ping < 300 ? '◆ GOOD ◆' : '◇ SLOW ◇'

    ctx.save()
    roundRect(ctx, W - 148, 16, 120, 54, 13)
    ctx.fillStyle = `${pingColor}20`; ctx.fill()
    ctx.strokeStyle = `${pingColor}80`; ctx.lineWidth = 1.5; ctx.stroke()

    ctx.fillStyle = pingColor
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.shadowColor = pingColor; ctx.shadowBlur = 14
    ctx.fillText(`${stats.ping}ms`, W - 88, 36)
    ctx.shadowBlur = 0
    ctx.fillStyle = THEME.textSecondary; ctx.font = '9px Arial'
    ctx.fillText(pingStatus, W - 88, 56)
    ctx.restore()

    const sepGrad = ctx.createLinearGradient(30, 80, W - 30, 80)
    sepGrad.addColorStop(0, 'transparent')
    sepGrad.addColorStop(0.3, THEME.primary)
    sepGrad.addColorStop(0.5, THEME.tertiary)
    sepGrad.addColorStop(0.7, THEME.secondary)
    sepGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = sepGrad; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(30, 80); ctx.lineTo(W - 30, 80); ctx.stroke()
    drawLove(ctx, W / 2, 80, 6, THEME.tertiary, 1, 12)

    const gaugeY = 155
    const ramPercent = (stats.ramUsed / stats.ramTotal) * 100
    const diskPercent = stats.diskTotal > 0 ? (stats.diskUsed / stats.diskTotal) * 100 : 0

    drawGlowCircle(ctx, 85, gaugeY, 46, parseFloat(stats.cpuLoad), THEME.primary,    'CPU LOAD', `${stats.cpuLoad}%`,  'CPU')
    drawGlowCircle(ctx, 210, gaugeY, 46, ramPercent,                THEME.success,   'MEMORY',   `${ramPercent.toFixed(0)}%`, 'RAM')
    drawGlowCircle(ctx, 335, gaugeY, 46, diskPercent,               THEME.secondary, 'STORAGE',  `${diskPercent.toFixed(0)}%`, 'DISK')

    drawCard(ctx, 405, 100, 220, 115, THEME.primary)
    drawCardHeader(ctx, 420, 112, '[ NETWORK ]', THEME.primary)

    ctx.fillStyle = THEME.primary; ctx.font = 'bold 15px Arial'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`▼  ${formatSize(stats.networkRx)}`, 420, 136)
    ctx.fillStyle = THEME.secondary
    ctx.fillText(`▲  ${formatSize(stats.networkTx)}`, 420, 158)
    drawStatRow(ctx, 420, 188, 'Interface', stats.networkInterface, THEME.textSecondary, 195)
    drawStatRow(ctx, 420, 204, 'Status', stats.ping < 100 ? 'Online ♡' : stats.ping < 300 ? 'Stable' : 'Lag', pingColor, 195)

    drawCard(ctx, 645, 100, 225, 115, THEME.success)
    drawCardHeader(ctx, 660, 112, '[ UPTIME ]', THEME.success)

    ctx.fillStyle = THEME.success; ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.shadowColor = THEME.success; ctx.shadowBlur = 14
    ctx.fillText(stats.uptimeBot, 660, 140)
    ctx.shadowBlur = 0
    ctx.fillStyle = THEME.textSecondary; ctx.font = '10px Arial'
    ctx.fillText('Bot Runtime', 660, 170)
    ctx.fillText(`Server: ${stats.uptimeServer}`, 660, 187)

    const cardY = 232
    const cardH = 162
    const cardW = 272
    const gap   = 14

    drawCard(ctx, 28, cardY, cardW, cardH, THEME.secondary)
    drawCardHeader(ctx, 44, cardY + 12, '[ SERVER INFO ]', THEME.secondary)
    let rowY = cardY + 38; const rowGap = 20
    drawStatRow(ctx, 44, rowY,           'Hostname',    stats.hostname,                  THEME.textPrimary, 238)
    drawStatRow(ctx, 44, rowY += rowGap, 'Platform',   stats.platform,                  THEME.primary,     238)
    drawStatRow(ctx, 44, rowY += rowGap, 'Architecture', stats.arch,                    THEME.textPrimary, 238)
    drawStatRow(ctx, 44, rowY += rowGap, 'Kernel',     stats.release.substring(0, 18),  THEME.textSecondary, 238)
    drawStatRow(ctx, 44, rowY += rowGap, 'Node.js',    stats.nodeVersion,               THEME.success,     238)
    drawStatRow(ctx, 44, rowY += rowGap, 'V8 Engine',  stats.v8Version,                 THEME.secondary,   238)

    const cpuCardX = 28 + cardW + gap
    drawCard(ctx, cpuCardX, cardY, cardW, cardH, THEME.primary)
    drawCardHeader(ctx, cpuCardX + 16, cardY + 12, '[ CPU DETAILS ]', THEME.primary)
    rowY = cardY + 38
    drawStatRow(ctx, cpuCardX + 16, rowY,           'Model',    stats.cpuModel.substring(0, 20), THEME.textPrimary, 238)
    drawStatRow(ctx, cpuCardX + 16, rowY += rowGap, 'Cores',   `${stats.cpuCores} cores ♡`,        THEME.primary,     238)
    drawStatRow(ctx, cpuCardX + 16, rowY += rowGap, 'Speed',   `${stats.cpuSpeed} MHz`,          THEME.textPrimary, 238)
    drawStatRow(ctx, cpuCardX + 16, rowY += rowGap, 'Load Avg', stats.loadAvg,                   THEME.warning,     238)
    drawStatRow(ctx, cpuCardX + 16, rowY += rowGap, 'Usage',   `${stats.cpuLoad}%`,
        parseFloat(stats.cpuLoad) > 80 ? THEME.danger : THEME.success, 238)
    rowY += rowGap + 4
    drawMiniBar(ctx, cpuCardX + 16, rowY, 238, 6, parseFloat(stats.cpuLoad),
        parseFloat(stats.cpuLoad) > 80 ? THEME.danger : THEME.primary)

    const memCardX = 28 + (cardW + gap) * 2
    drawCard(ctx, memCardX, cardY, cardW, cardH, THEME.tertiary)
    drawCardHeader(ctx, memCardX + 16, cardY + 12, '[ MEMORY DETAILS ]', THEME.tertiary)
    rowY = cardY + 38
    drawStatRow(ctx, memCardX + 16, rowY,           'Total RAM', formatSize(stats.ramTotal),             THEME.textPrimary, 238)
    drawStatRow(ctx, memCardX + 16, rowY += rowGap, 'Used',      formatSize(stats.ramUsed),              THEME.warning,     238)
    drawStatRow(ctx, memCardX + 16, rowY += rowGap, 'Free',      formatSize(stats.ramTotal - stats.ramUsed), THEME.success, 238)
    drawStatRow(ctx, memCardX + 16, rowY += rowGap, 'Heap Used', stats.heapUsed,                        THEME.primary,     238)
    drawStatRow(ctx, memCardX + 16, rowY += rowGap, 'RSS',       stats.rss,                             THEME.secondary,   238)
    rowY += rowGap + 4
    drawMiniBar(ctx, memCardX + 16, rowY, 238, 6, ramPercent,
        ramPercent > 80 ? THEME.danger : THEME.success)

    const bottomY   = 412
    const bottomH   = 118
    const bottomW   = 422

    drawCard(ctx, 28, bottomY, bottomW, bottomH, THEME.warning)
    drawCardHeader(ctx, 44, bottomY + 12, '[ PROCESS INFO ]', THEME.warning)
    rowY = bottomY + 38
    const col1X = 44; const col2X = 240; const colW = 172
    drawStatRow(ctx, col1X, rowY,           'PID',      `#${stats.pid}`,         THEME.warning,      colW)
    drawStatRow(ctx, col2X, rowY,           'UID',      stats.uid,               THEME.textSecondary, colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'CWD',     stats.cwd.substring(0,15), THEME.textSecondary, colW)
    drawStatRow(ctx, col2X, rowY,           'Exec',    stats.execPath,           THEME.primary,       colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'External', stats.external,          THEME.textSecondary, colW)
    drawStatRow(ctx, col2X, rowY,           'Buffers', stats.arrayBuffers,       THEME.textSecondary, colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'Handles', stats.activeHandles,      THEME.success,       colW)
    drawStatRow(ctx, col2X, rowY,           'Requests', stats.activeRequests,    THEME.primary,       colW)

    const storCardX = 28 + bottomW + gap
    drawCard(ctx, storCardX, bottomY, bottomW, bottomH, THEME.success)
    drawCardHeader(ctx, storCardX + 16, bottomY + 12, '[ STORAGE & ENV ]', THEME.success)
    rowY = bottomY + 38
    drawStatRow(ctx, storCardX + 16, rowY,           'Total Disk', formatSize(stats.diskTotal),            THEME.textPrimary, 385)
    drawStatRow(ctx, storCardX + 16, rowY += rowGap, 'Used',       formatSize(stats.diskUsed),             THEME.warning,     385)
    drawStatRow(ctx, storCardX + 16, rowY += rowGap, 'Free',       formatSize(stats.diskTotal - stats.diskUsed), THEME.success, 385)
    drawStatRow(ctx, storCardX + 16, rowY += rowGap, 'Environment', stats.nodeEnv || 'production',         THEME.primary,     385)
    
    const footerGrad = ctx.createLinearGradient(0, H - 30, W, H)
    footerGrad.addColorStop(0, `${THEME.primary}18`)
    footerGrad.addColorStop(0.5, `${THEME.secondary}14`)
    footerGrad.addColorStop(1, `${THEME.primary}18`)
    ctx.fillStyle = footerGrad; ctx.fillRect(0, H - 30, W, 30)

    ctx.strokeStyle = `${THEME.primary}40`; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke()

    drawLove(ctx, 55, H - 15, 4, THEME.primary, 0.8, 8)
    drawLove(ctx, W - 55, H - 15, 4, THEME.secondary, 0.8, 8)

    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'italic 10px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`♡ Generated at ${require('moment-timezone')().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB ♡`, W / 2, H - 15)

    return canvas.toBuffer('image/png')
}

function getNetworkStats() {
    try {
        const interfaces = os.networkInterfaces()
        let activeInterface = 'N/A'
        for (const [name, addrs] of Object.entries(interfaces)) {
            if (name.toLowerCase().includes('lo')) continue
            for (const addr of addrs) {
                if (addr.family === 'IPv4' && !addr.internal) { activeInterface = name; break }
            }
        }
        let totalRx = 0, totalTx = 0
        try {
            if (process.platform === 'linux') {
                const netDev = require('fs').readFileSync('/proc/net/dev', 'utf8')
                for (const line of netDev.split('\n')) {
                    if (line.includes(':') && !line.includes('lo:')) {
                        const parts = line.trim().split(/\s+/)
                        if (parts.length >= 10) {
                            const ifName = parts[0].replace(':', '')
                            const rx = parseInt(parts[1]) || 0
                            const tx = parseInt(parts[9]) || 0
                            if (ifName === activeInterface || (activeInterface === 'N/A' && rx > 0)) {
                                totalRx = rx; totalTx = tx
                                if (activeInterface === 'N/A') activeInterface = ifName
                                break
                            }
                        }
                    }
                }
            } else if (process.platform === 'win32') {
                const netstat = execSync('netstat -e', { encoding: 'utf-8' })
                for (const line of netstat.split('\n')) {
                    if (line.toLowerCase().includes('bytes')) {
                        const parts = line.trim().split(/\s+/)
                        if (parts.length >= 3) { totalRx = parseInt(parts[1]) || 0; totalTx = parseInt(parts[2]) || 0 }
                        break
                    }
                }
                if (activeInterface === 'N/A') {
                    const f = Object.keys(interfaces).find(n => !n.toLowerCase().includes('loopback'))
                    if (f) activeInterface = f
                }
            }
        } catch {}
        return { totalRx, totalTx, activeInterface }
    } catch {
        return { totalRx: 0, totalTx: 0, activeInterface: 'N/A' }
    }
}

async function handler(m, { sock }) {
    const startTime = Date.now()
    // React ala Zero Two pakai love/heart
    await m.react('💕')

    try {
        const msgTimestamp = m.messageTimestamp ? (m.messageTimestamp * 1000) : startTime
        const latency = Math.max(1, Date.now() - msgTimestamp)

        const cpus = os.cpus()
        const totalMem = os.totalmem()
        const freeMem = os.freemem()

        let cpuPercent = 0
        try {
            const cpuInfo = cpus.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                acc.total += total; acc.idle += cpu.times.idle; return acc
            }, { total: 0, idle: 0 })
            await new Promise(resolve => setTimeout(resolve, 500))
            const cpus2 = os.cpus()
            const cpuInfo2 = cpus2.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                acc.total += total; acc.idle += cpu.times.idle; return acc
            }, { total: 0, idle: 0 })
            const totalDiff = cpuInfo2.total - cpuInfo.total
            const idleDiff  = cpuInfo2.idle  - cpuInfo.idle
            if (totalDiff > 0) {
                cpuPercent = ((totalDiff - idleDiff) / totalDiff * 100).toFixed(1)
            } else {
                cpuPercent = Math.min(100, (os.loadavg()[0] / cpus.length * 100)).toFixed(1)
            }
            if (parseFloat(cpuPercent) <= 0)
                cpuPercent = Math.max(1, Math.min(100, (os.loadavg()[0] / cpus.length * 100))).toFixed(1)
        } catch {
            cpuPercent = Math.max(1, Math.min(100, (os.loadavg()[0] / cpus.length * 100))).toFixed(1)
        }

        let diskTotal = 0, diskUsed = 0
        try {
            if (process.platform === 'win32') {
                const wmic = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:value', { encoding: 'utf-8' })
                const freeMatch = wmic.match(/FreeSpace=(\d+)/)
                const sizeMatch = wmic.match(/Size=(\d+)/)
                if (sizeMatch && freeMatch) {
                    diskTotal = parseInt(sizeMatch[1])
                    diskUsed  = diskTotal - parseInt(freeMatch[1])
                }
            } else {
                const df = execSync('df -k --output=size,used / 2>/dev/null').toString()
                const lines = df.trim().split('\n')
                if (lines.length > 1) {
                    const parts = lines[1].trim().split(/\s+/).map(Number)
                    if (parts.length >= 2) { diskTotal = parts[0] * 1024; diskUsed = parts[1] * 1024 }
                }
            }
        } catch {
            diskTotal = 500 * 1024 * 1024 * 1024
            diskUsed  = 250 * 1024 * 1024 * 1024
        }

        const networkStats = getNetworkStats()
        const heap = process.memoryUsage()
        const loadAvgArr = os.loadavg()

        const stats = {
            ping: latency,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            nodeVersion: process.version,
            v8Version: process.versions.v8,
            uptimeBot: formatTime(process.uptime()),
            uptimeServer: formatTime(os.uptime()),
            cpuModel: cpus[0]?.model?.trim() || 'Unknown',
            cpuSpeed: cpus[0]?.speed || 0,
            cpuCores: cpus.length,
            cpuLoad: cpuPercent,
            loadAvg: loadAvgArr.map(l => l.toFixed(2)).join(', '),
            ramTotal: totalMem,
            ramUsed: totalMem - freeMem,
            diskTotal,
            diskUsed,
            networkRx: networkStats.totalRx,
            networkTx: networkStats.totalTx,
            networkInterface: networkStats.activeInterface,
            heapUsed: formatSize(heap.heapUsed),
            heapTotal: formatSize(heap.heapTotal),
            rss: formatSize(heap.rss),
            external: formatSize(heap.external),
            arrayBuffers: formatSize(heap.arrayBuffers || 0),
            pid: process.pid,
            uid: process.getuid?.() ?? 'N/A',
            cwd: process.cwd(),
            execPath: process.argv[0].split(/[/\\]/).pop(),
            nodeEnv: process.env.NODE_ENV || 'development',
            activeHandles: process._getActiveHandles?.()?.length ?? 'N/A',
            activeRequests: process._getActiveRequests?.()?.length ?? 'N/A'
        }

        const imageBuffer = await renderDashboard(stats)

        const saluranId   = config.saluran?.id   || 'https://whatsapp.com/channel/0029VbCTsJBBqbrEzlfRbL0o'
        const saluranName = config.saluran?.name  || config.bot?.name || 'NusaBot'

        const ramPercent  = ((stats.ramUsed / stats.ramTotal) * 100).toFixed(1)
        const diskPercent = stats.diskTotal > 0 ? ((stats.diskUsed / stats.diskTotal) * 100).toFixed(1) : 0
        const pingStatus  = latency < 100 ? '💕 Excellent' : latency < 300 ? '💗 Good' : '❌ Poor'
        const osName = { linux: '🐧 Linux', darwin: '🍎 macOS', win32: '🪟 Windows', android: '🤖 Android' }[stats.platform] || `📦 ${stats.platform}`

        let dbUsers = 0, dbGroups = 0
        try {
            const db = getDatabase()
            if (db && db.data) {
                dbUsers  = Object.keys(db.data.users  || {}).length
                dbGroups = Object.keys(db.data.groups || {}).length
            }
        } catch (e) {}

        const caption =
            `💕 *NUSABOT SYSTEM* 💕\n\n` +
            `╭┈┈♡「 🏓 *RESPONSE* 」\n` +
            `┃ ◦ Latency: *${latency}ms* ${pingStatus}\n` +
            `┃ ◦ Status: *Online ♡*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 🖥️ *SERVER* 」\n` +
            `┃ ◦ Hostname: *${stats.hostname}*\n` +
            `┃ ◦ OS: *${osName}*\n` +
            `┃ ◦ Arch: *${stats.arch}*\n` +
            `┃ ◦ Kernel: *${stats.release}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 💻 *CPU* 」\n` +
            `┃ ◦ Model: *${stats.cpuModel.substring(0, 30)}*\n` +
            `┃ ◦ Cores: *${stats.cpuCores} cores @ ${stats.cpuSpeed} MHz*\n` +
            `┃ ◦ Load: *${stats.cpuLoad}%*\n` +
            `┃ ◦ Load Avg: *${stats.loadAvg}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 🧠 *MEMORY* 」\n` +
            `┃ ◦ Total: *${formatSize(stats.ramTotal)}*\n` +
            `┃ ◦ Used: *${formatSize(stats.ramUsed)}* (${ramPercent}%)\n` +
            `┃ ◦ Free: *${formatSize(stats.ramTotal - stats.ramUsed)}*\n` +
            `┃ ◦ Heap: *${stats.heapUsed}/${stats.heapTotal}*\n` +
            `┃ ◦ RSS: *${stats.rss}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 💾 *STORAGE* 」\n` +
            `┃ ◦ Total: *${formatSize(stats.diskTotal)}*\n` +
            `┃ ◦ Used: *${formatSize(stats.diskUsed)}* (${diskPercent}%)\n` +
            `┃ ◦ Free: *${formatSize(stats.diskTotal - stats.diskUsed)}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 📊 *PROCESS* 」\n` +
            `┃ ◦ PID: *${stats.pid}*\n` +
            `┃ ◦ Node.js: *${stats.nodeVersion}*\n` +
            `┃ ◦ V8: *${stats.v8Version}*\n` +
            `┃ ◦ External: *${stats.external}*\n` +
            `┃ ◦ Handles: *${stats.activeHandles}*\n` +
            `┃ ◦ Requests: *${stats.activeRequests}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 🌐 *NETWORK* 」\n` +
            `┃ ◦ Interface: *${stats.networkInterface}*\n` +
            `┃ ◦ Download: *${formatSize(stats.networkRx)}*\n` +
            `┃ ◦ Upload: *${formatSize(stats.networkTx)}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 🗄️ *DATABASE* 」\n` +
            `┃ ◦ Total Users: *${dbUsers}*\n` +
            `┃ ◦ Total Groups: *${dbGroups}*\n` +
            `╰┈┈♡\n\n` +
            `╭┈┈♡「 ⏱️ *UPTIME* 」\n` +
            `┃ ◦ Bot: *${stats.uptimeBot}*\n` +
            `┃ ◦ Server: *${stats.uptimeServer}*\n` +
            `╰┈┈♡\n\n` +
            `♡ *Zero Two:* Ayo darling, pingnya ${latency}ms ~ ${latency < 100 ? 'Kenceng banget! 💕' : latency < 300 ? 'Masih oke kok~ 💗' : 'Wah agak lambat nih, cek koneksi ya darling~ 💔'}* ♡\n\n` +
            `> *♡ NusaBot | Anime Trailer ♡*`

        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption,
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

        await m.react('💕')

    } catch (error) {
        await m.react('💔')
        await m.reply(`❌ *Error Darling!*\n\n> ${error.message}\n\nCoba lagi ya~ ♡`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}