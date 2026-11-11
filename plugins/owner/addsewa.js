const { getDatabase } = require('../../src/lib/database')
const timeHelper = require('../../src/lib/timeHelper')

const pluginConfig = {
  name: 'addsewa',
  alias: ['sewaadd', 'tambahsewa'],
  category: 'owner',
  description: 'Whitelist grup untuk sewa bot',
  usage: '.addsewa <durasi / link durasi>',
  example: '.addsewa 10m / .addsewa link 1d',
  isOwner: true,
  cooldown: 5,
  isEnabled: true
}

// 🔥 PARSE DURATION (SUPPORT S M H D MM Y)
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d|mm|y)$/i)
  if (!match) return null

  const value = parseInt(match[1])
  const unit = match[2].toLowerCase()

  let ms = 0

  switch (unit) {
    case 's': ms = value * 1000; break
    case 'm': ms = value * 60 * 1000; break
    case 'h': ms = value * 60 * 60 * 1000; break
    case 'd': ms = value * 24 * 60 * 60 * 1000; break
    case 'mm': ms = value * 30 * 24 * 60 * 60 * 1000; break
    case 'y': ms = value * 365 * 24 * 60 * 60 * 1000; break
  }

  return Date.now() + ms
}

// 🎨 FORMAT BIAR CAKEP
function formatDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d|mm|y)$/i)
  if (!match) return str

  const value = parseInt(match[1])
  const unit = match[2].toLowerCase()

  const units = {
    s: 'Detik',
    m: 'Menit',
    h: 'Jam',
    d: 'Hari',
    mm: 'Bulan',
    y: 'Tahun'
  }

  return `${value} ${units[unit]}`
}

async function handler(m, { sock }) {
  const db = getDatabase()
  const args = m.args

  if (!db.db.data.sewa) db.db.data.sewa = { groups: {} }

  if (args.length < 1) {
    return m.reply(
`╭━━━〔 💎 ADD SEWA 〕━━━⬣
┃ Mode 1:
┃ .addsewa 10m
┃ (Group ini langsung)
┃
┃ Mode 2:
┃ .addsewa link 1d
┃ (Via invite link)
┃
┣━━━〔 ⏳ FORMAT 〕━━━⬣
┃ 10s = Detik
┃ 5m  = Menit
┃ 2h  = Jam
┃ 3d  = Hari
┃ 1mm = Bulan
┃ 1y  = Tahun
╰━━━━━━━━━━━━━━━━⬣`
    )
  }

  let link = null
  let durationStr = null
  let groupId, groupName, inviteCode

  // 🔥 MODE LINK
  if (args[0].includes('chat.whatsapp.com/')) {
    link = args[0]
    durationStr = args[1]

    if (!durationStr) {
      return m.reply('❌ Masukkan durasi juga 😤')
    }

    inviteCode = link.split('chat.whatsapp.com/')[1].split(/[?\s]/)[0]

    try {
      const metadata = await sock.groupGetInviteInfo(inviteCode)
      groupId = metadata.id
      groupName = metadata.subject || 'Unknown Group'

      await sock.groupAcceptInvite(inviteCode)
    } catch (e) {
      return m.reply('❌ Gagal join grup 😤')
    }

  } else {
    // 🔥 MODE GROUP SEKARANG
    durationStr = args[0]

    if (!m.isGroup) {
      return m.reply('❌ Mode ini cuma bisa di grup 😤')
    }

    const metadata = await sock.groupMetadata(m.chat)
    groupId = m.chat
    groupName = metadata.subject || 'Unknown Group'
  }

  const expiredAt = parseDuration(durationStr)
  if (!expiredAt) {
    return m.reply('❌ Format salah!\nContoh: 10s / 5m / 1h / 1d / 1mm / 1y')
  }

  m.react('⏳')

  try {
    db.db.data.sewa.groups[groupId] = {
      name: groupName,
      addedAt: Date.now(),
      expiredAt,
      inviteCode: inviteCode || null
    }

    db.db.write()

    const expiredStr = timeHelper.fromTimestamp(expiredAt, 'D MMMM YYYY HH:mm')
    const durationNice = formatDuration(durationStr)

    m.react('✅')

    await sock.sendMessage(m.chat, {
      text:
`╭━━━〔 💎 SEWA AKTIF 〕━━━⬣
┃ Hai darling 😏
┃
┃ Sewa berhasil diaktifkan 💗
┃
┣━━━〔 📊 DETAIL 〕━━━⬣
┃ 🏷️ Grup : ${groupName}
┃ ⏳ Durasi : ${durationNice}
┃ 📅 Expired : ${expiredStr}
┃
┣━━━〔 💬 NOTE 〕━━━⬣
┃ Jangan lupa perpanjang ya 😈
┃ aku gak mau pergi 💗
╰━━━━━━━━━━━━━━━━⬣`
    }, { quoted: m })

    // 🔥 AUTO OUT
    const timeLeft = expiredAt - Date.now()

    setTimeout(async () => {
      try {
        const data = db.db.data.sewa.groups[groupId]
        if (!data) return

        if (Date.now() >= data.expiredAt) {

          await sock.sendMessage(groupId, {
            text:
`╭━━━〔 💔 SEWA HABIS 〕━━━⬣
┃ Yah... waktunya selesai 😔
┃
┃ Aku harus pergi dulu ya 😢
┃
┃ Mau aku balik?
┃ Sewa lagi ya darling 😈
╰━━━━━━━━━━━━━━━━⬣`
          })

          await sock.groupLeave(groupId)
          delete db.db.data.sewa.groups[groupId]
          db.db.write()
        }

      } catch (err) {
        console.log('AUTO OUT ERROR:', err)
      }
    }, Math.max(timeLeft, 0))

  } catch (error) {
    m.react('❌')
    m.reply(`❌ ERROR\n${error.message}`)
  }
}

module.exports = {
  config: pluginConfig,
  handler
}