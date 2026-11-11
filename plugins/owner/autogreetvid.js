const { getDatabase } = require('../../src/lib/database');
const config = require('../../config');
const axios = require('axios');
const videoAssets = require('../../assets/video/assets-vd');

const pluginConfig = {
    name: ['autogreetvid', 'autovideo', 'greetvideo'],
    alias: ['autovidpagi', 'autovidmalam', 'greetvid'],
    category: 'owner',
    description: 'Auto kirim video ucapan selamat pagi & malam ke Channel',
    usage: '.autogreetvid on/off/status/test/setch <1/2/3>',
    example: '.autogreetvid setch 1',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

// Key di assets-vd.js
const VIDEO_KEYS = {
    pagi: 'zerotwo-pagi.mp4',
    malam: 'zerotwo-malam.mp4'
};

const DEFAULT_PAGI = '05:00';
const DEFAULT_MALAM = '22:00';

// Cache video buffer
let videoCache = { pagi: null, malam: null };

async function getVideoBuffer(type) {
    if (videoCache[type]) return videoCache[type];
    
    const key = VIDEO_KEYS[type];
    const url = videoAssets[key];
    
    if (!url) {
        throw new Error(`Video "${key}" tidak ditemukan di assets-vd.js`);
    }
    
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        videoCache[type] = Buffer.from(res.data);
        console.log(`[AutoGreet] ✅ Video ${type} loaded from CDN`);
        return videoCache[type];
    } catch (e) {
        throw new Error(`Gagal download video ${type}: ${e.message}`);
    }
}

function getChannelId(choice) {
    const channelMap = {
        '1': config.saluran?.id,
        '2': config.saluran?.id2,
        '3': config.saluran?.id3
    };
    return channelMap[choice] || config.saluran?.id;
}

function getChannelName(choice) {
    const nameMap = {
        '1': config.saluran?.name || 'Channel 1',
        '2': config.saluran?.name2 || 'Channel 2',
        '3': config.saluran?.name3 || 'Channel 3'
    };
    return nameMap[choice] || `Channel ${choice}`;
}

function getCaption(type) {
    if (type === 'pagi') {
        return `
╭━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🦋✨ 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 ✨🦋
┃ ── 「 𝐃𝐀𝐑𝐋𝐈𝐍𝐆 𝐌𝐎𝐃𝐄 」 ──
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 🌅 𝐒𝐄𝐋𝐀𝐌𝐀𝐓 𝐏𝐀𝐆𝐈 〕━━━⬣
┃ Ohayou, Darling~ ☀️
┃ Jangan lupa sarapan biar kuat
┃ nemenin aku hari ini 💕
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

✨ Ayo semangat, jangan buat aku nunggu~`;
    }
    
    return `
╭━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🦋✨ 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 ✨🦋
┃ ── 「 𝐃𝐀𝐑𝐋𝐈𝐍𝐆 𝐌𝐎𝐃𝐄 」 ──
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 🌙 𝐒𝐄𝐋𝐀𝐌𝐀𝐓 𝐌𝐀𝐋𝐀𝐌 〕━━━⬣
┃ Oyasumi, Darling~ 🌌
┃ Mimpi indah ya... 
┃ tapi jangan mimpiin selain aku 😘
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

💫 Tidurlah, besok kita main lagi~`;
}

