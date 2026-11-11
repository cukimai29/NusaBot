// plugins/downloader/komikindo.js
const axios = require('axios');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const config = require('../../config');

const pluginConfig = {
    name: 'komikindo',
    alias: ['komik', 'manga', 'komikindo'],
    category: 'downloader',
    description: 'Search & download komik dari Komikindo jadi PDF',
    usage: '.komikindo <judul> atau .komikindo <link> atau .komikindo chapter|<link chapter>',
    example: '.komikindo bocchi the rock',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
};

const API = 'https://api.kaicloud.my.id/api/manga/komikindo';

function cleanTitle(t = '') {
    return t.replace(/^Komik\s*/i, '').replace(/\s+/g, ' ').trim();
}

function extractImageUrl(v) {
    if (typeof v === 'string') return v;
    return v?.url || v?.image || v?.src || v?.link || '';
}

async function downloadImage(url) {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'Referer': 'https://komikindo.ch/' }
    });
    return Buffer.from(data);
}

async function imagesToPDF(imageUrls) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ autoFirstPage: false });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            for (const url of imageUrls) {
                try {
                    let buffer = await downloadImage(url);
                    buffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();

                    const meta = await sharp(buffer).metadata();
                    const { width, height } = meta;

                    doc.addPage({ size: [width, height] });
                    doc.image(buffer, 0, 0, { width, height });
                } catch (e) {
                    console.log('[Komikindo] Gagal proses gambar:', url, e.message);
                }
            }

            doc.end();
        } catch (e) {
            reject(e);
        }
    });
}

