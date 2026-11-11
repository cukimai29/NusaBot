// tictactoe.js
// HTML Rich Snippet Game — Tic Tac Toe

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

.status__turn{
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--muted);
  font-size:13px;
}

.status__turn b{
  color:var(--ink);
}

.board-wrap{
  position:relative;
  width:100%;
  aspect-ratio:1/1;
  background:var(--cell-bg);
  border-radius:12px;
  overflow:hidden;
  border:1px solid var(--line);
}

canvas{
  width:100%;
  height:100%;
  display:block;
  cursor:pointer;
  touch-action:none;
}

.footer{
  margin-top:12px;
  display:flex;
  justify-content:center;
  gap:12px;
}

.footer__btn{
  background:var(--card-2);
  border:none;
  color:var(--ink);
  font-family:inherit;
  font-size:13px;
  font-weight:500;
  cursor:pointer;
  padding:8px 20px;
  border-radius:8px;
  border:1px solid var(--line);
}

.footer__btn:hover{
  background:var(--line-strong);
}

.footer__btn:active{
  filter:brightness(.92);
}

.footer__btn--primary{
  background:var(--accent);
  color:#0b141a;
  border-color:var(--accent);
}
</style>

<main class="stage">
  <div class="card">
    <div class="header">
      <div class="header__title">✖ Tic Tac Toe</div>
      <div class="header__sub">vs AI</div>
    </div>

    <div class="status">
      <div class="status__turn">
        <span>Giliran: <b id="turn-indicator">❌ Kamu</b></span>
      </div>
      <div id="score-indicator" style="font-size:12px;color:var(--muted);">
        <span>Kamu <b id="score-player">0</b></span>
        <span style="margin:0 6px;">•</span>
        <span>AI <b id="score-ai">0</b></span>
        <span style="margin:0 6px;">•</span>
        <span>Seri <b id="score-draw">0</b></span>
      </div>
    </div>

    <div class="board-wrap">
      <canvas id="board"></canvas>
    </div>

    <div class="footer">
      <button class="footer__btn" id="reset-btn">🔄 Ulang</button>
      <button class="footer__btn footer__btn--primary" id="newgame-btn">🎮 Game Baru</button>
    </div>
  </div>
</main>

<script>
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let W = 300, H = 300;
let cellSize = 100;

function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  W = canvas.width = Math.max(280, Math.floor(rect.width));
  H = canvas.height = Math.max(280, Math.floor(rect.height));
  cellSize = W / 3;
}

// ── Game State ──
let board = Array(9).fill(null);
let currentPlayer = 'X'; // 'X' = player, 'O' = AI
let gameOver = false;
let winner = null; // 'X', 'O', 'draw'
let scores = { player: 0, ai: 0, draw: 0 };
let moveHistory = [];

const WIN_COMBOS = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

// ── AI (Minimax) ──
function checkWinner(boardState){
  for (const combo of WIN_COMBOS) {
    const [a,b,c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return boardState[a];
    }
  }
  if (boardState.every(cell => cell !== null)) return 'draw';
  return null;
}

function getAvailableMoves(boardState){
  return boardState.map((cell, idx) => cell === null ? idx : null).filter(v => v !== null);
}

function minimax(boardState, depth, isMaximizing){
  const result = checkWinner(boardState);
  if (result === 'X') return -10 + depth;
  if (result === 'O') return 10 - depth;
  if (result === 'draw') return 0;

  const moves = getAvailableMoves(boardState);
  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      boardState[move] = 'O';
      const score = minimax(boardState, depth + 1, false);
      boardState[move] = null;
      best = Math.max(best, score);
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      boardState[move] = 'X';
      const score = minimax(boardState, depth + 1, true);
      boardState[move] = null;
      best = Math.min(best, score);
    }
    return best;
  }
}

