const config = require('../../config')
const te = require('../../src/lib/zerotwo-error.js')

const pluginConfig = {
    name: 'chess',
    alias: ['catur', 'chessonline', 'zerochess'],
    category: 'game',
    description: 'Main catur melawan AI atau 2 player!',
    usage: '',
    example: '.chess',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Zero Chess</title>
<style>
:root{
  --bg:#08070b;
  --panel:#121017;
  --panel2:#19151f;
  --line:rgba(255,255,255,.09);
  --text:#fff;
  --muted:#aaa1ae;
  --pink:#ff6fae;
  --pink2:#ff9ac7;
  --light:#f2d7b5;
  --dark:#a96f54;
  --selected:#ffd45c;
  --move:rgba(93,255,167,.75);
  --capture:rgba(255,80,110,.9);
  --check:#ff426c;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{margin:0;padding:0;background:radial-gradient(circle at top,#21101c 0%,#0b080d 45%,#050407 100%);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
body{min-height:100vh;padding:12px;}
.app{width:min(100%,760px);margin:auto;}
.header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
.brand{display:flex;align-items:center;gap:10px;}
.avatar{width:46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff77b4,#9b4dff);box-shadow:0 8px 25px rgba(255,90,170,.22);font-size:25px;}
.title{font-size:19px;font-weight:800;}
.subtitle{color:var(--muted);font-size:11px;margin-top:2px;}
.status{padding:8px 11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.035);color:#ddd;font-size:11px;}
.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.select,.btn{min-height:42px;border-radius:13px;border:1px solid var(--line);background:rgba(255,255,255,.045);color:#fff;font-size:13px;outline:none;}
.select{padding:0 12px;}
.btn{padding:0 12px;font-weight:700;cursor:pointer;}
.btn:active{transform:scale(.97);}
.btn.primary{background:linear-gradient(135deg,#ff5fa5,#c457ff);border:0;}
.boardWrap{position:relative;width:100%;max-width:680px;margin:auto;padding:8px;border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.025));box-shadow:0 20px 60px rgba(0,0,0,.45),0 0 40px rgba(255,80,160,.08);}
.board{position:relative;width:100%;aspect-ratio:1;display:grid;grid-template-columns:repeat(8,1fr);overflow:hidden;border-radius:15px;touch-action:none;user-select:none;}
.square{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:1;cursor:pointer;}
.square.light{background:var(--light);}
.square.dark{background:var(--dark);}
.square.selected{box-shadow:inset 0 0 0 4px var(--selected);}
.square.check{background:radial-gradient(circle,rgba(255,30,80,.95),rgba(255,30,80,.35) 55%,transparent 75%);}
.piece{position:relative;z-index:4;font-size:clamp(28px,8vw,61px);line-height:1;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45));transition:transform .1s ease;}
.piece.w{color:#ffffff;}
.piece.b{color:#000000;filter:drop-shadow(0 3px 2px rgba(255,255,255,.2));}
.square.selected .piece{transform:scale(1.08);}
.moveDot{position:absolute;width:22%;height:22%;border-radius:50%;background:var(--move);z-index:2;box-shadow:0 0 10px rgba(93,255,167,.35);}
.captureRing{position:absolute;inset:8%;border-radius:50%;border:5px solid var(--capture);z-index:2;}
.coord{position:absolute;font-size:9px;font-weight:800;opacity:.65;pointer-events:none;}
.file{right:4px;bottom:2px;}
.rank{left:4px;top:2px;}
.light .coord{color:#754c39;}
.dark .coord{color:#f5dcc5;}
.info{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px;}
.card{padding:11px;min-height:62px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.035);text-align:center;}
.card b{display:block;font-size:15px;}
.card span{color:var(--muted);font-size:10px;}
.captured{min-height:38px;margin-top:10px;padding:9px 12px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.03);color:#ddd;font-size:19px;word-break:break-word;}
.message{margin-top:10px;padding:11px 13px;border-radius:13px;background:rgba(255,111,174,.07);border:1px solid rgba(255,111,174,.14);text-align:center;color:#ffd5e7;font-size:12px;min-height:40px;display:flex;align-items:center;justify-content:center;}
.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;}
.overlay{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);}
.overlay.show{display:flex;}
.modal{width:min(92vw,420px);padding:23px;border-radius:23px;background:linear-gradient(145deg,#1c151e,#0f0c12);border:1px solid rgba(255,255,255,.10);box-shadow:0 25px 80px rgba(0,0,0,.65);text-align:center;}
.modalIcon{font-size:55px;margin-bottom:7px;}
.modal h2{margin:5px 0;font-size:24px;}
.modal p{color:var(--muted);font-size:13px;margin-bottom:17px;}
.modeButtons{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.modeBtn{padding:14px 10px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.045);color:#fff;cursor:pointer;}
.modeBtn strong{display:block;margin-bottom:3px;}
.modeBtn small{color:var(--muted);}
.promotion{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.68);}
.promotion.show{display:flex;}
.promoBox{padding:18px;border-radius:20px;background:#171219;border:1px solid var(--line);}
.promoBox h3{margin:0 0 12px;text-align:center;}
.promoChoices{display:flex;gap:8px;}
.promo{width:60px;height:60px;border:0;border-radius:13px;background:#29202a;color:white;font-size:39px;}
@media(max-width:430px){body{padding:8px;}.boardWrap{padding:5px;border-radius:17px;}.info{gap:5px;}.card{padding:9px 4px;}.actions{grid-template-columns:1fr 1fr 1fr;}}
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <div class="brand">
      <div class="avatar">♟️</div>
      <div>
        <div class="title">Zero Chess ✨</div>
        <div class="subtitle">"Ayo main catur, Darling~!" ♡</div>
      </div>
    </div>
    <div class="status" id="status">White turn</div>
  </div>
  <div class="controls">
    <select id="mode" class="select">
      <option value="easy">🟢 Easy</option>
      <option value="medium" selected>🔵 Medium</option>
      <option value="hard">🟣 Hard</option>
      <option value="master">🔴 Master</option>
      <option value="pvp">👥 2 Player</option>
    </select>
    <button class="btn primary" id="newGame">♻️ New Game</button>
  </div>
  <div class="boardWrap">
    <div id="board" class="board"></div>
  </div>
  <div class="info">
    <div class="card"><b id="turnText">White</b><span>Giliran</span></div>
    <div class="card"><b id="moveText">0</b><span>Moves</span></div>
    <div class="card"><b id="modeText">Medium</b><span>Mode</span></div>
  </div>
  <div class="captured" id="captured">⚪ —</div>
  <div class="message" id="message">Pilih bidak untuk mulai bermain ♟️</div>
  <div class="actions">
    <button class="btn" id="undo">↩️ Undo</button>
    <button class="btn" id="flip">🔄 Flip</button>
    <button class="btn" id="resign">🏳️ Resign</button>
  </div>
</div>
<div class="overlay" id="overlay">
  <div class="modal">
    <div class="modalIcon" id="resultIcon">🏆</div>
    <h2 id="resultTitle">Checkmate!</h2>
    <p id="resultText">White wins.</p>
    <div class="modeButtons">
      <button class="modeBtn" data-mode="easy"><strong>🟢 Easy</strong><small>Santai</small></button>
      <button class="modeBtn" data-mode="medium"><strong>🔵 Medium</strong><small>Normal</small></button>
      <button class="modeBtn" data-mode="hard"><strong>🟣 Hard</strong><small>Sulit</small></button>
      <button class="modeBtn" data-mode="master"><strong>🔴 Master</strong><small>Serius 😭</small></button>
      <button class="modeBtn" data-mode="pvp"><strong>👥 2 Player</strong><small>Teman vs teman</small></button>
      <button class="modeBtn" id="playAgain"><strong>♻️ Rematch</strong><small>Main lagi</small></button>
    </div>
  </div>
</div>
<div class="promotion" id="promotion">
  <div class="promoBox">
    <h3>Promote Pion 👑</h3>
    <div class="promoChoices">
      <button class="promo" data-piece="q">♕</button>
      <button class="promo" data-piece="r">♖</button>
      <button class="promo" data-piece="b">♗</button>
      <button class="promo" data-piece="n">♘</button>
    </div>
  </div>
</div>
<script>
'use strict';
let audioCtx=null;
function initAudio(){if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();}if(audioCtx.state==='suspended'){audioCtx.resume();}}
function playSound(type){try{initAudio();const osc=audioCtx.createOscillator();const gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);const now=audioCtx.currentTime;if(type==='move'){osc.type='sine';osc.frequency.setValueAtTime(600,now);osc.frequency.exponentialRampToValueAtTime(800,now+0.1);gain.gain.setValueAtTime(0.2,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.1);osc.start(now);osc.stop(now+0.1);}else if(type==='capture'){osc.type='square';osc.frequency.setValueAtTime(300,now);osc.frequency.exponentialRampToValueAtTime(100,now+0.15);gain.gain.setValueAtTime(0.2,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.15);osc.start(now);osc.stop(now+0.15);}}catch(e){}}
function speakZeroTwo(text){try{if('speechSynthesis' in window){window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='id-ID';utterance.pitch=1.3;utterance.rate=1.0;window.speechSynthesis.speak(utterance);}}catch(e){}}
const WHITE='w',BLACK='b';
const PIECES={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};
const VALUE={p:100,n:320,b:330,r:500,q:900,k:20000};
const FILES=['a','b','c','d','e','f','g','h'];
const boardEl=document.getElementById('board');
const modeEl=document.getElementById('mode');
const statusEl=document.getElementById('status');
const turnText=document.getElementById('turnText');
const moveText=document.getElementById('moveText');
const modeText=document.getElementById('modeText');
const messageEl=document.getElementById('message');
const capturedEl=document.getElementById('captured');
const overlay=document.getElementById('overlay');
const resultIcon=document.getElementById('resultIcon');
const resultTitle=document.getElementById('resultTitle');
const resultText=document.getElementById('resultText');
const promotionEl=document.getElementById('promotion');
let board=[],turn=WHITE,selected=null,legalSelected=[],history=[],flipped=false,gameOver=false,thinking=false,pendingPromotion=null,castle={w:{k:true,q:true},b:{k:true,q:true}},enPassant=null,halfmove=0,fullmove=1,captured={w:[],b:[]},mode='medium';
function cloneBoard(b){return b.map(row=>row.map(p=>p?{...p}:null));}
function cloneState(){return{board:cloneBoard(board),turn,castle:JSON.parse(JSON.stringify(castle)),enPassant:enPassant?{...enPassant}:null,halfmove,fullmove,captured:{w:[...captured.w],b:[...captured.b]}};}
function restoreState(s){board=cloneBoard(s.board);turn=s.turn;castle=JSON.parse(JSON.stringify(s.castle));enPassant=s.enPassant?{...s.enPassant}:null;halfmove=s.halfmove;fullmove=s.fullmove;captured={w:[...s.captured.w],b:[...s.captured.b]};selected=null;legalSelected=[];}
function inside(r,c){return r>=0&&r<8&&c>=0&&c<8;}
function opposite(color){return color===WHITE?BLACK:WHITE;}
function pieceAt(r,c){if(!inside(r,c))return null;return board[r][c];}
function makePiece(color,type){return{color,type};}
function squareName(r,c){return FILES[c]+(8-r);}
function randomChoice(arr){return arr[Math.floor(Math.random()*arr.length)];}
function createInitialBoard(){const b=Array.from({length:8},()=>Array(8).fill(null));const back=['r','n','b','q','k','b','n','r'];for(let c=0;c<8;c++){b[0][c]=makePiece(BLACK,back[c]);b[1][c]=makePiece(BLACK,'p');b[6][c]=makePiece(WHITE,'p');b[7][c]=makePiece(WHITE,back[c]);}return b;}
function isSquareAttacked(b,r,c,byColor){const pawnDir=byColor===WHITE?1:-1;for(const dc of[-1,1]){const rr=r+pawnDir,cc=c+dc;if(inside(rr,cc)){const p=b[rr][cc];if(p&&p.color===byColor&&p.type==='p')return true;}}
const knightMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
for(const[dr,dc]of knightMoves){const p=pieceAtBoard(b,r+dr,c+dc);if(p&&p.color===byColor&&p.type==='n')return true;}
for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const p=pieceAtBoard(b,r+dr,c+dc);if(p&&p.color===byColor&&p.type==='k')return true;}}
const diagonals=[[-1,-1],[-1,1],[1,-1],[1,1]];for(const[dr,dc]of diagonals){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=pieceAtBoard(b,rr,cc);if(p){if(p.color===byColor&&(p.type==='b'||p.type==='q'))return true;break;}rr+=dr;cc+=dc;}}
const straight=[[-1,0],[1,0],[0,-1],[0,1]];for(const[dr,dc]of straight){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=pieceAtBoard(b,rr,cc);if(p){if(p.color===byColor&&(p.type==='r'||p.type==='q'))return true;break;}rr+=dr;cc+=dc;}}
return false;}
function pieceAtBoard(b,r,c){if(!inside(r,c))return null;return b[r][c];}
function findKing(b,color){for(let r=0;r<8;r++){for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.color===color&&p.type==='k')return{r,c};}}return null;}
function inCheck(b,color){const king=findKing(b,color);if(!king)return true;return isSquareAttacked(b,king.r,king.c,opposite(color));}
function pseudoMoves(b,r,c,stateTurn){const p=b[r][c];if(!p||p.color!==stateTurn)return[];const moves=[];function add(rr,cc,extra={}){if(!inside(rr,cc))return;const target=b[rr][cc];if(target&&target.color===p.color)return;moves.push({from:{r,c},to:{r:rr,c:cc},...extra});}
if(p.type==='p'){const dir=p.color===WHITE?-1:1;const start=p.color===WHITE?6:1;if(inside(r+dir,c)&&!b[r+dir][c]){add(r+dir,c);if(r===start&&!b[r+dir*2][c]){add(r+dir*2,c,{doublePawn:true});}}
for(const dc of[-1,1]){const rr=r+dir,cc=c+dc;if(!inside(rr,cc))continue;const target=b[rr][cc];if(target&&target.color!==p.color){add(rr,cc,{capture:true});}
if(enPassant&&enPassant.r===rr&&enPassant.c===cc){add(rr,cc,{enPassant:true,capture:true});}}}
if(p.type==='n'){const jumps=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];for(const[dr,dc]of jumps){add(r+dr,c+dc);}}
if(p.type==='b'||p.type==='r'||p.type==='q'){const dirs=[];if(p.type==='b'||p.type==='q'){dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);}
if(p.type==='r'||p.type==='q'){dirs.push([-1,0],[1,0],[0,-1],[0,1]);}
for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const target=b[rr][cc];if(!target){add(rr,cc);}else{if(target.color!==p.color){add(rr,cc,{capture:true});}break;}rr+=dr;cc+=dc;}}}
if(p.type==='k'){for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;add(r+dr,c+dc);}}
const rights=castle[p.color];if(rights&&!inCheck(b,p.color)){if(rights.k&&!b[r][5]&&!b[r][6]&&b[r][7]&&b[r][7].type==='r'&&b[r][7].color===p.color&&!isSquareAttacked(b,r,5,opposite(p.color))&&!isSquareAttacked(b,r,6,opposite(p.color))){moves.push({from:{r,c},to:{r,c:6},castle:'k'});}
if(rights.q&&!b[r][1]&&!b[r][2]&&!b[r][3]&&b[r][0]&&b[r][0].type==='r'&&b[r][0].color===p.color&&!isSquareAttacked(b,r,3,opposite(p.color))&&!isSquareAttacked(b,r,2,opposite(p.color))){moves.push({from:{r,c},to:{r,c:2},castle:'q'});}}}
return moves;}
function applyMoveToBoard(b,move,promotion='q'){const next=cloneBoard(b);const p=next[move.from.r][move.from.c];if(!p)return next;let capturedPiece=next[move.to.r][move.to.c];next[move.from.r][move.from.c]=null;if(move.enPassant){const dir=p.color===WHITE?1:-1;const rr=move.to.r+dir;capturedPiece=next[rr][move.to.c];next[rr][move.to.c]=null;}
next[move.to.r][move.to.c]={...p};if(p.type==='p'&&(move.to.r===0||move.to.r===7)){next[move.to.r][move.to.c].type=promotion||'q';}
if(move.castle==='k'){next[move.from.r][5]=next[move.from.r][7];next[move.from.r][7]=null;}
if(move.castle==='q'){next[move.from.r][3]=next[move.from.r][0];next[move.from.r][0]=null;}
return next;}
function legalMovesForPiece(b,r,c,color){const pseudo=pseudoMoves(b,r,c,color);const legal=[];for(const move of pseudo){const next=applyMoveToBoard(b,move,'q');if(!inCheck(next,color)){legal.push(move);}}
return legal;}
function allLegalMoves(b,color){const result=[];for(let r=0;r<8;r++){for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.color===color){result.push(...legalMovesForPiece(b,r,c,color));}}}
return result;}
function executeMove(move,promotion='q',save=true){if(gameOver)return;initAudio();const before=cloneState();const moving=board[move.from.r][move.from.c];let capturedPiece=board[move.to.r][move.to.c];if(move.enPassant){const dir=moving.color===WHITE?1:-1;capturedPiece=board[move.to.r+dir][move.to.c];}
board=applyMoveToBoard(board,move,promotion);if(capturedPiece){captured[moving.color].push(capturedPiece);playSound('capture');}else{playSound('move');}
if(moving.type==='k'){castle[moving.color].k=false;castle[moving.color].q=false;}
if(moving.type==='r'){if(moving.color===WHITE){if(move.from.r===7&&move.from.c===0)castle.w.q=false;if(move.from.r===7&&move.from.c===7)castle.w.k=false;}else{if(move.from.r===0&&move.from.c===0)castle.b.q=false;if(move.from.r===0&&move.from.c===7)castle.b.k=false;}}
if(capturedPiece&&capturedPiece.type==='r'){if(move.to.r===7&&move.to.c===0)castle.w.q=false;if(move.to.r===7&&move.to.c===7)castle.w.k=false;if(move.to.r===0&&move.to.c===0)castle.b.q=false;if(move.to.r===0&&move.to.c===7)castle.b.k=false;}
enPassant=null;if(moving.type==='p'&&Math.abs(move.to.r-move.from.r)===2){enPassant={r:(move.to.r+move.from.r)/2,c:move.from.c};}
if(moving.type==='p'||capturedPiece){halfmove=0;}else{halfmove++;}
if(moving.color===BLACK){fullmove++;}
if(save){history.push(before);}
turn=opposite(turn);selected=null;legalSelected=[];render();checkGameState();if(!gameOver&&mode!=='pvp'&&turn===BLACK){aiMove();}}
function selectSquare(r,c){if(gameOver||thinking)return;if(mode!=='pvp'&&turn===BLACK)return;const p=board[r][c];if(selected){const move=legalSelected.find(m=>m.to.r===r&&m.to.c===c);if(move){const moving=board[move.from.r][move.from.c];if(moving.type==='p'&&(move.to.r===0||move.to.r===7)){pendingPromotion=move;promotionEl.classList.add('show');return;}
executeMove(move);return;}
if(p&&p.color===turn){selected={r,c};legalSelected=legalMovesForPiece(board,r,c,turn);render();return;}
selected=null;legalSelected=[];render();return;}
if(p&&p.color===turn){selected={r,c};legalSelected=legalMovesForPiece(board,r,c,turn);render();}}
function checkGameState(){const moves=allLegalMoves(board,turn);const check=inCheck(board,turn);if(moves.length===0){gameOver=true;if(check){const winner=opposite(turn)===WHITE?'White':'Black';if(mode!=='pvp'){if(winner==='White'){speakZeroTwo('Ughh... kamu menang. Hebat juga ya.');}else{speakZeroTwo('Yeyyy! Zero Two menang! Kamu kalah mampus!');}}else{speakZeroTwo('Skak mat! '+winner+' menang!');}
showResult('👑','Checkmate!',winner+' menang!');}else{speakZeroTwo('Heeeh... permainannya seri nih.');showResult('🤝','Stalemate','Permainan berakhir remis.');}
return;}
if(halfmove>=100){gameOver=true;speakZeroTwo('Lama banget mainnya, seri aja deh!');showResult('🤝','Draw','50-move rule.');return;}
if(check){speakZeroTwo('Skak! Hati-hati rajanya!');}
const status=check?'⚠️ CHECK!':turn===WHITE?'White turn':'Black turn';statusEl.textContent=status;messageEl.textContent=check?'⚠️ Raja sedang dalam bahaya!':turn===WHITE?'Giliran kamu ♟️':mode==='pvp'?'Giliran Black ♟️':'Zero Two sedang berpikir... 🧠';turnText.textContent=turn===WHITE?'White':'Black';}
function getDepth(){if(mode==='easy')return 1;if(mode==='medium')return 2;if(mode==='hard')return 3;return 4;}
function evaluateBoard(b){let score=0;for(let r=0;r<8;r++){for(let c=0;c<8;c++){const p=b[r][c];if(!p)continue;let value=VALUE[p.type];const centerDist=Math.abs(3.5-r)+Math.abs(3.5-c);if(p.type==='p'){value+=(p.color===WHITE?6-r:r-1)*8;}
if(p.type==='n'||p.type==='b'){value+=Math.max(0,20-centerDist*5);}
if(p.type==='q'){value+=Math.max(0,12-centerDist*2);}
score+=p.color===WHITE?value:-value;}}
if(inCheck(b,WHITE))score-=45;if(inCheck(b,BLACK))score+=45;return score;}
function moveOrderScore(b,move){const attacker=b[move.from.r][move.from.c];let score=0;if(move.capture){let victim=b[move.to.r][move.to.c];if(move.enPassant){victim={type:'p'};}
if(victim){score+=VALUE[victim.type]*10-VALUE[attacker.type];}}
if(move.castle)score+=40;if(attacker.type==='p'){if(move.to.r===0||move.to.r===7)score+=800;}
return score;}
function orderedMoves(b,color){const moves=allLegalMoves(b,color);moves.sort((a,z)=>moveOrderScore(b,z)-moveOrderScore(b,a));return moves;}
function minimax(b,color,depth,alpha,beta){const moves=orderedMoves(b,color);if(depth===0){return evaluateBoard(b);}
if(moves.length===0){if(inCheck(b,color)){return color===WHITE?-999999:999999;}
return 0;}
if(color===WHITE){let best=-Infinity;for(const move of moves){const next=applyMoveToBoard(b,move,'q');const value=minimax(next,BLACK,depth-1,alpha,beta);best=Math.max(best,value);alpha=Math.max(alpha,value);if(beta<=alpha)break;}
return best;}else{let best=Infinity;for(const move of moves){const next=applyMoveToBoard(b,move,'q');const value=minimax(next,WHITE,depth-1,alpha,beta);best=Math.min(best,value);beta=Math.min(beta,value);if(beta<=alpha)break;}
return best;}}
function chooseAIMove(){const moves=orderedMoves(board,BLACK);if(!moves.length)return null;if(mode==='easy'){const scored=moves.map(move=>{const next=applyMoveToBoard(board,move,'q');let score=evaluateBoard(next);score+=(Math.random()-.5)*500;return{move,score};});scored.sort((a,b)=>a.score-b.score);const pool=scored.slice(0,Math.min(5,scored.length));return randomChoice(pool).move;}
const depth=getDepth();let bestMove=moves[0];let bestScore=Infinity;for(const move of moves){const next=applyMoveToBoard(board,move,'q');let score=minimax(next,WHITE,depth-1,-Infinity,Infinity);if(mode==='master'){if(move.capture){score-=VALUE[board[move.to.r][move.to.c]?.type||'p']*.02;}
if(move.castle){score-=15;}}
if(score<bestScore){bestScore=score;bestMove=move;}else if(Math.abs(score-bestScore)<15&&Math.random()<.22){bestMove=move;}}
return bestMove;}
function aiMove(){if(gameOver||mode==='pvp'||turn!==BLACK)return;thinking=true;statusEl.textContent='🧠 Zero Two thinking...';messageEl.textContent='Zero Two lagi mikir langkah terbaik... ehehe 🧠✨';setTimeout(()=>{const move=chooseAIMove();thinking=false;if(move){executeMove(move);}},mode==='master'?100:70);}
function render(){boardEl.innerHTML='';for(let displayR=0;displayR<8;displayR++){for(let displayC=0;displayC<8;displayC++){const r=flipped?7-displayR:displayR;const c=flipped?7-displayC:displayC;const el=document.createElement('div');el.className='square '+((r+c)%2===0?'light':'dark');if(selected&&selected.r===r&&selected.c===c){el.classList.add('selected');}
const king=board[r][c];if(king&&king.type==='k'&&king.color===turn&&inCheck(board,turn)){el.classList.add('check');}
const move=legalSelected.find(m=>m.to.r===r&&m.to.c===c);if(move){if(board[r][c]||move.enPassant){const ring=document.createElement('div');ring.className='captureRing';el.appendChild(ring);}else{const dot=document.createElement('div');dot.className='moveDot';el.appendChild(dot);}}
if(board[r][c]){const piece=document.createElement('div');piece.className='piece '+board[r][c].color;piece.textContent=PIECES[board[r][c].color][board[r][c].type];el.appendChild(piece);}
if(displayC===7){const coord=document.createElement('span');coord.className='coord file';coord.textContent=FILES[c];el.appendChild(coord);}
if(displayR===0){const coord=document.createElement('span');coord.className='coord rank';coord.textContent=8-r;el.appendChild(coord);}
el.addEventListener('pointerdown',e=>{e.preventDefault();selectSquare(r,c);});boardEl.appendChild(el);}}
turnText.textContent=turn===WHITE?'White':'Black';moveText.textContent=history.length;modeText.textContent=mode==='pvp'?'2 Player':mode.charAt(0).toUpperCase()+mode.slice(1);capturedEl.textContent='⚪ '+captured.w.map(p=>PIECES[p.color][p.type]).join(' ')+'    ⚫ '+captured.b.map(p=>PIECES[p.color][p.type]).join(' ');if(!gameOver){if(turn===BLACK&&mode!=='pvp'){statusEl.textContent=thinking?'🧠 Thinking...':'Black';}else{statusEl.textContent=turn===WHITE?'White turn':'Black turn';}}}
function resetGame(){board=createInitialBoard();turn=WHITE;selected=null;legalSelected=[];history=[];gameOver=false;thinking=false;pendingPromotion=null;castle={w:{k:true,q:true},b:{k:true,q:true}};enPassant=null;halfmove=0;fullmove=1;captured={w:[],b:[]};overlay.classList.remove('show');promotionEl.classList.remove('show');messageEl.textContent=mode==='pvp'?'White mulai dulu ♙':'White mulai dulu. Ayo kalahkan Zero Two 😏';render();}
function showResult(icon,title,text){resultIcon.textContent=icon;resultTitle.textContent=title;resultText.textContent=text;setTimeout(()=>{overlay.classList.add('show');},200);}
function undo(){if(!history.length||thinking)return;if(mode!=='pvp'&&turn===WHITE&&history.length>=2){history.pop();const state=history.pop();restoreState(state);}else{const state=history.pop();restoreState(state);}
gameOver=false;overlay.classList.remove('show');render();checkGameState();}
document.querySelectorAll('.promo').forEach(btn=>{btn.addEventListener('click',()=>{if(!pendingPromotion)return;const type=btn.dataset.piece;const move=pendingPromotion;pendingPromotion=null;promotionEl.classList.remove('show');executeMove(move,type);});});
document.getElementById('newGame').addEventListener('click',resetGame);
document.getElementById('undo').addEventListener('click',undo);
document.getElementById('flip').addEventListener('click',()=>{flipped=!flipped;render();});
document.getElementById('resign').addEventListener('click',()=>{if(gameOver)return;gameOver=true;speakZeroTwo('Huuu, cemen! Masa nyerah sih!');showResult('🏳️','Resign',turn===WHITE?'White menyerah. Black menang.':'Black menyerah. White menang.');});
modeEl.addEventListener('change',()=>{mode=modeEl.value;resetGame();});
document.querySelectorAll('.modeBtn[data-mode]').forEach(btn=>{btn.addEventListener('click',()=>{mode=btn.dataset.mode;modeEl.value=mode;resetGame();});});
document.getElementById('playAgain').addEventListener('click',resetGame);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=null;legalSelected=[];render();}
if(e.key.toLowerCase()==='r'){resetGame();}
if(e.key.toLowerCase()==='u'){undo();}});
mode='medium';modeEl.value=mode;resetGame();
</script>
</body>
</html>`;

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
                                    messageText: 'Zero Chess ♟️✨'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'zero-chess-' + Date.now(),
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
        console.error('[CHESS ERROR]', err);
        await m.reply('❌ Gagal mengirim game Catur.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};