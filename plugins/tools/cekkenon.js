const { createCanvas } = require('@napi-rs/canvas');
const { getConfig } = require('../../config.js');
const config = getConfig();

// ========== KONFIGURASI SALURAN ==========
const CHANNEL_ID = "120363402057133599@newsletter";
const CHANNEL_NAME = "NusaBot";
// =========================================

const pluginConfig = {
    name: 'cekkenon',
    alias: ['ceknomor', 'cekhp', 'checknumber', 'cekno', 'noverif'],
    category: 'tools',
    description: 'Mengecek apakah nomor terdaftar di WhatsApp dan menampilkan foto profil',
    usage: '.cekkenon <nomor>',
    example: '.cekkenon 628123456789',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

// ========== FUNGSI CANVAS NO PROFILE ==========
async function createNoProfileImage(number, name) {
    const width = 400;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b9d');
    gradient.addColorStop(0.5, '#ff2a6d');
    gradient.addColorStop(1, '#ff1493');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.beginPath();
    ctx.arc(width/2, height/2 - 30, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 100px "Segoe UI", "Arial"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', width/2, height/2 - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Segoe UI", "Arial"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No Profile Picture', width/2, height/2 + 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '22px "Segoe UI", "Arial"';
    ctx.fillText(number || 'Unknown', width/2, height - 40);

    if (name && name !== 'Tidak diketahui') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '18px "Segoe UI", "Arial"';
        ctx.fillText(name, width/2, height - 75);
    }

    return canvas.toBuffer('image/png');
}

// ========== AMBIL FOTO PROFIL DENGAN BERBAGAI METODE ==========
async function getProfilePicture(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, 'image');
        if (url) return url;
    } catch (e) {
        // Abaikan jika diprivate
    }

    try {
        const url = await sock.getProfilePictureUrl(jid, 'image');
        if (url) return url;
    } catch (e) {
        // Abaikan
    }

    return null;
}

// ========== AMBIL NAMA/PUSHNAME MAKSIMAL ==========
async function getRealName(sock, jid, resultPushName) {
    // 1. Prioritaskan pushname dari hasil onWhatsApp jika tersedia
    if (resultPushName && resultPushName !== 'Tidak diketahui') {
        return resultPushName;
    }

    try {
        // 2. Cek dari database/store bot (jika nomor pernah berinteraksi)
        if (sock.store && sock.store.contacts && sock.store.contacts[jid]) {
            const contact = sock.store.contacts[jid];
            if (contact.name || contact.notify || contact.verifiedName) {
                return contact.name || contact.notify || contact.verifiedName;
            }
        }

        // 3. Cek apakah akun bisnis (WhatsApp Business)
        if (typeof sock.getBusinessProfile === 'function') {
            const business = await sock.getBusinessProfile(jid).catch(() => null);
            if (business && business.name) {
                return business.name;
            }
        }
    } catch (err) {
        // Abaikan error jaringan/store
    }

    return 'Tidak diketahui';
}

async function handler(m, { sock }) {
    try {
        const args = m.args || [];
        let nomor = args[0]?.trim();

        if (!nomor) {
            return m.reply(
`🌸 *CEK NOMOR WHATSAPP* 🌸

❌ Masukkan nomor yang ingin dicek sayang~

📌 Format:
.cekkenon <nomor>

📌 Contoh:
.cekkenon 628123456789

💗 *NusaBot* sayang kamu~ 💕`
            );
        }

        let cleanNumber = nomor.replace(/[^0-9]/g, '');
        
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        }
        
        if (!cleanNumber.startsWith('62') && !cleanNumber.startsWith('8')) {
            cleanNumber = '62' + cleanNumber;
        }

        if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            return m.reply(
`❌ *Nomor tidak valid!*
Panjang nomor harus antara 10-15 digit.`
            );
        }

        await m.reply(
`🌸 *MENCARI NOMOR...* 🌸

🔍 Sedang mengecek nomor: *${cleanNumber}*
⏳ Mohon tunggu sebentar sayang~`
        );

        const jid = cleanNumber + '@s.whatsapp.net';
        let isRegistered = false;
        let profilePictureUrl = null;
        let pushName = 'Tidak diketahui';

        try {
            const [result] = await sock.onWhatsApp(jid);
            
            if (result && result.exists) {
                isRegistered = true;
                
                // Ambil nama maksimal menggunakan fungsi getRealName
                pushName = await getRealName(sock, jid, result.pushname);
                
                // Ambil foto profil
                profilePictureUrl = await getProfilePicture(sock, jid);
            }
        } catch (err) {
            console.error('[CekKenon] Error:', err);
        }

        const formattedNumber = cleanNumber.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '$1-$2-$3-$4');

        let caption = '';

        if (isRegistered) {
            caption = 
`🌸 *CEK NOMOR WHATSAPP* 🌸

✅ *TERDAFTAR!*

📌 Detail Nomor:
> Nomor: ${formattedNumber}
> Nama / Username: ${pushName}
> JID: ${jid}
${profilePictureUrl ? '> Status: ✅ Memiliki Foto Profil' : '> Status: ❌ Tidak Ada Foto Profil'}

🟢 Nomor ini TERDAFTAR di WhatsApp!
💗 *NusaBot* sayang kamu~ 💕`;
        } else {
            caption = 
`🌸 *CEK NOMOR WHATSAPP* 🌸

❌ *TIDAK TERDAFTAR!*

📌 Detail Nomor:
> Nomor: ${formattedNumber}
> JID: ${jid}
> Status: ❌ Tidak Terdaftar

💗 *NusaBot* sayang kamu~ 💕`;
        }

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: CHANNEL_ID,
                newsletterName: CHANNEL_NAME,
                serverMessageId: 127,
            },
        };

        if (isRegistered && profilePictureUrl) {
            try {
                await sock.sendMessage(m.chat, {
                    image: { url: profilePictureUrl },
                    caption: caption,
                    contextInfo: contextInfo,
                }, { quoted: m });
                
                await m.react('✅');
                return;
            } catch (err) {
                console.error('[CekKenon] Gagal kirim foto profil:', err);
            }
        }

        let imageBuffer = await createNoProfileImage(formattedNumber, isRegistered ? pushName : 'Tidak Terdaftar');

        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: caption,
            contextInfo: contextInfo,
        }, { quoted: m });

        await m.react(isRegistered ? '✅' : '❌');

    } catch (err) {
        console.error('[CEKKENON ERROR]', err);
        await m.reply(`❌ *ERROR:* ${err.message}`);
        await m.react('❌');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};