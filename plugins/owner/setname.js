const { getConfig } = require('../../config.js');
const config = getConfig();

const pluginConfig = {
    name: 'setname',
    alias: ['gantinama', 'ubahnamasaya', 'setnamauser'],
    category: 'owner',
    description: 'Mengubah nama profil WhatsApp bot (nama user, bukan nama bot)',
    usage: '.setname <nama baru>',
    example: '.setname NusaBot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const args = m.args || [];
        const newName = args.join(' ').trim();

        if (!newName) {
            return m.reply(
`💗 *SET NAMA USER WHATSAPP*

❌ Masukkan nama baru sayang~

📌 Format:
.setname <nama baru>

📌 Contoh:
.setname NusaBot

📌 Nama saat ini:
*${config.bot?.name || 'Tidak diketahui'}*

💡 Nama ini akan terlihat di semua chat WhatsApp!`
            );
        }

        if (newName.length > 25) {
            return m.reply(
`❌ *Nama terlalu panjang!*

Maksimal 25 karakter ya sayang~
Nama kamu: *${newName}* (${newName.length} karakter)

💗 *NusaBot*`
            );
        }

        await m.reply(
`💗 *MENGUBAH NAMA USER...*

Nama lama: *${config.bot?.name || 'Tidak diketahui'}*
Nama baru: *${newName}*

Tunggu sebentar sayang~ 🕐`
        );

        // Ubah nama profil WhatsApp (bukan nama bot, tapi nama user akun WhatsApp)
        try {
            await sock.updateProfileName(newName);
        } catch (err) {
            console.error('[SetName] Gagal update nama:', err);
            return m.reply(
`❌ *Gagal mengubah nama!*

> ${err.message}

Pastikan bot memiliki izin untuk mengubah profil WhatsApp.`
            );
        }

        // Update config (opsional, untuk menyimpan nama baru)
        try {
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(process.cwd(), 'config.js');
            let configContent = fs.readFileSync(configPath, 'utf-8');
            
            const botNameRegex = /bot\.name\s*:\s*['"`]([^'"`]*)['"`]/;
            const match = configContent.match(botNameRegex);
            
            if (match) {
                configContent = configContent.replace(
                    botNameRegex,
                    `bot.name: '${newName}'`
                );
                fs.writeFileSync(configPath, configContent, 'utf-8');
                config.bot.name = newName;
            }
        } catch (err) {
            console.log('[SetName] Gagal update config:', err.message);
        }

        await m.reply(
`✅ *BERHASIL!* 💗

✅ Nama user WhatsApp berhasil diubah menjadi:
*${newName}*

💡 Nama akan langsung terlihat di semua chat WhatsApp!

🦋 *NusaBot* sayang kamu~ 💕`
        );

        await m.react('💗');

    } catch (err) {
        console.error('[SETNAME ERROR]', err);
        await m.reply(
`❌ *ERROR*

> ${err.message}

Coba lagi ya sayang~ 💗`
        );
        await m.react('❌');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};