async function handler(m, { sock }) {
    const args = m.args || [];
    const cmd = args[0]?.toLowerCase();
    const database = getDatabase();
    
    if (!database.setting('autoGreetVidChannel')) database.setting('autoGreetVidChannel', '1');
    
    const currentChannel = database.setting('autoGreetVidChannel') || '1';
    const saluranId = getChannelId(currentChannel);
    const saluranName = getChannelName(currentChannel);

    if (cmd === 'setch') {
        const channelChoice = args[1];
        if (!channelChoice || !['1', '2', '3'].includes(channelChoice)) {
            return m.reply(
                `🎬 *A U T O  G R E E T  V I D  -  S E T  C H A N N E L*\n\n` +
                `> Pilih channel tujuan:\n` +
                `> 1️⃣ ${config.saluran?.name || 'Channel 1'} ${config.saluran?.id ? '✅' : '❌'}\n` +
                `> 2️⃣ ${config.saluran?.name2 || 'Channel 2'} ${config.saluran?.id2 ? '✅' : '❌'}\n` +
                `> 3️⃣ ${config.saluran?.name3 || 'Channel 3'} ${config.saluran?.id3 ? '✅' : '❌'}\n\n` +
                `> Contoh: .autogreetvid setch 2`
            );
        }
        
        const targetId = getChannelId(channelChoice);
        if (!targetId) {
            return m.reply(`❌ *Channel ${channelChoice} belum dikonfigurasi!*\n> Isi dulu di config.js bagian saluran.id${channelChoice}`);
        }
        
        database.setting('autoGreetVidChannel', channelChoice);
        m.react('✅');
        return m.reply(
            `✅ *C H A N N E L  D I U B A H*\n\n` +
            `📢 Sekarang auto greet video akan dikirim ke:\n` +
            `> ${getChannelName(channelChoice)} (${targetId})`
        );
    }

    if (cmd === 'test') {
        if (!saluranId) {
            return m.reply(`❌ *Channel ${currentChannel} belum diisi ID-nya!*\n> Cek config.saluran.id${currentChannel}`);
        }
        m.react('🔍');
        await m.reply(`🔍 *T E S T I N G...*\n> Mengirim preview video ke ${saluranName}...`);
        try {
            await sendGreet(sock, saluranId, 'pagi');
            await new Promise(res => setTimeout(res, 2000));
            await sendGreet(sock, saluranId, 'malam');
            return m.reply(`✅ *T E S T  S U C C E S S*\n> Cek Channel ${saluranName} Bos!`);
        } catch (err) {
            return m.reply(`❌ *G A G A L*\n> Alasan: ${err.message}`);
        }
    }

    if (cmd === 'setpagi') {
        const time = args[1];
        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            return m.reply(`❌ Format salah! Contoh: 05:00`);
        }
        database.setting('autoGreetVidPagi', time);
        return m.reply(`✅ Jam pagi diatur ke *${time}*`);
    }

    if (cmd === 'setmalam') {
        const time = args[1];
        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            return m.reply(`❌ Format salah! Contoh: 22:00`);
        }
        database.setting('autoGreetVidMalam', time);
        return m.reply(`✅ Jam malam diatur ke *${time}*`);
    }

    if (cmd === 'on') {
        database.setting('autoGreetVid', true);
        m.react('✅');
        return m.reply(`✅ *A U T O  G R E E T  V I D E O  A K T I F*\n> Channel: ${saluranName}`);
    }

    if (cmd === 'off') {
        database.setting('autoGreetVid', false);
        m.react('❌');
        return m.reply(`❌ *A U T O  G R E E T  V I D E O  D I N O N A K T I F K A N*`);
    }

    const status = database.setting('autoGreetVid') ? '✅ Aktif' : '❌ Nonaktif';
    const pagi = database.setting('autoGreetVidPagi') || DEFAULT_PAGI;
    const malam = database.setting('autoGreetVidMalam') || DEFAULT_MALAM;
    
    const channelStatus = [
        `1️⃣ ${config.saluran?.name || 'Channel 1'}: ${config.saluran?.id ? '✅' : '❌'}`,
        `2️⃣ ${config.saluran?.name2 || 'Channel 2'}: ${config.saluran?.id2 ? '✅' : '❌'}`,
        `3️⃣ ${config.saluran?.name3 || 'Channel 3'}: ${config.saluran?.id3 ? '✅' : '❌'}`
    ].join('\n> ');

    return m.reply(
        `🎬 *A U T O  G R E E T  V I D E O*\n\n` +
        `╭┈┈⬡「 📋 *S T A T U S* 」\n` +
        `┃ 🔔 Status: ${status}\n` +
        `┃ 📢 Channel: ${saluranName} (${saluranId || '❌'})\n` +
        `┃ 🌅 Pagi: ${pagi}\n` +
        `┃ 🌙 Malam: ${malam}\n` +
        `┃ 🎬 Sumber: CDN (assets-vd.js)\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 📡 *C H A N N E L* 」\n` +
        `> ${channelStatus}\n` +
        `╰┈┈⬡\n\n` +
        `> *Commands:*\n` +
        `> \`${m.prefix}autogreetvid on/off\`\n` +
        `> \`${m.prefix}autogreetvid setch 1/2/3\`\n` +
        `> \`${m.prefix}autogreetvid setpagi 06:00\`\n` +
        `> \`${m.prefix}autogreetvid setmalam 23:00\`\n` +
        `> \`${m.prefix}autogreetvid test\``
    );
}

async function sendGreet(sock, jid, type) {
    const videoBuffer = await getVideoBuffer(type);
    
    await sock.sendMessage(jid, {
        video: videoBuffer,
        caption: getCaption(type),
        mimetype: 'video/mp4'
    });
}

async function runAutoGreetVideo(sock) {
    const db = getDatabase();
    if (!db.setting('autoGreetVid')) return;

    const now = new Date();
    const makassar = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
    const currentHour = makassar.getHours();
    const currentMinute = makassar.getMinutes();

    const channelChoice = db.setting('autoGreetVidChannel') || '1';
    const saluranId = getChannelId(channelChoice);
    
    if (!saluranId) return;

    if (!global.autoGreetVidLock) global.autoGreetVidLock = { pagi: -1, malam: -1 };

    const pagiTime = db.setting('autoGreetVidPagi') || DEFAULT_PAGI;
    const malamTime = db.setting('autoGreetVidMalam') || DEFAULT_MALAM;

    const [pagiHour, pagiMinute] = pagiTime.split(':').map(Number);
    const [malamHour, malamMinute] = malamTime.split(':').map(Number);

    if (currentHour === pagiHour && currentMinute === pagiMinute) {
        if (global.autoGreetVidLock.pagi !== currentHour) {
            global.autoGreetVidLock.pagi = currentHour;
            try {
                await sendGreet(sock, saluranId, 'pagi');
                console.log(`[AutoGreet] ✅ Pagi terkirim ke Channel ${channelChoice}`);
            } catch (e) {
                global.autoGreetVidLock.pagi = -1;
                console.log('[AutoGreet] ❌ Pagi:', e.message);
            }
        }
    } else {
        if (global.autoGreetVidLock.pagi !== -1) global.autoGreetVidLock.pagi = -1;
    }

    if (currentHour === malamHour && currentMinute === malamMinute) {
        if (global.autoGreetVidLock.malam !== currentHour) {
            global.autoGreetVidLock.malam = currentHour;
            try {
                await sendGreet(sock, saluranId, 'malam');
                console.log(`[AutoGreet] ✅ Malam terkirim ke Channel ${channelChoice}`);
            } catch (e) {
                global.autoGreetVidLock.malam = -1;
                console.log('[AutoGreet] ❌ Malam:', e.message);
            }
        }
    } else {
        if (global.autoGreetVidLock.malam !== -1) global.autoGreetVidLock.malam = -1;
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    runAutoGreetVideo
};