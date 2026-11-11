// ular.js
// HTML TIO Snake Game — Ular Makan Apel
// NusaBot plugin

const te = require('../../src/lib/zerotwo-error.js');

const html = `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#00a884;
  --danger:#f15c5c;
  --line:#2a3942;
  --line-strong:#374248;
  --cell-bg:#111b21;
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

.status__score{
  display:flex;
  gap:10px;
  color:var(--muted);
  font-size:11px;
}

.status__score b{
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
}

canvas{
  width:100%;
  height:100%;
  display:block;
}

.dpad{
  margin-top:16px;
  display:grid;
  grid-template-columns:repeat(3,52px);
  grid-template-rows:repeat(2,52px);
  gap:8px;
  justify-content:center;
}

.dpad button{
  background:transparent;
  border:1px solid var(--line-strong);
  border-radius:12px;
  color:var(--ink-soft);
  font-size:18px;
  cursor:pointer;
  font-family:inherit;
}

.dpad button:active{
  background:var(--accent);
  border-color:var(--accent);
  color:#0b141a;
}

.footer{
  margin-top:12px;
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
  color:var(--danger);
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
        Ular Makan Apel
      </div>
      <div class="header__sub">
        WASD / panah
      </div>
    </div>

    <div class="status">
      <div class="status__score">
        <span>Skor<b id="score">0</b></span>
        <span>Panjang<b id="len">1</b></span>
      </div>
    </div>

    <div class="board-wrap">
      <canvas id="board" width="320" height="320"></canvas>
    </div>

    <div class="dpad">
      <div></div>
      <button id="btn-up" aria-label="Atas">▲</button>
      <div></div>
      <button id="btn-left" aria-label="Kiri">◀</button>
      <button id="btn-down" aria-label="Bawah">▼</button>
      <button id="btn-right" aria-label="Kanan">▶</button>
    </div>

    <div class="footer">
      <button class="footer__reset" id="reset">Ulang papan</button>
    </div>

  </div>

</main>

<div class="modal" id="modal" hidden>

  <div class="modal__backdrop" id="modal-backdrop"></div>

  <div class="modal__card">
    <h2 class="modal__title">Game over</h2>
    <p class="modal__sub" id="modal-sub">Skor 0, panjang 1</p>
    <button class="modal__retry" id="modal-retry">Main lagi</button>
  </div>

</div>

<script>

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const box = 20;
const gridSize = canvas.width / box;

let snake, direction, nextDirection, apple, score, gameLoop, gameRunning;

function eyeOffsets(){
  if (direction === 'UP') return [[-5,-6],[5,-6]];
  if (direction === 'DOWN') return [[-5,6],[5,6]];
  if (direction === 'LEFT') return [[-6,-5],[-6,5]];
  return [[6,-5],[6,5]];
}

function initGame(){
  snake = [{x:9,y:9}];
  direction = 'RIGHT';
  nextDirection = 'RIGHT';
  score = 0;
  gameRunning = true;
  spawnApple();
  updateHud();
  hideModal();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(tick, 220);
  render();
}

function spawnApple(){
  let valid = false;
  while(!valid){
    apple = { x: Math.floor(Math.random()*gridSize), y: Math.floor(Math.random()*gridSize) };
    valid = !snake.some(s => s.x === apple.x && s.y === apple.y);
  }
}

function updateHud(){
  document.getElementById('score').textContent = score;
  document.getElementById('len').textContent = snake.length;
}

function setDir(d){
  if (d === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
  else if (d === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
  else if (d === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
  else if (d === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') setDir('UP');
  else if (k === 'arrowdown' || k === 's') setDir('DOWN');
  else if (k === 'arrowleft' || k === 'a') setDir('LEFT');
  else if (k === 'arrowright' || k === 'd') setDir('RIGHT');
});

document.getElementById('btn-up').addEventListener('click', () => setDir('UP'));
document.getElementById('btn-down').addEventListener('click', () => setDir('DOWN'));
document.getElementById('btn-left').addEventListener('click', () => setDir('LEFT'));
document.getElementById('btn-right').addEventListener('click', () => setDir('RIGHT'));
document.getElementById('reset').addEventListener('click', initGame);
document.getElementById('modal-retry').addEventListener('click', initGame);
document.getElementById('modal-backdrop').addEventListener('click', initGame);

function tick(){
  if (!gameRunning) return;
  direction = nextDirection;

  let head = { x: snake[0].x, y: snake[0].y };
  if (direction === 'UP') head.y--;
  else if (direction === 'DOWN') head.y++;
  else if (direction === 'LEFT') head.x--;
  else if (direction === 'RIGHT') head.x++;

  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) return endGame();
  if (snake.some(s => s.x === head.x && s.y === head.y)) return endGame();

  snake.unshift(head);
  if (head.x === apple.x && head.y === apple.y){
    score += 10;
    spawnApple();
    updateHud();
  } else {
    snake.pop();
  }
  render();
}

function render(){
  ctx.fillStyle = '#111b21';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = '#f15c5c';
  ctx.beginPath();
  ctx.arc(apple.x*box+box/2, apple.y*box+box/2, box/2.5, 0, Math.PI*2);
  ctx.fill();

  snake.forEach((seg,i) => {
    const cx = seg.x*box+box/2, cy = seg.y*box+box/2;
    ctx.fillStyle = i === 0 ? '#00a884' : '#0b6b56';
    ctx.fillRect(seg.x*box+1, seg.y*box+1, box-2, box-2);

    if (i === 0){
      eyeOffsets().forEach(([ox,oy]) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx+ox, cy+oy, 2.8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#0b141a';
        ctx.beginPath();
        ctx.arc(cx+ox, cy+oy, 1.3, 0, Math.PI*2);
        ctx.fill();
      });
    }
  });
}

function endGame(){
  gameRunning = false;
  clearInterval(gameLoop);
  document.getElementById('modal-sub').textContent = 'Skor ' + score + ', panjang ' + snake.length;
  showModal();
}

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
  name: 'Ular Makan Apel',
  alias: ['ular', 'snake'],
  category: 'game',
  description: 'Main game ular makan apel interaktif langsung di chat',
  usage: '',
  example: '.ular',
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
                  messageText: 'Ular Makan Apel by tio'
                }
              ],

              unifiedResponse: {
                data: Buffer.from(
                  JSON.stringify({
                    response_id: '7e6d8d7a-1f3d-4f65-a3b2-ular2026-game',

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
    console.error('[ULAR ERROR]', err);
    await m.reply('❌ Gagal mengirim game Ular Makan Apel.');
  }
}

module.exports = {
    config: pluginConfig,
    handler
};
