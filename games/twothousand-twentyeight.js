// File: games/twothousandfortyeight.js

(function() {
    console.log("[2048] twothousandfortyeight.js: Execution started (v2 - WASD/Animation Fix Attempt).");

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("[2048] CRITICAL ERROR: #game-area element not found!");
        return;
    }
    gameArea.innerHTML = ''; // Clear previous content
    console.log("[2048] #game-area found and cleared.");

    // 1. Inject HTML Structure (ensure IDs are correct)
    const gameHTML = `
        <div class="g2048-game-container">
            <div class="g2048-header">
                <h1>2048</h1>
                <div class="g2048-score-container">Score: <span id="g2048-score-display">0</span></div>
            </div>
            <div class="g2048-controls-info">
                <button id="g2048-restart-btn">New Game</button>
                <p class="g2048-instructions">Use <strong>Arrow keys / WASD</strong> to play.</p>
            </div>
            <div id="g2048-grid-display-container">
                </div>
            <div id="g2048-overlay-message" class="g2048-overlay" style="display: none;">
                <div id="g2048-overlay-text">Message</div>
                <button id="g2048-overlay-button">Action</button>
            </div>
            <p class="g2048-exit-instructions">Alt + CapsLock to return to Calculator</p>
        </div>
    `;
    try {
        gameArea.innerHTML = gameHTML;
        console.log("[2048] Game HTML structure injected.");
    } catch (e) {
        console.error("[2048] FATAL ERROR injecting game HTML:", e);
        gameArea.textContent = "Fatal Error: Could not inject 2048 game HTML.";
        return;
    }

    // 2. Inject CSS (with animation styles)
    const g2048Styles = `
        .g2048-game-container { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; box-sizing: border-box; font-family: Arial, sans-serif; color: #776e65; background-color: #faf8ef; padding: 10px; overflow: hidden; }
        .g2048-header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 360px; margin-bottom: 10px; }
        .g2048-header h1 { font-size: 2.8em; color: #776e65; margin: 0; }
        .g2048-score-container { background-color: #bbada0; color: white; padding: 8px 15px; border-radius: 5px; font-size: 1.2em; font-weight: bold; }
        .g2048-controls-info { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 360px; margin-bottom: 15px; }
        #g2048-restart-btn, #g2048-overlay-button { background-color: #8f7a66; color: white; border: none; padding: 10px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.9em; }
        #g2048-restart-btn:hover, #g2048-overlay-button:hover { background-color: #9f8b77; }
        .g2048-instructions { font-size: 0.9em; color: #776e65; text-align: right; }
        #g2048-grid-display-container { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; width: 100%; max-width: 360px; aspect-ratio: 1 / 1; background-color: #bbada0; padding: 10px; border-radius: 6px; box-sizing: border-box; position: relative; }
        .g2048-grid-cell { background-color: #cdc1b4; border-radius: 3px; } /* For empty cells */
        .g2048-tile-on-grid { 
            display: flex; align-items: center; justify-content: center; 
            font-weight: bold; border-radius: 3px; font-size: 2em; 
            position: absolute; 
            /* Base transitions for color/font changes if classes are updated on existing elements (not current model) */
            /* transition: background-color 0.1s ease-out, color 0.1s ease-out, font-size 0.1s ease-out; */
            /* For this version, animations handle appearance */
        }
        /* Animations */
        @keyframes g2048_tile_spawn_effect {
            from { transform: scale(0.3); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
        }
        .g2048-tile-on-grid.g2048-newly-spawned {
            animation: g2048_tile_spawn_effect 0.15s ease-out;
        }
        @keyframes g2048_tile_merge_effect {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.25); } /* Pop out slightly more */
            100% { transform: scale(1); }
        }
        .g2048-tile-on-grid.g2048-just-merged {
            animation: g2048_tile_merge_effect 0.15s ease-out;
        }

        /* Tile Colors */
        .g2048-tile-val-2    { background-color: #eee4da; color: #776e65; } .g2048-tile-val-4    { background-color: #ede0c8; color: #776e65; }
        .g2048-tile-val-8    { background-color: #f2b179; color: #f9f6f2; } .g2048-tile-val-16   { background-color: #f59563; color: #f9f6f2; }
        .g2048-tile-val-32   { background-color: #f67c5f; color: #f9f6f2; } .g2048-tile-val-64   { background-color: #f65e3b; color: #f9f6f2; }
        .g2048-tile-val-128  { background-color: #edcf72; color: #f9f6f2; font-size: 1.7em; } .g2048-tile-val-256  { background-color: #edcc61; color: #f9f6f2; font-size: 1.7em; }
        .g2048-tile-val-512  { background-color: #edc850; color: #f9f6f2; font-size: 1.7em; } .g2048-tile-val-1024 { background-color: #edc53f; color: #f9f6f2; font-size: 1.4em; }
        .g2048-tile-val-2048 { background-color: #edc22e; color: #f9f6f2; font-size: 1.4em; } .g2048-tile-val-super { background-color: #3c3a32; color: #f9f6f2; font-size: 1.2em; }
        
        .g2048-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(238, 228, 218, 0.85); display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; z-index: 100; border-radius: 6px; }
        .g2048-overlay div { font-size: 1.8em; color: #776e65; margin-bottom: 20px; }
        .g2048-exit-instructions { font-size: 0.8em; color: #776e65; margin-top: 15px; text-align: center; }
        /* Media Queries (same as before) */
        @media (max-width: 420px), (max-height: 650px) {
            .g2048-header h1 { font-size: 2em; } .g2048-score-container { font-size: 1em; padding: 6px 10px;}
            #g2048-grid-display-container { gap: 8px; padding: 8px; max-width: 90vw; max-height: 90vw;}
            .g2048-tile-on-grid { font-size: 1.5em; } /* Base for mobile */
            .g2048-tile-val-128, .g2048-tile-val-256, .g2048-tile-val-512 { font-size: 1.3em; }
            .g2048-tile-val-1024, .g2048-tile-val-2048 { font-size: 1.1em; } .g2048-tile-val-super { font-size: 0.9em; }
            .g2048-controls-info { flex-direction: column; gap: 8px; margin-bottom: 10px;}
            .g2048-exit-instructions { font-size: 0.7em; margin-top: 10px;}
        }
    `;
    try {
        const styleElement = document.createElement("style");
        styleElement.type = "text/css";
        styleElement.innerText = g2048Styles;
        document.head.appendChild(styleElement); // Append to head for global access by injected HTML
        console.log("[2048] Game CSS injected.");
    } catch (e) { /* ... error handling ... */ }

    // 3. Get Element References
    const scoreDisplayEl = document.getElementById('g2048-score-display');
    const gridDisplayContainerEl = document.getElementById('g2048-grid-display-container');
    const overlayMessageEl = document.getElementById('g2048-overlay-message');
    const overlayTextEl = document.getElementById('g2048-overlay-text');
    const overlayButtonEl = document.getElementById('g2048-overlay-button');
    const restartButtonEl = document.getElementById('g2048-restart-btn');

    if (!scoreDisplayEl || !gridDisplayContainerEl || !overlayMessageEl || !overlayTextEl || !overlayButtonEl || !restartButtonEl) {
        console.error("[2048] CRITICAL ERROR: One or more UI elements not found by ID. HTML IDs:",
            { scoreDisplayEl, gridDisplayContainerEl, overlayMessageEl, overlayTextEl, overlayButtonEl, restartButtonEl });
        gameArea.innerHTML = "<p style='color:red; text-align:center;'>Error: Game UI elements not found. Check console for details and verify HTML IDs.</p>";
        return;
    }
    console.log("[2048] All core UI elements found.");

    // Game Variables
    const GRID_SIZE = 4;
    let board = []; // Internal representation: board[row][col] = value
    let currentScore = 0;
    let gameWon = false; // If 2048 tile is achieved
    let cellSize = 0;    // Calculated based on grid container size
    let cellGap = 10;    // Should match CSS gap for positioning
    
    // For tracking which tiles need animation
    // flags[r][c] can be 'spawn' or 'merge'
    let animationFlags = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    function initializeAnimationFlags() {
        animationFlags = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    }

    function createBoard() {
        board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        initializeAnimationFlags();
        gridDisplayContainerEl.innerHTML = ''; // Clear previous cells/tiles

        const containerWidth = gridDisplayContainerEl.clientWidth;
        if (containerWidth > 0) {
            cellGap = parseFloat(getComputedStyle(gridDisplayContainerEl).gap) || 10;
            cellSize = (containerWidth - cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
        } else {
            const approxContainerWidth = Math.min(window.innerWidth * 0.8, 360);
            cellSize = (approxContainerWidth - cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
            if (isNaN(cellSize) || cellSize <= 0) cellSize = 60;
            console.warn("[2048] createBoard: gridDisplayContainerEl.clientWidth is 0, using estimated cellSize:", cellSize);
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('g2048-grid-cell');
                gridDisplayContainerEl.appendChild(cell);
            }
        }
    }

    function addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (board[r][c] === 0) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[r][c] = Math.random() < 0.9 ? 2 : 4;
            animationFlags[r][c] = 'spawn'; // Flag this tile for spawn animation
            console.log(`[2048] Added new tile ${board[r][c]} at (${r},${c}), flagged for spawn.`);
        }
    }

    function drawTiles() {
        gridDisplayContainerEl.querySelectorAll('.g2048-tile-on-grid').forEach(tile => tile.remove()); // Clear only dynamic tiles
        
        const containerWidth = gridDisplayContainerEl.clientWidth;
         if (containerWidth > 0 && (cellSize <= 0 || isNaN(cellSize))) { // Recalculate if needed
            cellGap = parseFloat(getComputedStyle(gridDisplayContainerEl).gap) || 10;
            cellSize = (containerWidth - cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
        } else if (cellSize <= 0 || isNaN(cellSize)) {
             const approxContainerWidth = Math.min(window.innerWidth * 0.8, 360);
             cellSize = (approxContainerWidth - cellGap * (GRID_SIZE + 1)) / GRID_SIZE;
             if (isNaN(cellSize) || cellSize <= 0) cellSize = 60;
             console.warn("[2048] drawTiles using estimated cellSize:", cellSize);
        }


        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (board[r][c] !== 0) {
                    const tileValue = board[r][c];
                    const tile = document.createElement('div');
                    tile.classList.add('g2048-tile-on-grid');
                    tile.classList.add(`g2048-tile-val-${tileValue <= 2048 ? tileValue : 'super'}`);
                    tile.textContent = tileValue;

                    tile.style.width = `${cellSize}px`;
                    tile.style.height = `${cellSize}px`;
                    tile.style.top = `${r * (cellSize + cellGap) + cellGap}px`;
                    tile.style.left = `${c * (cellSize + cellGap) + cellGap}px`;
                    
                    if (animationFlags[r][c] === 'spawn') {
                        tile.classList.add('g2048-newly-spawned');
                    } else if (animationFlags[r][c] === 'merge') {
                        tile.classList.add('g2048-just-merged');
                    }
                    
                    gridDisplayContainerEl.appendChild(tile);
                }
            }
        }
        scoreDisplayEl.textContent = currentScore;
        initializeAnimationFlags(); // Reset flags after drawing so animations don't re-apply unnecessarily
    }

    function slideAndMergeLine(line, existingAnimationFlagsLine) {
        let newLine = line.filter(val => val !== 0);
        let points = 0;
        let newAnimationFlagsLine = Array(GRID_SIZE).fill(null); 
        let preMergeLength = newLine.length;


        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i+1]) {
                newLine[i] *= 2;
                points += newLine[i];
                // Mark the position of the merged tile for animation
                // This index 'i' is in the context of the compacted 'newLine'
                newAnimationFlagsLine[i] = 'merge'; 
                newLine.splice(i + 1, 1); // Remove the merged tile
            }
        }
        
        // Pad with zeros
        let finalLine = [];
        let finalAnimationFlags = Array(GRID_SIZE).fill(null);
        for(let i=0; i<newLine.length; i++) {
            finalLine.push(newLine[i]);
            if(newAnimationFlagsLine[i] === 'merge') {
                finalAnimationFlags[i] = 'merge';
            }
        }
        while (finalLine.length < GRID_SIZE) {
            finalLine.push(0);
        }

        return {line: finalLine, points: points, animationFlags: finalAnimationFlags};
    }

    function move(direction) {
        let boardChanged = false;
        let tempGrid = JSON.parse(JSON.stringify(board)); // Operate on a copy
        let tempAnimationFlags = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        let iterationScore = 0;

        if (direction === 'up' || direction === 'down') {
            tempGrid = transpose(tempGrid); // Transpose data grid
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            let row = tempGrid[r]; // This is a row from tempGrid (potentially transposed)
            let originalRow = [...row];
            
            if (direction === 'right' || direction === 'down') {
                row.reverse(); // Reverse for right/down processing
            }
            
            // Pass empty animation flags for the line, slideAndMergeLine will populate them
            let {line: newRow, points: rowPoints, animationFlags: lineAnimFlags} = slideAndMergeLine(row);
            iterationScore += rowPoints;

            if (direction === 'right' || direction === 'down') {
                newRow.reverse(); // Reverse row back
                lineAnimFlags.reverse(); // Reverse animation flags for the row too
            }
            
            tempGrid[r] = newRow; // Update the row in tempGrid
            if (!arraysEqual(originalRow, newRow)) boardChanged = true;

            // Apply animation flags for this row to the tempAnimationFlags
            for (let c = 0; c < GRID_SIZE; c++) {
                if (lineAnimFlags[c] === 'merge') {
                    if (direction === 'up' || direction === 'down') {
                        tempAnimationFlags[c][r] = 'merge'; // Apply to original orientation
                    } else {
                        tempAnimationFlags[r][c] = 'merge';
                    }
                }
            }
        }

        if (direction === 'up' || direction === 'down') {
            tempGrid = transpose(tempGrid); // Transpose back
            // tempAnimationFlags also needs to be transposed if it was set based on transposed grid
            // This part is tricky. Let's re-evaluate: tempAnimationFlags should already be in the correct final orientation.
        }
        
        if (boardChanged) {
            board = tempGrid; // Commit data changes
            // Overwrite global animationFlags with collected merge flags. Spawn flags will be added next.
            animationFlags = tempAnimationFlags; 
            currentScore += iterationScore;
            addRandomTile(); // This will add 'spawn' flags to animationFlags, potentially overwriting a 'merge' if spawn is on same spot (unlikely)
            drawTiles();
            checkGameStatus();
        }
        return boardChanged;
    }
    
    // Helper functions (transpose, arraysEqual, checkGameStatus, canMakeMove, showOverlayMessage)
    // Ensure these are robust
    function transpose(matrix) { return matrix[0].map((_, i) => matrix.map(row => row[i])); }
    function arraysEqual(a,b) { return JSON.stringify(a) === JSON.stringify(b); }
    function checkGameStatus() {
        let wonThisTurn = false;
        if (!gameWon) {
            for(let r=0; r<GRID_SIZE; r++) for(let c=0; c<GRID_SIZE; c++) if(board[r][c]===2048) { wonThisTurn=true; break; }
        }
        if (wonThisTurn) {
            gameWon = true; 
            showOverlayMessage("You reached 2048!", "Keep Going", () => { overlayMessageEl.style.display = 'none'; }, "New Game", startGame);
            return; 
        }
        if (!canMakeMove()) {
            showOverlayMessage(`Game Over! Final Score: ${currentScore}`, "Try Again", startGame);
        }
    }
    function canMakeMove() {
        for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++){ if(board[r][c]===0)return true; if(c<GRID_SIZE-1 && board[r][c]===board[r][c+1])return true; if(r<GRID_SIZE-1 && board[r][c]===board[r+1][c])return true;} return false;
    }
    function showOverlayMessage(text, btn1Text, btn1Action, btn2Text, btn2Action) {
        overlayTextEl.textContent = text; 
        overlayButtonEl.textContent = btn1Text; 
        overlayButtonEl.onclick = btn1Action; 
        const secBtnCont = overlayMessageEl.querySelector('.g2048-second-btn-container'); 
        if(secBtnCont) secBtnCont.remove(); 
        if(btn2Text && btn2Action){ 
            const bc=document.createElement('div'); bc.className='g2048-second-btn-container'; 
            const b2=document.createElement('button'); b2.textContent=btn2Text; b2.onclick=btn2Action; 
            b2.style.cssText="background-color:#a79583;color:white;border:none;padding:10px 15px;border-radius:5px;font-weight:bold;cursor:pointer;font-size:0.9em;margin-left:10px;"; 
            // Insert button2 next to button1. Ensure overlayButtonEl has a parent when this is called.
            if(overlayButtonEl.parentNode) {
                 overlayButtonEl.parentNode.insertBefore(bc, overlayButtonEl.nextSibling); 
                 bc.appendChild(b2);
            } else { // Fallback if overlayButtonEl is not yet in a typical parent for some reason
                overlayMessageEl.appendChild(bc); // Might not position correctly relative to first button
                bc.appendChild(b2);
            }
        }
        overlayMessageEl.style.display = 'flex';
    }
    
    // Input Handling
    let keydownListenerActive = false;
    // Touch listeners and related variables/functions are removed

    function handleKeyInput(event) {
        console.log("[2048] Key event:", event.key, "Code:", event.code, "Lowercase key:", event.key.toLowerCase()); // Debugging key events

        if (overlayMessageEl.style.display === 'flex') {
            if (event.key === 'Enter' && typeof overlayButtonEl.onclick === 'function') {
                 overlayButtonEl.click();
            }
            return;
        }

        let direction = null;
        // Use event.code for physical key location if event.key is problematic, but event.key is generally preferred.
        // Test with event.key.toLowerCase() first.
        const key = event.key.toLowerCase();
        if (key === 'arrowup' || key === 'w') direction = 'up';
        else if (key === 'arrowdown' || key === 's') direction = 'down';
        else if (key === 'arrowleft' || key === 'a') direction = 'left';
        else if (key === 'arrowright' || key === 'd') direction = 'right';
        
        if (direction) {
            event.preventDefault();
            console.log("[2048] Processed direction:", direction);
            move(direction);
        } else {
            console.log("[2048] Unhandled key for game move:", key);
        }
    }

    function setupInputListeners() {
        if (!keydownListenerActive) {
            document.removeEventListener('keydown', handleKeyInput); // Remove if somehow added before
            document.addEventListener('keydown', handleKeyInput);
            keydownListenerActive = true;
            console.log("[2048] Keyboard listeners set up.");
        } else {
            console.log("[2048] Keyboard listeners already active.");
        }
        // Swipe/touch listeners have been removed.
    }
    
    function startGame() {
        console.log("[2048] startGame() function called.");
        currentScore = 0;
        gameWon = false;
        overlayMessageEl.style.display = 'none';
        
        createBoard();
        addRandomTile(); // Will flag for 'spawn'
        addRandomTile(); // Will flag for 'spawn'
        drawTiles();     // Will use flags for animation
        setupInputListeners();
        console.log("[2048] Game initialized and started. Board state:", JSON.parse(JSON.stringify(board)));
    }

    restartButtonEl.addEventListener('click', startGame);

    // Initial Start
    try {
        console.log("[2048] Scheduling initial startGame call.");
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            requestAnimationFrame(() => requestAnimationFrame(startGame)); // Double RAF for layout stability
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                requestAnimationFrame(() => requestAnimationFrame(startGame));
            });
        }
    } catch (e) {
        console.error("[2048] CRITICAL ERROR during initial startGame() scheduling:", e);
        gameArea.innerHTML = "<p style='color:red;text-align:center;'>Fatal error starting 2048 game. Check console.</p>";
    }

})();