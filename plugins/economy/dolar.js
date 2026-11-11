const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'dolar',
    alias: ['usd', 'kurs', 'rupiah', 'converter', 'matauang'],
    category: 'economy',
    description: 'Konversi mata uang Rupiah ke Dolar / sebaliknya',
    usage: '.dolar <nominal> <rp/usd>',
    example: '.dolar 100000 rp\n.dolar 50 usd',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// API kurs (gratis, no API key)
const API_URL = 'https://api.exchangerate-api.com/v4/latest/IDR'

async function getExchangeRate() {
    try {
        const response = await axios.get(API_URL, { timeout: 10000 })
        return response.data.rates.USD
    } catch (err) {
        console.error('[Dolar] Error get rate:', err.message)
        return null
    }
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka)
}

function formatDollar(angka) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(angka)
}

async function handler(m, { sock }) {
    const args = m.args || []
    let nominal = parseFloat(args[0])
    const jenis = args[1]?.toLowerCase()
    
    // Cek format input
    if (!nominal || isNaN(nominal) || nominal <= 0) {
        return m.reply(
            `💵 *ᴋᴏɴᴠᴇʀꜱɪ ᴍᴀᴛᴀ ᴜᴀɴɢ* 💵\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃\n` +
            `┃   ${m.prefix}dolar <nominal> <rp/usd>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃\n` +
            `┃   ${m.prefix}dolar 100000 rp\n` +
            `┃   ${m.prefix}dolar 50 usd\n` +
            `┃   ${m.prefix}dolar 1000 idr\n` +
            `┃\n` +
            `┃ ✦ *Keterangan*\n` +
            `┃   rp / idr → Rupiah ke Dolar\n` +
            `┃   usd / dolar → Dolar ke Rupiah\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Mau konversi uang berapa darling~?\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
    }
    
    // Validasi jenis mata uang
    const isRupiah = jenis === 'rp' || jenis === 'idr'
    const isDolar = jenis === 'usd' || jenis === 'dolar'
    
    if (!isRupiah && !isDolar) {
        return m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Jenis mata uang tidak valid darling~\n` +
            `> Gunakan *rp* atau *usd*\n\n` +
            `> Contoh: ${m.prefix}dolar 100000 rp`
        )
    }
    
    m.react('💵')
    await m.reply(`⏳ *ᴍᴇɴɢʜɪᴛᴜɴɢ ᴋᴜʀꜱ...*\n\n💗 *Zero Two:* Tunggu sebentar darling~ 🧮`)
    
    try {
        const kurs = await getExchangeRate()
        
        if (!kurs) {
            m.react('💔')
            return m.reply(
                `💔 *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal mengambil kurs dolar saat ini.\n` +
                `> Coba lagi nanti darling~ 🥺`
            )
        }
        
        let hasil
        let hasilFormatted
        let asal
        let tujuan
        
        if (isRupiah) {
            // Rupiah ke Dolar
            hasil = nominal / kurs
            hasilFormatted = formatDollar(hasil)
            asal = formatRupiah(nominal)
            tujuan = hasilFormatted
        } else {
            // Dolar ke Rupiah
            hasil = nominal * kurs
            hasilFormatted = formatRupiah(hasil)
            asal = formatDollar(nominal)
            tujuan = hasilFormatted
        }
        
        const tanggal = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
        
        await m.reply(
            `💵 *ᴋᴏɴᴠᴇʀꜱɪ ᴍᴀᴛᴀ ᴜᴀɴɢ* 💵\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ 💰 *ɴᴏᴍɪɴᴀʟ*:\n` +
            `┃    ${asal}\n` +
            `┃\n` +
            `┃ 💱 *ʜᴀꜱɪʟ ᴋᴏɴᴠᴇʀꜱɪ*:\n` +
            `┃    ${tujuan}\n` +
            `┃\n` +
            `┃ 📊 *ᴋᴜʀꜱ ꜱᴀᴀᴛ ɪɴɪ*:\n` +
            `┃    1 USD = Rp ${kurs.toLocaleString('id-ID')}\n` +
            `┃\n` +
            `┃ 📅 *ᴛᴀɴɢɢᴀʟ*: ${tanggal}\n` +
            `┃\n` +
            `┃ 💗 *Zero Two:* Ini hasilnya darling~ 🤑\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        )
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Dolar] Error:', err)
        m.react('💔')
        return m.reply(
            `💔 *ᴇʀʀᴏʀ*\n\n` +
            `> ${err.message}\n\n` +
            `> Coba lagi ya darling~ 🥺`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}