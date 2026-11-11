const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'totalmenu',
    alias: ['menulist', 'listmenu', 'cekmenu', 'totalcase'],
    category: 'info',
    description: 'Menampilkan total menu (case) yang tersedia di bot Zero Two 💕',
    usage: '.totalmenu',
    example: '.totalmenu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        // ===== BACA FILE menu.js =====
        const menuPath = path.join(process.cwd(), 'plugins','main', 'menu.js')
        
        if (!fs.existsSync(menuPath)) {
            return m.reply('❌ *File menu.js tidak ditemukan!*')
        }

        const menuContent = fs.readFileSync(menuPath, 'utf8')

        // ===== HITUNG CASE =====
        const caseRegex = /case\s+(\d+)\s*:/g
        const matches = [...menuContent.matchAll(caseRegex)]
        
        const caseNumbers = matches.map(m => parseInt(m[1])).sort((a, b) => a - b)
        const totalCases = caseNumbers.length

        // ===== CEK DEFAULT =====
        const hasDefault = menuContent.includes('default:')
        const hasSwitch = menuContent.includes('switch')

        // ===== FORMAT PESAN =====
        let teks = `╭───〔 💕 *TOTAL MENU ZERO TWO* 💕 〕───⬣\n\n`
        teks += `│  🌸 *Total Menu (Case)* : *${totalCases}*\n`
        teks += `│  📋 *Daftar Case*      : \n`

        // Tampilkan case dalam baris
        const chunks = []
        for (let i = 0; i < caseNumbers.length; i += 10) {
            chunks.push(caseNumbers.slice(i, i + 10).join(', '))
        }
        chunks.forEach((chunk, idx) => {
            const prefix = idx === 0 ? '│  ' : '│  '
            teks += `${prefix}◈ ${chunk}\n`
        })

        teks += `│\n`
        teks += `│  ⚡ *Status Switch*   : ${hasSwitch ? '✅ Ada' : '❌ Tidak Ada'}\n`
        teks += `│  ⚡ *Default Case*    : ${hasDefault ? '✅ Ada' : '❌ Tidak Ada'}\n`
        teks += `│\n`
        teks += `│  💕 *“${totalCases} jenis menu untukmu, Darling~”* 💕\n`
        teks += `╰────────────────⬣\n\n`

        // ===== TAMPILKAN DETAIL CASE =====
        teks += `╭───〔 📋 *DETAIL CASE* 〕───⬣\n`
        
        const caseDetails = [
            { num: 1, name: 'Sweet Simple', desc: 'Menu sederhana' },
            { num: 2, name: 'Standard Love', desc: 'Tampilan standar' },
            { num: 3, name: 'Secret File', desc: 'Dokumen rahasia' },
            { num: 4, name: 'Memory Clip', desc: 'Video menu' },
            { num: 5, name: 'Choice of Heart', desc: 'Pilihan hati' },
            { num: 6, name: 'Premium Love', desc: 'Versi terbaik' },
            { num: 7, name: 'Swipe Me', desc: 'Carousel' },
            { num: 8, name: 'Soft Pink', desc: 'Minimalis' },
            { num: 9, name: 'Deep Connection', desc: 'Interaksi dalam' },
            { num: 10, name: 'Zero Mode', desc: 'Mode spesial' },
            { num: 11, name: 'Ultimate Bond', desc: 'Gabungan sempurna' },
            { num: 12, name: 'Sweet List', desc: 'List lengkap' },
            { num: 13, name: 'Location Menu', desc: 'Lokasi + top command' },
            { num: 14, name: 'Image List', desc: 'Gambar + list command' },
            { num: 15, name: 'Video Select', desc: 'Video + single select' },
            { num: 16, name: 'Video Location', desc: 'Video + lokasi cuaca' },
            { num: 17, name: 'Interactive Menu', desc: 'Menu interaktif' }
        ]

        // Filter case yang ada di file
        const availableCases = caseDetails.filter(c => caseNumbers.includes(c.num))
        
        for (const c of availableCases) {
            const isActive = c.num === caseNumbers[caseNumbers.length - 1] ? '⭐' : '◈'
            teks += `│  ${isActive} V${c.num} - ${c.name}\n`
            teks += `│     ${c.desc}\n`
        }

        teks += `╰────────────────⬣\n\n`

        // ===== CARA PAKAI =====
        teks += `╭───〔 🎀 *CARA PAKAI* 〕───⬣\n`
        teks += `│  📌 *Ganti Menu* : .setmenu v<angka>\n`
        teks += `│  📌 *Contoh*     : .setmenu v17\n`
        teks += `│  📌 *Cek Aktif*  : .menuvariant\n`
        teks += `╰────────────────⬣`

        // ===== KIRIM PESAN =====
        await m.reply(teks)

    } catch (error) {
        console.error('[TotalMenu Error]', error)
        await m.reply(`❌ *Error:* ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}