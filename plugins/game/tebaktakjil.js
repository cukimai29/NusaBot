const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'tebaktakjil',
    alias: ['ttakjil', 'takjil'],
    category: 'islamic',
    description: 'Tebak nama makanan/minuman takjil buka puasa',
    usage: '.tebaktakjil',
    example: '.tebaktakjil',
    isEnabled: true
};

const takjilDatabase = [
    { name: "Kolak Pisang", hint: "K_l_k P_s_ng", img: "https://cdn.phototourl.com/free/2026-07-29-a59b974c-f02f-4c6a-a714-ffda99f94eba.jpg" },
    { name: "Es Buah", hint: "Es B__h", img: "https://cdn.phototourl.com/free/2026-07-29-62d3063b-37b8-481d-ac02-f8e18d6d3b22.jpg" },
    { name: "Biji Salak", hint: "B_j_ S_l_k", img: "https://cdn.phototourl.com/free/2026-07-29-4ff03022-19d4-49d2-ac86-edb1c6e7341b.jpg" },
    { name: "Es Teler", hint: "Es T_l_r", img: "https://cdn.phototourl.com/free/2026-07-29-51341d21-c8c5-4c8c-a4d6-b5de373c134d.jpg" },
    { name: "Kurma", hint: "K_rm_", img: "https://cdn.phototourl.com/free/2026-07-29-487050a1-b9fb-4c5e-af34-2ddecde3ca39.jpg" },
    { name: "Bubur Sumsum", hint: "B_b_r S_ms_m", img: "https://cdn.phototourl.com/free/2026-07-29-3974c27e-ecc4-447d-a31f-1a4611392a31.jpg" },
    { name: "Gorengan", hint: "G_r_ng_n", img: "https://cdn.phototourl.com/free/2026-07-29-36d6e5c8-3f7d-4abd-8bd3-f48b94b70461.jpg" },
    { name: "Es Cendol", hint: "Es C_nd_l", img: "https://cdn.phototourl.com/free/2026-07-29-9543a60d-c20a-437b-966d-55973b4684fe.jpg" },
    { name: "Es Doger", hint: "Es D_g_r", img: "https://cdn.phototourl.com/free/2026-07-29-9c46f110-d223-4bb4-b1f3-b1c2f347a75a.jpg" },
    { name: "Puding", hint: "P_d_ng", img: "https://cdn.phototourl.com/free/2026-07-29-84043b7d-3590-4dad-a496-9a57ddd2da63.jpg" }
];

const activeSessions = new Map();
let isListenerActive = false;

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

