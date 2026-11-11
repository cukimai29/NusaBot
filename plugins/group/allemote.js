const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');
const { getParticipantJid, getParticipantJids } = require('../../src/lib/lidHelper');

const pluginConfig = {
    name: 'allemote',
    primaryName: 'allemote',
    command: 'allemote',
    alias: ['tagallmote', 'allemoji'],
    category: 'group',
    description: 'Tag semua member grup menggunakan variasi emoji acak yang estetik.',
    usage: '.allemote <pesan>',
    example: '.allemote Halo semuanya!',
    isGroup: true,
    isAdmin: true,
    cooldown: 15,
    isEnabled: true
};

const emojiList = ['✨', '😎', '👍🏻', '🗯️', '😑', '😖', '🎮', '🛠️', '💖', '🔥', '🌸', '⚡', '🎯', '🚀', '📌', '🧊'];

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
    const pesan = textArgs.replace(/^\.allemote\s*/i, '').trim() || 'Tag All Members with Emoji';

    try {
        const groupMeta = await sock.groupMetadata(chatId);
        const participants = groupMeta.participants || [];

        if (participants.length === 0) {
            await m.reply(`❌ *GAGAL*\n\n> Tidak ada member di grup ini.`);
            return
        }

        const mentions = getParticipantJids(participants);

        // Buat list member dengan tag asli (@JID) dan emoji acak
        const memberList = participants.map((p, i) => {
            const userJid = getParticipantJid(p);
            const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
            return `${i + 1}. ${randomEmoji} @${userJid.split('@')[0]}`;
        }).join('\n');

        const imageUrl = "https://cdn.phototourl.com/member/2026-07-30-e373c27d-4aea-4bd2-8357-62c9938f9211.jpg";
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

        m.react('✨');
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, 400));

        const pesanTeks = 
`✨ *ZERO TWO - TAG ALL EMOJI* ✨

> *Pesan:* ${pesan}

\`\`\`━━━ ${participants.length} ᴍᴇᴍʙᴇʀ ━━━\`\`\`
${memberList}`;

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
                    text: '✨ Powered by NusaBot • RzkyADS'
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔃 Tag Lagi',
                                id: `.allemote ${pesan}`
                            })
                        }
                    ]
                }),
                contextInfo: {
                    mentionedJid: mentions
                }
            })
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id });

    } catch (error) {
        await m.reply(`❌ *ERROR*\n\n> ${error.message}`);
    }
}

async function answerHandler(m, sock) {
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};
