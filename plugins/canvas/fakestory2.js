const { createCanvas, loadImage: canvasLoadImage } = require('@napi-rs/canvas') // 🔥 RENAME CANVAS LOADER
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER ASSET
const axios = require('axios')
const fs = require('fs')
const config = require('../../config')

const pluginConfig = {
    name: 'fakestory2',
    alias: ['fstory2', 'igstory2'],
    category: 'canvas',
    description: 'Fake Instagram Story Full',
    usage: '.fakestory2 <nama>',
    example: '.fakestory2 Misaki',
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

async function createStory(username, avatarBuffer, imageBuffer) {
    const canvas = createCanvas(720, 1280)
    const ctx = canvas.getContext('2d')

    const bg = await canvasLoadImage(imageBuffer)
    const avatar = await canvasLoadImage(avatarBuffer)

    // background full
    ctx.drawImage(bg, 0, 0, 720, 1280)

    // overlay gelap
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, 720, 1280)

    // top gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 220)
    grad.addColorStop(0, 'rgba(0,0,0,0.75)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 720, 220)

    // avatar bulat
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
    ctx.fillText(username, 125, 78)

    // waktu
    ctx.font = '24px Sans'
    ctx.fillStyle = '#dddddd'
    ctx.fillText('1 menit', 125, 112)

    // garis atas story
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(25, 20, 670, 6)

    // footer
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(35, 1180, 520, 58, 30)
    ctx.stroke()

    ctx.font = '25px Sans'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Kirim pesan...', 65, 1216)

    // icon love
    ctx.font = '42px Sans'
    ctx.fillText('♡', 600, 1215)

    // icon send
    ctx.fillText('✈', 650, 1213)

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const body = m.body || m.text || ''
        const username = body.trim().split(' ').slice(1).join(' ') || m.pushName

        let imageBuffer = null

        // reply image
        if (m.quoted && (m.quoted.mimetype?.includes('image') || m.quoted.type === 'imageMessage')) {
            imageBuffer = await m.quoted.download()
        }
        // send image
        else if (m.mimetype?.includes('image')) {
            imageBuffer = await m.download()
        }

        if (!imageBuffer) {
            return await m.reply(
                `📷 *FAKE STORY 2*\n\n` +
                `Reply / kirim gambar\n\n` +
                `Contoh:\n${pluginConfig.example}`
            )
        }

        await m.react('🕕')

        const avatarBuffer = await getProfile(sock, m.sender)

        if (!avatarBuffer) {
            await m.react('❌')
            return m.reply(`❌ Gagal load avatar (URL mati & lokal kosong)`)
        }

        const result = await createStory(username, avatarBuffer, imageBuffer)

        await sock.sendMessage(
            m.chat,
            {
                image: result,
                caption: `📸 *FAKE INSTAGRAM STORY 2*\n\n👤 ${username}`
            },
            { quoted: m }
        )

        await m.react('✅')

    } catch (error) {
        console.error('FakeStory2 Error:', error)
        await m.react('☢')
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}