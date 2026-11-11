// plugins/game/tebakartis.js
// Plugin Tebak Artis untuk NusaBot Bot - Style seperti Tebak Bendera

const { MessageType, Mimetype } = require('@adiwajshing/baileys');
const fs = require('fs-extra');
const path = require('path');
const botConfig = require('../../config');

// ==================== KONFIGURASI ====================
const config = {
    timeout: 60, // 60 detik
    cooldown: 10,
    minLevel: 1,
    rewardLimit: 5,
    rewardExp: 2000,
    maxAttempts: 3
};

// ==================== DATABASE GAME ====================
const games = {};
const cooldowns = {};
const usedArtists = {};

// ==================== DAFTAR ARTIS ====================
const artists = [
    {
        name: "AgnezMo",
        clue: "A___",
        hint: "Penyanyi wanita Indonesia",
        image: "https://example.com/agnezmo.jpg",
        emoji: "🎤"
    },
    {
        name: "Raisa",
        clue: "R___",
        hint: "Penyanyi solo wanita",
        image: "https://example.com/raisa.jpg",
        emoji: "🎵"
    },
    {
        name: "Tulus",
        clue: "T___",
        hint: "Penyanyi pria Indonesia",
        image: "https://example.com/tulus.jpg",
        emoji: "🎶"
    },
    {
        name: "Isyana Sarasvati",
        clue: "I___",
        hint: "Penyanyi dan pencipta lagu",
        image: "https://example.com/isyana.jpg",
        emoji: "🎹"
    },
    {
        name: "Didi Kempot",
        clue: "D___",
        hint: "Penyanyi campursari",
        image: "https://example.com/didikempot.jpg",
        emoji: "🎸"
    },
    {
        name: "Nadin Amizah",
        clue: "N___",
        hint: "Penyanyi solo wanita",
        image: "https://example.com/nadin.jpg",
        emoji: "🎼"
    },
    {
        name: "Kunto Aji",
        clue: "K___",
        hint: "Penyanyi dan pencipta lagu",
        image: "https://example.com/kuntoaji.jpg",
        emoji: "🎧"
    },
    {
        name: "Mahalini",
        clue: "M___",
        hint: "Penyanyi pendatang baru",
        image: "https://example.com/mahalini.jpg",
        emoji: "💫"
    },
    {
        name: "Lyodra",
        clue: "L___",
        hint: "Penyanyi muda berbakat",
        image: "https://example.com/lyodra.jpg",
        emoji: "🌟"
    },
    {
        name: "Tiara Andini",
        clue: "T___",
        hint: "Penyanyi solo wanita",
        image: "https://example.com/tiaraandini.jpg",
        emoji: "✨"
    },
    {
        name: "Fiersa Besari",
        clue: "F___",
        hint: "Penyanyi dan penulis",
        image: "https://example.com/fiersa.jpg",
        emoji: "📝"
    },
    {
        name: "Hivi",
        clue: "H___",
        hint: "Grup band Indonesia",
        image: "https://example.com/hivi.jpg",
        emoji: "🎸"
    },
    {
        name: "JuicyLuicy",
        clue: "J___",
        hint: "Grup band pop",
        image: "https://example.com/juicy.jpg",
        emoji: "🎶"
    },
    {
        name: "KALIH",
        clue: "K___",
        hint: "Penyanyi pria",
        image: "https://example.com/kalih.jpg",
        emoji: "🎤"
    },
    {
        name: "Laleilmanino",
        clue: "L___",
        hint: "Grup musik",
        image: "https://example.com/laleilmanino.jpg",
        emoji: "🎹"
    }
];

// ==================== FUNGSI UTILITY ====================

// Dapatkan artis random yang belum digunakan
function getRandomArtist(userId) {
    if (!usedArtists[userId]) {
        usedArtists[userId] = [];
    }
    
    let availableArtists = artists.filter(a => !usedArtists[userId].includes(a.name));
    
    if (availableArtists.length === 0) {
        usedArtists[userId] = [];
        availableArtists = artists;
    }
    
    const index = Math.floor(Math.random() * availableArtists.length);
    const artist = availableArtists[index];
    usedArtists[userId].push(artist.name);
    
    return artist;
}

