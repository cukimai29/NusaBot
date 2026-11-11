const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'tahunbaru2027',
    primaryName: 'tahunbaru2027',
    command: 'tahunbaru2027',
    alias: ['newyear2027', 'tahunbaru'],
    category: 'general',
    description: 'Menghitung mundur waktu menuju Tahun Baru 2027 ala Zero Two',
    usage: '.tahunbaru2027',
    example: '.tahunbaru2027',
    isEnabled: true
};

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
    const chatId = m.chat;

    const targetDate = new Date('2027-01-01T00:00:00+07:00');
    const now = new Date();
    
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const imageUrl = "https://cdn.phototourl.com/member/2026-07-29-d7e9e19c-9055-4a95-9424-6d3b7bd2238e.jpg";

    let imageBuffer;
    try {
        imageBuffer = await getSafeImageBuffer(imageUrl);
    } catch (e) {
        await m.reply('❌ Gagal memuat gambar Tahun Baru!');
        return;
    }

    let mediaAttachment = null;
    try {
        mediaAttachment = await prepareWAMessageMedia(
            { image: imageBuffer },
            { upload: sock.waUploadToServer }
        );
    } catch (e) {}

    let countdownText = "";
    if (diffDays > 0) {
        countdownText = `Dalam *${diffDays} hari* lagi, kita akan menyambut Tahun Baru 2027! 🎉`;
    } else if (diffDays === 0) {
        countdownText = `Hari ini adalah hari pergantian tahun menuju Tahun Baru 2027! Selamat tahun baru! 🎆`;
    } else {
        countdownText = `Tahun Baru 2027 telah terlewat.`;
    }

    const pesanTeks = 
`🎆 *COUNTDOWN TAHUN BARU 2027*

"Darling... Zero Two sudah siap sedia menyambut lembaran tahun baru ini bersamamu!"

✨ *Info & Semangat Baru:*
Mari kita sambut awal yang baru dengan energi positif, resolusi hebat, dan senyuman bersama.

⏳ ${countdownText}

> 📅 *Target Tanggal:* 1 Januari 2027
> 💖 _"Let's make wonderful memories together, Darling!"_`;

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
                            display_text: '📋 Menu',
                            id: '.menu'
                        })
                    }
                ]
            }),
            contextInfo: {
                mentionedJid: [m.sender]
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