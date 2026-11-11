/**
 * @file plugins/main/infobot.js
 */

const config = require('../../config');
const { formatUptime } = require('../../src/lib/formatter');
const { getCommandsByCategory } = require('../../src/lib/plugins');
const { loadImage } = require('../../src/lib/assetLoader'); // 🔥 IMPORT HELPER
const fs = require('fs');

const pluginConfig = {
    name: 'infobot',
    alias: ['botinfo', 'info', 'about'],
    category: 'main',
    description: 'Menampilkan informasi lengkap tentang bot',
    usage: '.infobot',
    example: '.infobot',
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock, config: botConfig, db, uptime }) {

    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const commandsByCategory = getCommandsByCategory();

    let totalCommands = 0;
    for (const category of Object.keys(commandsByCategory)) {
        totalCommands += commandsByCategory[category].length;
    }

    const stats = db.getStats();

    // 💖 NusaBot UI
    let infoText = `
╭━━━〔 🤖 ${botConfig.bot?.name || 'NusaBot'} 〕━━━⬣
┃
┃ Hai *${m.pushName || 'Darling'}* 😏
┃ Aku sudah aktif dan siap bantu kamu 💕
┃
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🤖 *INFORMASI BOT* 〕━━⬣
┃ ✦ Nama      : ${botConfig.bot?.name || 'NusaBot'}
┃ ✦ Versi     : ${botConfig.bot?.version || '2.0.0'}
┃ ✦ Developer : ${botConfig.bot?.developer || 'RzkyADS'}
┃ ✦ Owner     : ${botConfig.owner?.name || 'Owner'}
┃ ✦ Mode      : ${(botConfig.mode || 'public').toUpperCase()}
┃ ✦ Prefix    : [ ${botConfig.command?.prefix || '.'} ]
┃ ✦ Library   : Baileys MD
┃ ✦ Platform  : Node.js
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 📊 *STATISTIK* 〕━━⬣
┃ ✦ Uptime       : ${uptimeFormatted}
┃ ✦ Total Users  : ${totalUsers}
┃ ✦ Total Fitur  : ${totalCommands}
┃ ✦ CMD Executed : ${stats.commandsExecuted || 0}
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 💻 *RUNTIME* 〕━━⬣
┃ ✦ RAM    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
┃ ✦ Node   : ${process.version}
┃ ✦ Status : Online 🟢
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 💌 *MESSAGE* 〕━━⬣
┃ Jangan terlalu sering cek aku ya...
┃ nanti aku jadi kangen 😳💕
╰━━━━━━━━━━━━━━━━━━⬣
`

    // 📸 ambil gambar dashboard dari URL
    let imageBuffer = null
    try {
        imageBuffer = await loadImage('zerotwo-dasboard.jpg')
    } catch (e) {}

    // 🚀 kirim
    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: infoText
        }, { quoted: m.raw })
    } else {
        await sock.sendMessage(m.chat, {
            text: infoText
        }, { quoted: m.raw })
    }

}

module.exports = {
    config: pluginConfig,
    handler
}
