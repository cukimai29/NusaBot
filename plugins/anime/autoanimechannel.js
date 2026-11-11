const {
    loadSent,
    saveSent,
    loadState,
    saveState,
    getOngoingAnimeList,
    startAutoCheck,
    stopAutoCheck,
    isRunning
} = require('../../src/lib/zerotwo-auto-anime');

const config = require('../../config');
const axios = require('axios');
const cheerio = require('cheerio');

const pluginConfig = {
    name: 'autoanimechannel',
    alias: ['aawch', 'aach', 'autoanimech'],
    category: 'anime',
    description: 'Auto upload ongoing anime ke channel (bisa pilih channel 1/2/3)',
    usage: '.aawch <start|stop|status|cek|reset|setch>',
    example: '.aawch setch 2',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

function getChannelId(choice) {
    const channelMap = {
        '1': config.saluran?.id,
        '2': config.saluran?.id2,
        '3': config.saluran?.id3
    };
    return channelMap[choice] || config.saluran?.id;
}

function getChannelName(choice) {
    const nameMap = {
        '1': config.saluran?.name || 'Channel 1',
        '2': config.saluran?.name2 || 'Channel 2',
        '3': config.saluran?.name3 || 'Channel 3'
    };
    return nameMap[choice] || `Channel ${choice}`;
}

const BASE_URL = 'https://winbu.net';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': BASE_URL
};

async function fetchPage(url) {
    const res = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    return String(res.data);
}

function resolvePixeldrainPageUrl(rawUrl) {
    const id = (rawUrl.match(/pixeldrain\.(?:com|net)\/(?:u|d|api\/file)\/([a-zA-Z0-9]+)/i) || [])[1];
    if (id) return `https://pixeldrain.com/u/${id}`;
    return rawUrl;
}

function parseRelativeTimeToHours(timeStr) {
    if (!timeStr) return null;

    if (timeStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const pubDate = new Date(timeStr);
        if (!isNaN(pubDate)) return (Date.now() - pubDate) / (1000 * 60 * 60);
    }

    const regex = /(\d+)\s+(hour|day|minute|second)s?\s+ago/i;
    const match = timeStr.match(regex);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        switch (unit) {
            case 'hour': return value;
            case 'day': return value * 24;
            case 'minute': return value / 60;
            case 'second': return value / 3600;
        }
    }

    const timestamp = Date.parse(timeStr);
    if (!isNaN(timestamp)) return (Date.now() - timestamp) / (1000 * 60 * 60);

    return null;
}

async function getEpisodeTime(episodeUrl) {
    try {
        const html = await fetchPage(episodeUrl);
        const $ = cheerio.load(html);

        const metaTime = $('meta[property="article:published_time"]').attr('content');
        if (metaTime) return metaTime;

        const timeEl = $('time');
        if (timeEl.length) {
            const dt = timeEl.attr('datetime');
            if (dt) return dt;
            const txt = timeEl.text().trim();
            if (txt) return txt;
        }

        const dateText = ($('.post-date').text() || $('.entry-date').text() || $('.published').text()).trim();
        if (dateText) return dateText;

        const bodyText = $('body').text();
        const match = bodyText.match(/(\d+)\s+(hours?|days?|minutes?|seconds?)\s+ago/i);
        if (match) return match[0];

        return null;
    } catch {
        return null;
    }
}

// ===== FIX: hapus interactiveButtons, link langsung masuk caption =====
async function sendToChannel(sock, channelId, linkObj, meta) {
    const pageUrl = resolvePixeldrainPageUrl(linkObj.url);

    let coverBuffer = null;
    if (meta.cover) {
        try {
            const res = await axios.get(meta.cover, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
                    // sengaja TANPA Referer winbu.net - cover di-host di domain lain,
                    // Referer yang salah bisa bikin CDN nolak/kasih placeholder rusak
                }
            });

            const contentType = res.headers['content-type'] || '';
            if (contentType.startsWith('image/')) {
                coverBuffer = Buffer.from(res.data);
            } else {
                console.log(`[Channel] ⚠️ Cover bukan gambar valid (content-type: ${contentType}), skip pake cover`);
            }
        } catch (e) {
            console.log(`[Channel] ⚠️ Cover gagal: ${e.message}`);
        }
    }

    const caption =
        `*ANIME UPDATE! ✨*\n\n` +
        `📺 Judul: *${meta.title}*\n` +
        `🎞️ Episode: ${meta.episode}\n` +
        `📊 Kualitas: *${linkObj.quality}*\n\n` +
        `⬇️ Download:\n${pageUrl}`;

    try {
        const msgPayload = coverBuffer
            ? { image: coverBuffer, caption }
            : { text: caption };

        console.log('[Channel] Target channelId:', channelId);
        console.log('[Channel] Format valid?', channelId?.endsWith('@newsletter'));

        // ===== Samain persis pola .aaw (notifyAndSend) yang udah confirmed jalan =====
        await sock.sendMessage(channelId, msgPayload);

        console.log(`[Channel] ✅ ${meta.title} ${meta.episode}`);
    } catch (e) {
        console.error(`[Channel] ❌ Send error:`, e.message);
    }
}

