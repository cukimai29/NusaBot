const { getAllPlugins } = require('../../src/lib/plugins')
const { createCanvas, loadImage: canvasLoadImage } = require('@napi-rs/canvas') // 🔥 RENAME IMPORT
const { loadImage: loadAssetImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER ASSET
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin', 'distribusi', 'stats', 'ttf'],
    category: 'main',
    description: 'Lihat total fitur/command bot dengan chart premium',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

// 🩸 ZERO TWO THEME - Dominan Merah, Pink, Hitam 🩸
const THEME = {
    bg: '#0a0005',
    bgCard: '#1a0510',
    primary: '#ff1a6b',
    primaryLight: '#ff5c9e',
    primaryDark: '#cc0044',
    secondary: '#ff0040',
    secondaryLight: '#ff4466',
    tertiary: '#ffb3c6',
    tertiaryDim: '#ff99b3',
    accent: '#ff1a6b',
    cyan: '#ff3366',
    green: '#ff1a6b',
    textPrimary: '#fff0f5',
    textSecondary: '#ffb3c6',
    textDim: '#995577',
    border: '#331122',
    borderBright: '#661133',
    colors: [
        '#ff1a6b', '#ff0040', '#ff5c9e', '#ff3366',
        '#cc0044', '#ff6699', '#ff0040', '#ff1a6b',
        '#ffb3c6', '#ff99b3'
    ]
}

const CATEGORY_ICONS = {
    main: '🏠', tools: '🔧', downloader: '📥', download: '📥',
    sticker: '🎨', ai: '🤖', media: '📷', game: '🎮',
    rpg: '⚔️', maker: '🖼️', fun: '🎭', group: '👥',
    owner: '👑', premium: '💎', info: '📊', search: '🔍',
    canvas: '🎨', anime: '🌸', nsfw: '🔞', utility: '🛠️',
    economy: '💰', religi: '☪️', other: '📦', clan: '🏰'
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

function drawHorns(ctx, cx, cy, size, color, alpha = 1) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.moveTo(cx - size * 1.5, cy - size * 0.5)
    ctx.quadraticCurveTo(cx - size * 0.8, cy - size * 1.2, cx - size * 0.3, cy - size * 0.2)
    ctx.quadraticCurveTo(cx - size, cy - size * 0.3, cx - size * 1.5, cy - size * 0.5)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx + size * 1.5, cy - size * 0.5)
    ctx.quadraticCurveTo(cx + size * 0.8, cy - size * 1.2, cx + size * 0.3, cy - size * 0.2)
    ctx.quadraticCurveTo(cx + size, cy - size * 0.3, cx + size * 1.5, cy - size * 0.5)
    ctx.fill()
    ctx.restore()
}

function drawStar(ctx, cx, cy, outerR, innerR, color, alpha = 1, blur = 0) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    if (blur > 0) { ctx.shadowColor = color; ctx.shadowBlur = blur }
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

function drawSparkle(ctx, cx, cy, r, color, alpha = 1, blur = 0) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    if (blur > 0) { ctx.shadowColor = color; ctx.shadowBlur = blur }
    ctx.beginPath()
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx + r * 0.25, cy)
    ctx.lineTo(cx, cy + r)
    ctx.lineTo(cx - r * 0.25, cy)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - r, cy)
    ctx.lineTo(cx, cy + r * 0.25)
    ctx.lineTo(cx + r, cy)
    ctx.lineTo(cx, cy - r * 0.25)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

function drawGlowDot(ctx, x, y, r, color, alpha = 1) {
    ctx.save()
    ctx.globalAlpha = alpha
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
    g.addColorStop(0, color)
    g.addColorStop(0.3, `${color}80`)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r * 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}

