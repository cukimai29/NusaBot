const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const sharp = require('sharp')
const FormData = require('form-data')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'fakewa',
    alias: ['fw', 'fakeprofil'],
    category: 'maker',
    description: 'Bikin profil WhatsApp palsu~',
    usage: '.fakewa nama|bio|nomor',
    example: '.fakewa Zero Two|Darling terbaik!|6281234567890',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const zeroFont = path.join(__dirname, 'WhatsAppFont.ttf')
const kagayakiLatar = 'https://uploader.zenzxz.dpdns.org/uploads/1775722039920.png'
const starFont = 'https://uploader.zenzxz.dpdns.org/uploads/1775659852069.ttf'
const zeroPotong = 50

async function honkiBuffer(url) {
    const res = await fetch(url, { timeout: 20000 })
    if (!res.ok) throw new Error(`Fetch gagal (${res.status}): ${url}`)
    return Buffer.from(await res.arrayBuffer())
}

async function egaoAsset() {
    if (!fs.existsSync(zeroFont)) {
        const buf = await honkiBuffer(starFont)
        fs.mkdirSync(path.dirname(zeroFont), { recursive: true })
        fs.writeFileSync(zeroFont, buf)
    }
    GlobalFonts.registerFromPath(zeroFont, 'WhatsApp')
}

function sutekinaMaru(ctx, img, x, y, ukuran) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + ukuran / 2, y + ukuran / 2, ukuran / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, x, y, ukuran, ukuran)
    ctx.restore()
}

