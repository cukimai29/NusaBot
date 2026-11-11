const config = require('../../config')
const fs = require("fs")
const axios = require('axios')

// ===== DAFTAR COMMAND UNTUK MUSIC (MIRIP KAYAK RANDOMNIME) =====
const musicCommands = []
for (let i = 1; i <= 65; i++) {
    musicCommands.push(`music${i}`)
}

const pluginConfig = {
    name: musicCommands,  // 👈 INI YANG BUAT MUNCUL SEMUA DI MENU
    alias: [],
    category: 'media',
    description: 'Koleksi musik 1-65',
    usage: '.music1 sampai .music65',
    example: '.music1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    
    if (!command || !command.startsWith('music')) {
        return m.reply(
            `🎵 *ᴍᴜsɪᴄ ᴄᴏʟʟᴇᴄᴛɪᴏɴ*\n\n` +
            `> Tersedia: music1 - music65\n` +
            `> Contoh: \`${m.prefix}music1\``
        )
    }
    
    const num = parseInt(command.replace('music', ''))
    if (isNaN(num) || num < 1 || num > 65) {
        return m.reply(`❌ Pilihan tidak valid. Gunakan music1 sampai music65.`)
    }
    
    await m.react('🕕')
    
    const musicUrl = `https://raw.githubusercontent.com/Rez4-3yz/Music-rd/master/music/music${num}.mp3`
    
    try {
        const response = await axios.get(musicUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        })

        if (response.status !== 200) {
            throw new Error('Gagal mengambil musik')
        }

        await sock.sendMessage(m.chat, {
            audio: Buffer.from(response.data),
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🎵 Music #${num}`,
                    body: config.bot?.name || 'NusaBot',
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    thumbnail: fs.readFileSync('./assets/images/zerotwo2.jpg'),
                    sourceUrl: config.info?.website || 'https://github.com',
                }
            }
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (err) {
        console.error('[Music Error]', err)
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Musik tidak ditemukan atau gagal diambil.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}