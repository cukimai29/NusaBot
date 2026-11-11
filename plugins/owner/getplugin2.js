const fs = require('fs')
const path = require('path')
const config = require('../../config.js')

const pluginConfig = {
    name: 'getplugin2',
    alias: ['gp2', 'getcode2', 'plugincode2', 'sourcecode2'],
    category: 'owner',
    description: 'Dapatkan source code plugin',
    usage: '.getplugin2 <nama plugin>',
    example: '.getplugin2 menu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function searchPlugin(name, pluginsDir) {
    const categories = fs.readdirSync(pluginsDir).filter((f) => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })

    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))

        for (const file of files) {
            const baseName = file.replace('.js', '').toLowerCase()
            if (baseName === name.toLowerCase()) {
                return { path: path.join(categoryPath, file), category, file }
            }
        }
    }

    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))

        for (const file of files) {
            const filePath = path.join(categoryPath, file)
            try {
                const content = fs.readFileSync(filePath, 'utf-8')
                const aliasMatch = content.match(/alias:\s*\[([^\]]+)\]/)
                if (aliasMatch) {
                    const aliases = aliasMatch[1].match(/['"`]([^'"`]+)['"`]/g)
                    if (aliases) {
                        const cleanAliases = aliases.map((a) =>
                            a.replace(/['"`]/g, '').toLowerCase()
                        )
                        if (cleanAliases.includes(name.toLowerCase())) {
                            return { path: filePath, category, file }
                        }
                    }
                }
            } catch { }
        }
    }

    return null
}

function getSimilarPlugins(name, pluginsDir) {
    const results = []
    const categories = fs.readdirSync(pluginsDir).filter((f) => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })

    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'))

        for (const file of files) {
            const baseName = file.replace('.js', '').toLowerCase()
            if (
                baseName.includes(name.toLowerCase()) ||
                name.toLowerCase().includes(baseName)
            ) {
                results.push(`${category}/${file}`)
            }
        }
    }

    return results.slice(0, 5)
}

