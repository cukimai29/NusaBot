const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');
const axios = require('axios');

const videoAssets = require('../../assets/video/assets-vd');
const imageAssets = require('../../assets/images/assets-img');

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};


const CATEGORY_EMOJIS = {
    owner: '👑', main: '🌸', utility: '⚡', fun: '🎀', group: '💫',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🧠', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', vps: '🌊'
};


function toZeroTwoStyle(text) {
    const style = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => style[c] || c).join('');
}

function toPremiumBold(text) {
    const chars = {
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
    };
    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
}


const zeroTwoMessages = [
    "▸ *“Aku tidak akan pernah meninggalkanmu, Darling.”* ◂",
    "▸ *“Bersamamu, aku bisa menghadapi apa pun.”* ◂",
    "▸ *“Kamu adalah alasan aku tetap di sini.”* ◂",
    "▸ *“Jangan takut, aku selalu di sisimu.”* ◂",
    "▸ *“Kita adalah partner selamanya, Darling.”* ◂",
    "▸ *“Aku percaya padamu, lebih dari siapa pun.”* ◂",
    "▸ *“Setiap hari bersamamu adalah hadiah.”* ◂",
    "▸ *“Darling, kamu membuatku menjadi lebih kuat.”* ◂"
];

function getRandomZeroTwoMessage() {
    return zeroTwoMessages[Math.floor(Math.random() * zeroTwoMessages.length)];
}

function getSortedCategories(m, botMode) {
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    const categoryOrder = [
        "owner", "main", "utility", "tools", "fun", "game", "download",
        "search", "sticker", "media", "ai", "group", "religi", "info",
        "cek", "economy", "user", "canvas", "random", "premium", "ephoto",
        "jpm", "pushkontak", "panel", "store"
    ];
    
    let modeAllowedMap = {
        md: null,
        cpanel: ["main", "group", "sticker", "owner", "tools", "panel"],
        store: ["main", "group", "sticker", "owner", "store"],
        pushkontak: ["main", "group", "sticker", "owner", "pushkontak"]
    };
    let modeExcludeMap = {
        md: ["panel", "pushkontak", "store"],
        cpanel: null,
        store: null,
        pushkontak: null
    };
    
    try {
        const botmodePlugin = require('../group/botmode');
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES;
            modeAllowedMap = {};
            modeExcludeMap = {};
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories;
                modeExcludeMap[key] = val.excludeCategories;
            }
        }
    } catch (e) {}
    
    const allowedCats = modeAllowedMap[botMode];
    const excludeCats = modeExcludeMap[botMode] || [];
    
    const sortedCats = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    const result = [];
    let totalCmds = 0;
    
    for (const cat of sortedCats) {
        if (cat === "owner" && !m.isOwner) continue;
        if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
        if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
        
        const cmds = commandsByCategory[cat] || [];
        if (cmds.length === 0) continue;
        
        const emoji = CATEGORY_EMOJIS[cat] || "📁";
        result.push({ cat, cmds, emoji });
        totalCmds += cmds.length;
    }
    
    return { sorted: result, totalCmds, commandsByCategory };
}

function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranId = botConfig.saluran?.id || '120363409623385879@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot';
    const saluranLink = botConfig.saluran?.link || '';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `✨ ${botConfig.bot?.name || 'NusaBot'} ✨`,
            body: `“Darling, I'm here for you” • v${botConfig.bot?.version || '1.2.0'}`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail
        }
    };
    
    if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
    return ctx;
}