async function kibouUpload(buffer) {
    const daftarAi = [
        {
            namaBintang: 'ImgBB',
            tampil: async (buf) => {
                const { config } = require('../../config')
                const kunci = config?.imgbbKey || '2e2bcb7d6e18dc7c69e35fd50b6dfd84'
                const form = new FormData()
                form.append('image', buf.toString('base64'))
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${kunci}`, { method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000 })
                if (!res.ok) throw new Error(`ImgBB HTTP ${res.status}`)
                const data = await res.json()
                if (!data?.success) throw new Error('ImgBB gagal')
                return data.data.url
            }
        },
        {
            namaBintang: 'Litterbox',
            tampil: async (buf) => {
                const form = new FormData()
                form.append('reqtype', 'fileupload')
                form.append('time', '72h')
                form.append('fileToUpload', buf, { filename: 'pp.png', contentType: 'image/png', knownLength: buf.length })
                const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 20000 })
                if (!res.ok) throw new Error(`Litterbox HTTP ${res.status}`)
                const url = (await res.text()).trim()
                if (!url.startsWith('http')) throw new Error('Litterbox gagal')
                return url
            }
        },
        {
            namaBintang: 'Catbox',
            tampil: async (buf) => {
                const form = new FormData()
                form.append('reqtype', 'fileupload')
                form.append('fileToUpload', buf, { filename: 'pp.png', contentType: 'image/png', knownLength: buf.length })
                const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 20000 })
                if (!res.ok) throw new Error(`Catbox HTTP ${res.status}`)
                const url = (await res.text()).trim()
                if (!url.startsWith('http')) throw new Error('Catbox gagal')
                return url
            }
        },
        {
            namaBintang: 'Uguu',
            tampil: async (buf) => {
                const form = new FormData()
                form.append('files[]', buf, { filename: 'pp.png', contentType: 'image/png', knownLength: buf.length })
                const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000 })
                if (!res.ok) throw new Error(`Uguu HTTP ${res.status}`)
                const data = await res.json()
                if (!data?.success) throw new Error('Uguu gagal')
                return data.files[0].url
            }
        },
    ]

    const zeroGagal = []
    for (const bintang of daftarAi) {
        try {
            const url = await bintang.tampil(buffer)
            if (url?.startsWith('http')) {
                console.log(`✅ [fakewa] Naik via ${bintang.namaBintang}: ${url}`)
                return url
            }
        } catch (e) {
            console.warn(`⚠️ [fakewa] ${bintang.namaBintang} gagal: ${e.message}`)
            zeroGagal.push(`${bintang.namaBintang}: ${e.message}`)
        }
    }
    throw new Error(`Semua gagal!\n${zeroGagal.join('\n')}`)
}

async function zeroProfil({ urlFoto, nama, tentang, telepon }) {
    await egaoAsset()

    const [bufLatar, bufFoto] = await Promise.all([
        honkiBuffer(kagayakiLatar),
        honkiBuffer(urlFoto)
    ])

    const latar = await loadImage(bufLatar)
    const foto  = await loadImage(bufFoto)

    const tinggiPanggung = latar.height - zeroPotong
    const panggung = createCanvas(latar.width, tinggiPanggung)
    const ctx = panggung.getContext('2d')

    ctx.drawImage(latar, 0, zeroPotong, latar.width, latar.height - zeroPotong, 0, 0, latar.width, tinggiPanggung)

    sutekinaMaru(ctx, foto, 360, 200 - zeroPotong, 360)

    ctx.fillStyle = '#889093'
    ctx.font = '30px WhatsApp'
    ctx.fillText(nama,    157, 870  - zeroPotong)
    ctx.fillText(tentang, 169, 1030 - zeroPotong)
    ctx.fillText(telepon, 172, 1190 - zeroPotong)

    return panggung.toBuffer('image/png')
}

async function handler(m, { sock }) {
    const masukan = m.args.join(' ')

    if (!masukan) {
        return m.reply(
            `🌟 *ꜰᴀᴋᴇ ᴡʜᴀᴛsᴀᴘᴘ ᴘʀᴏꜰɪʟ*\n\n` +
            `"Mau bikin profil palsu? Oke Zero Two bantu~"\n\n` +
            `📌 *Format:*\n` +
            `\`${m.prefix}fakewa nama|bio|nomor\`\n\n` +
            `📌 *Contoh:*\n` +
            `\`${m.prefix}fakewa Zero Two|Darling terbaik!|6281234567890\`\n\n` +
            `> Reply atau kirim gambar untuk PP nya ya~ 💖`
        )
    }

    const q = m.quoted ? m.quoted : m
    const tipeMedia = (q.msg || q).mimetype || q.mediaType || ''
    const adaMedia = /image|sticker|viewOnce/.test(tipeMedia) || q.message?.imageMessage || q.message?.stickerMessage

    if (!adaMedia) {
        return m.reply(`"Eh? PP-nya mana?"\n\n> Reply atau kirim gambar dulu ya~ 💖`)
    }

    const bagian = masukan.split('|').map(s => s.trim())
    if (bagian.length < 3 || !bagian[0] || !bagian[1] || !bagian[2]) {
        return m.reply(
            `❌ Format salah~\n\n` +
            `\`${m.prefix}fakewa nama|bio|nomor\`\n\n` +
            `> Pisah pakai tanda \`|\` ya~`
        )
    }

    const [nama, tentang, telepon] = bagian

    m.react('✨')

    try {
        const bufMedia = await q.download().catch(() => null)
        if (!bufMedia) throw new Error('Gagal ambil gambar PP nya...')

        const bufFoto = await sharp(bufMedia)
            .resize(400, 400, { fit: 'cover' })
            .png()
            .toBuffer()

        const urlFoto = await kibouUpload(bufFoto)
        const hasilPanggung = await zeroProfil({ urlFoto, nama, tentang, telepon })

        m.react('✅')

        await sock.sendMessage(m.chat, { image: hasilPanggung, caption: `💖 *ꜰᴀᴋᴇ ᴡᴀ ᴘʀᴏꜰɪʟ*\n\n> ${nama}` }, { quoted: m })

        m.react('💖')

    } catch (zeroErr) {
        console.error('[fakewa] Error:', zeroErr)
        m.react('💔')
        m.reply(`💔 *ᴇʀʀᴏʀ*\n\n> ${zeroErr.message}`)
    }
}

module.exports = { config: pluginConfig, handler }