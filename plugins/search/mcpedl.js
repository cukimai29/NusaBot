const config = {
    name: 'mcpedl',
    alias: ['mcpe', 'minecraftpe', 'mcpemod'],
    category: 'search',
    description: 'Cari dan download mod/texture/shader Minecraft PE',
    usage: '.mcpedl <query>',
    example: '.mcpedl shader',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const axios = require('axios')

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"
const DESCRIPTION_LIMIT = 500

const api = axios.create({
    baseURL: "https://api.mcpedl.com",
    timeout: 30000,
    validateStatus: () => true,
    headers: {
        "user-agent": UA,
        "accept": "application/json",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "origin": "https://mcpedl.com",
        "referer": "https://mcpedl.com/"
    }
})

function cleanText(value) {
    return String(value || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&quot;/g, "\"")
        .replace(/&#x27;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function limitText(value, limit = DESCRIPTION_LIMIT) {
    const text = cleanText(value)
    if (!limit || text.length <= limit) return text
    return text.slice(0, limit).trim() + "..."
}

async function searchAdvanced(query, page = 1) {
    const res = await api.get("/api/search/advanced", {
        params: {
            q: query,
            sort: "relevance",
            updated_at: "2y",
            page
        }
    })

    if (res.status < 200 || res.status >= 300) {
        return {
            ok: false,
            code: res.status,
            results: [],
            error: typeof res.data === "string" ? res.data.slice(0, 300) : res.data
        }
    }

    return {
        ok: true,
        code: res.status,
        meta: res.data?.meta || null,
        results: Array.isArray(res.data?.results) ? res.data.results : []
    }
}

async function getDetail(slug) {
    const res = await api.get(`/api/route/slug/${encodeURIComponent(slug)}`)

    if (res.status < 200 || res.status >= 300 || !res.data?.data) {
        return {
            ok: false,
            code: res.status,
            error: typeof res.data === "string" ? res.data.slice(0, 300) : res.data
        }
    }

    const d = res.data.data

    return {
        ok: true,
        code: res.status,
        data: {
            id: d.id ?? null,
            title: d.title ?? null,
            slug: d.slug ?? null,
            url: d.slug ? `https://mcpedl.com/${d.slug}/` : null,
            author: d.username || d.user?.display_name || d.user?.username || null,
            publish_date: d.publish_date ?? null,
            update_date: d.update_date ?? null,
            rating: d.average_rating ?? d.comments_rating?.average ?? null,
            short_description: limitText(d.short_description, 300),
            description: limitText(d.description, 500),
            image: d.image ?? null,
            categories: Array.isArray(d.categories) ? d.categories.map(x => x.name) : [],
            downloads: Array.isArray(d.downloads) ? d.downloads.map(x => ({
                name: x.display_name || x.name || null,
                url: x.url || x.download_url || x.file || null,
                type: x.type ?? null
            })).filter(x => x.url) : []
        }
    }
}

async function handler(m) {
    const args = m.text?.trim().split(/\s+/)
    const query = args[0]
    const page = parseInt(args[1]) || 1

    if (!query) {
        return m.reply(`🎮 *ᴍᴄᴘᴇᴅʟ ꜱᴇᴀʀᴄʜ*\n\n> Cari mod, texture, shader, map untuk Minecraft PE\n\n> Contoh:\n> .mcpedl shader\n> .mcpedl car 2\n\n📝 *Info:*\n> • Hasil dari mcpedl.com\n> • Download langsung dari MCPEDL`)
    }

    await m.reply(`⏳ *Mencari "${query}" di MCPEDL...*`)

    const search = await searchAdvanced(query, page)

    if (!search.ok || search.results.length === 0) {
        return m.reply(`❌ *TIDAK DITEMUKAN*\n\n> Tidak ada hasil untuk "${query}"\n> Coba dengan kata kunci lain, Darling~`)
    }

    let results = []
    for (const item of search.results.slice(0, 5)) {
        const slug = item.slug
        if (!slug) continue

        const detail = await getDetail(slug)
        if (detail.ok && detail.data) {
            results.push(detail.data)
        }
    }

    if (results.length === 0) {
        return m.reply(`❌ *GAGAL MENGAMBIL DETAIL*\n\n> Tidak bisa mengambil detail postingan, coba lagi nanti.`)
    }

    let txt = `🎮 *ʜᴀꜱɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ: ${query}*\n`
    txt += `📊 *Total ditemukan: ${search.results.length}*\n\n`

    for (let i = 0; i < results.length; i++) {
        const item = results[i]
        txt += `╭──〔 ${i+1} 〕───⬣\n`
        txt += `│  📛 *${item.title}*\n`
        if (item.author) txt += `│  👤 Author: ${item.author}\n`
        if (item.rating) txt += `│  ⭐ Rating: ${item.rating}/5\n`
        if (item.categories && item.categories.length) txt += `│  🏷️ Kategori: ${item.categories.slice(0, 3).join(', ')}\n`
        if (item.short_description) txt += `│  📝 ${item.short_description.slice(0, 150)}${item.short_description.length > 150 ? '...' : ''}\n`
        txt += `│\n`
        
        if (item.downloads && item.downloads.length) {
            txt += `│  📥 *Link Download:*\n`
            for (const dl of item.downloads.slice(0, 2)) {
                txt += `│     └ ${dl.name || 'Download'}: ${dl.url}\n`
            }
            if (item.downloads.length > 2) {
                txt += `│     └ ...dan ${item.downloads.length - 2} link lain\n`
            }
        }
        
        txt += `│\n│  🔗 ${item.url}\n`
        txt += `╰────────────────⬣\n\n`
    }

    if (search.meta?.total_pages > page) {
        txt += `> 📝 Ketik .mcpedl ${query} ${page + 1} untuk halaman berikutnya\n`
    }

    if (txt.length > 3000) {
        txt = txt.slice(0, 2950) + "\n\n> *[Konten dipotong karena terlalu panjang]*"
    }

    await m.reply(txt)
}

module.exports = {
    config,
    handler
}