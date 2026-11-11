const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('zerotwo')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

const pluginConfig = {
    name: 'audionoicereducer',
    alias: ['noisereducer', 'denoise', 'cleanaudio', 'anr'],
    category: 'tools',
    description: 'Kurangi noise dari audio',
    usage: '.audionoicereducer (reply audio)',
    example: '.audionoicereducer',
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
            `🔊 *ᴀᴜᴅɪᴏ ɴᴏɪsᴇ ʀᴇᴅᴜᴄᴇʀ*\n\n` +
            `> Kurangi noise dari audio\n\n` +
            `*Cara pakai:*\n` +
            `> Reply audio dengan \`${m.prefix}audionoicereducer\`\n` +
            `> Atau kirim audio + caption command`
        )
    }
    
    m.react('🔊')
    
    try {
        await m.reply('⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ...*\n\n> Mengupload audio...')
        
        const audioUrl = await uploadToTmpFiles(audioBuffer, filename)
        
        await m.reply('🔄 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengurangi noise...')
        
        const apiUrl = `https://api.neoxr.eu/api/noice-reducer?file=${encodeURIComponent(audioUrl)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 120000 })
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon')
        }
        
        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🔊 NOISE REDUCER', 'Audio Cleaned')

        await sock.sendMessage(m.chat, {
            audio: { url: data.data.url },
            mimetype: 'audio/mpeg',
            contextInfo: contextInfo
        }, { quoted: m })
        
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