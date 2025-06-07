// games/pinpong.js

(function() { // IIFE to encapsulate the game

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("Pong Game: Game area not found!");
        return;
    }

    // --- Dynamically create HTML and CSS for the Pong Game ---
    gameArea.innerHTML = `
        <div id="pongGameContainerInternal">
            <div id="pongUiContainer">
                <div id="pongScoreDisplay">Player 1: 0 - Player 2: 0</div>
                <div id="pongSpeedDisplay" style="font-size: 16px; margin: 5px 0; color: #c3c3e6;">Speed: 1.0</div>
                <div id="pongControlPanel">
                    <div>
                        <label for="pongGameMode">Mode:</label>
                        <select id="pongGameMode">
                            <option value="pvp">Player vs Player</option>
                            <option value="pvb" selected>Player vs Bot</option> {/* Changed selected here */}
                        </select>
                    </div>
                    <div id="pongBotDifficultyContainer" style="display: none;">
                        <label for="pongBotDifficulty">Bot:</label>
                        <select id="pongBotDifficulty">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option> {/* Default bot difficulty */}
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>
                <div id="pongMessage" style="font-size: 18px; min-height: 25px;">Press W, S, Up, or Down to Start</div>
                <button id="pongRestartButton" style="display: none;">Restart Game</button>
            </div>
            <canvas id="pongGameCanvas"></canvas>
        </div>
    `;

    const style = document.createElement('style');
    style.id = 'pongGameStyles';
    style.textContent = `
        #pongGameContainerInternal {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: #1a1a2e;
            color: #e0e1dd;
            font-family: 'Consolas', 'Courier New', monospace;
            box-sizing: border-box;
        }
        #pongGameCanvas {
            border: 3px solid #4a4e69;
            background-color: #0f0f1a;
            box-shadow: 0 0 15px rgba(74,78,105,0.5);
        }
        #pongUiContainer {
            margin-bottom: 15px;
            text-align: center;
        }
        #pongScoreDisplay {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #fca311;
        }
        #pongControlPanel {
            margin: 10px 0;
            padding: 10px;
            background-color: #2a2a3e;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        #pongControlPanel div { display: flex; align-items: center; }
        #pongControlPanel label { margin-right: 8px; font-size: 14px; color: #c3c3e6; }
        #pongControlPanel select {
            padding: 6px 10px; font-size: 14px; background-color: #3a3a4e;
            color: #e0e1dd; border: 1px solid #4a4e69; border-radius: 4px; cursor: pointer;
        }
        #pongControlPanel select:focus {
            outline: none; border-color: #fca311; box-shadow: 0 0 5px rgba(252,163,17,0.5);
        }
        #pongMessage { color: #c3c3e6; }
        #pongRestartButton {
            margin-top: 10px; padding: 8px 16px; font-size: 16px; background-color: #fca311;
            color: #1a1a2e; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s;
        }
        #pongRestartButton:hover { background-color: #e89200; }
    `;
    const existingStyle = document.getElementById('pongGameStyles');
    if (existingStyle) existingStyle.remove();
    document.head.prepend(style);

    const canvas = document.getElementById('pongGameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('pongScoreDisplay');
    const speedDisplay = document.getElementById('pongSpeedDisplay');
    const messageDisplay = document.getElementById('pongMessage');
    const restartButton = document.getElementById('pongRestartButton');
    const gameModeSelect = document.getElementById('pongGameMode');
    const botDifficultySelect = document.getElementById('pongBotDifficulty');
    const botDifficultyContainer = document.getElementById('pongBotDifficultyContainer');

    // --- Game Configuration ---
    canvas.width = 800;
    canvas.height = 500;

    const PADDLE_WIDTH = 15;
    const PADDLE_HEIGHT = 100;
    const PADDLE_SPEED = 8;
    const BALL_RADIUS = 10;
    const WINNING_SCORE = 5;

    // --- Ball Speed Configuration ---
    const BASE_BALL_SPEED_X_UNIT = 6;
    const BASE_BALL_SPEED_Y_UNIT = 4;
    const INITIAL_DISPLAY_SPEED = 1.0;
    const TARGET_X_SPEED_AT_DISPLAY_ONE = 5.0;
    const ACTUAL_SPEED_FACTOR_AT_DISPLAY_ONE = TARGET_X_SPEED_AT_DISPLAY_ONE / BASE_BALL_SPEED_X_UNIT;
    const MAX_DISPLAY_SPEED = 3.0;
    const DISPLAY_SPEED_INCREMENT_PER_HIT = 0.1;

    // --- Game State Variables ---
    let ball, leftPaddle, rightPaddle, player1Score, player2Score;
    let gameRunning = false;
    let gameInterval;
    let keysPressed = {};
    let currentDisplaySpeedValue = INITIAL_DISPLAY_SPEED;

    // Default game mode to Player vs Bot
    let gameMode = 'pvb'; // Explicitly set default game mode
    let botDifficulty = botDifficultySelect.value; // Reads default from HTML (medium)

    // --- Game Objects ---
    function createPaddle(x) { return { x:x, y:canvas.height/2-PADDLE_HEIGHT/2, width:PADDLE_WIDTH, height:PADDLE_HEIGHT, dy:0 }; }

    function createBall() {
        const effectiveSpeedMultiplier = ACTUAL_SPEED_FACTOR_AT_DISPLAY_ONE * currentDisplaySpeedValue;
        const initialSpeedX = BASE_BALL_SPEED_X_UNIT * effectiveSpeedMultiplier * (Math.random() > 0.5 ? 1 : -1);
        let initialSpeedY = (Math.random() * 2 - 1) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier * 0.8;
        if (Math.abs(initialSpeedY) < 0.1 * effectiveSpeedMultiplier && effectiveSpeedMultiplier > 0) {
            initialSpeedY = (initialSpeedY >= 0 ? 0.2 : -0.2) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;
        }
        return { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, speedX: initialSpeedX, speedY: initialSpeedY };
    }

    // --- Game Logic ---
    function initializeGame() {
        currentDisplaySpeedValue = INITIAL_DISPLAY_SPEED;
        leftPaddle = createPaddle(30);
        rightPaddle = createPaddle(canvas.width - 30 - PADDLE_WIDTH);
        ball = createBall();
        player1Score = 0;
        player2Score = 0;
        
        updateScoreDisplay();
        updateSpeedDisplay();

        // Ensure the select dropdowns reflect the current game state
        gameModeSelect.value = gameMode;
        botDifficultySelect.value = botDifficulty;

        const startMessageBase = "Press W, S, Up, or Down to Start.";
        if (gameMode === 'pvb') {
            messageDisplay.textContent = `Player vs Bot (${botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)})! ${startMessageBase}`;
            botDifficultyContainer.style.display = 'flex'; // Show bot difficulty selector
        } else {
            messageDisplay.textContent = `Player vs Player! ${startMessageBase}`;
            botDifficultyContainer.style.display = 'none'; // Hide bot difficulty selector
        }
        
        restartButton.style.display = 'none';
        gameRunning = false;
        
        gameModeSelect.disabled = false;
        botDifficultySelect.disabled = false;


        draw();
        if (gameInterval) clearInterval(gameInterval);
    }

    function startGame() {
        if (gameRunning) return;
        gameRunning = true;
        messageDisplay.textContent = ""; 
        
        if (player1Score > 0 || player2Score > 0 || ball.speedX === 0) {
            resetBallStateAndSpeed();
        } else {
            const effectiveSpeedMultiplier = ACTUAL_SPEED_FACTOR_AT_DISPLAY_ONE * currentDisplaySpeedValue;
            ball.speedX = Math.sign(ball.speedX || (Math.random() > 0.5 ? 1: -1)) * BASE_BALL_SPEED_X_UNIT * effectiveSpeedMultiplier;
            ball.speedY = (ball.speedY === 0 ? (Math.random() * 2 - 1) * 0.8 : Math.sign(ball.speedY)) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;
             if (Math.abs(ball.speedY) < 0.1 * effectiveSpeedMultiplier && effectiveSpeedMultiplier > 0) {
                ball.speedY = (ball.speedY >= 0 ? 0.2 : -0.2) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;
            }
        }
        updateSpeedDisplay();
        
        gameModeSelect.disabled = true;
        botDifficultySelect.disabled = true;
        restartButton.style.display = 'none';

        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 1000 / 60);
    }
    
    function resetBallStateAndSpeed() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        
        const effectiveSpeedMultiplier = ACTUAL_SPEED_FACTOR_AT_DISPLAY_ONE * currentDisplaySpeedValue;
        let serveDirection;
        if (player1Score > player2Score) serveDirection = 1; 
        else if (player2Score > player1Score) serveDirection = -1; 
        else serveDirection = (Math.random() > 0.5 ? 1 : -1);

        ball.speedX = BASE_BALL_SPEED_X_UNIT * effectiveSpeedMultiplier * serveDirection;
        ball.speedY = (Math.random() * 2 - 1) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier * 0.8; 
        if (Math.abs(ball.speedY) < 0.1 * effectiveSpeedMultiplier && effectiveSpeedMultiplier > 0) {
            ball.speedY = (ball.speedY >= 0 ? 0.2 : -0.2) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;
        }
    }

    function gameLoop() {
        if (!gameRunning) return;
        update();
        draw();
        updateSpeedDisplay();
    }

    function moveBotPaddle() { 
        let reactionSpeed = PADDLE_SPEED;
        let accuracyErrorFactor = 0;
        let idealTargetY = ball.y;

        if (botDifficulty === 'easy') {
            reactionSpeed = PADDLE_SPEED * 0.45; accuracyErrorFactor = 0.35; 
            if (ball.x < canvas.width * 0.4 && ball.speedX > 0) idealTargetY = canvas.height / 2; 
        } else if (botDifficulty === 'medium') {
            reactionSpeed = PADDLE_SPEED * 0.7; accuracyErrorFactor = 0.15;
        } else if (botDifficulty === 'hard') {
            reactionSpeed = PADDLE_SPEED * 0.95; accuracyErrorFactor = 0.05; 
            if (ball.speedX < 0) { 
                const timeToReachPaddle = Math.abs((rightPaddle.x - PADDLE_WIDTH / 2) - (ball.x + ball.radius)) / (Math.abs(ball.speedX) + 0.1);
                if (timeToReachPaddle > 0 && timeToReachPaddle < (canvas.width / (Math.abs(ball.speedX)+0.1)) * 0.75) {
                     idealTargetY = ball.y + ball.speedY * timeToReachPaddle * 0.8;
                }
            }
        }
        const randomOffset = (Math.random() - 0.5) * 2 * (PADDLE_HEIGHT * accuracyErrorFactor);
        const finalTargetY = idealTargetY + randomOffset;
        const targetPaddleCenterY = Math.max(PADDLE_HEIGHT / 2, Math.min(canvas.height - PADDLE_HEIGHT / 2, finalTargetY));
        const currentPaddleCenterY = rightPaddle.y + PADDLE_HEIGHT / 2;
        if (currentPaddleCenterY < targetPaddleCenterY - reactionSpeed * 0.25) rightPaddle.dy = reactionSpeed;
        else if (currentPaddleCenterY > targetPaddleCenterY + reactionSpeed * 0.25) rightPaddle.dy = -reactionSpeed;
        else {
            let diff = targetPaddleCenterY - currentPaddleCenterY;
            if (Math.abs(diff) < reactionSpeed * 0.25 && Math.abs(diff) > 1) rightPaddle.dy = Math.sign(diff) * Math.min(Math.abs(diff), reactionSpeed * 0.5);
            else rightPaddle.dy = 0;
        }
    }

    function update() {
        if (keysPressed['w']) leftPaddle.dy = -PADDLE_SPEED;
        else if (keysPressed['s']) leftPaddle.dy = PADDLE_SPEED;
        else if(leftPaddle) leftPaddle.dy = 0;
        leftPaddle.y += leftPaddle.dy;

        if (gameMode === 'pvb') { moveBotPaddle(); rightPaddle.y += rightPaddle.dy; }
        else {
            if (keysPressed['arrowup']) rightPaddle.dy = -PADDLE_SPEED;
            else if (keysPressed['arrowdown']) rightPaddle.dy = PADDLE_SPEED;
            else if (rightPaddle) rightPaddle.dy = 0;
            rightPaddle.y += rightPaddle.dy;
        }

        leftPaddle.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, leftPaddle.y));
        rightPaddle.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddle.y));

        ball.x += ball.speedX;
        ball.y += ball.speedY;

        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.speedY *= -1;
            if (ball.y - ball.radius < 0) ball.y = ball.radius;
            if (ball.y + ball.radius > canvas.height) ball.y = canvas.height - ball.radius;
        }

        function checkPaddleCollision(paddle) { 
            const ballTop = ball.y - ball.radius; const ballBottom = ball.y + ball.radius;
            const ballLeft = ball.x - ball.radius; const ballRight = ball.x + ball.radius;
            const paddleTop = paddle.y; const paddleBottom = paddle.y + paddle.height;
            const paddleLeft = paddle.x; const paddleRight = paddle.x + paddle.width;
            return ballRight > paddleLeft && ballLeft < paddleRight && ballBottom > paddleTop && ballTop < paddleBottom;
        }
        
        let hitPaddle = null;
        if (checkPaddleCollision(leftPaddle) && ball.speedX < 0) {
            hitPaddle = leftPaddle; ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        } else if (checkPaddleCollision(rightPaddle) && ball.speedX > 0) {
            hitPaddle = rightPaddle; ball.x = rightPaddle.x - ball.radius;
        }

        if (hitPaddle) {
            currentDisplaySpeedValue = Math.min(MAX_DISPLAY_SPEED, currentDisplaySpeedValue + DISPLAY_SPEED_INCREMENT_PER_HIT);
            const effectiveSpeedMultiplier = ACTUAL_SPEED_FACTOR_AT_DISPLAY_ONE * currentDisplaySpeedValue;
            
            ball.speedX *= -1;
            ball.speedX = Math.sign(ball.speedX) * BASE_BALL_SPEED_X_UNIT * effectiveSpeedMultiplier;

            let impactFactor = (ball.y - (hitPaddle.y + hitPaddle.height / 2)) / (hitPaddle.height / 2);
            impactFactor = Math.max(-1, Math.min(1, impactFactor));
            ball.speedY = impactFactor * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;

            if (Math.abs(ball.speedY) < 0.1 * effectiveSpeedMultiplier && effectiveSpeedMultiplier > 0) { 
                ball.speedY = (Math.random() > 0.5 ? 0.2 : -0.2) * BASE_BALL_SPEED_Y_UNIT * effectiveSpeedMultiplier;
            }
        }

        if (ball.x - ball.radius < 0) { player2Score++; handleScore(); }
        else if (ball.x + ball.radius > canvas.width) { player1Score++; handleScore(); }
    }

    function handleScore() {
        updateScoreDisplay();
        currentDisplaySpeedValue = INITIAL_DISPLAY_SPEED;
        const player2Name = gameMode === 'pvb' ? `Bot (${botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)})` : 'Player 2';
        if (player1Score >= WINNING_SCORE) endGame(`Player 1 Wins!`);
        else if (player2Score >= WINNING_SCORE) endGame(`${player2Name} Wins!`);
        else {
            resetBallStateAndSpeed();
        }
    }

    function endGame(winnerText) {
        gameRunning = false; messageDisplay.textContent = winnerText + " Press Enter to Restart.";
        restartButton.style.display = 'block'; gameModeSelect.disabled = false; botDifficultySelect.disabled = false;
        clearInterval(gameInterval);
    }

    function updateScoreDisplay() {
        const player2Name = gameMode === 'pvb' ? `Bot` : 'Player 2';
        scoreDisplay.textContent = `Player 1: ${player1Score} - ${player2Name}: ${player2Score}`;
    }

    function updateSpeedDisplay() {
        speedDisplay.textContent = `Speed: ${currentDisplaySpeedValue.toFixed(1)}`;
    }

    function draw() { 
        ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#4a4e69'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e0e1dd';
        if (leftPaddle) ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
        if (rightPaddle) ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
        if (ball) { ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill(); }
    }

    function handleKeyDown(event) { 
        const key = event.key.toLowerCase(); keysPressed[key] = true;
        if (!gameRunning) {
            if ((player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) && key === 'enter') {
                event.preventDefault(); initializeGame(); startGame();
            } else if (!(player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) && 
                     ['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
                event.preventDefault(); startGame();
            }
        }
    }
    function handleKeyUp(event) { 
        const key = event.key.toLowerCase(); keysPressed[key] = false;
        if (key === 'w' || key === 's') {
            if (!keysPressed['w'] && !keysPressed['s'] && leftPaddle) leftPaddle.dy = 0;
            else if (keysPressed['w'] && leftPaddle) leftPaddle.dy = -PADDLE_SPEED;
            else if (keysPressed['s'] && leftPaddle) leftPaddle.dy = PADDLE_SPEED;
        }
        if (gameMode === 'pvp' && (key === 'arrowup' || key === 'arrowdown')) {
            if (!keysPressed['arrowup'] && !keysPressed['arrowdown'] && rightPaddle) rightPaddle.dy = 0;
            else if (keysPressed['arrowup'] && rightPaddle) rightPaddle.dy = -PADDLE_SPEED;
            else if (keysPressed['arrowdown'] && rightPaddle) rightPaddle.dy = PADDLE_SPEED;
        }
    }

    gameModeSelect.addEventListener('change', (event) => { gameMode = event.target.value; initializeGame(); });
    botDifficultySelect.addEventListener('change', (event) => { botDifficulty = event.target.value; initializeGame(); });
    restartButton.addEventListener('click', () => { initializeGame(); startGame(); });
    
    const boundKeyDown = handleKeyDown.bind(this); const boundKeyUp = handleKeyUp.bind(this);
    function cleanupGame() { 
        clearInterval(gameInterval); document.removeEventListener('keydown', boundKeyDown); document.removeEventListener('keyup', boundKeyUp);
        const styleTag = document.getElementById('pongGameStyles'); if (styleTag) styleTag.remove(); console.log("Pong Game cleaned up.");
    }
    document.addEventListener('keydown', boundKeyDown); document.addEventListener('keyup', boundKeyUp);
    
    // Initialize the game. Since gameMode is now defaulted to 'pvb',
    // initializeGame() will set up the UI accordingly.
    initializeGame();

    const observer = new MutationObserver((mutationsList, observerInstance) => { 
        for (const mutation of mutationsList) { if (mutation.type === 'childList') {
                let stillPresent = false; gameArea.childNodes.forEach(node => { if (node.id === 'pongGameContainerInternal') stillPresent = true; });
                if (!stillPresent) { cleanupGame(); observerInstance.disconnect(); break; }
            }}});
    if (gameArea) observer.observe(gameArea, { childList: true });
})();