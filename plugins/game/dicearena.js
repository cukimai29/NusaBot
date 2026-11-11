const { createCanvas } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'dicearena',
    alias: ['dice', 'lembarda', 'zerodice'],
    category: 'game',
    description: 'Game dadu Zero Two! Kumpulkan 30 poin untuk menang.',
    usage: '.dicearena [@lawan]',
    example: '.dicearena @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// ============ ZERO TWO THEME ============
const THEME = {
    bg: '#0a050f',
    primary: '#ff2a6d',
    secondary: '#ff69b4',
    textPrimary: '#ffffff',
    textSecondary: '#ff99bb',
    glow: '#ff2a6d'
}

// Zero Two quotes
const QUOTES = {
    start: "🦋 Ayo main dadu, darling~ siapa paling beruntung? 💕",
    roll: ["🎲 Hora~ lagi lempar nih!", "🌸 Darling, semoga dapet 6 ya~", "💕 Aku doain yang terbaik!", "🔥 Awas kalo dapet 1!"],
    win: "🏆 Selamat darling~ kamu jago banget! 💖",
    lose: "😭 Aduh, kalah ya~ lain kali cobain lagi ya! 🦋",
    six: "✨ WAH DAPET 6! Giliran lagi ya darling~ ✨",
    one: "💀 Aduh dapet 1... poin hangus nih~ 💀"
}

function getRandomQuote(type) {
    if (type === 'roll') {
        return QUOTES.roll[Math.floor(Math.random() * QUOTES.roll.length)]
    }
    return QUOTES[type] || QUOTES.start
}

// Sessions
const sessions = new Map()

function createGame(p1, p2, firstTurn) {
    return {
        p1, p2,
        scoreP1: 0,
        scoreP2: 0,
        turn: firstTurn,
        currentRoll: null,
        currentPoints: 0,
        status: 'playing',
        lastBoardKey: null,
        round: 1
    }
}

// Gambar dadu di canvas
function drawDice(ctx, x, y, size, value) {
    const dotSize = size / 6
    const dotPositions = {
        1: [[0, 0]],
        2: [[-1, -1], [1, 1]],
        3: [[-1, -1], [0, 0], [1, 1]],
        4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
        6: [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1]]
    }

    ctx.save()
    ctx.shadowBlur = 0
    
    // Kotak dadu dengan gradien
    const grad = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#ffe0e8')
    ctx.fillStyle = grad
    ctx.fillRect(x - size/2, y - size/2, size, size)
    
    ctx.strokeStyle = THEME.primary
    ctx.lineWidth = 3
    ctx.strokeRect(x - size/2, y - size/2, size, size)
    
    ctx.fillStyle = THEME.primary
    const positions = dotPositions[value] || dotPositions[1]
    for (const [dx, dy] of positions) {
        ctx.beginPath()
        ctx.arc(x + dx * dotSize * 1.5, y + dy * dotSize * 1.5, dotSize * 0.6, 0, Math.PI * 2)
        ctx.fill()
    }
    
    ctx.restore()
}

