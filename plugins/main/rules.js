const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'rules',
    alias: ['aturanbot', 'botrules'],
    category: 'main',
    description: 'Menampilkan rules/aturan bot',
    usage: '.rules',
    example: '.rules',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const DEFAULT_BOT_RULES = `╭━━━〔 ❤️ 𝗭𝗘𝗥𝗢 𝗧𝗪𝗢 𝗕𝗢𝗧 𝗥𝗨𝗟𝗘𝗦 ❤️ 〕━━⬣
┃
┃ Hai Darling~
┃ Sebelum memakai bot ini
┃ baca aturan dari Zero Two ya 😋
┃
┃ 1️⃣ Jangan spam command
┃ 2️⃣ Gunakan fitur dengan bijak
┃ 3️⃣ Dilarang menyalahgunakan bot
┃ 4️⃣ Hormati sesama pengguna
┃ 5️⃣ Jangan flood / bug bot
┃ 6️⃣ Report bug ke owner
┃ 7️⃣ Jangan kirim virus / exploit
┃
┃ Jika melanggar rules
┃ Zero Two bisa blacklist kamu
┃ selama 30 hari 🚫
┃
╰━━━━━━━━━━━━━━━━⬣

💡 Jika ada yang menyalahgunakan bot
silakan klik tombol *Lapor Owner* di bawah ini.`

async function handler(m, { sock, config: botConfig }) {

    const db = getDatabase()
    const customRules = db.setting('botRules')
    const rulesText = customRules || DEFAULT_BOT_RULES

    // 🔥 FIX: Ambil gambar dari URL
    let imageBuffer = null
    try {
        imageBuffer = await loadImage('zerotwo-rules.jpg')
    } catch (e) {}

    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot'

    const ownerNumber = (config.owner?.[0] || '').replace(/[^0-9]/g,'')
    const reportText = encodeURIComponent('Bang ada yg menyalahgunakan bot Zero two')

    const reportLink = `https://wa.me/${ownerNumber}?text=${reportText}`

    const buttons = [
        {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '🚨 Lapor Owner',
                url: reportLink
            })
        }
    ]

    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: rulesText,
            footer: botConfig.bot?.name || "NusaBot",
            interactiveButtons: buttons,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })

    } else {
        await sock.sendMessage(m.chat, {
            text: rulesText,
            footer: botConfig.bot?.name || "NusaBot",
            interactiveButtons: buttons
        }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_BOT_RULES
}