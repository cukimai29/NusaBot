const { createCanvas } = require('@napi-rs/canvas')

const pluginConfig = {
    name: 'suitduel',
    alias: ['suit', 'suten', 'batu-gunting-kertas', 'zerogames'],
    category: 'game',
    description: 'Game suit (batu-gunting-kertas) Zero Two! Kumpulkan 10 poin untuk menang.',
    usage: '.suitduel [@lawan]',
    example: '.suitduel @user',
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
    glow: '#ff2a6d',
    win: '#ffd700',
    lose: '#ff6b9d'
}

const EMOTES = {
    batu: '🪨',
    gunting: '✂️',
    kertas: '📄'
}

const QUOTES = {
    start: "🦋 Ayo suit-suitan! Batu-gunting-kertas~ darling! 💕",
    win: "🏆 Selamat darling! Kamu jago banget main suit! 💖",
    lose: "💀 Aduh kalah~ lain kali cobain strategi baru ya! 🦋",
    draw: "🤝 Seri! Ayo ulang lagi, darling! 🔥",
    choose: "🌸 Batu, gunting, atau kertas? Pilih dengan bijak ya~",
    combo: "✨ WOW! Combo beruntun! +1 poin bonus! ✨"
}

function getRandomQuote(type) {
    return QUOTES[type] || QUOTES.start
}

function suitResult(p1, p2) {
    if (p1 === p2) return 'draw'
    const rules = {
        batu: 'gunting',
        gunting: 'kertas',
        kertas: 'batu'
    }
    return rules[p1] === p2 ? 'p1_win' : 'p2_win'
}

const sessions = new Map()

function createGame(p1, p2, firstTurn) {
    return {
        p1, p2,
        scoreP1: 0,
        scoreP2: 0,
        turn: firstTurn,
        status: 'waiting_choice',
        lastBoardKey: null,
        round: 1,
        p1Choice: null,
        p2Choice: null,
        p1Combo: 0,
        p2Combo: 0,
        lastWinner: null
    }
}

function emojiToChoice(input) {
    if (!input) return null
    const lower = input.toLowerCase()
    if (lower === 'batu' || lower === '🪨') return 'batu'
    if (lower === 'gunting' || lower === '✂️' || lower === 'gunting') return 'gunting'
    if (lower === 'kertas' || lower === '📄') return 'kertas'
    return null
}

async function renderBoard(game, lastResult = null) {
    try {
        const W = 600
        const H = 500
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')

        const grad = ctx.createLinearGradient(0, 0, W, H)
        grad.addColorStop(0, '#0a050f')
        grad.addColorStop(1, '#1a0b1a')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)

        ctx.fillStyle = THEME.primary
        ctx.font = 'bold 24px "Segoe UI"'
        ctx.textAlign = 'center'
        ctx.shadowColor = THEME.glow
        ctx.shadowBlur = 10
        ctx.fillText('🃏 ZERO TWO SUIT DUEL 🃏', W/2, 45)
        ctx.shadowBlur = 0

        ctx.fillStyle = THEME.textSecondary
        ctx.font = '12px "Segoe UI"'
        ctx.fillText('"Batu, Gunting, Kertas ~ Siapa menang?"', W/2, 75)

        const p1Name = game.p1.split('@')[0].substring(0, 12)
        const p2Name = game.p2.split('@')[0].substring(0, 12)
        
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
        
        if (game.p1Combo > 1) {
            ctx.font = 'bold 10px "Segoe UI"'
            ctx.fillStyle = THEME.win
            ctx.fillText(`🔥 ${game.p1Combo} combo!`, 160, 195)
        }
        
        ctx.fillStyle = `${THEME.secondary}20`
        ctx.fillRect(320, 100, 240, 100)
        ctx.strokeStyle = THEME.secondary
        ctx.strokeRect(320, 100, 240, 100)
        
        ctx.fillStyle = THEME.secondary
        ctx.font = 'bold 14px "Segoe UI"'
        ctx.fillText('💕 PLAYER 2', 440, 130)
        ctx.font = 'bold 32px "Segoe UI"'
        ctx.fillText(`${game.scoreP2}`, 440, 175)
        
        if (game.p2Combo > 1) {
            ctx.font = 'bold 10px "Segoe UI"'
            ctx.fillStyle = THEME.win
            ctx.fillText(`🔥 ${game.p2Combo} combo!`, 440, 195)
        }

        ctx.fillStyle = THEME.textSecondary
        ctx.font = 'bold 18px "Segoe UI"'
        ctx.fillText('VS', W/2, 148)

        ctx.fillStyle = THEME.textSecondary
        ctx.font = '12px "Segoe UI"'
        ctx.fillText(`🎯 Target: 10 poin | Round ${game.round}`, W/2, 225)

        if (game.p1Choice && game.p2Choice) {
            const p1Emoji = EMOTES[game.p1Choice]
            const p2Emoji = EMOTES[game.p2Choice]
            
            ctx.font = 'bold 48px "Segoe UI"'
            ctx.fillStyle = THEME.primary
            ctx.fillText(p1Emoji, W/2 - 80, 320)
            ctx.fillStyle = THEME.secondary
            ctx.fillText(p2Emoji, W/2 + 40, 320)
            
            ctx.fillStyle = THEME.textSecondary
            ctx.font = 'bold 14px "Segoe UI"'
            ctx.fillText('VS', W/2, 320)
        } else {
            ctx.fillStyle = THEME.textSecondary
            ctx.font = 'bold 14px "Segoe UI"'
            ctx.fillText('❓ Belum pilih ❓', W/2, 320)
            ctx.fillStyle = `${THEME.textSecondary}80`
            ctx.font = '12px "Segoe UI"'
            ctx.fillText('Pilih batu/gunting/kertas', W/2, 345)
        }

        if (lastResult) {
            ctx.fillStyle = THEME.win
            ctx.font = 'bold 14px "Segoe UI"'
            ctx.fillText(lastResult, W/2, 390)
        }

        if (game.status === 'waiting_choice') {
            const waitingPlayer = game.turn === 'p1' ? game.p1.split('@')[0] : game.p2.split('@')[0]
            ctx.fillStyle = THEME.primary
            ctx.font = 'bold 14px "Segoe UI"'
            ctx.fillText(`🎮 Giliran @${waitingPlayer} pilih suit`, W/2, 430)
        }

        ctx.fillStyle = `${THEME.primary}80`
        ctx.font = '10px "Segoe UI"'
        ctx.fillText('❥ NusaBot', W - 70, H - 15)

        return canvas.toBuffer('image/png')
    } catch (err) {
        console.error('[SUITDUEL] Render board error:', err)
        throw err
    }
}

