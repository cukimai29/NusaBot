const crypto = require('crypto')
let handler = async (m, { asta }) => { 
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

        /* Background biru gelap pas body agar crop rapi */
        body {
            background-color: #0b0b2a; 
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 15px; 
            margin: 0;
        }

        .header-box {
            text-align: center;
            margin-bottom: 20px;
        }

        .title {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: 2px;
            color: #ffffff;
            margin-bottom: 5px;
        }

        .status {
            font-size: 0.9rem;
            font-weight: 600;
            color: #a0a0c0;
        }

        /* Grid Neon (tanpa kotak-kotak terpisah) */
        .board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            width: 100%;
            max-width: 280px; 
            aspect-ratio: 1 / 1;
        }

        .cell {
            border: 4px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
        }

        /* Menghilangkan garis tepi luar agar membentuk tanda pagar (#) sempurna */
        .cell[data-index="0"], .cell[data-index="1"], .cell[data-index="2"] { border-top: none; }
        .cell[data-index="6"], .cell[data-index="7"], .cell[data-index="8"] { border-bottom: none; }
        .cell[data-index="0"], .cell[data-index="3"], .cell[data-index="6"] { border-left: none; }
        .cell[data-index="2"], .cell[data-index="5"], .cell[data-index="8"] { border-right: none; }

        /* Simbol X - Biru Neon */
        .cell.x::before, .cell.x::after {
            content: '';
            position: absolute;
            width: 15%;
            height: 75%;
            background-color: #e0f0ff;
            border-radius: 4px;
            box-shadow: 0 0 15px #0044ff, 0 0 5px #0044ff;
        }
        .cell.x::before { transform: rotate(45deg); }
        .cell.x::after { transform: rotate(-45deg); }

        /* Simbol O - Merah/Pink Neon */
        .cell.o::before {
            content: '';
            position: absolute;
            width: 60%;
            height: 60%;
            border-radius: 50%;
            border: 10px solid #ffe0e0;
            box-shadow: 0 0 15px #ff0044, inset 0 0 15px #ff0044;
        }
    </style>
</head>
<body>

    <div class="header-box">
        <div class="title">TIC TAC TOE</div>
        <div class="status" id="status">Giliran Anda (X)</div>
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

<script>
    let boardState = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let currentPlayer = 'X';

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status');

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    function handleCellClick(e) {
        const clickedCell = e.target;
        const clickedIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (!gameActive || boardState[clickedIndex] !== '' || currentPlayer !== 'X') {
            return;
        }

        makeMove(clickedIndex, 'X');

        if (gameActive) {
            currentPlayer = 'O';
            statusDisplay.textContent = 'Komputer berpikir...';
            setTimeout(aiTurn, 400);
        }
    }

    function makeMove(index, player) {
        boardState[index] = player;
        const cell = cells[index];
        cell.classList.add(player.toLowerCase());

        if (checkWin(boardState, player)) {
            gameActive = false;
            statusDisplay.textContent = player === 'X' ? '🎉 Anda Menang!' : '💻 AI Menang!';
            return;
        }

        if (checkTie(boardState)) {
            gameActive = false;
            statusDisplay.textContent = '🤝 Hasil Seri!';
            return;
        }

        if (player === 'O') {
            currentPlayer = 'X';
            statusDisplay.textContent = 'Giliran Anda (X)';
        }
    }

    function aiTurn() {
        if (!gameActive) return;

        let bestMove = getBestMoveMinimax();
        if (bestMove !== undefined && bestMove !== -1) {
            makeMove(bestMove, 'O');
        }
    }

    function getBestMoveMinimax() {
        let bestScore = -Infinity;
        let move = -1;

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = 'O';
                let score = minimax(boardState, 0, false);
                boardState[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    function minimax(board, depth, isMaximizing) {
        if (checkWin(board, 'O')) return 10 - depth;
        if (checkWin(board, 'X')) return depth - 10;
        if (checkTie(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkWin(board, player) {
        return winningConditions.some(condition => {
            return condition.every(index => board[index] === player);
        });
    }

    function checkTie(board) {
        return board.every(cell => cell !== '');
    }
</script>
</body>
</html>
`
        // HANYA MENGIRIM KARTU NEON INI SAJA
        await asta.relayMessage( 
            m.chat, 
            { 
                senderKeyDistributionMessage: { 
                    groupId: "120363411834515372@g.us", 
                    axolotlSenderKeyDistributionMessage: "Mwj3rbmnBRCzARogxgeWQyTAKtFV+P7a72mU82AyzJutjpwyMSHp4PvNz30iIQWFSbdsQPjmiZ503uSvukftuvqRFTzQ35TDmOilH4cWQA==" 
                }, 
                messageContextInfo: { 
                    deviceListMetadata: {}, 
                    deviceListMetadataVersion: 2, 
                    botMetadata: { 
                        messageDisclaimerText: "", 
                        botResponseId: "90ab3989-9597-4bde-9593-4786925f1c97", 
                        verificationMetadata: { 
                            proofs: [ { 
                                version: 1, 
                                useCase: 1, 
                                signature: "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==", 
                                certificateChain: [ "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" ] 
                            } ] 
                        } 
                    } 
                }, 
                botForwardedMessage: { 
                    message: { 
                        richResponseMessage: { 
                            messageType: 1, 
                            submessages: [{ messageType: 2, messageText: "Tic Tac Toe" }], 
                            unifiedResponse: { 
                                data: Buffer.from( 
                                    JSON.stringify({ 
                                        response_id: crypto.randomUUID(), 
                                        sections: [ 
                                            { 
                                                view_model: { 
                                                    primitive: { 
                                                        __typename: "GenAIaeacdsnwHtmlPrimitive", 
                                                        payload: ticTacToeHtml, 
                                                        trusted_sources: ["nixel.dev", "kangwifi.eu.org"] 
                                                    }, 
                                                    __typename: "GenAISingleLayoutViewModel" 
                                                } 
                                            } 
                                        ] 
                                    }) 
                                ).toString("base64") 
                            }, 
                            contextInfo: { 
                                forwardingScore: 1, 
                                isForwarded: true, 
                                forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, 
                                forwardOrigin: 4 
                            } 
                        } 
                    } 
                } 
            }, 
            { 
                additionalNodes: [ 
                    { 
                        tag: "biz", 
                        attrs: { actual_actors: "2", host_storage: "2", privacy_mode_ts: "1788095961" }, 
                        content: [ 
                            { 
                                tag: "interactive", 
                                attrs: { type: "native_flow", v: "1" }, 
                                content: [ { tag: "native_flow", attrs: { v: "9", name: "mixed" } } ] 
                            } 
                        ] 
                    } 
                ] 
            } 
        )

    } catch (err) { 
        console.error('❌ Plugin Error TicTacToe:', err) 
    } 

module.exports = {
    config: pluginConfig,
    handler
}