function getVerifiedQuoted(botConfig) {
    return {
        key: {
            participant: `0@s.whatsapp.net`,
            remoteJid: `status@broadcast`
        },
        message: {
            contactMessage: {
                displayName: `🪸 ${botConfig.bot?.name}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                sendEphemeral: true
            }
        }
    };
}

// ============================================
// 🔥 ASSET LOADER (JPG dari URL + fallback lokal)
// ============================================
const imageCache = new Map()

async function loadImage(name) {
    if (imageCache.has(name)) return imageCache.get(name)

    const url = imageAssets[name]
    if (url && url.startsWith('http')) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            const buf = Buffer.from(res.data)
            imageCache.set(name, buf)
            console.log(`[Menu] ✅ ${name} dari URL`)
            return buf
        } catch (e) {
            console.error(`[Menu] ❌ Gagal download ${name}:`, e.message)
        }
    }

    // Fallback lokal
    try {
        const localPath = path.join(process.cwd(), 'assets', 'images', name)
        if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath)
            imageCache.set(name, buf)
            console.log(`[Menu] 📁 ${name} dari lokal`)
            return buf
        }
    } catch (e) {}

    console.error(`[Menu] ⚠️ ${name} tidak ditemukan`)
    return null
}

// ===== FUNGSI SEND AUDIO (CONVERT KE PTT/VN) — MASIH LOKAL =====
async function sendAudioSimple(sock, m, botConfig) {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');

    try {
        const mp3Path = path.join(process.cwd(), 'assets', 'audio', 'zerotwo.mp3');
        const oggPath = path.join(process.cwd(), 'assets', 'audio', 'zerotwo.ogg');

        if (!fs.existsSync(mp3Path)) {
            console.log('[Menu Audio] File audio tidak ditemukan di:', mp3Path);
            return;
        }

        if (!fs.existsSync(oggPath)) {
            console.log('[Menu Audio] 🔄 Convert MP3 → OGG Opus...');
            try {
                execSync(
                    `ffmpeg -y -i "${mp3Path}" ` +
                    `-c:a libopus -b:a 128k -vbr on -compression_level 10 ` +
                    `-ar 48000 -ac 1 ` +
                    `-application voip ` +
                    `"${oggPath}"`,
                    { stdio: 'ignore', timeout: 120000 }
                );
                console.log('[Menu Audio] ✅ Convert selesai');
            } catch (convErr) {
                console.error('[Menu Audio] ❌ Gagal convert:', convErr.message);
                return;
            }
        }

        const audioBuffer = fs.readFileSync(oggPath);

        if (!audioBuffer || audioBuffer.length < 100) {
            console.log('[Menu Audio] ⚠️ File audio kosong / invalid');
            return;
        }

        await sock.sendMessage(
            m.chat,
            {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            },
            { quoted: m.raw || m }
        );

        console.log('[Menu Audio] ✅ VN (PTT) terkirim');

    } catch (err) {
        console.error('[Menu Audio] Error:', err.message);
    }
}

async function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const timeHelper = require('../../src/lib/timeHelper');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    const { getCaseCount, getCasesByCategory } = require('../../case/zerotwo');
    const totalCases = getCaseCount();
    const casesByCategory = getCasesByCategory();
    
    let userRole = 'User', roleEmoji = '👤';
    if (m.isOwner) { userRole = 'Owner'; roleEmoji = '👑'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    
    let txt = `┌─────────────────────────────────┐\n`;
    txt += `│    ✧  *${toPremiumBold(botConfig.bot?.name || 'NusaBot')}*  ✧    │\n`;
    txt += `│       “ᴛʜᴇ ᴘᴀʀᴛɴᴇʀ ʏᴏᴜ ᴅᴇꜱᴇʀᴠᴇ”       │\n`;
    txt += `└─────────────────────────────────┘\n\n`;
    
    txt += `┌─〔 ✨ *ᴢᴇʀᴏ ᴛᴡᴏ ꜱᴀʏꜱ* 〕\n`;
    txt += `│  ${getRandomZeroTwoMessage()}\n`;
    txt += `└─────────────────────⬣\n\n`;
    
    txt += `┌─〔 🤍 *ʙᴏᴛ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ* 〕\n`;
    txt += `│  ✦ ɴᴀᴍᴀ     : *${toPremiumBold(botConfig.bot?.name || 'NusaBot')}*\n`;
    txt += `│  ✦ ᴠᴇʀꜱɪ    : *v${botConfig.bot?.version || '1.2.0'}*\n`;
    txt += `│  ✦ ᴍᴏᴅᴇ     : *${(botConfig.mode || 'public').toUpperCase()}*\n`;
    txt += `│  ✦ ᴘʀᴇꜰɪx    : *[ ${prefix} ]*\n`;
    txt += `│  ✦ ᴜᴘᴛɪᴍᴇ   : *${uptimeFormatted}*\n`;
    txt += `│  ✦ ᴜꜱᴇʀꜱ    : *${totalUsers} ᴅᴀʀʟɪɴɢꜱ*\n`;
    txt += `│  ✦ ᴍᴏᴅᴇ     : *${botMode.toUpperCase()}*\n`;
    txt += `│  ✦ ᴏᴡɴᴇʀ    : *${botConfig.owner?.name || 'RzkyAds'}*\n`;
    txt += `└─────────────────────⬣\n\n`;
    
    txt += `┌─〔 💗 *ʏᴏᴜʀ ᴘʀᴏꜰɪʟᴇ* 〕\n`;
    txt += `│  ✦ ɴᴀᴍᴀ     : *${m.pushName}*\n`;
    txt += `│  ✦ ʀᴏʟᴇ     : *${roleEmoji} ${userRole}*\n`;
    txt += `│  ✦ ʟɪᴍɪᴛ    : *${m.isOwner || m.isPremium ? '∞ ᴜɴʟɪᴍɪᴛᴇᴅ' : (user?.limit ?? 25)}*\n`;
    txt += `│  ✦ ᴡᴀᴋᴛᴜ    : *${timeStr} WIB*\n`;
    txt += `│  ✦ ᴛᴀɴɢɢᴀʟ  : *${dateStr}*\n`;
    txt += `└─────────────────────⬣\n\n`;
    
    txt += `┌─〔 🎀 *ᴀᴠᴀɪʟᴀʙʟᴇ ᴍᴇɴᴜ* 〕\n`;
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm', 'pushkontak', 'panel', 'store'];
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    };
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    };
    
    try {
        const botmodePlugin = require('../group/botmode');
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES;
            modeAllowedMap = {};
            modeExcludeMap = {};
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories;
                modeExcludeMap[key] = val.excludeCategories;
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode];
    const excludeCategories = modeExcludeMap[botMode] || [];
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue;
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
        
        const pluginCmds = commandsByCategory[category] || [];
        const caseCmds = casesByCategory[category] || [];
        const totalCmds = pluginCmds.length + caseCmds.length;
        if (totalCmds === 0) continue;
        
        const emoji = CATEGORY_EMOJIS[category] || '🎀';
        const categoryName = toZeroTwoStyle(category);
        
        txt += `│  ✧ ${prefix}${toZeroTwoStyle(`menucat ${category}`)} ${emoji} *${categoryName}*\n`;
    }
    
    txt += `└─────────────────────⬣\n\n`;
    txt += `┌─〔 💕 *ᴢᴇʀᴏ ᴛᴡᴏ'ꜱ ʜᴇᴀʀᴛ* 〕\n`;
    txt += `│  “Ketik *${prefix}menu* kapan saja, Darling~\n`;
    txt += `│   Aku akan selalu ada untukmu.”\n`;
    txt += `└─────────────────────⬣\n`;
    
    return txt;
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = await buildMenuText(m, botConfig, db, uptime, botMode);
    
    // 🔥 Load image & thumbnail dari URL
    const imageBuffer = await loadImage('zerotwo-v5.jpg');
    const thumbBuffer = await loadImage('zerotwo2.jpg');
    
    const { sorted: menuSorted, totalCmds } = getSortedCategories(m, botMode);
    const prefix = botConfig.command?.prefix || '.';
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot';
    const saluranLink = botConfig.saluran?.link || '';
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                const msgV2 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                
                // 🔥 Load zerotwo.jpg dari URL
                let contextThumb = thumbBuffer;
                try {
                    const ztBuffer = await loadImage('zerotwo.jpg');
                    if (ztBuffer) contextThumb = ztBuffer;
                } catch (e) {}
                
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `✨ ᴢᴇʀᴏ ᴛᴡᴏ - ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ ✨`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 4: {
                const videoUrlV4 = videoAssets['zerotwo.mp4'] || videoAssets['zerotwo-v16.mp4'];
                if (videoUrlV4) {
                    try {
                        const response = await axios.get(videoUrlV4, { responseType: 'arraybuffer' });
                        const videoBufferV4 = Buffer.from(response.data);
                        
                        await sock.sendMessage(m.chat, {
                            video: videoBufferV4,
                            caption: text,
                            gifPlayback: true,
                            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                        }, { quoted: getVerifiedQuoted(botConfig) });
                    } catch (err) {
                        console.error('[Menu V4] Gagal download video:', err.message);
                        const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                        if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                        else { fallback.text = text; }
                        await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                    }
                } else {
                    const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                    else { fallback.text = text; }
                    await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
                
            case 5: {
                const categoryRows = menuSorted.map(({ cat, cmds, emoji }) => ({
                    header: `${emoji} ${toPremiumBold(cat)}`,
                    id: `${prefix}menucat ${cat}`,
                    title: `💕 ${cmds.length} Perintah untukmu 💕`,
                    description: 'Tap untuk membuka menu ini, Darling~'
                }));
                
                let headerMedia = null;
                if (imageBuffer) {
                    try {
                        headerMedia = await prepareWAMessageMedia(
                            { image: imageBuffer },
                            { upload: sock.waUploadToServer }
                        );
                    } catch (e) {
                        console.log('[Menu V5] Gagal upload gambar:', e.message);
                    }
                }
                
                const menuBox = `╭───〔 🎀 *ᴢᴇʀᴏ ᴛᴡᴏ ᴍᴇɴᴜ* 🎀 〕───⬣
│
│  ✨ *Halo ${m.pushName}* ✨
│  ${getRandomZeroTwoMessage()}
│
│  ╭━━━〔 🤍 *ɪɴꜰᴏʀᴍᴀꜱɪ ʙᴏᴛ* 〕━━━⬣
│  ┃ 🤖 *Nama:* ${botConfig.bot?.name || 'NusaBot'}
│  ┃ 👑 *Owner:* ${botConfig.owner?.name || 'RzkyAds'}
│  ┃ 📌 *Prefix:* ${prefix}
│  ┃ 📋 *Total Command:* ${totalCmds}
│  ┃ 🎭 *Role:* ${m.isOwner ? '👑 Owner' : m.isPremium ? "💎 Premium" : "🌸 User"}
│  ╰━━━━━━━━━━━━━━━━⬣
│
│  💕 *“Aku percaya padamu, Darling~”*
│  🎀 *Silahkan pilih kategori di bawah!*
│
╰────────────────⬣`
                
                const interactiveMsg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                header: proto.Message.InteractiveMessage.Header.fromObject({
                                     title: `${botConfig.bot?.name || 'NusaBot'} - MENU`,
                                    hasMediaAttachment: !!headerMedia,
                                    ...(headerMedia || {})
                                }),
                                body: proto.Message.InteractiveMessage.Body.fromObject({
                                     text: `✨ *${botConfig.bot?.name || 'NusaBot'}* ✨\n© ${botConfig.bot?.developer || 'RzkyADS'} ${new Date().getFullYear()}`
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                    text: menuBox
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                    messageParamsJson: JSON.stringify({
                                        limited_time_offer: {
                                             text: '📋 NusaBot Menu',
                                            url: saluranLink,
                                            copy_code: '✨ Darling ✨',
                                            expiration_time: Date.now() * 999
                                        },
                                        bottom_sheet: {
                                            in_thread_buttons_energi: 2,
                                            divider_indices: [1, 2, 999],
                                            list_title: '🎀 Pilih Menu',
                                            button_title: '🌸 Pilih Disini'
                                        }
                                    }),
                                    buttons: [
                                        {
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify({
                                                title: "🎀 Pilihan Menu Darling 🎀",
                                                sections: [{
                                                    title: `💕 ${botConfig.bot?.name || 'NusaBot'} - Pilih Kategori 💕`,
                                                    highlight_label: botConfig.bot?.name || 'NusaBot',
                                                    rows: categoryRows
                                                }]
                                            })
                                        },
                                        {
                                            name: 'cta_url',
                                            buttonParamsJson: JSON.stringify({
                                                display_text: '🌏 ᴋᴜɴᴊᴜɴɢɪ ꜱᴀʟᴜʀᴀɴ ᴋᴜ',
                                                url: saluranLink,
                                                merchant_url: saluranLink
                                            })
                                        },
                                        {
                                            name: 'quick_reply',
                                            buttonParamsJson: JSON.stringify({
                                                display_text: '💕 ᴛᴏᴛᴀʟ ꜰɪᴛᴜʀ',
                                                id: `${prefix}totalfitur`
                                            })
                                        },
                                        {
                                            name: 'quick_reply',
                                            buttonParamsJson: JSON.stringify({
                                                display_text: '🌸 ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ',
                                                id: `${prefix}allmenu`
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
                }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                
                await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });
                break;
            }
                
            case 6: {
                try {
                    let headerMedia = null;
                    // 🔥 Load zerotwo-v5.jpg dari URL
                    let bigImageBuffer = await loadImage('zerotwo-v5.jpg');
                    
                    if (!bigImageBuffer && imageBuffer) {
                        bigImageBuffer = imageBuffer;
                    }
                    
                    if (bigImageBuffer) {
                        try {
                            const resizedImage = await sharp(bigImageBuffer)
                                .resize(800, 600, { fit: 'cover' })
                                .jpeg({ quality: 90 })
                                .toBuffer();
                            
                            headerMedia = await prepareWAMessageMedia(
                                { image: resizedImage },
                                { upload: sock.waUploadToServer }
                            );
                        } catch (e) {
                            console.log('[Menu V6] Gagal upload gambar:', e.message);
                        }
                    }
                    
                    const fullCaption = text;
                    
                    const interactiveMsg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                         title: `${botConfig.bot?.name || 'NusaBot'} - ALL MENU`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                         text: `✨ *${botConfig.bot?.name || 'NusaBot'}* ✨\n© ${botConfig.bot?.developer || 'RzkyADS'} ${new Date().getFullYear()}`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: fullCaption
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                 text: '📋 NusaBot Menu',
                                                url: saluranLink,
                                                copy_code: '✨ Darling ✨',
                                                expiration_time: Date.now() * 999
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_energi: 2,
                                                divider_indices: [1, 2, 999],
                                                list_title: '🎀 Pilih Menu',
                                                button_title: '🌸 Pilih Disini'
                                            }
                                        }),
                                        buttons: [
                                            {
                                                name: 'cta_url',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '🌏 ᴋᴜɴᴊᴜɴɢɪ ꜱᴀʟᴜʀᴀɴ ᴋᴜ',
                                                    url: saluranLink,
                                                    merchant_url: saluranLink
                                                })
                                            },
                                            {
                                                name: 'quick_reply',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '💕 ᴘᴇᴍɪʟɪᴋ ʙᴏᴛ',
                                                    id: `${prefix}owner`
                                                })
                                            },
                                            {
                                                name: 'quick_reply',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '🌸 ᴍᴇɴᴜ',
                                                    id: `${prefix}menu`
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
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });
                    
                } catch (v6Error) {
                    console.error('[Menu V6] Error:', v6Error);
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; }
                    else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
                
            case 7: {
                try {
                    const carouselCards = [];
                    for (const { cat, cmds, emoji } of menuSorted) {
                        const categoryName = toZeroTwoStyle(cat);
                        let cardBody = `┌─〔 ${emoji} *${toPremiumBold(cat)}* 〕\n`;
                        for (const cmd of cmds.slice(0, 15)) {
                            cardBody += `│  ✧ \`${prefix}${toZeroTwoStyle(cmd)}\`\n`;
                        }
                        if (cmds.length > 15) {
                            cardBody += `│\n│  _...dan ${cmds.length - 15} command lainnya_\n`;
                        }
                        cardBody += `│\n└─ *${cmds.length} commands available*\n`;
                        
                        let cardMedia = null;
                        try {
                            // 🔥 Load zerotwo-menu.jpg dari URL
                            let sourceImage = await loadImage('zerotwo-menu.jpg');
                            if (!sourceImage) sourceImage = thumbBuffer;
                            if (sourceImage) {
                                const resizedImage = await sharp(sourceImage)
                                    .resize(300, 300, { fit: 'cover' })
                                    .jpeg({ quality: 80 })
                                    .toBuffer();
                                cardMedia = await prepareWAMessageMedia({
                                    image: resizedImage
                                }, { upload: sock.waUploadToServer });
                            }
                        } catch (e) {}
                        
                        const cardMessage = {
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `${emoji} ${categoryName.toUpperCase()}`,
                                hasMediaAttachment: !!cardMedia,
                                ...(cardMedia || {})
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: cardBody
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `✨ ${botConfig.bot?.name || 'NusaBot'} • ${cat} ✨`
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: `💕 ʟɪʜᴀᴛ ${categoryName}`,
                                        id: `${prefix}menucat ${cat}`
                                    })
                                }]
                            })
                        };
                        carouselCards.push(cardMessage);
                    }
                    
                    if (carouselCards.length === 0) {
                        await m.reply(text);
                        break;
                    }
                    
                    const msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `${greeting} *${m.pushName}!* ${getRandomZeroTwoMessage()}`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `✨ ${botConfig.bot?.name || 'NusaBot'} v${botConfig.bot?.version || '1.0'} ✨`
                                    }),
                                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                        cards: carouselCards
                                    })
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                } catch (carouselError) {
                    const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV7.image = imageBuffer; fallbackV7.caption = text; }
                    else { fallbackV7.text = text; }
                    await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 8: {
                const timeHelperV8 = require('../../src/lib/timeHelper');
                const timeV8 = timeHelperV8.formatTime('HH:mm');
                const dateV8 = timeHelperV8.formatFull('DD/MM/YYYY');
                const userV8 = db.getUser(m.sender);
                
                let roleV8 = '𝙐𝙨𝙚𝙧', emojiV8 = '◈';
                if (m.isOwner) { roleV8 = '𝙊𝙬𝙣𝙚𝙧'; emojiV8 = '♚'; }
                else if (m.isPremium) { roleV8 = '𝙋𝙧𝙚𝙢𝙞𝙪𝙢'; emojiV8 = '✦'; }
                
                let menuV8 = ``;
                const sparkles = ['✦', '✧', '⋆', '˚', '✵', '⊹', '💕', '🌸', '✨'];
                const randomSparkle = () => sparkles[Math.floor(Math.random() * sparkles.length)];
                
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n`;
                menuV8 += `*${toPremiumBold(botConfig.bot?.name || 'NusaBot')}*\n`;
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n\n`;
                menuV8 += `┏━━━〔 ${emojiV8} *ᴢᴇʀᴏ ᴛᴡᴏ ᴘʀᴏꜰɪʟᴇ* 〕━━━┓\n`;
                menuV8 += `┃ 👤 *${m.pushName}*\n`;
                menuV8 += `┃ 🏷️ ${roleV8}\n`;
                menuV8 += `┃ ⏰ ${timeV8} WIB\n`;
                menuV8 += `┃ 📅 ${dateV8}\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━┛\n\n`;
                menuV8 += `┏━━〔 ⚡ *ꜱʏꜱᴛᴇᴍ ꜱᴛᴀᴛᴜꜱ* 〕━━┓\n`;
                menuV8 += `┃ 🎫 ʟɪᴍɪᴛ   ➤ ${m.isOwner || m.isPremium ? '∞ ᴜɴʟɪᴍɪᴛᴇᴅ' : `${userV8?.limit ?? 25}/25`}\n`;
                menuV8 += `┃ ⏱️ ᴜᴘᴛɪᴍᴇ  ➤ ${uptimeFormatted}\n`;
                menuV8 += `┃ 🔧 ᴍᴏᴅᴇ    ➤ ${botMode.toUpperCase()}\n`;
                menuV8 += `┃ 📊 ᴛᴏᴛᴀʟ   ➤ ${totalCmds} ᴄᴏᴍᴍᴀɴᴅꜱ\n`;
                menuV8 += `┃ 👥 ᴜꜱᴇʀꜱ   ➤ ${db.getUserCount()} ᴅᴀʀʟɪɴɢꜱ\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                menuV8 += `╭══════════════════════╮\n`;
                menuV8 += `║  📋 *ᴄᴏᴍᴍᴀɴᴅ ʟɪꜱᴛ*    ║\n`;
                menuV8 += `╰══════════════════════╯\n\n`;
                
                for (const { cat, cmds, emoji } of menuSorted) {
                    menuV8 += `┌─────「 ${emoji} *${toPremiumBold(cat)}* 」\n`;
                    menuV8 += `│ ✦ ᴛᴏᴛᴀʟ: ${cmds.length} ᴄᴏᴍᴍᴀɴᴅꜱ\n│\n`;
                    for (const cmd of cmds.slice(0, 10)) {
                        menuV8 += `│ ├➤ ${prefix}${cmd}\n`;
                    }
                    if (cmds.length > 10) {
                        menuV8 += `│ └➤ _...dan ${cmds.length - 10} lainnya_\n`;
                    }
                    menuV8 += `│\n└───────────────────\n\n`;
                }
                
                menuV8 += `╭━━〔 💕 *ᴢᴇʀᴏ ᴛᴡᴏ'ꜱ ᴡᴏʀᴅꜱ* 〕━━╮\n`;
                menuV8 += `│  ${getRandomZeroTwoMessage()}\n`;
                menuV8 += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                menuV8 += `> ${randomSparkle()} *${botConfig.bot?.name}* v${botConfig.bot?.version || '1.7.1'} ${randomSparkle()}`;
                
                let thumbV8 = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        thumbV8 = await sharp(thumbBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
                    } catch (e) { thumbV8 = thumbBuffer; }
                }
                
                const ftroliQuoted = {
                    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            orderId: '1337',
                            thumbnail: thumbV8 || null,
                            itemCount: totalCmds,
                            status: 'INQUIRY',
                            surface: 'CATALOG',
                            message: `✨ ${botConfig.bot?.name || 'NusaBot'} Menu ✨`,
                            orderTitle: `💕 ${totalCmds} Commands for You`,
                            sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                            token: 'zerotwo-menu-v8',
                            totalAmount1000: 0,
                            totalCurrencyCode: 'IDR',
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 9999,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: botConfig.saluran?.id || '120363402057133599@newsletter',
                                    newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot',
                                    serverMessageId: 127
                                }
                            }
                        }
                    }
                };
                
                // 🔥 Load zerotwo-menu.jpg dari URL
                let menuV8Image = await loadImage('zerotwo-menu.jpg');
                if (!menuV8Image) menuV8Image = imageBuffer;
                
                await sock.sendMessage(m.chat, {
                    image: menuV8Image,
                    caption: menuV8,
                    contextInfo: getContextInfo(botConfig, m, imageBuffer, true)
                }, { quoted: ftroliQuoted });
                break;
            }
            
            case 9: {
                try {
                    const zannerz = "https://wa.me/" + (config.owner?.number?.[0] || '6281234567890');
                    const buttonsV9 = [
                        { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "💕 ᴏᴡɴᴇʀ ᴋᴜ", url: zannerz, merchant_url: zannerz }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌸 ᴛᴀᴍᴘɪʟᴋᴀɴ ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ", id: `${prefix}allmenu` }) }
                    ];
                    
                    let headerMediaV9 = null;
                    if (imageBuffer) {
                        try {
                            const resizedV9 = await sharp(imageBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
                            headerMediaV9 = await prepareWAMessageMedia({ image: resizedV9 }, { upload: sock.waUploadToServer });
                        } catch (e) {}
                    }
                    
                    const msgV9 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: text }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `✨ ${botConfig.bot?.name || 'NusaBot'} v${botConfig.bot?.version || '1.9.0'} | “Aku bersamamu, Darling” ✨` }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: !!headerMediaV9, ...(headerMediaV9 || {}) }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: { text: `💕 ${botConfig.bot?.name || 'NusaBot'} selalu untukmu 💕`, url: saluranLink, copy_code: botConfig.owner?.name || 'RzkyAds', expiration_time: Date.now() * 999 },
                                            bottom_sheet: { in_thread_buttons_energi: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: botConfig.bot?.name || 'NusaBot', button_title: '🎀 ᴘɪʟɪʜ ᴋᴀᴛᴇɢᴏʀɪ ᴅᴀʀʟɪɴɢ 🎀' }
                                        }),
                                        buttons: buttonsV9
                                    }),
                                    contextInfo: { mentionedJid: [m.sender], forwardingScore: 9999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV9.message, { messageId: msgV9.key.id });
                } catch (v9Error) {
                    const fallbackV9 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV9.image = imageBuffer; fallbackV9.caption = text; }
                    else { fallbackV9.text = text; }
                    await sock.sendMessage(m.chat, fallbackV9, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 10: {
                try {
                    let totalCmdV10 = totalCmds;
                    const { getCaseCount } = require('../../case/zerotwo');
                    totalCmdV10 += getCaseCount();
                    
                    let productImageV10 = null;
                    try {
                        const imgBufferV10 = imageBuffer || thumbBuffer;
                        if (imgBufferV10) {
                            const resizedV10 = await sharp(imgBufferV10).resize(736, 890, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
                            productImageV10 = await prepareWAMessageMedia({ image: resizedV10 }, { upload: sock.waUploadToServer });
                        }
                    } catch (e) {}
                    
                    const footerTextV10 = `Hai *${m.pushName}* 💕\n${getRandomZeroTwoMessage()}\n✨ ɴᴀᴍᴀ : ${botConfig.bot?.name || 'NusaBot'}\n✨ ᴠᴇʀꜱɪ : v${botConfig.bot?.version || '1.9.0'}\n✨ ᴏᴡɴᴇʀ : ${botConfig.owner?.name || 'RzkyAds'}\n💕 Klik tombol di bawah, Darling~`;
                    const buttonsV10 = [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `🌸 ${botConfig.bot?.name || 'NusaBot'} - ʟɪʜᴀᴛ ᴍᴇɴᴜ 🌸`, id: `${prefix}allmenu` }) }];
                    const businessJid = botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : (m.botJid || sock.user?.id);
                    
                    const msgV10 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `💕 ${botConfig.bot?.name || 'NusaBot'} Menu 💕`,
                                        hasMediaAttachment: !!productImageV10,
                                        productMessage: {
                                            product: { productImage: productImageV10?.imageMessage || null, productId: `✨ NUSABOT MENU ✨`, title: `${botConfig.bot?.name || 'NusaBot'} - For You, Darling`, description: '✨ Premium Menu ✨', currencyCode: 'USD', priceAmount1000: '1000000000000000', retailerId: botConfig.bot?.name || 'NusaBot', productImageCount: 1 },
                                            businessOwnerJid: businessJid
                                        }
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: `✨ *${botConfig.bot?.name || 'NusaBot'} © 2026* ✨` }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footerTextV10 }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: buttonsV10 }),
                                    contextInfo: { mentionedJid: [m.sender], forwardingScore: 9999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV10.message, { messageId: msgV10.key.id });
                } catch (v10Error) {
                    const fallbackV10 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV10.image = imageBuffer; fallbackV10.caption = text; }
                    else { fallbackV10.text = text; }
                    await sock.sendMessage(m.chat, fallbackV10, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 11: {
                try {
                    const categoryRows = menuSorted.map(({ cat, cmds, emoji }) => ({
                        header: `${toPremiumBold('✨ ' + cat + ' MENU ✨')}`,
                        id: `${prefix}menucat ${cat}`,
                        title: `💕 ${cmds.length} Perintah untukmu 💕`,
                        description: 'Tap untuk membuka menu ini, Darling~'
                    }));
                    
                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: `Halo *${m.pushName}* 💕\n${getRandomZeroTwoMessage()}\n╭─ \`✨ ɪɴꜰᴏʀᴍᴀꜱɪ ʙᴏᴛ ✨\`\n│  ✦ ɴᴀᴍᴀ ʙᴏᴛ : *${toPremiumBold(botConfig.bot?.name || 'NusaBot')}*\n│  ✦ ᴏᴡɴᴇʀ ʙᴏᴛ : *${botConfig.owner?.name || 'RzkyAds'}*\n│  ✦ ᴘʀᴇꜰɪx : *${prefix}*\n│  ✦ ᴛᴏᴛᴀʟ ᴘᴇʀɪɴᴛᴀʜ : *${totalCmds}*\n│  ✦ ʀᴏʟᴇ ᴋᴀᴍᴜ : ${m.isOwner ? '👑 Owner' : m.isPremium ? "💎 Premium" : "🌸 User"}\n╰─────\n✨ silahkan tekan tombol di bawah, Darling~✨`,
                            footer: `💕 ${botConfig.bot?.name || 'NusaBot'} - “Aku akan selalu ada untukmu” 💕`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'image/png',
                            fileName: `✨ ${greeting}, Darling~ ✨`,
                            jpegThumbnail: await sharp(thumbBuffer || imageBuffer).resize(300, 300).toBuffer(),
                            contextInfo: { mentionedJid: [m.sender], forwardingScore: 777, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } },
                            externalAdReply: { title: `✨ ${botConfig.bot?.name || 'NusaBot'} ✨`, body: `💕 ${getRandomZeroTwoMessage()} 💕`, mediaType: 1, thumbnail: thumbBuffer || imageBuffer, mediaUrl: saluranLink, sourceUrl: saluranLink, renderLargerThumbnail: true },
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({ limited_time_offer: { text: `💕 ${getRandomZeroTwoMessage()} 💕`, url: saluranLink, copy_code: botConfig.bot?.name || 'NusaBot', expiration_time: Date.now() * 999 }, bottom_sheet: { in_thread_buttons_limit: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: "🎀 Pilih Menu Darling 🎀", button_title: "🌸 Pilih Menu Disini 🌸" } }),
                                buttons: [
                                    { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                                    { name: "single_select", buttonParamsJson: JSON.stringify({ title: "🎀 Pilihan Menu Darling 🎀", sections: [{ title: `💕 ${botConfig.bot?.name || 'NusaBot'} - Pilih Kategori 💕`, highlight_label: botConfig.bot?.name || 'NusaBot', rows: categoryRows }], has_multiple_buttons: true }) },
                                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌏 ᴋᴜɴᴊᴜɴɢɪ ꜱᴀʟᴜʀᴀɴ ᴋᴜ', url: saluranLink, merchant_url: saluranLink }) },
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💕 ᴘᴇᴍɪʟɪᴋ ʙᴏᴛ', id: `${prefix}owner` }) },
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🌸 ʟɪʜᴀᴛ ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ', id: `${prefix}allmenu` }) }
                                ]
                            }
                        }
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } catch (v11Error) {
                    const fallbackV11 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV11.image = imageBuffer; fallbackV11.caption = text; }
                    else { fallbackV11.text = text; }
                    await sock.sendMessage(m.chat, fallbackV11, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 12: {
                try {
                    let menuList = "";
                    const sortedCategories = getSortedCategories(m, botMode);
                    
                    for (const { cat, cmds, emoji } of sortedCategories.sorted) {
                        const categoryName = toZeroTwoStyle(cat);
                        menuList += `╭─☰ ${emoji} *${toPremiumBold(categoryName)}*\n`;
                        for (const cmd of cmds.slice(0, 15)) {
                            menuList += `│  ✧ \`${prefix}${cmd}\`\n`;
                        }
                        if (cmds.length > 15) {
                            menuList += `│  _...dan ${cmds.length - 15} lainnya_\n`;
                        }
                        menuList += `╰─┈┈\n\n`;
                    }
                    
                    const readmore = String.fromCharCode(8206).repeat(4001);
                    
                    let headerMedia = null;
                    if (imageBuffer) {
                        try {
                            headerMedia = await prepareWAMessageMedia(
                                { image: imageBuffer },
                                { upload: sock.waUploadToServer }
                            );
                        } catch (e) {
                            console.log('[Menu V12] Gagal upload gambar:', e.message);
                        }
                    }
                    
                    const user = db.getUser(m.sender) || {};
                    const bodyText = `🌸 *Hello Darling~* 🌸

Welcome to *${botConfig.bot?.name || 'NusaBot'}*, partner setiamu! 💕

╭━━〔 🤍 *BOT INFORMATION* 〕━━⬣
┃ 🤖 *Name*    : ${botConfig.bot?.name || 'NusaBot'}
┃ ⚙️ *Version* : v${botConfig.bot?.version || '1.2.0'}
┃ 👨‍💻 *Dev*    : ${botConfig.bot?.developer || 'RzkyADS'}
┃ 🧩 *Library* : \`zerotwo-baileys@2.5.5\`
┃ 📌 *Prefix*  : ${prefix}
╰━━━━━━━━━━━━━━━⬣

╭━━〔 💗 *YOUR PROFILE* 〕━━⬣
┃ 🧑 *Name*    : ${m.pushName}
┃ 🥐 *Role*    : ${m?.isOwner ? "👑 Owner" : m?.isPremium ? "💎 Premium" : "🌸 User"}
┃ 🧀 *Level*   : ${user.level || 0}
┃ 🍗 *Exp*     : ${user.exp || 0}
┃ 🥩 *Energi*  : ${user.energi || 0}
┃ 🎏 *Koin*    : ${user.koin || 0}
┃ 🍬 *Regis*   : ${user.isRegistered ? "✅ Sudah" : "❌ Belum"}
╰━━━━━━━━━━━━━━━⬣

💕 *“Aku akan selalu ada untukmu, Darling~”* 💕

${readmore}${menuList}`;

                    const interactiveMsg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `✨ ${botConfig.bot?.name || 'NusaBot'} - MENU ✨`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: bodyText
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `💕 ${getRandomZeroTwoMessage()} 💕`
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                text: `🌸 ${greeting}, Darling~ 🌸`,
                                                url: saluranLink,
                                                copy_code: `✨ ${botConfig.bot?.name || 'NusaBot'} ✨`,
                                                expiration_time: Date.now() + 1000000,
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_limit: 2,
                                                divider_indices: [1, 2, 3, 4, 5, 999],
                                                list_title: "🎀 Pilih Menu Darling 🎀",
                                                button_title: "🌸 Selengkapnya",
                                            }
                                        }),
                                        buttons: [
                                            {
                                                name: "single_select",
                                                buttonParamsJson: JSON.stringify({
                                                    has_multiple_buttons: true
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "👑 Owner Kami",
                                                    url: `https://wa.me/${botConfig.owner?.number?.[0]}`,
                                                    merchant_url: `https://wa.me/${botConfig.owner?.number?.[0]}`,
                                                })
                                            },
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📜 Dapatkan Script (Gratis)",
                                                    id: `${prefix}sc`
                                                })
                                            },
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📋 Semua Menu",
                                                    id: `${prefix}allmenu`
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
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });
                    
                } catch (error) {
                    console.error('[Menu V12] Error:', error);
                    await m.reply(text);
                }
                break;
            }
            
            case 13: {
                function runtime(seconds) {
                    seconds = Number(seconds);
                    const d = Math.floor(seconds / (3600 * 24));
                    const h = Math.floor(seconds % (3600 * 24) / 3600);
                    const m = Math.floor(seconds % 3600 / 60);
                    const s = Math.floor(seconds % 60);
                    return `${d} Jam ${m} Menit ${s} Detik`;
                }

                const weatherCode = {
                    0: "☀️ Cerah",
                    1: "🌤️ Cerah Berawan",
                    2: "⛅ Berawan",
                    3: "☁️ Mendung",
                    45: "🌫️ Berkabut",
                    48: "🌫️ Kabut Tebal",
                    51: "🌦️ Gerimis",
                    61: "🌧️ Hujan Ringan",
                    63: "🌧️ Hujan",
                    65: "⛈️ Hujan Lebat",
                    80: "🌦️ Hujan Lokal",
                    95: "⛈️ Badai Petir"
                }

                async function weatherMenu(city = "Jakarta") {
                    try {
                        const geo = await axios.get(
                            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
                        )
                        const loc = geo.data.results?.[0]
                        if (!loc) return "Cuaca tidak tersedia"
                        const res = await axios.get(
                            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`
                        )
                        const current = res.data.current
                        const kondisi = weatherCode[current.weather_code] || "🌍 Tidak diketahui"
                        return `${kondisi} | 🌡️ ${Math.round(current.temperature_2m)}°C\n📍 ${loc.name}`
                    } catch {
                        return "Cuaca tidak tersedia"
                    }
                }

                // 🔥 Load zerotwo-v13.jpg dari URL
                let imageBuffer13 = await loadImage('zerotwo-v13.jpg');
                if (!imageBuffer13) imageBuffer13 = imageBuffer;

                const thumbnail = await sharp(imageBuffer13).resize(300, 300).toBuffer();

                const statsPath = path.join(process.cwd(), 'database', 'main', 'stats.json');
                let topCmdText = "\n\n*📊 T O P - C O M M A N D*\n";
                if (fs.existsSync(statsPath)) {
                    try {
                        const rawStats = fs.readFileSync(statsPath, 'utf8');
                        const statsData = JSON.parse(rawStats);
                        const commandStats = Object.entries(statsData)
                            .filter(([key]) => key.startsWith('command_'))
                            .map(([key, count]) => ({ name: key.replace('command_', ''), count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5);

                        if (commandStats.length > 0) {
                            commandStats.forEach((cmd, i) => {
                                const icon = i === commandStats.length - 1 ? '└' : '├';
                                topCmdText += `${icon} ◈ ${prefix}${cmd.name} (${cmd.count}x)\n`;
                            });
                        } else {
                            topCmdText += "└ ◈ Belum ada command\n";
                        }
                    } catch (e) {
                        topCmdText += "└ ◈ Gagal baca stats\n";
                    }
                } else {
                    topCmdText += "└ ◈ File stats tidak ditemukan\n";
                }

                const msg13 = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {},
                            interactiveMessage: {
                                header: {
                                    hasMediaAttachment: true,
                                    locationMessage: {
                                        degreesLatitude: 0,
                                        degreesLongitude: 0,
                                        name: config.bot?.name || "NusaBot",
                                        address: await weatherMenu(),
                                        jpegThumbnail: thumbnail
                                    }
                                },
                                body: {
                                    text: `🌸 Hai *${m.pushName}* 🌸\n\n💕 *“Aku akan selalu ada untukmu, Darling~”* 💕\n\n_i am an automated system (WhatsApp bot) that can help to do something search and get data / information only through WhatsApp._\n\n*\`📊 I N F O - B O T\`*\n┌ ◈ Name : ${config.bot?.name || 'NusaBot'}\n│ ◈ Author : @${config.bot?.developer || 'RzkyADS'}\n│ ◈ Type Script : Case x Plugins\n│ ◈ Uptime : ${runtime(process.uptime())}\n└ ◈ Versi : v${config.bot?.version || '1.2.0'}\n\n*\`📊 I N F O - U S E R\`*\n┌ ◈ Nama : ${m.pushName}\n│ ◈ Status : ${m.isOwner ? "👑 Owner" : m.isPremium ? "💎 Premium" : "🏷️ Free"}\n│ ◈ Mode : ${config.mode === "public" ? "🌍 Bisa digunakan semua" : "🔒 Hanya Owner"}\n│ ◈ Nomor : @${m.sender.split("@")[0]}\n└ ◈ ${greeting}\n${topCmdText}`
                                },
                                contextInfo: {
                                    mentionedJid: [m.sender],
                                    isForwarded: true,
                                    forwardingScore: 9999,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: saluranId,
                                        newsletterName: saluranName,
                                        serverMessageId: 127
                                    }
                                },
                                nativeFlowMessage: {
                                    messageParamsJson: JSON.stringify({
                                        limited_time_offer: {
                                            text: `${greeting}`,
                                            url: "Hai",
                                            expiration_time: Date.now() + 10000,
                                        },
                                        bottom_sheet: {
                                            in_thread_buttons_limit: 2,
                                            divider_indices: [1, 2, 3, 4, 5, 999],
                                            list_title: "🎀 Please select the menu",
                                            button_title: "🌸 See Category",
                                        },
                                    }),
                                    buttons: [
                                        {
                                            name: "",
                                            buttonParamsJson: ""
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "📋 Allmenu",
                                                id: `${prefix}allmenu`
                                            })
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "📜 Rules",
                                                id: `${prefix}rules`
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "👑 Owner Kami",
                                                url: `https://wa.me/${config.owner?.number?.[0]}`,
                                                merchant_url: `https://wa.me/${config.owner?.number?.[0]}`,
                                            })
                                        },
                                    ]
                                }
                            }
                        }
                    }
                }, { quoted: m, userJid: sock.user.jid });

                await sock.relayMessage(m.chat, msg13.message, {
                    messageId: msg13.key.id,
                });
                break;
            }
            
            case 14: {
                let s = ""
                const sortedCategories14 = getSortedCategories(m, botMode);
                for (const { cat, cmds, emoji } of sortedCategories14.sorted) {
                    s += `╭─☰ ${toPremiumBold(cat)}\n`
                    for (const cmd of cmds.slice(0, 15)) {
                        s += `│  ✧ \`${prefix}${cmd}\`\n`
                    }
                    if (cmds.length > 15) {
                        s += `│  _...dan ${cmds.length - 15} lainnya_\n`
                    }
                    s += "╰─┈┈\n\n"
                }
                
                // 🔥 Load zerotwo-v14.jpg dari URL
                let imageBuffer14 = await loadImage('zerotwo-v14.jpg');
                if (!imageBuffer14) imageBuffer14 = imageBuffer;
                
                const media = await prepareWAMessageMedia({
                    image: imageBuffer14
                }, { upload: sock.waUploadToServer })
                
                const readmore = String.fromCharCode(8206).repeat(4001)
                
                const user14 = db.getUser(m.sender) || {};
                
                await sock.relayMessage(
                    m.chat,
                    {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {},
                                interactiveMessage: {
                                    header: {
                                        title: "",
                                        subtitle: "",
                                        hasMediaAttachment: true,
                                        imageMessage: media.imageMessage
                                    },
                                    body: {
                                        text: `🌸 *Hello Darling~* 🌸

Welcome to *${config.bot?.name || 'NusaBot'}*, partner setiamu! 💕

🍅 *BOT INFORMATION*
> 🤖 *Name*: ${config.bot?.name || 'NusaBot'}
> ⚙️ *Version*: v${config.bot?.version || '1.2.0'}
> 👨‍💻 *Developer*: ${config.bot?.developer || 'RzkyADS'}
> 🧩 *Library*: \`zerotwo-baileys\`

🍅 *USER INFORMATION*
> 🧑 *Name*: ${m.pushName}
> 🥐 *Role*: ${m?.isOwner ? "🔥 Owner" : m?.isPremium ? "👑 Premium" : "😊 User"}
> 🧀 *Level*: ${user14.level || 0}
> 🍗 *Exp*: ${user14.exp || 0}
> 🥩 *Energi*: ${user14.energi || 0}
> 🎏 *Koin*: ${user14.koin || 0}
> 🍬 *Register*: ${user14.isRegistered ? "Sudah" : "Belum"}

${readmore}${s}`
                                    },
                                    footer: {
                                        text: "💕 Pilih tombol dibawah untuk info lebih lanjut, Darling~"
                                    },
                                    contextInfo: {
                                        isForwarded: true,
                                        forwardingScore: 9999,
                                        participant: "0@s.whatsapp.net",
                                        quotedMessage: {
                                            conversation: `${config.bot?.name || 'NusaBot'}`
                                        },
                                        mentionedJid: [m.sender],
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranId,
                                            newsletterName: saluranName,
                                            serverMessageId: 127
                                        }
                                    },
                                    nativeFlowMessage: {
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                text: `${greeting}`,
                                                url: "Hai",
                                                copy_code: "Dibuat oleh " + (config.bot?.developer || 'RzkyADS'),
                                                expiration_time: Date.now() + 1000000,
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_limit: 2,
                                                divider_indices: [1, 2, 3, 4, 5, 999],
                                                list_title: "🎀 Silahkan pilih menu yang kamu inginkan",
                                                button_title: "🌸 Selengkapnya",
                                            },
                                        }),
                                        buttons: [
                                            {
                                                name: "single_select",
                                                buttonParamsJson: JSON.stringify({
                                                    has_multiple_buttons: true
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "👑 Owner Kami",
                                                    url: `https://wa.me/${config.owner?.number?.[0]}`,
                                                    merchant_url: `https://wa.me/${config.owner?.number?.[0]}`,
                                                })
                                            },
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📜 Dapatkan Script (Gratis)",
                                                    id: `${prefix}sc`
                                                })
                                            },
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📋 Semua Menu",
                                                    id: `${prefix}allmenu`
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {}
                )
                break;
            }
            
            case 15: {
                
                const videoUrlV15 = videoAssets['zerotwo-v15.mp4'] || videoAssets['zerotwo.mp4'];
                let videoBufferV15 = null;
                
                if (videoUrlV15) {
                    try {
                        const response = await axios.get(videoUrlV15, { responseType: 'arraybuffer' });
                        videoBufferV15 = Buffer.from(response.data);
                    } catch (err) {
                        console.error('[Menu V15] Gagal download video:', err.message);
                    }
                }
                
                const thumbnail = await sharp(imageBuffer).resize(300, 300).toBuffer()
                const qvideo = {
                    key: {
                        fromMe: false,
                        participant: m.sender
                    },
                    message: {
                        videoMessage: {
                            caption: config.bot?.name || 'NusaBot',
                            seconds: 999999999,
                            mimetype: "video/mp4",
                            jpegThumbnail: thumbnail,
                            fileLength: "9999999"
                        }
                    }
                }
                
                const media4 = await prepareWAMessageMedia({
                    video: videoBufferV15,
                    gifPlayback: true
                }, { upload: sock.waUploadToServer });
                
                const sortedCategories15 = getSortedCategories(m, botMode);
                let singlePush = sortedCategories15.sorted.map(cat => {
                    return {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: `${cat.emoji} ${cat.cat} Menu`,
                            sections: [
                                {
                                    title: "💕 Please select the command, Darling",
                                    highlight_label: config.bot?.name || 'NusaBot',
                                    rows: cat.cmds.slice(0, 20).map((cmd, i) => {
                                        return {
                                            title: (i + 1).toString() + " " + cmd,
                                            description: "Tap untuk menjalankan perintah ini",
                                            id: `${prefix}${cmd}`
                                        }
                                    })
                                }
                            ],
                            icon: "REVIEW"
                        })
                    }
                })
                
                const msg4 = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {},
                            interactiveMessage: {
                                header: {
                                    title: "",
                                    subtitle: "",
                                    hasMediaAttachment: true,
                                    videoMessage: media4.videoMessage
                                },
                                footer: {
                                    text: `💕 Please select the button below, Darling~`
                                },
                                body: {
                                    text: `🌸 *${greeting} ${m.pushName}* 🌸

Welcome to *${config.bot?.name || 'NusaBot'}*, partner setiamu!

💕 *“Aku selalu ada untukmu, Darling~”* 💕

\`INFORMATION BOT\`
> 🍫 *Creator*: ${config.bot?.developer || 'RzkyADS'}
> 🥞 *Name*: ${config.bot?.name || 'NusaBot'}
> 🥩 *Version*: v${config.bot?.version || '1.2.0'}
> 🍂 *Type*: \`Plugin x Cases\`
> 🦴 *Mode*: *${config.mode === 'public' ? '🍕 Public (Semua bisa pakai)' : '🥖 Private (Owner only)'}*

Enjoy your use, Darling~ 💕`
                                },
                                contextInfo: {
                                    mentionedJid: [m.sender],
                                    isForwarded: true,
                                    forwardingScore: 9999,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: saluranId,
                                        newsletterName: saluranName,
                                        serverMessageId: 127,
                                    },
                                },
                                nativeFlowMessage: {
                                    messageParamsJson: JSON.stringify({
                                        bottom_sheet: {
                                            in_thread_buttons_limit: 2,
                                            divider_indices: [1, 2, 3, 4, 5, 999],
                                            list_title: "🎀 Please select the menu",
                                            button_title: "🌸 See Category",
                                        },
                                    }),
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "👑 Visit My Creator",
                                                url: `https://wa.me/${config.owner?.number?.[0]}`,
                                                merchant_url: `https://wa.me/${config.owner?.number?.[0]}`,
                                            })
                                        },
                                        ...singlePush
                                    ]
                                }
                            }
                        }
                    }
                }, { quoted: qvideo, userJid: sock.user.jid });

                await sock.relayMessage(m.chat, msg4.message, {
                    messageId: msg4.key.id,
                });
                break;
            }
            
            case 16: {
                function runtime(seconds) {
                    seconds = Number(seconds);
                    const d = Math.floor(seconds / (3600 * 24));
                    const h = Math.floor(seconds % (3600 * 24) / 3600);
                    const m = Math.floor(seconds % 3600 / 60);
                    const s = Math.floor(seconds % 60);
                    return `${d} Jam ${m} Menit ${s} Detik`;
                }

                const weatherCode = {
                    0: "☀️ Cerah",
                    1: "🌤️ Cerah Berawan",
                    2: "⛅ Berawan",
                    3: "☁️ Mendung",
                    45: "🌫️ Berkabut",
                    48: "🌫️ Kabut Tebal",
                    51: "🌦️ Gerimis",
                    61: "🌧️ Hujan Ringan",
                    63: "🌧️ Hujan",
                    65: "⛈️ Hujan Lebat",
                    80: "🌦️ Hujan Lokal",
                    95: "⛈️ Badai Petir"
                }

                async function weatherMenu(city = "Jakarta") {
                    try {
                        const geo = await axios.get(
                            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
                        )
                        const loc = geo.data.results?.[0]
                        if (!loc) return "Cuaca tidak tersedia"
                        const res = await axios.get(
                            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`
                        )
                        const current = res.data.current
                        const kondisi = weatherCode[current.weather_code] || "🌍 Tidak diketahui"
                        return `${kondisi} | 🌡️ ${Math.round(current.temperature_2m)}°C\n📍 ${loc.name}`
                    } catch {
                        return "Cuaca tidak tersedia"
                    }
                }
                
                const videoUrlV16 = videoAssets['zerotwo-v16.mp4'] || videoAssets['zerotwo.mp4'];
                let videoBufferV16 = null;
                
                if (videoUrlV16) {
                    try {
                        const response = await axios.get(videoUrlV16, { responseType: 'arraybuffer' });
                        videoBufferV16 = Buffer.from(response.data);
                    } catch (err) {
                        console.error('[Menu V16] Gagal download video:', err.message);
                    }
                }
                
                const thumbnail = await sharp(imageBuffer).resize(300, 300).toBuffer()
                const qOrder = {
                    key: {
                        fromMe: false,
                        participant: '0@s.whatsapp.net',
                        remoteJid: m.sender
                    },
                    message: {
                        locationMessage: {
                            degreesLatitude: 0,
                            degreesLongitude: 0,
                            name: await weatherMenu(),
                            jpegThumbnail: thumbnail
                        }
                    }
                }
                
                const media4 = await prepareWAMessageMedia({
                    video: videoBufferV16,
                    gifPlayback: true
                }, { upload: sock.waUploadToServer });
                
                const msg4 = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {},
                            interactiveMessage: {
                                header: {
                                    title: "",
                                    subtitle: "",
                                    hasMediaAttachment: true,
                                    videoMessage: media4.videoMessage
                                },
                                footer: {
                                    text: `💕 Please select the button below, Darling~`
                                },
                                body: {
                                    text: `🌸 Hai *${m.pushName}* 🌸
                  
💕 *“Aku akan selalu ada untukmu, Darling~”* 💕

_i am an automated system (WhatsApp bot) that can help to do something search and get data / information only through WhatsApp._

*\`📊 I N F O - B O T\`*
┌ ◈ Name : ${config.bot?.name || 'NusaBot'}
│ ◈ Author : @${config.bot?.developer || 'RzkyADS'}
│ ◈ Type Script : Case x Plugins
│ ◈ Uptime : ${runtime(process.uptime())}
└ ◈ Versi : v${config.bot?.version || '1.2.0'}

*\`📊 I N F O - U S E R\`*
┌ ◈ Nama : ${m.pushName}
│ ◈ Status : ${m.isOwner ? "👑 Owner" : m.isPremium ? "💎 Premium" : "🏷️ Free"}
│ ◈ Mode : ${config.mode === "public" ? "🌍 Bisa digunakan semua" : "🔒 Hanya Owner"}
│ ◈ Nomor : @${m.sender.split("@")[0]}
└ ◈ ${greeting}
`
                                },
                                contextInfo: {
                                    mentionedJid: [m.sender],
                                    isForwarded: true,
                                    forwardingScore: 9999,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: saluranId,
                                        newsletterName: saluranName,
                                        serverMessageId: 127,
                                    },
                                },
                                nativeFlowMessage: {
                                    messageParamsJson: JSON.stringify({
                                        limited_time_offer: {
                                            text: `${greeting}`,
                                            url: "Hai",
                                            expiration_time: Date.now() + 10000,
                                        },
                                        bottom_sheet: {
                                            in_thread_buttons_limit: 2,
                                            divider_indices: [1, 2, 3, 4, 5, 999],
                                            list_title: "🎀 Please select the menu",
                                            button_title: "🌸 See Category",
                                        },
                                    }),
                                    buttons: [
                                        {
                                            name: "",
                                            buttonParamsJson: ""
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "📋 Allmenu",
                                                id: `${prefix}allmenu`
                                            })
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "📜 Rules",
                                                id: `${prefix}rules`
                                            })
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "👑 Owner Kami",
                                                url: `https://wa.me/${config.owner?.number?.[0]}`,
                                                merchant_url: `https://wa.me/${config.owner?.number?.[0]}`,
                                            })
                                        },
                                    ]
                                }
                            }
                        }
                    }
                }, { quoted: qOrder, userJid: sock.user.jid });

                await sock.relayMessage(m.chat, msg4.message, {
                    messageId: msg4.key.id,
                });
                break;
            }
            
            case 17: {
                try {
                    // 🔥 Load zerotwo-v17.jpg dari URL
                    let imageBuffer17 = await loadImage('zerotwo-v17.jpg');
                    if (!imageBuffer17) imageBuffer17 = imageBuffer;

                    const sortedCategories17 = getSortedCategories(m, botMode);
                    const zann_pengin_rehat17 = sortedCategories17.sorted.map(({ cat, cmds, emoji }) => {
                        return {
                            title: `${emoji} ${toPremiumBold(cat)}`,
                            description: `Command ini memiliki (${cmds.length}) Perintah`,
                            id: `${prefix}menucat ${cat}`,
                        };
                    });

                    const user17 = db.getUser(m.sender) || {};

                    if (imageBuffer17) {
                        await sock.sendMessage(m.chat, {
                            image: imageBuffer17,
                            caption: ``,
                            footer: `🌸 Hai @${m.pushName} 👋
            
💕 *“Aku akan selalu ada untukmu, Darling~”* 💕

🌿 Selamat datang di assistant *${config.bot?.name || 'NusaBot'}*

╭──╼╺╻ *INFORMASI BOT* ╻╺╼──╮
│ ◈ *Nama Bot* : *${config.bot?.name || 'NusaBot'}*
│ ◈ *Versi* : *v${config.bot?.version || '1.2.0'}*  
│ ◈ *Pengembang* : *${config.bot?.developer || 'RzkyADS'}*  
│ ◈ *Pustaka* : \`zerotwo-baileys\`
╰──┈┈┈┈┈┈┈┈

╭──╼╺╻ *INFORMASI PENGGUNA* ╻╺╼──╮
│ ◈ *Nama* : *${m.pushName}*
│ ◈ *Role* : *${m?.isOwner ? "👑 Owner" : m?.isPremium ? "💎 Premium" : "🌸 User"}*
│ ◈ *Level* : *${user17.level || 0}*
│ ◈ *Exp* : *${user17.exp || 0}* 
│ ◈ *Energi* : *${user17.energi || 0}*
│ ◈ *Koin* : *${user17.koin || 0}*
│ ◈ *Register* : *${user17.isRegistered ? "✅ Sudah" : "❌ Belum"}*
╰──┈┈┈┈┈┈┈┈

💕 Tekan tombol dibawah untuk info lebih lanjut dan untuk memilih kategori, Darling~`,
                            interactiveButtons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "🌸 Menu Utama",
                                        sections: [
                                            {
                                                title: "💕 Berikut adalah pilihan nya",
                                                rows: zann_pengin_rehat17
                                            }
                                        ],
                                        icon: "DEFAULT"
                                    })
                                },
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "📋 Selengkapnya",
                                        sections: [
                                            {
                                                title: "💕 Berikut adalah pilihan nya",
                                                rows: [
                                                    {
                                                        title: "📋 Lihat semua menu yang ada di bot ini",
                                                        description: "Silahkan tap lalu kirim",
                                                        id: `${prefix}allmenu`
                                                    },
                                                    {
                                                        title: "📜 Dapatkan Script (Gratis)",
                                                        description: "Silahkan tap lalu kirim, nanti bot akan mengirimkan sebuah link download",
                                                        id: `${prefix}sc`
                                                    },
                                                    {
                                                        title: "👑 Siapakah owner dari bot ini?",
                                                        description: "Tap dan klik kirim untuk melanjutkan",
                                                        id: `${prefix}owner`
                                                    },
                                                ]
                                            }
                                        ],
                                        icon: "REVIEW"
                                    })
                                },
                            ]
                        }, {
                            quoted: getVerifiedQuoted(botConfig, m),
                        })
                    } else {
                        await m.reply(text);
                    }
                } catch (error) {
                    console.error('[Menu V17] Error:', error);
                    await m.reply(text);
                }
                break;
            }
            
