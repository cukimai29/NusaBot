const axios = require('axios');

const API = "https://saveig.in/wp-json/visolix/api/download";

async function saveig(url) {
    const res = await axios.post(API, {
        url: url,
        format: "",
        captcha_response: null
    }, {
        headers: {
            "accept": "*/*",
            "content-type": "application/json",
            "origin": "https://saveig.in",
            "referer": "https://saveig.in/",
            "x-visolix-nonce": "66b14bdf91"
        },
        timeout: 30000
    });

    const json = res.data;
    if (!json.status) throw new Error("Gagal ambil media");

    const html = json.data;
    const results = [...html.matchAll(/href="([^"]*dl\.php\?id=[^"]+)"/g)]
        .map(m => m[1].replace(/&amp;/g, "&"));

    return {
        status: true,
        url: url,
        total: results.length,
        result: results
    };
}

const pluginConfig = {
    name: ['igdl2', 'instagram2', 'saveig'],
    alias: ['ig2'],
    category: 'downloader',
    description: 'Download video/gambar Instagram (versi 2)',
    usage: `.igdl2 <url>`,
    example: `.igdl2 https://www.instagram.com/p/DZm4ZVYk00W/`,
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    let text = m.text?.trim();
    if (!text) {
        return m.reply(`❌ *Url kosong!*\n\nContoh: .igdl2 https://www.instagram.com/p/DZm4ZVYk00W/`);
    }

    try {
        await m.react('⏳');
        const data = await saveig(text);
        
        if (!data.result || data.result.length === 0) {
            return m.reply(`❌ *Gagal!*\n\n> Media gak ditemukan`);
        }

        let caption = `📥 *Instagram Downloader v2*\n` +
                      `> Total Media: ${data.total}\n` +
                      `> Url: ${data.url}`;

        if (data.total === 1) {
            await sock.sendMessage(m.chat, {
                video: { url: data.result[0] },
                caption: caption
            }, { quoted: m });
        } else {
            for (let url of data.result) {
                await sock.sendMessage(m.chat, {
                    video: { url: url }
                }, { quoted: m });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            await m.reply(caption);
        }

        await m.react('✅');
    } catch (err) {
        console.error('IGDL2 Error:', err);
        return m.reply(`❌ *Error!*\n\n> ${err.message || 'Coba lagi nanti'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};