// Extract metadata dari config plugin pakai regex
function extractMeta(content) {
    const meta = {}

    const pick = (regex) => {
        const m = content.match(regex)
        return m ? m[1].trim().replace(/['"`,]$/g, '').trim() : null
    }

    meta.name = pick(/name:\s*['"`]([^'"`]+)['"`]/)
    meta.category = pick(/category:\s*['"`]([^'"`]+)['"`]/)
    meta.description = pick(/description:\s*['"`]([^'"`]+)['"`]/)
    meta.usage = pick(/usage:\s*['"`]([^'"`]+)['"`]/)
    meta.owner = pick(/isOwner:\s*(true|false)/)
    meta.premium = pick(/isPremium:\s*(true|false)/)
    meta.group = pick(/isGroup:\s*(true|false)/)
    meta.private = pick(/isPrivate:\s*(true|false)/)
    meta.cooldown = pick(/cooldown:\s*(\d+)/)
    meta.energi = pick(/energi:\s*(\d+)/)
    meta.enabled = pick(/isEnabled:\s*(true|false)/)

    const aliasMatch = content.match(/alias:\s*\[([^\]]+)\]/)
    if (aliasMatch) {
        const aliases = aliasMatch[1].match(/['"`]([^'"`]+)['"`]/g)
        meta.aliases = aliases
            ? aliases.map((a) => a.replace(/['"`]/g, ''))
            : []
    } else {
        meta.aliases = []
    }

    return meta
}

function boolIcon(val) {
    if (val === 'true') return '✅ Ya'
    if (val === 'false') return '❌ Tidak'
    return '❔ -'
}

// ===== Helper escape buat HTML (tampilan) & buat literal string di <script> =====
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escapeForScript(str) {
    return JSON.stringify(String(str)).replace(/<\/script/gi, '<\\/script')
}

// ===== Kirim HTML sebagai rich response (botForwardedMessage) =====
async function sendHtmlRich(sock, chat, html, messageText, responseId) {
    await sock.relayMessage(
        chat,
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
                                messageText
                            }
                        ],
                        unifiedResponse: {
                            data: Buffer.from(
                                JSON.stringify({
                                    response_id: responseId,
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
    )
}

// ===== Build tampilan HTML info plugin (table rows) + code card ala Meta AI =====
function buildPluginHtml(pluginInfo, meta, codeStr, ownerName) {
    const aliasChips = (meta.aliases || [])
        .map((a) => `<span class="chip">${escapeHtml(a)}</span>`)
        .join('')
    const lineCount = codeStr.split('\n').length
    const sizeKB = (Buffer.byteLength(codeStr, 'utf-8') / 1024).toFixed(1)

    const infoRows = [
        ['Nama', meta.name || '-'],
        ['Category', pluginInfo.category],
        ['Cooldown', `${meta.cooldown || 0} detik`],
        ['Energi', String(meta.energi || 0)],
        ['Owner Only', boolIcon(meta.owner)],
        ['Premium', boolIcon(meta.premium)],
        ['Group Only', boolIcon(meta.group)],
        ['Private Only', boolIcon(meta.private)],
        ['Status', meta.enabled === 'true' ? '🟢 Aktif' : '🔴 Nonaktif']
    ]

    const tableRowsHtml = infoRows
        .map(
            ([label, value], i) =>
                `<tr class="${i % 2 === 0 ? 'r-even' : 'r-odd'}"><td class="lbl">${escapeHtml(label)}</td><td class="val">${escapeHtml(value)}</td></tr>`
        )
        .join('')

    return `
<style>
:root{
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#00a884;
  --line:#2a3942;
  --cell-bg:#111b21;
  --card-2:#1f2c33;
  --row-alt:#182229;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  --mono:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 14px;}
.card{width:100%;max-width:420px;}

.header{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--line);}
.header__icon{font-size:22px;flex:none;}
.header__title{font-size:15px;font-weight:700;color:var(--ink);word-break:break-all;}
.header__sub{font-size:11px;color:var(--muted);}
.badge{font-size:10px;font-weight:700;background:var(--card-2);color:var(--ink-soft);padding:4px 8px;border-radius:6px;margin-left:auto;flex:none;white-space:nowrap;}

/* ===== TABLE ROWS ala Meta AI ===== */
.infotable{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:14px;font-size:12.5px;}
.infotable tr.r-even{background:var(--cell-bg);}
.infotable tr.r-odd{background:var(--row-alt);}
.infotable td{padding:8px 12px;border-bottom:1px solid var(--line);}
.infotable tr:last-child td{border-bottom:none;}
.infotable td.lbl{color:var(--muted);width:42%;font-weight:500;}
.infotable td.val{color:var(--ink);font-weight:600;text-align:right;}

.box{background:var(--cell-bg);border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--ink-soft);line-height:1.5;}
.box b{color:var(--ink);}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.chip{font-size:11px;background:var(--card-2);color:var(--ink);padding:4px 9px;border-radius:12px;font-family:var(--mono);}

/* ===== CODE CARD (mekanisme simple yang udah proven jalan) ===== */
.codewrap{background:var(--cell-bg);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.codehead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid var(--line);background:var(--card-2);}
.codehead__label{font-size:11px;color:var(--ink-soft);font-family:var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.copybtn{flex:none;border:none;background:var(--accent);color:#04120e;font-size:11px;font-weight:700;padding:7px 12px;border-radius:7px;cursor:pointer;font-family:inherit;}
.copybtn.copied{background:#2ecc71;}
.copybtn.failed{background:#e74c3c;color:#fff;}
.codebody{max-height:420px;overflow:auto;padding:10px 12px;}
.codebody pre{font-family:var(--mono);font-size:11px;line-height:1.6;color:#d4d4d4;white-space:pre;}

.footnote{font-size:11px;color:var(--muted);text-align:center;margin-top:12px;}
</style>

<main class="stage">
<div class="card">

<div class="header">
<div class="header__icon">📦</div>
<div>
<div class="header__title">${escapeHtml(pluginInfo.file)}</div>
<div class="header__sub">${lineCount} baris · ${sizeKB} KB</div>
</div>
<div class="badge">${meta.enabled === 'true' ? '🟢 Aktif' : '🔴 Nonaktif'}</div>
</div>

<table class="infotable">
${tableRowsHtml}
</table>

${meta.description ? `<div class="box"><b>📝 Deskripsi</b><br>${escapeHtml(meta.description)}</div>` : ''}
${meta.usage ? `<div class="box"><b>📖 Usage</b><br>${escapeHtml(meta.usage)}</div>` : ''}
${aliasChips ? `<div class="chips">${aliasChips}</div>` : ''}

<div class="codewrap">
<div class="codehead">
<span class="codehead__label">💻 ${escapeHtml(pluginInfo.file)}</span>
<button class="copybtn" id="copy-btn">📋 Copy Code</button>
</div>
<div class="codebody"><pre id="code-text">${escapeHtml(codeStr)}</pre></div>
</div>

<div class="footnote">Diminta oleh ${escapeHtml(ownerName || 'Owner')}</div>
</div>
</main>

<script>
const CODE = ${escapeForScript(codeStr)};
const btn = document.getElementById('copy-btn');

async function copyCode(){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(CODE);
    } else {
      const ta = document.createElement('textarea');
      ta.value = CODE;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    btn.textContent = '✅ Disalin!';
    btn.classList.add('copied');
    setTimeout(()=>{
      btn.textContent = '📋 Copy Code';
      btn.classList.remove('copied');
    }, 1500);
  }catch(e){
    btn.textContent = '❌ Gagal, select manual';
    btn.classList.add('failed');
    setTimeout(()=>{
      btn.textContent = '📋 Copy Code';
      btn.classList.remove('failed');
    }, 1800);
  }
}

btn.addEventListener('click', copyCode);
<\/script>
`
}

async function handler(m, { sock, args }) {
    // FIX: pake m.isOwner (konsisten sama plugin lain), bukan config.isOwner(...)
    if (!m.isOwner) {
        return m.reply('❌ *Owner Only!*')
    }

    const pluginName = (Array.isArray(args) ? args[0] : m.args?.[0])?.trim()

    if (!pluginName) {
        return m.reply(
            `📦 *ɢᴇᴛ ᴘʟᴜɢɪɴ*\n\n` +
            `> Dapatkan source code plugin\n\n` +
            `╭┈┈⬡「 📋 *ғᴏʀᴍᴀᴛ* 」\n` +
            `┃ .getplugin2 <nama>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*Contoh:*\n` +
            `> .getplugin2 menu\n` +
            `> .getplugin2 sticker\n` +
            `> .getplugin2 game/tebakgambar`
        )
    }

    const pluginsDir = path.join(process.cwd(), 'plugins')

    let pluginInfo = null

    if (pluginName.includes('/')) {
        const [category, file] = pluginName.split('/')
        const filePath = path.join(
            pluginsDir,
            category,
            file.endsWith('.js') ? file : `${file}.js`
        )
        if (fs.existsSync(filePath)) {
            pluginInfo = {
                path: filePath,
                category,
                file: file.endsWith('.js') ? file : `${file}.js`
            }
        }
    } else {
        pluginInfo = searchPlugin(pluginName, pluginsDir)
    }

    if (!pluginInfo) {
        const similar = getSimilarPlugins(pluginName, pluginsDir)
        let text = `❌ *ᴘʟᴜɢɪɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n`
        text += `> Plugin \`${pluginName}\` tidak ditemukan\n\n`

        if (similar.length > 0) {
            text += `*Mungkin maksud kamu:*\n`
            similar.forEach((s) => {
                text += `> - \`${s}\`\n`
            })
        }

        return m.reply(text)
    }

    const code = fs.readFileSync(pluginInfo.path)
    const codeStr = code.toString('utf-8')
    const meta = extractMeta(codeStr)

    // ===== Kalau kode > 10KB, kirim sebagai dokumen + caption tabel =====
    if (code.length > 10000) {
        try {
            let caption = `📦 *ɪɴꜰᴏ ᴘʟᴜɢɪɴ*\n\n`
            caption += `╭━━━━━━━━━━━━━━━━━━━━╮\n`
            caption += `┃ 📄 File      : ${pluginInfo.file}\n`
            caption += `┃ 📂 Category  : ${pluginInfo.category}\n`
            caption += `┃ 🔖 Nama      : ${meta.name || '-'}\n`
            caption += `┃ ⚡ Cooldown  : ${meta.cooldown || 0}s\n`
            caption += `┃ 🔋 Energi    : ${meta.energi || 0}\n`
            caption += `┃ 👑 Owner     : ${boolIcon(meta.owner)}\n`
            caption += `┃ 💎 Premium   : ${boolIcon(meta.premium)}\n`
            caption += `┃ 👥 Group     : ${boolIcon(meta.group)}\n`
            caption += `┃ 💬 Private   : ${boolIcon(meta.private)}\n`
            caption += `┃ 🟢 Aktif     : ${boolIcon(meta.enabled)}\n`
            caption += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`

            if (meta.aliases && meta.aliases.length > 0) {
                caption += `🔖 *Alias:* ${meta.aliases.map(a => `\`${a}\``).join(', ')}\n\n`
            }

            if (meta.description) {
                caption += `📝 *Deskripsi:*\n> ${meta.description}\n\n`
            }

            caption += `❓ *Kenapa Lewat Dokumen?*\n`
            caption += `> Baris kode terlalu panjang (>10KB), kalau pakai HTML card bisa berat.\n\n`
            caption += `> 🍙 Klik tombol di bawah buat copy code`

            await sock.sendMessage(m.chat, {
                document: code,
                fileName: pluginInfo.file,
                fileLength: 999999999,
                caption,
                interactiveButtons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🥠 Copy Code',
                            copy_code: codeStr
                        })
                    }
                ]
            }, { quoted: m })
        } catch (err) {
            console.log('[GetPlugin2] ERROR (dokumen branch):', err)
            await m.reply(`❌ *Gagal kirim dokumen*\n\n\`${err.message}\`\n\nCek log terminal buat detail lengkap.`)
        }
        return
    }

    // ===== Kode kecil/sedang: kirim sebagai HTML rich card =====
    try {
        const html = buildPluginHtml(pluginInfo, meta, codeStr, m.pushName)
        await sendHtmlRich(
            sock,
            m.chat,
            html,
            `Info Plugin: ${pluginInfo.file}`,
            `getplugin2_${Date.now()}`
        )
    } catch (err) {
        console.log('[GetPlugin2] HTML render ERROR:', err)
        await m.reply(
            `❌ *Gagal render HTML*\n\n` +
            `\`${err.message}\`\n\n` +
            `> Stack trace ada di log terminal, kirim ke Claude kalau butuh dianalisa lebih lanjut.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}