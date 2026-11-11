const { 
    downloadContentFromMessage, 
    getContentType, 
    jidDecode,
    proto,
    generateWAMessageFromContent,
    generateWAMessage,
    areJidsSameUser,
    normalizeMessageContent
} = require('zerotwo');
const { writeFileSync, mkdirSync, existsSync, unlinkSync } = require('fs');
const { join } = require('path');
const config = require('../../config');
const { isLid, isLidConverted, lidToJid, convertLidArray, decodeAndNormalize, resolveLidFromParticipants, resolveAnyLidToJid } = require('./lidHelper');
const fs = require('node-webpmux/io');
const fsc = require("fs");
const sharp = require('sharp');
const { loadImage } = require('./assetLoader'); // 🔥 IMPORT HELPER

// ✨ Zero Two - Helper functions untuk styling text ✨
function toZeroTwoStyle(text) {
    const style = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return String(text || '').toLowerCase().split('').map(c => style[c] || c).join('');
}

function getRandomZeroTwoEmoji() {
    const emojis = ['💕', '🌸', '✨', '🎀', '💗', '🌟', '🍭', '💖', '🌺', '⭐', '💫', '🦋'];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * 💕 Decode JID menjadi format yang lebih bersih
 */
function decodeJid(jid) {
    if (!jid) return null;
    if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {};
        return (decoded.user && decoded.server && decoded.user + '@' + decoded.server) || jid;
    }
    return jid;
}

function getMessageType(message) {
    if (!message) return null;
    const contentType = getContentType(message);
    if (contentType === 'messageContextInfo' && message.interactiveResponseMessage) {
        return 'interactiveResponseMessage';
    }
    return contentType;
}

/**
 * 📝 Mendapatkan text/body dari berbagai tipe pesan
 */
function getMessageBody(message, type) {
    if (!message || !type) return '';
    
    const messageContent = message[type];
    if (!messageContent) return '';
    
    switch (type) {
        case 'conversation':
            return message.conversation || '';
        case 'extendedTextMessage':
            return messageContent.text || '';
        case 'imageMessage':
        case 'videoMessage':
        case 'documentMessage':
            return messageContent.caption || '';
        case 'buttonsResponseMessage':
            return messageContent.selectedButtonId || '';
        case 'listResponseMessage':
            return messageContent.singleSelectReply?.selectedRowId || '';
        case 'templateButtonReplyMessage':
            return messageContent.selectedId || '';
        case 'interactiveResponseMessage':
            try {
                const paramsJson = messageContent.nativeFlowResponseMessage?.paramsJson || '{}';
                const parsed = JSON.parse(paramsJson);
                if (parsed.id) return parsed.id;
                if (parsed.response_json) {
                    const nested = JSON.parse(parsed.response_json);
                    if (nested.id) return nested.id;
                    if (nested.selectedRowId) return nested.selectedRowId;
                }
                if (parsed.selectedRowId) return parsed.selectedRowId;
                if (parsed.selected_row_id) return parsed.selected_row_id;
                return '';
            } catch {
                return '';
            }
        case 'pollCreationMessage':
            return messageContent.name || '';
        default:
            return '';
    }
}

/**
 * 🎀 Parse command dan argumen dari body pesan
 */
