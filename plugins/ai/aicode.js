const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'ai-code',
    alias: ['aicode', 'codeai', 'coding'],
    category: 'ai',
    description: 'AI generate & perbaiki kode programming',
    usage: '.ai-code <permintaan kode>',
    example: '.ai-code buatkan fungsi fibonacci di javascript',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const text = m.args?.join(' ') || m.text?.trim() || '';

    if (!text) {
        return m.reply(
`❌ *Masukkan permintaan kode!*

📌 Contoh: ${m.prefix || '.'}ai-code fungsi sorting array di python`
        );
    }

    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 1;
    
    if (!config.isOwner(m.sender) && !config.isPremium(m.sender) && (user?.energi ?? 25) < energyCost) {
        return m.reply(`❌ *Energi tidak cukup!*\n> Butuh ${energyCost} energi, energimu: ${user?.energi ?? 25}`);
    }

    await m.react('💻');

    try {
        const { data } = await axios.get(`https://api.kaicloud.my.id/api/ai/gpt4o?q=Buatkan kode program untuk: ${encodeURIComponent(text)}. Tampilkan kode lengkap dengan penjelasan singkat.&system=Kamu adalah senior programmer yang ahli dalam semua bahasa pemrograman`, {
            timeout: 60000
        });
        
        if (!data?.status) throw new Error('Gagal generate kode');

        const result = data.data || 'Gagal generate kode';
        
        if (!config.isOwner(m.sender) && !config.isPremium(m.sender)) {
            db.updateEnergi(m.sender, -energyCost);
        }
        
        await m.react('✅');

        await m.reply(
`╭━━〔 💻 *AI CODE GEN* 💻 〕━━⬣
│
│  📝 *Request:* ${text}
│
│  ${result}
│
╰━━━━━━━━━━━━━━━━━━⬣`
        );

    } catch (err) {
        await m.react('❌');
        await m.reply(`❌ *Gagal!*\n> ${err.message}`);
    }
}

module.exports = { 
    config: pluginConfig, 
    handler 
};