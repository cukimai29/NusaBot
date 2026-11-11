const { pinterest } = require('btch-downloader');
const axios = require('axios');

const pluginConfig = {
    name: 'pins2',
    alias: ['pinterest2', 'pinsearch2'],
    category: 'search',
    description: 'Cari gambar di Pinterest dengan button simpan & navigasi',
    usage: '.pins2 <query> #<jumlah>',
    example: '.pins2 Zhao Lusi #5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
};

function formatNumber(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
}

async function handler(m, { sock }) {
    const start = Date.now();
    const text = m.text?.trim() || '';
    
    if (!text) {
        return m.reply(
`🌸 PINTEREST SEARCH 🌸

Cari gambar dari Pinterest dengan mudah.

📌 Cara pakai:
.pins2 <kata kunci> #<jumlah>

📌 Contoh:
.pins2 Zhao Lusi #5
.pins2 meme #3
.pins2 anime #10

💡 Max 10 gambar
💡 Tanpa # akan 1 gambar

💗 NusaBot`
        );
    }

    let query = text;
    let limit = 1;

    const match = text.match(/#(\d+)$/);
    if (match) {
        limit = parseInt(match[1]);
        query = text.replace(/#\d+$/, '').trim();
        if (limit > 10) limit = 10;
        if (limit < 1) limit = 1;
    }

    if (!query) {
        return m.reply(`❌ Masukkan kata kunci pencarian!`);
    }

    await m.react('🔍');

    try {
        // FAST: langsung ambil data
        const data = await pinterest(query);
        const results = data?.result?.result?.result || data?.result || [];
        
        if (!results || results.length === 0) {
            await m.react('❌');
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`);
        }

        // FAST: ambil gambar tanpa download semua
        const images = [];
        for (let i = 0; i < Math.min(limit, results.length); i++) {
            const item = results[i];
            const imageUrl = item.image_url ||
                item.images?.orig?.url ||
                item.images?.['736x']?.url ||
                item.url ||
                item.thumbnail;
            
            if (imageUrl) {
                images.push({
                    url: imageUrl,
                    title: item.title || 'Pinterest Image',
                    author: item.uploader?.full_name || item.author || 'Unknown',
                    likes: item.like_count || item.likes || 0,
                    comments: item.comment_count || item.comments || 0
                });
            }
        }

        if (images.length === 0) {
            await m.react('❌');
            return m.reply(`❌ Gagal memuat gambar untuk: ${query}`);
        }

        // FAST: kirim 1 gambar tanpa download buffer
        if (images.length === 1) {
            const img = images[0];
            const caption = 
`🌸 ${img.title}

👤 Author: ${img.author}
❤️ Likes: ${formatNumber(img.likes)}
💬 Comments: ${formatNumber(img.comments)}
🔍 Query: ${query}

💗 NusaBot`;

            await sock.sendMessage(m.chat, {
                image: { url: img.url },
                caption: caption,
                buttons: [
                    {
                        buttonId: `saveimg_${img.url}`,
                        buttonText: { displayText: '💾 Simpan Gambar' },
                        type: 1
                    },
                    {
                        buttonId: `.pins2 ${query}`,
                        buttonText: { displayText: '🔄 Cari Lagi' },
                        type: 1
                    }
                ],
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363402057133599@newsletter',
                        newsletterName: 'NusaBot',
                        serverMessageId: 127,
                    }
                }
            }, { quoted: m });

            await m.react('🌸');
            const elapsed = Date.now() - start;
            console.log(`[Pins2] Selesai dalam ${elapsed}ms`);
            return;
        }

        // FAST: kirim multiple gambar (tanpa resize/compress)
        const media = [];
        for (const img of images) {
            try {
                const response = await axios.get(img.url, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                media.push({
                    image: Buffer.from(response.data),
                    caption: `🌸 ${img.title}\n👤 ${img.author}`
                });
            } catch (e) {
                console.log('[Pins2] Gagal download:', e.message);
            }
        }

        if (media.length === 0) {
            await m.react('❌');
            return m.reply(`❌ Gagal memuat gambar. Coba lagi.`);
        }

        await sock.sendMessage(m.chat, {
            images: media.map(m => m.image),
            caption: `🌸 ${query}\n📦 ${media.length} gambar ditemukan\n\n💗 NusaBot`
        }, { quoted: m });

        await m.react('🌸');
        const elapsed = Date.now() - start;
        console.log(`[Pins2] Selesai dalam ${elapsed}ms`);

    } catch (err) {
        console.error('[Pins2] Error:', err.message);
        await m.react('❌');
        await m.reply(`❌ Error: ${err.message}\n\n💡 Coba kata kunci lain.`);
    }
}

// ========== SAVE IMAGE ==========
async function saveImageHandler(m, { sock }) {
    const url = m.text?.replace(/^saveimg_/, '').trim();
    if (!url) return;

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        const buffer = Buffer.from(response.data);
        const timestamp = Date.now();
        const fileName = `pinterest_${timestamp}.jpg`;

        await sock.sendMessage(m.chat, {
            document: buffer,
            mimetype: 'image/jpeg',
            fileName: fileName,
            caption: `💾 Gambar berhasil disimpan!\n\n📁 ${fileName}\n📊 ${(buffer.length / 1024).toFixed(2)} KB\n\n💗 NusaBot`
        }, { quoted: m });

        await m.react('💾');
    } catch (err) {
        console.error('[SaveImg] Error:', err.message);
        await m.reply(`❌ Gagal menyimpan gambar: ${err.message}`);
    }
}

async function buttonHandler(m, { sock }) {
    if (m.text?.startsWith('saveimg_')) {
        await saveImageHandler(m, { sock });
        return true;
    }
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    saveImageHandler,
    buttonHandler
};