let manualInterval = null;
let manualRunning = false;
let currentChannelChoice = '1';

async function manualRunCheck(sock, channelId) {
    const sent = loadSent();
    console.log(`[Channel] 🔍 Check: ${new Date().toLocaleString('id-ID')}`);

    let animeList;
    try {
        animeList = await getOngoingAnimeList();
    } catch (e) {
        console.error('[Channel] ❌ Fetch error:', e.message);
        return;
    }

    if (!animeList || animeList.length === 0) {
        console.log('[Channel] ⚠️ Tidak ada anime');
        return;
    }

    for (const anime of animeList) {
        try {
            const animeHtml = await fetchPage(anime.url);
            const $$ = cheerio.load(animeHtml);
            const episodeLink = $$('a[href*="episode"]').first();
            if (!episodeLink.length) continue;

            let href = episodeLink.attr('href') || '';
            const text = episodeLink.text().trim() || '';
            if (!href) continue;

            let fullUrl = href;
            if (!href.startsWith('http')) fullUrl = new URL(href, BASE_URL).href;

            const epMatch = fullUrl.match(/episode[_-]?(\d+)/i) || fullUrl.match(/ep[_-]?(\d+)/i);
            const epNum = epMatch ? epMatch[1] : 'Latest';
            const episodeKey = `${anime.slug}-${epNum}`;

            if (sent.has(episodeKey)) continue;

            const timeStr = await getEpisodeTime(fullUrl);
            if (timeStr) {
                const hours = parseRelativeTimeToHours(timeStr);
                if (hours !== null && hours >= 24) {
                    sent.add(episodeKey);
                    saveSent(sent);
                    continue;
                }
            }

            const epHtml = await fetchPage(fullUrl);
            const $$$ = cheerio.load(epHtml);
            let downloadUrl = null;
            let quality = '720p';

            $$$('.download-eps ul li').each((_, el) => {
                const q = $$$(el).find('strong').text().trim();
                if (!q) return;
                const pixeldrain = $$$(el).find('span a').filter((_, a) => {
                    const t = $$$(a).text().toLowerCase();
                    const u = $$$(a).attr('href') || '';
                    return t.includes('pixeldrain') || u.includes('pixeldrain');
                });
                if (pixeldrain.length) {
                    const match = q.match(/(\d{3,4}p)/i);
                    downloadUrl = pixeldrain.attr('href');
                    quality = match ? match[1] : '720p';
                }
            });

            if (downloadUrl) {
                await sendToChannel(sock, channelId, { url: downloadUrl, quality }, {
                    title: anime.title,
                    episode: text || `Episode ${epNum}`,
                    cover: anime.cover || ''
                });
                sent.add(episodeKey);
                saveSent(sent);
                await new Promise(r => setTimeout(r, 3000));
            }
        } catch (e) {
            console.log(`[Channel] ❌ Error ${anime.title}:`, e.message);
        }
    }
    console.log('[Channel] ✅ Check complete');
}

function manualStart(sock, channelId, intervalMin = 5) {
    if (manualInterval) clearInterval(manualInterval);
    manualRunning = true;
    manualRunCheck(sock, channelId).catch(e => console.error('[Channel]', e.message));
    manualInterval = setInterval(() => {
        manualRunCheck(sock, channelId).catch(e => console.error('[Channel]', e.message));
    }, intervalMin * 60 * 1000);
    if (manualInterval.unref) manualInterval.unref();
}