async function handler(m, { sock, text, prefix, db }) {
    if (!text) {
        return m.reply(
            `❌ *Cara Penggunaan:*\n\n` +
            `> *${prefix}komikindo <judul>* — Cari komik\n` +
            `> *${prefix}komikindo <link komik>* — Lihat detail & chapter\n` +
            `> *${prefix}komikindo chapter|<link chapter>* — Download PDF\n\n` +
            `📌 *Contoh:*\n` +
            `> ${prefix}komikindo bocchi the rock\n` +
            `> ${prefix}komikindo chapter|https://komikindo.ch/...`
        );
    }

    // Cek energi
    const user = db.getUser(m.sender);
    const energyCost = pluginConfig.energi || 5;

    if (!m.isOwner && !m.isPremium) {
        const currentEnergy = user?.energi ?? 25;
        if (currentEnergy < energyCost) {
            return m.reply(
                `❌ *Energi tidak cukup!*\n\n` +
                `> Butuh *${energyCost} energi* untuk download komik\n` +
                `> Energimu: *${currentEnergy}*\n` +
                `> Tunggu reset atau beli energi dulu ya Darling~`
            );
        }
    }

    // MODE 1: Download chapter jadi PDF
    if (text.includes('|')) {
        const [, chapterUrl] = text.split('|');

        if (!chapterUrl?.trim()) {
            return m.reply('❌ Masukkan link chapter setelah tanda "|"');
        }

        await m.reply('🎨 *Sedang mengambil gambar & membuat PDF...*\n\n> Proses ini mungkin memakan waktu, sabar ya Darling~');
        m.react('⏳');

        try {
            const { data } = await axios.get(`${API}/read`, {
                params: { url: chapterUrl.trim() },
                headers: { accept: 'application/json' },
                timeout: 30000
            });

            if (!data?.status || !data?.data?.images?.length) {
                throw new Error('Gagal mengambil gambar chapter');
            }

            const images = data.data.images.map(extractImageUrl).filter(Boolean);
            const title = cleanTitle(data.data.title) || 'Komik';

            if (!images.length) throw new Error('Gagal mengambil gambar chapter');

            const pdfBuffer = await imagesToPDF(images);

            const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60) + '.pdf';

            // Potong energi
            if (!m.isOwner && !m.isPremium) {
                db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
            }

            m.react('📄');

            await sock.sendMessage(m.chat, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName,
                caption: `📄 *${title}*\n📑 Total halaman: *${images.length}*\n\n> © Komikindo | ${config.bot?.name || 'Bot'}`,
                footer: `© ${config.bot?.name || 'Bot'} | Komikindo`
            }, { quoted: m });

        } catch (err) {
            console.error('[Komikindo] Error PDF:', err.message);
            m.react('❌');
            return m.reply(
                `❌ *Gagal membuat PDF!*\n\n` +
                `> Error: ${err.message}\n\n` +
                `> Pastikan link chapter benar ya Darling~`
            );
        }
        return;
    }

    // MODE 2: Detail komik dari link
    if (/^https:\/\/komikindo\.ch\/komik\//i.test(text)) {
        m.react('🔍');

        try {
            const { data } = await axios.get(`${API}/detail`, {
                params: { url: text.trim() },
                headers: { accept: 'application/json' },
                timeout: 30000
            });

            if (!data?.status || !data?.data?.chapters?.length) {
                throw new Error('Chapter tidak ditemukan');
            }

            const detail = data.data;
            const title = cleanTitle(detail.title);

            // Potong energi
            if (!m.isOwner && !m.isPremium) {
                db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
            }

            const rows = detail.chapters.slice(0, 30).map(c => ({
                title: `Chapter ${c.chapter}`,
                description: c.date ? `📅 ${c.date}` : 'Tap untuk download PDF',
                id: `${prefix}komikindo chapter|${c.link}`
            }));

            await sock.sendMessage(m.chat, {
                image: { url: detail.image },
                caption: 
`╭━━〔 📚 *KOMIKINDO* 📚 〕━━⬣
│
│  📖 *${title}*
│
│  📊 *Status:* ${detail.info?.status || '-'}
│  ✍️ *Author:* ${detail.info?.author || '-'}
│  🏷️ *Genre:* ${(detail.genres || []).join(', ')}
│  📑 *Total Chapter:* ${detail.chapterCount ?? detail.chapters.length}
│
│  “Pilih chapter untuk download PDF~”
│
╰━━━━━━━━━━━━━━━━━━⬣`,
                footer: 'Komikindo • Pilih Chapter di Bawah',
                nativeFlow: [{
                    text: '📋 Pilih Chapter',
                    sections: [{
                        title: 'Daftar Chapter',
                        rows
                    }]
                }]
            }, { quoted: m });

            m.react('✅');

        } catch (err) {
            console.error('[Komikindo] Error Detail:', err.message);
            m.react('❌');
            return m.reply(
                `❌ *Gagal mengambil detail!*\n\n` +
                `> Error: ${err.message}`
            );
        }
        return;
    }

    // MODE 3: Search komik
    m.react('🔍');

    try {
        const { data } = await axios.get(`${API}/search`, {
            params: { q: text },
            headers: { accept: 'application/json' },
            timeout: 30000
        });

        if (!data?.status || !data?.data?.length) {
            throw new Error('Komik tidak ditemukan');
        }

        const hasil = data.data;

        // Potong energi
        if (!m.isOwner && !m.isPremium) {
            db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
        }

        const rows = hasil.slice(0, 20).map(v => ({
            title: v.title,
            description: `${v.type || '-'}${v.rating ? ' | ⭐ ' + v.rating : ''}`,
            id: `${prefix}komikindo ${v.link}`
        }));

        await sock.sendMessage(m.chat, {
            image: { url: hasil[0].image },
            caption:
`╭━━〔 🔎 *HASIL PENCARIAN* 🔎 〕━━⬣
│
│  🔍 *${text}*
│  📚 Total: *${hasil.length} komik*
│
│  “Pilih komik untuk lihat chapter~”
│
╰━━━━━━━━━━━━━━━━━━━━⬣`,
            footer: 'Komikindo • Pilih Komik di Bawah',
            nativeFlow: [{
                text: '📋 Pilih Komik',
                sections: [{
                    title: 'Daftar Komik',
                    rows
                }]
            }]
        }, { quoted: m });

        m.react('✅');

    } catch (err) {
        console.error('[Komikindo] Error Search:', err.message);
        m.react('❌');
        return m.reply(
            `❌ *Komik tidak ditemukan!*\n\n` +
            `> Coba cari dengan judul lain ya Darling~`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};