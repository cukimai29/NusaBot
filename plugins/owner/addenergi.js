const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');
const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'addenergi',
    primaryName: 'addenergi',
    command: 'addenergi',
    alias: ['tambahenergi', 'giveenergi', 'addenergy'],
    category: 'owner',
    description: 'Tambah energi user secara real-time dengan verifikasi status asli',
    usage: '.addenergi <jumlah> @user',
    example: '.addenergi 100 @user',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
};

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender;
    if (m.mentionedJid?.length) return m.mentionedJid[0];
    return null;
}

async function getSafeImageBuffer(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Gagal fetch');
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (err) {
        const fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
        const resFallback = await fetch(fallbackUrl);
        const bufferFallback = await resFallback.arrayBuffer();
        return Buffer.from(bufferFallback);
    }
}

async function handler(m, { sock }) {
    const db = getDatabase();
    const args = m.args || [];
    const textFull = m.text || '';

    let amount = 0;
    let isUnlimited = false;

    if (args[0] && !isNaN(args[0])) {
        amount = parseInt(args[0]);
    }

    if (textFull.toLowerCase().includes('--unlimited') || textFull.toLowerCase().includes('--unli')) {
        isUnlimited = true;
    }

    let targetJid = extractTarget(m) || m.sender;

    if (!isUnlimited && amount <= 0) {
        m.react('⚠️');
        return m.reply(
`╭━━━〔 ⚠️ 𝙕𝙚𝙧𝙤 𝙏𝙬𝙤 〕━━━⬣
┃ Input Tidak Valid!
┃
┃ ➤ Gunakan jumlah > 0
┃ ➤ Contoh: .addenergi 100 @user
╰━━━━━━━━━━━━━━━━━━⬣`
        );
    }

    const user = db.getUser(targetJid) || db.setUser(targetJid);
    const chatId = m.chat;

    const imageUrl = "https://cdn.phototourl.com/member/2026-07-29-64ba2761-eb9d-4379-9f49-60f85d71fe55.jpg";

    let imageBuffer;
    try {
        imageBuffer = await getSafeImageBuffer(imageUrl);
    } catch (e) {
        imageBuffer = null;
    }

    let mediaAttachment = null;
    if (imageBuffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            );
        } catch (e) {}
    }

    m.react('💖');
    await sock.sendPresenceUpdate('composing', chatId);
    await new Promise(r => setTimeout(r, 500));

    let pesanTeks = "";
    let statusAction = "Berhasil";

    try {
        // Cek apakah user saat ini sedang memiliki energi unlimited di database
        const currentEnergy = user.energi !== undefined ? user.energi : 0;

        if (isUnlimited) {
            db.setUser(targetJid, { energi: -1 });
            const totalEnergyFormatted = formatNumber(-1);

            pesanTeks = 
`💞 *ZERO TWO - ENERGY* 💕

"Energi tambahan sudah dikirimkan khusus untukmu, Darling!"

👤 *USER :* @${targetJid.split('@')[0]}
⚡ *ADDED ::* ∞ Unlimited
📊 *TOTAL :* ${totalEnergyFormatted}
✦ *STATUS :* ${statusAction}`;

        } else if (currentEnergy === -1) {
            // Jika user aslinya sudah unlimited, jangan biarkan tertimpa angka biasa kecuali pakai --unlimited
            const totalEnergyFormatted = formatNumber(-1);

            pesanTeks = 
`💞 *ZERO TWO - ENERGY* 💕

"Darling, energi kamu sudah tak terbatas (Unlimited), jadi tidak bisa ditambah dengan angka biasa!"

👤 *USER :* @${targetJid.split('@')[0]}
⚡ *ADDED ::* 0
📊 *TOTAL :* ${totalEnergyFormatted}
✦ *STATUS :* ${statusAction}`;

        } else {
            // Penambahan normal secara real-time
            const newEnergi = db.updateEnergi(targetJid, amount);
            const totalEnergyFormatted = formatNumber(newEnergi);

            pesanTeks = 
`💞 *ZERO TWO - ENERGY* 💕

"Energi tambahan sudah dikirimkan khusus untukmu, Darling!"

👤 *USER :* @${targetJid.split('@')[0]}
⚡ *ADDED ::* +${formatNumber(amount)}
📊 *TOTAL :* ${totalEnergyFormatted}
✦ *STATUS :* ${statusAction}`;
        }
    } catch (err) {
        statusAction = "Gagal";
        pesanTeks = 
`💞 *ZERO TWO - ENERGY* 💕

"Maaf Darling, gagal memproses energi!"

👤 *USER :* @${targetJid.split('@')[0]}
⚡ *ADDED ::* 0
📊 *TOTAL :* Error
✦ *STATUS :* ${statusAction}`;
    }

    const interactiveMsg = generateWAMessageFromContent(chatId, {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '',
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: pesanTeks
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: ''
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🤖 bot',
                            id: '.bot'
                        })
                    }
                ]
            }),
            contextInfo: {
                mentionedJid: [targetJid]
            }
        })
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id });
}

async function answerHandler(m, sock) {
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};