function setupGlobalListener(sock) {
    if (isListenerActive || !sock?.ev) return;
    isListenerActive = true;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (!m.message || m.key.fromMe) continue;
            
            const chatId = m.key.remoteJid;
            const session = activeSessions.get(chatId);
            if (!session) continue;

            const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
            const cleanText = text.trim();
            if (!cleanText) continue;

            const quotedMsgId = m.message.extendedTextMessage?.contextInfo?.stanzaId;
            const isReply = quotedMsgId === session.msgId;
            if (!isReply && !cleanText.startsWith('.')) continue;

            if (cleanText.toLowerCase() === 'nyerah') {
                clearTimeout(session.timer);
                activeSessions.delete(chatId);
                await sock.sendMessage(chatId, { text: `🏳️ *ᴍᴇɴʏᴇʀᴀʜ!*\n\n> Jawaban yang benar adalah: *${session.question.name}*` }, { quoted: m });
                continue;
            }

            if (cleanText.startsWith('.')) continue;

            session.attempts++;
            const senderJid = m.key.participant || m.participant || chatId;

            // CEK JAWABAN BENAR
            if (cleanText.toLowerCase() === session.question.name.toLowerCase()) {
                clearTimeout(session.timer);
                activeSessions.delete(chatId);

                let koinVal = 2000;
                try {
                    const { getDatabase } = require('../../src/lib/database');
                    const { addExpWithLevelCheck } = require('../../src/lib/levelHelper');
                    const db = getDatabase();
                    const user = db.getUser(senderJid);
                    
                    db.updateEnergi(senderJid, 5); 
                    db.updateKoin(senderJid, koinVal); 
                    
                    if (!user.rpg) user.rpg = {};
                    await addExpWithLevelCheck(sock, { chat: chatId, sender: senderJid, reply: (txt) => sock.sendMessage(chatId, { text: txt }, { quoted: m }) }, db, user, 2000); 
                    db.save();
                } catch (err) {}

                let winnerImageBuffer;
                try {
                    winnerImageBuffer = await getSafeImageBuffer("https://cdn.phototourl.com/member/2026-07-29-28f346f2-2820-473a-b2f2-640d51cbec07.jpg");
                } catch (e) {
                    winnerImageBuffer = await getSafeImageBuffer(session.question.img);
                }

                let winnerMedia = null;
                try {
                    winnerMedia = await prepareWAMessageMedia(
                        { image: winnerImageBuffer },
                        { upload: sock.waUploadToServer }
                    );
                } catch (e) {}

                const winnerText = 
`🏆 WINNER!

🎉 *ʙᴇɴᴀʀ!*
🥳 *betul!*
👑 *benar*
🤖 *gg*
> Jawaban: *${session.question.name}*
> Pemenang: *@${senderJid.split('@')[0]}*
> Percobaan: *${session.attempts}x*

╭┈┈⬡「 🎁 *ʜᴀᴅɪᴀʜ* 」
┃ 📊 +5 Limit
┃ 💰 +${koinVal} Koin
┃ ⭐ +2000 EXP
╰┈┈┈┈┈┈┈┈⡡
🎉 Selamat @${senderJid.split('@')[0]}`;

                const interactiveWinMsg = generateWAMessageFromContent(chatId, {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '✨ PERMAINAN SELESAI',
                            hasMediaAttachment: !!winnerMedia,
                            ...(winnerMedia || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: winnerText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `🎮 NusaBot Game`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎮 Main Lagi',
                                        id: '.tebaktakjil'
                                    })
                                },
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
                            mentionedJid: [senderJid]
                        }
                    })
                }, { userJid: senderJid, quoted: m });

                await sock.relayMessage(chatId, interactiveWinMsg.message, { messageId: interactiveWinMsg.key.id });
            } 
            // CEK JAWABAN SALAH (Dengan Button 📋 Menu)
            else {
                let wrongImageBuffer;
                try {
                    wrongImageBuffer = await getSafeImageBuffer("https://cdn.phototourl.com/member/2026-07-29-28f346f2-2820-473a-b2f2-640d51cbec07.jpg");
                } catch (e) {
                    wrongImageBuffer = await getSafeImageBuffer(session.question.img);
                }

                let wrongMedia = null;
                try {
                    wrongMedia = await prepareWAMessageMedia(
                        { image: wrongImageBuffer },
                        { upload: sock.waUploadToServer }
                    );
                } catch (e) {}

                const wrongText = 
`❎ SALAH!
✖️ *salah!*
☢️ *SALAH!*
🚫 *TIDAK BENAR!*
🩲 *SALAH!*

> Jawaban: *${cleanText}*
> Pemenang: *-*
> Percobaan: *${session.attempts}x*

╭┈┈⬡「 🎁 *ʜᴀᴅɪᴀʜ* 」
┃ 📊 +5 Limit 
╰┈┈┈┈┈┈┈┈⡡
🎉 Coba lagi @${senderJid.split('@')[0]}`;

                const interactiveWrongMsg = generateWAMessageFromContent(chatId, {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '❌ JAWABAN SALAH',
                            hasMediaAttachment: !!wrongMedia,
                            ...(wrongMedia || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: wrongText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `🏳️ Takjil!`
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
                            mentionedJid: [senderJid]
                        }
                    })
                }, { userJid: senderJid, quoted: m });

                await sock.relayMessage(chatId, interactiveWrongMsg.message, { messageId: interactiveWrongMsg.key.id });
            }
        }
    });
}

async function handler(m, { sock }) {
    const chatId = m.chat;
    setupGlobalListener(sock);
    
    if (activeSessions.has(chatId)) {
        await m.reply(`⚠️ *ᴍᴀsɪʜ ᴀᴅᴀ ɢᴀᴍᴇ ᴛᴇʙᴀᴋ ᴛᴀᴋᴊɪʟ*\n\n> Silakan jawab pertanyaan yang sedang berlangsung atau ketik "nyerah".`);
        return;
    }
    
    const question = takjilDatabase[Math.floor(Math.random() * takjilDatabase.length)];
    
    let imageBuffer;
    try {
        imageBuffer = await getSafeImageBuffer(question.img);
    } catch (e) {
        await m.reply('❌ *ɢᴀɢᴀʟ ᴍᴇᴍᴜᴀᴛ ɢᴀᴍʙᴀʀ ᴛᴀᴋᴊɪʟ*');
        return;
    }

    let mediaAttachment = null;
    try {
        mediaAttachment = await prepareWAMessageMedia(
            { image: imageBuffer },
            { upload: sock.waUploadToServer }
        );
    } catch (e) {}

    const interactiveMsg = generateWAMessageFromContent(chatId, {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '🌙 TEBAK TAKJIL',
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: 
`> 🗯️ Makanan atau minuman takjil apa ini?

> 💡 Hint: *${question.hint}*
> ⏱️ Waktu: *60 detik*
> 🎁 Hadiah: *+5 Limit, +2000 EXP*

_Reply pesan ini dengan jawabanmu atau ketik "nyerah"_`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `🏳️ Takjil!`
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
    
    const startTime = Date.now();
    const timer = setTimeout(async () => {
        if (activeSessions.has(chatId)) {
            activeSessions.delete(chatId);
            await sock.sendMessage(chatId, { text: `⏱️ *ᴡᴀᴋᴛᴜ ʜᴀʙɪs!*\n\n> Jawaban yang benar: *${question.name}*` });
        }
    }, 60000);

    activeSessions.set(chatId, {
        question,
        msgId: interactiveMsg.key.id,
        timer,
        startTime,
        attempts: 0
    });
}

async function answerHandler(m, sock) {
    return false; 
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};