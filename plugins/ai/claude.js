const axios = require('axios');

const pluginConfig = {
    name: 'claude',
    alias: ['claudeai', 'claude-chat'],
    category: 'ai',
    description: 'Chat dengan Claude AI',
    usage: '.claude <pertanyaan>',
    example: '.claude Halo Claude',
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
            `🤖 *Claude AI*\n\n` +
            `Contoh:\n` +
            `${m.prefix}claude Halo Claude`
        );
    }

    m.react('⏳');

    try {
        const { data } = await axios.get(
            `https://api-faa.my.id/faa/claude-ai?text=${encodeURIComponent(text)}`,
            {
                timeout: 30000
            }
        );

        if (!data.status) {
            m.react('❌');
            return m.reply('❌ Claude gagal merespon.');
        }

        let msg = '';

        if (data.source) {
            msg += `🤖 *${data.source}*\n\n`;
        }

        if (data.think) {
            msg += `💭 *Thinking*\n${data.think}\n\n`;
        }

        msg += data.result || 'Tidak ada respon.';

        await m.reply(msg);

        m.react('✅');

    } catch (err) {
        console.log('[CLAUDE]', err);

        m.react('❌');

        return m.reply(
            `❌ Gagal mengambil respon Claude.\n\n${err.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};