// games/snake.js (No Images, Colored Rectangles, Wraparound)

(function() { // IIFE to encapsulate the game

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("Snake Game: Game area not found!");
        return;
    }

    // --- Dynamically create HTML and CSS for the Snake Game ---
    gameArea.innerHTML = `
        <div id="snakeGameContainerInternal">
            <div id="snakeUiContainer">
                <div id="snakeScoreDisplay">Score: 0</div>
                <div id="snakeGameOverMessage" style="display: none;">Game Over!</div>
                <button id="snakeRestartButton" style="display: none;">Restart Game</button>
            </div>
            <canvas id="snakeGameCanvas"></canvas>
        </div>
    `;

    const style = document.createElement('style');
    style.id = 'snakeGameStyles';
    style.textContent = `
        #snakeGameContainerInternal {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: #2c3e50; /* Dark background for the game itself */
            color: #ecf0f1; /* Light text */
            font-family: 'Arial', sans-serif;
            box-sizing: border-box;
        }
        #snakeGameCanvas {
            border: 5px solid #34495e; /* Darker border */
            background-color: #ecf0f1; /* Light canvas background */
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        #snakeUiContainer {
            margin-bottom: 20px;
            text-align: center;
        }
        #snakeScoreDisplay {
            font-size: 24px;
            margin-bottom: 10px;
        }
        #snakeGameOverMessage {
            font-size: 32px;
            color: #e74c3c; /* Red for game over */
            margin-bottom: 15px;
        }
        #snakeRestartButton {
            padding: 10px 20px;
            font-size: 18px;
            background-color: #3498db; /* Blue button */
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        #snakeRestartButton:hover {
            background-color: #2980b9; /* Darker blue on hover */
        }
    `;
    const existingStyle = document.getElementById('snakeGameStyles');
    if (existingStyle) existingStyle.remove();
    document.head.prepend(style);


    const canvas = document.getElementById('snakeGameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('snakeScoreDisplay');
    const gameOverMessage = document.getElementById('snakeGameOverMessage');
    const restartButton = document.getElementById('snakeRestartButton');

    // --- Game Configuration ---
    // Make canvas somewhat responsive within the game area
    const availableWidth = gameArea.clientWidth * 0.9; // Use 90% of available width
    const availableHeight = (gameArea.clientHeight - 100) * 0.9; // Use 90% of available height (minus some space for UI)
    const baseCanvasSize = Math.min(availableWidth, availableHeight, 600); // Max 600px

    const gridSize = 20;   // Number of cells in the grid
    const tileSize = Math.floor(baseCanvasSize / gridSize); // Ensure integer tile size
    const canvasSize = tileSize * gridSize; // Actual canvas size

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // --- Game State Variables ---
    let snake, food, currentDx, currentDy, score, gameOver, gameLoopInterval, changingDirection;

    const SNAKE_COLOR = '#2ecc71';
    const SNAKE_HEAD_COLOR = '#27ae60';
    const FOOD_COLOR = '#e74c3c';
    const BORDER_COLOR = '#2c3e50'; // For segment borders
    const GAME_SPEED = 110; // Milliseconds

    // --- Game Functions ---

    function initializeGame() {
        snake = [
            { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
            { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
            { x: Math.floor(gridSize / 2) - 2, y: Math.floor(gridSize / 2) }
        ];
        currentDx = 1; // Start moving right
        currentDy = 0;
        score = 0;
        gameOver = false;
        changingDirection = false;

        placeFood();
        updateScoreDisplay();

        gameOverMessage.style.display = 'none';
        restartButton.style.display = 'none';

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
        console.log("Snake Game (No Images) Initialized");
    }

    function gameLoop() {
        if (gameOver) {
            handleGameOver();
            return;
        }
        changingDirection = false;
        moveSnake();
        clearCanvas();
        drawFood();
        drawSnake();
        checkSelfCollision(); // Only self-collision due to wraparound
    }

    function clearCanvas() {
        ctx.fillStyle = '#ecf0f1'; // Light canvas background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            ctx.fillStyle = (index === 0) ? SNAKE_HEAD_COLOR : SNAKE_COLOR;
            // Draw segment
            ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize, tileSize);

            // Draw border for better definition
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 1; // Thinner border
            ctx.strokeRect(segment.x * tileSize, segment.y * tileSize, tileSize, tileSize);
        });
    }

    function moveSnake() {
        const head = { x: snake[0].x + currentDx, y: snake[0].y + currentDy };

        // Wraparound logic
        if (head.x < 0) head.x = gridSize - 1;
        else if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        else if (head.y >= gridSize) head.y = 0;

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            updateScoreDisplay();
            placeFood();
        } else {
            snake.pop();
        }
    }

    function placeFood() {
        let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
        } while (isFoodOnSnake(newFoodPosition));
        food = newFoodPosition;
    }

    function isFoodOnSnake(position) {
        return snake.some(segment => segment.x === position.x && segment.y === position.y);
    }

    function drawFood() {
        ctx.fillStyle = FOOD_COLOR;
        ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
        // Optional: Add a border to food as well
        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
    }

    function checkSelfCollision() {
        const head = snake[0];
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver = true;
                return;
            }
        }
    }

    const boundHandleKeyDown = handleKeyDown.bind(this);

    function handleKeyDown(event) {
        if (changingDirection || gameOver) return;
        changingDirection = true;

        const keyPressed = event.key;
        const goingUp = currentDy === -1;
        const goingDown = currentDy === 1;
        const goingRight = currentDx === 1;
        const goingLeft = currentDx === -1;

        if ((keyPressed === "ArrowLeft" || keyPressed.toLowerCase() === "a") && !goingRight) {
            currentDx = -1; currentDy = 0;
        } else if ((keyPressed === "ArrowUp" || keyPressed.toLowerCase() === "w") && !goingDown) {
            currentDx = 0; currentDy = -1;
        } else if ((keyPressed === "ArrowRight" || keyPressed.toLowerCase() === "d") && !goingLeft) {
            currentDx = 1; currentDy = 0;
        } else if ((keyPressed === "ArrowDown" || keyPressed.toLowerCase() === "s") && !goingUp) {
            currentDx = 0; currentDy = 1;
        } else {
            changingDirection = false;
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    function handleGameOver() {
        clearInterval(gameLoopInterval);
        gameOverMessage.style.display = 'block';
        restartButton.style.display = 'block';
    }

    function cleanupGame() {
        clearInterval(gameLoopInterval);
        document.removeEventListener('keydown', boundHandleKeyDown);
        const styleTag = document.getElementById('snakeGameStyles');
        if (styleTag) styleTag.remove();
        console.log("Snake game (No Images) cleaned up.");
    }

    // --- Event Listeners & Start ---
    document.addEventListener('keydown', boundHandleKeyDown);
    restartButton.addEventListener('click', initializeGame);

    // Start the game
    initializeGame();

    // --- MutationObserver for cleanup ---
    const observer = new MutationObserver((mutationsList, observerInstance) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                let stillPresent = false;
                gameArea.childNodes.forEach(node => {
                    if (node.id === 'snakeGameContainerInternal') stillPresent = true;
                });
                if (!stillPresent) {
                    cleanupGame();
                    observerInstance.disconnect();
                    break;
                }
            }
        }
    });
    observer.observe(gameArea, { childList: true });

})();