function aiMove(){
  const moves = getAvailableMoves(board);
  if (moves.length === 0 || gameOver) return;

  let bestScore = -Infinity;
  let bestMove = moves[0];

  // Coba langsung menang atau blokir
  for (const move of moves) {
    board[move] = 'O';
    const score = minimax(board, 0, false);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  board[bestMove] = 'O';
  moveHistory.push({ player: 'O', position: bestMove });
  checkGameState();
}

function checkGameState(){
  const result = checkWinner(board);
  if (result) {
    gameOver = true;
    winner = result;
    if (result === 'X') scores.player++;
    else if (result === 'O') scores.ai++;
    else if (result === 'draw') scores.draw++;
    updateUI();
    return true;
  }
  return false;
}

// ── Player Move ──
function playerMove(index){
  if (gameOver) return;
  if (board[index] !== null) return;
  if (currentPlayer !== 'X') return;

  board[index] = 'X';
  moveHistory.push({ player: 'X', position: index });

  if (checkGameState()) {
    currentPlayer = null;
    updateUI();
    return;
  }

  currentPlayer = 'O';
  updateUI();

  // AI move after delay
  setTimeout(() => {
    if (!gameOver && currentPlayer === 'O') {
      aiMove();
      currentPlayer = 'X';
      updateUI();
    }
  }, 400);
}

// ── Reset ──
function resetGame(){
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  winner = null;
  moveHistory = [];
  updateUI();
}

function newGame(){
  resetGame();
  // Reset scores
  scores = { player: 0, ai: 0, draw: 0 };
  updateUI();
}

// ── UI Update ──
function updateUI(){
  const turnText = document.getElementById('turn-indicator');
  const scoreP = document.getElementById('score-player');
  const scoreA = document.getElementById('score-ai');
  const scoreD = document.getElementById('score-draw');

  scoreP.textContent = scores.player;
  scoreA.textContent = scores.ai;
  scoreD.textContent = scores.draw;

  if (gameOver) {
    if (winner === 'X') turnText.textContent = '🎉 Kamu Menang!';
    else if (winner === 'O') turnText.textContent = '💻 AI Menang!';
    else if (winner === 'draw') turnText.textContent = '🤝 Seri!';
    return;
  }

  turnText.textContent = currentPlayer === 'X' ? '❌ Kamu' : '⭕ AI...';
  render();
}

// ── Render ──
function render(){
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'var(--line-strong)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(W, i * cellSize);
    ctx.stroke();
  }

  // Cells
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;
    const size = cellSize * 0.32;

    if (board[i] === 'X') {
      ctx.strokeStyle = '#55b8ff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const off = size * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - off, y - off);
      ctx.lineTo(x + off, y + off);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + off, y - off);
      ctx.lineTo(x - off, y + off);
      ctx.stroke();
    } else if (board[i] === 'O') {
      ctx.strokeStyle = '#ffd24c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Win line
  if (winner && winner !== 'draw') {
    const combo = WIN_COMBOS.find(([a,b,c]) => 
      board[a] === winner && board[b] === winner && board[c] === winner
    );
    if (combo) {
      const [a,b,c] = combo;
      const p1 = { x: (a % 3) * cellSize + cellSize/2, y: Math.floor(a/3) * cellSize + cellSize/2 };
      const p2 = { x: (c % 3) * cellSize + cellSize/2, y: Math.floor(c/3) * cellSize + cellSize/2 };
      ctx.strokeStyle = winner === 'X' ? '#55b8ff' : '#ff7d6b';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255,255,255,0.3)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

// ── Click Handler ──
function handleClick(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const index = row * 3 + col;

  if (index >= 0 && index < 9) {
    playerMove(index);
  }
}

// ── Events ──
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleClick(e);
}, { passive: false });

document.getElementById('reset-btn').addEventListener('click', resetGame);
document.getElementById('newgame-btn').addEventListener('click', newGame);

// ── Init ──
resizeCanvas();
resetGame();
window.addEventListener('resize', () => {
  resizeCanvas();
  render();
});

// Auto-render loop
function gameLoop(){
  render();
  requestAnimationFrame(gameLoop);
}
gameLoop();
<\/script>
`;

const pluginConfig = {
  name: 'Tic Tac Toe',
  alias: ['tictactoe', 'ttt', 'xoxo', 'suit'],
  category: 'game',
  description: 'Main Tic Tac Toe vs AI langsung di chat!',
  usage: '',
  example: '.tictactoe',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
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
                  messageText: 'Tic Tac Toe - vs AI'
                }
              ],

              unifiedResponse: {
                data: Buffer.from(
                  JSON.stringify({
                    response_id: '9a4c2e1b-6f0d-4a88-b7e3-tictactoe2026',

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
    console.error('[TICTACTOE ERROR]', err);
    await m.reply('❌ Gagal mengirim game Tic Tac Toe.');
  }
}

module.exports = {
    config: pluginConfig,
    handler
};