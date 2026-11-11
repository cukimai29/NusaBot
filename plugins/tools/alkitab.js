const axios = require('axios');
const config = require('../../config');

const pluginConfig = {
    name: 'alkitab',
    alias: ['bible', 'injil', 'firman'],
    category: 'tools',
    description: 'Baca Alkitab, cari ayat, dan jadwal bacaan harian',
    usage: '.alkitab <read|search|harian|list>',
    example: '.alkitab read Kejadian 1 in-tb',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
};

const VERSIONS = {
    'in-tb': 'Terjemahan Baru (Indonesia)',
    'in-bimk': 'Bahasa Indonesia Masa Kini',
    'in-tl': 'Terjemahan Lama',
    'en-kjv': 'King James Version (English)',
    'en-asv': 'American Standard Version',
    'jv-jawa': 'Jawa 1981',
    'su-sunda': 'Sunda 1991',
    'bbc-toba': 'Batak Toba',
    'sda-toraja': 'Toraja'
};

const BOOKS = [
    "Kejadian", "Keluaran", "Imamat", "Bilangan", "Ulangan",
    "Yosua", "Hakim-hakim", "Rut", "1 Samuel", "2 Samuel",
    "1 Raja-raja", "2 Raja-raja", "1 Tawarikh", "2 Tawarikh", "Ezra",
    "Nehemia", "Ester", "Ayub", "Mazmur", "Amsal",
    "Pengkhotbah", "Kidung Agung", "Yesaya", "Yeremia", "Ratapan",
    "Yehezkiel", "Daniel", "Hosea", "Yoel", "Amos",
    "Obaja", "Yunus", "Mikha", "Nahum", "Habakuk",
    "Zefanya", "Hagai", "Zakharia", "Maleakhi",
    "Matius", "Markus", "Lukas", "Yohanes", "Kisah Para Rasul",
    "Roma", "1 Korintus", "2 Korintus", "Galatia", "Efesus",
    "Filipi", "Kolose", "1 Tesalonika", "2 Tesalonika", "1 Timotius",
    "2 Timotius", "Titus", "Filemon", "Ibrani", "Yakobus",
    "1 Petrus", "2 Petrus", "1 Yohanes", "2 Yohanes", "3 Yohanes",
    "Yudas", "Wahyu"
];

function cleanHtmlText(htmlStr) {
    return htmlStr
        .replace(/<span class="vn">.*?<\/span>/gi, '')
        .replace(/<span class="xref".*?><\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

async function getChapter(book, chapter = 1, version = 'in-tb') {
    try {
        const formattedBook = encodeURIComponent(book);
        const url = `https://alkitab.me/${version}/${formattedBook}/${chapter}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
        };

        const response = await axios.get(url, { headers, timeout: 10000 });
        const html = response.data;

        const verses = [];
        const verseRegex = /<div id="verse-\d+" class="vw\s*" data-verse="(\d+)">([\s\S]*?)<\/div>/gi;

        let match;
        while ((match = verseRegex.exec(html)) !== null) {
            const verseNum = parseInt(match[1]);
            const rawContent = match[2];
            const cleanText = cleanHtmlText(rawContent);

            if (verseNum && cleanText) {
                verses.push({
                    verse: verseNum,
                    text: cleanText
                });
            }
        }

        return {
            status: true,
            version: version,
            version_name: VERSIONS[version] || version,
            book: book,
            chapter: parseInt(chapter),
            total_verses: verses.length,
            verses: verses
        };
    } catch (error) {
        return {
            status: false,
            book: book,
            chapter: chapter,
            error: error.message
        };
    }
}

async function searchAlkitab(query, pl = true, pb = true) {
    try {
        const url = `https://alkitab.me/search?q=${encodeURIComponent(query)}${pl ? '&pl=1' : ''}${pb ? '&pb=1' : ''}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(url, { headers, timeout: 10000 });
        const html = response.data;

        const searchResults = [];
        const itemRegex = /<div class="vw[^"]*">([\s\S]*?)<\/div>/gi;

        let match;
        while ((match = itemRegex.exec(html)) !== null) {
            const itemHtml = match[1];
            const linkMatch = itemHtml.match(/<a href="([^"]+)">([^<]+)<\/a>/i);

            if (linkMatch) {
                const link = `https://alkitab.me${linkMatch[1]}`;
                const address = linkMatch[2].trim();
                const content = cleanHtmlText(itemHtml.replace(/<a[^>]*>.*?<\/a>/gi, ''));

                searchResults.push({
                    address: address,
                    content: content,
                    link: link
                });
            }
        }

        return {
            status: true,
            query: query,
            total_results: searchResults.length,
            results: searchResults
        };
    } catch (error) {
        return {
            status: false,
            query: query,
            error: error.message
        };
    }
}

async function getBacaanHarian() {
    try {
        const url = 'https://alkitab.me/harian';
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(url, { headers, timeout: 10000 });
        const html = response.data;

        const schedule = [];
        const rowRegex = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;

        let match;
        while ((match = rowRegex.exec(html)) !== null) {
            const date = cleanHtmlText(match[1]);
            const rawReading = match[2];
            const reading = cleanHtmlText(rawReading);
            const linkMatch = rawReading.match(/href="([^"]+)"/i);

            if (date && reading) {
                schedule.push({
                    date: date,
                    reading: reading,
                    link: linkMatch ? `https://alkitab.me${linkMatch[1]}` : null
                });
            }
        }

        return {
            status: true,
            total_days: schedule.length,
            schedule: schedule
        };
    } catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

