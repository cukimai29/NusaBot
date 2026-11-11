/**
 * menu01.js
 * Menu utama versi HTML (dikirim via relayMessage rich response, sama
 * seperti plugin Mario/BlockBlast). Semua bagian (Beranda, Kategori,
 * Menu per kategori, Semua Menu, Owner) ada dalam satu tampilan dengan
 * tab, jadi cukup 1 command: .menu01
 *
 * CATATAN: plugin ini mengasumsikan struktur umum framework kamu:
 *  - global.plugins  -> Map/Object berisi semua plugin ter-load, tiap item
 *                       punya .config (sama seperti pluginConfig di file
 *                       Mario/BlockBlast kamu: name, alias, category,
 *                       description, usage, example, isOwner, isEnabled dll)
 *  - global.owner    -> array nomor owner, format ['628xxxxx', ...]
 *  - global.botName  -> nama bot (fallback 'WA Bot' kalau tidak ada)
 *  - m.prefix        -> prefix command aktif (fallback '.')
 *  - m.reply(text)   -> dipakai kalau relayMessage gagal
 *
 * Kalau nama variabel global di framework kamu beda, tinggal sesuaikan
 * bagian getPluginList() dan getOwners() di bawah.
 */

const te = require('../../src/lib/zerotwo-error.js');

const pluginConfig = {
    name: 'Menu01',
    alias: ['menu01', 'm01', 'helpmenu'],
    category: 'main',
    description: 'Menu utama bot (tampilan HTML): info bot, kategori, menu per kategori, semua menu, dan info owner.',
    usage: '',
    example: '.menu01',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

function getPluginList() {
    const list = [];
    if (!global.plugins) return list;
    const iterable =
        typeof global.plugins.values === 'function'
            ? global.plugins.values()
            : Object.values(global.plugins);
    for (const p of iterable) {
        if (p && p.config && p.config.isEnabled !== false) {
            list.push(p.config);
        }
    }
    return list;
}

function groupByCategory(list) {
    const groups = {};
    for (const cfg of list) {
        const cat = (cfg.category || 'lainnya').toLowerCase();
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({
            name: cfg.name || '-',
            command: cfg.alias && cfg.alias.length ? cfg.alias[0] : (cfg.name || '-'),
            description: cfg.description || '-',
            usage: cfg.usage || '',
            isOwner: !!cfg.isOwner,
            isPremium: !!cfg.isPremium
        });
    }
    return groups;
}

function getOwners() {
    if (Array.isArray(global.owner)) {
        return global.owner.map(o => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, ''));
    }
    return [];
}

function fmtUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const mnt = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d) parts.push(d + 'h');
    if (h) parts.push(h + 'j');
    if (mnt) parts.push(mnt + 'm');
    parts.push(s + 'd');
    return parts.join(' ');
}

function buildData(m) {
    const list = getPluginList();
    const groups = groupByCategory(list);
    const mem = process.memoryUsage();
    return {
        botName: global.botName || 'WA Bot',
        prefix: m.prefix || '.',
        totalMenu: list.length,
        categories: Object.keys(groups).sort(),
        groups,
        owners: getOwners(),
        uptime: fmtUptime(process.uptime()),
        ramMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        platform: process.platform
    };
}

