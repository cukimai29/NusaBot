const pluginConfig = {
    name: 'nomorbot',
    alias: ['botnumber', 'nomor'],
    category: 'info',
    description: 'Menampilkan nomor WhatsApp bot',
    usage: '.nomorbot',
    example: '.nomorbot',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function getBotNumber(sock) {
    const jid =
        sock.user?.id ||
        sock.user?.jid ||
        ''

    return String(jid)
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '')
}

async function handler(m, { sock }) {
    try {
        const nomorBot = getBotNumber(sock)

        if (!nomorBot) {
            return m.reply('❌ Nomor bot tidak dapat ditemukan.')
        }

        const user =
            m.pushName ||
            'Darling'

        const text =
`╭━━━〔 🤖 *ZERO AI* 〕━━━╮
┃
┃ 👋 Hai, *${user}*!
┃
┃ Mau menyimpan nomor bot?
┃ Jangan sampai kehilangan akses
┃ ke *ZERO AI* ya 😎
┃
┃ 📱 *Nomor Bot*
┃ \`${nomorBot}\`
┃
┃ 💬 Silakan simpan nomor ini
┃ agar kamu lebih mudah menghubungi
┃ ZERO AI kapan saja.
┃
┃ ✨ *ZERO AI — Your AI Assistant*
┃
╰━━━━━━━━━━━━━━━━━━━━╯`

        await m.reply(text)

    } catch (error) {
        console.error('[NomorBot]', error)
        await m.reply('❌ Gagal mengambil nomor bot.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}