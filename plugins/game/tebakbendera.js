const { 
    getRandomItem, createSession, getSession, endSession, 
    checkAnswerAdvanced, getHint, hasActiveSession, setSessionTimer,
    getRemainingTime, formatRemainingTime, isSurrender, isReplyToGame,
    GAME_REWARD
} = require('../../src/lib/gameData');
const { getDatabase } = require('../../src/lib/database');
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper');
const { checkFastAnswer } = require('../../src/lib/contextHelper');
const { fetchBuffer } = require('../../src/lib/functions');
const { loadImage } = require('../../src/lib/assetLoader'); // 🔥 IMPORT HELPER
const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'tebakbendera',
    alias: ['tbendera', 'flag'],
    category: 'game',
    description: 'Tebak nama negara dari bendera',
    usage: '.tebakbendera',
    example: '.tebakbendera',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const processedMessages = new Set();

async function handler(m, { sock }) {
    const chatId = m.chat;
    
    if (hasActiveSession(chatId)) {
        const session = getSession(chatId);
        if (session && session.gameType === 'tebakbendera') {
            const remaining = getRemainingTime(chatId);
            let text = `⚠️ *ᴍᴀsɪʜ ᴀᴅᴀ ɢᴀᴍᴇ*\n\n`;
            text += `> 🏳️ Tebak bendera negara apa ini?\n`;
            text += `> 💡 Hint: *${getHint(session.question.name, 2)}*\n`;
            text += `> ⏱️ Sisa: *${formatRemainingTime(remaining)}*\n\n`;
            text += `_Reply pesan soal untuk menjawab atau ketik "nyerah"_`;
            await m.reply(text);
            return;
        }
    }
    
    const question = getRandomItem('tebakbendera2.json');
    if (!question) {
        await m.reply('❌ *ᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n> Data game tidak tersedia!');
        return;
    }
    
    let imageBuffer;
    try {
        imageBuffer = await fetchBuffer(question.img);
    } catch (e) {
        await m.reply('❌ *ɢᴀɢᴀʟ ᴍᴇᴍᴜᴀᴛ ɢᴀᴍʙᴀʀ*\n\n> Coba lagi nanti!');
        return;
    }

    let mediaAttachment = null;
    try {
        mediaAttachment = await prepareWAMessageMedia(
            { image: imageBuffer },
            { upload: sock.waUploadToServer }
        );
    } catch (e) {
        console.log('[TebakBendera] Gagal upload gambar:', e.message);
    }

    const interactiveMsg = generateWAMessageFromContent(chatId, {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '🏳️ TEBAK BENDERA',
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: 
`> 🌍 Bendera negara apa ini?

> 💡 Hint: *${getHint(question.name, 2)}*
> ⏱️ Waktu: *60 detik*
> 🎁 Hadiah: *+${GAME_REWARD.limit} Limit, +${GAME_REWARD.exp} EXP*

_Reply pesan ini dengan jawabanmu atau ketik "nyerah"_`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `🏳️ Tebak bendera!`
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
    
    const msgKey = {
        id: interactiveMsg.key.id,
        fromMe: true,
        remoteJid: chatId
    };
    
    createSession(chatId, 'tebakbendera', question, msgKey, 60000);
    
    setSessionTimer(chatId, async () => {
        let timeoutText = `⏱️ *ᴡᴀᴋᴛᴜ ʜᴀʙɪs!*\n\n`;
        timeoutText += `> Jawaban: *${question.name}*\n\n`;
        timeoutText += `_Tidak ada yang berhasil menjawab_`;
        await sock.sendMessage(chatId, { text: timeoutText });
    });
}

async function answerHandler(m, sock) {
    const chatId = m.chat;
    const session = getSession(chatId);
    
    if (!session || session.gameType !== 'tebakbendera') return false;
    
    const userAnswer = m.text || m.body || '';
    if (!userAnswer || userAnswer.startsWith('.')) return false;
    
    if (isSurrender(userAnswer)) {
        endSession(chatId);
        let text = `🏳️ *ᴍᴇɴʏᴇʀᴀʜ!*\n\n`;
        text += `> Jawaban: *${session.question.name}*\n\n`;
        text += `_@${m.sender.split('@')[0]} menyerah_`;
        await m.reply(text, { mentions: [m.sender] });
        return true;
    }
    
    if (!isReplyToGame(m, session)) {
        return false;
    }

    const msgId = m.key.id;
    if (processedMessages.has(msgId)) {
        return false;
    }
    processedMessages.add(msgId);
    setTimeout(() => processedMessages.delete(msgId), 3000);
    
    session.attempts++;
    
    const result = checkAnswerAdvanced(session.question.name, userAnswer);
    
    if (result.status === 'correct') {
        endSession(chatId);
        
        const db = getDatabase();
        const user = db.getUser(m.sender);
        
        let totalLimit = GAME_REWARD.limit;
        let totalBalance = GAME_REWARD.koin;
        let totalExp = GAME_REWARD.exp;
        let bonusText = '';
        
        const fastResult = checkFastAnswer(session);
        if (fastResult.isFast) {
            totalLimit += fastResult.bonus.limit;
            totalBalance += fastResult.bonus.koin;
            totalExp += fastResult.bonus.exp;
            bonusText = `\n\n${fastResult.praise}\n> ⚡ *BONUS KILAT:* +${fastResult.bonus.limit} Limit, +${fastResult.bonus.koin} Koin\n> ⏱️ Waktu: *${(fastResult.elapsed / 1000).toFixed(1)}s*`;
        }
        
        db.updateEnergi(m.sender, totalLimit);
        db.updateKoin(m.sender, totalBalance);
        
        if (!user.rpg) user.rpg = {};
        await addExpWithLevelCheck(sock, m, db, user, totalExp);
        db.save();

        // 🔥 FIX: Ambil gambar dari URL
        let winnerMediaAttachment = null;
        try {
            const winnerImageBuffer = await loadImage('respon-bot-zerotwo.jpg');
            if (winnerImageBuffer) {
                winnerMediaAttachment = await prepareWAMessageMedia(
                    { image: winnerImageBuffer },
                    { upload: sock.waUploadToServer }
                );
            }
        } catch (e) {
            console.log('[TebakBendera] Gagal upload gambar winner:', e.message);
        }

        let winnerText = `🎉 *ʙᴇɴᴀʀ!*\n\n`;
        winnerText += `> Jawaban: *${session.question.name}*\n`;
        winnerText += `> Pemenang: *@${m.sender.split('@')[0]}*\n`;
        winnerText += `> Percobaan: *${session.attempts}x*\n\n`;
        winnerText += `╭┈┈⬡「 🎁 *ʜᴀᴅɪᴀʜ* 」\n`;
        winnerText += `┃ 📊 +${totalLimit} Limit\n`;
        winnerText += `┃ 💰 +${totalBalance} Koin\n`;
        winnerText += `┃ ⭐ +${totalExp} EXP\n`;
        winnerText += `╰┈┈┈┈┈┈┈┈⬡`;
        winnerText += bonusText;

        const winnerMsg = generateWAMessageFromContent(chatId, {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '🏆 WINNER!',
                    hasMediaAttachment: !!winnerMediaAttachment,
                    ...(winnerMediaAttachment || {})
                }),
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: winnerText
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: `🎉 Selamat @${m.sender.split('@')[0]}!`
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎮 Main Lagi',
                                id: '.tebakbendera'
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
                    mentionedJid: [m.sender]
                }
            })
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(chatId, winnerMsg.message, { messageId: winnerMsg.key.id });
        return true;
    }
    
    if (result.status === 'close') {
        const remaining = getRemainingTime(chatId);
        const percent = Math.round(result.similarity * 100);
        await m.reply(`🔥 *ʜᴀᴍᴘɪʀ!* Jawabanmu *${percent}%* mirip!\n> _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
        return false;
    }
    
    const remaining = getRemainingTime(chatId);
    if (remaining > 0 && session.attempts < 10) {
        await m.reply(`❌ *sᴀʟᴀʜ!* _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
    }
    
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};