function manualStop() {
    if (manualInterval) clearInterval(manualInterval);
    manualInterval = null;
    manualRunning = false;
}

function initChannelAutoStart(sock) {
    const state = loadState();
    if (!state.enabled) return;
    const choice = state.channelChoice || '1';
    const channelId = state.channelId || getChannelId(choice);
    if (!channelId) return;
    currentChannelChoice = choice;
    console.log(`[Channel] 🔄 Auto-restore enabled → ${getChannelName(choice)}`);
    manualStart(sock, channelId, state.interval || 5);
}

async function handler(m, { sock }) {
    try {
        const args = m.args || [];
        const sub = args[0]?.toLowerCase() || '';
        const database = require('../../src/lib/database').getDatabase();

        const savedChannel = database.setting('autoAnimeChannel') || '1';
        currentChannelChoice = savedChannel;

        let channelId = getChannelId(currentChannelChoice);
        let channelName = getChannelName(currentChannelChoice);

        if (!channelId && sub !== 'setch') {
            return m.reply(
`❌ *CHANNEL ${currentChannelChoice} BELUM DIKONFIGURASI!*

> Isi dulu di config.js bagian saluran.id${currentChannelChoice}
> Atau ganti channel dengan:
> \`${m.prefix}aawch setch 1/2/3\``
            );
        }

        if (sub === 'setch') {
            const channelChoice = args[1];
            if (!channelChoice || !['1', '2', '3'].includes(channelChoice)) {
                return m.reply(
`╭━━━〔 🎬 SET CHANNEL 〕━━━⬣
│
│ > Pilih channel tujuan:
│
│ 1️⃣ ${config.saluran?.name || 'Channel 1'} ${config.saluran?.id ? '✅' : '❌'}
│ 2️⃣ ${config.saluran?.name2 || 'Channel 2'} ${config.saluran?.id2 ? '✅' : '❌'}
│ 3️⃣ ${config.saluran?.name3 || 'Channel 3'} ${config.saluran?.id3 ? '✅' : '❌'}
│
│ 📌 Contoh:
│ > ${m.prefix}aawch setch 2
│
╰━━━━━━━━━━━━━━━━⬣`
                );
            }

            const targetId = getChannelId(channelChoice);
            if (!targetId) {
                return m.reply(
`❌ *CHANNEL ${channelChoice} BELUM DIKONFIGURASI!*

> Isi dulu di config.js:
> \`saluran.id${channelChoice}\``
                );
            }

            database.setting('autoAnimeChannel', channelChoice);
            currentChannelChoice = channelChoice;

            if (manualRunning) {
                manualStop();
                saveState({ ...loadState(), enabled: false });
            }

            await m.react('✅');
            return m.reply(
`╭━━━〔 ✅ CHANNEL DIUBAH 〕━━━⬣
│
│ 📢 Auto anime sekarang dikirim ke:
│ > ${getChannelName(channelChoice)}
│ > \`${targetId}\`
│
│ 💡 Jalankan ${m.prefix}aawch start
│    untuk memulai auto upload
│
╰━━━━━━━━━━━━━━━━⬣`
            );
        }

        const state = loadState();

        switch (sub) {
            case 'start': {
                if (manualRunning) {
                    return m.reply(`⚠️ *AutoAnime sudah berjalan!*`);
                }

                const interval = state.interval || 5;
                manualStart(sock, channelId, interval);
                saveState({
                    ...state,
                    enabled: true,
                    channelId: channelId,
                    channelChoice: currentChannelChoice,
                    interval: interval
                });

                return sock.sendMessage(m.chat, {
                    text:
`✅ *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴄʜᴀɴɴᴇʟ sᴛᴀʀᴛᴇᴅ*

> 📺 Channel: *${channelName}*
> ⏱️ Interval: *${interval} menit*
> 🎞️ Filter: *Pixeldrain 720p+*
> ⏰ Max age: *24 jam*

Pengecekan pertama dimulai...`,
                    interactiveButtons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 Status',
                                id: `${m.prefix}aawch status`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🛑 Stop',
                                id: `${m.prefix}aawch stop`
                            })
                        }
                    ]
                }, { quoted: m });
            }

            case 'stop': {
                manualStop();
                saveState({ ...state, enabled: false });
                return m.reply(`🛑 *AutoAnime Channel dihentikan*`);
            }

            case 'status': {
                const sent = loadSent();
                const chStatus = getChannelId(currentChannelChoice) ? '✅' : '❌';

                return m.reply(
`📊 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴄʜᴀɴɴᴇʟ sᴛᴀᴛᴜs*

╭┈┈⬡「 📋 *I N F O* 」
┃ 🔄 Status: *${manualRunning ? '🟢 ON' : '🔴 OFF'}*
┃ 💾 Auto-start: *${state.enabled ? 'Ya' : 'Tidak'}*
┃ 📺 Channel: *${channelName}* ${chStatus}
┃ 🆔 Channel ID: *${channelId || '❌'}*
┃ 📋 Sudah terkirim: *${sent.size}* episode
┃ ⏱️ Interval: *${state.interval || 5} menit*
┃ 🎬 Sumber: *${BASE_URL}*
╰┈┈⬡

> 💡 ${m.prefix}aawch setch 1/2/3 untuk ganti channel`
                );
            }

            case 'cek':
            case 'check': {
                if (!channelId) {
                    return m.reply(
`❌ *CHANNEL ${currentChannelChoice} BELUM DIISI ID-NYA!*

> Cek config.saluran.id${currentChannelChoice}`
                    );
                }
                await m.reply('🔍 *Mengecek anime terbaru...*');
                try {
                    await manualRunCheck(sock, channelId);
                    return m.reply('✅ *Pengecekan selesai*');
                } catch (e) {
                    console.error('[AAWCH]', e);
                    return m.reply(`❌ *Error:* ${e.message}`);
                }
            }

            case 'reset': {
                const count = loadSent().size;
                saveSent(new Set());
                return m.reply(
`✅ *Reset berhasil*

> ${count} episode dihapus dari history`
                );
            }

            case 'interval': {
                const mins = parseInt(args[1]);
                if (!mins || mins < 1 || mins > 60) {
                    return m.reply(
`❌ *Interval harus 1-60 menit*

> Contoh:
> \`${m.prefix}aawch interval 10\``
                    );
                }

                saveState({ ...state, interval: mins });

                if (manualRunning) {
                    manualStop();
                    manualStart(sock, channelId, mins);
                }

                return m.reply(`✅ Interval diubah ke *${mins} menit*`);
            }

            default: {
                const running = manualRunning;
                const chList = [
                    `1️⃣ ${config.saluran?.name || 'Channel 1'}: ${config.saluran?.id ? '✅' : '❌'}`,
                    `2️⃣ ${config.saluran?.name2 || 'Channel 2'}: ${config.saluran?.id2 ? '✅' : '❌'}`,
                    `3️⃣ ${config.saluran?.name3 || 'Channel 3'}: ${config.saluran?.id3 ? '✅' : '❌'}`
                ].filter(c => c.includes('✅')).join('\n> ');

                return sock.sendMessage(m.chat, {
                    text:
`🎬 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴄʜᴀɴɴᴇʟ*

╭┈┈⬡「 📊 *S T A T U S* 」
┃ 🔄 Running: *${running ? '🟢 ON' : '🔴 OFF'}*
┃ 📺 Channel aktif: *${channelName}*
╰┈┈⬡

╭┈┈⬡「 📡 *C H A N N E L  T E R S E D I A* 」
> ${chList || '❌ Belum ada channel yang diisi'}
╰┈┈⬡

📌 *COMMAND:*
> ${m.prefix}aawch start
> ${m.prefix}aawch stop
> ${m.prefix}aawch status
> ${m.prefix}aawch setch 1/2/3
> ${m.prefix}aawch cek
> ${m.prefix}aawch interval 10
> ${m.prefix}aawch reset`,
                    interactiveButtons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: running ? '🛑 Stop' : '▶️ Start',
                                id: `${m.prefix}aawch ${running ? 'stop' : 'start'}`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 Status',
                                id: `${m.prefix}aawch status`
                            })
                        }
                    ]
                }, { quoted: m });
            }
        }
    } catch (e) {
        console.log(e);
        return m.reply(`❌ *Error*\n\n${e.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    initChannelAutoStart
};