async function handler(m, { sock }) {
    const args = m.args || [];
    const command = args[0]?.toLowerCase();

    if (!command || ['help', '--help'].includes(command)) {
        return m.reply(
`📖 *ALKITAB ME - BACA FIRMAN TUHAN*

╭━━━〔 📖 *CARA PAKAI* 〕━━━⬣
│
│ ✦ *Read Pasal:*
│   .alkitab read <kitab> <pasal> [terjemahan]
│   Contoh: .alkitab read Kejadian 1 in-tb
│
│ ✦ *Cari Ayat:*
│   .alkitab search <kata kunci>
│   Contoh: .alkitab search kasih
│
│ ✦ *Bacaan Harian:*
│   .alkitab harian
│
│ ✦ *Daftar Kitab:*
│   .alkitab list
│
╰━━━━━━━━━━━━━━━━⬣

📌 *Terjemahan tersedia:*
in-tb (TB), in-bimk (BIMK), in-tl (TL)
en-kjv (KJV), en-asv (ASV), jv-jawa, su-sunda`

        );
    }

    await m.react('📖');

    try {
        if (command === 'read') {
            const book = args[1] || 'Kejadian';
            const chapter = parseInt(args[2]) || 1;
            const version = args[3] || 'in-tb';

            if (!VERSIONS[version]) {
                return m.reply(`❌ *Terjemahan "${version}" tidak ditemukan!*\n\nGunakan: in-tb, in-bimk, in-tl, en-kjv, en-asv, jv-jawa, su-sunda`);
            }

            const result = await getChapter(book, chapter, version);

            if (!result.status) {
                return m.reply(`❌ *Gagal membaca ayat!*\n> ${result.error}`);
            }

            let text = `📖 *${result.book} ${result.chapter}*\n`;
            text += `📌 ${result.version_name}\n`;
            text += `━━━━━━━━━━━━━━━━━━\n\n`;

            for (const v of result.verses) {
                text += `*${v.verse}.* ${v.text}\n\n`;
            }

            if (text.length > 4096) {
                const chunks = text.match(/[\s\S]{1,4000}/g) || [];
                for (const chunk of chunks) {
                    await m.reply(chunk);
                }
            } else {
                await m.reply(text);
            }

            await m.react('✅');

        } else if (command === 'search') {
            const query = args.slice(1).join(' ');

            if (!query) {
                return m.reply(`❌ *Masukkan kata kunci!*\n\nContoh: .alkitab search kasih`);
            }

            const result = await searchAlkitab(query);

            if (!result.status) {
                return m.reply(`❌ *Gagal mencari!*\n> ${result.error}`);
            }

            if (result.total_results === 0) {
                return m.reply(`❌ *Tidak ditemukan ayat untuk:* "${query}"`);
            }

            let text = `🔍 *Hasil Pencarian: "${query}"*\n`;
            text += `📦 Ditemukan ${result.total_results} hasil\n`;
            text += `━━━━━━━━━━━━━━━━━━\n\n`;

            const maxShow = Math.min(result.results.length, 10);
            for (let i = 0; i < maxShow; i++) {
                const r = result.results[i];
                text += `*${r.address}*\n`;
                text += `${r.content}\n\n`;
            }

            if (result.total_results > 10) {
                text += `_...dan ${result.total_results - 10} hasil lainnya_`;
            }

            await m.reply(text);
            await m.react('✅');

        } else if (command === 'harian') {
            const result = await getBacaanHarian();

            if (!result.status) {
                return m.reply(`❌ *Gagal mengambil bacaan harian!*\n> ${result.error}`);
            }

            let text = `📅 *BACAAN HARIAN ALKITAB*\n`;
            text += `━━━━━━━━━━━━━━━━━━\n\n`;

            const maxShow = Math.min(result.schedule.length, 7);
            for (let i = 0; i < maxShow; i++) {
                const s = result.schedule[i];
                text += `*${s.date}*\n`;
                text += `${s.reading}\n\n`;
            }

            await m.reply(text);
            await m.react('✅');

        } else if (command === 'list') {
            let text = `📚 *DAFTAR KITAB ALKITAB*\n`;
            text += `━━━━━━━━━━━━━━━━━━\n\n`;
            text += `*Total: ${BOOKS.length} kitab*\n\n`;

            const oldTestament = BOOKS.slice(0, 39);
            const newTestament = BOOKS.slice(39);

            text += `📜 *Perjanjian Lama (39)*\n`;
            for (const book of oldTestament) {
                text += `• ${book}\n`;
            }

            text += `\n✝️ *Perjanjian Baru (27)*\n`;
            for (const book of newTestament) {
                text += `• ${book}\n`;
            }

            text += `\n📌 *Terjemahan tersedia:*\n`;
            for (const [key, name] of Object.entries(VERSIONS)) {
                text += `• ${key} - ${name}\n`;
            }

            await m.reply(text);
            await m.react('✅');

        } else {
            return m.reply(`❌ *Perintah "${command}" tidak dikenal!\n\nKetik .alkitab help untuk bantuan.`);
        }

    } catch (error) {
        await m.react('❌');
        console.error('[Alkitab] Error:', error);
        return m.reply(`❌ *Terjadi kesalahan!*\n> ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};