function parseCommand(body, prefix) {
    const result = {
        isCommand: false,
        command: '',
        prefix: '',
        args: [],
        text: '',
        fullArgs: ''
    };
    
    if (!body) return result;
    
    let prefixList = [];
    
    try {
        const prefixDbPath = join(process.cwd(), 'database', 'prefix.json');
        if (existsSync(prefixDbPath)) {
            const prefixData = JSON.parse(require('fs').readFileSync(prefixDbPath, 'utf8'));
            prefixList = prefixData.prefixes || [];
        }
    } catch {}
    
    const configPrefix = config.command?.prefix || '.';
    prefixList = [configPrefix, ...prefixList];
    prefixList = [...new Set(prefixList)];
    
    const allKnownPrefixes = [];
    
    for (const p of prefixList) {
        if (body.startsWith(p)) {
            result.isCommand = true;
            result.prefix = p;
            
            const withoutPrefix = body.slice(p.length).trim();
            const parts = withoutPrefix.split(/\s+/);
            
            result.command = config.command?.caseSensitive 
                ? parts[0] 
                : parts[0].toLowerCase();
            result.args = parts.slice(1);
            result.text = withoutPrefix.slice(result.command.length).trim();
            result.fullArgs = withoutPrefix.slice(result.command.length).trim();
            
            break;
        }
    }
    
    if (!result.isCommand) {
        for (const knownPrefix of allKnownPrefixes) {
            if (prefixList.includes(knownPrefix)) continue;
            
            if (body.startsWith(knownPrefix)) {
                const withoutPrefix = body.slice(knownPrefix.length).trim();
                const parts = withoutPrefix.split(/\s+/);
                const potentialCommand = config.command?.caseSensitive ? parts[0] : parts[0].toLowerCase();
                
                if (potentialCommand && /^[a-z0-9_-]+$/i.test(potentialCommand)) {
                    result.isCommand = true;
                    result.prefix = prefixList[0] || prefix;
                    result.command = potentialCommand;
                    result.args = parts.slice(1);
                    result.text = result.args.join(' ');
                    result.fullArgs = withoutPrefix.slice(potentialCommand.length).trim();
                    break;
                }
            }
        }
    }
    
    if (!result.isCommand) {
        let isNoPrefix = false;
        try {
            const prefixDbPath = join(process.cwd(), 'database', 'prefix.json');
            if (existsSync(prefixDbPath)) {
                const prefixData = JSON.parse(require('fs').readFileSync(prefixDbPath, 'utf8'));
                isNoPrefix = prefixData.noprefix === true;
            }
        } catch {}
        
        if (isNoPrefix) {
            const parts = body.trim().split(/\s+/);
            const potentialCommand = config.command?.caseSensitive ? parts[0] : parts[0].toLowerCase();
            
            if (potentialCommand && /^[a-z0-9_-]+$/i.test(potentialCommand) && potentialCommand.length <= 20) {
                result.isCommand = true;
                result.prefix = '';
                result.command = potentialCommand;
                result.args = parts.slice(1);
                result.text = result.args.join(' ');
                result.fullArgs = body.slice(potentialCommand.length).trim();
            }
        }
    }
    
    return result;
}

/**
 * 💕 Serialize quoted message dengan full context
 */
async function serializeQuotedMessage(message, type, sock, participants = [], originalMsgKey = {}) {
    if (!message || !type) return null;
    
    const messageContent = message[type];
    if (!messageContent) return null;
    
    const contextInfo = messageContent.contextInfo;
    if (!contextInfo || !contextInfo.quotedMessage) return null;
    
    const quotedMessage = contextInfo.quotedMessage;
    const quotedType = getMessageType(quotedMessage);
    
    const { getCachedJid } = require('./lidHelper');
    
    let quotedParticipant = contextInfo.participant || '';
    
    if (isLid(quotedParticipant) || isLidConverted(quotedParticipant)) {
        const cached = getCachedJid(quotedParticipant);
        if (cached && !isLidConverted(cached)) {
            quotedParticipant = cached;
        } else if (participants && participants.length > 0) {
            quotedParticipant = resolveAnyLidToJid(quotedParticipant, participants);
        } else {
            quotedParticipant = lidToJid(quotedParticipant);
        }
    }
    
    quotedParticipant = decodeJid(quotedParticipant);
    
    const quoted = {
        key: {
            remoteJid: message.key?.remoteJid || '',
            fromMe: quotedParticipant === decodeJid(sock?.user?.id),
            id: contextInfo.stanzaId || '',
            participant: quotedParticipant
        },
        id: contextInfo.stanzaId || '',
        sender: quotedParticipant,
        senderNumber: (quotedParticipant || '').replace(/@.+/g, ''),
        type: quotedType,
        body: getMessageBody(quotedMessage, quotedType),
        message: quotedMessage,
        mentionedJid: convertLidArray(contextInfo.mentionedJid || [], participants),
        isMedia: ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(quotedType),
        isImage: quotedType === 'imageMessage',
        isVideo: quotedType === 'videoMessage',
        isAudio: quotedType === 'audioMessage',
        isSticker: quotedType === 'stickerMessage',
        isDocument: quotedType === 'documentMessage'
    };
    
    quoted.download = async (filename = null) => {
        if (!quoted.isMedia) return null;
        
        const stream = await downloadContentFromMessage(
            quotedMessage[quotedType],
            quotedType.replace('Message', '')
        );
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        if (filename) {
            const tempDir = join(process.cwd(), 'storage', 'temp');
            if (!existsSync(tempDir)) {
                mkdirSync(tempDir, { recursive: true });
            }
            const filepath = join(tempDir, filename);
            writeFileSync(filepath, buffer);
            return filepath;
        }
        
        return buffer;
    };
    
    return quoted;
}