// Format waktu
function formatTime(seconds) {
    return `${seconds} detik`;
}

// Buat teks dengan style bold
function bold(text) {
    return `*${text}*`;
}

// Buat teks dengan style italic
function italic(text) {
    return `_${text}_`;
}

// Buat teks dengan style monospace
function mono(text) {
    return `\`${text}\``;
}

// ==================== PEMBUAT PESAN ====================

// Pesan utama game
function createGameMessage(artist, userId, gameId) {
    const ownerName = botConfig.bot?.developer || 'RzkyADS';
    const ownerNumber = botConfig.owner?.number?.[0] || '';
    const header = `~ ${botConfig.bot?.name || 'NusaBot'}    ${ownerNumber ? `+${ownerNumber}` : ''}`;
    const owner = `${ownerName} • Owner`;
    const title = '. tebakartis';
    const gameTitle = 'TEBAK ARTIS';
    const question = 'Siapa nama artis ini?';
    const hint = `Hint: ${artist.clue}`;
    const time = `Waktu: ${config.timeout} detik`;
    const reward = `Hadiah: +${config.rewardLimit} Limit, +${config.rewardExp} EXP`;
    const instruction = `Reply pesan ini dengan jawabanmu atau ketik "nyerah"`;
    const footer = 'Tebak artis!';
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    return `*${header}*

${owner}  
${mono(title)}  

*${gameTitle}*  
${question}  

*Hint:* ${hint}  
*Waktu:* ${time}  
*Hadiah:* ${reward}  

${instruction}  
${footer}  
${timeNow}

*[ 📋 Menu ]*`;
}

// Pesan jawaban benar
function createCorrectMessage(artist, answer, userId) {
    return `*✅ JAWABAN BENAR!* ✅

🎉 *Selamat!* Jawaban *${artist.name}* benar!

*📊 Detail:*
• Nama: ${bold(artist.name)}
• Clue: ${artist.clue}
• Hint: ${artist.hint}

*🎁 Hadiah:*
• +${config.rewardLimit} Limit
• +${config.rewardExp} EXP

*💪 Pertahankan prestasimu!*

*[ 📋 Menu ]*`;
}

// Pesan jawaban salah
function createWrongMessage(artist, answer, attempts) {
    const remaining = config.maxAttempts - attempts;
    return `*❌ JAWABAN SALAH!* ❌

Jawaban *${answer}* tidak tepat.

*💡 Petunjuk:*
• Hint: ${artist.clue}
• ${artist.hint ? `Info: ${artist.hint}` : ''}

*📊 Kesempatan tersisa: ${remaining} kali*

${remaining > 0 ? 'Coba lagi! 💪' : '⚠️ Kesempatan habis!'}

*[ 📋 Menu ]*`;
}

// Pesan waktu habis
function createTimeoutMessage(artist) {
    return `*⏰ WAKTU HABIS!* ⏰

Tidak ada yang menjawab dengan benar.

*📝 Jawaban yang benar adalah:* ${bold(artist.name)}

${artist.hint ? `*ℹ️ Info:* ${artist.hint}` : ''}

*🎯 Coba lagi lain waktu!*

*[ 📋 Menu ]*`;
}

// Pesan menyerah
function createGiveUpMessage(artist) {
    return `*😢 MENYERAH!* 😢

Jawaban yang benar adalah: ${bold(artist.name)}

${artist.hint ? `*ℹ️ Info:* ${artist.hint}` : ''}

*💪 Jangan menyerah, coba lagi!*

*[ 📋 Menu ]*`;
}

// Pesan cooldown
function createCooldownMessage(remaining) {
    return `*⏳ TUNGGU SEBENTAR!* ⏳

Mohon tunggu ${remaining} detik sebelum memulai game baru.

*[ 📋 Menu ]*`;
}

