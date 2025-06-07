// File: games/colorreaction.js

(function() {
    console.log("[ColorReaction] Script execution started."); // Log 1

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("[ColorReaction] CRITICAL ERROR: #game-area element not found! Script cannot proceed.");
        // Fallback: try to alert the user if console isn't open, though this is crude
        alert("ColorReaction FATAL ERROR: #game-area not found. Check console.");
        return;
    }
    console.log("[ColorReaction] #game-area found:", gameArea); // Log 2

    // Clear gameArea before injecting new content to be sure
    gameArea.innerHTML = '';
    console.log("[ColorReaction] #game-area cleared."); // Log 3

    // 1. Inject HTML Structure
    const gameHTML = `
        <div class="cr-game-container">
            <h1>Color Reaction!</h1>
            <div class="cr-stats-board">
                <span>Score: <span id="cr-score">0</span></span>
                <span>Lives: <span id="cr-lives">3</span></span>
            </div>
            <div id="cr-instruction-text">Click when the box is ...</div>
            <div id="cr-color-box-container">
                <div id="cr-color-box"></div>
            </div>
            <div id="cr-feedback" class="cr-feedback-message"></div>
            <div id="cr-game-over" style="display: none;">
                <h2>Game Over!</h2>
                <p>Final Score: <span id="cr-final-score">0</span></p>
                <button id="cr-restart-button">Play Again</button>
            </div>
            <p class="cr-exit-instructions">Click the box based on the instruction. Alt + CapsLock to return.</p>
        </div>
    `;
    try {
        gameArea.innerHTML = gameHTML;
        console.log("[ColorReaction] Full game HTML injected into #game-area."); // Log 4
    } catch (e) {
        console.error("[ColorReaction] Error during full game HTML injection:", e);
        gameArea.textContent = "Error injecting game HTML. Check console."; // Display error in game area
        return;
    }

    // 2. Inject CSS
    const crStyles = `
        .cr-game-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            color: #333;
            padding: 10px;
            position: relative;
            background-color: #fff;
        }
        .cr-game-container h1 { color: #8A2BE2; margin-bottom: 15px; font-size: 2em; }
        .cr-stats-board { font-size: 1.2em; margin-bottom: 15px; color: #4A4A4A; width: 90%; max-width: 350px; display: flex; justify-content: space-between; }
        #cr-instruction-text { font-size: 1.3em; font-weight: bold; margin-bottom: 20px; color: #333; padding: 10px; background-color: #f0f0f0; border-radius: 6px; min-height: 30px; text-align: center; }
        #cr-color-box-container { width: 150px; height: 150px; padding: 10px; background-color: #e0e0e0; border-radius: 10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        #cr-color-box { width: 130px; height: 130px; background-color: #777; border-radius: 8px; cursor: pointer; transition: background-color 0.1s ease-in-out; box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }
        .cr-feedback-message { min-height: 25px; margin-top: 15px; font-size: 1.1em; font-weight: bold; }
        .cr-feedback-correct { color: #28A745; }
        .cr-feedback-wrong { color: #DC3545; }
        #cr-game-over { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(240, 240, 240, 0.97); padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 100; color: #333; }
        #cr-game-over h2 { color: #8A2BE2; margin-top: 0; }
        #cr-restart-button { padding: 10px 20px; font-size: 1em; color: white; background-color: #8A2BE2; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px; }
        .cr-exit-instructions { font-size: 0.8em; color: #718096; margin-top: 20px; position: absolute; bottom: 10px; }
        @media (max-width: 480px), (max-height: 650px) {
            .cr-game-container h1 { font-size: 1.6em; margin-bottom: 10px; }
            .cr-stats-board { font-size: 1em; margin-bottom: 10px; }
            #cr-instruction-text { font-size: 1.1em; margin-bottom: 15px; }
            #cr-color-box-container { width: 120px; height: 120px; padding: 8px;}
            #cr-color-box { width: 100px; height: 100px; }
            #cr-game-over { padding: 20px; width: 85%; }
            .cr-exit-instructions { font-size: 0.7em; bottom: 5px; }
        }
    `;
    try {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = crStyles;
        gameArea.appendChild(styleSheet); // Append to gameArea, or document.head
        console.log("[ColorReaction] CSS injected."); // Log 5
    } catch (e) {
        console.error("[ColorReaction] Error during CSS injection:", e);
        gameArea.textContent = "Error injecting game CSS. Check console.";
        return;
    }

    // 3. JavaScript Logic for Color Reaction - Get Element References
    const scoreEl = document.getElementById('cr-score');
    const livesEl = document.getElementById('cr-lives');
    const instructionTextEl = document.getElementById('cr-instruction-text');
    const colorBoxEl = document.getElementById('cr-color-box');
    const feedbackEl = document.getElementById('cr-feedback');
    const gameOverEl = document.getElementById('cr-game-over');
    const finalScoreEl = document.getElementById('cr-final-score');
    const restartButton = document.getElementById('cr-restart-button');

    console.log("[ColorReaction] Attempting to get element #cr-score:", scoreEl); // Log 6.1
    console.log("[ColorReaction] Attempting to get element #cr-color-box:", colorBoxEl); // Log 6.2

    if (!scoreEl || !livesEl || !instructionTextEl || !colorBoxEl || !feedbackEl || !gameOverEl || !finalScoreEl || !restartButton) {
        console.error("[ColorReaction] CRITICAL ERROR: One or more game UI elements were not found in the DOM after HTML injection. Check IDs.");
        gameArea.innerHTML = "<p style='color:red;text-align:center;'>Error initializing: Game UI elements not found. Check console. Ensure IDs in HTML string match getElementById calls.</p>";
        return;
    }
    console.log("[ColorReaction] All critical game UI elements found. Proceeding with game logic setup."); // Log 7

    const colors = [
        { name: 'RED', value: '#FF4136' },
        { name: 'GREEN', value: '#2ECC40' },
        { name: 'BLUE', value: '#0074D9' },
        { name: 'YELLOW', value: '#FFDC00' },
        { name: 'PURPLE', value: '#B10DC9' },
        { name: 'ORANGE', value: '#FF851B' }
    ];

    let score = 0;
    let lives = 3;
    let currentTargetColorName = '';
    let currentBoxColorValue = '';
    let gameLoopTimeout;
    let canClick = false;
    let isGameOver = false;
    let reactionTimeBase = 2000;

    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function setNextRound() {
        console.log("[ColorReaction] setNextRound() called. isGameOver:", isGameOver); // Log SR1
        if (isGameOver) return;

        canClick = false;
        feedbackEl.textContent = '';
        feedbackEl.className = 'cr-feedback-message';

        const targetColorObj = getRandomColor();
        currentTargetColorName = targetColorObj.name;
        instructionTextEl.textContent = `Click on ${currentTargetColorName}`;
        instructionTextEl.style.color = targetColorObj.value;
        console.log("[ColorReaction] New target:", currentTargetColorName); // Log SR2

        let initialBoxColorObj;
        do {
            initialBoxColorObj = getRandomColor();
        } while (colors.length > 1 && initialBoxColorObj.name === currentTargetColorName);

        colorBoxEl.style.backgroundColor = initialBoxColorObj.value;
        currentBoxColorValue = initialBoxColorObj.value;
        console.log("[ColorReaction] Initial box color set to:", initialBoxColorObj.name); // Log SR3

        const shouldBeTargetInitially = Math.random() < 0.25;

        clearTimeout(gameLoopTimeout); // Clear previous timeout before setting a new one

        if (shouldBeTargetInitially && initialBoxColorObj.name === currentTargetColorName) {
            currentBoxColorValue = targetColorObj.value; // It's already target
            colorBoxEl.style.backgroundColor = currentBoxColorValue;
            canClick = true;
            console.log("[ColorReaction] Box is target initially. Can click."); // Log SR4
            gameLoopTimeout = setTimeout(() => {
                if (canClick && colors.find(c => c.value === currentBoxColorValue)?.name === currentTargetColorName) {
                    handleReaction(false, "Too slow!");
                }
                if (!isGameOver) setNextRound();
            }, reactionTimeBase + 500);
        } else {
            let changeCount = 0;
            const maxChanges = Math.floor(Math.random() * 3) + 1;

            function changeColorSequence() {
                console.log("[ColorReaction] changeColorSequence(), changeCount:", changeCount, "canClick:", canClick); // Log SR_CCS1
                if (isGameOver || !canClick) { // Check canClick here too
                    if(!canClick && !isGameOver) console.warn("[ColorReaction] changeColorSequence called but canClick is false.");
                    return;
                }

                if (changeCount < maxChanges) {
                    let newColorObj;
                    do {
                        newColorObj = getRandomColor();
                    } while (newColorObj.name === currentTargetColorName || newColorObj.value === currentBoxColorValue);
                    
                    currentBoxColorValue = newColorObj.value;
                    colorBoxEl.style.backgroundColor = currentBoxColorValue;
                    console.log("[ColorReaction] Intermediate box color:", newColorObj.name); // Log SR_CCS2
                    changeCount++;
                    gameLoopTimeout = setTimeout(changeColorSequence, reactionTimeBase * 0.5 + Math.random() * (reactionTimeBase * 0.4));
                } else {
                    currentBoxColorValue = targetColorObj.value;
                    colorBoxEl.style.backgroundColor = currentBoxColorValue;
                    console.log("[ColorReaction] Box is now TARGET color:", targetColorObj.name); // Log SR_CCS3
                    gameLoopTimeout = setTimeout(() => {
                         if (canClick && colors.find(c => c.value === currentBoxColorValue)?.name === currentTargetColorName) {
                             handleReaction(false, "Missed!");
                         }
                         if (!isGameOver) setNextRound();
                    }, reactionTimeBase);
                }
            }
            gameLoopTimeout = setTimeout(() => {
                console.log("[ColorReaction] Enabling click and starting color sequence."); // Log SR5
                canClick = true;
                changeColorSequence();
            }, 700 + Math.random() * 500);
        }
    }

    function handleReaction(isCorrect, message = "") {
        console.log("[ColorReaction] handleReaction() called. isCorrect:", isCorrect, "canClick:", canClick, "isGameOver:", isGameOver); // Log HR1
        // This check was too restrictive: if (!canClick && !isGameOver) return;
        // We need to process the reaction even if canClick was just turned false by a timeout.
        // The primary guard is isGameOver.
        if(isGameOver) return;


        clearTimeout(gameLoopTimeout);
        canClick = false; // Definitely disable clicks now for this round.

        if (isCorrect) {
            score += 10;
            scoreEl.textContent = score;
            feedbackEl.textContent = message || "Correct!";
            feedbackEl.className = 'cr-feedback-message cr-feedback-correct';
            if (reactionTimeBase > 600) reactionTimeBase -= 50;
            console.log("[ColorReaction] Correct reaction. Score:", score); // Log HR2
        } else {
            lives--;
            livesEl.textContent = lives;
            feedbackEl.textContent = message || "Wrong!";
            feedbackEl.className = 'cr-feedback-message cr-feedback-wrong';
            console.log("[ColorReaction] Incorrect reaction. Lives:", lives); // Log HR3
            if (lives <= 0) {
                endGame();
                return;
            }
        }

        if (!isGameOver) {
            console.log("[ColorReaction] Scheduling next round."); // Log HR4
            setTimeout(setNextRound, 1200);
        }
    }

    colorBoxEl.addEventListener('click', () => {
        console.log("[ColorReaction] Color box clicked. canClick:", canClick, "isGameOver:", isGameOver); // Log CB1
        if (!canClick || isGameOver) return;

        const actualBoxColorName = colors.find(c => c.value === currentBoxColorValue)?.name;
        const clickedColorIsTarget = (actualBoxColorName === currentTargetColorName);
        console.log("[ColorReaction] Clicked. Box is:", actualBoxColorName, "Target is:", currentTargetColorName, "Match:", clickedColorIsTarget); // Log CB2
        handleReaction(clickedColorIsTarget);
    });

    function startGame() {
        console.log("[ColorReaction] startGame() called."); // Log SG1
        isGameOver = false;
        score = 0;
        lives = 3;
        reactionTimeBase = 2000;
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        gameOverEl.style.display = 'none';
        feedbackEl.textContent = '';
        feedbackEl.className = 'cr-feedback-message';
        
        clearTimeout(gameLoopTimeout);
        setNextRound();
        console.log("[ColorReaction] Game started. Initial round set."); // Log SG2
    }

    function endGame() {
        console.log("[ColorReaction] endGame() called. Final Score:", score); // Log EG1
        isGameOver = true;
        canClick = false;
        clearTimeout(gameLoopTimeout);
        finalScoreEl.textContent = score;
        gameOverEl.style.display = 'block';
        instructionTextEl.textContent = "Game Over!";
        colorBoxEl.style.backgroundColor = "#777";
    }

    restartButton.addEventListener('click', () => {
        console.log("[ColorReaction] Restart button clicked."); // Log RB1
        startGame();
    });

    // Initial Start
    try {
        startGame();
    } catch (e) {
        console.error("[ColorReaction] Error during initial startGame():", e);
        gameArea.innerHTML = "<p style='color:red;text-align:center;'>Critical error starting Color Reaction game logic. Check console.</p>";
    }

})();