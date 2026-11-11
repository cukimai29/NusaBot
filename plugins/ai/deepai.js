const axios = require('axios');

const pluginConfig = {
    name: 'deepai',
    alias: ['deepseek', 'ai', 'chatai'],
    category: 'ai',
    description: 'Chat AI DeepSeek',
    usage: '.deepai <pertanyaan>',
    example: '.deepai Halo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `🤖 *Deep AI*\n\n` +
            `Contoh:\n` +
            `${m.prefix}deepai Halo`
        );
    }

    m.react('⏳');

    try {
        const { data } = await axios.get(
            `https://api-faa.my.id/faa/deep-ai?text=${encodeURIComponent(text)}`,
            {
                timeout: 30000
            }
        );

        if (!data.status) {
            m.react('❌');
            return m.reply('❌ AI gagal merespon.');
        }

        await m.reply(data.result || 'Tidak ada respon.');

        m.react('✅');

    } catch (err) {
        console.log('[DEEPAI]', err);

        m.react('❌');

        return m.reply(
            `❌ Gagal mengambil respon AI.\n\n${err.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};