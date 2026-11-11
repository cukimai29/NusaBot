const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'blockade',
    alias: ['bade', 'gembok', 'blockzerotwo'],
    category: 'game',
    description: 'Game mengunci batu lawan ala Zero Two! Kunci semua batu lawan untuk menang.',
    usage: '.blockade [@lawan]',
    example: '.blockade @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

// ============ ZERO TWO THEME COLORS ============
const THEME = {
    bg: '#0a050f',
    bgGrad: ['#1a0b1a', '#0a050f'],
    primary: '#ff2a6d',
    secondary: '#ff0066',
    pink: '#ff1479',
    neon: '#ff69b4',
    textPrimary: '#ffffff',
    textSecondary: '#ff99bb',
    border: '#ff2a6d',
    glow: '#ff2a6d',
    p1: '#ff2a6d',  // Zero Two red/pink
    p2: '#ff69b4',  // Soft pink
    nodeEmpty: '#2a1a2a',
    nodeHighlight: '#ff66b5'
}

// Game connections (tetap sama)
const CONNECTIONS = {
    0: [1, 3, 4],
    1: [0, 2, 4],
    2: [1, 4, 5],
    3: [0, 4, 6],
    4: [0, 1, 2, 3, 5, 6, 7, 8],
    5: [2, 4, 8],
    6: [3, 4, 7],
    7: [6, 4, 8],
    8: [5, 4, 7]
}

const NODE_POS = [
    [80,  80],
    [240, 80],
    [400, 80],
    [80,  240],
    [240, 240],
    [400, 240],
    [80,  400],
    [240, 400],
    [400, 400],
]

const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
]

const FORBIDDEN_LINE_P1 = [0, 1, 2]
const FORBIDDEN_LINE_P2 = [6, 7, 8]

// Zero Two quotes untuk game
const ZERO_TWO_QUOTES = [
    "🦋 Darling, ayo tunjukkan kemampuanmu!",
    "💕 Jangan kalah ya, aku tonton kok~",
    "🌸 Hehe, seru nih main sama darling~",
    "🔥 Semangat! Kunci batu lawan!",
    "💖 Aku percaya kamu bisa menang!",
    "🎀 Darling, jangan nyerah ya~"
]

function getRandomQuote() {
    return ZERO_TWO_QUOTES[Math.floor(Math.random() * ZERO_TWO_QUOTES.length)]
}

function isForbiddenLine(line, turn) {
    const forbidden = turn === 'p1' ? FORBIDDEN_LINE_P1 : FORBIDDEN_LINE_P2
    return line.length === forbidden.length && line.every((n, i) => n === forbidden[i])
}

const sessions = new Map()

function createGame(p1, p2, firstTurn) {
    return {
        p1, p2,
        stonesP1: [0, 1, 2],
        stonesP2: [6, 7, 8],
        turn: firstTurn,
        selected: null,
        moveCount: 0,
        status: 'playing',
        lastBoardKey: null
    }
}

function getOccupied(game) {
    return new Set([...game.stonesP1, ...game.stonesP2])
}

function canMove(nodeIdx, occupied) {
    return CONNECTIONS[nodeIdx].some(n => !occupied.has(n))
}

function allBlocked(stones, occupied) {
    return stones.every(n => !canMove(n, occupied))
}

function isLoser(stones, occupied) {
    const blockedCount = stones.filter(n => !canMove(n, occupied)).length
    return blockedCount >= 2
}

function getAlignedLine(stones, turn) {
    const stoneSet = new Set(stones)
    return LINES.find(line =>
        line.every(n => stoneSet.has(n)) && !isForbiddenLine(line, turn)
    ) || null
}

