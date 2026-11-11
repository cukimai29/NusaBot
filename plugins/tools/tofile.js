const pluginConfig = {
    name: 'tofile',
    alias: ['tofile', 'txt'],
    category: 'tools',
    description: 'Mengubah teks menjadi file TXT',
    usage: '.tofile <teks>',
    example: '.tofile Halo dunia!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = (m.text || '').trim()

    if (!text) {
        return m.reply(
`❌ *Teks tidak boleh kosong!*

Contoh:
*.tofile Halo dunia!*

Atau teks panjang:
*.tofile Ini adalah isi file TXT saya.*`
        )
    }

    try {
        await m.react('⏳')

        const buffer = Buffer.from(text, 'utf-8')

        await sock.sendMessage(
            m.chat,
            {
                document: buffer,
                mimetype: 'text/plain',
                fileName: 'tofile.txt',
                caption: '📄 *Berhasil mengubah teks menjadi file!*'
            },
            {
                quoted: m
            }
        )

        await m.react('✅')

    } catch (error) {
        console.error('[TOFILE]', error)

        await m.react('❌')
        return m.reply('❌ Gagal membuat file TXT.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}