const { existsSync, readFileSync } = require("node:fs")

const pluginConfig = {
    name: 'amfinder',
    alias: ['amfind', 'ttsearch', 'tiktokfind', 'ampreset'],
    category: 'download',
    description: 'Cari / download video & preset Alight Motion TikTok',
    usage: '.amfind <url> / .amfind --search <query>',
    example: '.amfind https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const HOST = "https://amfinder.web.id"
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"

async function getSessionConfig() {
    return { host: HOST, extraQuery: "bat=NaN&chg=0" }
}

function parseBlock(block, onEvent) {
    const ev = /(?:^|\n)event:[ \t]*(.+)/.exec(block)
    const data = /(?:^|\n)data:[ \t]?([\s\S]*)/.exec(block)?.[1]
    if (!ev) return
    const name = ev[1].trim()

    if (name === "log") {
        let msg = data ?? ""
        try { msg = JSON.parse(data) } catch {}
        onEvent("log", msg)
        return
    }

    if (name === "error") {
        let m = data ?? "unknown error"
        try { m = JSON.parse(data).message || m } catch {}
        throw new Error(m)
    }

    let parsed = data
    try { parsed = JSON.parse(data) } catch {}
    onEvent(name, parsed)
}

async function* streamSSE(endpoint, resRef) {
    const ac = new AbortController()
    const deadline = setTimeout(() => ac.abort(), 180000)

    let res
    try {
        res = await fetch(endpoint, {
            signal: ac.signal,
            headers: {
                "accept": "text/event-stream",
                "user-agent": UA,
                "referer": HOST + "/",
            },
        })
    } catch (e) {
        clearTimeout(deadline)
        throw new Error(`request gagal: ${e.message}`)
    }

    if (res.status !== 200) {
        const body = await res.text().catch(() => "")
        clearTimeout(deadline)
        throw new Error(`HTTP ${res.status} ${res.statusText}\n${body.slice(0, 2000)}`)
    }

    resRef.status = res.status
    const decoder = new TextDecoder()
    let buf = ""

    try {
        for await (const chunk of res.body) {
            buf += decoder.decode(chunk, { stream: true })
            let idx
            while ((idx = buf.indexOf("\n\n")) >= 0) {
                yield buf.slice(0, idx)
                buf = buf.slice(idx + 2)
            }
        }
        if (buf.trim()) yield buf
    } catch (e) {
        clearTimeout(deadline)
        if (e.name === "AbortError") throw new Error("timeout 180s tanpa result")
        throw e
    }
    clearTimeout(deadline)
}

async function runFind(cfg, videoUrl, onLog) {
    const endpoint = `${cfg.host}/api/find?url=${encodeURIComponent(videoUrl)}&${cfg.extraQuery}`
    const resRef = { status: 0 }
    let result = null

    for await (const block of streamSSE(endpoint, resRef)) {
        parseBlock(block, (name, payload) => {
            if (name === "result") result = payload
            else if (name === "log") onLog(payload)
        })
    }

    if (!result) throw new Error("koneksi ditutup sebelum event result")
    if (result.ok === false) throw new Error(`server: ${result.error || "unknown"}`)

    return result
}

async function runSearch(cfg, query, onLog) {
    const endpoint = `${cfg.host}/api/search?mode=pick&q=${encodeURIComponent(query)}`
    const resRef = { status: 0 }
    let items = null

    for await (const block of streamSSE(endpoint, resRef)) {
        parseBlock(block, (name, payload) => {
            if (name === "candidates") items = payload?.items ?? []
            else if (name === "log") onLog(payload)
        })
    }

    if (items === null) throw new Error("koneksi ditutup sebelum event candidates")
    return items
}

async function handler(m, { sock }) {
    const args = m.args || []

    if (!args.length) {
        return m.reply(
            `🎬 *ᴀᴍꜰɪɴᴅᴇʀ (Alight Motion)*\n\n` +
            `╭──〔 ꜰᴏʀᴍᴀᴛ 〕──⬣\n` +
            `│ 🔍 \`${m.prefix}amfind --search <query>\`\n` +
            `│ 🎬 \`${m.prefix}amfind <tiktok-url>\`\n` +
            `╰────────────────⬣\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}amfind --search preset keren\`\n` +
            `> \`${m.prefix}amfind https://vt.tiktok.com/xxx\``
        )
    }

    await m.react('🔍')
    const cfg = await getSessionConfig()
    const onLog = (msg) => console.log('[amfinder log]', msg)

    try {
        if (args[0] === '--search') {
            const query = args.slice(1).join(' ').trim()
            if (!query) {
                await m.react('❌')
                return m.reply(`❌ Query kosong!`)
            }

            await m.reply(`🔍 *Mencari preset:* \`${query}\`...`)
            const items = await runSearch(cfg, query, onLog)

            if (!items || items.length === 0) {
                await m.react('❌')
                return m.reply(`❌ Tidak ada hasil untuk "${query}"`)
            }

            let txt = `🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ ᴘʀᴇsᴇᴛ*\n\n`
            txt += `> Query: *${query}*\n`
            txt += `> Ditemukan: *${items.length}* video\n\n`

            items.slice(0, 10).forEach((item, i) => {
                txt += `*${i + 1}.* ${item.title || 'Tanpa judul'}\n`
                if (item.author) txt += `> 👤 ${item.author}\n`
                if (item.url) txt += `> 🔗 ${item.url}\n`
                txt += `\n`
            })

            txt += `> 💡 Salin URL video lalu kirim: \`${m.prefix}amfind <url>\``

            await m.react('✅')
            return m.reply(txt)
        }

        let videoUrl = args[0].trim()

        try {
            if (existsSync(videoUrl)) {
                videoUrl = readFileSync(videoUrl, "utf8").split(/\r?\n/).map(s => s.trim()).find(Boolean) || ""
            }
        } catch {}

        if (!videoUrl) {
            await m.react('❌')
            return m.reply(`❌ URL tidak ditemukan!`)
        }

        if (!/tiktok\.com|vt\.tiktok|douyin/i.test(videoUrl)) {
            await m.react('❌')
            return m.reply(`❌ URL bukan dari TikTok / Douyin!`)
        }

        await m.reply(`⏳ *Mengambil data preset...*`)
        const result = await runFind(cfg, videoUrl, onLog)

        await m.react('✅')

        // 🔥 BUILD OUTPUT OTOMATIS DARI JSON RESULT
        let txt = `🎬 *ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ꜰɪɴᴅᴇʀ*\n\n`
        
        // Cek jika result punya nested object (kadang API bungkus di .data)
        const data = result.data || result

        // Loop semua key yang ada di result
        for (const [key, value] of Object.entries(data)) {
            // Skip key yang gak penting / kosong
            if (value === null || value === undefined || value === "") continue
            if (key === "ok" || key === "status") continue

            // Format key biar rapi (camelCase / snake_case jadi Title Case)
            const label = key
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .replace(/\b\w/g, c => c.toUpperCase())
                .trim()

            // Deteksi jika value adalah URL (terutama alight motion / XML)
            if (typeof value === 'string' && /^https?:\/\//.test(value)) {
                txt += `> 🔗 *${label}:*\n> ${value}\n\n`
            } 
            // Deteksi jika value adalah object / array (biar gak nampilin [object Object])
            else if (typeof value === 'object') {
                txt += `> 📦 *${label}:* (${Array.isArray(value) ? value.length + ' items' : 'object'})\n\n`
            } 
            // Selain itu tampilin text biasa
            else {
                txt += `> 📌 *${label}:* ${value}\n\n`
            }
        }

        if (txt === `🎬 *ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ꜰɪɴᴅᴇʀ*\n\n`) {
            txt += `> ⚠️ Data kosong / struktur tidak dikenali.\n\n`
        }

        await m.reply(txt)

        // 🔥 Kalau ada link XML / download buat preset, kirim juga sebagai document
        const dlUrl = data.xml || data.download || data.file || data.am_link || data.preset_url
        if (dlUrl && typeof dlUrl === 'string' && dlUrl.startsWith('http')) {
            try {
                const name = (data.title || 'preset').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
                await sock.sendMessage(m.chat, {
                    document: { url: dlUrl },
                    fileName: `${name}.xml`,
                    mimetype: 'text/xml',
                    caption: `📄 *Preset XML*`
                }, { quoted: m })
            } catch (e) {
                console.log('[amfinder] Gagal kirim file preset:', e.message)
            }
        }

    } catch (error) {
        console.error('[amfinder] Error:', error)
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}