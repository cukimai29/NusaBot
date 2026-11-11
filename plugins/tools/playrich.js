const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'Play Rich',
    alias: ['playrich', 'musicplayer', 'spotifyplayer'],
    category: 'tools',
    description: 'Pemutar musik ala Spotify dengan piringan vinyl berputar, lengkap play/pause & volume',
    usage: '<url musik (.mp3/.ogg/.wav)>',
    example: '.playrich https://cdn.zass.in/VWLbeknofW.mp3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

function buildHtml(audioUrl, title, cover) {
    const safeUrl = String(audioUrl).replace(/"/g, '&quot;');
    const safeTitle = String(title || 'Unknown Track').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCover = cover ? String(cover).replace(/"/g, '&quot;') : '';

    return `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#1db954;
  --accent-2:#1ed760;
  --line:#2a3942;
  --line-strong:#374248;
  --cell-bg:#111b21;
  --card-2:#2a3942;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;}
.card{width:100%;max-width:380px;background:linear-gradient(180deg,#182229,#0f171c);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.4);}
.header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--line);gap:8px;}
.header__title{font-size:15px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:6px;}
.header__sub{font-size:11px;color:var(--muted);}

.disc-wrap{position:relative;width:220px;height:220px;margin:8px auto 20px;display:flex;align-items:center;justify-content:center;}
.disc{
  width:210px;height:210px;border-radius:50%;
  background:
    radial-gradient(circle at center, #1a1a1a 0%, #1a1a1a 14%, #0c0c0c 15%, #0c0c0c 16%, #1a1a1a 17%,
    #101010 30%, #1a1a1a 31%, #101010 45%, #1a1a1a 46%, #101010 60%, #1a1a1a 61%, #101010 75%, #1a1a1a 76%, #0c0c0c 100%);
  box-shadow:0 8px 30px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.6);
  display:flex;align-items:center;justify-content:center;
  animation:spin 6s linear infinite;
  animation-play-state:paused;
  position:relative;
}
.disc.spinning{animation-play-state:running;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.disc-label{
  width:80px;height:80px;border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent-2));
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
  box-shadow:0 0 0 3px #0c0c0c, 0 0 0 4px #333;
}
.disc-label img{width:100%;height:100%;object-fit:cover;}
.disc-label .fallback-icon{font-size:28px;}
.disc-hole{
  position:absolute;width:14px;height:14px;border-radius:50%;
  background:#0c0c0c;box-shadow:inset 0 0 4px rgba(0,0,0,0.8);
  border:2px solid #333;
}
.disc-shine{
  position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;
  background:linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%);
  pointer-events:none;
}
.arm{
  position:absolute;top:-6px;right:6px;width:70px;height:8px;
  transform-origin:right center;
  transform:rotate(-28deg);
  transition:transform .4s ease;
  z-index:5;
}
.arm.playing{transform:rotate(-8deg);}
.arm-body{width:100%;height:6px;background:linear-gradient(90deg,#666,#999);border-radius:4px;position:relative;}
.arm-head{position:absolute;left:-4px;top:-5px;width:14px;height:14px;background:#ccc;border-radius:3px;}
.arm-base{position:absolute;right:-8px;top:-10px;width:20px;height:20px;background:#444;border-radius:50%;border:2px solid #666;}

.track-info{text-align:center;margin-bottom:16px;}
.track-title{font-size:15px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
.track-status{font-size:11px;color:var(--accent);font-weight:500;}

.seek-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.time{font-size:10px;color:var(--muted);min-width:30px;text-align:center;font-variant-numeric:tabular-nums;}
.seekbar{
  flex:1;height:4px;border-radius:2px;background:var(--line-strong);
  position:relative;cursor:pointer;
}
.seekbar-fill{
  position:absolute;top:0;left:0;height:100%;border-radius:2px;
  background:linear-gradient(90deg,var(--accent),var(--accent-2));
  width:0%;
}
.seekbar-handle{
  position:absolute;top:50%;width:12px;height:12px;border-radius:50%;
  background:#fff;transform:translate(-50%,-50%);left:0%;
  box-shadow:0 1px 4px rgba(0,0,0,0.5);
  opacity:0;transition:opacity .2s;
}
.seekbar:hover .seekbar-handle{opacity:1;}

.controls-row{display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:16px;}
.ctrl-btn{
  background:none;border:none;color:var(--ink);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  padding:6px;font-family:inherit;
}
.ctrl-btn svg{width:20px;height:20px;fill:var(--ink);}
.btn-play{
  width:52px;height:52px;border-radius:50%;
  background:var(--accent);
  display:flex;align-items:center;justify-content:center;
}
.btn-play svg{width:22px;height:22px;fill:#0b141a;}
.btn-play:active{transform:scale(0.92);}
.ctrl-btn:active{transform:scale(0.88);}

.volume-row{display:flex;align-items:center;gap:10px;padding-top:12px;border-top:1px solid var(--line);}
.vol-icon{width:16px;height:16px;fill:var(--muted);flex-shrink:0;}
.volume-bar{
  flex:1;height:4px;border-radius:2px;background:var(--line-strong);
  position:relative;cursor:pointer;
}
.volume-fill{
  position:absolute;top:0;left:0;height:100%;border-radius:2px;
  background:var(--ink-soft);width:80%;
}
.volume-handle{
  position:absolute;top:50%;width:11px;height:11px;border-radius:50%;
  background:#fff;transform:translate(-50%,-50%);left:80%;
  box-shadow:0 1px 4px rgba(0,0,0,0.5);
}

.loading-msg{text-align:center;font-size:11px;color:var(--muted);margin-top:8px;min-height:14px;}
</style>

<main class="stage">
<div class="card">
<div class="header">
<div class="header__title">🎵 Play Rich</div>
<div class="header__sub">music player</div>
</div>

<div class="disc-wrap">
<div class="disc" id="disc">
<div class="disc-shine"></div>
<div class="disc-label" id="discLabel">
${safeCover ? `<img src="${safeCover}" alt="cover"/>` : `<span class="fallback-icon">🎧</span>`}
</div>
<div class="disc-hole"></div>
</div>
<div class="arm" id="arm">
<div class="arm-base"></div>
<div class="arm-body">
<div class="arm-head"></div>
</div>
</div>
</div>

<div class="track-info">
<div class="track-title" id="trackTitle">${safeTitle}</div>
<div class="track-status" id="trackStatus">Siap diputar</div>
</div>

<div class="seek-row">
<span class="time" id="curTime">0:00</span>
<div class="seekbar" id="seekbar">
<div class="seekbar-fill" id="seekFill"></div>
<div class="seekbar-handle" id="seekHandle"></div>
</div>
<span class="time" id="durTime">0:00</span>
</div>

<div class="controls-row">
<button class="ctrl-btn" id="btnBack">
<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
</button>
<button class="ctrl-btn btn-play" id="btnPlay">
<svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
</button>
<button class="ctrl-btn" id="btnForward">
<svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6v12l8.5-6z"/></svg>
</button>
</div>

<div class="volume-row">
<svg class="vol-icon" id="volIcon" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
<div class="volume-bar" id="volumeBar">
<div class="volume-fill" id="volFill"></div>
<div class="volume-handle" id="volHandle"></div>
</div>
</div>

<div class="loading-msg" id="loadingMsg">Memuat audio...</div>
</div>
</main>

<audio id="audio" src="${safeUrl}" preload="auto"></audio>

<script>
const audio=document.getElementById('audio');
const disc=document.getElementById('disc');
const arm=document.getElementById('arm');
const btnPlay=document.getElementById('btnPlay');
const playIcon=document.getElementById('playIcon');
const trackStatus=document.getElementById('trackStatus');
const loadingMsg=document.getElementById('loadingMsg');
const curTimeEl=document.getElementById('curTime');
const durTimeEl=document.getElementById('durTime');
const seekbar=document.getElementById('seekbar');
const seekFill=document.getElementById('seekFill');
const seekHandle=document.getElementById('seekHandle');
const volumeBar=document.getElementById('volumeBar');
const volFill=document.getElementById('volFill');
const volHandle=document.getElementById('volHandle');
const volIcon=document.getElementById('volIcon');
const btnBack=document.getElementById('btnBack');
const btnForward=document.getElementById('btnForward');

const ICON_PLAY='<path d="M8 5v14l11-7z"/>';
const ICON_PAUSE='<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

let isPlaying=false;
let isDraggingSeek=false;
let isDraggingVol=false;

audio.volume=0.8;

function formatTime(sec){
if(!isFinite(sec)||isNaN(sec))return '0:00';
const m=Math.floor(sec/60);
const s=Math.floor(sec%60).toString().padStart(2,'0');
return m+':'+s;
}

function setPlayingState(playing){
isPlaying=playing;
if(playing){
disc.classList.add('spinning');
arm.classList.add('playing');
playIcon.innerHTML=ICON_PAUSE;
trackStatus.textContent='Sedang diputar';
}else{
disc.classList.remove('spinning');
arm.classList.remove('playing');
playIcon.innerHTML=ICON_PLAY;
trackStatus.textContent=audio.currentTime>0?'Dijeda':'Siap diputar';
}
}

function togglePlay(){
if(audio.paused){
audio.play().catch(()=>{
trackStatus.textContent='Gagal memutar audio';
});
}else{
audio.pause();
}
}

btnPlay.addEventListener('click',togglePlay);

btnBack.addEventListener('click',()=>{
audio.currentTime=Math.max(0,audio.currentTime-10);
});
btnForward.addEventListener('click',()=>{
audio.currentTime=Math.min(audio.duration||0,audio.currentTime+10);
});

audio.addEventListener('play',()=>setPlayingState(true));
audio.addEventListener('pause',()=>setPlayingState(false));
audio.addEventListener('ended',()=>{
setPlayingState(false);
trackStatus.textContent='Selesai';
audio.currentTime=0;
});

audio.addEventListener('loadedmetadata',()=>{
durTimeEl.textContent=formatTime(audio.duration);
loadingMsg.style.display='none';
});

audio.addEventListener('canplay',()=>{
loadingMsg.style.display='none';
});

audio.addEventListener('waiting',()=>{
loadingMsg.textContent='Buffering...';
loadingMsg.style.display='block';
});

audio.addEventListener('playing',()=>{
loadingMsg.style.display='none';
});

audio.addEventListener('error',()=>{
loadingMsg.textContent='❌ Gagal memuat audio';
loadingMsg.style.display='block';
trackStatus.textContent='Error';
});

audio.addEventListener('timeupdate',()=>{
if(isDraggingSeek)return;
curTimeEl.textContent=formatTime(audio.currentTime);
const pct=audio.duration?(audio.currentTime/audio.duration)*100:0;
seekFill.style.width=pct+'%';
seekHandle.style.left=pct+'%';
});

function seekTo(clientX){
const rect=seekbar.getBoundingClientRect();
let pct=(clientX-rect.left)/rect.width;
pct=Math.max(0,Math.min(1,pct));
seekFill.style.width=(pct*100)+'%';
seekHandle.style.left=(pct*100)+'%';
if(audio.duration){
audio.currentTime=pct*audio.duration;
curTimeEl.textContent=formatTime(audio.currentTime);
}
}

seekbar.addEventListener('mousedown',(e)=>{
isDraggingSeek=true;
seekTo(e.clientX);
});
document.addEventListener('mousemove',(e)=>{
if(isDraggingSeek)seekTo(e.clientX);
});
document.addEventListener('mouseup',()=>{isDraggingSeek=false;});

seekbar.addEventListener('touchstart',(e)=>{
isDraggingSeek=true;
seekTo(e.touches[0].clientX);
},{passive:true});
seekbar.addEventListener('touchmove',(e)=>{
if(isDraggingSeek)seekTo(e.touches[0].clientX);
},{passive:true});
seekbar.addEventListener('touchend',()=>{isDraggingSeek=false;});

function setVolume(clientX){
const rect=volumeBar.getBoundingClientRect();
let pct=(clientX-rect.left)/rect.width;
pct=Math.max(0,Math.min(1,pct));
audio.volume=pct;
volFill.style.width=(pct*100)+'%';
volHandle.style.left=(pct*100)+'%';
updateVolIcon(pct);
}

function updateVolIcon(vol){
if(vol===0){
volIcon.innerHTML='<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
}else if(vol<0.5){
volIcon.innerHTML='<path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
}else{
volIcon.innerHTML='<path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
}
}

volumeBar.addEventListener('mousedown',(e)=>{
isDraggingVol=true;
setVolume(e.clientX);
});
document.addEventListener('mousemove',(e)=>{
if(isDraggingVol)setVolume(e.clientX);
});
document.addEventListener('mouseup',()=>{isDraggingVol=false;});

volumeBar.addEventListener('touchstart',(e)=>{
isDraggingVol=true;
setVolume(e.touches[0].clientX);
},{passive:true});
volumeBar.addEventListener('touchmove',(e)=>{
if(isDraggingVol)setVolume(e.touches[0].clientX);
},{passive:true});
volumeBar.addEventListener('touchend',()=>{isDraggingVol=false;});

volFill.style.width='80%';
volHandle.style.left='80%';

audio.play().then(()=>{
setPlayingState(true);
}).catch(()=>{
setPlayingState(false);
trackStatus.textContent='Tekan ▶ untuk memutar';
});
<\/script>
`;
}

async function handler(m, ctx) {
    try {
        const { sock, args, text } = ctx || {};

        let raw =
            text ||
            (Array.isArray(args) ? args.join(' ') : args) ||
            m.text ||
            m.args ||
            m.body ||
            m.query ||
            (m.message && m.message.conversation) ||
            '';

        raw = String(raw || '').trim();

        // Buang command-nya sendiri (mis. ".playrich ") kalau masih ikut kebawa
        const cmdMatch = raw.match(/^\.?\w+\s+(.+)$/s);
        let url = raw;
        if (cmdMatch && !/^https?:\/\//i.test(raw)) {
            url = cmdMatch[1].trim();
        }
        // Kalau raw sendiri sudah langsung berupa URL, pakai apa adanya
        const directUrlMatch = raw.match(/https?:\/\/\S+/i);
        if (directUrlMatch) {
            url = directUrlMatch[0].trim();
        }

        if (!url) {
            return await m.reply('❌ Masukkan URL musik!\n\nContoh:\n.playrich https://cdn.zass.in/VWLbeknofW.mp3');
        }

        if (!/^https?:\/\//i.test(url)) {
            return await m.reply('❌ URL tidak valid! Harus diawali http:// atau https://');
        }

        const fileName = url.split('/').pop().split('?')[0] || 'Unknown Track';
        const title = decodeURIComponent(fileName);

        const html = buildHtml(url, title, '');

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
                                    messageText: 'Play Rich Music Player'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'playrich2026',
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
    } catch (err) {
        te(m.prefix, m.command, m.pushName);
        console.error('[PLAYRICH ERROR]', err);
        await m.reply('❌ Gagal memutar musik.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};