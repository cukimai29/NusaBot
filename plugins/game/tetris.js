const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'Tetris',
    alias: ['tetris', 'block', 'puzzle'],
    category: 'game',
    description: 'Tetris classic - susun block & dapatkan skor tertinggi!',
    usage: '',
    example: '.tetris',
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
.board-wrap{position:relative;width:100%;aspect-ratio:1/1;background:#0a0a1a;border-radius:8px;overflow:hidden;border:2px solid var(--line-strong);}
canvas{width:100%;height:100%;display:block;cursor:pointer;touch-action:none;image-rendering:pixelated;}
.controls{margin-top:12px;display:flex;flex-direction:column;gap:6px;}
.controls-row{display:flex;gap:6px;justify-content:center;}
.controls button{border:none;border-radius:8px;padding:10px 0;font-size:16px;font-weight:700;color:#0b141a;cursor:pointer;font-family:inherit;background:var(--card-2);color:var(--ink);border:1px solid var(--line);flex:1;min-width:45px;}
.controls button:active{filter:brightness(.85);transform:scale(0.94);}
.btn-left{background:linear-gradient(180deg,#6c5ce7,#4834d4);color:#fff !important;}
.btn-right{background:linear-gradient(180deg,#6c5ce7,#4834d4);color:#fff !important;}
.btn-down{background:linear-gradient(180deg,#6c5ce7,#4834d4);color:#fff !important;}
.btn-rotate{background:linear-gradient(180deg,#f39c12,#d68910);color:#fff !important;}
.btn-drop{background:linear-gradient(180deg,#ff6b6b,#ee5a24);color:#fff !important;}
.btn-reset{background:var(--accent);color:#0b141a !important;border-color:var(--accent) !important;flex:2;}
</style>

<main class="stage">
<div class="card">
<div class="header">
<div class="header__title">🧩 Tetris</div>
<div class="header__sub">classic block</div>
</div>
<div class="status">
<div class="status__score">
<span>Skor <b id="score-display">0</b></span>
<span>Level <b id="level-display">1</b></span>
<span>Baris <b id="lines-display">0</b></span>
</div>
</div>
<div class="board-wrap">
<canvas id="board"></canvas>
</div>
<div class="controls">
<div class="controls-row">
<button class="btn-left" id="btn-left">◀</button>
<button class="btn-rotate" id="btn-rotate">🔄</button>
<button class="btn-right" id="btn-right">▶</button>
</div>
<div class="controls-row">
<button class="btn-down" id="btn-down">⬇ Turun</button>
<button class="btn-drop" id="btn-drop">⬇⬇ Drop</button>
</div>
<div class="controls-row">
<button class="btn-reset" id="btn-reset">🔄 Reset</button>
</div>
</div>
</div>
</main>

<script>
const canvas=document.getElementById('board');
const ctx=canvas.getContext('2d');
let W=300,H=300,cellSize=0,cols=10,rows=20;

function resizeCanvas(){
const rect=canvas.getBoundingClientRect();
W=canvas.width=Math.max(280,Math.floor(rect.width));
H=canvas.height=Math.max(280,Math.floor(rect.height));
cellSize=W/cols;
}

const colors=['#00a884','#ff6b6b','#f9ca24','#4a7bec','#6c5ce7','#fd79a8','#00cec9'];
const shapes=[
[[1,1,1,1]],
[[1,0,0],[1,1,1]],
[[0,0,1],[1,1,1]],
[[1,1],[1,1]],
[[0,1,1],[1,1,0]],
[[1,1,0],[0,1,1]],
[[1,1,1],[0,1,0]]
];

let board=[],current={},score=0,lines=0,level=1,gameOver=false,dropTimer=0,dropInterval=1000,gameLoopId=null;

function initBoard(){board=Array.from({length:rows},()=>Array(cols).fill(0));}
function randomShape(){const idx=Math.floor(Math.random()*shapes.length);return {shape:shapes[idx].map(row=>[...row]),color:colors[idx],x:Math.floor((cols-shapes[idx][0].length)/2),y:0};}
function spawnShape(){current=randomShape();if(collision(current.shape,current.x,current.y)){gameOver=true;}}
function collision(shape,ox,oy){for(let r=0;r<shape.length;r++){for(let c=0;c<shape[r].length;c++){if(shape[r][c]){const x=ox+c,y=oy+r;if(x<0||x>=cols||y>=rows||y<0)return true;if(y>=0&&board[y][x])return true;}}}return false;}
function mergeShape(){for(let r=0;r<current.shape.length;r++){for(let c=0;c<current.shape[r].length;c++){if(current.shape[r][c]){const x=current.x+c,y=current.y+r;if(y>=0)board[y][x]=current.color;}}}clearLines();spawnShape();}
function clearLines(){let cleared=0;for(let r=rows-1;r>=0;r--){if(board[r].every(cell=>cell!==0)){board.splice(r,1);board.unshift(Array(cols).fill(0));cleared++;r++;}}if(cleared>0){const points=[0,100,300,500,800];score+=points[Math.min(cleared,4)]*(level);lines+=cleared;level=Math.floor(lines/10)+1;dropInterval=Math.max(100,1000-(level-1)*80);updateUI();}}
function moveShape(dx,dy){if(!collision(current.shape,current.x+dx,current.y+dy)){current.x+=dx;current.y+=dy;return true;}if(dy===1){mergeShape();}return false;}
function rotateShape(){const rotated=current.shape[0].map((_,i)=>current.shape.map(row=>row[i]).reverse());if(!collision(rotated,current.x,current.y)){current.shape=rotated;}}
function hardDrop(){while(!collision(current.shape,current.x,current.y+1)){current.y++;}mergeShape();}
function updateUI(){document.getElementById('score-display').textContent=score;document.getElementById('level-display').textContent=level;document.getElementById('lines-display').textContent=lines;}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){if(board[r][c]){ctx.fillStyle=board[r][c];ctx.fillRect(c*cellSize,r*cellSize,cellSize-1,cellSize-1);}}}if(current.shape){for(let r=0;r<current.shape.length;r++){for(let c=0;c<current.shape[r].length;c++){if(current.shape[r][c]){const x=(current.x+c)*cellSize,y=(current.y+r)*cellSize;ctx.fillStyle=current.color;ctx.fillRect(x,y,cellSize-1,cellSize-1);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(x+2,y+2,cellSize-5,cellSize-5);}}}}if(gameOver){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff6b6b';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💀 GAME OVER',W/2,H/2-20);ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText('Skor: '+score,W/2,H/2+25);ctx.fillStyle='var(--muted)';ctx.font='13px sans-serif';ctx.fillText('Klik 🔄 Reset',W/2,H/2+70);}}
function update(){if(gameOver)return;dropTimer++;if(dropTimer>=dropInterval/16.67){dropTimer=0;if(!moveShape(0,1)){mergeShape();}}}
function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}
function resetGame(){board=[];score=0;lines=0;level=1;gameOver=false;dropTimer=0;dropInterval=1000;initBoard();spawnShape();updateUI();}

document.getElementById('btn-left').addEventListener('click',()=>{if(!gameOver)moveShape(-1,0);});
document.getElementById('btn-right').addEventListener('click',()=>{if(!gameOver)moveShape(1,0);});
document.getElementById('btn-down').addEventListener('click',()=>{if(!gameOver)moveShape(0,1);});
document.getElementById('btn-rotate').addEventListener('click',()=>{if(!gameOver)rotateShape();});
document.getElementById('btn-drop').addEventListener('click',()=>{if(!gameOver)hardDrop();});
document.getElementById('btn-reset').addEventListener('click',resetGame);

document.addEventListener('keydown',(e)=>{
const k=e.key;
if(k==='ArrowLeft'){e.preventDefault();if(!gameOver)moveShape(-1,0);}
if(k==='ArrowRight'){e.preventDefault();if(!gameOver)moveShape(1,0);}
if(k==='ArrowDown'){e.preventDefault();if(!gameOver)moveShape(0,1);}
if(k==='ArrowUp'){e.preventDefault();if(!gameOver)rotateShape();}
if(k===' '){e.preventDefault();if(!gameOver)hardDrop();}
if(k==='r'){e.preventDefault();resetGame();}
});

resizeCanvas();resetGame();window.addEventListener('resize',()=>{resizeCanvas();});gameLoop();
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
                                    messageText: 'Tetris Classic'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'tetris2026',
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
        console.error('[TETRIS ERROR]', err);
        await m.reply('❌ Gagal mengirim game Tetris.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};