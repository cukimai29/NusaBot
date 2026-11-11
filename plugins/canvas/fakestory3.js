const { createCanvas, loadImage: canvasLoadImage } = require('@napi-rs/canvas') // 🔥 RENAME CANVAS LOADER
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER ASSET
const axios = require('axios')
const fs = require('fs')
const config = require('../../config')

const pluginConfig = {
    name: 'fakestory3',
    alias: ['fstory3', 'igstory3', 'quotestory'],
    category: 'canvas',
    description: 'Fake Instagram Story Quote',
    usage: '.fakestory3 nama|text1|text2',
    example: '.fakestory3 Misaki|Tersenyumlah|untuk menutupi kesedihan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function getProfile(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, 'image')
        const res = await axios.get(url, { responseType: 'arraybuffer' })
        return Buffer.from(res.data)
    } catch {
        // 🔥 FIX: Ambil dari URL
        try {
            return await loadImage('pp-kosong.jpg')
        } catch (e) {
            return null
        }
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let line = ''

    for (const word of words) {
        const test = line + word + ' '
        const width = ctx.measureText(test).width

        if (width > maxWidth && line !== '') {
            lines.push(line)
            line = word + ' '
        } else {
            line = test
        }
    }

    lines.push(line)
    return lines
}

async function createStory(username, avatarBuffer, imageBuffer, text1, text2) {
    const canvas = createCanvas(720, 1280)
    const ctx = canvas.getContext('2d')

    const bg = await canvasLoadImage(imageBuffer) // 🔥 Pake canvasLoadImage
    const avatar = await canvasLoadImage(avatarBuffer) // 🔥 Pake canvasLoadImage

    // background
    ctx.drawImage(bg, 0, 0, 720, 1280)

    // overlay gelap
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, 720, 1280)

    // gradient atas
    const grad = ctx.createLinearGradient(0, 0, 0, 220)
    grad.addColorStop(0, 'rgba(0,0,0,0.85)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 720, 220)

    // avatar
    ctx.save()
    ctx.beginPath()
    ctx.arc(70, 80, 35, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avatar, 35, 45, 70, 70)
    ctx.restore()

    // username
    ctx.font = 'bold 30px Sans'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(username, 125, 80)

    // waktu
    ctx.font = '24px Sans'
    ctx.fillStyle = '#dddddd'
    ctx.fillText('1 menit', 125, 112)

    // garis story
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(25, 20, 670, 6)

    // quote text 1
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 10

    ctx.font = 'bold 42px Sans'
    const lines1 = wrapText(ctx, text1, 580)
    let y1 = 470

    for (const line of lines1) {
        ctx.fillText(line, 360, y1)
        y1 += 55
    }

    // quote text 2
    ctx.font = '32px Sans'
    const lines2 = wrapText(ctx, text2, 520)
    let y2 = y1 + 70

    for (const line of lines2) {
        ctx.fillText(line, 360, y2)
        y2 += 45
    }

    ctx.shadowBlur = 0

    // footer
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(35, 1180, 520, 58, 30)
    ctx.stroke()

    ctx.font = '25px Sans'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Kirim pesan...', 280, 1217)

    // icon
    ctx.font = '42px Sans'
    ctx.fillText('♡', 600, 1215)
    ctx.fillText('✈', 650, 1213)

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const body = m.body || m.text || ''
        const input = body.trim().split(' ').slice(1).join(' ')

        if (!input || !input.includes('|')) {
            return await m.reply(
                `📸 *FAKE STORY 3*\n\n` +
                `Format:\n` +
                `${pluginConfig.example}`
            )
        }

        const parts = input.split('|')
        const username = parts[0] || m.pushName
        const text1 = parts[1] || ''
        const text2 = parts[2] || ''

        let imageBuffer = null

        // reply image
        if (m.quoted && (m.quoted.mimetype?.includes('image') || m.quoted.type === 'imageMessage')) {
            imageBuffer = await m.quoted.download()
        }
        // direct image
        else if (m.mimetype?.includes('image')) {
            imageBuffer = await m.download()
        }

        if (!imageBuffer) {
            return await m.reply('❌ Reply / kirim gambar')
        }

        await m.react('🕕')

        const avatarBuffer = await getProfile(sock, m.sender)

        if (!avatarBuffer) {
            await m.react('❌')
            return m.reply(`❌ Gagal load avatar (URL mati & lokal kosong)`)
        }

        const result = await createStory(username, avatarBuffer, imageBuffer, text1, text2)

        await sock.sendMessage(
            m.chat,
            {
                image: result,
                caption: `📸 *FAKE STORY 3*\n\n👤 ${username}`
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {
        console.error('FakeStory3 Error:', error)
        await m.react('☢')
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}