function drawBackground(ctx, W, H) {
    ctx.fillStyle = THEME.bg
    ctx.fillRect(0, 0, W, H)
    const nebulas = [
        { x: 0,   y: 0,   r: 600, c: `${THEME.primary}15` },
        { x: W,   y: H,   r: 650, c: `${THEME.secondary}12` },
        { x: W/2, y: H/2, r: 400, c: `${THEME.primaryDark}0a` },
        { x: 100, y: H-100, r: 350, c: `${THEME.primary}10` },
        { x: W-80, y: 80,   r: 300, c: `${THEME.secondary}0c` },
    ]
    nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.c)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
    })
    ctx.save()
    for (let y = 0; y < H; y += 4) {
        ctx.globalAlpha = 0.015
        ctx.strokeStyle = THEME.primary
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }
    for (let x = 0; x < W; x += 60) {
        ctx.globalAlpha = 0.01
        ctx.strokeStyle = THEME.secondary
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    ctx.restore()
}

function drawStarField(ctx, W, H) {
    const bigStars = [
        [58,  32,  12, 5,  THEME.tertiary, 1.0, 24],
        [W-55, 38,  9,  4,  THEME.primary,  0.9, 18],
        [W-120,H-30, 11, 4.5, THEME.tertiary, 0.9, 20],
        [80,  H-40, 8,  3,  THEME.primaryLight, 0.8, 14],
        [W/2+10,H-38,10, 4,  THEME.secondary, 0.7, 16],
    ]
    bigStars.forEach(([cx, cy, r, ir, c, a, bl]) => drawStar(ctx, cx, cy, r, ir, c, a, bl))
    const sparkles = [
        [W-200, 25,  9, THEME.tertiary,  0.85, 16],
        [220,   H-38,7, THEME.primary,   0.8,  12],
        [W-300, H-45,6, THEME.secondaryLight, 0.7, 10],
        [420,   18,  8, THEME.tertiary,  0.75, 14],
        [680,   H-30,7, THEME.primaryDark, 0.65, 10],
    ]
    sparkles.forEach(([cx, cy, r, c, a, bl]) => drawSparkle(ctx, cx, cy, r, c, a, bl))
    const dots = [
        [170, 70,  2.5, THEME.primary,  0.5],
        [750, 100, 2,   THEME.tertiary, 0.6],
        [95,  430, 2,   THEME.primaryDark, 0.4],
        [840, 460, 2.5, THEME.primary,  0.5],
        [390, H-12,2,   THEME.secondary, 0.55],
        [600, 22,  1.8, THEME.accent,   0.45],
        [W-30, 200, 2,  THEME.tertiary, 0.4],
        [30,  300, 1.5, THEME.primary,  0.35],
    ]
    dots.forEach(([x, y, r, c, a]) => drawGlowDot(ctx, x, y, r, c, a))
}

function drawGlassCard(ctx, x, y, w, h, r, borderColor, fillAlpha = 0.07) {
    roundRect(ctx, x, y, w, h, r)
    const cfill = ctx.createLinearGradient(x, y, x, y + h)
    cfill.addColorStop(0, `rgba(255,50,100,${fillAlpha})`)
    cfill.addColorStop(1, `rgba(200,30,80,${fillAlpha * 0.4})`)
    ctx.fillStyle = cfill
    ctx.fill()
    roundRect(ctx, x, y, w, h, r)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x + r, y + 1)
    ctx.lineTo(x + w - r, y + 1)
    ctx.strokeStyle = `rgba(255,100,150,0.12)`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
}

