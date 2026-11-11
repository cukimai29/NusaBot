const { createCanvas } = require('canvas')

const pluginConfig = {
    name: ['radiotext', 'quoteradio', 'carquote'],
    alias: ['radiokata'],
    category: 'maker',
    description: 'Bikin gambar quote gaya layar radio mobil (teks oranye pixel)',
    usage: '.radiotext <teks>',
    example: '.radiotext Nggak apa-apa kita jadi asing',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let current = ''

    for (const word of words) {
        const test = current ? current + ' ' + word : word
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current)
            current = word
        } else {
            current = test
        }
    }
    if (current) lines.push(current)
    return lines
}

async function generateRadioImage(text) {
    const width = 720
    const height = 900
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Background gelap keseluruhan (interior mobil)
    const bg = ctx.createLinearGradient(0, 0, 0, height)
    bg.addColorStop(0, '#0d0705')
    bg.addColorStop(1, '#1a0f08')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)

    // Bezel unit head unit (kotak besar melengkung)
    const unitX = 40
    const unitY = 80
    const unitW = width - 80
    const unitH = 620
    ctx.fillStyle = '#050403'
    ctx.beginPath()
    ctx.roundRect(unitX, unitY, unitW, unitH, 24)
    ctx.fill()
    ctx.strokeStyle = '#3a2a1a'
    ctx.lineWidth = 3
    ctx.stroke()

    // Layar hitam di dalam bezel
    const screenX = unitX + 40
    const screenY = unitY + 40
    const screenW = unitW - 80
    const screenH = unitH - 140
    ctx.fillStyle = '#050505'
    ctx.beginPath()
    ctx.roundRect(screenX, screenY, screenW, screenH, 10)
    ctx.fill()
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 4
    ctx.stroke()

    // Indikator "1/4" pojok kanan atas layar
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.roundRect(screenX + screenW - 90, screenY + 20, 70, 34, 17)
    ctx.fill()
    ctx.fillStyle = '#e8e8e8'
    ctx.font = '18px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('1/4', screenX + screenW - 55, screenY + 37)
    ctx.textAlign = 'left'

    // Teks quote oranye pixelated di tengah layar
    ctx.fillStyle = '#e08a2a'
    ctx.font = 'bold 40px monospace'
    ctx.textBaseline = 'top'
    ctx.shadowColor = 'rgba(224,138,42,0.5)'
    ctx.shadowBlur = 8

    const padding = 50
    const maxWidth = screenW - padding * 2
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = 54
    const totalHeight = lines.length * lineHeight
    let startY = screenY + (screenH - totalHeight) / 2

    for (const line of lines) {
        ctx.fillText(line, screenX + padding, startY)
        startY += lineHeight
    }
    ctx.shadowBlur = 0

    // Panel tombol bawah (skip back, knob putar, skip forward)
    const panelY = unitY + unitH - 100
    ctx.fillStyle = '#0a0705'
    ctx.fillRect(unitX + 20, panelY, unitW - 40, 90)

    // Tombol skip back
    ctx.fillStyle = '#c98a4a'
    ctx.beginPath()
    ctx.moveTo(unitX + 100, panelY + 45)
    ctx.lineTo(unitX + 140, panelY + 25)
    ctx.lineTo(unitX + 140, panelY + 65)
    ctx.fill()

    // Knob putar tengah
    const knobX = width / 2
    const knobY = panelY + 45
    const knobGrad = ctx.createRadialGradient(knobX, knobY, 5, knobX, knobY, 45)
    knobGrad.addColorStop(0, '#3a3a3a')
    knobGrad.addColorStop(1, '#111')
    ctx.fillStyle = knobGrad
    ctx.beginPath()
    ctx.arc(knobX, knobY, 45, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 2
    ctx.stroke()

    // Tombol skip forward
    ctx.fillStyle = '#c98a4a'
    ctx.beginPath()
    ctx.moveTo(unitX + unitW - 100, panelY + 45)
    ctx.lineTo(unitX + unitW - 140, panelY + 25)
    ctx.lineTo(unitX + unitW - 140, panelY + 65)
    ctx.fill()

    // Dots indikator slide di bawah unit
    const dotY = unitY + unitH + 30
    const dotStartX = width / 2 - 45
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i === 0 ? '#eee' : '#555'
        ctx.beginPath()
        ctx.arc(dotStartX + i * 30, dotY, 6, 0, Math.PI * 2)
        ctx.fill()
    }

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
`Kirim teksnya ya~

Usage:
${m.prefix}radiotext <teks>

Contoh:
${m.prefix}radiotext Nggak apa-apa kita jadi asing`
        )
    }

    if (text.length > 200) {
        return m.reply('Teksnya kepanjangan, maksimal 200 karakter ya')
    }

    m.react('⏱️')

    try {
        const buffer = await generateRadioImage(text)

        await sock.sendMessage(
            m.chat,
            { image: buffer, caption: '🎧 Quote gaya layar radio mobil' },
            { quoted: m }
        )

        m.react('✅')
    } catch (err) {
        console.error('[RadioText] Error:', err)
        m.react('❌')
        m.reply('Gagal bikin gambar, coba lagi ya')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}