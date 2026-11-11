const axios = require("axios")
const fs = require('fs')
const path = require('path')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')
const config = require("../../config")

const pluginConfig = {
    name: "play",
    alias: ["playaudio", "music"],
    category: "search",
    description: "Putar musik dari YouTube",
    usage: ".play <query>",
    example: ".play Star T Rain",
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query) {
        return m.reply(`🎧 *ᴢᴇʀᴏ ᴛᴡᴏ ᴘʟᴀʏᴇʀ*\n\n> Contoh:\n> \`${m.prefix}play Blue - Yung Kai\`\n> \`${m.prefix}play Dangerously - Charlie Puth\``)
    }

    await m.react("🩸")

    try {
        const api = `https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(query)}`
        const { data } = await axios.get(api, { timeout: 15000 })

        if (!data.status || !data.result) {
            throw new Error("Lagu tidak ditemukan")
        }

        const res = data.result

        // Upload thumbnail ke WhatsApp server untuk interactive message
        let mediaAttachment = null
        if (res.thumbnail) {
            try {
                const thumbBuffer = await axios.get(res.thumbnail, { responseType: 'arraybuffer' })
                mediaAttachment = await prepareWAMessageMedia(
                    { image: Buffer.from(thumbBuffer.data) },
                    { upload: sock.waUploadToServer }
                )
            } catch (e) {
                console.log('[Play] Gagal upload thumbnail:', e.message)
            }
        }

        // 🔥 FIX: Fallback image dari URL
        if (!mediaAttachment) {
            try {
                const fallbackBuffer = await loadImage('zerotwo-play.jpg')
                if (fallbackBuffer) {
                    mediaAttachment = await prepareWAMessageMedia(
                        { image: fallbackBuffer },
                        { upload: sock.waUploadToServer }
                    )
                }
            } catch (e) {}
        }

        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

        const caption = `╭───〔 🩸 *ᴢᴇʀᴏ ᴛᴡᴏ ᴘʟᴀʏᴇʀ* 🩸 〕───⬣
│
│  ✨ *${res.title}*
│
│  ╭━━━〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ* 〕━━━⬣
│  ┃ 🎤 *Artist:* ${res.author}
│  ┃ ⏱️ *Duration:* ${res.duration_timestamp}
│  ┃ 👁️ *Views:* ${res.views.toLocaleString()}
│  ┃ 🔗 *Source:* YouTube
│  ╰━━━━━━━━━━━━━━━━⬣
│
│  🩸 *“Darling, aku pilihkan lagu ini untukmu~”*
│  🦋 *Enjoy the music!*
│
╰────────────────⬣`

        // Buat interactive message
        const interactiveMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `🎧 ${res.author}`,
                            hasMediaAttachment: !!mediaAttachment,
                            ...(mediaAttachment || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: `✨ *${config.bot?.name || 'NusaBot'}* ✨\n🎵 Now Playing\n© ${new Date().getFullYear()}`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: caption
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: `🎵 ${res.title}`,
                                    url: res.url,
                                    copy_code: '💕 Darling 💕',
                                    expiration_time: Date.now() * 999
                                },
                                bottom_sheet: {
                                    in_thread_buttons_energi: 2,
                                    divider_indices: [1, 2, 999],
                                    list_title: '🎀 Now Playing',
                                    button_title: '🌸 Menu Musik'
                                }
                            }),
                            buttons: [
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎬 Watch on YouTube',
                                        url: res.url,
                                        merchant_url: res.url
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎵 Play Again',
                                        id: `${m.prefix}play ${query}`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💕 Menu',
                                        id: `${m.prefix}menu`
                                    })
                                }
                            ]
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })

        await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id })

        // Kirim audio setelah interactive message
        await sock.sendMessage(m.chat, {
            audio: { url: res.mp3 },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${res.title}.mp3`
        }, { quoted: m })

        await m.react("💕")

    } catch (err) {
        console.error('[Play Error]', err)
        await m.react("❌")

        await m.reply(`╭━━━〔 💔 *ᴇʀʀᴏʀ* 💔 〕━━━⬣
│
│  ❌ *Darling, lagunya gak ketemu...*
│
│  💡 *Saran:*
│  • Cek spelling judul lagu
│  • Coba kata kunci lain
│  • Atau coba nanti lagi
│
│  🩸 *Aku tetep di sini untukmu~*
│
╰────────────────⬣`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}