function drawHeader(ctx, W, totalCommands, enabledCommands, categoriesCount) {
    ctx.save()
    roundRect(ctx, 50, 14, 340, 38, 10)
    const hbg = ctx.createLinearGradient(50, 14, 390, 52)
    hbg.addColorStop(0, `${THEME.primary}22`)
    hbg.addColorStop(1, `${THEME.secondary}18`)
    ctx.fillStyle = hbg
    ctx.fill()
    ctx.strokeStyle = `${THEME.primary}55`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
    drawHorns(ctx, 78, 34, 12, THEME.primaryDark, 0.8)
    drawStar(ctx, 68, 34, 13, 5.5, THEME.tertiary, 1, 22)
    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const titleGrad = ctx.createLinearGradient(88, 0, 380, 0)
    titleGrad.addColorStop(0, THEME.primaryLight)
    titleGrad.addColorStop(0.5, THEME.textPrimary)
    titleGrad.addColorStop(1, THEME.secondaryLight)
    ctx.fillStyle = titleGrad
    ctx.font = 'bold 26px Arial'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 22
    ctx.fillText('DISTRIBUSI FITUR', 88, 31)
    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'italic 10.5px Arial'
    ctx.shadowColor = THEME.secondary
    ctx.shadowBlur = 8
    ctx.fillText(`🩸 ${config.bot?.name || 'NusaBot'} — Command Statistics 🩸`, 88, 52)
    ctx.restore()
    const stats = [
        { label: 'TOTAL CMD',  value: totalCommands,    icon: '🩸', color: THEME.primary },
        { label: 'AKTIF',      value: enabledCommands,  icon: '💕', color: THEME.green },
        { label: 'KATEGORI',   value: categoriesCount,  icon: '🦋', color: THEME.secondary },
    ]
    const bw = 116, bh = 56, bx0 = W - 378
    stats.forEach((s, i) => {
        const bx = bx0 + i * (bw + 10)
        const by = 12
        drawGlassCard(ctx, bx, by, bw, bh, 14, `${s.color}60`, 0.09)
        ctx.save()
        ctx.beginPath()
        ctx.arc(bx + 22, by + bh / 2, 12, 0, Math.PI * 2)
        const cg = ctx.createRadialGradient(bx+22, by+bh/2, 0, bx+22, by+bh/2, 12)
        cg.addColorStop(0, `${s.color}50`)
        cg.addColorStop(1, 'transparent')
        ctx.fillStyle = cg
        ctx.fill()
        ctx.restore()
        ctx.save()
        ctx.fillStyle = s.color
        ctx.font = '13px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = s.color
        ctx.shadowBlur = 12
        ctx.fillText(s.icon, bx + 22, by + bh / 2 - 4)
        ctx.restore()
        ctx.save()
        ctx.fillStyle = s.color
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = s.color
        ctx.shadowBlur = 18
        ctx.fillText(s.value.toString(), bx + bw / 2 + 8, by + bh / 2 - 4)
        ctx.shadowBlur = 0
        ctx.fillStyle = THEME.textDim
        ctx.font = 'bold 8.5px Arial'
        ctx.fillText(s.label, bx + bw / 2 + 8, by + bh - 11)
        ctx.restore()
    })
}

function drawSeparator(ctx, W, y) {
    const g = ctx.createLinearGradient(30, y, W - 30, y)
    g.addColorStop(0,   'transparent')
    g.addColorStop(0.15, THEME.secondary)
    g.addColorStop(0.4,  THEME.primary)
    g.addColorStop(0.5,  THEME.tertiary)
    g.addColorStop(0.6,  THEME.primary)
    g.addColorStop(0.85, THEME.secondary)
    g.addColorStop(1,   'transparent')
    ctx.strokeStyle = g
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke()
    drawSparkle(ctx, W / 2 - 14, y, 5, THEME.primary, 0.7, 8)
    drawStar(ctx, W / 2, y, 8, 3.5, THEME.tertiary, 1, 14)
    drawSparkle(ctx, W / 2 + 14, y, 5, THEME.primary, 0.7, 8)
}

