// File: games/catchtheball.js

(function() {
    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("Catch the Ball Error: #game-area element not found!");
        return;
    }

    // 1. Inject HTML Structure
    gameArea.innerHTML = `
        <div class="ctb-game-container">
            <h1>Catch the Ball!</h1>
            <div class="ctb-score-board">
                Score: <span id="ctb-score">0</span> | Lives: <span id="ctb-lives">3</span>
            </div>
            <canvas id="ctb-canvas"></canvas>
            <div id="ctb-game-over" style="display: none;">
                <h2>Game Over!</h2>
                <p>Final Score: <span id="ctb-final-score">0</span></p>
                <button id="ctb-restart-button">Play Again</button>
            </div>
            <p class="ctb-exit-instructions">Move mouse to control catcher. Press Alt + CapsLock to return.</p>
        </div>
    `;

    // 2. Inject CSS
    const ctbStyles = `
        .ctb-game-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center; /* Center content vertically */
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            color: #333;
            padding: 10px;
            position: relative; /* For absolute positioning of game over message */
        }
        .ctb-game-container h1 {
            color: #E76F51; /* Orange theme for this game */
            margin-bottom: 10px;
            font-size: 2em;
        }
        .ctb-score-board {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #2A9D8F; /* Teal for score */
        }
        #ctb-canvas {
            border: 2px solid #4A5568; /* Dark gray-blue border */
            background-color: #EDF2F7; /* Light gray background */
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        #ctb-game-over {
            display: none; /* Hidden by default */
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 100;
            color: #333;
        }
        #ctb-game-over h2 {
            color: #E76F51;
            margin-top: 0;
        }
        #ctb-restart-button {
            padding: 10px 20px;
            font-size: 1em;
            color: white;
            background-color: #2A9D8F;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 15px;
        }
        .ctb-exit-instructions {
            font-size: 0.8em;
            color: #718096;
            margin-top: 15px;
            position: absolute; /* Position at bottom */
            bottom: 10px;
        }
         /* Responsive adjustments for game area */
        @media (max-width: 600px), (max-height: 600px) {
            .ctb-game-container h1 { font-size: 1.5em; margin-bottom: 5px;}
            .ctb-score-board { font-size: 1em; margin-bottom: 5px;}
            #ctb-game-over { padding: 20px; width: 80%;}
            #ctb-game-over h2 { font-size: 1.3em;}
            #ctb-restart-button { font-size: 0.9em; padding: 8px 15px;}
            .ctb-exit-instructions { font-size: 0.7em; bottom: 5px;}
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = ctbStyles;
    gameArea.appendChild(styleSheet);

    // 3. JavaScript Logic for Catch the Ball
    const canvas = document.getElementById('ctb-canvas');
    const scoreEl = document.getElementById('ctb-score');
    const livesEl = document.getElementById('ctb-lives');
    const gameOverEl = document.getElementById('ctb-game-over');
    const finalScoreEl = document.getElementById('ctb-final-score');
    const restartButton = document.getElementById('ctb-restart-button');

    if (!canvas || !scoreEl || !livesEl || !gameOverEl || !finalScoreEl || !restartButton) {
        console.error("Catch the Ball Error: One or more critical game elements are missing from the DOM.");
        gameArea.innerHTML = "<p style='color:red;text-align:center;'>Error initializing Catch the Ball game components.</p>";
        return;
    }

    const ctx = canvas.getContext('2d');

    let canvasWidth, canvasHeight;

    const catcher = {
        width: 80,
        height: 15,
        x: 0, // Will be set based on canvas width
        y: 0, // Will be set based on canvas height
        color: '#2A9D8F', // Teal
        speed: 15 // Not used for mouse control, but could be for keyboard
    };

    const ballProps = {
        radius: 8,
        colors: ['#E76F51', '#F4A261', '#E9C46A', '#264653'], // Orange, Yellow, Dark Blue-Green
        minSpeedY: 1.5,
        maxSpeedY: 3.5,
        spawnInterval: 1200 // milliseconds
    };

    let score = 0;
    let lives = 3;
    let balls = [];
    let gameLoopId;
    let lastSpawnTime = 0;
    let isGameOver = false;

    function resizeCanvas() {
        const container = gameArea.querySelector('.ctb-game-container');
        // Aim for a canvas that fits well within the game area, considering other elements
        const availableWidth = container.clientWidth - 40; // Subtract padding
        const availableHeight = container.clientHeight - 150; // Subtract header, score, instructions

        // Max dimensions to prevent it from becoming too large on big screens
        const maxWidth = 600;
        const maxHeight = 400;

        canvasWidth = Math.min(availableWidth, maxWidth);
        canvasHeight = Math.min(availableHeight, maxHeight);

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Update catcher position after resize
        catcher.x = canvas.width / 2 - catcher.width / 2;
        catcher.y = canvas.height - catcher.height - 10; // 10px from bottom
    }


    function drawCatcher() {
        ctx.fillStyle = catcher.color;
        ctx.beginPath();
        ctx.roundRect(catcher.x, catcher.y, catcher.width, catcher.height, [5, 5, 0, 0]); // Rounded top corners
        ctx.fill();
    }

    function createBall() {
        const x = Math.random() * (canvas.width - ballProps.radius * 2) + ballProps.radius;
        const y = -ballProps.radius; // Start just above the canvas
        const speedY = Math.random() * (ballProps.maxSpeedY - ballProps.minSpeedY) + ballProps.minSpeedY;
        const color = ballProps.colors[Math.floor(Math.random() * ballProps.colors.length)];
        balls.push({ x, y, radius: ballProps.radius, speedY, color });
    }

    function drawBalls() {
        balls.forEach(ball => {
            ctx.fillStyle = ball.color;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function updateBalls() {
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            ball.y += ball.speedY;

            // Check for catch
            if (ball.y + ball.radius > catcher.y &&
                ball.y - ball.radius < catcher.y + catcher.height &&
                ball.x > catcher.x &&
                ball.x < catcher.x + catcher.width) {
                balls.splice(i, 1); // Remove caught ball
                score += 10;
                scoreEl.textContent = score;
                // Optional: play a sound or visual effect for catch
            }
            // Check if ball missed (went past bottom)
            else if (ball.y - ball.radius > canvas.height) {
                balls.splice(i, 1); // Remove missed ball
                lives--;
                livesEl.textContent = lives;
                if (lives <= 0) {
                    endGame();
                    return; // Exit loop as game is over
                }
            }
        }
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function gameLoop(currentTime) {
        if (isGameOver) return;

        clearCanvas();
        drawCatcher();
        drawBalls();
        updateBalls();

        // Spawn new balls periodically
        if (currentTime - lastSpawnTime > ballProps.spawnInterval) {
            createBall();
            lastSpawnTime = currentTime;
            // Gradually decrease spawn interval to increase difficulty (optional)
            if (ballProps.spawnInterval > 400) ballProps.spawnInterval -= 20;
        }

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function moveCatcher(event) {
        const rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;

        catcher.x = mouseX - catcher.width / 2;

        // Keep catcher within canvas bounds
        if (catcher.x < 0) catcher.x = 0;
        if (catcher.x + catcher.width > canvas.width) {
            catcher.x = canvas.width - catcher.width;
        }
    }
    
    function touchMoveCatcher(event) {
        if (event.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            let touchX = event.touches[0].clientX - rect.left;
            catcher.x = touchX - catcher.width / 2;

            if (catcher.x < 0) catcher.x = 0;
            if (catcher.x + catcher.width > canvas.width) {
                catcher.x = canvas.width - catcher.width;
            }
        }
        event.preventDefault(); // Prevent scrolling while touching canvas
    }


    function startGame() {
        isGameOver = false;
        score = 0;
        lives = 3;
        balls = [];
        lastSpawnTime = 0;
        ballProps.spawnInterval = 1200; // Reset spawn interval

        scoreEl.textContent = score;
        livesEl.textContent = lives;
        gameOverEl.style.display = 'none';

        resizeCanvas(); // Set initial canvas size and catcher position
        
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
        }
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function endGame() {
        isGameOver = true;
        cancelAnimationFrame(gameLoopId);
        finalScoreEl.textContent = score;
        gameOverEl.style.display = 'block';
    }

    // Event Listeners
    // Use gameArea for mousemove to allow moving catcher even if mouse is slightly outside canvas
    gameArea.addEventListener('mousemove', moveCatcher);
    canvas.addEventListener('touchmove', touchMoveCatcher, { passive: false });


    restartButton.addEventListener('click', startGame);
    window.addEventListener('resize', () => {
        if (!isGameOver) { // Only resize and redraw if game is active
            resizeCanvas();
            // No need to call gameLoop here, it's already running or will be started by startGame
        }
    });


    // Initial Start
    startGame();

})();