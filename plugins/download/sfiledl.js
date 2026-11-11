const sfile = require('../../src/scraper/sfiledl')
const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'sfiledl',
    alias: ['sfile', 'sfiledownload'],
    category: 'download',
    description: 'Download file dari Sfile.mobi',
    usage: '.sfiledl <url>',
    example: '.sfiledl https://sfile.mobi/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}sfiledl <url_sfile>\`\n\n` +
            `> Contoh: \`${m.prefix}sfiledl https://sfile.mobi/xxxxx\``
        )
    }

    if (!url.includes('sfile.mobi') && !url.includes('sfile.co')) {
        return m.reply(`❌ URL harus dari sfile.mobi atau sfile.co!`)
    }

    m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴɢᴀᴍʙɪʟ ɪɴꜰᴏ ꜰɪʟᴇ...*`)

    try {
        const result = await sfile(url)

        if (!result.download_url) {
            m.react('❌')
            return m.reply(`❌ Gagal mendapatkan link download. File mungkin tidak tersedia.`)
        }

        const saluranId = config.saluran?.id || '120363402057133599@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'

        const infoText = `╭┈┈⬡「 📁 *sꜰɪʟᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 」
┃
┃ 📝 ɴᴀᴍᴀ: ${result.file_name || 'Unknown'}
┃ 📊 sɪᴢᴇ: ${result.size_from_text || 'Unknown'}
┃ 👤 ᴜᴘʟᴏᴀᴅᴇʀ: ${result.author_name || 'Unknown'}
┃ 📅 ᴛᴀɴɢɢᴀʟ: ${result.upload_date || 'Unknown'}
┃ 📥 ᴅᴏᴡɴʟᴏᴀᴅ: ${result.download_count || '0'}x
┃
╰┈┈⬡

> ⏳ Sedang mengunduh file...`

        await m.reply(infoText)

        const response = await axios.get(result.download_url, {
            responseType: 'arraybuffer',
            timeout: 300000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
                'Referer': url
            }
        })

        const buffer = Buffer.from(response.data)
        const fileName = result.file_name || `sfile_${Date.now()}`

        await sock.sendMessage(m.chat, {
            document: buffer,
            fileName: fileName,
            mimetype: 'application/octet-stream',
            caption: `✅ *ᴅᴏᴡɴʟᴏᴀᴅ sᴇʟᴇsᴀɪ*\n\n> 📁 ${fileName}`,
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