// ============ RENDER BOARD ZERO TWO THEME ============
async function renderBoard(game, highlightNode = null, winLine = null) {
    const SIZE = 550
    const canvas = createCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d')

    // Background gradient (dark to pink)
    const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    bgGrad.addColorStop(0, THEME.bgGrad[0])
    bgGrad.addColorStop(1, THEME.bgGrad[1])
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Grid lines efek glow
    ctx.globalAlpha = 0.1
    for (let i = 0; i < SIZE; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, SIZE)
        ctx.strokeStyle = THEME.primary
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(SIZE, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Header ZERO TWO
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 22px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.shadowColor = THEME.glow
    ctx.shadowBlur = 10
    ctx.fillText('🦋 ZERO TWO BLOCKADE 🦋', SIZE / 2, 40)
    ctx.shadowBlur = 0

    // Subtitle
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px "Segoe UI"'
    ctx.fillText('"Kunci 2 batu lawan atau susun 3 sejajar~"', SIZE / 2, 65)

    // Highlight win line background
    if (winLine) {
        for (const nodeIdx of winLine) {
            const [x, y] = NODE_POS[nodeIdx]
            ctx.beginPath()
            ctx.arc(x + 35, y + 85, 35, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 105, 180, 0.3)'
            ctx.fill()
        }
        // Gambar garis kemenangan
        const [n0, n1, n2] = winLine
        ctx.beginPath()
        ctx.moveTo(NODE_POS[n0][0] + 35, NODE_POS[n0][1] + 85)
        ctx.lineTo(NODE_POS[n1][0] + 35, NODE_POS[n1][1] + 85)
        ctx.lineTo(NODE_POS[n2][0] + 35, NODE_POS[n2][1] + 85)
        ctx.strokeStyle = THEME.glow
        ctx.lineWidth = 6
        ctx.shadowBlur = 15
        ctx.stroke()
        ctx.shadowBlur = 0
    }

    // Garis koneksi antar node
    ctx.strokeStyle = THEME.secondary
    ctx.lineWidth = 3
    ctx.shadowBlur = 5
    ctx.shadowColor = THEME.secondary
    const drawn = new Set()
    for (let i = 0; i < 9; i++) {
        for (const j of CONNECTIONS[i]) {
            const key = [Math.min(i, j), Math.max(i, j)].join('-')
            if (drawn.has(key)) continue
            drawn.add(key)
            const [x1, y1] = NODE_POS[i]
            const [x2, y2] = NODE_POS[j]
            ctx.beginPath()
            ctx.moveTo(x1 + 35, y1 + 85)
            ctx.lineTo(x2 + 35, y2 + 85)
            ctx.stroke()
        }
    }
    ctx.shadowBlur = 0

    const occupied = getOccupied(game)

    // Node kosong
    for (let i = 0; i < 9; i++) {
        const [x, y] = NODE_POS[i]
        if (occupied.has(i)) continue
        ctx.beginPath()
        ctx.arc(x + 35, y + 85, 16, 0, Math.PI * 2)
        ctx.fillStyle = highlightNode === i ? THEME.nodeHighlight : THEME.nodeEmpty
        ctx.fill()
        ctx.strokeStyle = THEME.border
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = THEME.textSecondary
        ctx.font = 'bold 14px "Segoe UI"'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((i + 1).toString(), x + 35, y + 85)
    }

    // Batu P1 (Zero Two - Pink/Red)
    for (let idx = 0; idx < game.stonesP1.length; idx++) {
        const node = game.stonesP1[idx]
        const [x, y] = NODE_POS[node]
        const isSelected = game.selected !== null && game.turn === 'p1' && game.selected === idx
        const blocked = !canMove(node, occupied)
        const onWinLine = winLine && winLine.includes(node)

        ctx.beginPath()
        ctx.arc(x + 35, y + 85, 22, 0, Math.PI * 2)
        
        let gradient = ctx.createRadialGradient(x + 25, y + 75, 5, x + 35, y + 85, 22)
        if (blocked) {
            gradient.addColorStop(0, '#5a1a3a')
            gradient.addColorStop(1, '#3a0a2a')
        } else if (isSelected) {
            gradient.addColorStop(0, '#ff66b5')
            gradient.addColorStop(1, '#ff2a6d')
        } else {
            gradient.addColorStop(0, '#ff2a6d')
            gradient.addColorStop(1, '#cc0055')
        }
        ctx.fillStyle = gradient
        ctx.fill()
        
        ctx.strokeStyle = onWinLine ? THEME.glow : (isSelected ? '#ffff00' : THEME.pink)
        ctx.lineWidth = onWinLine ? 5 : (isSelected ? 4 : 2)
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 22px "Segoe UI"'
        ctx.fillText(blocked ? '🔒' : '🦋', x + 35, y + 85)
    }

    // Batu P2 (Soft Pink)
    for (let idx = 0; idx < game.stonesP2.length; idx++) {
        const node = game.stonesP2[idx]
        const [x, y] = NODE_POS[node]
        const isSelected = game.selected !== null && game.turn === 'p2' && game.selected === idx
        const blocked = !canMove(node, occupied)
        const onWinLine = winLine && winLine.includes(node)

        ctx.beginPath()
        ctx.arc(x + 35, y + 85, 22, 0, Math.PI * 2)
        
        let gradient = ctx.createRadialGradient(x + 25, y + 75, 5, x + 35, y + 85, 22)
        if (blocked) {
            gradient.addColorStop(0, '#4a2a5a')
            gradient.addColorStop(1, '#2a1a3a')
        } else if (isSelected) {
            gradient.addColorStop(0, '#ff99cc')
            gradient.addColorStop(1, '#ff69b4')
        } else {
            gradient.addColorStop(0, '#ff69b4')
            gradient.addColorStop(1, '#cc4499')
        }
        ctx.fillStyle = gradient
        ctx.fill()
        
        ctx.strokeStyle = onWinLine ? THEME.glow : (isSelected ? '#ffff00' : '#ff99cc')
        ctx.lineWidth = onWinLine ? 5 : (isSelected ? 4 : 2)
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 22px "Segoe UI"'
        ctx.fillText(blocked ? '🔒' : '💕', x + 35, y + 85)
    }

    // Footer dengan turn info
    const turnName = game.turn === 'p1'
        ? `🔴 ${game.p1.split('@')[0]}`
        : `💕 ${game.p2.split('@')[0]}`
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '13px "Segoe UI"'
    ctx.fillText(`✨ ${getRandomQuote()} ✨`, SIZE / 2, SIZE - 45)
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 16px "Segoe UI"'
    ctx.fillText(`🎮 Giliran: ${turnName}  |  Move #${game.moveCount + 1}`, SIZE / 2, SIZE - 18)
    
    // Watermark NusaBot
    ctx.fillStyle = `${THEME.primary}80`
    ctx.font = '10px "Segoe UI"'
    ctx.fillText('❥ NusaBot', SIZE - 70, SIZE - 8)

    return canvas.toBuffer('image/png')
}

function boardStatus(game) {
    const occupied = getOccupied(game)
    const p1stones = game.stonesP1.map((n, i) => {
        const bl = !canMove(n, occupied)
        return `${bl ? '🔒' : '🦋'} Batu ${i+1} → node ${n+1}`
    }).join('\n')
    const p2stones = game.stonesP2.map((n, i) => {
        const bl = !canMove(n, occupied)
        return `${bl ? '🔒' : '💕'} Batu ${i+1} → node ${n+1}`
    }).join('\n')
    return `🔴 *PLAYER 1:*\n${p1stones}\n\n💕 *PLAYER 2:*\n${p2stones}`
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
        if (!game) return m.reply('❌ Tidak ada game block yang sedang berjalan, darling~')
        if (game.p1 !== senderId && game.p2 !== senderId)
            return m.reply('❌ Darling, kamu gak main di sini deh~')
        const winner = game.p1 === senderId ? game.p2 : game.p1
        if (game.lastBoardKey) try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
        sessions.delete(chatId)
        return sock.sendMessage(chatId, {
            text: `🏳️ @${senderId.split('@')[0]} menyerah!\n\n🏆 @${winner.split('@')[0]} *MENANG!*\n\n🦋 *Zero Two:* Aduh darling~ lain kali jangan nyerah dong! 💕`,
            mentions: [senderId, winner]
        }, { quoted: m })
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
                `🦋 *ZERO TWO BLOCKADE* 🦋\n\n` +
                `🌸 *Cara menang:*\n` +
                `• 🔒 Kunci 2 batu lawan (gak bisa gerak)\n` +
                `• ✨ Susun 3 batumu *sejajar* (baris/kolom/diagonal)\n\n` +
                `🎀 *Aturan:*\n` +
                `• Masing-masing punya 3 batu\n` +
                `• Gerak lewat garis yang terhubung\n` +
                `• Gak boleh tempati node yang udah ada batu\n\n` +
                `💕 *Mulai:* ${prefix}blockade @lawan\n` +
                `🎮 *Gerak:* ${prefix}blockade [dari] [ke]\n` +
                `🏳️ *Nyerah:* ${prefix}blockade resign\n\n` +
                `✨ *Zero Two:* Siapa yang jadi pemenangnya, darling~?`
            )
        }

        const firstTurn = Math.random() < 0.5 ? 'p1' : 'p2'
        const game = createGame(senderId, opponent, firstTurn)
        sessions.set(chatId, game)

        const firstPlayer = firstTurn === 'p1' ? senderId : opponent
        const img = await renderBoard(game)
        const sentMsg = await sock.sendMessage(chatId, {
            image: img,
            caption: `🦋 *ZERO TWO BLOCKADE DIMULAI!* 🦋\n\n` +
                `🔴 *Player 1:* @${senderId.split('@')[0]} (node 1,2,3)\n` +
                `💕 *Player 2:* @${opponent.split('@')[0]} (node 7,8,9)\n\n` +
                `🎲 *Giliran pertama:* @${firstPlayer.split('@')[0]}\n\n` +
                `🌸 *Zero Two:* ${getRandomQuote()}`,
            mentions: [senderId, opponent, firstPlayer]
        }, { quoted: m })
        game.lastBoardKey = sentMsg?.key || null
        return
    }

    // Existing game - make move
    const game = sessions.get(chatId)
    const currentPlayer = game.turn === 'p1' ? game.p1 : game.p2

    if (senderId !== currentPlayer) {
        return m.reply(`⏳ *Bukan giliran kamu, darling!*\nTunggu @${currentPlayer.split('@')[0]} gerak dulu ya~ 💕`, { mentions: [currentPlayer] })
    }

    const fromNum = parseInt(args[0])
    const toNum = parseInt(args[1])

    if (!fromNum || !toNum || fromNum < 1 || fromNum > 9 || toNum < 1 || toNum > 9) {
        return m.reply(
            `❌ *Format salah, darling!*\n\n` +
            `Gunakan: \`${prefix}blockade [dari] [ke]\`\n` +
            `Contoh: \`${prefix}blockade 2 5\`\n\n` +
            boardStatus(game)
        )
    }

    const fromIdx = fromNum - 1
    const toIdx = toNum - 1
    const myStones = game.turn === 'p1' ? game.stonesP1 : game.stonesP2
    const occupied = getOccupied(game)

    const stoneIdx = myStones.indexOf(fromIdx)
    if (stoneIdx === -1)
        return m.reply(`❌ *Kamu gak punya batu di node ${fromNum}!*\n\n${boardStatus(game)}`)

    if (occupied.has(toIdx))
        return m.reply(`❌ *Node ${toNum} sudah ada batu, darling!*\n\n${boardStatus(game)}`)

    if (!CONNECTIONS[fromIdx].includes(toIdx)) {
        const validMoves = CONNECTIONS[fromIdx].filter(n => !occupied.has(n)).map(n => n + 1)
        return m.reply(
            `❌ *Gak ada jalur dari node ${fromNum} ke ${toNum}!*\n` +
            `Node ${fromNum} bisa ke: ${validMoves.length > 0 ? validMoves.join(', ') : '(semua terkunci!)'}`
        )
    }

    // Execute move
    if (game.turn === 'p1') {
        game.stonesP1[stoneIdx] = toIdx
    } else {
        game.stonesP2[stoneIdx] = toIdx
    }
    game.moveCount++

    const myNewStones = game.turn === 'p1' ? game.stonesP1 : game.stonesP2
    const nextTurn = game.turn === 'p1' ? 'p2' : 'p1'
    const nextStones = nextTurn === 'p1' ? game.stonesP1 : game.stonesP2
    const newOccupied = getOccupied(game)

    // Check win - Aligned line
    const alignedLine = getAlignedLine(myNewStones, game.turn)
    if (alignedLine) {
        const winner = game.turn === 'p1' ? game.p1 : game.p2
        const loser = game.turn === 'p1' ? game.p2 : game.p1
        const img = await renderBoard(game, null, alignedLine)
        if (game.lastBoardKey) try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
        sessions.delete(chatId)
        await sock.sendMessage(chatId, {
            image: img,
            caption: `✨ *SEJAJAR! MENANG!* ✨\n\n` +
                `🎉 @${winner.split('@')[0]} menyusun 3 batu sejajar!\n` +
                `📍 Node: ${alignedLine.map(n => n+1).join(' → ')}\n\n` +
                `🏆 *@${winner.split('@')[0]} MENANG!*\n` +
                `😔 @${loser.split('@')[0]} kalah~ :\n\n` +
                `🦋 *Zero Two:* Selamat ya darling~ ${winner.split('@')[0]} pinter! 💕\n\n` +
                `*Total ${game.moveCount} gerakan*`,
            mentions: [winner, loser]
        }, { quoted: m })
        return
    }

    // Check win - Locked 2 stones
    const loserCheck = isLoser(nextStones, newOccupied)
    const allBlockedCheck = allBlocked(nextStones, newOccupied)

    if (loserCheck || allBlockedCheck) {
        const winner = game.turn === 'p1' ? game.p1 : game.p2
        const loser = game.turn === 'p1' ? game.p2 : game.p1
        const blockedCount = nextStones.filter(n => !canMove(n, newOccupied)).length
        const img = await renderBoard(game)
        if (game.lastBoardKey) try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
        sessions.delete(chatId)
        await sock.sendMessage(chatId, {
            image: img,
            caption: `🔒 *TERKUNCI! MENANG!* 🔒\n\n` +
                `🔒 ${blockedCount} batu @${loser.split('@')[0]} terkunci!\n\n` +
                `🏆 *@${winner.split('@')[0]} MENANG!*\n` +
                `😔 @${loser.split('@')[0]} kalah~\n\n` +
                `🦋 *Zero Two:* Kuncian darling~ ${winner.split('@')[0]} jago banget! 💖\n\n` +
                `*Total ${game.moveCount} gerakan*`,
            mentions: [winner, loser]
        }, { quoted: m })
        return
    }

    // Continue game
    game.turn = nextTurn
    const nextPlayer = nextTurn === 'p1' ? game.p1 : game.p2
    const nextBlocked = nextStones.filter(n => !canMove(n, newOccupied)).length
    const img = await renderBoard(game)

    let caption = `♟ *Gerakan ke-${game.moveCount}*\n📍 ${fromNum} → ${toNum}\n\n`
    if (nextBlocked > 0) caption += `⚠️ ${nextBlocked} batu @${nextPlayer.split('@')[0]} terkunci!\n\n`
    caption += `🎮 *Giliran: ${nextTurn === 'p1' ? '🔴' : '💕'} @${nextPlayer.split('@')[0]}\n\n` +
        `💡 *Gerak:* \`${prefix}blockade [dari] [ke]\`\n\n` +
        `🦋 *Zero Two:* ${getRandomQuote()}`

    if (game.lastBoardKey) try { await sock.sendMessage(chatId, { delete: game.lastBoardKey }) } catch(e) {}
    
    const sentMsg = await sock.sendMessage(chatId, {
        image: img,
        caption: caption,
        mentions: [nextPlayer]
    }, { quoted: m })
    game.lastBoardKey = sentMsg?.key || null
}

module.exports = { config: pluginConfig, handler }