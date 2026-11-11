const config = require('../../config')

const ERROR_MESSAGES = [
    `💔 *ᴢᴇʀᴏ ᴛᴡᴏ:* Maaf Darling, command \`{prefix}{command}\` lagi error nih~`,
    `💕 *Zero Two:* Ups! Ada yang salah dengan \`{prefix}{command}\` {pushName}... coba lagi yaa 🥺`,
    `🌸 *Zero Two:* {pushName}, sepertinya {prefix}{command} sedang bermasalah. Tunggu sebentar ya darling~`,
    `🦋 *Zero Two:* Aduh {pushName}, command \`{prefix}{command}\` gak bisa dijalankan sekarang. Coba lagi nanti yaa 💕`,
    `💗 *Zero Two:* {pushName}, sistem lagi sibuk nih... command \`{prefix}{command}\` gagal diproses. Sabar ya darling~`,
    `✨ *Zero Two:* {pushName}~ command \`{prefix}{command}\` lagi error. Aku coba benerin yaa! 🥰`,
    `💖 *Zero Two:* Maaf banget {pushName}, {prefix}{command} belum bisa dipake sekarang. Doain biar cepet bener ya darling~`,
    `🎀 *Zero Two:* {pushName}, sepertinya ada gangguan teknis. Coba {prefix}{command} lagi nanti yaa 💕`
]

function te(prefix, command, pushName) {
    const msg = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]
        .replace(/\{prefix\}/g, prefix || '.')
        .replace(/\{command\}/g, command || '?')
        .replace(/\{pushName\}/g, pushName || 'Darling')
    
    return msg + `\n\n_Jika terus error, hubungi owner yaa~_`
}

module.exports = te