function buildHtml(data) {
    return `
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
.tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:2px;}
.tabs::-webkit-scrollbar{display:none;}
.tab{flex:none;border:1px solid var(--line);background:var(--cell-bg);color:var(--ink-soft);font-size:12px;font-weight:600;padding:8px 12px;border-radius:20px;cursor:pointer;white-space:nowrap;font-family:inherit;}
.tab.active{background:var(--accent);border-color:var(--accent);color:#04120e;}
.panel{display:none;}
.panel.active{display:block;}
.infobox{background:var(--cell-bg);border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px;}
.infobox__row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:var(--ink-soft);}
.infobox__row b{color:var(--ink);font-weight:600;}
.catgrid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;}
.catchip{border:1px solid var(--line);background:var(--card-2);color:var(--ink);font-size:12px;font-weight:600;padding:9px 14px;border-radius:10px;cursor:pointer;font-family:inherit;flex:1;min-width:100px;text-align:center;}
.catchip b{display:block;font-size:16px;color:var(--accent);margin-top:2px;}
.cmdlist{display:flex;flex-direction:column;gap:8px;}
.cmditem{background:var(--cell-bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px;}
.cmditem__top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.cmditem__cmd{font-size:14px;font-weight:700;color:var(--accent);}
.cmditem__badge{font-size:10px;background:var(--card-2);color:var(--ink-soft);padding:2px 6px;border-radius:6px;}
.cmditem__desc{font-size:12px;color:var(--ink-soft);margin-top:3px;}
.groupheader{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px;}
.groupheader:first-child{margin-top:0;}
.backbtn{margin-bottom:12px;border:1px solid var(--line);background:var(--card-2);color:var(--ink);font-size:12px;font-weight:600;padding:8px 12px;border-radius:8px;cursor:pointer;font-family:inherit;}
.ownerlist{display:flex;flex-direction:column;gap:8px;}
.ownercard{display:flex;align-items:center;justify-content:space-between;background:var(--cell-bg);border:1px solid var(--line);border-radius:10px;padding:12px;}
.ownercard span{font-size:13px;color:var(--ink-soft);}
.ownercard a{font-size:12px;font-weight:700;color:#0b141a;background:var(--accent);padding:8px 12px;border-radius:8px;text-decoration:none;}
.empty{font-size:12px;color:var(--muted);text-align:center;padding:20px 0;}
</style>

<main class="stage">
<div class="card">
<div class="header">
<div class="header__title">🤖 ${data.botName}</div>
<div class="header__sub">menu utama</div>
</div>

<div class="tabs">
<button class="tab active" data-tab="home">🏠 Beranda</button>
<button class="tab" data-tab="cats">📂 Kategori</button>
<button class="tab" data-tab="all">📋 Semua Menu</button>
<button class="tab" data-tab="owner">👤 Owner</button>
</div>

<div class="panel active" id="panel-home">
<div class="infobox">
<div class="infobox__row"><span>Prefix</span><b>${data.prefix}</b></div>
<div class="infobox__row"><span>Total Menu</span><b>${data.totalMenu}</b></div>
<div class="infobox__row"><span>Kategori</span><b>${data.categories.length}</b></div>
<div class="infobox__row"><span>Uptime</span><b>${data.uptime}</b></div>
<div class="infobox__row"><span>RAM</span><b>${data.ramMb} MB</b></div>
<div class="infobox__row"><span>Platform</span><b>${data.platform}</b></div>
</div>
<div class="empty">Buka tab <b style="color:var(--ink)">Kategori</b> untuk lihat menu per kategori, atau <b style="color:var(--ink)">Semua Menu</b> untuk lihat semuanya sekaligus.</div>
</div>

<div class="panel" id="panel-cats">
<div class="catgrid" id="catgrid"></div>
</div>

<div class="panel" id="panel-catdetail">
<button class="backbtn" id="back-to-cats">← Kembali ke Kategori</button>
<div class="groupheader" id="catdetail-title"></div>
<div class="cmdlist" id="catdetail-list"></div>
</div>

<div class="panel" id="panel-all">
<div id="all-list"></div>
</div>

<div class="panel" id="panel-owner">
<div class="ownerlist" id="owner-list"></div>
</div>

</div>
</main>

<script>
const DATA = ${JSON.stringify(data)};

function renderCmdItem(cmd, prefix){
  const badge = cmd.isOwner ? 'Owner' : (cmd.isPremium ? 'Premium' : '');
  return '<div class="cmditem">' +
    '<div class="cmditem__top"><span class="cmditem__cmd">' + prefix + cmd.command + '</span>' +
    (badge ? '<span class="cmditem__badge">' + badge + '</span>' : '') +
    '</div><div class="cmditem__desc">' + cmd.description + '</div></div>';
}

function renderCats(){
  const grid=document.getElementById('catgrid');
  grid.innerHTML='';
  DATA.categories.forEach(cat=>{
    const count=DATA.groups[cat].length;
    const chip=document.createElement('button');
    chip.className='catchip';
    chip.innerHTML=cat.toUpperCase()+'<b>'+count+'</b>';
    chip.addEventListener('click',()=>openCategory(cat));
    grid.appendChild(chip);
  });
}

function openCategory(cat){
  document.getElementById('catdetail-title').textContent=cat.toUpperCase();
  const listEl=document.getElementById('catdetail-list');
  listEl.innerHTML=DATA.groups[cat].map(c=>renderCmdItem(c,DATA.prefix)).join('');
  showPanel('catdetail');
}

function renderAll(){
  const el=document.getElementById('all-list');
  el.innerHTML=DATA.categories.map(cat=>{
    return '<div class="groupheader">'+cat.toUpperCase()+'</div><div class="cmdlist">' +
      DATA.groups[cat].map(c=>renderCmdItem(c,DATA.prefix)).join('') + '</div>';
  }).join('');
}

function renderOwner(){
  const el=document.getElementById('owner-list');
  if(!DATA.owners.length){
    el.innerHTML='<div class="empty">Data owner belum diatur.</div>';
    return;
  }
  el.innerHTML=DATA.owners.map((num,i)=>{
    return '<div class="ownercard"><span>Owner ' + (i+1) + ' — ' + num + '</span>' +
      '<a href="https://wa.me/' + num + '" target="_blank" rel="noopener">Chat</a></div>';
  }).join('');
}

function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.tab===name);
  });
}

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>showPanel(tab.dataset.tab));
});
document.getElementById('back-to-cats').addEventListener('click',()=>showPanel('cats'));

renderCats();
renderAll();
renderOwner();
<\/script>
`;
}

async function handler(m, { sock }) {
    try {
        const data = buildData(m);
        const html = buildHtml(data);

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
                                    messageText: 'Menu01'
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: 'menu012026',
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
        console.error('[MENU01 ERROR]', err);
        await m.reply('❌ Gagal menampilkan menu.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};