const axios = require('axios')
const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-zerotwoMD'

const pluginConfig = {
    name: 'film',
    alias: ['movie', 'nonton', 'lk21'],
    category: 'search',
    description: 'Cari film dan nonton online',
    usage: '.film <judul>',
    example: '.film civil war',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const filmSessions = new Map()

// 🔥 HAPUS TOP-LEVEL thumbFilm

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title, body, thumbnail) {
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
    const thumb = thumbnail || (await loadImage('zerotwo-film.jpg'))
    if (thumb) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumb,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function handler(m, { sock }) {
    const args = m.args || []
    const query = args.join(' ').trim()
    
    if (!query) {
        return m.reply(
            `🎬 *ꜰɪʟᴍ sᴇᴀʀᴄʜ*\n\n` +
            `> Cari dan nonton film online\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}film <judul>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}film civil war\``
        )
    }
    
    m.react('🎬')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/film?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Film "${query}" tidak ditemukan`)
        }
        
        const films = data.data.slice(0, 10)
        
        filmSessions.set(m.sender, {
            films,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            filmSessions.delete(m.sender)
        }, 300000)
        
        let text = `🎬 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n`
        text += `> Ditemukan *${films.length}* film untuk "${query}"\n\n`
        
        films.forEach((f, i) => {
            text += `*${i + 1}. ${f.title}*\n`
            text += `> ⭐ ${f.rating} | 📺 ${f.quality} | 📅 ${f.release}\n\n`
        })
        
        text += `> _Pilih film dari list di bawah_`
        
        const listItems = films.map((f, i) => ({
            header: '',
            title: f.title,
            description: `⭐ ${f.rating} | ${f.quality} | ${f.release}`,
            id: `${m.prefix}filmget ${f.url}`
        }))

        // 🔥 FIX: await getContextInfo
        const contextInfo = await getContextInfo('🎬 FILM', `${films.length} hasil`)
        
        await sock.sendMessage(m.chat, {
            text,
            footer: '🎬 Film Search',
            contextInfo: contextInfo,
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '🎬 Pilih Film',
                        sections: [
                            {
                                title: 'Hasil Pencarian',
                                rows: listItems
                            }
                        ]
                    })
                }
            ]
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