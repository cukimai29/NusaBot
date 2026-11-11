const crypto = require('crypto')

const pluginConfig = {
    name: 'tictactoe',
    alias: ['ttt', 'ttc'],
    category: 'game',
    description: 'Game Tic Tac Toe melawan komputer',
    usage: '.tictactoe',
    example: '.tictactoe',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const ticTacToeHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tic Tac Toe</title>
<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
    user-select: none;
}

body {
    background: #0b0b2a;
    color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 320px;
    text-align: center;
}

.title {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 3px;
    margin-bottom: 8px;
}

.status {
    color: #aaaac5;
    font-size: 15px;
    margin-bottom: 25px;
}

.board {
    width: 280px;
    height: 280px;
    margin: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
}
.cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid white;
    cursor: pointer;
}

.cell:nth-child(1),
.cell:nth-child(2),
.cell:nth-child(3) {
    border-top: 0;
}

.cell:nth-child(7),
.cell:nth-child(8),
.cell:nth-child(9) {
    border-bottom: 0;
}

.cell:nth-child(1),
.cell:nth-child(4),
.cell:nth-child(7) {
    border-left: 0;
}

.cell:nth-child(3),
.cell:nth-child(6),
.cell:nth-child(9) {
    border-right: 0;
}

.cell.x::before,
.cell.x::after {
    content: "";
    position: absolute;
    width: 15%;
    height: 75%;
    background: #e0f0ff;
    border-radius: 5px;
    box-shadow:
        0 0 15px #0044ff,
        0 0 30px #0044ff;
}

.cell.x::before {
    transform: rotate(45deg);
}

.cell.x::after {
    transform: rotate(-45deg);
}

.cell.o::before {
    content: "";
    position: absolute;
    width: 58%;
    height: 58%;
    border-radius: 50%;
    border: 9px solid #ffe0e0;
    box-shadow:
        0 0 15px #ff0044,
        0 0 30px #ff0044,
        inset 0 0 15px #ff0044;
}

.reset {
    margin-top: 25px;
    border: 1px solid #555;
    background: #15154a;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
}
</style>
</head>

<body>

<div class="container">

<div class="title">
TIC TAC TOE
</div>

<div class="status" id="status">
Giliran Anda (X)
</div>

<div class="board" id="board">
<div class="cell" data-index="0"></div>
<div class="cell" data-index="1"></div>
<div class="cell" data-index="2"></div>

<div class="cell" data-index="3"></div>
<div class="cell" data-index="4"></div>
<div class="cell" data-index="5"></div>

<div class="cell" data-index="6"></div>
<div class="cell" data-index="7"></div>
<div class="cell" data-index="8"></div>

</div>

<button class="reset" onclick="resetGame()">
🔄 MAIN LAGI
</button>

</div>

<script>

let boardState = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
]

let gameActive = true
let currentPlayer = 'X'

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

const cells =
    document.querySelectorAll('.cell')

const statusDisplay =
    document.getElementById('status')

cells.forEach(cell => {
    cell.addEventListener(
        'click',
        handleCellClick
    )
})

function handleCellClick(event) {

    const index =
        Number(
            event.currentTarget
                .getAttribute('data-index')
        )

    if (
        !gameActive ||
        boardState[index] !== '' ||
        currentPlayer !== 'X'
    ) {
        return
    }

    makeMove(index, 'X')

    if (gameActive) {

        currentPlayer = 'O'

        statusDisplay.textContent =
            '🤖 Komputer berpikir...'

        setTimeout(aiTurn, 400)
    }
}
function makeMove(index, player) {

    if (!gameActive) return

    boardState[index] = player

    cells[index].classList.add(
        player.toLowerCase()
    )

    if (
        checkWin(boardState, player)
    ) {

        gameActive = false

        statusDisplay.textContent =
            player === 'X'
                ? '🎉 ANDA MENANG!'
                : '🤖 AI MENANG!'

        return
    }

    if (checkTie(boardState)) {

        gameActive = false

        statusDisplay.textContent =
            '🤝 HASIL SERI!'

        return
    }

    if (player === 'O') {

        currentPlayer = 'X'

        statusDisplay.textContent =
            'Giliran Anda (X)'
    }
}

