const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'qrisdynamic',
    alias: ['qrisdyn', 'qrisdynamic'],
    category: 'payment',
    description: 'Mengubah QRIS All Payment menjadi QRIS Dynamic',
    usage: '.qrisdynamic <nominal>',
    example: '.qrisdynamic 5000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = (m.text || '').trim()

    // =========================
    // CEK NOMINAL
    // =========================

    if (!text || !/^\d+$/.test(text)) {
        return m.reply(
`❌ *FORMAT SALAH*

Cara penggunaan:

📷 *Foto langsung*
Kirim foto QRIS dengan caption:
*.qrisdynamic 5000*

↩️ *Reply foto*
Reply foto QRIS lalu ketik:
*.qrisdynamic 5000*`
        )
    }

    const nominal = Number(text)

    if (nominal <= 0) {
        return m.reply('❌ Nominal harus lebih dari Rp0.')
    }

    // =========================
    // CARI FOTO
    // =========================

    let target = null

    // Foto langsung + caption
    if (m.message?.imageMessage) {
        target = m
    }

    // Reply foto
    if (!target && m.quoted) {
        const mime =
            m.quoted.mimetype ||
            m.quoted.msg?.mimetype ||
            ''

        if (mime.startsWith('image/')) {
            target = m.quoted
        }
    }

    // =========================
    // FOTO TIDAK ADA
    // =========================

    if (!target) {
        return m.reply(
`❌ *FOTO QRIS TIDAK DITEMUKAN*

Kamu bisa menggunakan 2 cara:

📷 *Cara 1*
Kirim foto QRIS langsung dengan caption:
*.qrisdynamic 5000*

↩️ *Cara 2*
Reply foto QRIS lalu ketik:
*.qrisdynamic 5000*`
        )
    }

    try {
        await m.react('⏳')

        // =========================
        // DOWNLOAD FOTO
        // =========================

        const imageBuffer = await target.download()

        if (!imageBuffer) {
            throw new Error('Gagal download foto QRIS')
        }

        // =========================
        // FORM DATA
        // Sesuai CURL API
        // =========================

        const form = new FormData()

        form.append('nominal', String(nominal))

        form.append('file', imageBuffer, {
            filename: 'qris.jpg',
            contentType: 'image/jpeg'
        })

        // URL dikosongkan sesuai CURL
        form.append('url', '')

        // =========================
        // REQUEST API
        // =========================

        const response = await axios.post(
            'https://api.nexray.eu.cc/payment/qris',
            form,
            {
                headers: {
                    ...form.getHeaders()
                },
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        )

        const contentType =
            response.headers['content-type'] || ''

        // =========================
        // JIKA RESPONSE GAMBAR
        // =========================

        if (contentType.includes('image')) {
            await sock.sendMessage(
                m.chat,
                {
                    image: Buffer.from(response.data),
                    caption:
`✅ *QRIS DYNAMIC BERHASIL*

━━━━━━━━━━━━━━━━━━
💰 Nominal
Rp${nominal.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━

📱 Silakan scan QRIS di atas.`
                },
                {
                    quoted: m
                }
            )

            await m.react('✅')
            return
        }

        // =========================
        // JIKA RESPONSE JSON
        // =========================

        let result

        try {
            result = JSON.parse(
                Buffer.from(response.data).toString()
            )
        } catch {
            throw new Error(
                'Response API tidak dikenali'
            )
        }

        const qrisUrl =
            result.url ||
            result.qris ||
            result.image ||
            result.qris_url ||
            result.data?.url ||
            result.data?.qris ||
            result.data?.image ||
            result.data?.qris_url

        if (!qrisUrl) {
            throw new Error(
                result.message ||
                result.msg ||
                'QRIS hasil API tidak ditemukan'
            )
        }

        // =========================
        // KIRIM HASIL
        // =========================

        await sock.sendMessage(
            m.chat,
            {
                image: {
                    url: qrisUrl
                },
                caption:
`✅ *QRIS DYNAMIC BERHASIL*

━━━━━━━━━━━━━━━━━━
💰 Nominal
Rp${nominal.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━

📱 Silakan scan QRIS di atas.`
            },
            {
                quoted: m
            }
        )

        await m.react('✅')

    } catch (error) {
        console.error(
            '[QRIS DYNAMIC ERROR]',
            error.response?.data || error.message || error
        )

        await m.react('❌')

        return m.reply(
`❌ *GAGAL MEMBUAT QRIS DYNAMIC*

Nominal:
*Rp${nominal.toLocaleString('id-ID')}*

Kemungkinan:
• Foto QRIS tidak valid
• API sedang error
• Koneksi API bermasalah
• Response API tidak sesuai

Silakan coba lagi.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}