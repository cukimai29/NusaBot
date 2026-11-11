const te = require('../../src/lib/zerotwo-error.js');
const yts = require('yt-search');

const pluginConfig = {
    name: 'zer-yt',
    alias: ['zyt', 'ytsearch', 'cariyt'],
    category: 'search',
    description: 'Cari video YouTube & tampilkan di chat',
    usage: '.zer-yt <judul>',
    example: '.zer-yt dj terbaru',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

function buildHtml(results) {
    let cardsHtml = '';
    let buttonsHtml = '';

    results.slice(0, 6).forEach((v, i) => {
        const thumb = v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;
        const views = v.views ? Number(v.views).toLocaleString() : '?';
        const durasi = v.duration || '?';
        const title = v.title || 'No title';
        const url = v.url || `https://youtu.be/${v.videoId}`;

        cardsHtml += `
        <div class="card-yt">
          <img src="${thumb}" alt="thumbnail" class="thumb" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22%3E%3Crect width=%22200%22 height=%22120%22 fill=%22%23333%22/%3E%3Ctext x=%22100%22 y=%2260%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2216%22 font-family=%22Arial%22%3ENo Image%3C/text%3E%3C/svg%3E'">
          <div class="info">
            <div class="title">${title}</div>
            <div class="meta">⏱️ ${durasi} • 👁️ ${views}</div>
            <div class="meta">📺 ${v.author?.name || 'Unknown'}</div>
          </div>
          <div class="actions">
            <button class="btn-download" onclick="window.open('https://api.zerotwo.bot/ytmp4?url=${encodeURIComponent(url)}', '_blank')">🎬 Video</button>
            <button class="btn-download" onclick="window.open('https://api.zerotwo.bot/ytmp3?url=${encodeURIComponent(url)}', '_blank')">🎵 Audio</button>
            <button class="btn-link" onclick="window.open('${url}', '_blank')">🔗 YouTube</button>
          </div>
        </div>
        `;
    });

    buttonsHtml = `
    <button class="btn-refresh" onclick="location.reload()">🔄 Cari Ulang</button>
    <button class="btn-menu" onclick="window.open('https://wa.me/?text=.zer-yt', '_blank')">📋 Menu</button>
    `;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Zero YT Search</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}
body{background:#0a0a1a;padding:12px;min-height:100vh;display:flex;flex-direction:column;align-items:center;}
.container{width:100%;max-width:420px;}
.header{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:2px solid #ff0033;margin-bottom:12px;}
.header h1{color:#fff;font-size:18px;font-weight:700;}
.header span{color:#ff0033;font-size:14px;}
.query{color:#aaa;font-size:13px;padding:0 0 10px 0;text-align:center;}
.query b{color:#fff;}
.grid{display:flex;flex-direction:column;gap:12px;}
.card-yt{background:#1a1a2e;border-radius:12px;overflow:hidden;border:1px solid #2a2a4a;}
.thumb{width:100%;aspect-ratio:16/9;object-fit:cover;background:#111;}
.info{padding:10px 12px;}
.title{color:#fff;font-weight:600;font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;min-height:38px;}
.meta{color:#888;font-size:11px;margin-top:4px;}
.actions{display:flex;gap:6px;padding:8px 12px 12px 12px;}
.actions button{flex:1;border:none;border-radius:8px;padding:8px 0;font-size:12px;font-weight:700;cursor:pointer;}
.btn-download{background:linear-gradient(180deg,#ff0033,#cc0022);color:#fff;}
.btn-link{background:#2a2a4a;color:#fff;}
.btn-refresh{background:linear-gradient(180deg,#00a884,#008866);color:#fff;flex:1;padding:10px 0;border:none;border-radius:8px;font-weight:700;cursor:pointer;}
.btn-menu{background:#2a2a4a;color:#fff;flex:1;padding:10px 0;border:none;border-radius:8px;font-weight:700;cursor:pointer;}
.bottom-actions{display:flex;gap:8px;margin-top:12px;width:100%;}
.footer{color:#555;font-size:10px;text-align:center;margin-top:12px;padding:8px 0;}
.footer a{color:#ff0033;text-decoration:none;}
@media(max-width:380px){.title{font-size:13px;}.actions button{font-size:11px;padding:6px 0;}}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🎬 Zero YT</h1>
<span>${results.length} hasil</span>
</div>
<div class="query">🔍 <b>${escapeHtml(results[0]?.query || '')}</b></div>
<div class="grid">
${cardsHtml}
</div>
<div class="bottom-actions">
${buttonsHtml}
</div>
<div class="footer">
<a href="https://whatsapp.com/channel/0029Va..." target="_blank">NusaBot</a> • ${new Date().toLocaleDateString('id-ID')}
</div>
</div>
<script>
function escapeHtml(text){const d=document.createElement('div');d.textContent=text;return d.innerHTML;}
window.onerror=function(){};
</script>
</body>
</html>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}

async function handler(m, { sock }) {
    const query = m.args?.join(' ') || m.text?.trim() || '';

    if (!query) {
        return m.reply(
`🎬 *Zero YT Search*

Cari video YouTube langsung di chat!

📌 *Cara pakai:*
> .zer-yt <judul/lagu>

📝 *Contoh:*
> .zer-yt dj terbaru
> .zer-yt lagu sedih
> .zer-yt tutorial coding

⚡ *Fitur:*
• Tampilkan thumbnail, judul, durasi
• Tombol download video/audio
• Buka langsung ke YouTube

_Ketik .zer-yt <judul> untuk mulai!_`
        );
    }

    await m.react('🔍');

    try {
        const searchResults = await yts(query);

        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            await m.react('❌');
            return m.reply(`❌ Tidak ditemukan hasil untuk *"${query}"*\n\n> Coba gunakan kata kunci lain.`);
        }

        const videos = searchResults.videos.slice(0, 8);
        const html = buildHtml(videos);

        await sock.relayMessage(
            m.chat,
            {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                    botMetadata: {}
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            submessages: [
                                {
                                    messageType: 2,
                                    messageText: 'Zero YT Search'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'zeroyt_' + Date.now(),
                                        sections: [
                                            {
                                                view_model: {
                                                    primitive: {
                                                        __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                                        payload: html,
                                                        trusted_sources: []
                                                    },
                                                    __typename: 'GenAISingleLayoutViewModel'
                                                }
                                            }
                                        ]
                                    })
                                ).toString('base64')
                            },
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedAiBotMessageInfo: {
                                    botJid: '867051314767696@bot'
                                },
                                forwardOrigin: 4
                            }
                        }
                    }
                }
            },
            {}
        );

        await m.react('✅');

    } catch (err) {
        await m.react('❌');
        console.error('[ZeroYT Error]', err);
        await m.reply(`❌ *Gagal mencari!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};