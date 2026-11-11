const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto')
const {
    generateWAMessage,
    generateWAMessageFromContent,
    jidNormalizedUser,
    prepareWAMessageMedia,
    proto
} = require('zerotwo')
const config = require('../../config')
const sharp = require('sharp')

const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Origin: 'https://savett.cc',
    Referer: 'https://savett.cc/en1/download',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
}

async function getToken() {
    const res = await axios.get('https://savett.cc/en1/download')
    return {
        csrf: res.data.match(/name="csrf_token" value="([^"]+)"/)?.[1],
        cookie: res.headers['set-cookie'].map(v => v.split(';')[0]).join('; ')
    }
}

async function fetchTikTok(url, csrf, cookie) {
    const res = await axios.post(
        'https://savett.cc/en1/download',
        `csrf_token=${encodeURIComponent(csrf)}&url=${encodeURIComponent(url)}`,
        { headers: { ...headers, Cookie: cookie } }
    )
    return res.data
}

function parseResponse(html) {
    const $ = cheerio.load(html)

    const stats = []
    $('#video-info .my-1 span').each((_, el) => {
        stats.push($(el).text().trim())
    })

    const data = {
        username: $('#video-info h3').first().text().trim(),
        views: stats[0] || null,
        likes: stats[1] || null,
        bookmarks: stats[2] || null,
        comments: stats[3] || null,
        shares: stats[4] || null,
        duration: $('#video-info p.text-muted').first().text().replace(/Duration:/i, '').trim() || null,
        type: null,
        downloads: { nowm: [], wm: [] },
        mp3: [],
        slides: []
    }

    const slides = $('.carousel-item[data-data]')

    if (slides.length) {
        data.type = 'photo'
        slides.each((_, el) => {
            try {
                const json = JSON.parse($(el).attr('data-data').replace(/&quot;/g, '"'))
                if (Array.isArray(json.URL)) {
                    json.URL.forEach(url => {
                        data.slides.push({ index: data.slides.length + 1, url })
                    })
                }
            } catch {}
        })
        return data
    }

    data.type = 'video'

    $('#formatselect option').each((_, el) => {
        const label = $(el).text().toLowerCase()
        const raw = $(el).attr('value')
        if (!raw) return

        try {
            const json = JSON.parse(raw.replace(/&quot;/g, '"'))
            if (!json.URL) return

            if (label.includes('mp4') && !label.includes('watermark')) {
                data.downloads.nowm.push(...json.URL)
            }
            if (label.includes('watermark')) {
                data.downloads.wm.push(...json.URL)
            }
            if (label.includes('mp3')) {
                data.mp3.push(...json.URL)
            }
        } catch {}
    })

    return data
}

async function savett(url) {
    const { csrf, cookie } = await getToken()
    const html = await fetchTikTok(url, csrf, cookie)
    return parseResponse(html)
}