/**
 * ✨ Membuat context info untuk fake reply
 */
function createContextInfo(jid, text, title = '', body = '', thumbnail = null) {
    const contextInfo = {
        mentionedJid: [],
        forwardingScore: 999,
        isForwarded: true
    };
    
    if (jid && text) {
        contextInfo.quotedMessage = {
            conversation: text
        };
        contextInfo.participant = jid;
        contextInfo.stanzaId = 'ZERO_TWO_' + Date.now();
    }
    
    if (title || body || thumbnail) {
        contextInfo.externalAdReply = {
            showAdAttribution: true,
            title: title || config.bot?.name || 'NusaBot',
            body: body || `${getRandomZeroTwoEmoji()} Darling, I'm here for you ${getRandomZeroTwoEmoji()}`,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnail: thumbnail,
            sourceUrl: ''
        };
    }
    
    return contextInfo;
}

/**
 * 💗 Serialize pesan WhatsApp menjadi objek lengkap dengan full fitur
 */
async function serialize(sock, msg, store = {}) {
    if (!msg) return null;
    if (!msg.message) return null;
    if (!msg.key) return null;
    
    const m = {};
    
    m.key = msg.key;
    m.id = msg.key?.id || '';
    m.chat = decodeJid(msg.key?.remoteJid || '');
    m.fromMe = (msg.key && msg.key.fromMe) || false;
    m.isGroup = m.chat?.endsWith('@g.us') || false;
    
    let senderJid;
    if (m.isGroup) {
        senderJid = msg.key.participant;
    } else {
        senderJid = m.fromMe 
            ? sock.user.id 
            : msg.key.remoteJid;
    }
    senderJid = decodeAndNormalize(senderJid);
    
    if (!senderJid || isLid(senderJid) || isLidConverted(senderJid)) {
        const fallback = m.isGroup ? (msg.key.participant) : m.chat;
        senderJid = resolveAnyLidToJid(senderJid || fallback, []);
    }
    m.sender = senderJid;
    m.senderNumber = m.sender ? m.sender.replace(/@.+/g, '') : '';
    if (m.isGroup && m.sender) {
        m.key.participant = m.sender;
    }
    m.pushName = msg.pushName || 'Darling';
    m.isOwner = config.isOwner(m.sender);
    m.isPartner = config.isPartner(m.sender);
    m.isPremium = config.isPremium(m.sender);
    m.isBanned = config.isBanned(m.sender);
    m.isBot = m.fromMe;
    
    let messageData = normalizeMessageContent(msg.message);
    m.isViewOnce = !!(
        msg.message?.viewOnceMessage || 
        msg.message?.viewOnceMessageV2 ||
        msg.message?.viewOnceMessageV2Extension
    );
    m.type = getMessageType(messageData);
    m.message = messageData;
    m.body = getMessageBody(messageData, m.type);
    
    const parsed = parseCommand(m.body, config.command?.prefix || '.');
    m.isCommand = parsed.isCommand;
    m.command = parsed.command;
    m.prefix = parsed.prefix;
    m.args = parsed.args;
    m.text = parsed.text;
    m.fullArgs = parsed.fullArgs;
    
    m.isQuoted = false;
    m.quoted = null;
    m._pendingQuotedMessage = { messageData, type: m.type, sock };
    
    const messageContent = messageData[m.type];
    m.mentionedJid = convertLidArray(messageContent?.contextInfo?.mentionedJid || []);
    
    m.isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(m.type);
    m.isImage = m.type === 'imageMessage';
    m.isVideo = m.type === 'videoMessage';
    m.isAudio = m.type === 'audioMessage';
    m.isSticker = m.type === 'stickerMessage';
    m.isDocument = m.type === 'documentMessage';
    m.isContact = m.type === 'contactMessage' || m.type === 'contactsArrayMessage';
    m.isLocation = m.type === 'locationMessage' || m.type === 'liveLocationMessage';
    m.isPoll = m.type === 'pollCreationMessage';
    
    m.groupMetadata = null;
    m.isAdmin = false;
    m.isBotAdmin = false;
    m.groupName = '';
    m.groupDesc = '';
    m.groupMembers = [];
    m.groupAdmins = [];
    
    if (m.isGroup) {
        try {
            m.groupMetadata = store.groupMetadata?.[m.chat] || await sock.groupMetadata(m.chat);
            m.groupName = m.groupMetadata.subject || '';
            m.groupDesc = m.groupMetadata.desc || '';
            m.groupMembers = m.groupMetadata.participants || [];
            m.groupAdmins = m.groupMembers.filter(p => p.admin).map(p => p.jid || p.id || p.lid || '');
            
            const senderNum = m.sender?.replace(/[^0-9]/g, '') || '';
            const botNum = decodeJid(sock.user.id)?.replace(/[^0-9]/g, '') || '';
            
            m.isAdmin = m.groupMembers.some(p => {
                if (!p.admin) return false;
                const pJid = p.jid || p.id || '';
                const pLid = p.lid || '';
                const pNum = pJid.replace(/[^0-9]/g, '');
                const pLidNum = pLid.replace(/[^0-9]/g, '');
                return pNum === senderNum || pLidNum === senderNum || 
                       pNum.includes(senderNum) || senderNum.includes(pNum);
            });
            
            m.isBotAdmin = m.groupMembers.some(p => {
                if (!p.admin) return false;
                const pJid = p.jid || p.id || '';
                const pNum = pJid.replace(/[^0-9]/g, '');
                return pNum === botNum || pNum.includes(botNum) || botNum.includes(pNum);
            });
            
            const { cacheParticipantLids } = require('./lidHelper');
            cacheParticipantLids(m.groupMembers);
            
            if (m._pendingQuotedMessage) {
                const { messageData, type, sock } = m._pendingQuotedMessage;
                m.quoted = await serializeQuotedMessage(messageData, type, sock, m.groupMembers);
                if (m.quoted) {
                    m.isQuoted = true;
                }
                delete m._pendingQuotedMessage;
            }
            
            if (isLid(m.sender) || isLidConverted(m.sender)) {
                m.sender = resolveAnyLidToJid(m.sender, m.groupMembers);
                m.senderNumber = m.sender ? m.sender.replace(/@.+/g, '') : '';
            }
            
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                m.mentionedJid = convertLidArray(m.mentionedJid, m.groupMembers);
            }
            
            if (m.quoted && (isLid(m.quoted.sender) || isLidConverted(m.quoted.sender))) {
                m.quoted.sender = resolveAnyLidToJid(m.quoted.sender, m.groupMembers);
                m.quoted.senderNumber = m.quoted.sender ? m.quoted.sender.replace(/@.+/g, '') : '';
                m.quoted.key.participant = m.quoted.sender;
            }
        } catch (error) {
            // Silent error handling ✨
        }
    }
    
    if (m._pendingQuotedMessage) {
        const { messageData, type, sock } = m._pendingQuotedMessage;
        m.quoted = await serializeQuotedMessage(messageData, type, sock, []);
        if (m.quoted) {
            m.isQuoted = true;
        }
        delete m._pendingQuotedMessage;
    }
    
    // Extra properties for compatibility 🩷
    m.remoteJid = m.chat;
    m.jid = m.chat;
    m.from = m.chat;
    m.to = m.chat;
    m.botNumber = decodeJid(sock.user?.id)?.replace(/@.+/g, '') || '';
    m.botJid = decodeJid(sock.user?.id) || '';
    m.botName = sock.user?.name || config.bot?.name || 'NusaBot';
    m.messageId = m.id;
    m.chatId = m.chat;
    m.senderId = m.sender;
    m.isPrivate = !m.isGroup;
    m.isPrivateChat = !m.isGroup;
    m.isGroupChat = m.isGroup;
    m.mediaType = m.type;
    m.hasMedia = m.isMedia;
    m.mimetype = messageData[m.type]?.mimetype || '';
    m.fileLength = messageData[m.type]?.fileLength || 0;
    m.fileName = messageData[m.type]?.fileName || '';
    m.seconds = messageData[m.type]?.seconds || 0;
    m.ptt = messageData[m.type]?.ptt || false;
    m.isAnimated = messageData[m.type]?.isAnimated || false;
    m.quotedMsg = m.quoted;
    m.quotedBody = m.quoted?.body || '';
    m.quotedSender = m.quoted?.sender || '';
    m.quotedType = m.quoted?.type || '';
    m.hasQuotedMedia = m.quoted?.isMedia || false;
    m.hasQuotedImage = m.quoted?.isImage || false;
    m.hasQuotedVideo = m.quoted?.isVideo || false;
    m.hasQuotedSticker = m.quoted?.isSticker || false;
    m.hasQuotedAudio = m.quoted?.isAudio || false;
    m.hasQuotedDocument = m.quoted?.isDocument || false;
    m.isReply = m.isQuoted;
    m.hasMentions = m.mentionedJid.length > 0;
    m.isForwarded = messageData[m.type]?.contextInfo?.isForwarded || false;
    m.forwardingScore = messageData[m.type]?.contextInfo?.forwardingScore || 0;
    m.expiration = messageData[m.type]?.contextInfo?.expiration || 0;
    m.ephemeralSettingTimestamp = msg.messageTimestamp || 0;
    
    /**
     * 💕 Reply text dengan opsi (๑•̀ㅂ•́)و✧
     */
    m.reply = async (text, options = {}) => {
        if (!text && text !== 0) return null;
        
        const { getDatabase } = require('./database');
        const db = getDatabase();
        
        let replyVariant = 1;
        try {
            replyVariant = db?.setting?.('replyVariant') || db?.db?.data?.settings?.replyVariant || 1;
        } catch (e) {
            replyVariant = 1;
        }
        
        let contextInfo = {
            mentionedJid: options.mentions || [],
            ...options.contextInfo
        };
        
        // 🔥 FIX: pake await loadImage() biar dari URL
        if (replyVariant === 2) {
            try {
                const thumbnail = await loadImage('zerotwo2.jpg');
                
                contextInfo = {
                    ...contextInfo,
                    externalAdReply: {
                        title: config.bot?.name || 'NusaBot',
                        body: `💕 ${config.bot?.developer || 'RzkyADS'} 💕`,
                        thumbnail: thumbnail,
                        sourceUrl: config.bot?.website || '',
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        showAdAttribution: false
                    }
                };
            } catch (e) {}
        } else if (replyVariant === 3) {
            try {
                const thumbnail = await loadImage('zerotwo2.jpg');
                
                contextInfo = {
                    ...contextInfo,
                    externalAdReply: {
                        title: config.bot?.name || 'NusaBot',
                        body: `🌸 Darling, I'm here for you 🌸`,
                        thumbnail: thumbnail,
                        sourceUrl: config.bot?.website || '',
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        showAdAttribution: false
                    },
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config.saluran?.name || 'NusaBot',
                        newsletterJid: config.saluran?.id ? `${config.saluran.id}@newsletter` : '12036405374961944@newaletter',
                        serverMessageId: Math.floor(Math.random() * 1000000)
                    }
                };
            } catch (e) {}
        } else if (replyVariant === 4) {
            try {
                const thumbnail = await loadImage('zerotwo2.jpg');
                
                const fakeContact = config.bot?.fakeQuotedContact || {
                    name: config.bot?.name || 'NusaBot',
                    number: config.bot?.number || config.owner?.number?.[0] || ''
                };
                
                const fakeJid = `${fakeContact.number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
                
                contextInfo = {
                    ...contextInfo,
                    externalAdReply: {
                        title: config.bot?.name || 'NusaBot',
                        body: `💗 ${config.bot?.developer || 'RzkyADS'} 💗`,
                        thumbnail: thumbnail,
                        sourceUrl: config.bot?.website || '',
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        showAdAttribution: false
                    },
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config.saluran?.name || 'NusaBot',
                        newsletterJid: config.saluran?.id ? config.saluran.id : '12036405374961944@newaletter',
                    },
                };
            } catch (e) {}
        } else if (replyVariant === 5) {
            try {
                const thumbnail = await loadImage('zerotwo.jpg');
                
                contextInfo = {
                    ...contextInfo,
                    externalAdReply: {
                        title: config.bot?.name || 'NusaBot',
                        body: `✨ Aku percaya padamu, Darling ✨`,
                        thumbnail: thumbnail,
                        sourceUrl: config.bot?.website || '',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                    },
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config.saluran?.name || 'NusaBot',
                        newsletterJid: config.saluran?.id ? config.saluran.id : '12036405374961944@newaletter',
                    },
                };
            } catch (e) {}
        } else if (replyVariant === 6) {
            try {
                // 🔥 FIX: pake await loadImage() biar dari URL
                const thumbnail = await loadImage('zerotwo.jpg');
                
                contextInfo = {
                    ...contextInfo,
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 999,
                };
            } catch (e) {}
        }
        
        const defaultOptions = { contextInfo };
        
        let quotedMsg = options.quoted !== false ? msg : undefined;
        
        if (replyVariant === 4) {
            const saluranId = config.saluran?.id || '12036405374961944@newaletter';
            const saluranName = config.saluran?.name || config.bot?.name || 'NusaBot';
            
            let jpegThumbnail = null;
            try {
                const ppUrl = await sock.profilePictureUrl(m.sender, 'image').catch(() => null);
                if (ppUrl) {
                    const axios = require('axios');
                    const ppRes = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 5000 });
                    jpegThumbnail = Buffer.from(ppRes.data);
                }
            } catch (e) {}
            
            const userNumber = m.sender?.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '') || '0';
            
            quotedMsg = {
                key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    contactMessage: {
                        displayName: config.bot?.name || 'User',
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${m.pushName || 'Darling'};;;\nFN:${m.pushName || 'Darling'}\nTEL;type=CELL;type=VOICE;waid=${userNumber}:${userNumber}\nEND:VCARD`,
                    }
                }
            };
        } else if (replyVariant === 5) {
            let troliThumbnail = null;
            try {
                troliThumbnail = await loadImage('zerotwo.jpg');
            } catch (e) {}
            
            quotedMsg = {
                key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    orderMessage: {
                        orderId: '1337',
                        // 🔥 FIX: pake thumbnail dari URL
                        thumbnail: troliThumbnail ? await sharp(troliThumbnail).resize(300, 300).toBuffer() : null,
                        itemCount: `✨ BOT READY ✨`,
                        status: 'INQUIRY',
                        surface: 'CATALOG',
                        message: `${config.bot?.name || 'NusaBot'}`,
                        orderTitle: `💕 BOT WhatsApp Multi-Device 💕`,
                        sellerJid: config.bot?.number ? `${config.bot.number}@s.whatsapp.net` : m.sender,
                        token: 'zerotwo-menu-v8',
                        totalAmount1000: 0,
                        totalCurrencyCode: 'IDR',
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 9999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || '12036405374961944@newaletter',
                                newsletterName: config.saluran?.name || config.bot?.name || 'NusaBot',
                                serverMessageId: 127
                            }
                        }
                    }
                }
            };
        } else if (replyVariant === 6) {
            let troliThumbnail = null;
            quotedMsg = {
                key: {
                    participant: `0@s.whatsapp.net`,
                    remoteJid: `status@broadcast`
                },
                message: {
                    'contactMessage': {
                        'displayName': `🪸 ${config.bot?.name}`,
                        'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                        sendEphemeral: true
                    }
                }
            };

            // 🔥 FIX: load dari URL buat thumbnail dokumen
            const docThumb = await loadImage('zerotwo2.jpg');

            return sock.sendMessage(m.chat, {
                document: fsc.readFileSync(join(process.cwd(), 'package.json')),
                mimetype: 'image/png',
                fileName: config.bot.name,
                fileLength: 99999999999999,
                jpegThumbnail: docThumb ? await sharp(docThumb).resize(300, 300).toBuffer() : undefined,
                caption: text,
                ...defaultOptions,
                ...options
            }, {
                quoted: quotedMsg
            });
        }
        
        return sock.sendMessage(m.chat, {
            text,
            ...defaultOptions,
            ...options
        }, {
            quoted: quotedMsg
        });
    };
    
    /**
     * 🌸 Reply text dengan mentions otomatis
     */
    m.replyWithMentions = async (text) => {
        const mentions = [...text.matchAll(/@(\d+)/g)].map(match => `${match[1]}@s.whatsapp.net`);
        return m.reply(text, { mentions });
    };
    
    /**
     * 🖼️ Reply gambar
     */
    m.replyImage = async (image, caption = '', options = {}) => {
        let buffer = image;
        if (typeof image === 'string' && image.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(image, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
        }
        
        return sock.sendMessage(m.chat, {
            image: buffer,
            caption,
            contextInfo: options.contextInfo,
            mentions: options.mentions || []
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 🎬 Reply video
     */
    m.replyVideo = async (video, caption = '', options = {}) => {
        let buffer = video;
        if (typeof video === 'string' && video.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(video, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
        }
        
        return sock.sendMessage(m.chat, {
            video: buffer,
            caption,
            gifPlayback: options.gif || false,
            contextInfo: options.contextInfo,
            mentions: options.mentions || []
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 🎵 Reply audio/voice note
     */
    m.replyAudio = async (audio, ptt = false, options = {}) => {
        let buffer = audio;
        if (typeof audio === 'string' && audio.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(audio, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
        }
        
        return sock.sendMessage(m.chat, {
            audio: buffer,
            ptt,
            mimetype: 'audio/mpeg'
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 🏷️ Reply sticker
     */
    m.replySticker = async (sticker, options = {}) => {
        let buffer = sticker;
        if (typeof sticker === 'string' && sticker.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(sticker, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
        }
        
        return sock.sendMessage(m.chat, {
            sticker: buffer
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 📄 Reply dokumen
     */
    m.replyDocument = async (document, fileName, mimetype = 'application/octet-stream', options = {}) => {
        let buffer = document;
        if (typeof document === 'string' && document.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(document, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data);
        }
        
        return sock.sendMessage(m.chat, {
            document: buffer,
            fileName,
            mimetype,
            caption: options.caption || ''
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 📞 Reply kontak
     */
    m.replyContact = async (number, name, options = {}) => {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`;
        
        return sock.sendMessage(m.chat, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            }
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 📍 Reply lokasi
     */
    m.replyLocation = async (latitude, longitude, options = {}) => {
        return sock.sendMessage(m.chat, {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                name: options.name || '',
                address: options.address || ''
            }
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 💭 Reply dengan fake quote
     */
    m.replyWithQuote = async (text, fakeJid, fakeText, options = {}) => {
        const fakeMsg = {
            key: {
                fromMe: false,
                participant: fakeJid,
                remoteJid: m.chat
            },
            message: {
                conversation: fakeText
            },
            pushName: options.pushName || 'Bot'
        };
        
        return sock.sendMessage(m.chat, {
            text,
            contextInfo: {
                ...createContextInfo(fakeJid, fakeText, options.title, options.body, options.thumbnail),
                mentionedJid: options.mentions || []
            }
        }, {
            quoted: fakeMsg
        });
    };
    
    /**
     * 🎀 Reply dengan thumbnail (external ad reply)
     */
    m.replyWithPreview = async (text, preview, options = {}) => {
        return sock.sendMessage(m.chat, {
            text,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: preview.title || config.bot?.name || 'NusaBot',
                    body: preview.body || `💕 Aku percaya padamu, Darling 💕`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: preview.thumbnail,
                    sourceUrl: preview.sourceUrl || ''
                },
                mentionedJid: options.mentions || []
            }
        }, {
            quoted: options.quoted !== false ? msg : undefined
        });
    };
    
    /**
     * 😊 React ke pesan
     */
    m.react = async (emoji) => {
        try {
            return await sock.sendMessage(m.chat, {
                react: {
                    text: emoji,
                    key: msg.key
                }
            });
        } catch (e) {
            return null;
        }
    };
    
    /**
     * 📥 Download media dari pesan ini
     */
    m.download = async (filename = null) => {
        if (!m.isMedia) return null;
        
        const stream = await downloadContentFromMessage(
            messageData[m.type],
            m.type.replace('Message', '')
        );
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        if (filename) {
            const tempDir = join(process.cwd(), 'storage', 'temp');
            if (!existsSync(tempDir)) {
                mkdirSync(tempDir, { recursive: true });
            }
            const filepath = join(tempDir, filename);
            writeFileSync(filepath, buffer);
            return filepath;
        }
        
        return buffer;
    };
    
    /**
     * 🗑️ Delete pesan ini
     */
    m.delete = async () => {
        return sock.sendMessage(m.chat, {
            delete: msg.key
        });
    };
    
    /**
     * 📨 Forward pesan ke JID lain
     */
    m.forward = async (jid, forceForward = false) => {
        return sock.sendMessage(jid, {
            forward: msg,
            force: forceForward
        });
    };
    
    /**
     * 📋 Copy pesan ke JID lain
     */
    m.copy = async (jid, options = {}) => {
        const content = {};
        
        if (m.isImage) {
            content.image = await m.download();
            content.caption = m.body;
        } else if (m.isVideo) {
            content.video = await m.download();
            content.caption = m.body;
        } else if (m.isAudio) {
            content.audio = await m.download();
        } else if (m.isSticker) {
            content.sticker = await m.download();
        } else if (m.isDocument) {
            content.document = await m.download();
            content.fileName = messageData[m.type]?.fileName || 'file';
            content.mimetype = messageData[m.type]?.mimetype;
        } else {
            content.text = m.body;
        }
        
        return sock.sendMessage(jid, content, options);
    };
    
    m.timestamp = msg.messageTimestamp;
    m.raw = msg;
    return m;
}

/**
 * 📱 Get number from JID
 */
function getNumber(jid) {
    if (!jid) return '';
    return jid.replace(/@.+/g, '');
}

/**
 * ✨ Create JID from number
 */
function createJid(number) {
    if (!number) return '';
    const cleaned = number.replace(/[^0-9]/g, '');
    return cleaned + '@s.whatsapp.net';
}

module.exports = {
    serialize,
    decodeJid,
    getMessageType,
    getMessageBody,
    parseCommand,
    serializeQuotedMessage,
    createContextInfo,
    getNumber,
    createJid
};