function drawDonut(ctx, topCategories, totalCommands, cx, cy, R, holeR) {
    ctx.save()
    const halo = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R + 40)
    halo.addColorStop(0, `${THEME.primary}15`)
    halo.addColorStop(0.5, `${THEME.secondary}0c`)
    halo.addColorStop(1, 'transparent')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(cx, cy, R + 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R + 5, 0, Math.PI * 2)
    ctx.strokeStyle = `${THEME.border}80`
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    let angle = -Math.PI / 2
    topCategories.forEach(([, data], i) => {
        const span = (data.total / totalCommands) * Math.PI * 2
        const color = THEME.colors[i % THEME.colors.length]
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, angle, angle + span)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 22
        ctx.fill()
        ctx.restore()
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, angle, angle + span)
        ctx.closePath()
        ctx.strokeStyle = `${THEME.bg}cc`
        ctx.lineWidth = 2.5
        ctx.stroke()
        if (i < 5 && span > 0.15) {
            const midAngle = angle + span / 2
            const tx1 = cx + (R + 2)  * Math.cos(midAngle)
            const ty1 = cy + (R + 2)  * Math.sin(midAngle)
            const tx2 = cx + (R + 12) * Math.cos(midAngle)
            const ty2 = cy + (R + 12) * Math.sin(midAngle)
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(tx1, ty1)
            ctx.lineTo(tx2, ty2)
            ctx.strokeStyle = color
            ctx.lineWidth = 1.5
            ctx.shadowColor = color
            ctx.shadowBlur = 6
            ctx.stroke()
            ctx.restore()
        }
        angle += span
    })
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    const holeFill = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR)
    holeFill.addColorStop(0, '#1a0510')
    holeFill.addColorStop(1, THEME.bg)
    ctx.fillStyle = holeFill
    ctx.fill()
    ctx.strokeStyle = `${THEME.borderBright}60`
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, holeR - 6, 0, Math.PI * 2)
    ctx.strokeStyle = `${THEME.primary}30`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
    drawHorns(ctx, cx, cy - 15, 14, THEME.primaryDark, 0.7)
    drawStar(ctx, cx, cy - 30, 10, 4, THEME.tertiary, 0.95, 18)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const numGrad = ctx.createLinearGradient(cx - 25, 0, cx + 25, 0)
    numGrad.addColorStop(0, THEME.primaryLight)
    numGrad.addColorStop(1, THEME.secondaryLight)
    ctx.fillStyle = numGrad
    ctx.font = 'bold 28px Arial'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 24
    ctx.fillText(totalCommands.toString(), cx, cy + 4)
    ctx.shadowBlur = 0
    ctx.fillStyle = THEME.textDim
    ctx.font = 'bold 8.5px Arial'
    ctx.fillText('COMMANDS', cx, cy + 24)
    ctx.restore()
}

function drawBars(ctx, topCategories, totalCommands) {
    const bx0    = 330
    const by0    = 116
    const bw     = 295
    const bh     = 21
    const gap    = 43
    const maxVal = Math.max(...topCategories.map(([, d]) => d.total))
    ctx.save()
    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 6
    ctx.fillText('🩸 TOP CATEGORIES 🩸', bx0, by0 - 14)
    ctx.shadowBlur = 0
    ctx.strokeStyle = `${THEME.primary}60`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(bx0, by0 - 6)
    ctx.lineTo(bx0 + 108, by0 - 6)
    ctx.stroke()
    ctx.restore()
    topCategories.forEach(([cat, data], i) => {
        const y = by0 + i * gap
        const color = THEME.colors[i % THEME.colors.length]
        const pct = ((data.total / totalCommands) * 100).toFixed(1)
        const fw = (data.total / maxVal) * bw
        const icon = CATEGORY_ICONS[cat] || '📦'
        if (i % 2 === 0) {
            roundRect(ctx, bx0 - 85, y - 2, bw + 115, bh + 4, 5)
            ctx.fillStyle = `rgba(255,100,150,0.018)`
            ctx.fill()
        }
        ctx.save()
        ctx.fillStyle = i < 3 ? THEME.textPrimary : THEME.textSecondary
        ctx.font = i < 3 ? 'bold 10px Arial' : '10px Arial'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        if (i < 3) { ctx.shadowColor = color; ctx.shadowBlur = 8 }
        ctx.fillText(`${icon} ${cat.toUpperCase()}`, bx0 - 10, y + bh / 2)
        ctx.restore()
        roundRect(ctx, bx0, y, bw, bh, 6)
        ctx.fillStyle = `${THEME.border}70`
        ctx.fill()
        ctx.strokeStyle = `${THEME.border}40`
        ctx.lineWidth = 0.8
        ctx.stroke()
        if (fw > 5) {
            ctx.save()
            const bg = ctx.createLinearGradient(bx0, 0, bx0 + fw, 0)
            bg.addColorStop(0, THEME.primary)
            bg.addColorStop(0.45, color)
            bg.addColorStop(1, `${color}55`)
            roundRect(ctx, bx0, y, fw, bh, 6)
            ctx.fillStyle = bg
            ctx.shadowColor = color
            ctx.shadowBlur = 14
            ctx.fill()
            ctx.restore()
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(bx0 + 6, y + 2)
            ctx.lineTo(bx0 + fw - 6, y + 2)
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.restore()
            if (fw > 30) {
                ctx.save()
                ctx.fillStyle = '#ffffffcc'
                ctx.font = 'bold 9px Arial'
                ctx.textAlign = 'left'
                ctx.textBaseline = 'middle'
                ctx.shadowColor = THEME.primary
                ctx.shadowBlur = 4
                ctx.fillText(data.total.toString(), bx0 + 8, y + bh / 2)
                ctx.restore()
            }
            drawGlowDot(ctx, bx0 + fw, y + bh / 2, 2.5, color, 0.8)
        }
        ctx.save()
        const pctX = bx0 + bw + 8
        roundRect(ctx, pctX, y + 3, 36, bh - 6, 4)
        ctx.fillStyle = `${color}20`
        ctx.fill()
        ctx.strokeStyle = `${color}50`
        ctx.lineWidth = 0.7
        ctx.stroke()
        ctx.fillStyle = i < 3 ? color : THEME.textSecondary
        ctx.font = 'bold 9px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${pct}%`, pctX + 18, y + bh / 2)
        ctx.restore()
    })
}

