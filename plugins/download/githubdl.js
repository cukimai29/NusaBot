const config = require('../../config')
const { loadImage } = require('../../src/lib/assetLoader') // 🔥 IMPORT HELPER
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'githubdl',
    alias: ['gitdl', 'gitclone', 'repodownload'],
    category: 'download',
    description: 'Download repository GitHub sebagai ZIP',
    usage: '.githubdl <user> <repo> <branch>',
    example: '.githubdl niceplugin NiceBot main',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

// 🔥 HAPUS TOP-LEVEL thumbTools

// 🔥 FIX: Jadikan async karena perlu await loadImage
async function getContextInfo(title = '📥 *ɢɪᴛʜᴜʙ ᴅʟ*', body = 'Repository downloader') {
    const saluranId = config.saluran?.id || '120363402057133599@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot'
    
    const contextInfo = {
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
        const thumbTools = await loadImage('zerotwo-games.jpg')
        if (thumbTools) {
            contextInfo.externalAdReply = {
                title: title,
                body: body,
                thumbnail: thumbTools,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: config.saluran?.link || ''
            }
        }
    } catch (e) {}
    
    return contextInfo
}

async function handler(m, { sock }) {
    const args = m.args || []
    let username, repo, branch
    
    if (args[0]?.includes('github.com')) {
        const urlMatch = args[0].match(/github\.com\/([^\/]+)\/([^\/]+)/i)
        if (urlMatch) {
            username = urlMatch[1]
            repo = urlMatch[2].replace(/\.git$/, '')
            branch = args[1] || 'main'
        }
    } else {
        username = args[0]
        repo = args[1]
        branch = args[2] || 'main'
    }
    
    if (!username) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}githubdl <user> <repo> <branch>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}githubdl niceplugin NiceBot main\`\n` +
            `> \`${m.prefix}githubdl https://github.com/user/repo\``
        )
    }
    
    if (!repo) {
        return m.reply(`❌ *ʀᴇᴘᴏ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n> Masukkan nama repository`)
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴɢᴀᴍʙɪʟ ɪɴꜰᴏ ʀᴇᴘᴏ...*`)
    
    try {
        const repoInfo = await fetch(`https://api.github.com/repos/${username}/${repo}`)
        
        if (!repoInfo.ok) {
            await m.react('❌')
            return m.reply(`❌ *ʀᴇᴘᴏ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> \`${username}/${repo}\` tidak ada`)
        }
        
        const repoData = await repoInfo.json()
        const defaultBranch = repoData.default_branch || 'main'
        branch = branch || defaultBranch
        
        const zipUrl = `https://github.com/${username}/${repo}/archive/refs/heads/${branch}.zip`
        
        const checkRes = await fetch(zipUrl, { method: 'HEAD' })
        if (!checkRes.ok) {
            await m.react('❌')
            return m.reply(`❌ *ʙʀᴀɴᴄʜ ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n> Branch \`${branch}\` tidak ditemukan\n> Default: \`${defaultBranch}\``)
        }
        
        const text = `📥 *ɢɪᴛʜᴜʙ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `╭┈┈⬡「 📦 *ʀᴇᴘᴏ* 」\n` +
            `┃ 📁 ${repoData.full_name}\n` +
            `┃ 📝 ${repoData.description?.slice(0, 40) || '-'}\n` +
            `┃ 🌿 Branch: ${branch}\n` +
            `┃ ⭐ Stars: ${repoData.stargazers_count}\n` +
            `┃ 🍴 Forks: ${repoData.forks_count}\n` +
            `┃ 📏 Size: ${(repoData.size / 1024).toFixed(2)} MB\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Downloading...`

        // 🔥 FIX: await getContextInfo
        const ctxStart = await getContextInfo('📥 *ɢɪᴛʜᴜʙ ᴅʟ*', repoData.full_name)
        
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: ctxStart
        }, { quoted: m })

        // 🔥 FIX: await getContextInfo
        const ctxDoc = await getContextInfo('📥 *ɢɪᴛʜᴜʙ ᴅʟ*', `${repo}-${branch}.zip`)

        await sock.sendMessage(m.chat, {
            document: { url: zipUrl },
            fileName: `${repo}-${branch}.zip`,
            mimetype: 'application/zip',
            contextInfo: ctxDoc
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}