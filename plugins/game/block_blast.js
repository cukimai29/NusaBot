const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'Block Blast',
    alias: ['blockblast', 'block', 'blast', 'bb'],
    category: 'game',
    description: 'Block Blast - susun balok di papan 8x8, penuhi baris/kolom buat hancurin & kejar skor tertinggi!',
    usage: '',
    example: '.blockblast',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const html = `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#00a884;
  --line:#2a3942;
  --line-strong:#374248;
  --cell-bg:#111b21;
  --card-2:#2a3942;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;}
.card{width:100%;max-width:380px;}
.header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--line);gap:8px;}
.header__title{font-size:17px;font-weight:600;color:var(--ink);}
.header__sub{font-size:12px;color:var(--muted);}
.status{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-size:13px;gap:8px;}
.status__score{display:flex;gap:16px;color:var(--muted);font-size:12px;}
.status__score b{color:var(--ink);}
.board-wrap{position:relative;width:100%;aspect-ratio:1/1;background:var(--cell-bg);border-radius:8px;overflow:hidden;border:1px solid var(--line);padding:6px;}
#board{width:100%;height:100%;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);gap:3px;}
.cell{background:#1c2b33;border-radius:3px;transition:background .08s;}
.cell.filled{box-shadow:inset 0 0 0 2px rgba(255,255,255,.15);}
.cell.preview-ok{box-shadow:inset 0 0 0 2px #2ecc71;}
.cell.preview-bad{box-shadow:inset 0 0 0 2px #e74c3c;}
.tray{margin-top:14px;display:flex;gap:8px;justify-content:space-between;}
.piece-slot{flex:1;aspect-ratio:1/1;background:var(--cell-bg);border:1px solid var(--line);border-radius:8px;display:grid;place-items:center;cursor:pointer;padding:6px;}
.piece-slot.selected{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
.piece-slot.empty{opacity:.25;cursor:default;}
.piece-grid{display:grid;gap:2px;}
.piece-cell{width:12px;height:12px;border-radius:2px;background:transparent;}
.piece-cell.on{background:var(--pc,#3498db);}
.controls{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.controls-row{display:flex;gap:8px;justify-content:center;}
.controls button{border:none;border-radius:10px;padding:12px 0;font-size:15px;font-weight:700;color:#0b141a;cursor:pointer;font-family:inherit;letter-spacing:.3px;background:var(--card-2);color:var(--ink);border:1px solid var(--line);flex:1;}
.controls button:active{filter:brightness(.85);transform:scale(0.97);}
.btn-reset{background:var(--accent);color:#0b141a !important;border-color:var(--accent) !important;}
.overlay{position:absolute;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;flex-direction:column;gap:6px;text-align:center;padding:16px;}
.overlay.show{display:flex;}
.overlay__title{font-size:22px;font-weight:700;color:#e74c3c;}
.overlay__sub{font-size:14px;color:var(--ink-soft);}
</style>

<main class="stage">
<div class="card">
<div class="header">
<div class="header__title">🧩 Block Blast</div>
<div class="header__sub">puzzle mini</div>
</div>
<div class="status">
<div class="status__score">
<span>Skor <b id="score-display">0</b></span>
<span>Terbaik <b id="best-display">0</b></span>
<span>Combo <b id="combo-display">0</b></span>
</div>
</div>
<div class="board-wrap">
<div id="board"></div>
<div class="overlay" id="overlay">
<div class="overlay__title">💥 GAME OVER</div>
<div class="overlay__sub" id="overlay-score">Skor: 0</div>
<div class="overlay__sub">Klik 🔄 Reset Game untuk main lagi</div>
</div>
</div>
<div class="tray" id="tray"></div>
<div class="controls">
<div class="controls-row">
<button class="btn-reset" id="btn-reset">🔄 Reset Game</button>
</div>
</div>
</div>
</main>

<script>
const GRID = 8;
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f1c40f','#9b59b6','#1abc9c','#e67e22','#e91e63'];

const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[1,0],[2,0]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[0,1],[1,1],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,1]],
  [[0,1],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[1,1],[2,0]],
  [[0,1],[1,0],[1,1],[2,1]],
  [[0,1],[0,2],[1,0],[1,1]],
  [[0,0],[0,1],[1,1],[1,2]],
  [[0,1],[1,0],[1,1],[1,2],[2,1]],
  [[0,0],[0,1],[1,0]],
  [[0,0],[0,1],[1,1]],
  [[0,1],[1,0],[1,1]],
  [[0,0],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
];

let board = new Array(GRID*GRID).fill(null);
let score = 0, best = 0, combo = 0, gameOver = false;
let tray = [null,null,null];
let selectedSlot = null;

const boardEl = document.getElementById('board');
const trayEl = document.getElementById('tray');
const overlayEl = document.getElementById('overlay');
const overlayScoreEl = document.getElementById('overlay-score');

function idx(r,c){ return r*GRID+c; }

function normalize(shape){
  const minR = Math.min(...shape.map(p=>p[0]));
  const minC = Math.min(...shape.map(p=>p[1]));
  return shape.map(([r,c])=>[r-minR,c-minC]);
}

function randomPiece(){
  const shape = normalize(SHAPES[Math.floor(Math.random()*SHAPES.length)]);
  const color = COLORS[Math.floor(Math.random()*COLORS.length)];
  return { shape, color, used:false };
}

function refillTray(){
  tray = [randomPiece(), randomPiece(), randomPiece()];
  selectedSlot = null;
}

function buildBoard(){
  boardEl.innerHTML='';
  for(let r=0;r<GRID;r++){
    for(let c=0;c<GRID;c++){
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.r=r;
      cell.dataset.c=c;
      cell.addEventListener('click',()=>onCellClick(r,c));
      cell.addEventListener('mouseenter',()=>onCellHover(r,c));
      cell.addEventListener('mouseleave',clearPreview);
      boardEl.appendChild(cell);
    }
  }
}

function renderBoard(){
  const cells=boardEl.children;
  for(let r=0;r<GRID;r++){
    for(let c=0;c<GRID;c++){
      const cell=cells[idx(r,c)];
      const val=board[idx(r,c)];
      cell.classList.remove('filled','preview-ok','preview-bad');
      if(val){
        cell.style.background=val;
        cell.classList.add('filled');
      }else{
        cell.style.background='';
      }
    }
  }
}

function renderTray(){
  trayEl.innerHTML='';
  tray.forEach((piece,i)=>{
    const slot=document.createElement('div');
    slot.className='piece-slot'+(piece&&piece.used?' empty':'')+(selectedSlot===i?' selected':'');
    if(piece && !piece.used){
      const maxR=Math.max(...piece.shape.map(p=>p[0]))+1;
      const maxC=Math.max(...piece.shape.map(p=>p[1]))+1;
      const g=document.createElement('div');
      g.className='piece-grid';
      g.style.gridTemplateColumns='repeat('+maxC+',1fr)';
      g.style.gridTemplateRows='repeat('+maxR+',1fr)';
      for(let r=0;r<maxR;r++){
        for(let c=0;c<maxC;c++){
          const pc=document.createElement('div');
          const on=piece.shape.some(p=>p[0]===r&&p[1]===c);
          pc.className='piece-cell'+(on?' on':'');
          if(on) pc.style.setProperty('--pc',piece.color);
          g.appendChild(pc);
        }
      }
      slot.appendChild(g);
      slot.addEventListener('click',()=>selectSlot(i));
    }
    trayEl.appendChild(slot);
  });
}

function selectSlot(i){
  if(gameOver) return;
  selectedSlot = (selectedSlot===i) ? null : i;
  renderTray();
}

function canPlace(shape,anchorR,anchorC){
  for(const [dr,dc] of shape){
    const r=anchorR+dr, c=anchorC+dc;
    if(r<0||r>=GRID||c<0||c>=GRID) return false;
    if(board[idx(r,c)]) return false;
  }
  return true;
}

function canPlaceAnywhere(shape){
  for(let r=0;r<GRID;r++){
    for(let c=0;c<GRID;c++){
      if(canPlace(shape,r,c)) return true;
    }
  }
  return false;
}

function onCellHover(r,c){
  if(selectedSlot===null || gameOver) return;
  const piece=tray[selectedSlot];
  if(!piece||piece.used) return;
  const ok=canPlace(piece.shape,r,c);
  const cells=boardEl.children;
  piece.shape.forEach(([dr,dc])=>{
    const rr=r+dr, cc=c+dc;
    if(rr>=0&&rr<GRID&&cc>=0&&cc<GRID){
      cells[idx(rr,cc)].classList.add(ok?'preview-ok':'preview-bad');
    }
  });
}

function clearPreview(){
  Array.from(boardEl.children).forEach(cell=>cell.classList.remove('preview-ok','preview-bad'));
}

function onCellClick(r,c){
  if(selectedSlot===null || gameOver) return;
  const piece=tray[selectedSlot];
  if(!piece||piece.used) return;
  if(!canPlace(piece.shape,r,c)) return;

  piece.shape.forEach(([dr,dc])=>{
    board[idx(r+dr,c+dc)] = piece.color;
  });
  score += piece.shape.length;
  piece.used = true;
  selectedSlot = null;
  clearPreview();

  const lines = clearLines();
  if(lines>0){
    combo++;
    score += lines*10 + Math.max(0,lines-1)*10 + Math.max(0,combo-1)*5;
  } else {
    combo = 0;
  }

  if(tray.every(p=>p.used)) refillTray();

  best = Math.max(best,score);
  renderBoard();
  renderTray();
  updateUI();
  checkGameOver();
}

function clearLines(){
  const fullRows=[], fullCols=[];
  for(let r=0;r<GRID;r++){
    let full=true;
    for(let c=0;c<GRID;c++) if(!board[idx(r,c)]) { full=false; break; }
    if(full) fullRows.push(r);
  }
  for(let c=0;c<GRID;c++){
    let full=true;
    for(let r=0;r<GRID;r++) if(!board[idx(r,c)]) { full=false; break; }
    if(full) fullCols.push(c);
  }
  fullRows.forEach(r=>{ for(let c=0;c<GRID;c++) board[idx(r,c)]=null; });
  fullCols.forEach(c=>{ for(let r=0;r<GRID;r++) board[idx(r,c)]=null; });
  return fullRows.length+fullCols.length;
}

function checkGameOver(){
  const active=tray.filter(p=>p&&!p.used);
  const stuck = active.every(p=>!canPlaceAnywhere(p.shape));
  if(stuck && active.length>0){
    gameOver=true;
    overlayScoreEl.textContent='Skor: '+score+' | Terbaik: '+best;
    overlayEl.classList.add('show');
  }
}

function updateUI(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('best-display').textContent=best;
  document.getElementById('combo-display').textContent=combo;
}

function resetGame(){
  board = new Array(GRID*GRID).fill(null);
  score = 0; combo = 0; gameOver = false;
  selectedSlot = null;
  overlayEl.classList.remove('show');
  refillTray();
  renderBoard();
  renderTray();
  updateUI();
}

document.getElementById('btn-reset').addEventListener('click',resetGame);

buildBoard();
resetGame();
<\/script>
`;

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
                                    messageText: 'Block Blast'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'blockblast2026',
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
        console.error('[BLOCKBLAST ERROR]', err);
        await m.reply('❌ Gagal mengirim game Block Blast.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};