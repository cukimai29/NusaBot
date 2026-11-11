const { getAllPlugins } = require('../../src/lib/plugins')
const { createCanvas } = require('@napi-rs/canvas')
const moment = require('moment-timezone')
const config = require('../../config')
const os = require('os')
const { execSync } = require('child_process')

const pluginConfig = {
    name: 'totalfitur2',
    alias: ['totalfeature2', 'totalcmd2', 'stats2', 'dashboard2', 'fiturdashboard'],
    category: 'main',
    description: 'NusaBot Glowing Dashboard - Distribusi fitur bot dengan visual neon ala Ping',
    cooldown: 10,
    isEnabled: true
}

const THEME = {
    bg: '#0a050f',
    bgCard: '#1a0b1a',
    primary: '#ff2a6d',
    secondary: '#ff69b4',
    tertiary: '#a855f7',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#ef4444',
    cyan: '#06b6d4',
    textPrimary: '#ffffff',
    textSecondary: '#c084fc',
    border: '#ff2a6d',
}

const GLOW_COLORS = [
    '#ff2a6d', '#ff69b4', '#a855f7', '#ec4899',
    '#ff1493', '#ff4da6', '#f472b6', '#db2777'
]

const CATEGORY_ICONS = {
    main:'🏠', tools:'🔧', downloader:'📥', download:'📥',
    sticker:'🎨', ai:'🤖', media:'📷', game:'🎮',
    rpg:'⚔️', maker:'🖼️', fun:'🎭', group:'👥',
    owner:'👑', premium:'💎', info:'📊', search:'🔍',
    canvas:'🎨', anime:'🌸', nsfw:'🔞', utility:'🛠️',
    economy:'💰', other:'📦'
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

function formatTime(seconds) {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
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

async function createDashboard(categories, total, enabled, stats) {
    const W = 900
    const H = 650
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
    ctx.fillText('NUSABOT DASHBOARD', 52, 36)
    ctx.shadowBlur = 0

    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'italic 11px Arial'
    ctx.shadowColor = THEME.secondary; ctx.shadowBlur = 6
    ctx.fillText(`♡ ${config.bot?.name || 'NusaBot'} — Fitur Distribution ♡`, 52, 58)
    ctx.shadowBlur = 0

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
    const cpuLoad = stats.cpuLoad || 45
    const enabledPercent = (enabled / total) * 100
    const activePercent = enabledPercent

    drawGlowCircle(ctx, 85, gaugeY, 46, cpuLoad, THEME.primary, 'CPU LOAD', `${cpuLoad}%`, 'CPU')
    drawGlowCircle(ctx, 210, gaugeY, 46, activePercent, THEME.success, 'ACTIVE', `${activePercent.toFixed(0)}%`, '♥')
    drawGlowCircle(ctx, 335, gaugeY, 46, ((total - enabled) / total) * 100, THEME.warning, 'INACTIVE', `${(((total - enabled) / total) * 100).toFixed(0)}%`, '💔')

    drawCard(ctx, 405, 100, 220, 115, THEME.primary)
    drawCardHeader(ctx, 420, 112, '[ STATISTICS ]', THEME.primary)

    ctx.fillStyle = THEME.primary; ctx.font = 'bold 15px Arial'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`📊 TOTAL: ${total}`, 420, 136)
    ctx.fillStyle = THEME.success
    ctx.fillText(`✅ ENABLED: ${enabled}`, 420, 158)
    ctx.fillStyle = THEME.warning
    ctx.fillText(`❌ DISABLED: ${total - enabled}`, 420, 180)
    drawStatRow(ctx, 420, 202, 'Active Rate', `${activePercent.toFixed(1)}%`, THEME.success, 195)

    drawCard(ctx, 645, 100, 225, 115, THEME.success)
    drawCardHeader(ctx, 660, 112, '[ SYSTEM ]', THEME.success)

    ctx.fillStyle = THEME.success; ctx.font = 'bold 15px Arial'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`⏱️ ${stats.uptimeBot}`, 660, 140)
    ctx.fillStyle = THEME.textSecondary; ctx.font = '10px Arial'
    ctx.fillText('Bot Runtime', 660, 170)
    ctx.fillStyle = THEME.primary
    ctx.fillText(`📦 ${stats.pluginsCount} Plugins`, 660, 190)

    const cardY = 232
    const cardH = 162
    const cardW = 272
    const gap = 14

    drawCard(ctx, 28, cardY, cardW, cardH, THEME.secondary)
    drawCardHeader(ctx, 44, cardY + 12, '[ TOP CATEGORIES ]', THEME.secondary)
    let rowY = cardY + 38
    const rowGap = 20

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1])
    sorted.slice(0, 5).forEach(([cat, val], idx) => {
        const pct = ((val / total) * 100).toFixed(0)
        drawStatRow(ctx, 44, rowY + (idx * 22), cat.substring(0, 12), `${val} (${pct}%)`, GLOW_COLORS[idx % GLOW_COLORS.length], 218)
    })

    const cpuCardX = 28 + cardW + gap
    drawCard(ctx, cpuCardX, cardY, cardW, cardH, THEME.primary)
    drawCardHeader(ctx, cpuCardX + 16, cardY + 12, '[ CATEGORY LIST ]', THEME.primary)
    rowY = cardY + 38
    sorted.slice(0, 6).forEach(([cat, val], idx) => {
        const icon = CATEGORY_ICONS[cat] || '📦'
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '9px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`${icon} ${cat.substring(0, 10)}`, cpuCardX + 16, rowY + (idx * 20))
        ctx.fillStyle = GLOW_COLORS[idx % GLOW_COLORS.length]
        ctx.font = 'bold 9px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(`${val}`, cpuCardX + cardW - 16, rowY + (idx * 20))
    })

    const memCardX = 28 + (cardW + gap) * 2
    drawCard(ctx, memCardX, cardY, cardW, cardH, THEME.tertiary)
    drawCardHeader(ctx, memCardX + 16, cardY + 12, '[ PERFORMANCE ]', THEME.tertiary)
    rowY = cardY + 38
    drawStatRow(ctx, memCardX + 16, rowY, 'RAM Used', stats.ramUsed, THEME.warning, 238)
    drawStatRow(ctx, memCardX + 16, rowY + rowGap, 'RAM Total', stats.ramTotal, THEME.textPrimary, 238)
    const ramPercent = stats.ramPercent || 45
    drawMiniBar(ctx, memCardX + 16, rowY + rowGap + 12, 238, 6, ramPercent, ramPercent > 80 ? THEME.danger : THEME.success)
    drawStatRow(ctx, memCardX + 16, rowY + rowGap * 2 + 8, 'Node.js', process.version, THEME.success, 238)
    drawStatRow(ctx, memCardX + 16, rowY + rowGap * 3 + 4, 'Platform', os.platform(), THEME.textSecondary, 238)

    const bottomY = 412
    const bottomH = 118
    const bottomW = 422

    drawCard(ctx, 28, bottomY, bottomW, bottomH, THEME.warning)
    drawCardHeader(ctx, 44, bottomY + 12, '[ FEATURE BREAKDOWN ]', THEME.warning)
    rowY = bottomY + 38
    const col1X = 44
    const col2X = 240
    const colWid = 172

    const pluginCount = stats.pluginsCount || Object.keys(categories).reduce((a, b) => a + categories[b], 0)
    drawStatRow(ctx, col1X, rowY, 'Total Plugins', pluginCount, THEME.warning, colWid)
    drawStatRow(ctx, col2X, rowY, 'Categories', Object.keys(categories).length, THEME.textSecondary, colWid)
    drawStatRow(ctx, col1X, rowY + rowGap, 'Avg per Category', (total / Object.keys(categories).length).toFixed(1), THEME.textSecondary, colWid)
    drawStatRow(ctx, col2X, rowY + rowGap, 'Most Active', sorted[0]?.[0] || '-', THEME.primary, colWid)
    drawStatRow(ctx, col1X, rowY + rowGap * 2, 'Commands', 'Ready', THEME.success, colWid)

    const storCardX = 28 + bottomW + gap
    drawCard(ctx, storCardX, bottomY, bottomW, bottomH, THEME.success)
    drawCardHeader(ctx, storCardX + 16, bottomY + 12, '[ DISTRIBUTION ]', THEME.success)
    rowY = bottomY + 38

    const values = sorted.map(v => v[1])
    const maxVal = Math.max(...values)
    values.slice(0, 4).forEach((val, idx) => {
        const width = (val / maxVal) * 350
        const color = GLOW_COLORS[idx % GLOW_COLORS.length]
        ctx.fillStyle = `${color}30`
        roundRect(ctx, storCardX + 16, rowY + (idx * 18), width, 10, 5)
        ctx.fill()
        ctx.fillStyle = color
        roundRect(ctx, storCardX + 16, rowY + (idx * 18), width, 10, 5)
        ctx.fill()
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '8px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(sorted[idx]?.[0] || '-', storCardX + 16 + width + 5, rowY + (idx * 18) + 8)
    })

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
    ctx.fillText(`♡ Generated at ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB ♡`, W / 2, H - 15)

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const plugins = getAllPlugins()

        let categories = {}
        let total = 0
        let enabled = 0

        for (const p of plugins) {
            if (!p.config) continue
            const cat = p.config.category || 'other'
            categories[cat] = (categories[cat] || 0) + 1
            total++
            if (p.config.isEnabled !== false) enabled++
        }

        const cpus = os.cpus()
        let cpuLoad = 0
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
            const idleDiff = cpuInfo2.idle - cpuInfo.idle
            if (totalDiff > 0) {
                cpuLoad = parseFloat(((totalDiff - idleDiff) / totalDiff * 100).toFixed(1))
            } else {
                cpuLoad = parseFloat((os.loadavg()[0] / cpus.length * 100).toFixed(1))
            }
        } catch {
            cpuLoad = parseFloat((os.loadavg()[0] / cpus.length * 100).toFixed(1))
        }

        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const ramUsed = totalMem - freeMem
        const ramPercent = (ramUsed / totalMem) * 100

        const stats = {
            cpuLoad: cpuLoad,
            ramUsed: formatSize(ramUsed),
            ramTotal: formatSize(totalMem),
            ramPercent: ramPercent,
            uptimeBot: formatTime(process.uptime()),
            pluginsCount: plugins.length
        }

        await m.react('💕')
        await m.reply(`⏳ *ᴘʀᴏᴄᴇꜱꜱɪɴɢ...*\n\n💗 *Zero Two:* Lagi bikin dashboard fitur darling~ tunggu sebentar yaa 🎨`)

        const img = await createDashboard(categories, total, enabled, stats)
        const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1])
        const activePercent = ((enabled / total) * 100).toFixed(1)

        let caption = `💕 *NUSABOT DASHBOARD V2* 💕\n\n`
        caption += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
        caption += `┃ 📊 *ᴛᴏᴛᴀʟ ꜰɪᴛᴜʀ*: ${total}\n`
        caption += `┃ ✅ *ᴀᴋᴛɪꜰ*: ${enabled}\n`
        caption += `┃ ❌ *ɴᴏɴᴀᴋᴛɪꜰ*: ${total - enabled}\n`
        caption += `┃ 📂 *ᴋᴀᴛᴇɢᴏʀɪ*: ${Object.keys(categories).length}\n`
        caption += `┃ 💗 *ᴀᴋᴛɪꜰ ʀᴀᴛᴇ*: ${activePercent}%\n`
        caption += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
        caption += `╭━━━━━━━━━━━━━━━━━━━━━⬣\n`
        caption += `┃ 📂 *ᴛᴏᴘ ᴋᴀᴛᴇɢᴏʀɪ*\n`
        sorted.slice(0, 5).forEach(([cat, val]) => {
            const pct = ((val / total) * 100).toFixed(1)
            const icon = CATEGORY_ICONS[cat] || '📦'
            caption += `┃    ${icon} ${cat}: ${val} (${pct}%)\n`
        })
        caption += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
        caption += `💗 *Zero Two:* Darling, bot ini punya *${total}* fitur siap pakai! ${activePercent}% aktif~ 🦋`

        await sock.sendMessage(m.chat, {
            image: img,
            caption: caption
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('💔')
        await m.reply(`💔 *Error Darling!*\n\n> ${e.message}\n\nCoba lagi ya~ ♡`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}