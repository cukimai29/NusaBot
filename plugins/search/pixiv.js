const axios = require('axios');
const config = require('../../config.js');
const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'pixiv',
    alias: ['pixivsearch', 'caripixiv', 'pixivs'],
    category: 'search',
    description: 'Cari artwork di Pixiv',
    usage: '.pixiv <query>',
    example: '.pixiv rem',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true,
};

async function handler(m, { sock }) {
    try {
        const query = m.args?.join(' ')?.trim();

        if (!query) {
            return m.reply(
                `❌ *Masukkan kata kunci pencarian!*\n\n> Contoh: .pixiv rem`
            );
        }

        await m.react('🔍');

        // ===== CEK NSFW =====
        const nsfwEnabled = config.nsfw || false;

        const apikey = config.APIkey?.neoxr || 'Milik-Bot-ZeroTwo';
        const url = `https://api.neoxr.eu/api/pixiv-search?q=${encodeURIComponent(query)}&apikey=${apikey}`;

        const response = await axios.get(url, { timeout: 30000 });
        const data = response.data;

        if (!data.status || !data.data || data.data.length === 0) {
            await m.react('❌');
            return m.reply(`❌ *Tidak ditemukan hasil untuk:* ${query}`);
        }

        // ===== FILTER NSFW =====
        let results = data.data;

        if (!nsfwEnabled) {
            // Filter: Skip yang xRestrict > 0 (NSFW)
            const before = results.length;
            results = results.filter(art => art.xRestrict === 0);
            const after = results.length;
            
            if (results.length === 0) {
                await m.react('❌');
                return m.reply(
                    `❌ *Tidak ditemukan hasil SFW untuk:* ${query}\n\n` +
                    `📌 *Tips:*\n` +
                    `• Coba kata kunci lain\n` +
                    `• Atau aktifkan NSFW di config (${before} hasil di-filter karena NSFW)`
                );
            }
            
            console.log(`[Pixiv] Filter NSFW: ${before} → ${after} hasil (${before - after} di-skip)`);
        }

        results = results.slice(0, 10);

        const saluranId = config.saluran?.id || '120363400911374213@newsletter';
        const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot';

        let caption = `🎨 *ᴘɪxɪᴠ sᴇᴀʀᴄʜ*\n`;
        caption += `📝 *ᴋᴜᴇʀʏ:* ${query}\n`;
        caption += `📊 *ʜᴀsɪʟ:* ${results.length} artwork`;
        
        if (!nsfwEnabled) {
            const filtered = data.data.length - results.length;
            if (filtered > 0) {
                caption += ` (${filtered} NSFW di-skip)`;
            }
        }
        caption += `\n\n`;

        results.forEach((art, i) => {
            const aiLabel = art.aiType === 2 ? ' 🤖' : '';
            const isNsfw = art.xRestrict > 0 ? ' 🔞' : '';
            caption += `*${i + 1}.* ${art.title}${aiLabel}${isNsfw}\n`;
            caption += `   👤 ${art.userName}\n`;
            caption += `   📐 ${art.width}x${art.height} • 📄 ${art.pageCount} page\n`;
            caption += `   🔗 ${art.url}\n\n`;
        });

        caption += `> 🎨 Powered by Pixiv`;

        // ===== TOMBOL (hanya SFW) =====
        const buttons = results.slice(0, 5).map((art, i) => ({
            title: `${art.title.slice(0, 20)}${art.title.length > 20 ? '...' : ''}`,
            description: `by ${art.userName}`,
            id: `.pixivget ${art.url}`,
        }));

        await m.react('🎨');

        await sock.sendMessage(
            m.chat,
            {
                text: caption,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127,
                    },
                },
            },
            { quoted: m }
        );

    } catch (error) {
        console.error('[Pixiv] Error:', error);
        await m.react('☢');
        if (error.response?.status === 403) {
            return m.reply(`❌ *API Key tidak valid atau limit tercapai*`);
        }
        m.reply(te(m.prefix || '.', m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};