function aiTurn() {

    if (!gameActive) return

    const bestMove =
        getBestMove()

    if (bestMove !== -1) {
        makeMove(bestMove, 'O')
    }
}

function getBestMove() {

    let bestScore = -Infinity
    let bestMove = -1

    for (let i = 0; i < 9; i++) {

        if (boardState[i] === '') {

            boardState[i] = 'O'

            const score =
                minimax(
                    boardState,
                    0,
                    false
                )

            boardState[i] = ''

            if (score > bestScore) {

                bestScore = score
                bestMove = i
            }
        }
    }

    return bestMove
}
function minimax(
    board,
    depth,
    isMaximizing
) {

    if (checkWin(board, 'O')) {
        return 10 - depth
    }

    if (checkWin(board, 'X')) {
        return depth - 10
    }

    if (checkTie(board)) {
        return 0
    }

    if (isMaximizing) {

        let bestScore = -Infinity

        for (let i = 0; i < 9; i++) {

            if (board[i] === '') {

                board[i] = 'O'

                const score =
                    minimax(
                        board,
                        depth + 1,
                        false
                    )

                board[i] = ''

                bestScore =
                    Math.max(
                        bestScore,
                        score
                    )
            }
        }

        return bestScore
    }

    let bestScore = Infinity

    for (let i = 0; i < 9; i++) {

        if (board[i] === '') {

            board[i] = 'X'

            const score =
                minimax(
                    board,
                    depth + 1,
                    true
                )

            board[i] = ''

            bestScore =
                Math.min(
                    bestScore,
                    score
                )
        }
    }

    return bestScore
}

function checkWin(board, player) {

    return winningConditions.some(
        condition =>
            condition.every(
                index =>
                    board[index] === player
            )
    )
}

function checkTie(board) {

    return board.every(
        cell => cell !== ''
    )
}
function resetGame() {

    boardState = [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
    ]

    gameActive = true
    currentPlayer = 'X'

    cells.forEach(cell => {

        cell.classList.remove(
            'x',
            'o'
        )

    })

    statusDisplay.textContent =
        'Giliran Anda (X)'
}

</script>

</body>
</html>
`


        const responseData = {

            response_id:
                crypto.randomUUID(),

            sections: [

                {

                    view_model: {

                        primitive: {

                            __typename:
                                'GenAIaeacdsnwHtmlPrimitive',

                            payload:
                                ticTacToeHtml,

                            trusted_sources: [
                                'nixel.dev',
                                'kangwifi.eu.org'
                            ]
                        },

                        __typename:
                            'GenAISingleLayoutViewModel'
                    }
                }
            ]
        }
const message = {

            botForwardedMessage: {

                message: {

                    richResponseMessage: {

                        messageType: 1,

                        submessages: [
                            {
                                messageType: 2,
                                messageText:
                                    'Tic Tac Toe'
                            }
                        ],

                        unifiedResponse: {

                            data: Buffer.from(
                                JSON.stringify(
                                    responseData
                                )
                            ).toString(
                                'base64'
                            )
                        },

                        contextInfo: {

                            forwardingScore: 1,

                            isForwarded: true,

                            forwardedAiBotMessageInfo: {

                                botJid:
                                    '867051314767696@bot'
                            },

                            forwardOrigin: 4
                        }
                    }
                }
            }
        }

        await sock.relayMessage(
            m.chat,
            message,
            {
                additionalNodes: [
                    {
                        tag: 'biz',

                        attrs: {
                            actual_actors: '2',
                            host_storage: '2',

                            privacy_mode_ts:
                                String(
                                    Math.floor(
                                        Date.now() / 1000
                                    )
                                )
                        },

                        content: [
                            {
                                tag: 'interactive',

                                attrs: {
                                    type:
                                        'native_flow',

                                    v: '1'
                                },

                                content: [
                                    {
                                        tag:
                                            'native_flow',

                                        attrs: {
                                            v: '9',
                                            name: 'mixed'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        )

    } catch (error) {

        console.error(
            '❌ TicTacToe Plugin Error:',
            error
        )

        await m.reply(
            `❌ *GAGAL MENJALANKAN TIC TAC TOE*

> ${error.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}