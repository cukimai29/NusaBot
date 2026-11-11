const fs = require('fs')
const path = require('path')
const config = require('../../config')
const { loadImage } = require('./assetLoader') // 🔥 IMPORT HELPER
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

const FAST_ANSWER_PRAISES = [
    '⚡ Kilat banget! Kamu jenius!',
    '🚀 Super cepat! Otak encer!',
    '🔥 Wuih monster! Jawab secepat kilat!',
    '💫 Luar biasa! Kamu the flash!',
    '🎯 Precision tinggi! Langsung tepat!',
    '⭐ Bintang! Refleks dewa!',
    '🏆 Legend! Kecepatan maximal!',
    '💎 Premium player! Gak ada lawan!',
    '🦅 Tajam seperti elang!',
    '🧠 Big brain! IQ tinggi detected!'
]

const FAST_ANSWER_THRESHOLD = 4000
const FAST_ANSWER_BONUS = {
    exp: 50,
    balance: 500,
    limit: 1
}

function getRandomPraise() {
    return FAST_ANSWER_PRAISES[Math.floor(Math.random() * FAST_ANSWER_PRAISES.length)]
}

async function getGameContextInfo(sock, title = '🎮 NusaBot GAMES', body = 'Have fun playing!') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    // 🔥 FIX: Ambil gambar dari URL
    const gameThumbBuffer = await loadImage('zerotwo-games.jpg');
    
    let mediaAttachment = null
    if (gameThumbBuffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: gameThumbBuffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[ContextHelper] Gagal upload game thumbnail:', e.message)
        }
    }

    return {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title,
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: body
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `✨ ${config.bot?.name || 'NusaBot'} ✨`
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Menu',
                            id: '.menu'
                        })
                    }
                ]
            }),
            contextInfo: {
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

async function getWinnerContextInfo(sock, title = '🏆 WINNER!', body = 'Selamat kamu menang!') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    // 🔥 FIX: Ambil gambar dari URL
    const winnerThumbBuffer = await loadImage('zerotwo-winner.jpg');
    const gameThumbBuffer = await loadImage('zerotwo-games.jpg');
    
    // Fallback ke games kalau winner kosong
    const thumbBuffer = winnerThumbBuffer || gameThumbBuffer
    
    let mediaAttachment = null
    if (thumbBuffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: thumbBuffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[ContextHelper] Gagal upload winner thumbnail:', e.message)
        }
    }

    return {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title,
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: body
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `🏆 Selamat!`
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🎮 Main Lagi',
                            id: '.tebakbendera'
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Menu',
                            id: '.menu'
                        })
                    }
                ]
            }),
            contextInfo: {
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

async function getRpgContextInfo(sock, title = '⚔️ NusaBot RPG', body = 'Adventure awaits!') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    // 🔥 FIX: Ambil gambar dari URL
    const rpgThumbBuffer = await loadImage('zerotwo-rpg.jpg');
    
    let mediaAttachment = null
    if (rpgThumbBuffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: rpgThumbBuffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[ContextHelper] Gagal upload rpg thumbnail:', e.message)
        }
    }

    return {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title,
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: body
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `⚔️ ${config.bot?.name || 'NusaBot'} ⚔️`
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Menu',
                            id: '.menu'
                        })
                    }
                ]
            }),
            contextInfo: {
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

function checkFastAnswer(session) {
    if (!session?.startTime) return { isFast: false }
    
    const elapsed = Date.now() - session.startTime
    
    if (elapsed <= FAST_ANSWER_THRESHOLD) {
        return {
            isFast: true,
            elapsed: elapsed,
            praise: getRandomPraise(),
            bonus: FAST_ANSWER_BONUS
        }
    }
    
    return { isFast: false, elapsed: elapsed }
}

function createFakeQuoted(botName = 'NusaBot', verified = true) {
    return {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            contactMessage: {
                displayName: verified ? `✅ ${botName}` : botName,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nORG:${verified ? 'Verified Bot' : 'Bot'}\nEND:VCARD`
            }
        }
    }
}

module.exports = {
    getGameContextInfo,
    getWinnerContextInfo,
    getRpgContextInfo,
    createFakeQuoted,
    checkFastAnswer,
    getRandomPraise,
    FAST_ANSWER_THRESHOLD,
    FAST_ANSWER_BONUS,
    FAST_ANSWER_PRAISES
}