// Pesan game berjalan
function createGameRunningMessage(timeLeft) {
    return `*⚠️ GAME SEDANG BERJALAN!* ⚠️

Waktu tersisa: ${formatTime(timeLeft)}

Ketik *"nyerah"* untuk menyerah.

*[ 📋 Menu ]*`;
}

// Pesan tidak ada game
function createNoGameMessage() {
    return `*❌ TIDAK ADA GAME!* ❌

Tidak ada game tebak artis yang sedang berjalan.

Ketik *${mono('.tebakartis')}* untuk memulai game baru.

*[ 📋 Menu ]*`;
}

// ==================== FUNGSI UTAMA ====================

// Kirim gambar artis
async function sendArtistImage(conn, chatId, artist, gameId, userId) {
    try {
        // Coba kirim gambar
        const caption = `${artist.emoji || '🎭'} *Siapa artis ini?*\n\n*Hint:* ${artist.clue}\n${artist.hint ? `*Info:* ${artist.hint}` : ''}`;
        
        await conn.sendMessage(chatId, {
            image: { url: artist.image },
            caption: caption,
            buttons: [
                { 
                    buttonId: `tebakartis_${gameId}_menu`, 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
    } catch (error) {
        console.error('Error sending artist image:', error);
        // Fallback jika gambar error
        await conn.sendMessage(chatId, {
            text: `*${artist.emoji || '🎭'} TEBAK ARTIS* ${artist.emoji || '🎭'}

Gambar tidak dapat dimuat.

*📝 Clue:* ${artist.clue}
${artist.hint ? `*ℹ️ Info:* ${artist.hint}` : ''}

Kirim jawabanmu!`
        });
    }
}

// ==================== HANDLER PERINTAH ====================

// Handler .tebakartis
async function tebakArtisHandler(conn, msg, from, args, isOwner, isGroup) {
    const userId = msg.key.remoteJid;
    const chatId = from;
    const now = Date.now();
    
    // Cek cooldown
    if (cooldowns[userId] && now - cooldowns[userId] < config.cooldown * 1000) {
        const remaining = Math.ceil((config.cooldown * 1000 - (now - cooldowns[userId])) / 1000);
        await conn.sendMessage(chatId, {
            text: createCooldownMessage(remaining),
            buttons: [
                { 
                    buttonId: 'tebakartis_menu', 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        return;
    }
    
    // Cek game berjalan
    if (games[userId] && games[userId].active) {
        await conn.sendMessage(chatId, {
            text: createGameRunningMessage(games[userId].timeLeft),
            buttons: [
                { 
                    buttonId: `tebakartis_${games[userId].id}_menu`, 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        return;
    }
    
    // Pilih artis
    const artist = getRandomArtist(userId);
    const gameId = `game_${userId}_${now}`;
    
    // Simpan game state
    games[userId] = {
        id: gameId,
        artist: artist,
        active: true,
        startTime: now,
        timeLeft: config.timeout,
        answered: false,
        attempts: 0,
        chatId: chatId,
        userId: userId
    };
    
    // Set timeout
    const timer = setTimeout(async () => {
        if (games[userId] && games[userId].active) {
            games[userId].active = false;
            games[userId].timeLeft = 0;
            
            await conn.sendMessage(chatId, {
                text: createTimeoutMessage(artist),
                buttons: [
                    { 
                        buttonId: `tebakartis_${gameId}_menu`, 
                        buttonText: { displayText: '📋 Menu' }, 
                        type: 1 
                    }
                ],
                headerType: 1
            });
            
            delete games[userId];
        }
    }, config.timeout * 1000);
    
    games[userId].timer = timer;
    
    // Kirim gambar artis
    await sendArtistImage(conn, chatId, artist, gameId, userId);
    
    // Kirim pesan game
    const gameMessage = createGameMessage(artist, userId, gameId);
    await conn.sendMessage(chatId, {
        text: gameMessage,
        buttons: [
            { 
                buttonId: `tebakartis_${gameId}_menu`, 
                buttonText: { displayText: '📋 Menu' }, 
                type: 1 
            }
        ],
        headerType: 1
    });
    
    cooldowns[userId] = now;
}

// ==================== HANDLER JAWABAN ====================

// Handler jawaban
async function handleAnswer(conn, msg, from, text) {
    const userId = msg.key.remoteJid;
    const chatId = from;
    
    // Cek game
    if (!games[userId] || !games[userId].active) {
        await conn.sendMessage(chatId, {
            text: createNoGameMessage(),
            buttons: [
                { 
                    buttonId: 'tebakartis_menu', 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        return;
    }
    
    const game = games[userId];
    
    // Cek sudah dijawab
    if (game.answered) {
        await conn.sendMessage(chatId, {
            text: `*✅ SUDAH DIJAWAB!* ✅\n\nGame ini sudah selesai.\nKetik *${mono('.tebakartis')}* untuk game baru.`,
            buttons: [
                { 
                    buttonId: `tebakartis_${game.id}_menu`, 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        return;
    }
    
    // Handle "nyerah"
    if (text.toLowerCase() === 'nyerah') {
        game.active = false;
        game.answered = true;
        clearTimeout(game.timer);
        
        await conn.sendMessage(chatId, {
            text: createGiveUpMessage(game.artist),
            buttons: [
                { 
                    buttonId: `tebakartis_${game.id}_menu`, 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        
        delete games[userId];
        return;
    }
    
    // Cek jawaban
    const userAnswer = text.trim().toLowerCase();
    const correctAnswer = game.artist.name.toLowerCase();
    
    // Multiple check untuk jawaban
    const isCorrect = 
        userAnswer === correctAnswer ||
        userAnswer === game.artist.name.toLowerCase() ||
        userAnswer.replace(/\s+/g, '') === correctAnswer.replace(/\s+/g, '') ||
        correctAnswer.includes(userAnswer) ||
        userAnswer.includes(correctAnswer);
    
    if (isCorrect) {
        // Jawaban benar
        game.active = false;
        game.answered = true;
        clearTimeout(game.timer);
        
        await conn.sendMessage(chatId, {
            text: createCorrectMessage(game.artist, text, userId),
            buttons: [
                { 
                    buttonId: `tebakartis_${game.id}_menu`, 
                    buttonText: { displayText: '📋 Menu' }, 
                    type: 1 
                }
            ],
            headerType: 1
        });
        
        // Update reward (implementasikan sesuai database Anda)
        // await updateUserReward(userId, config.rewardLimit, config.rewardExp);
        
        delete games[userId];
    } else {
        // Jawaban salah
        game.attempts++;
        
        if (game.attempts >= config.maxAttempts) {
            // Kesempatan habis
            game.active = false;
            game.answered = true;
            clearTimeout(game.timer);
            
            await conn.sendMessage(chatId, {
                text: `*❌ KESEMPATAN HABIS!* ❌\n\n${createWrongMessage(game.artist, text, game.attempts)}\n\n*📝 Jawaban yang benar:* ${bold(game.artist.name)}`,
                buttons: [
                    { 
                        buttonId: `tebakartis_${game.id}_menu`, 
                        buttonText: { displayText: '📋 Menu' }, 
                        type: 1 
                    }
                ],
                headerType: 1
            });
            
            delete games[userId];
        } else {
            // Kirim pesan salah
            await conn.sendMessage(chatId, {
                text: createWrongMessage(game.artist, text, game.attempts),
                buttons: [
                    { 
                        buttonId: `tebakartis_${game.id}_menu`, 
                        buttonText: { displayText: '📋 Menu' }, 
                        type: 1 
                    }
                ],
                headerType: 1
            });
        }
    }
}

// ==================== HANDLER MENU ====================

// Handler menu
async function handleMenu(conn, chatId, userId, gameId) {
    const ownerName = botConfig.bot?.developer || 'RzkyADS';
    const ownerNumber = botConfig.owner?.number?.[0] || '';
    const ownerPhone = ownerNumber ? `+${ownerNumber}` : '-';
    const menuText = `*~ ${botConfig.bot?.name || 'NusaBot'}    ${ownerPhone}*

${ownerName} • Owner  
.menu

*📋 MENU UTAMA* 📋

*🎮 GAME:*
• ${mono('.tebakartis')} - Tebak nama artis
• ${mono('.tebakbendera')} - Tebak nama bendera

*📊 STATISTIK:*
• ${mono('.profile')} - Lihat profil
• ${mono('.leaderboard')} - Papan peringkat

*🔧 INFO:*
• ${mono('.help')} - Bantuan
• ${mono('.about')} - Tentang bot

*📱 KONTAK:*
• Owner: ${ownerName}
• WhatsApp: ${ownerPhone}

_Ketik perintah untuk mulai!_`;

    await conn.sendMessage(chatId, {
        text: menuText,
        buttons: [
            { 
                buttonId: 'menu_tebakartis', 
                buttonText: { displayText: '🎭 Tebak Artis' }, 
                type: 1 
            },
            { 
                buttonId: 'menu_tebakbendera', 
                buttonText: { displayText: '🏳️ Tebak Bendera' }, 
                type: 1 
            },
            { 
                buttonId: 'menu_profile', 
                buttonText: { displayText: '👤 Profile' }, 
                type: 1 
            }
        ],
        headerType: 1
    });
}

// ==================== PLUGIN UTAMA ====================

module.exports = {
    name: 'tebakartis',
    description: 'Game tebak nama artis dengan gambar',
    category: 'Game',
    usage: '.tebakartis',
    minLevel: config.minLevel,
    
    // Handler perintah .tebakartis
    async execute(conn, msg, from, args, isOwner, isGroup) {
        await tebakArtisHandler(conn, msg, from, args, isOwner, isGroup);
    },
    
    // Handler pesan (menangkap jawaban)
    async handleMessage(conn, msg, from, text, isOwner, isGroup) {
        if (text && games[msg.key.remoteJid] && games[msg.key.remoteJid].active) {
            await handleAnswer(conn, msg, from, text);
            return true;
        }
        return false;
    },
    
    // Handler button
    async handleButton(conn, msg, from, buttonId, isOwner, isGroup) {
        const userId = msg.key.remoteJid;
        
        if (buttonId.includes('_menu')) {
            const gameId = buttonId.replace('tebakartis_', '').replace('_menu', '');
            await handleMenu(conn, from, userId, gameId);
            return true;
        }
        
        if (buttonId === 'menu_tebakartis') {
            await tebakArtisHandler(conn, msg, from, [], isOwner, isGroup);
            return true;
        }
        
        return false;
    },
    
    // Helper functions
    getGameState(userId) {
        return games[userId] || null;
    },
    
    getAllGames() {
        return games;
    },
    
    // Cleanup
    cleanup() {
        const now = Date.now();
        for (const [userId, game] of Object.entries(games)) {
            if (!game.active || (now - game.startTime > config.timeout * 1000)) {
                if (game.timer) clearTimeout(game.timer);
                delete games[userId];
            }
        }
    }
};

// ==================== CLEANUP INTERVAL ====================

setInterval(() => {
    if (module.exports.cleanup) {
        module.exports.cleanup();
    }
}, 5 * 60 * 1000);

// ==================== FUNGSI REWARD ====================

// Implementasikan sesuai database Anda
async function updateUserReward(userId, limit, exp) {
    try {
        // Contoh implementasi
        // const user = await db.getUser(userId);
        // user.limit = (user.limit || 0) + limit;
        // user.exp = (user.exp || 0) + exp;
        // await db.updateUser(userId, user);
        console.log(`✅ User ${userId} mendapat +${limit} limit dan +${exp} EXP`);
    } catch (error) {
        console.error('Error updating reward:', error);
    }
}