function checkWinner(game) {
    if (game.scoreP1 >= 10) return game.p1
    if (game.scoreP2 >= 10) return game.p2
    return null
}

async function handler(m, { sock, config: botConfig }) {
    try {
        console.log('[SUITDUEL] Command dipanggil oleh:', m.sender)
        
        const chatId = m.chat
        const senderId = m.sender
        const prefix = botConfig.command?.prefix || '.'
        const text = m.text?.trim() || ''
        const args = text.split(/\s+/).slice(1)
        const sub = args[0]?.toLowerCase()

        console.log('[SUITDUEL] Args:', args, 'Sub:', sub)

        // Resign
        if (sub === 'resign' || sub === 'nyerah') {
            const game = sessions.get(chatId)
            if (!game) return m.reply('❌ Gak ada game suit yang jalan, darling~')
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

        // Pilih suit
        const choice = emojiToChoice(sub)
        console.log('[SUITDUEL] Choice detected:', choice, 'from:', sub)
        
        if (choice && sessions.has(chatId)) {
            const game = sessions.get(chatId)
            
            const currentPlayerId = game.turn === 'p1' ? game.p1 : game.p2
            if (senderId !== currentPlayerId) {
                const waitPlayer = game.turn === 'p1' ? game.p1.split('@')[0] : game.p2.split('@')[0]
                return m.reply(`⏳ Bukan giliran kamu, darling!\nTunggu @${waitPlayer} pilih dulu ya~ 🦋`)
            }
            
            if (game.turn === 'p1') {
                game.p1Choice = choice
            } else {
                game.p2Choice = choice
            }
            
            // Proses jika kedua sudah pilih
            if (game.p1Choice && game.p2Choice) {
                const result = suitResult(game.p1Choice, game.p2Choice)
                let resultText = ''
                
                if (result === 'p1_win') {
                    game.scoreP1 += 1
                    game.p1Combo++
                    game.p2Combo = 0
                    game.lastWinner = 'p1'
                    resultText = `🔴 @${game.p1.split('@')[0]} MENANG! +1 poin!`
                    
                    if (game.p1Combo === 3) {
                        game.scoreP1 += 1
                        resultText += `\n✨ COMBO! +1 poin bonus! ✨`
                    }
                } else if (result === 'p2_win') {
                    game.scoreP2 += 1
                    game.p2Combo++
                    game.p1Combo = 0
                    game.lastWinner = 'p2'
                    resultText = `💕 @${game.p2.split('@')[0]} MENANG! +1 poin!`
                    
                    if (game.p2Combo === 3) {
                        game.scoreP2 += 1
                        resultText += `\n✨ COMBO! +1 poin bonus! ✨`
                    }
                } else {
                    game.p1Combo = 0
                    game.p2Combo = 0
                    resultText = `🤝 SERI! Gak ada poin, ulang lagi!`
                    game.lastWinner = null
                }
                
                game.p1Choice = null
                game.p2Choice = null
                game.round++
                
                const winner = checkWinner(game)
                if (winner) {
                    const loser = winner === game.p1 ? game.p2 : game.p1
                    const img = await renderBoard(game, resultText)
                    sessions.delete(chatId)
                    return sock.sendMessage(chatId, {
                        image: img,
                        caption: `🎉 *ZERO TWO SUIT DUEL - GAME OVER!* 🎉\n\n` +
                            `🏆 @${winner.split('@')[0]} *MENANG!*\n` +
                            `📊 Skor akhir: ${game.scoreP1} vs ${game.scoreP2}\n\n` +
                            `${getRandomQuote('win')}`,
                        mentions: [winner, loser]
                    }, { quoted: m })
                }
                
                if (result !== 'draw') {
                    game.turn = game.turn === 'p1' ? 'p2' : 'p1'
                }
                
                const nextPlayer = game.turn === 'p1' ? game.p1 : game.p2
                const img = await renderBoard(game, resultText)
                
                if (game.lastBoardKey) {
                    try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
                }
                
                const sentMsg = await sock.sendMessage(chatId, {
                    image: img,
                    caption: `${resultText}\n\n🎮 Giliran @${nextPlayer.split('@')[0]} pilih suit!\n\n` +
                        `🪨 batu | ✂️ gunting | 📄 kertas\n` +
                        `Contoh: *${prefix}suitduel batu*`,
                    mentions: [nextPlayer]
                }, { quoted: m })
                game.lastBoardKey = sentMsg?.key || null
                return
            }
            
            const img = await renderBoard(game)
            if (game.lastBoardKey) {
                try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
            }
            
            const sentMsg = await sock.sendMessage(chatId, {
                image: img,
                caption: `✅ @${senderId.split('@')[0]} memilih ${EMOTES[choice]}!\n\n⏳ Tunggu lawan pilih suit...`,
                mentions: [senderId]
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
                    `🃏 *ZERO TWO SUIT DUEL* 🃏\n\n` +
                    `🌸 *Cara main:*\n` +
                    `• Pilih: batu 🪨 / gunting ✂️ / kertas 📄\n` +
                    `• Menang +1 poin\n` +
                    `• Combo 3x menang beruntun +1 poin bonus!\n\n` +
                    `🎯 *Target:* 10 poin untuk menang!\n\n` +
                    `💕 *Mulai:* ${prefix}suitduel @lawan\n` +
                    `🎮 *Pilih:* ${prefix}suitduel batu\n` +
                    `🏳️ *Nyerah:* ${prefix}suitduel resign`
                )
            }

            const firstTurn = Math.random() < 0.5 ? 'p1' : 'p2'
            const game = createGame(senderId, opponent, firstTurn)
            sessions.set(chatId, game)

            const firstPlayer = firstTurn === 'p1' ? senderId : opponent
            const img = await renderBoard(game)
            
            const sentMsg = await sock.sendMessage(chatId, {
                image: img,
                caption: `🃏 *ZERO TWO SUIT DUEL DIMULAI!* 🃏\n\n` +
                    `🔴 *Player 1:* @${senderId.split('@')[0]}\n` +
                    `💕 *Player 2:* @${opponent.split('@')[0]}\n\n` +
                    `🎲 *Giliran pertama:* @${firstPlayer.split('@')[0]}\n\n` +
                    `${getRandomQuote('start')}\n\n` +
                    `📌 *Pilih suit:*\n` +
                    `• ${prefix}suitduel batu\n` +
                    `• ${prefix}suitduel gunting\n` +
                    `• ${prefix}suitduel kertas\n\n` +
                    `✨ *Bonus Combo:* 3x menang beruntun +1 poin!`,
                mentions: [senderId, opponent, firstPlayer]
            }, { quoted: m })
            game.lastBoardKey = sentMsg?.key || null
            return
        }

        const game = sessions.get(chatId)
        const img = await renderBoard(game)
        const currentPlayer = game.turn === 'p1' ? game.p1 : game.p2
        return sock.sendMessage(m.chat, {
            image: img,
            caption: `🃏 *SUIT DUEL ACTIVE*\n\n` +
                `🔴 ${game.p1.split('@')[0]}: ${game.scoreP1} poin\n` +
                `💕 ${game.p2.split('@')[0]}: ${game.scoreP2} poin\n\n` +
                `🎯 Target 10 poin!\n\n` +
                `🎮 Giliran @${currentPlayer.split('@')[0]}\n\n` +
                `📌 *Pilih suit:*\n` +
                `• ${prefix}suitduel batu\n` +
                `• ${prefix}suitduel gunting\n` +
                `• ${prefix}suitduel kertas`,
            mentions: [currentPlayer]
        }, { quoted: m })
        
    } catch (err) {
        console.error('[SUITDUEL] ERROR DETAIL:', err)
        console.error('[SUITDUEL] Stack trace:', err.stack)
        await m.reply(`❌ Terjadi kesalahan: ${err.message}\n\nCoba lagi ya darling~ 🦋`)
    }
}

module.exports = { config: pluginConfig, handler }