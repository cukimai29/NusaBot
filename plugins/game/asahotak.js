const { 
    getRandomItem, createSession, getSession, endSession, 
    checkAnswerAdvanced, getHint, hasActiveSession, setSessionTimer,
    getRemainingTime, formatRemainingTime, isSurrender, isReplyToGame,
    GAME_REWARD
} = require('../../src/lib/gameData');
const { getDatabase } = require('../../src/lib/database');
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper');
const { getGameContextInfo } = require('../../src/lib/contextHelper');
const { loadImage } = require('../../src/lib/assetLoader'); // 🔥 IMPORT HELPER
const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');

const pluginConfig = {
    name: 'asahotak',
    alias: ['asah', 'quiz'],
    category: 'game',
    description: 'Game asah otak - tebak jawaban dari pertanyaan',
    usage: '.asahotak',
    example: '.asahotak',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock, config: botConfig }) {
    const chatId = m.chat;
    
    if (hasActiveSession(chatId)) {
        const session = getSession(chatId);
        if (session && session.gameType === 'asahotak') {
            const remaining = getRemainingTime(chatId);
            let text = `⚠️ *Masih ada game berjalan!*\n\n`;
            text += `\`\`\`${session.question.soal}\`\`\`\n\n`;
            text += `> 💡 Hint: *${getHint(session.question.jawaban, 2)}*\n`;
            text += `> ⏱️ Sisa: *${formatRemainingTime(remaining)}*\n\n`;
            text += `_Reply pesan soal untuk menjawab atau ketik "nyerah"_`;
            await m.reply(text);
            return;
        }
    }
    
    const question = getRandomItem('asahotak.json');
    if (!question) {
        await m.reply('❌ Data game tidak tersedia!');
        return;
    }
    
    // 🔥 FIX: Ambil gambar dari URL
    let mediaAttachment = null;
    try {
        const imageBuffer = await loadImage('respon-bot-zerotwo.jpg');
        if (imageBuffer) {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            );
        }
    } catch (e) {
        console.log('[AsahOtak] Gagal upload gambar:', e.message);
    }

    const interactiveMsg = generateWAMessageFromContent(chatId, {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '🧠 ASAH OTAK',
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: 
`\`\`\`${question.soal}\`\`\`

> 💡 Hint: *${getHint(question.jawaban, 2)}*
> ⏱️ Waktu: *60 detik*
> 🎁 Hadiah: *+${GAME_REWARD.limit} Limit, +${GAME_REWARD.koin} Bal, +${GAME_REWARD.exp} EXP*

_Reply pesan ini dengan jawabanmu atau ketik "nyerah"_`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `🧠 Jawab pertanyaan di atas!`
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

    const sentMsg = await sock.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    
    const msgKey = {
        id: interactiveMsg.key.id,
        fromMe: true,
        remoteJid: chatId
    };
    
    createSession(chatId, 'asahotak', question, msgKey, 60000);
    
    setSessionTimer(chatId, async () => {
        let timeoutText = `⏱️ *WAKTU HABIS!*\n\n`;
        timeoutText += `> Jawaban: *${question.jawaban}*\n\n`;
        timeoutText += `_Tidak ada yang berhasil menjawab_`;
        await sock.sendMessage(chatId, { text: timeoutText });
    });
}

async function answerHandler(m, sock) {
    const chatId = m.chat;
    const session = getSession(chatId);
    
    if (!session || session.gameType !== 'asahotak') return false;
    
    const userAnswer = m.text || m.body || '';
    if (!userAnswer || userAnswer.startsWith('.')) return false;
    
    if (isSurrender(userAnswer)) {
        endSession(chatId);
        let text = `🏳️ *MENYERAH!*\n\n`;
        text += `> Jawaban: *${session.question.jawaban}*\n\n`;
        text += `_@${m.sender.split('@')[0]} menyerah_`;
        await m.reply(text, { mentions: [m.sender] });
        return true;
    }
    
    if (!isReplyToGame(m, session)) {
        return false;
    }
    
    session.attempts++;
    
    const result = checkAnswerAdvanced(session.question.jawaban, userAnswer);
    
    if (result.status === 'correct') {
        endSession(chatId);
        
        const db = getDatabase();
        const user = db.getUser(m.sender);
        
        db.updateEnergi(m.sender, GAME_REWARD.limit);
        db.updateKoin(m.sender, GAME_REWARD.koin);
        
        if (!user.rpg) user.rpg = {};
        await addExpWithLevelCheck(sock, m, db, user, GAME_REWARD.exp);
        db.save();
        
        let text = `🎉 *BENAR!*\n\n`;
        text += `> Jawaban: *${session.question.jawaban}*\n`;
        text += `> Pemenang: *@${m.sender.split('@')[0]}*\n`;
        text += `> Percobaan: *${session.attempts}x*\n\n`;
        text += `╭┈┈⬡「 🎁 *ʜᴀᴅɪᴀʜ* 」\n`;
        text += `┃ 📊 +${GAME_REWARD.limit} Limit\n`;
        text += `┃ 💰 +${GAME_REWARD.koin} Balance\n`;
        text += `┃ ⭐ +${GAME_REWARD.exp} EXP\n`;
        text += `╰┈┈┈┈┈┈┈┈⬡`;
        
        await m.reply(text, { mentions: [m.sender] });
        return true;
    }
    
    if (result.status === 'close') {
        const remaining = getRemainingTime(chatId);
        const percent = Math.round(result.similarity * 100);
        await m.reply(`🔥 *Hampir!* Jawabanmu *${percent}%* mirip!\n> _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
        return false;
    }
    
    const remaining = getRemainingTime(chatId);
    if (remaining > 0 && session.attempts < 10) {
        await m.reply(`❌ *Salah!* _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
    }
    
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};