const pluginConfig = {
    name: ['tiktok2', 'tt2', 'ttmp4'],
    alias: ['tiktokdl2', 'ttdown2'],
    category: 'download',
    description: 'Download video/slide TikTok tanpa watermark',
    usage: '.tiktok2 <url>',
    example: '.tiktok2 https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」\n` +
            `┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}tiktok2 <url>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Contoh: ${m.prefix}tiktok2 https://vt.tiktok.com/xxx`
        )
    }

    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply('❌ URL tidak valid. Gunakan link TikTok.')
    }

    m.react('⏱️')

    try {
        const result = await savett(url)

        const caption = 
`╭━━━〔 🎀 *TIKTOK SLIDESHOW* 〕━━━⬣
┃
┃ 👤 *${result.username || '-'}*
┃ 👁️ Views: ${result.views || '-'} | ❤️ Likes: ${result.likes || '-'}
┃ 💬 Comments: ${result.comments || '-'} | 🔗 Shares: ${result.shares || '-'}
┃ ⏱️ Duration: ${result.duration || '-'}
╰━━━━━━━━━━━━━━━⬣`

        // KALAU VIDEO (normal)
        if (result.type === 'video' && result.downloads.nowm.length > 0) {
            await sock.sendMessage(
                m.chat,
                {
                    video: { url: result.downloads.nowm[0] },
                    mimetype: 'video/mp4',
                    caption,
                    footer: `© ${config.bot?.name}`,
                    interactiveButtons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎵 Download Audio',
                                id: `${m.prefix}ttmp3 ${url}`
                            })
                        }
                    ]
                },
                { quoted: m }
            )
            m.react('✅')
            return
        }

        // KALAU SLIDESHOW/FOTO (pake CAROUSEL kayak Pinterest)
        if (result.type === 'photo' && result.slides.length > 0) {
            await m.reply(`📸 *${result.slides.length} foto ditemukan, Darling~*\n💕 *Menyusun carousel...*`)

            const carouselCards = []
            
            for (let i = 0; i < result.slides.length; i++) {
                const imgUrl = result.slides[i].url
                if (!imgUrl) continue

                try {
                    // Download gambar
                    const imgResponse = await axios.get(imgUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    })
                    
                    let imageBuffer = Buffer.from(imgResponse.data)
                    
                    // Resize ke 300x300 biar rapi
                    imageBuffer = await sharp(imageBuffer)
                        .resize(300, 300, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toBuffer()
                    
                    const cardMedia = await prepareWAMessageMedia({
                        image: imageBuffer
                    }, { upload: sock.waUploadToServer })
                    
                    const slideCaption = 
`╭─〔 📸 *TikTok Slideshow* 〕
│ 👤 *Creator:* ${result.username || 'Unknown'}
│ 💕 *Foto ${i+1}/${result.slides.length}*
╰──────────────

💕 *Geser untuk foto selanjutnya, Darling~*`
                    
                    const cardMessage = {
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `📸 SLIDESHOW - ${i+1}/${result.slides.length}`,
                            hasMediaAttachment: true,
                            ...cardMedia
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: slideCaption
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: `✨ Zero Two TikTok • Swipe kiri/kanan untuk lihat semua ✨`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: [{
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: `💾 Simpan Foto ${i+1}`,
                                    id: `${m.prefix}saveimg ${imgUrl}`
                                })
                            }]
                        })
                    }
                    
                    carouselCards.push(cardMessage)
                    
                } catch (err) {
                    console.log(`[TikTok2 Slideshow] Foto ${i+1} error:`, err.message)
                    continue
                }
            }
            
            if (carouselCards.length > 0) {
                const headerText = 
`╭━━━〔 🎀 TIKTOK SLIDESHOW CAROUSEL 🎀 〕━━━⬣
┃
┃ 👤 *Creator:* ${result.username || 'Unknown'}
┃ 🖼️ *Total:* ${carouselCards.length} foto
┃
┃ ✨ *Geser ke samping (swipe left/right)* ✨
┃ 💕 Untuk melihat semua foto, Darling~
┃
┃ 📌 *Tap tombol* untuk menyimpan foto
╰━━━━━━━━━━━━━━━━⬣`
                
                const msg = await generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.fromObject({
                                    text: headerText
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                    text: `✨ Zero Two TikTok | "Nikmati slideshow-nya, Darling~" ✨`
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: carouselCards
                                })
                            })
                        }
                    }
                }, {
                    userJid: m.sender
                })
                
                await sock.relayMessage(m.chat, msg.message, {
                    messageId: msg.key.id
                })
                
                // Kirim audio MP3 biasa (tanpa externalAdReply)
                if (result.mp3.length > 0) {
                    await sock.sendMessage(
                        m.chat,
                        {
                            audio: { url: result.mp3[0] },
                            mimetype: 'audio/mpeg',
                            ptt: false
                        },
                        { quoted: m }
                    )
                }
                
                m.react('✅')
            } else {
                throw new Error('Gagal memuat gambar slideshow')
            }
            return
        }

        // KALAU AUDIO DOANG
        if (result.mp3.length > 0) {
            m.reply(`🍀 *NOTE*\n> Konten ini tidak memiliki video/slide, mengirim audio saja...`)
            await sock.sendMessage(
                m.chat,
                {
                    audio: { url: result.mp3[0] },
                    mimetype: 'audio/mpeg',
                    ptt: false
                },
                { quoted: m }
            )
            m.react('✅')
            return
        }

        throw new Error('Tidak ada media yang dapat diunduh')

    } catch (err) {
        console.error('[TikTokDL2] Error:', err)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}