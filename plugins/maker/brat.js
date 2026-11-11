const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'brat',
    primaryName: 'brat',
    command: 'brat',
    alias: ['buatbrat', 'bratmenu'],
    category: 'maker',
    description: 'Pilih berbagai varian stiker/gambar Brat sesuai keinginanmu.',
    usage: '.brat <teks>',
    example: '.brat test',
    cooldown: 3,
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
    const textArgs = m.text || '';
    
    // Ambil teks setelah perintah .brat
    let query = textArgs.replace(/^\.brat\s*/i, '').trim();
    if (!query) {
        query = 'test';
    }

    const imageUrl = "https://cdn.phototourl.com/member/2026-07-30-60f33cd0-a52d-4711-875f-f6442e5047ef.jpg";

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

    m.react('💞');
    await sock.sendPresenceUpdate('composing', chatId);
    await new Promise(r => setTimeout(r, 300));

    const pesanTeks = 
`💞 *BRAT GENERATOR* 💞

"Darling, kamu mau membuat Brat untuk teks: *${query}*? 

Silakan klik tombol di bawah untuk memilih varian Brat yang kamu inginkan!"`;

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
                text: '✨ Pilih varian di bawah'
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 𝗣𝗜𝗟𝗜𝗛 𝗩𝗔𝗥𝗜𝗔𝗡 𝗕𝗥𝗔𝗧',
                            sections: [
                                {
                                    title: `TARGET TEKS: "${query}"`,
                                    rows: [
                                        { title: 'Brat Putih', description: `Kirim .bratputih ${query}`, id: `.bratputih ${query}` },
                                        { title: 'Brat Anime', description: `Kirim .bratanime ${query}`, id: `.bratanime ${query}` },
                                        { title: 'Brat Bahlil', description: `Kirim .bratbahlil ${query}`, id: `.bratbahlil ${query}` },
                                        { title: 'Brat Cewek', description: `Kirim .bratcewek ${query}`, id: `.bratcewek ${query}` },
                                        { title: 'Brat Filter', description: `Kirim .bratfilter ${query}`, id: `.bratfilter ${query}` },
                                        { title: 'Brat Gura', description: `Kirim .bratgura ${query}`, id: `.bratgura ${query}` },
                                        { title: 'Brat HD', description: `Kirim .brathd ${query}`, id: `.brathd ${query}` },
                                        { title: 'Brat Squidward', description: `Kirim .bratsquidward ${query}`, id: `.bratsquidward ${query}` },
                                        { title: 'Brat Vermeil', description: `Kirim .bratvermeil ${query}`, id: `.bratvermeil ${query}` },
                                        { title: 'Brat Vid', description: `Kirim .bratvid ${query}`, id: `.bratvid ${query}` },
                                        { title: 'Brat Vid 2', description: `Kirim .bratvid2 ${query}`, id: `.bratvid2 ${query}` },
                                        { title: 'Brat White', description: `Kirim .bratwhite ${query}`, id: `.bratwhite ${query}` }
                                    ]
                                }
                            ]
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