function drawLegend(ctx, sorted, totalCommands, W) {
    const lx = 692
    const ly = 110
    const lw = 178
    const lh = sorted.length * 23 + 56
    drawGlassCard(ctx, lx, ly, lw, lh, 18, `${THEME.secondary}55`, 0.06)
    ctx.save()
    ctx.beginPath()
    const tg = ctx.createLinearGradient(lx + 20, ly, lx + lw - 20, ly)
    tg.addColorStop(0, 'transparent')
    tg.addColorStop(0.3, THEME.primary)
    tg.addColorStop(0.7, THEME.secondary)
    tg.addColorStop(1, 'transparent')
    ctx.strokeStyle = tg
    ctx.lineWidth = 2
    ctx.moveTo(lx + 20, ly + 1)
    ctx.lineTo(lx + lw - 20, ly + 1)
    ctx.stroke()
    ctx.restore()
    drawSparkle(ctx, lx + 19, ly + 22, 6, THEME.tertiary, 0.9, 10)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 10.5px Arial'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 10
    ctx.fillText('ALL CATEGORIES', lx + lw / 2 + 5, ly + 22)
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = `${THEME.border}80`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(lx + 12, ly + 36)
    ctx.lineTo(lx + lw - 12, ly + 36)
    ctx.stroke()
    ctx.restore()
    let ey = ly + 52
    sorted.forEach(([cat, data], i) => {
        const color = THEME.colors[i % THEME.colors.length]
        const icon = CATEGORY_ICONS[cat] || '📦'
        const pct = ((data.total / totalCommands) * 100).toFixed(0)
        if (i < 3) {
            drawStar(ctx, lx + 15, ey, 5, 2, color, 0.95, 5)
        } else {
            ctx.beginPath()
            ctx.arc(lx + 15, ey, 3.5, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
        }
        ctx.save()
        ctx.fillStyle = i < 3 ? THEME.textPrimary : THEME.textSecondary
        ctx.font = i < 3 ? 'bold 9.5px Arial' : '9.5px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${icon} ${cat}`, lx + 26, ey)
        ctx.restore()
        ctx.save()
        ctx.fillStyle = i < 3 ? THEME.tertiary : THEME.textDim
        ctx.font = 'bold 9px Arial'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${data.total} (${pct}%)`, lx + lw - 8, ey)
        ctx.restore()
        ey += 23
    })
}

function drawFooter(ctx, W, H, totalCommands) {
    const fh = 60
    const fy = H - fh
    const fg = ctx.createLinearGradient(0, fy, W, H)
    fg.addColorStop(0,   `${THEME.primary}28`)
    fg.addColorStop(0.35,`${THEME.secondary}22`)
    fg.addColorStop(0.65,`${THEME.secondary}22`)
    fg.addColorStop(1,   `${THEME.primary}28`)
    ctx.fillStyle = fg
    ctx.fillRect(0, fy, W, fh)
    const fbg = ctx.createLinearGradient(0, fy, W, fy)
    fbg.addColorStop(0, 'transparent')
    fbg.addColorStop(0.2, THEME.primary)
    fbg.addColorStop(0.5, THEME.tertiary)
    fbg.addColorStop(0.8, THEME.secondary)
    fbg.addColorStop(1, 'transparent')
    ctx.strokeStyle = fbg
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke()
    drawStar(ctx, 55,   H - 28, 8, 3.5, THEME.tertiary, 0.9, 14)
    drawStar(ctx, W-55, H - 28, 8, 3.5, THEME.tertiary, 0.9, 14)
    drawSparkle(ctx, 85, H - 28, 5, THEME.primary, 0.6, 8)
    drawSparkle(ctx, W-85, H - 28, 5, THEME.primary, 0.6, 8)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const ftGrad = ctx.createLinearGradient(W/2 - 200, 0, W/2 + 200, 0)
    ftGrad.addColorStop(0, THEME.primaryLight)
    ftGrad.addColorStop(0.5, THEME.tertiary)
    ftGrad.addColorStop(1, THEME.secondaryLight)
    ctx.fillStyle = ftGrad
    ctx.font = 'bold 16px Arial'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 22
    ctx.fillText(`🩸 ${totalCommands} TOTAL COMMANDS AVAILABLE 🩸`, W / 2, H - 36)
    ctx.shadowBlur = 0
    ctx.fillStyle = THEME.textDim
    ctx.font = 'italic 9.5px Arial'
    ctx.fillText(
        `Generated at ${require('moment-timezone')().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')} WIB`,
        W / 2, H - 14
    )
    ctx.restore()
}

// 🦋 Load Zero Two image from URL
async function loadZeroTwoCharacter() {
    try {
        const imgBuffer = await loadAssetImage('zerotwo-totalfitur.jpg')
        if (imgBuffer) return await canvasLoadImage(imgBuffer)
    } catch (err) {
        console.log('[TotalFitur] Gagal load gambar:', err.message)
    }
    return null
}

function drawZeroTwoCharacter(ctx, img, W, H) {
    if (!img) return
    const targetH = H * 0.88
    const scale = targetH / img.height
    const dw = img.width * scale
    const dh = targetH
    const dx = -dw * 0.12
    const dy = H - dh + 8
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, 320, H)
    ctx.clip()
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.95
    ctx.drawImage(img, dx, dy, dw, dh)
    const fadeGrad = ctx.createLinearGradient(180, 0, 300, 0)
    fadeGrad.addColorStop(0, 'rgba(10,0,5,0)')
    fadeGrad.addColorStop(1, 'rgba(10,0,5,0.95)')
    ctx.fillStyle = fadeGrad
    ctx.fillRect(180, 0, 140, H)
    const botGrad = ctx.createLinearGradient(0, H - 100, 0, H)
    botGrad.addColorStop(0, 'rgba(10,0,5,0)')
    botGrad.addColorStop(1, 'rgba(10,0,5,0.98)')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, H - 100, 250, 100)
    ctx.restore()
    ctx.save()
    const rimGrad = ctx.createLinearGradient(220, 0, 290, 0)
    rimGrad.addColorStop(0, 'transparent')
    rimGrad.addColorStop(0.6, `${THEME.primary}25`)
    rimGrad.addColorStop(1, `${THEME.primary}00`)
    ctx.fillStyle = rimGrad
    ctx.fillRect(220, 80, 70, H - 80)
    ctx.restore()
}

async function createPremiumChart(categories, totalCommands, enabledCommands) {
    const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)
    const topCategories = sorted.slice(0, 10)
    const W = 900
    const H = 660
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    const zeroTwoImg = await loadZeroTwoCharacter()
    drawBackground(ctx, W, H)
    drawStarField(ctx, W, H)
    drawZeroTwoCharacter(ctx, zeroTwoImg, W, H)
    drawHeader(ctx, W, totalCommands, enabledCommands, sorted.length)
    drawSeparator(ctx, W, 92)
    drawDonut(ctx, topCategories, totalCommands, 162, 300, 118, 54)
    ctx.save()
    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.secondary
    ctx.shadowBlur = 6
    ctx.fillText('🦋 DISTRIBUSI PIE 🩸', 162, 440)
    ctx.restore()
    topCategories.slice(0, 5).forEach(([cat, data], i) => {
        const color = THEME.colors[i % THEME.colors.length]
        const swx = 60 + i * 42
        const swy = 456
        ctx.save()
        ctx.beginPath()
        ctx.arc(swx, swy, 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.restore()
    })
    drawBars(ctx, topCategories, totalCommands)
    drawLegend(ctx, sorted, totalCommands, W)
    drawSeparator(ctx, W, 560)
    drawFooter(ctx, W, H, totalCommands)
    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const allPlugins = getAllPlugins()
        const categories = {}
        let totalCommands = 0
        let enabledCommands = 0
        for (const plugin of allPlugins) {
            if (!plugin.config) continue
            const cat = plugin.config.category || 'other'
            if (!categories[cat]) categories[cat] = { total: 0, enabled: 0 }
            categories[cat].total++
            totalCommands++
            if (plugin.config.isEnabled !== false) {
                categories[cat].enabled++
                enabledCommands++
            }
        }
        await m.react('🩸')
        const chartBuffer = await createPremiumChart(categories, totalCommands, enabledCommands)
        let dbUsers = 0, dbGroups = 0
        try {
            const db = require('../../src/lib/database').getDatabase()
            if (db && db.data) {
                dbUsers = Object.keys(db.data.users || {}).length
                dbGroups = Object.keys(db.data.groups || {}).length
            }
        } catch (e) {}
        const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)
        let caption = `🩸 *ᴅɪꜱᴛʀɪʙᴜꜱɪ ꜰɪᴛᴜʀ ʙᴏᴛ* 🩸\n\n`
        caption += `╭┈┈✦「 📈 *ꜱᴛᴀᴛɪꜱᴛɪᴋ* 」\n`
        caption += `┃ ◦ Total Commands: *${totalCommands}*\n`
        caption += `┃ ◦ Enabled: *${enabledCommands}*\n`
        caption += `┃ ◦ Disabled: *${totalCommands - enabledCommands}*\n`
        caption += `┃ ◦ Categories: *${sorted.length}*\n`
        caption += `╰┈┈✦\n\n`
        caption += `╭┈┈✦「 🗄️ *ᴅᴀᴛᴀʙᴀꜱᴇ* 」\n`
        caption += `┃ ◦ Total Users: *${dbUsers}*\n`
        caption += `┃ ◦ Total Groups: *${dbGroups}*\n`
        caption += `╰┈┈✦\n\n`
        caption += `╭┈┈✦「 📋 *ᴋᴀᴛᴇɢᴏʀɪ* 」\n`
        sorted.forEach(([cat, data]) => {
            const pct = ((data.total / totalCommands) * 100).toFixed(1)
            const icon = CATEGORY_ICONS[cat] || '📦'
            caption += `┃ ${icon} \`${cat.toUpperCase()}\`: *${data.total}* _(${pct}%)_\n`
        })
        caption += `╰┈┈✦\n\n`
        caption += `> 🩸 *${totalCommands}* fitur tersedia untuk Darling~ 🩸`
        await sock.sendMessage(m.chat, {
            image: chartBuffer,
            caption,
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        }, { quoted: m })
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}