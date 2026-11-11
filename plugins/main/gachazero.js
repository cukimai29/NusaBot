// plugins/main/gacha-zero.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'gachazero',
    alias: ['gacha-zero', 'gachadarling', 'gachadarl'],
    category: 'main',
    description: 'Gacha random video karakter Darling in the Franxx',
    usage: '.gacha-zero',
    example: '.gacha-zero',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

const DARLING_JSON_PATH = path.join(process.cwd(), 'database', 'darling.json');

function getDarlingList() {
    try {
        if (!fs.existsSync(DARLING_JSON_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DARLING_JSON_PATH, 'utf-8');
        const json = JSON.parse(data);
        return json.characters || [];
    } catch (err) {
        console.error('[GachaZero] Error:', err);
        return [];
    }
}

const GACHA_MESSAGES = [
    "🎀 *Wah, dapat siapa nih, Darling~*",
    "💕 *Ciee yang lagi gacha, semoga dapat aku ya~*",
    "🌸 *Jodoh-jodohan sama karakter FRANXX nih~*",
    "✨ *Ayo lihat dapat siapa, Darling!*",
    "💗 *Hmm... siapa ya yang keluar?*",
    "🎴 *Gacha time! Semoga dapat yang langka~*",
    "🔴 *Strelizia sedang memilihkan untukmu~*",
    "💖 *Darling, ini untuk kamu!*"
];

const RARE_MESSAGES = {
    'zero two': "💗 *Wah! Dapat Zero Two langsung! Aku kan ini, Darling~*",
    'zerotwo': "💗 *Wah! Dapat Zero Two langsung! Aku kan ini, Darling~*",
    'ichigo': "🍓 *Ichigo! Dia pasti bakal jagain kamu~*",
    'hiro': "🤍 *Hiro! Partner-nya Zero Two nih~*"
};

function getRandomMessage(charName) {
    const lowerName = (charName || '').toLowerCase();
    for (const [key, msg] of Object.entries(RARE_MESSAGES)) {
        if (lowerName.includes(key)) {
            return msg;
        }
    }
    return GACHA_MESSAGES[Math.floor(Math.random() * GACHA_MESSAGES.length)];
}

async function handler(m, { sock, db, prefix }) {
    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 2;
    
    if (!m.isOwner && !m.isPremium) {
        const currentEnergy = user?.energi ?? 25;
        if (currentEnergy < energyCost) {
            return m.reply(
                `❌ *Energi tidak cukup!*\n\n` +
                `> Butuh *${energyCost} energi* untuk gacha\n` +
                `> Energimu: *${currentEnergy}*\n` +
                `> Ketik *${prefix}buyenergi* atau tunggu besok ya Darling~`
            );
        }
    }

    if (!m.isOwner && !m.isPremium) {
        db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
    }

    m.react('🎴');

    const darlingList = getDarlingList();

    if (darlingList.length === 0) {
        m.react('❌');
        return m.reply(
            `❌ *Belum ada karakter Darling!*\n\n` +
            `> Owner bisa nambahin pake:\n` +
            `> \`${prefix}add-gacha Nama | https://url.mp4\``
        );
    }

    const randomIndex = Math.floor(Math.random() * darlingList.length);
    const selected = darlingList[randomIndex];
    
    const charName = selected.name || 'Unknown';
    const videoUrls = selected.urls || [selected.url];
    const selectedUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    
    const randomMsg = getRandomMessage(charName);
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const caption = 
`╭━━〔 🎀 *GACHA ZERO TWO* 🎀 〕━━⬣
│
│  ✨ *${randomMsg}*
│
│  💗 *${charName}*
│  🎬 *By: NusaBot*
│  📅 *Time: ${time}*
│
│  “Semoga beruntung lain kali, Darling~”
│
╰━━━━━━━━━━━━━━━━━⬣`;

    try {
        await sock.sendMessage(
            m.chat,
            {
                video: { url: selectedUrl },
                mimetype: 'video/mp4',
                caption: caption,
                footer: `© ${config.bot?.name || 'NusaBot'} | Gacha System`
            },
            { quoted: m }
        );

        m.react('💗');

        if (charName.toLowerCase().includes('zero two') || charName.toLowerCase() === 'zerotwo') {
            await m.reply(
                `💕 *SPECIAL!* 💕\n\n` +
                `> “Wah, dapat aku, Darling! Kita partner selamanya ya~”\n` +
                `> — Zero Two`
            );
        }

    } catch (err) {
        console.error('[GachaZero] Error:', err.message);
        m.react('❌');
        await m.reply(
            `❌ *Gagal mengirim video!*\n\n` +
            `> Karakter: *${charName}*\n` +
            `> Error: ${err.message}\n\n` +
            `> Lapor ke owner ya Darling~`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};