const fs = require('fs')
const path = require('path')
const axios = require('axios')
const imageAssets = require('../../assets/images/assets-img')

const cache = new Map()

async function loadImage(name) {
    if (cache.has(name)) return cache.get(name)

    const url = imageAssets[name]
    if (url && url.startsWith('http')) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            const buf = Buffer.from(res.data)
            cache.set(name, buf)
            return buf
        } catch (e) {
            console.error(`[AssetLoader] ❌ Gagal download ${name}:`, e.message)
        }
    }

    // Fallback lokal kalau URL mati
    try {
        const localPath = path.join(process.cwd(), 'assets', 'images', name)
        if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath)
            cache.set(name, buf)
            return buf
        }
    } catch (e) {}

    console.error(`[AssetLoader] ⚠️ ${name} tidak ditemukan (URL mati & lokal kosong)`)
    return null
}

module.exports = { loadImage }