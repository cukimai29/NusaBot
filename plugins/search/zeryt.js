const te = require('../../src/lib/zerotwo-error.js');
const yts = require('yt-search');

const pluginConfig = {
    name: 'zer-yt',
    alias: ['zyt', 'ytsearch', 'cariyt'],
    category: 'search',
    description: 'Cari video YouTube & putar langsung di chat!',
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

function buildHtml(result, query) {
    const thumb = result.thumbnail || `https://img.youtube.com/vi/${result.videoId}/hqdefault.jpg`;
    const views = result.views ? Number(result.views).toLocaleString() : '?';
    const durasi = result.duration || '?';
    const title = result.title || 'No title';
    const url = result.url || `https://youtu.be/${result.videoId}`;
    const author = result.author?.name || 'Unknown';
    const videoId = result.videoId || '';

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Zero YT Player</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}
body{background:#0a0a1a;padding:16px;min-height:100vh;display:flex;justify-content:center;align-items:center;}
.container{width:100%;max-width:400px;background:linear-gradient(145deg,#1a1a2e,#12121f);border-radius:20px;padding:20px;border:1px solid #2a2a4a;box-shadow:0 20px 60px rgba(0,0,0,0.8);}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.header h1{color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;}
.header span{color:#ff0033;font-size:12px;background:rgba(255,0,51,0.15);padding:4px 12px;border-radius:20px;font-weight:600;}
.query{color:#888;font-size:13px;text-align:center;padding:8px 0 16px 0;border-bottom:1px solid #1a1a2e;}
.query b{color:#fff;}
.thumb-wrap{position:relative;border-radius:16px;overflow:hidden;margin:12px 0;background:#0a0a1a;aspect-ratio:16/9;}
.thumb-wrap img{width:100%;height:100%;object-fit:cover;}
.duration-badge{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.8);color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;}
.info{padding:12px 0 8px 0;}
.title{color:#fff;font-size:17px;font-weight:700;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.author{color:#888;font-size:13px;margin-top:4px;}
.author b{color:#aaa;}
.meta{color:#666;font-size:12px;margin-top:4px;}
.video-wrapper{position:relative;border-radius:16px;overflow:hidden;margin:12px 0;background:#000;aspect-ratio:16/9;display:none;}
.video-wrapper video{width:100%;height:100%;object-fit:contain;background:#000;}
.video-wrapper.active{display:block;}
.audio-wrapper{display:none;margin:12px 0;padding:12px;background:#1a1a2e;border-radius:12px;border:1px solid #2a2a4a;}
.audio-wrapper.active{display:block;}
.audio-wrapper audio{width:100%;}
.controls{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
.controls-row{display:flex;gap:8px;}
.controls button{flex:1;border:none;border-radius:12px;padding:12px 0;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.controls button:active{transform:scale(0.95);filter:brightness(0.85);}
.btn-play{background:linear-gradient(180deg,#ff0033,#cc0022);color:#fff;}
.btn-audio{background:linear-gradient(180deg,#00a884,#008866);color:#fff;}
.btn-youtube{background:#1a1a2e;color:#fff;border:1px solid #2a2a4a;}
.btn-youtube i{color:#ff0033;margin-right:4px;}
.btn-toggle{background:#2a2a4a;color:#fff;border:1px solid #3a3a5a;flex:0.5;}
.btn-toggle.active{background:#ff0033;border-color:#ff0033;}
.bottom-actions{display:flex;gap:8px;margin-top:12px;}
.bottom-actions button{flex:1;border:none;border-radius:12px;padding:10px 0;font-size:12px;font-weight:600;cursor:pointer;}
.btn-back{background:#2a2a4a;color:#fff;border:1px solid #3a3a5a;}
.btn-back i{color:#888;margin-right:4px;}
.footer{color:#555;font-size:10px;text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid #1a1a2e;}
.footer a{color:#ff0033;text-decoration:none;}
@media(max-width:380px){.title{font-size:15px;}.controls button{font-size:12px;padding:10px 0;}}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🎬 Zero Player</h1>
<span>${query ? '1 hasil' : '🎵'}</span>
</div>
<div class="query">🔍 <b>${escapeHtml(query)}</b></div>

<div class="thumb-wrap">
<img src="${thumb}" alt="thumbnail" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22%3E%3Crect width=%22200%22 height=%22120%22 fill=%22%23333%22/%3E%3Ctext x=%22100%22 y=%2260%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E'">
<div class="duration-badge">⏱️ ${durasi}</div>
</div>

<div class="video-wrapper" id="videoWrapper">
<video id="videoPlayer" controls playsinline webkit-playsinline>
<source src="https://api.zerotwo.bot/ytmp4?url=${encodeURIComponent(url)}" type="video/mp4">
Your browser doesn't support video.
</video>
</div>

<div class="audio-wrapper" id="audioWrapper">
<audio id="audioPlayer" controls>
<source src="https://api.zerotwo.bot/ytmp3?url=${encodeURIComponent(url)}" type="audio/mpeg">
Your browser doesn't support audio.
</audio>
</div>

<div class="info">
<div class="title">${escapeHtml(title)}</div>
<div class="author">👤 <b>${escapeHtml(author)}</b></div>
<div class="meta">👁️ ${views} views • ⏱️ ${durasi}</div>
</div>

<div class="controls">
<div class="controls-row">
<button class="btn-play" id="btnPlay">▶ Play Video</button>
<button class="btn-audio" id="btnAudio">🎵 Play Audio</button>
</div>
<div class="controls-row">
<button class="btn-youtube" id="btnYoutube">🔗 Buka YouTube</button>
<button class="btn-toggle" id="btnToggle">⬇️ Download</button>
</div>
</div>

<div class="bottom-actions">
<button class="btn-back" id="btnBack">🔍 Cari Ulang</button>
<button class="btn-back" id="btnMenu">📋 Menu</button>
</div>

<div class="footer">
<a href="https://whatsapp.com/channel/0029Va..." target="_blank">NusaBot</a> • ${new Date().toLocaleDateString('id-ID')}
</div>
</div>

<script>
function escapeHtml(text){const d=document.createElement('div');d.textContent=text;return d.innerHTML;}

const videoWrapper=document.getElementById('videoWrapper');
const audioWrapper=document.getElementById('audioWrapper');
const videoPlayer=document.getElementById('videoPlayer');
const audioPlayer=document.getElementById('audioPlayer');

document.getElementById('btnPlay').addEventListener('click',function(){
videoWrapper.classList.toggle('active');
audioWrapper.classList.remove('active');
if(videoWrapper.classList.contains('active')){
this.textContent='⏹ Close Video';
videoPlayer.play().catch(()=>{});
}else{
this.textContent='▶ Play Video';
videoPlayer.pause();
}
});

document.getElementById('btnAudio').addEventListener('click',function(){
audioWrapper.classList.toggle('active');
videoWrapper.classList.remove('active');
if(audioWrapper.classList.contains('active')){
this.textContent='⏹ Close Audio';
audioPlayer.play().catch(()=>{});
}else{
this.textContent='🎵 Play Audio';
audioPlayer.pause();
}
});

document.getElementById('btnYoutube').addEventListener('click',function(){
window.open('${url}','_blank');
});

document.getElementById('btnToggle').addEventListener('click',function(){
const text=this.textContent.includes('⬇️')?'📱 Close':'⬇️ Download';
this.textContent=text;
const downloadDiv=document.querySelector('.download-options');
if(downloadDiv){downloadDiv.style.display=downloadDiv.style.display==='none'?'flex':'none';}
});

document.getElementById('btnBack').addEventListener('click',function(){
if(window.history.length>1){window.history.back();}else{location.reload();}
});

document.getElementById('btnMenu').addEventListener('click',function(){
window.open('https://wa.me/?text=.zer-yt','_blank');
});

videoPlayer.addEventListener('error',function(){
this.parentElement.innerHTML='<div style="color:#888;text-align:center;padding:40px 20px;font-size:14px;">❌ Gagal memutar video<br><span style="font-size:12px;color:#555;">Klik "Buka YouTube" untuk melihat</span></div>';
});

audioPlayer.addEventListener('error',function(){
this.parentElement.innerHTML='<div style="color:#888;text-align:center;padding:20px;font-size:14px;">❌ Gagal memutar audio<br><span style="font-size:12px;color:#555;">Klik "Buka YouTube" untuk mendengar</span></div>';
});

window.onerror=function(){};
<\/script>
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
`🎬 *Zero YT Player*

Cari & putar video YouTube langsung di chat!

📌 *Format:*
> .zer-yt <judul/lagu>

📝 *Contoh:*
> .zer-yt dj terbaru
> .zer-yt lagu sedih
> .zer-yt asal kau bahagia

🎮 *Fitur:*
• ▶️ Play Video (putar di chat)
• 🎵 Play Audio (putar suara)
• 🔗 Buka YouTube
• ⬇️ Download

✨ *Tampilan profesional kayak Spotify!*

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

        const bestResult = searchResults.videos[0];
        const html = buildHtml(bestResult, query);

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
                                    messageText: 'Zero YT Player'
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