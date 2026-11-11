const { getDatabase } = require('../../src/lib/database');
const config = require('../../config');
const fs = require('fs');

const pluginConfig = {
    name: ['autogreet', 'automsg', 'pagemalam'],
    alias: ['autopagi', 'automalam', 'greet'],
    category: 'owner',
    description: 'Auto kirim ucapan selamat pagi & malam ke Channel',
    usage: '.autogreet on/off/status/test/setch <1/2/3>',
    example: '.autogreet setch 1',
    isOwner: true,
    cooldown: 5,
    isEnabled: true
};

const IMAGE = {
    pagi: './assets/images/zerotwo-pagi.jpg',
    malam: './assets/images/zerotwo-malam.jpg'
};

// Ambil channel ID berdasarkan pilihan
function getChannelId(choice) {
    const channelMap = {
        '1': config.saluran?.id,
        '2': config.saluran?.id2,
        '3': config.saluran?.id3
    };
    return channelMap[choice] || config.saluran?.id;
}

// Ambil nama channel berdasarkan pilihan
function getChannelName(choice) {
    const nameMap = {
        '1': config.saluran?.name || 'Channel 1',
        '2': config.saluran?.name2 || 'Channel 2',
        '3': config.saluran?.name3 || 'Channel 3'
    };
    return nameMap[choice] || `Channel ${choice}`;
}

async function handler(m, { sock }) {
    const args = m.args || [];
    const cmd = args[0]?.toLowerCase();
    const database = getDatabase();
    
    // Inisialisasi setting default
    if (!database.setting('autoGreetChannel')) database.setting('autoGreetChannel', '1');
    
    const currentChannel = database.setting('autoGreetChannel') || '1';
    const saluranId = getChannelId(currentChannel);
    const saluranName = getChannelName(currentChannel);

    // ========== SET CHANNEL ==========
    if (cmd === 'setch') {
        const channelChoice = args[1];
        if (!channelChoice || !['1', '2', '3'].includes(channelChoice)) {
            return m.reply(
                `🎀 *A U T O  G R E E T  -  S E T  C H A N N E L*\n\n` +
                `> Pilih channel tujuan:\n` +
                `> 1️⃣ ${config.saluran?.name || 'Channel 1'} ${config.saluran?.id ? '✅' : '❌'}\n` +
                `> 2️⃣ ${config.saluran?.name2 || 'Channel 2'} ${config.saluran?.id2 ? '✅' : '❌'}\n` +
                `> 3️⃣ ${config.saluran?.name3 || 'Channel 3'} ${config.saluran?.id3 ? '✅' : '❌'}\n\n` +
                `> Contoh: .autogreet setch 2`
            );
        }
        
        const targetId = getChannelId(channelChoice);
        if (!targetId) {
            return m.reply(`❌ *Channel ${channelChoice} belum dikonfigurasi!*\n> Isi dulu di config.js bagian saluran.id${channelChoice}`);
        }
        
        database.setting('autoGreetChannel', channelChoice);
        m.react('✅');
        return m.reply(
            `✅ *C H A N N E L  D I U B A H*\n\n` +
            `📢 Sekarang auto greet akan dikirim ke:\n` +
            `> ${getChannelName(channelChoice)} (${targetId})`
        );
    }

    // ========== TEST ==========
    if (cmd === 'test') {
        if (!saluranId) {
            return m.reply(`❌ *Channel ${currentChannel} belum diisi ID-nya!*\n> Cek config.saluran.id${currentChannel}`);
        }
        m.react('🔍');
        await m.reply(`🔍 *T E S T I N G...*\n> Mengirim preview ke ${saluranName}...`);
        try {
            await sendGreet(sock, saluranId, 'pagi');
            await new Promise(res => setTimeout(res, 2000));
            await sendGreet(sock, saluranId, 'malam');
            return m.reply(`✅ *T E S T  S U C C E S S*\n> Cek Channel ${saluranName} Bos!`);
        } catch (err) {
            return m.reply(`❌ *G A G A L*\n> Alasan: ${err.message}`);
        }
    }

    // ========== SET PAGI / MALAM ==========
    if (cmd === 'setpagi' || cmd === 'setmalam') {
        const time = args[1];
        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            return m.reply(`❌ Format salah! Contoh: 06:00\n> Jam harus dalam format 24 jam (00:00 - 23:59)`);
        }
        const key = cmd === 'setpagi' ? 'autoGreetPagi' : 'autoGreetMalam';
        database.setting(key, time);
        return m.reply(`✅ Jam ${cmd.replace('set', '')} diatur ke *${time}*`);
    }

    // ========== ON / OFF ==========
    if (cmd === 'on') {
        database.setting('autoGreet', true);
        m.react('✅');
        return m.reply(`✅ *A U T O  G R E E T  A K T I F*\n> Channel: ${saluranName}`);
    }

    if (cmd === 'off') {
        database.setting('autoGreet', false);
        m.react('❌');
        return m.reply(`❌ *A U T O  G R E E T  D I N O N A K T I F K A N*`);
    }

    // ========== STATUS ==========
    const status = database.setting('autoGreet') ? '✅ Aktif' : '❌ Nonaktif';
    const pagi = database.setting('autoGreetPagi') || '05:00';
    const malam = database.setting('autoGreetMalam') || '22:00';
    
    // Cek channel mana yang sudah diisi
    const channelStatus = [
        `1️⃣ ${config.saluran?.name || 'Channel 1'}: ${config.saluran?.id ? '✅' : '❌'}`,
        `2️⃣ ${config.saluran?.name2 || 'Channel 2'}: ${config.saluran?.id2 ? '✅' : '❌'}`,
        `3️⃣ ${config.saluran?.name3 || 'Channel 3'}: ${config.saluran?.id3 ? '✅' : '❌'}`
    ].filter(c => c.includes('✅')).join('\n> ');

    return m.reply(
        `🌅 *A U T O  G R E E T I N G*\n\n` +
        `╭┈┈⬡「 📋 *S T A T U S* 」\n` +
        `┃ 🔔 Status: ${status}\n` +
        `┃ 📢 Channel aktif: ${saluranName} (${saluranId || '❌'})\n` +
        `┃ 🌅 Pagi: ${pagi}\n` +
        `┃ 🌙 Malam: ${malam}\n` +
        `┃ 🕐 Zona: Asia/Makassar ✅\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 📡 *C H A N N E L  T E R S E D I A* 」\n` +
        `> ${channelStatus}\n` +
        `╰┈┈⬡\n\n` +
        `> *Penggunaan:*\n` +
        `> \`${m.prefix}autogreet on/off\`\n` +
        `> \`${m.prefix}autogreet setch 1/2/3\`\n` +
        `> \`${m.prefix}autogreet setpagi 06:00\`\n` +
        `> \`${m.prefix}autogreet setmalam 22:00\`\n` +
        `> \`${m.prefix}autogreet test\``
    );
}

