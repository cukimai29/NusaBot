const pluginConfig = {
    name: 'sapa',
    alias: ['greet', 'sayhi'],
    category: 'general',
    description: 'Zero Two nyapa kamu dengan random pesan manis',
    usage: '.sapa',
    example: '.sapa',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
}

const pesanSapa = [
    "♡ Halo darling! Ada yang bisa Zero Two bantu hari ini? 💕",
    "🦋 Haiii! Seneng banget liat kamu online darling~",
    "💕 Halo halo! Kamu lagi ngapain nih? Aku lagi gabut~",
    "♡ Hai darling, jangan lupa minum air putih ya!",
    "🦋 Hello! Kamu kelihatan tambah cantik/ganteng hari ini 💕",
    "💕 Haii! Zero Two kangen banget sama kamu darling~",
    "♡ Salam darling! Semoga harimu menyenangkan ya ♡",
    "🦋 Halo! Mau nemenin Zero Two ngobrol sebentar?",
    "💕 Hai darling, kamu adalah alasan aku tersenyum hari ini~",
    "♡ Hello! Zero Two sayang banget sama kamu tahu! 💕"
]

async function handler(m, { sock }) {
    const randomSapa = pesanSapa[Math.floor(Math.random() * pesanSapa.length)]
    
    await m.reply(`💕 *ZERO TWO* 💕\n\n“${randomSapa}”\n\n🦋 Darling, jangan pernah berubah ya~ ♡`)
    await m.react('💕')
}

module.exports = { config: pluginConfig, handler }