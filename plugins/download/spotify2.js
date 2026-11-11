const config = {
    name: 'spotify2',
    alias: ['spdl2', 'spotifydl2', 'musik2'],
    category: 'download',
    description: 'Download lagu dari Spotify',
    usage: '.spotify <url>',
    example: '.spotify https://open.spotify.com/track/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

const axios = require('axios')
const fs = require('fs')
const path = require('path')

const API = "https://musicfab.io/api/spotify"

async function spotifyDownload(url) {
    try {
        const response = await axios.post(
            API,
            { url },
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
                    "Accept": "*/*",
                    "Content-Type": "application/json",
                    "Origin": "https://musicfab.io",
                    "Referer": "https://musicfab.io/",
                    "Sec-CH-UA": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
                    "Sec-CH-UA-Mobile": "?1",
                    "Sec-CH-UA-Platform": '"Android"',
                    "Sec-Fetch-Site": "same-origin",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Dest": "empty",
                    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
                },
                timeout: 60000,
                validateStatus: () => true
            }
        )

        const metadata = response.data?.data?.metadata || null

        if (!metadata?.download) {
            return {
                success: false,
                statusCode: response.status,
                error: response.data?.message || 'Download URL not found'
            }
        }

        return {
            success: true,
            statusCode: response.status,
            resultUrl: metadata.download,
            metadata: {
                name: metadata.name || null,
                artist: metadata.artist || null,
                album: metadata.album || null,
                duration: metadata.duration || null,
                image: metadata.image || null
            }
        }
    } catch (error) {
        return {
            success: false,
            statusCode: error.response?.status || 500,
            error: error.message
        }
    }
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const url = args[0]
    
    if (!url) {
        return m.reply(`🎵 *ꜱᴘᴏᴛɪꜰʏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> Download lagu dari Spotify\n\n> Contoh: .spotify https://open.spotify.com/track/xxx\n\n📝 *Support:*\n> • Single Track\n> • Format MP3`)
    }
    
    if (!url.includes('spotify.com')) {
        return m.reply(`❌ *URL tidak valid!*\n\n> Pastikan URL dari Spotify.\n> Contoh: https://open.spotify.com/track/xxx`)
    }
    
    await m.reply(`⏳ *Sedang memproses...*\n> 🎵 Mengambil data dari Spotify`)
    
    const result = await spotifyDownload(url)
    
    if (!result.success) {
        let errorMsg = `❌ *GAGAL DOWNLOAD*\n\n`
        errorMsg += `📊 Status Code: ${result.statusCode}\n`
        errorMsg += `⚠️ Error: ${result.error}\n\n`
        errorMsg += `> 💡 Coba lagi nanti atau gunakan link lain, Darling~`
        return m.reply(errorMsg)
    }
    
    const { name, artist, album, duration, image } = result.metadata
    
    let infoText = `🎵 *ꜱᴘᴏᴛɪꜰʏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`
    infoText += `╭──〔 📋 *ɪɴꜰᴏ ʟᴀɢᴜ* 〕───⬣\n`
    infoText += `│  🎤 Judul: *${name || 'Unknown'}*\n`
    if (artist) infoText += `│  🎙️ Artist: *${artist}*\n`
    if (album) infoText += `│  💿 Album: *${album}*\n`
    if (duration) infoText += `│  ⏱️ Durasi: *${duration}*\n`
    infoText += `╰────────────────⬣\n\n`
    infoText += `⏳ *Mengupload audio...*`
    
    await m.reply(infoText)
    
    try {
        const audioBuffer = await axios.get(result.resultUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        }).then(res => res.data)
        
        const fileName = `${name || 'track'} - ${artist || 'spotify'}.mp3`
            .replace(/[^a-zA-Z0-9\\s.-]/g, '')
            .replace(/\\s+/g, '_')
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: fileName,
            caption: `🎵 *${name || 'Track'}*\n🎙️ *${artist || 'Unknown'}*\n\n> Downloaded via Spotify Downloader`
        })
        
    } catch (uploadError) {
        await m.reply(`✅ *Download berhasil!*\n\n🔗 *Link:* ${result.resultUrl}\n\n> Tidak bisa mengupload audio, silahkan download manual melalui link di atas, Darling~`)
    }
}

module.exports = {
    config,
    handler
}