async function sendGreet(sock, jid, type) {
    const isPagi = type === 'pagi';
    const imagePath = isPagi ? IMAGE.pagi : IMAGE.malam;
    
    if (!fs.existsSync(imagePath)) throw new Error(`File gambar ${imagePath} tidak ditemukan!`);

    const caption = isPagi ? `
╭━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🦋✨ 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 ✨🦋
┃ ── 「 𝐃𝐀𝐑𝐋𝐈𝐍𝐆 𝐌𝐎𝐃𝐄 」 ──
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 🌅 𝐒𝐄𝐋𝐀𝐌𝐀𝐓 𝐏𝐀𝐆𝐈 〕━━━⬣
┃ Ohayou, Darling~ ☀️
┃ Jangan lupa sarapan biar kuat nemenin aku hari ini 💕
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

✨ Ayo semangat, jangan buat aku nunggu~
` : `
╭━━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🦋✨ 𝐙𝐄𝐑𝐎 𝐓𝐖𝐎 ✨🦋
┃ ── 「 𝐃𝐀𝐑𝐋𝐈𝐍𝐆 𝐌𝐎𝐃𝐄 」 ──
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 🌙 𝐒𝐄𝐋𝐀𝐌𝐀𝐓 𝐌𝐀𝐋𝐀𝐌 〕━━━⬣
┃ Oyasumi, Darling~ 🌌
┃ Mimpi indah ya... tapi jangan mimpiin selain aku 😘
╰━━━━━━━━━━━━━━━━━━━━━━━⬣

💫 Tidurlah, besok kita main lagi~
`;

    await sock.sendMessage(jid, {
        image: fs.readFileSync(imagePath),
        caption: caption
    });
}

async function runAutoGreet(sock) {
    const db = getDatabase();
    if (!db.setting('autoGreet')) return;

    const now = new Date();
    const makassar = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
    const currentHour = makassar.getHours();
    const currentMinute = makassar.getMinutes();

    // Ambil channel dari database
    const channelChoice = db.setting('autoGreetChannel') || '1';
    const saluranId = getChannelId(channelChoice);
    
    if (!saluranId) return;

    if (!global.autoGreetLock) global.autoGreetLock = { pagi: -1, malam: -1 };

    const pagiTime = db.setting('autoGreetPagi') || '05:00';
    const malamTime = db.setting('autoGreetMalam') || '22:00';

    const [pagiHour, pagiMinute] = pagiTime.split(':').map(Number);
    const [malamHour, malamMinute] = malamTime.split(':').map(Number);

    if (currentHour === pagiHour && currentMinute === pagiMinute) {
        if (global.autoGreetLock.pagi !== currentHour) {
            global.autoGreetLock.pagi = currentHour;
            try {
                await sendGreet(sock, saluranId, 'pagi');
                console.log(`[AutoGreet] ✅ Pagi terkirim ke Channel ${channelChoice}`);
            } catch (e) {
                global.autoGreetLock.pagi = -1;
                console.log('❌ Error AutoGreet Pagi:', e.message);
            }
        }
    } else {
        global.autoGreetLock.pagi = -1;
    }

    if (currentHour === malamHour && currentMinute === malamMinute) {
        if (global.autoGreetLock.malam !== currentHour) {
            global.autoGreetLock.malam = currentHour;
            try {
                await sendGreet(sock, saluranId, 'malam');
                console.log(`[AutoGreet] ✅ Malam terkirim ke Channel ${channelChoice}`);
            } catch (e) {
                global.autoGreetLock.malam = -1;
                console.log('❌ Error AutoGreet Malam:', e.message);
            }
        }
    } else {
        global.autoGreetLock.malam = -1;
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    runAutoGreet
};