case 18: {
    try {
        function runtime(seconds) {
            seconds = Number(seconds);
            const d = Math.floor(seconds / (3600 * 24));
            const h = Math.floor(seconds % (3600 * 24) / 3600);
            const m = Math.floor(seconds % 3600 / 60);
            const s = Math.floor(seconds % 60);
            return `${d} Hari ${h} Jam ${m} Menit ${s} Detik`;
        }

        const weatherCode = {
            0: "☀️ Cerah", 1: "🌤️ Cerah Berawan", 2: "⛅ Berawan",
            3: "☁️ Mendung", 45: "🌫️ Berkabut", 48: "🌫️ Kabut Tebal",
            51: "🌦️ Gerimis", 61: "🌧️ Hujan Ringan", 63: "🌧️ Hujan",
            65: "⛈️ Hujan Lebat", 80: "🌦️ Hujan Lokal", 95: "⛈️ Badai Petir"
        }

        async function weatherMenu(city = "Jakarta") {
            try {
                const geo = await axios.get(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
                )
                const loc = geo.data.results?.[0]
                if (!loc) return "Cuaca tidak tersedia"
                const res = await axios.get(
                    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`
                )
                const current = res.data.current
                const kondisi = weatherCode[current.weather_code] || "🌍 Tidak diketahui"
                return `${kondisi} | 🌡️ ${Math.round(current.temperature_2m)}°C\n📍 ${loc.name}`
            } catch {
                return "Cuaca tidak tersedia"
            }
        }

        const videoUrlV18 = videoAssets['zerotwo-v16.mp4'] || videoAssets['zerotwo.mp4'];
        let videoBufferV18 = null;
        
        if (videoUrlV18) {
            try {
                const response = await axios.get(videoUrlV18, { 
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                videoBufferV18 = Buffer.from(response.data);
                console.log('[Menu V18] Video berhasil di download, size:', videoBufferV18.length);
            } catch (err) {
                console.error('[Menu V18] Gagal download video:', err.message);
            }
        }

        let mediaVideo = null;
        if (videoBufferV18) {
            try {
                mediaVideo = await prepareWAMessageMedia({
                    video: videoBufferV18,
                    gifPlayback: true
                }, { upload: sock.waUploadToServer });
                console.log('[Menu V18] Media video berhasil di prepare');
            } catch (err) {
                console.error('[Menu V18] Gagal prepare video:', err.message);
                mediaVideo = null;
            }
        }

        const captionText = `🌸 Hai *${m.pushName}* 🌸
              
💕 *“Aku akan selalu ada untukmu, Darling~”* 💕

_i am an automated system (WhatsApp bot) that can help to do something search and get data / information only through WhatsApp._

*\`📊 I N F O - B O T\`*
┌ ◈ Name : ${botConfig.bot?.name || 'NusaBot'}
│ ◈ Author : @${botConfig.bot?.developer || 'RzkyADS'}
│ ◈ Type Script : Case x Plugins
│ ◈ Uptime : ${runtime(process.uptime())}
└ ◈ Versi : v${botConfig.bot?.version || '1.2.0'}

*\`📊 I N F O - U S E R\`*
┌ ◈ Nama : ${m.pushName}
│ ◈ Status : ${m.isOwner ? "👑 Owner" : m.isPremium ? "💎 Premium" : "🏷️ Free"}
│ ◈ Mode : ${botConfig.mode === "public" ? "🌍 Bisa digunakan semua" : "🔒 Hanya Owner"}
│ ◈ Nomor : @${m.sender.split("@")[0]}
└ ◈ ${greeting}`;

        const categoryRows = menuSorted.map(({ cat, cmds, emoji }) => ({
            header: `${toPremiumBold('✨ ' + cat + ' MENU ✨')}`,
            id: `${prefix}menucat ${cat}`,
            title: `💕 ${cmds.length} Perintah untukmu 💕`,
            description: 'Tap untuk membuka menu ini, Darling~'
        }));

        let thumbnail = thumbBuffer || imageBuffer;
        if (thumbnail) {
            try {
                thumbnail = await sharp(thumbnail).resize(300, 300).toBuffer();
            } catch (e) {
                thumbnail = thumbBuffer || imageBuffer;
            }
        }

        const qOrder = {
            key: {
                fromMe: false,
                participant: m.sender,
                remoteJid: m.chat
            },
            message: {
                locationMessage: {
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: await weatherMenu(),
                    jpegThumbnail: thumbnail
                }
            }
        };

        const interactiveMsg = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {},
                    interactiveMessage: {
                        header: {
                            title: "",
                            subtitle: "",
                            hasMediaAttachment: !!mediaVideo,
                            ...(mediaVideo ? { videoMessage: mediaVideo.videoMessage } : {})
                        },
                        footer: {
                            text: `💕 Please select the button below, Darling~`
                        },
                        body: {
                            text: captionText
                        },
                        contextInfo: {
                            mentionedJid: [m.sender],
                            isForwarded: true,
                            forwardingScore: 9999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127,
                            },
                        },
                        nativeFlowMessage: {
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: `💕 ${getRandomZeroTwoMessage()} 💕`,
                                    url: saluranLink,
                                    copy_code: botConfig.bot?.name || 'NusaBot',
                                    expiration_time: Date.now() + 999999
                                },
                                bottom_sheet: {
                                    in_thread_buttons_limit: 2,
                                    divider_indices: [1, 2, 3, 4, 5, 999],
                                    list_title: "🎀 Pilih Menu Darling 🎀",
                                    button_title: "🌸 Pilih Menu Disini 🌸"
                                }
                            }),
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "🎀 Pilihan Menu Darling 🎀",
                                        sections: [{
                                            title: `💕 ${botConfig.bot?.name || 'NusaBot'} - Pilih Kategori 💕`,
                                            highlight_label: botConfig.bot?.name || 'NusaBot',
                                            rows: categoryRows
                                        }],
                                        has_multiple_buttons: true
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🌏 ᴋᴜɴᴊᴜɴɢɪ ꜱᴀʟᴜʀᴀɴ ᴋᴜ',
                                        url: saluranLink,
                                        merchant_url: saluranLink
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💕 ᴘᴇᴍɪʟɪᴋ ʙᴏᴛ',
                                        id: `${prefix}owner`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🌸 ʟɪʜᴀᴛ ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ',
                                        id: `${prefix}allmenu`
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        };

        const msg18 = generateWAMessageFromContent(m.chat, interactiveMsg, { 
            quoted: qOrder, 
            userJid: sock.user.jid 
        });

        await sock.relayMessage(m.chat, msg18.message, {
            messageId: msg18.key.id,
        });

    } catch (v18Error) {
        console.error('[Menu V18] Error:', v18Error);
        await m.reply(text);
    }
    break;
}

