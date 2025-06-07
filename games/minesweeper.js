// games/minesweeper.js
(function() {
    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("Minesweeper: Game area #game-area not found!");
        gameArea.innerHTML = "<p>Error: Game area not found. Minesweeper cannot load.</p>";
        return;
    }
    gameArea.innerHTML = ''; // Clear any previous content like "Failed to load game"

    // 1. Inject Minesweeper-specific CSS
    const styleId = 'minesweeper-styles';
    if (!document.getElementById(styleId)) {
        const css = `
            #game-area { /* Ensure game area is centered for the game content */
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: #f0f0f0; /* Match body bg for consistency if game doesn't fill */
            }
            .ms-game-board-container { /* Renamed from #game-container for clarity */
                border: 2px solid #333;
                padding: 10px;
                background-color: #c0c0c0;
                box-shadow: 5px 5px 10px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                align-items: center; /* Center controls and grid */
            }
            .ms-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding: 5px;
                border: 2px inset #7f7f7f;
                background-color: #c0c0c0;
                min-width: 250px; /* Adjusted min-width for typical controls */
                width: auto; /* Allow it to fit content */
            }
            .ms-controls select, .ms-controls button {
                padding: 5px 10px;
                font-size: 14px;
                border: 2px outset #7f7f7f;
                background-color: #c0c0c0;
                cursor: pointer;
                margin: 0 3px; /* Add some spacing */
            }
            .ms-controls button:active {
                border-style: inset;
            }
            .ms-info-display {
                font-size: 18px;
                font-weight: bold;
                padding: 5px 10px;
                border: 2px inset #7f7f7f;
                background-color: #bbb;
                min-width: 40px; /* Adjusted */
                text-align: center;
            }
            .ms-grid {
                display: grid;
                border: 2px solid #7f7f7f; /* Inner border for grid */
            }
            .ms-cell {
                width: 25px;
                height: 25px;
                background-color: #bdbdbd;
                border: 2px outset #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                user-select: none; /* Prevent text selection */
                box-sizing: border-box;
            }
            .ms-cell.ms-revealed {
                background-color: #d0d0d0;
                border: 1px solid #7b7b7b;
                cursor: default;
            }
            .ms-cell.ms-mine {
                background-color: red;
                color: black;
            }
            .ms-cell.ms-flagged::before {
                content: "🚩";
                font-size: 16px;
            }
            .ms-cell.ms-revealed.ms-mine.ms-exploded {
                background-color: orange;
            }
            .ms-cell.ms-revealed.ms-num-1 { color: blue; }
            .ms-cell.ms-revealed.ms-num-2 { color: green; }
            .ms-cell.ms-revealed.ms-num-3 { color: red; }
            .ms-cell.ms-revealed.ms-num-4 { color: darkblue; }
            .ms-cell.ms-revealed.ms-num-5 { color: brown; }
            .ms-cell.ms-revealed.ms-num-6 { color: cyan; }
            .ms-cell.ms-revealed.ms-num-7 { color: black; }
            .ms-cell.ms-revealed.ms-num-8 { color: grey; }

            .ms-message-display {
                margin-top: 15px;
                font-size: 20px;
                font-weight: bold;
                min-height: 25px; /* Reserve space for message */
                color: #333;
                text-align: center;
            }
        `;
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }

    // 2. Create HTML structure for the game within gameArea
    const gameBoardContainer = document.createElement('div');
    gameBoardContainer.className = 'ms-game-board-container';

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'ms-controls';

    const difficultySelect = document.createElement('select');
    difficultySelect.id = 'ms-difficulty';

    const resetButtonElement = document.createElement('button');
    resetButtonElement.id = 'ms-reset-button';
    resetButtonElement.textContent = '🙂';

    const timerDisplayElement = document.createElement('div');
    timerDisplayElement.id = 'ms-timer';
    timerDisplayElement.className = 'ms-info-display';
    timerDisplayElement.textContent = '0';

    const minesLeftDisplayElement = document.createElement('div');
    minesLeftDisplayElement.id = 'ms-mines-left';
    minesLeftDisplayElement.className = 'ms-info-display';
    minesLeftDisplayElement.textContent = '0';

    controlsDiv.appendChild(difficultySelect);
    controlsDiv.appendChild(resetButtonElement);
    controlsDiv.appendChild(timerDisplayElement);
    controlsDiv.appendChild(minesLeftDisplayElement);

    const gridContainerElement = document.createElement('div');
    gridContainerElement.id = 'ms-grid-container';
    gridContainerElement.className = 'ms-grid';

    const messageDisplayElement = document.createElement('div');
    messageDisplayElement.id = 'ms-message-display';
    messageDisplayElement.className = 'ms-message-display';

    gameBoardContainer.appendChild(controlsDiv);
    gameBoardContainer.appendChild(gridContainerElement);
    gameBoardContainer.appendChild(messageDisplayElement);
    gameArea.appendChild(gameBoardContainer);

    // 3. Minesweeper Game Logic
    const DIFFICULTIES = {
        easy:   { rows: 9,  cols: 9,  mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard:   { rows: 16, cols: 30, mines: 99 }
    };

    let currentDifficulty = 'medium'; // Default
    let rows = DIFFICULTIES[currentDifficulty].rows;
    let cols = DIFFICULTIES[currentDifficulty].cols;
    let numMines = DIFFICULTIES[currentDifficulty].mines;

    let board = [];
    let cellElements = [];
    let minesLocated = [];
    let revealedCount = 0;
    let flagsPlaced = 0;
    let gameOver = false;
    let firstClick = true;
    let timerInterval;
    let secondsElapsed = 0;

    // Use the dynamically created elements
    const gridContainer = gridContainerElement;
    const minesLeftDisplay = minesLeftDisplayElement;
    const timerDisplay = timerDisplayElement;
    const resetButton = resetButtonElement;
    const messageDisplay = messageDisplayElement;
    const difficultySelector = difficultySelect;

    // Populate difficulty selector
    for (const key in DIFFICULTIES) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} (${DIFFICULTIES[key].rows}x${DIFFICULTIES[key].cols}, ${DIFFICULTIES[key].mines} mines)`;
        if (key === 'medium') option.selected = true;
        difficultySelector.appendChild(option);
    }

    function initGame() {
        const selectedDifficultySettings = DIFFICULTIES[difficultySelector.value];
        rows = selectedDifficultySettings.rows;
        cols = selectedDifficultySettings.cols;
        numMines = selectedDifficultySettings.mines;

        gameOver = false;
        firstClick = true;
        revealedCount = 0;
        flagsPlaced = 0;
        secondsElapsed = 0;
        minesLocated = [];
        board = [];
        cellElements = [];

        resetButton.textContent = '🙂';
        messageDisplay.textContent = '';
        updateMinesLeftDisplay();
        updateTimerDisplay();
        clearInterval(timerInterval); // Clear previous timer if any

        createBoardData();
        renderBoard();
    }

    function createBoardData() {
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    row: r,
                    col: c
                };
            }
        }
    }

    function placeMines(firstClickRow, firstClickCol) {
        let minesToPlace = numMines;
        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (!(r === firstClickRow && c === firstClickCol) && !board[r][c].isMine) {
                board[r][c].isMine = true;
                minesLocated.push({ r, c });
                minesToPlace--;
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!board[r][c].isMine) {
                    board[r][c].adjacentMines = countAdjacentMines(r, c);
                }
            }
        }
    }

    function countAdjacentMines(row, col) {
        let count = 0;
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue;
                const nr = row + rOffset;
                const nc = col + cOffset;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    function renderBoard() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        cellElements = [];

        for (let r = 0; r < rows; r++) {
            cellElements[r] = [];
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('ms-cell'); // Use prefixed class
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('click', () => handleLeftClick(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRightClick(r, c);
                });
                cell.addEventListener('mousedown', (e) => {
                    if (gameOver || board[r][c].isRevealed) return;
                    if (e.button === 0) resetButton.textContent = '😮';
                });
                 cell.addEventListener('mouseup', () => {
                    if (gameOver) return;
                     resetButton.textContent = '🙂';
                 });

                gridContainer.appendChild(cell);
                cellElements[r][c] = cell;
            }
        }
    }

    function updateCellAppearance(r, c) {
        const cellData = board[r][c];
        const cellEl = cellElements[r][c];
        cellEl.className = 'ms-cell'; // Reset with base prefixed class

        if (cellData.isFlagged) {
            cellEl.classList.add('ms-flagged');
        }

        if (cellData.isRevealed) {
            cellEl.classList.add('ms-revealed');
            if (cellData.isMine) {
                cellEl.classList.add('ms-mine');
                cellEl.textContent = '💣';
            } else if (cellData.adjacentMines > 0) {
                cellEl.textContent = cellData.adjacentMines;
                cellEl.classList.add(`ms-num-${cellData.adjacentMines}`);
            }
        }
    }

    function handleLeftClick(r, c) {
        if (gameOver || board[r][c].isRevealed || board[r][c].isFlagged) return;

        if (firstClick) {
            placeMines(r, c);
            startTimer();
            firstClick = false;
        }
        
        resetButton.textContent = '🙂';
        const cellData = board[r][c];

        if (cellData.isMine) {
            revealMine(r,c);
            endGame(false);
            return;
        }
        revealCell(r, c);
        checkWinCondition();
    }

    function revealMine(r,c) {
        board[r][c].isRevealed = true;
        cellElements[r][c].classList.add('ms-exploded');
        updateCellAppearance(r, c);
    }

    function handleRightClick(r, c) {
        if (gameOver || board[r][c].isRevealed) return;
        board[r][c].isFlagged = !board[r][c].isFlagged;
        flagsPlaced += board[r][c].isFlagged ? 1 : -1;
        updateCellAppearance(r, c);
        updateMinesLeftDisplay();
    }

    function revealCell(row, col) {
        const cellData = board[row][col];
        if (cellData.isRevealed || cellData.isFlagged || cellData.isMine) return;

        cellData.isRevealed = true;
        revealedCount++;
        updateCellAppearance(row, col);

        if (cellData.adjacentMines === 0) {
            for (let rOffset = -1; rOffset <= 1; rOffset++) {
                for (let cOffset = -1; cOffset <= 1; cOffset++) {
                    if (rOffset === 0 && cOffset === 0) continue;
                    const nr = row + rOffset;
                    const nc = col + cOffset;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
                       revealCell(nr, nc);
                    }
                }
            }
        }
    }
    
    function revealNeighbors(row, col) {
        const cellData = board[row][col];
        if (!cellData.isRevealed || cellData.adjacentMines === 0 || gameOver) return;

        let flagsAround = 0;
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                const nr = row + rOffset;
                const nc = col + cOffset;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isFlagged) {
                    flagsAround++;
                }
            }
        }

        if (flagsAround === cellData.adjacentMines) {
            for (let rOffset = -1; rOffset <= 1; rOffset++) {
                for (let cOffset = -1; cOffset <= 1; cOffset++) {
                    if (rOffset === 0 && cOffset === 0) continue;
                    const nr = row + rOffset;
                    const nc = col + cOffset;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].isFlagged && !board[nr][nc].isRevealed) {
                        if (board[nr][nc].isMine) {
                            revealMine(nr, nc);
                            endGame(false);
                            return;
                        }
                        revealCell(nr, nc);
                    }
                }
            }
            checkWinCondition(); // Check win after successful neighbor reveal
        }
    }

    function checkWinCondition() {
        if (!gameOver && revealedCount === (rows * cols) - numMines) {
            endGame(true);
        }
    }

    function endGame(isWin) {
        gameOver = true;
        clearInterval(timerInterval);
        resetButton.textContent = isWin ? '😎' : '😵';
        messageDisplay.textContent = isWin ? 'You Win! 🎉' : 'Game Over! 💣';

        minesLocated.forEach(minePos => {
            if (!board[minePos.r][minePos.c].isRevealed) {
                 board[minePos.r][minePos.c].isRevealed = true;
                 updateCellAppearance(minePos.r, minePos.c);
            }
            if (!isWin && board[minePos.r][minePos.c].isFlagged && board[minePos.r][minePos.c].isMine) {
                cellElements[minePos.r][minePos.c].classList.remove('ms-flagged');
                cellElements[minePos.r][minePos.c].textContent = '💣';
            }
        });

        if (!isWin) {
            for (let r_idx = 0; r_idx < rows; r_idx++) {
                for (let c_idx = 0; c_idx < cols; c_idx++) {
                    if (board[r_idx][c_idx].isFlagged && !board[r_idx][c_idx].isMine) {
                        cellElements[r_idx][c_idx].textContent = '❌';
                        cellElements[r_idx][c_idx].classList.remove('ms-flagged');
                        cellElements[r_idx][c_idx].style.backgroundColor = '#ffcccc';
                    }
                }
            }
        }
    }

    function updateMinesLeftDisplay() {
        minesLeftDisplay.textContent = numMines - flagsPlaced;
    }

    function startTimer() {
        clearInterval(timerInterval);
        secondsElapsed = 0;
        timerDisplay.textContent = secondsElapsed;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = secondsElapsed;
    }

    // Event Listeners
    resetButton.addEventListener('click', initGame);
    difficultySelector.addEventListener('change', initGame);
    
    gridContainer.addEventListener('mousedown', (e) => { // Attach to gridContainer for event delegation
        if (gameOver) return;
        const cellEl = e.target.closest('.ms-cell');
        if (!cellEl) return;
        
        const r = parseInt(cellEl.dataset.row);
        const c = parseInt(cellEl.dataset.col);
        const cellData = board[r][c];

        // For chord-clicking (middle mouse or simultaneous left+right on a revealed number)
        // Simplification: Left click on an already revealed number with adjacent mines
        if (e.button === 0 && cellData.isRevealed && cellData.adjacentMines > 0) {
            revealNeighbors(r,c);
        }
    });

    // Initial game setup
    initGame();

    // Cleanup function for when the game is removed from the hub
    // The hub currently just clears innerHTML, which handles DOM and listeners on those DOM elements.
    // The main thing to ensure is cleaned is the interval. initGame() already clears it.
    // If Alt+Capslock is hit, the script is effectively "reloaded" next time it's launched,
    // and initGame will run, clearing any theoretical stale interval.
    // To be extremely robust, you could add a window onunload or similar for the script,
    // but given the hub's mechanism, this should be fine.
    // console.log("Minesweeper Loaded and Initialized");

})();