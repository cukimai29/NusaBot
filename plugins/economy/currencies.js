const config = {
    name: 'currencies',
    alias: ['kurs', 'daftarmatauang', 'matauang'],
    category: 'economy',
    description: 'Lihat daftar mata uang dan kurs',
    usage: '.currencies',
    example: '.currencies',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const CURRENCIES = {
    usd: { name: 'US Dollar', symbol: '$', rate: 1, emoji: '💵', country: 'Amerika' },
    idr: { name: 'Rupiah', symbol: 'Rp', rate: 15700, emoji: '🇮🇩', country: 'Indonesia' },
    yen: { name: 'Yen', symbol: '¥', rate: 150, emoji: '💴', country: 'Jepang' },
    yuan: { name: 'Yuan', symbol: '¥', rate: 7.25, emoji: '🇨🇳', country: 'China' },
    euro: { name: 'Euro', symbol: '€', rate: 0.92, emoji: '💶', country: 'Eropa' },
    pound: { name: 'Pound Sterling', symbol: '£', rate: 0.79, emoji: '💷', country: 'Inggris' },
    riyal: { name: 'Riyal', symbol: '﷼', rate: 3.75, emoji: '🇸🇦', country: 'Arab Saudi' },
    won: { name: 'Won', symbol: '₩', rate: 1350, emoji: '🇰🇷', country: 'Korea' },
    rupee: { name: 'Rupee', symbol: '₹', rate: 83.5, emoji: '🇮🇳', country: 'India' },
    ringgit: { name: 'Ringgit', symbol: 'RM', rate: 4.45, emoji: '🇲🇾', country: 'Malaysia' },
    baht: { name: 'Baht', symbol: '฿', rate: 35.5, emoji: '🇹🇭', country: 'Thailand' },
    dong: { name: 'Dong', symbol: '₫', rate: 24500, emoji: '🇻🇳', country: 'Vietnam' },
    peso: { name: 'Peso', symbol: '₱', rate: 56, emoji: '🇵🇭', country: 'Filipina' },
    dollarAu: { name: 'Australian Dollar', symbol: 'A$', rate: 1.52, emoji: '🇦🇺', country: 'Australia' },
    dollarCa: { name: 'Canadian Dollar', symbol: 'C$', rate: 1.37, emoji: '🇨🇦', country: 'Kanada' },
    franc: { name: 'Swiss Franc', symbol: 'CHF', rate: 0.88, emoji: '🇨🇭', country: 'Swiss' },
    lira: { name: 'Lira', symbol: '₺', rate: 32, emoji: '🇹🇷', country: 'Turki' },
    real: { name: 'Real', symbol: 'R$', rate: 5.15, emoji: '🇧🇷', country: 'Brasil' }
}

async function handler(m) {
    const args = m.text?.trim()
    
    let txt = `💱 *ᴍᴜʟᴛɪᴄᴜʀʀᴇɴᴄʏ ᴇxᴄʜᴀɴɢᴇ*\n\n`
    txt += `╭┈┈⬡「 📊 *ᴋᴜʀꜱ ᴛᴇʀʜᴀᴅᴀᴘ ᴜꜱᴅ* 」\n`
    
    for (const [code, curr] of Object.entries(CURRENCIES)) {
        txt += `┃ ${curr.emoji} *${code.toUpperCase()}* ${curr.symbol}${curr.name}\n`
        txt += `┃    └ 1 USD = ${curr.rate.toLocaleString('id-ID')} ${curr.symbol}\n`
    }
    
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> 📝 Ketik *.bal* untuk lihat saldo\n> 📝 Ketik *.convert* untuk tukar uang`
    
    await m.reply(txt)
}

module.exports = { config, handler }