case 19: {
    try {
        // 🔥 Load zerotwo-v19.jpg dari URL
        let imageBufferV19 = await loadImage('zerotwo-v19.jpg');
        if (!imageBufferV19) imageBufferV19 = imageBuffer;

        let thumbV19 = null;
        if (imageBufferV19) {
            try {
                const meta = await sharp(imageBufferV19).metadata();
                thumbV19 = await sharp(imageBufferV19)
                    .resize(
                        300,
                        Math.round((meta.height / meta.width) * 300)
                    )
                    .jpeg({ quality: 85 })
                    .toBuffer();
            } catch (e) {
                thumbV19 = imageBufferV19;
            }
        }

        const captionV19 = `╭─〔 ✨ *${toPremiumBold(botConfig.bot?.name || 'NusaBot')}* 〕─⬣\n` +
            `│  ${getRandomZeroTwoMessage()}\n` +
            `╰──────────────⬣\n\n` +
            `👤 *${m.pushName}*\n` +
            `🎭 Role: ${m.isOwner ? '👑 Owner' : m.isPremium ? '💎 Premium' : '🌸 User'}\n` +
            `⏱️ Uptime: ${uptimeFormatted}\n` +
            `📋 Total Command: ${totalCmds}\n\n` +
            `💕 Tekan tombol dibawah, Darling~`;

        const fakeQuotedContext = {
            stanzaId: 'CHAT-MSXKI2OXZHS',
            participant: '0@s.whatsapp.net',
            remoteJid: '0@s.whatsapp.net',
            quotedMessage: {
                documentMessage: {
                    mimetype: 'application/octet-stream',
                    title: 'Developer',
                    fileSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
                    fileLength: 0,
                    mediaKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
                    fileName: 'Developer',
                    fileEncSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
                }
            }
        };

        const buttonsV19 = [
            { buttonId: `${prefix}allmenu`, buttonText: { displayText: '📋 Semua Menu' }, type: 1 },
            { buttonId: `${prefix}owner`, buttonText: { displayText: '👑 Owner' }, type: 1 },
            { buttonId: `${prefix}ping`, buttonText: { displayText: '✨ Ping' }, type: 1 }
        ];

        const built = await generateWAMessageFromContent(m.chat, {
            buttonsMessage: {
                locationMessage: {
                    jpegThumbnail: thumbV19 || undefined,
                    name: botConfig.bot?.name || 'NusaBot',
                    address: `${totalCmds} Commands`
                },
                contentText: captionV19,
                footerText: '',
                buttons: buttonsV19,
                headerType: 6
            }
        }, { userJid: sock.user.jid || sock.user.id });

        built.message.buttonsMessage.contextInfo = fakeQuotedContext;

        await sock.relayMessage(m.chat, built.message, { messageId: built.key.id });

    } catch (v19Error) {
        console.error('[Menu V19] Error:', v19Error);
        await m.reply(text);
    }
    break;
}
                
            default:
                await m.reply(text);
        }
        
        // ⭐ KIRIM AUDIO (CONVERT KE PTT/VN) ⭐
        const audioEnabled = db.setting('audioMenu') !== false;
        if (audioEnabled) {
            await sendAudioSimple(sock, m, botConfig);
        }
        
    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
        m.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
