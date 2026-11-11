// playrich.js
// HTML Rich Audio Player — Spotify Style (No Cover) by RidanXD & ClaudeAi

import te from '../../src/lib/zero-two-error.js';

function buildHtml({ title, src }) {
  return `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#1db954;
  --line:#2a3942;
  --line-strong:#374248;
  --card-bg:#111b21;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  background:transparent;
  color:var(--ink);
  font-family:var(--sys);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}

.stage{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px 16px;
}

.card{
  width:100%;
  max-width:360px;
  background:var(--card-bg);
  border:1px solid var(--line);
  border-radius:12px;
  padding:20px;
}

.meta{
  margin-bottom:20px;
}

.meta__title{
  font-size:15px;
  font-weight:700;
  color:var(--ink);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.meta__sub{
  font-size:12px;
  color:var(--muted);
  margin-top:2px;
}

.player{
  display:flex;
  align-items:center;
  gap:12px;
}

.player__btn{
  flex:none;
  width:44px;
  height:44px;
  border-radius:50%;
  background:var(--accent);
  border:none;
  color:#0b141a;
  font-size:16px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}

.player__track{
  flex:1;
  display:flex;
  flex-direction:column;
  gap:4px;
}

.player__bar{
  position:relative;
  height:4px;
  border-radius:2px;
  background:var(--line-strong);
  cursor:pointer;
}

.player__fill{
  position:absolute;
  left:0;
  top:0;
  height:100%;
  width:0%;
  background:var(--accent);
  border-radius:2px;
}

.player__time{
  display:flex;
  justify-content:space-between;
  font-size:11px;
  color:var(--muted);
}

@media(max-width:380px){
  .stage{
    padding:16px 12px;
  }
}
</style>

<main class="stage">
  <div class="card">

    <div class="meta">
      <div class="meta__title">${title}</div>
      <div class="meta__sub">Rich Audio Player</div>
    </div>

    <div class="player">
      <button class="player__btn" id="toggle">▶</button>
      <div class="player__track">
        <div class="player__bar" id="bar">
          <div class="player__fill" id="fill"></div>
        </div>
        <div class="player__time">
          <span id="cur">0:00</span>
          <span id="dur">0:00</span>
        </div>
      </div>
    </div>

    <audio id="audio" src="${src}" preload="metadata"></audio>

  </div>
</main>

<script>
const audioEl = document.getElementById('audio');
const toggle = document.getElementById('toggle');
const bar = document.getElementById('bar');
const fill = document.getElementById('fill');
const cur = document.getElementById('cur');
const dur = document.getElementById('dur');

function fmt(s){
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s/60);
  const sec = Math.floor(s%60).toString().padStart(2,'0');
  return m + ':' + sec;
}

toggle.addEventListener('click', () => {
  if (audioEl.paused){
    audioEl.play();
    toggle.textContent = '❚❚';
  } else {
    audioEl.pause();
    toggle.textContent = '▶';
  }
});

audioEl.addEventListener('loadedmetadata', () => {
  dur.textContent = fmt(audioEl.duration);
});

audioEl.addEventListener('timeupdate', () => {
  cur.textContent = fmt(audioEl.currentTime);
  fill.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
});

audioEl.addEventListener('ended', () => {
  toggle.textContent = '▶';
  fill.style.width = '0%';
});

bar.addEventListener('click', (e) => {
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audioEl.currentTime = pct * audioEl.duration;
});
</script>
`;
}

const pluginConfig = {
  name: 'Play Rich',
  alias: ['playrich'],
  category: 'tools',
  description: 'Audio player ala Spotify langsung di chat dari url atau buffer musik',
  usage: '<url musik>',
  example: '.playrich https://abc.co/music.mp3',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
};

async function handler(m, { sock, args }) {
  try {
    const url = args?.[0];
    const buffer = !url ? m.quoted?.buffer : undefined; // ambil dari media yang di-reply kalau url kosong

    // Wajib salah satu terisi: url langsung, atau buffer dari media
    const music = url || buffer;
    if (!music) return m.reply('❌ Kirim url musik atau reply media audio. Contoh: .playrich https://abc.co/music.mp3');

    // Kalau music berupa buffer, ubah jadi data URI biar bisa dipasang ke <audio src>
    const src = url ? url : `data:audio/mpeg;base64,${buffer.toString('base64')}`;

    const title = url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : 'Audio Terkirim';

    const html = buildHtml({ title, src });

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
                  messageText: title
                }
              ],

              unifiedResponse: {
                data: Buffer.from(
                  JSON.stringify({
                    response_id: '4a7e1c9d-8b2f-4e6a-9c3d-playrich2026',

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
    await m.reply('❌ Gagal memutar audio.');
  }
}

export { pluginConfig as config, handler };