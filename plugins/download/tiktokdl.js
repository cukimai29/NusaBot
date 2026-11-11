const ttdown = require('../../src/scraper/tiktok')
const config = require('../../config')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const pluginConfig = {
    name: ['tiktok', 'tt', 'ttmp4'],
    alias: ['tiktokdl', 'ttdown'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.tiktok <url>',
    example: '.tiktok https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function formatNumber(num) {
    if (!num) return '0'
    const n = parseInt(num)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
}

async function handler(m, { sock }) {
  const url = m.text?.trim()

  if (!url) {
    return m.reply(
`╭─❀「 🎀 *Zero Two TikTok Downloader* 」
│
│ Hai darling~
│ Kirim link TikTok nya ya
│ nanti aku ambilin videonya 💗
│
│ Usage:
│ \`${m.prefix}tiktok <url>\`
│
╰────────────

Contoh:
${m.prefix}tiktok https://vt.tiktok.com/xxx`
    )
  }

  if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
    return m.reply(
`Hmm darling... 🤨

Itu bukan link TikTok.
Kasih aku link yang benar ya~`
    )
  }

  m.react('⏱️')

  try {
    const result = await ttdown(url)

    const caption =
`🎀 *Video berhasil diambil darling~*

\`\`\`${result.title}\`\`\`

👤 Creator : ${result.author.username || '-'}

Kalau butuh audio nya juga
tekan tombol di bawah ya 💗`

    const carivideotanpawm = result.downloads.find(d => d.type == 'hd')

    if (!carivideotanpawm) {
      m.reply(
`Ara ara darling~

Sepertinya itu bukan video
tapi slide foto dari TikTok 😖

Untuk sekarang aku cuma bisa
ambil audionya saja ya 💗`
      )

      // Kirim audio biasa (MP3)
      await sock.sendMessage(
        m.chat,
        {
          audio: { url: result.downloads.find(d => d.type == 'mp3').url },
          mimetype: 'audio/mpeg',
          ptt: false // biar jadi MP3 biasa, bukan voice note
        },
        { quoted: m }
      )
      return
    }

    // Kirim video dengan tombol interaktif (tanpa externalAdReply)
    await sock.sendMessage(
      m.chat,
      {
        video: { url: carivideotanpawm.url },
        mimetype: 'video/mp4',
        caption,
        footer: `© ${config.bot?.name}`,
        interactiveButtons: [
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '🎵 Ambil Audio',
              id: `${m.prefix}ttmp3 ${url}`
            })
          }
        ]
      },
      { quoted: m }
    )

    m.react('💗')

    setTimeout(() => {
      if (require('fs').existsSync(result.file)) {
        require('fs').unlinkSync(result.file)
      }
    }, 5000)

  } catch (err) {
    console.error('[TikTokDL] Error:', err)
    m.react('❌')
    m.reply(
`Maaf ya darling...

Sepertinya aku gagal mengambil
video TikTok itu 😔

Error:
${err.message}`
    )
  }
}

module.exports = {
    config: pluginConfig,
    handler
}