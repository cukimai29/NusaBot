const fetch = require('node-fetch') // Pastikan sudah install node-fetch

const pluginConfig = {
    name: 'slfbypass',
    alias: ['sflbypass', 'bypasssfl', 'bypass'],
    category: 'tools',
    description: 'Bypass link SFL (SFL-Unlocked)',
    usage: '.slfbypass <a>',
    example: '.slfbypass https://sfl.gl/D0Ze5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// Konfigurasi API
const URL_API = "https://sfl-unlocked-link-finder.lovable.app/api/public/bypass";
const API_KEY = "tio-sk-live-666732112399";

async function bypassSfl(link) {
    try {
        const res = await fetch(`${URL_API}?url=${encodeURIComponent(link)}&apikey=${API_KEY}`);
        const data = await res.json();
        return data.success ? { status: true, result: data.destination } : { status: false, message: data.message };
    } catch (error) {
        return { status: false, message: `Internal Server Error: ${error.message}` };
    }
}

async function handler(m, { sock, config: botConfig }) {
    // Mengambil link dari argumen pertama setelah command
    const link = m.args[0];

    if (!link) {
        await m.reply(
            `🔓 *SFL BYPASS*\n\n` +
            `Silahkan masukkan link SFL yang ingin dibypass.\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}slfbypass https://sfl.gl/xyz\``
        );
        return;
    }

    // Validasi sederhana apakah input berupa URL
    if (!link.startsWith('http')) {
        await m.reply('❌ Mohon masukkan URL yang valid!');
        return;
    }

    await m.react('⏳');

    try {
        const result = await bypassSfl(link);

        if (result.status) {
            await m.reply(
                `✅ *Bypass Berhasil!*\n\n` +
                `*Link Asli:* ${link}\n` +
                `*Destination:* ${result.result}`
            );
            await m.react('✅');
        } else {
            await m.reply(`❌ *Gagal Bypass:*\n${result.message}`);
            await m.react('❌');
        }
    } catch (error) {
        await m.reply(`❌ Terjadi kesalahan saat memproses link!\n_${error.message}_`);
        await m.react('❌');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};