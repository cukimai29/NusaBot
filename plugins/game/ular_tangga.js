// ulartangga.js
// HTML Tio Game — Ular Tangga
// Plugin zerotwo (zero_two_3_2)

const te = require('../../src/lib/zerotwo-error.js');

const html = `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#00a884;
  --danger:#f15c5c;
  --gold:#f0b429;
  --line:#2a3942;
  --line-strong:#374248;
  --cell-bg:#182229;
  --cell-alt:#111b21;
  --card-2:#2a3942;
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
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:24px 16px;
}

.card{
  width:100%;
  max-width:360px;
}

.header{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  margin-bottom:14px;
  padding-bottom:12px;
  border-bottom:1px solid var(--line);
  gap:8px;
}

.header__title{
  font-size:17px;
  font-weight:600;
  color:var(--ink);
}

.header__sub{
  font-size:12px;
  color:var(--muted);
}

.status{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:14px;
  font-size:13px;
  gap:8px;
}

.status__info{
  display:flex;
  gap:10px;
  color:var(--muted);
  font-size:11px;
}

.status__info b{
  color:var(--ink);
  margin-left:3px;
}

.board-wrap{
  width:100%;
  aspect-ratio:1;
  background:var(--cell-bg);
  border-radius:8px;
  overflow:hidden;
  border:1px solid var(--line);
  position:relative;
}

canvas{
  width:100%;
  height:100%;
  display:block;
}

.controls{
  margin-top:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:16px;
}

.dice{
  width:56px;
  height:56px;
  border-radius:12px;
  background:var(--card-2);
  border:1px solid var(--line-strong);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  font-weight:700;
  color:var(--ink);
}

.roll-btn{
  background:var(--accent);
  border:none;
  border-radius:10px;
  color:#0b141a;
  font-family:inherit;
  font-size:14px;
  font-weight:700;
  padding:14px 28px;
  cursor:pointer;
}

.roll-btn[disabled]{
  opacity:.4;
  cursor:default;
}

.log{
  margin-top:12px;
  font-size:12px;
  color:var(--muted);
  text-align:center;
  min-height:16px;
}

.footer{
  margin-top:8px;
  display:flex;
  justify-content:center;
}

.footer__reset{
  background:none;
  border:none;
  color:var(--accent);
  font-family:inherit;
  font-size:13px;
  font-weight:500;
  cursor:pointer;
  padding:8px 16px;
}

.modal{
  position:fixed;
  inset:0;
  z-index:50;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  opacity:0;
  pointer-events:none;
  transition:opacity .3s ease;
}

.modal.is-open{
  opacity:1;
  pointer-events:auto;
}

.modal__backdrop{
  position:absolute;
  inset:0;
  background:transparent;
}

.modal__card{
  position:relative;
  background:var(--card-2);
  border-radius:12px;
  padding:24px 24px 0;
  text-align:center;
  max-width:320px;
  width:100%;
  box-shadow:0 24px 50px -12px rgba(0,0,0,.6);
  transform:translateY(8px) scale(.96);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1);
  overflow:hidden;
}

.modal.is-open .modal__card{
  transform:translateY(0) scale(1);
}

.modal__title{
  font-size:20px;
  font-weight:700;
  color:var(--gold);
  margin-bottom:8px;
}

.modal__sub{
  font-size:14px;
  color:var(--muted);
  margin-bottom:20px;
}

.modal__retry{
  background:transparent;
  border:none;
  color:var(--accent);
  font-family:inherit;
  font-size:16px;
  font-weight:600;
  cursor:pointer;
  padding:14px 24px;
  width:100%;
  border-top:1px solid var(--line-strong);
}

@media(max-width:380px){
  .stage{
    padding:16px 12px;
  }
}
</style>

<main class="stage">

  <div class="card">

    <div class="header">
      <div class="header__title">
        Ular Tangga
      </div>
      <div class="header__sub">
        1 pemain
      </div>
    </div>

    <div class="status">
      <div class="status__info">
        <span>Posisi<b id="pos">1</b></span>
        <span>Giliran<b id="turn">1</b></span>
      </div>
    </div>

    <div class="board-wrap">
      <canvas id="board" width="320" height="320"></canvas>
    </div>

    <div class="controls">
      <div class="dice" id="dice">-</div>
      <button class="roll-btn" id="roll">Kocok Dadu</button>
    </div>

    <div class="log" id="log"></div>

    <div class="footer">
      <button class="footer__reset" id="reset">Ulang permainan</button>
    </div>

  </div>

</main>

<div class="modal" id="modal" hidden>

  <div class="modal__backdrop" id="modal-backdrop"></div>

  <div class="modal__card">
    <h2 class="modal__title">🎉 Menang!</h2>
    <p class="modal__sub" id="modal-sub">Sampai petak 100 dalam sekian giliran</p>
    <button class="modal__retry" id="modal-retry">Main lagi</button>
  </div>

</div>

<script>

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 10;
const cell = canvas.width / size;

// key = petak awal, value = petak tujuan. >key = tangga, <key = ular
const snakesAndLadders = {
  4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92,   // tangga
  27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 // ular
};

let pos, turn, animating, gameOver;

function initGame(){
  pos = 1;
  turn = 1;
  animating = false;
  gameOver = false;
  document.getElementById('roll').disabled = false;
  document.getElementById('dice').textContent = '-';
  document.getElementById('log').textContent = '';
  updateHud();
  hideModal();
  render();
}

function updateHud(){
  document.getElementById('pos').textContent = pos;
  document.getElementById('turn').textContent = turn;
}

// konversi nomor petak 1-100 (ular tangga pola boustrophedon) ke koordinat grid
function cellCoord(n){
  const idx = n - 1;
  const row = Math.floor(idx / size);
  let col = idx % size;
  if (row % 2 === 1) col = size - 1 - col;
  const y = size - 1 - row;
  return { x: col, y };
}

function drawBoard(){
  for (let r = 0; r < size; r++){
    for (let c = 0; c < size; c++){
      const isAlt = (r + c) % 2 === 0;
      ctx.fillStyle = isAlt ? '#182229' : '#111b21';
      ctx.fillRect(c*cell, r*cell, cell, cell);
    }
  }

  // nomor petak kecil di pojok
  ctx.fillStyle = '#374248';
  ctx.font = '9px sans-serif';
  for (let n = 1; n <= 100; n++){
    const { x, y } = cellCoord(n);
    ctx.fillText(n, x*cell+3, y*cell+11);
  }

  // tangga (hijau) dan ular (merah)
  Object.entries(snakesAndLadders).forEach(([from, to]) => {
    from = Number(from);
    const a = cellCoord(from);
    const b = cellCoord(to);
    ctx.strokeStyle = to > from ? '#00a884' : '#f15c5c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(a.x*cell+cell/2, a.y*cell+cell/2);
    ctx.lineTo(b.x*cell+cell/2, b.y*cell+cell/2);
    ctx.stroke();
  });
}

function drawToken(n){
  const { x, y } = cellCoord(n);
  ctx.fillStyle = '#00a884';
  ctx.beginPath();
  ctx.arc(x*cell+cell/2, y*cell+cell/2, cell/3, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#0b141a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function render(){
  drawBoard();
  drawToken(pos);
}

function setLog(text){
  document.getElementById('log').textContent = text;
}

document.getElementById('roll').addEventListener('click', () => {
  if (animating || gameOver) return;
  animating = true;
  document.getElementById('roll').disabled = true;

  const dice = document.getElementById('dice');
  let ticks = 0;
  const spin = setInterval(() => {
    dice.textContent = 1 + Math.floor(Math.random()*6);
    ticks++;
    if (ticks > 8){
      clearInterval(spin);
      resolveRoll();
    }
  }, 60);
});

function resolveRoll(){
  const roll = 1 + Math.floor(Math.random()*6);
  document.getElementById('dice').textContent = roll;

  let target = pos + roll;
  if (target > 100){
    setLog('Dadu ' + roll + ', lebih dari 100, giliran lewat');
    turn++;
    updateHud();
    animating = false;
    document.getElementById('roll').disabled = false;
    return;
  }

  pos = target;
  render();

  if (snakesAndLadders[pos]){
    const dest = snakesAndLadders[pos];
    const climbed = dest > pos;
    setTimeout(() => {
      setLog('Dadu ' + roll + ', ' + (climbed ? 'naik tangga ke ' : 'kena ular turun ke ') + dest);
      pos = dest;
      render();
      afterMove(roll);
    }, 400);
  } else {
    setLog('Dadu ' + roll + ', maju ke petak ' + pos);
    afterMove(roll);
  }
}

function afterMove(roll){
  updateHud();
  if (pos === 100){
    gameOver = true;
    document.getElementById('modal-sub').textContent = 'Sampai petak 100 dalam ' + turn + ' giliran';
    showModal();
    animating = false;
    return;
  }
  turn++;
  updateHud();
  animating = false;
  document.getElementById('roll').disabled = false;
}

document.getElementById('reset').addEventListener('click', initGame);
document.getElementById('modal-retry').addEventListener('click', initGame);
document.getElementById('modal-backdrop').addEventListener('click', initGame);

function showModal(){
  const modal = document.getElementById('modal');
  modal.hidden = false;
  void modal.offsetWidth;
  modal.classList.add('is-open');
}

function hideModal(){
  const modal = document.getElementById('modal');
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 350);
}

initGame();

<\/script>
`;

const pluginConfig = {
  name: 'Ular Tangga',
  alias: ['ut3', 'ulartangga3'],
  category: 'game',
  description: 'Main game ular tangga interaktif langsung di chat',
  usage: '',
  example: '.ulartangga',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
};

async function handler(m, { sock }) {
  try {
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
                  messageText: 'Ular Tangga'
                }
              ],

              unifiedResponse: {
                data: Buffer.from(
                  JSON.stringify({
                    response_id: '2f8a6c1d-7e4b-4d9a-9f2c-ulartangga2026',

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
    console.error('[ULARTANGGA ERROR]', err);
    await m.reply('❌ Gagal mengirim game Ular Tangga.');
  }
}

module.exports = {
    config: pluginConfig,
    handler
};