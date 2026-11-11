const removebg = require('../../src/scraper/removebackground');
const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'removebg',
    alias: ['rmbg', 'nobg', 'hapusbg'],
    category: 'tools',
    description: 'Hapus background gambar - Zero Two style ✨ Biar makin cantik kayak aku, Darling~',
    usage: '.removebg (reply gambar)',
    example: '.removebg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('*🦋 ZERO TWO 🦋*\n\n*Hei Darling, mana gambarnya?*\n*Kirim atau reply gambar biar aku ilangin background-nya~*\n\n*Contoh: ${m.prefix}removebg*');
        }
        
        await m.reply('*⏳ DARLING, TUNGGU YA...*\n\n*Aku lagi ilangin background-nya biar gambarnya makin kece!*');
        
        let mediaBuffer;
        if (m.isImage && m.download) {
            mediaBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download();
        } else {
            return await m.reply('*💔 ZERO TWO 💔*\n\n*Maaf Darling, aku gagal download gambarnya...*\n*Coba lagi ya~*');
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            return await m.reply('*💔 ZERO TWO 💔*\n\n*Eh, gambarnya rusak atau gak valid nih Darling...*\n*Coba pake gambar lain yaa~*');
        }
        
        const tmpDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const tmpFile = path.join(tmpDir, `rmbg_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, mediaBuffer);
        
        const result = await removebg(tmpFile);
        
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
        
        if (result.status === 'eror' || typeof result !== 'string') {
            return await m.reply(`*💔 ZERO TWO ERROR 💔*\n\n*Wah gagal nih Darling...*\n*${result.msg || 'Tidak bisa hapus background-nya'}*\n\n*Coba lagi nanti ya!*`);
        }
        
        const axios = require('axios');
        const imgRes = await axios.get(result, { responseType: 'arraybuffer' });
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(imgRes.data),
            caption: '*🦋 ZERO TWO 🦋*\n\n*Tadaaa~ Selesai Darling!*\n*Background-nya sudah ilang, sekarang gambarnya jadi lebih keren!*\n*Kamu pasti suka, kan? 💕*'
        }, { quoted: m });
        
    } catch (error) {
        console.error('[RemoveBG Error]', error);
        await m.reply(`*💔 ZERO TWO ERROR 💔*\n\n*Ada masalah nih Darling...*\n*Coba lagi nanti ya, aku janji bakal benerin!*\n\n*Error: ${error.message}*`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};