// Render board game
async function renderBoard(game, diceValue = null) {
    const W = 600
    const H = 500
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#0a050f')
    grad.addColorStop(1, '#1a0b1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Header
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 24px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.shadowColor = THEME.glow
    ctx.shadowBlur = 10
    ctx.fillText('🎲 ZERO TWO DICE ARENA 🎲', W/2, 45)
    ctx.shadowBlur = 0

    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px "Segoe UI"'
    ctx.fillText('"Lempar dadu, kumpulin 30 poin!"', W/2, 75)

    // Score board
    const p1Name = game.p1.split('@')[0].substring(0, 12)
    const p2Name = game.p2.split('@')[0].substring(0, 12)
    
    // Box P1
    ctx.fillStyle = `${THEME.primary}20`
    ctx.fillRect(40, 100, 240, 100)
    ctx.strokeStyle = THEME.primary
    ctx.lineWidth = 2
    ctx.strokeRect(40, 100, 240, 100)
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 14px "Segoe UI"'
    ctx.fillText('🔴 PLAYER 1', 160, 130)
    ctx.font = 'bold 32px "Segoe UI"'
    ctx.fillText(`${game.scoreP1}`, 160, 175)
    
    // Box P2
    ctx.fillStyle = `${THEME.secondary}20`
    ctx.fillRect(320, 100, 240, 100)
    ctx.strokeStyle = THEME.secondary
    ctx.strokeRect(320, 100, 240, 100)
    
    ctx.fillStyle = THEME.secondary
    ctx.font = 'bold 14px "Segoe UI"'
    ctx.fillText('💕 PLAYER 2', 440, 130)
    ctx.font = 'bold 32px "Segoe UI"'
    ctx.fillText(`${game.scoreP2}`, 440, 175)

    // VS
    ctx.fillStyle = THEME.textSecondary
    ctx.font = 'bold 18px "Segoe UI"'
    ctx.fillText('VS', W/2, 148)

    // Target
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px "Segoe UI"'
    ctx.fillText(`🎯 Target: 30 poin | Round ${game.round}`, W/2, 225)

    // Dice area
    if (diceValue) {
        drawDice(ctx, W/2, 310, 80, diceValue)
    } else {
        // Dadu kosong
        ctx.fillStyle = '#2a1a2a'
        ctx.fillRect(W/2 - 40, 270, 80, 80)
        ctx.strokeStyle = THEME.border || THEME.primary
        ctx.lineWidth = 2
        ctx.strokeRect(W/2 - 40, 270, 80, 80)
        ctx.fillStyle = THEME.textSecondary
        ctx.font = 'bold 12px "Segoe UI"'
        ctx.fillText('🎲', W/2, 310)
    }

    // Turn indicator
    const turnName = game.turn === 'p1' ? game.p1.split('@')[0] : game.p2.split('@')[0]
    ctx.fillStyle = game.turn === 'p1' ? THEME.primary : THEME.secondary
    ctx.font = 'bold 16px "Segoe UI"'
    ctx.fillText(`✨ Giliran: @${turnName} ✨`, W/2, 400)

    // Current points
    if (game.currentPoints > 0) {
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 14px "Segoe UI"'
        ctx.fillText(`🎲 Poin turn ini: ${game.currentPoints}`, W/2, 435)
    }

    // Footer
    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '10px "Segoe UI"'
    ctx.fillText('❥ NusaBot', W - 70, H - 15)

    return canvas.toBuffer('image/png')
}

function getWinner(game) {
    if (game.scoreP1 >= 30) return game.p1
    if (game.scoreP2 >= 30) return game.p2
    return null
}

async function handler(m, { sock, config: botConfig }) {
    const chatId = m.chat
    const senderId = m.sender
    const prefix = botConfig.command?.prefix || '.'
    const args = (m.body || '').trim().split(/\s+/).slice(1)
    const sub = args[0]?.toLowerCase()

    // Resign
    if (sub === 'resign' || sub === 'nyerah') {
        const game = sessions.get(chatId)
        if (!game) return m.reply('❌ Gak ada game dadu yang jalan, darling~')
        if (game.p1 !== senderId && game.p2 !== senderId)
            return m.reply('❌ Darling, kamu gak main di sini~')
        
        const winner = game.p1 === senderId ? game.p2 : game.p1
        sessions.delete(chatId)
        return m.reply(
            `🏳️ @${senderId.split('@')[0]} menyerah!\n\n` +
            `🏆 @${winner.split('@')[0]} *MENANG!*\n\n` +
            `${getRandomQuote('win')}`
        )
    }

    // Roll dice - command .dice
    if (sub === 'roll' || sub === 'lempar' || sub === 'r') {
        const game = sessions.get(chatId)
        if (!game) return m.reply(`❌ Gak ada game dadu aktif, darling!\nMulai dengan *${prefix}dicearena @lawan*`)
        
        const currentPlayerId = game.turn === 'p1' ? game.p1 : game.p2
        if (senderId !== currentPlayerId) {
            const waitPlayer = game.turn === 'p1' ? game.p1.split('@')[0] : game.p2.split('@')[0]
            return m.reply(`⏳ Bukan giliran kamu, darling!\nTunggu @${waitPlayer} lempar dulu ya~ 🦋`)
        }

        // Roll dice
        const dice = Math.floor(Math.random() * 6) + 1
        game.currentRoll = dice
        let response = `${getRandomQuote('roll')}\n\n🎲 *Dadu: ${dice}*\n`

        if (dice === 6) {
            // Dapet 6 -> bonus turn, tambah poin
            game.currentPoints += 6
            response += `✨ *KENA 6!* +6 poin + giliran lagi!\n📊 Poin turn ini: ${game.currentPoints}\n\n`
            response += `🎲 Ketik *${prefix}dicearena roll* untuk lempar lagi!`
            
            const img = await renderBoard(game, dice)
            if (game.lastBoardKey) {
                try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
            }
            const sentMsg = await sock.sendMessage(chatId, { image: img, caption: response, mentions: [currentPlayerId] }, { quoted: m })
            game.lastBoardKey = sentMsg?.key || null
            return
        }
        
        if (dice === 1) {
            // Dapet 1 -> poin hangus, ganti giliran
            game.currentPoints = 0
            response += `💀 *DAPET 1!* Poin hangus dan giliran berpindah! 💀\n\n`
            response += `🔄 Giliran pindah ke lawan~`
            
            // Pindah giliran
            game.turn = game.turn === 'p1' ? 'p2' : 'p1'
        } else {
            // Normal: tambah poin, ganti giliran
            game.currentPoints += dice
            response += `✅ +${dice} poin!\n📊 Poin turn ini: ${game.currentPoints}\n`
            
            // Konfirmasi poin atau lanjut?
            response += `\n📌 *Dice lagi?* (Ketik *${prefix}dicearena roll* lagi)\n`
            response += `📌 *Simpan poin?* (Ketik *${prefix}dicearena hold* untuk simpan dan ganti giliran)`
            
            const img = await renderBoard(game, dice)
            if (game.lastBoardKey) {
                try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
            }
            const sentMsg = await sock.sendMessage(chatId, { image: img, caption: response, mentions: [currentPlayerId] }, { quoted: m })
            game.lastBoardKey = sentMsg?.key || null
            return
        }
        
        // Handle untuk dice 1 (udah pindah turn otomatis)
        const nextPlayer = game.turn === 'p1' ? game.p1 : game.p2
        const img = await renderBoard(game, dice)
        if (game.lastBoardKey) {
            try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
        }
        const sentMsg = await sock.sendMessage(chatId, { 
            image: img, 
            caption: response + `\n\n🎮 Giliran: @${nextPlayer.split('@')[0]}\nKetik *${prefix}dicearena roll* untuk mulai lempar.`,
            mentions: [nextPlayer]
        }, { quoted: m })
        game.lastBoardKey = sentMsg?.key || null
        return
    }

    // Hold / simpan poin
    if (sub === 'hold' || sub === 'simpan') {
        const game = sessions.get(chatId)
        if (!game) return m.reply(`❌ Gak ada game dadu aktif!`)
        
        const currentPlayerId = game.turn === 'p1' ? game.p1 : game.p2
        if (senderId !== currentPlayerId) {
            return m.reply(`⏳ Bukan giliran kamu, darling!`)
        }
        
        if (game.currentPoints === 0) {
            return m.reply(`❌ Kamu belum lempar dadu, darling!\nKetik *${prefix}dicearena roll* dulu~ 🎲`)
        }
        
        // Simpan poin ke total
        if (game.turn === 'p1') {
            game.scoreP1 += game.currentPoints
        } else {
            game.scoreP2 += game.currentPoints
        }
        
        const totalScore = game.turn === 'p1' ? game.scoreP1 : game.scoreP2
        game.currentPoints = 0
        game.round++
        
        // Cek kemenangan
        if (game.scoreP1 >= 30 || game.scoreP2 >= 30) {
            const winner = game.scoreP1 >= 30 ? game.p1 : game.p2
            const loser = game.scoreP1 >= 30 ? game.p2 : game.p1
            const img = await renderBoard(game)
            
            sessions.delete(chatId)
            return sock.sendMessage(chatId, {
                image: img,
                caption: `🎉 *ZERO TWO DICE ARENA - GAME OVER!* 🎉\n\n` +
                    `🏆 @${winner.split('@')[0]} *MENANG!*\n` +
                    `📊 Skor akhir: ${game.scoreP1} vs ${game.scoreP2}\n\n` +
                    `${getRandomQuote('win')}\n\n` +
                    `🦋 *Zero Two:* ${getRandomQuote('win')}`,
                mentions: [winner, loser]
            }, { quoted: m })
        }
        
        // Pindah giliran
        game.turn = game.turn === 'p1' ? 'p2' : 'p1'
        const nextPlayer = game.turn === 'p1' ? game.p1 : game.p2
        
        const img = await renderBoard(game)
        if (game.lastBoardKey) {
            try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
        }
        const sentMsg = await sock.sendMessage(chatId, {
            image: img,
            caption: `✅ Poin disimpan! Total: ${totalScore}\n\n` +
                `🔄 Giliran pindah ke @${nextPlayer.split('@')[0]}\n\n` +
                `🎲 Ketik *${prefix}dicearena roll* untuk lempar dadu~\n\n` +
                `🎯 Target 30 poin!`,
            mentions: [nextPlayer]
        }, { quoted: m })
        game.lastBoardKey = sentMsg?.key || null
        return
    }

    // Start new game
    if (!sessions.has(chatId)) {
        const mentioned = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        let opponent = mentioned
        if (!opponent && args[0]) {
            const num = args[0].replace(/[^0-9]/g, '')
            if (num) opponent = num + '@s.whatsapp.net'
        }

        if (!opponent || opponent === senderId) {
            return m.reply(
                `🎲 *ZERO TWO DICE ARENA* 🎲\n\n` +
                `🌸 *Cara main:*\n` +
                `• Lempar dadu (1-6)\n` +
                `• Dapet 6 → +6 poin + giliran lagi\n` +
                `• Dapet 1 → poin hangus, ganti giliran\n` +
                `• Klik *hold* untuk simpan poin dan ganti giliran\n\n` +
                `🎯 *Target:* 30 poin untuk menang!\n\n` +
                `💕 *Mulai:* ${prefix}dicearena @lawan`
            )
        }

        const firstTurn = Math.random() < 0.5 ? 'p1' : 'p2'
        const game = createGame(senderId, opponent, firstTurn)
        sessions.set(chatId, game)

        const firstPlayer = firstTurn === 'p1' ? senderId : opponent
        const img = await renderBoard(game)
        
        const sentMsg = await sock.sendMessage(chatId, {
            image: img,
            caption: `🎲 *ZERO TWO DICE ARENA DIMULAI!* 🎲\n\n` +
                `🔴 *Player 1:* @${senderId.split('@')[0]}\n` +
                `💕 *Player 2:* @${opponent.split('@')[0]}\n\n` +
                `🎲 *Giliran pertama:* @${firstPlayer.split('@')[0]}\n\n` +
                `${getRandomQuote('start')}\n\n` +
                `📌 *${prefix}dicearena roll* - lempar dadu\n` +
                `📌 *${prefix}dicearena hold* - simpan poin\n` +
                `📌 *${prefix}dicearena resign* - nyerah`,
            mentions: [senderId, opponent, firstPlayer]
        }, { quoted: m })
        game.lastBoardKey = sentMsg?.key || null
        return
    }

    // Default - show status
    const game = sessions.get(chatId)
    const img = await renderBoard(game)
    return sock.sendMessage(m.chat, {
        image: img,
        caption: `🎲 *DICE ARENA ACTIVE*\n\n` +
            `🔴 ${game.p1.split('@')[0]}: ${game.scoreP1} poin\n` +
            `💕 ${game.p2.split('@')[0]}: ${game.scoreP2} poin\n\n` +
            `🎯 Target 30 poin!\n\n` +
            `🎮 *${prefix}dicearena roll* - lempar\n` +
            `📌 *${prefix}dicearena hold* - simpan\n` +
            `🏳️ *${prefix}dicearena resign* - nyerah`
    }, { quoted: m })
}

module.exports = { config: pluginConfig, handler }