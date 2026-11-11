const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('zerotwo')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

const pluginConfig = {
    name: 'musikapaini',
    alias: ['whatmusic', 'shazam', 'recognizemusic', 'mai'],
    category: 'tools',
    description: 'Identifikasi lagu dari audio',
    usage: '.musikapaini (reply audio)',
    example: '.musikapaini',
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbTools

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    // 🔥 FIX: Ambil gambar dari URL
    try {
        const thumbTools = await loadImage('zerotwo-tools.jpg')
        if (thumbTools) {
            ctx.externalAdReply = {
                title,
                body,
                thumbnail: thumbTools,
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch {}

    return ctx
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 60000
    })
    
    if (!res.data?.data?.url) throw new Error('Upload gagal')
    return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function handler(m, { sock }) {
    let audioBuffer = null
    let filename = 'audio.mp3'
    
    if (m.quoted?.message) {
        const quotedMsg = m.quoted.message
        const audioMsg = quotedMsg.audioMessage || quotedMsg.documentMessage
        
        if (audioMsg) {
            try {
                audioBuffer = await downloadMediaMessage(
                    { key: m.quoted.key, message: quotedMsg },
                    'buffer',
                    {}
                )
                filename = audioMsg.fileName || 'audio.mp3'
            } catch {}
        }
    }
    
    if (!audioBuffer && m.message) {
        const audioMsg = m.message.audioMessage || m.message.documentMessage
        if (audioMsg) {
            try {
                audioBuffer = await m.download()
                filename = audioMsg.fileName || 'audio.mp3'
            } catch {}
        }
    }
    
    if (!audioBuffer) {
        return m.reply(
            `🎵 *ᴍᴜsɪᴋ ᴀᴘᴀ ɪɴɪ?*\n\n` +
            `> Identifikasi lagu dari audio\n\n` +
            `*Cara pakai:*\n` +
            `> Reply audio dengan \`${m.prefix}musikapaini\`\n` +
            `> Atau kirim audio + caption command`
        )
    }
    
    m.react('🎵')
    
    try {
        await m.reply('⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ...*\n\n> Mengupload audio...')
        
        const audioUrl = await uploadToTmpFiles(audioBuffer, filename)
        
        await m.reply('🔍 *ᴍᴇɴɢɪᴅᴇɴᴛɪꜰɪᴋᴀsɪ...*\n\n> Mencari info lagu...')
        
        const apiUrl = `https://api.neoxr.eu/api/whatmusic?url=${encodeURIComponent(audioUrl)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Lagu tidak dikenali atau API error')
        }
        
        const music = data.data
        const links = music.links || {}
        
        let text = `🎵 *ʟᴀɢᴜ ᴅɪᴛᴇᴍᴜᴋᴀɴ!*\n\n`
        text += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        text += `┃ 🎶 Title: ${music.title || '-'}\n`
        text += `┃ 👤 Artist: ${music.artist || '-'}\n`
        text += `┃ 💿 Album: ${music.album || '-'}\n`
        text += `┃ 📅 Release: ${music.release || '-'}\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        const buttons = []
        
        if (links.spotify?.track?.id) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '🎧 Spotify',
                    url: `https://open.spotify.com/track/${links.spotify.track.id}`
                })
            })
        }
        
        if (links.youtube?.vid) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '▶️ YouTube',
                    url: `https://youtube.com/watch?v=${links.youtube.vid}`
                })
            })
        }
        
        if (links.deezer?.track?.id) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '🎵 Deezer',
                    url: `https://deezer.com/track/${links.deezer.track.id}`
                })
            })
        }
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🎵 MUSIK APA INI', music.title || 'Music Found')

        const msgContent = {
            text,
            footer: '🎵 Music Recognition',
            contextInfo: contextInfo
        }
        
        if (buttons.length > 0) {
            msgContent.interactiveButtons = buttons
        }
        
        await sock.sendMessage(m.chat, msgContent, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}