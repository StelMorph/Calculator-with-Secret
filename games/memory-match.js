// File: games/memory-match.js

(function() {
    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
        console.error("Memory Match Error: #game-area element not found!");
        return;
    }

    // 1. Inject HTML Structure for Memory Match
    gameArea.innerHTML = `
        <div class="memory-game-container">
            <h1>Memory Match</h1>
            <div class="memory-game-info">
                <div>Moves: <span id="mm-moves-count" class="mm-moves">0</span></div>
                <div>Matches: <span id="mm-matches-count" class="mm-matches-found">0</span> / <span id="mm-total-pairs">0</span></div>
            </div>
            <div class="memory-board" id="mm-memoryBoard"></div>
            <button id="mm-play-again">Play Again</button>
            <div id="mm-win-message" class="mm-win-message" style="display: none;"></div>
            <p class="mm-exit-instructions">Press Alt + CapsLock to return to Calculator</p>
        </div>
    `;

    // 2. Inject CSS
    const memoryMatchStyles = `
        .memory-game-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            color: #333; /* Text color inside game area */
            padding: 10px; /* Padding for smaller screens */
        }
        .memory-game-container h1 {
            color: #2A9D8F;
            margin-bottom: 15px;
            font-size: 2em;
        }
        .memory-game-info {
            display: flex;
            justify-content: space-between;
            width: 90%;
            max-width: 320px;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        .mm-moves, .mm-matches-found { /* Using specific class for game stats */
            font-weight: bold;
            color: #E76F51;
        }
        .memory-board { /* Scoped for Memory Match game */
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            perspective: 1000px;
            margin-bottom: 15px;
            padding: 8px;
            background-color: #4a5568; /* Slightly different board bg */
            border-radius: 8px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
        }
        .memory-board .card {
            width: 65px;
            height: 65px;
            background-color: #2A9D8F;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2em; /* Emoji size */
            cursor: pointer;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.5s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .memory-board .card.flipped, .memory-board .card.matched {
            transform: rotateY(180deg);
            background-color: #F4A261;
            cursor: default;
        }
        .memory-board .card .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
        }
        .memory-board .card .card-front {
            transform: rotateY(180deg);
        }
        .memory-board .card .card-back {
            /* Optional: content for card back, e.g., an icon or pattern */
            /* For now, it's just the background color from .card */
        }
        .memory-board .card.matched {
            background-color: #28A745; /* Green for matched pairs */
            box-shadow: 0 0 10px #1f7733; /* Darker green shadow */
            /* The emoji is on .card-front which will be visible */
        }
         .memory-board .card.matched .card-front {
             opacity: 0.8; /* Slight dim for clarity */
        }
        #mm-play-again { /* Specific ID for button */
            padding: 10px 20px;
            font-size: 1em;
            color: white;
            background-color: #E76F51;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.3s;
            margin-top: 10px;
        }
        #mm-play-again:hover {
            background-color: #d85a3a;
        }
        .mm-win-message { /* Specific class */
            font-size: 1.4em;
            color: #28A745;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
        }
        .mm-exit-instructions {
            font-size: 0.8em;
            color: #718096; /* Lighter gray */
            margin-top: 15px;
        }

        /* Responsive adjustments for game area */
        @media (max-width: 480px), (max-height: 650px) {
            .memory-game-container h1 { font-size: 1.6em; margin-bottom: 10px; }
            .memory-board { gap: 5px; padding: 5px; }
            .memory-board .card { width: 50px; height: 50px; font-size: 1.5em; }
            .memory-game-info { font-size: 0.9em; margin-bottom: 10px; max-width: 260px; }
            #mm-play-again { font-size: 0.9em; padding: 8px 15px; }
            .mm-win-message { font-size: 1.2em; }
            .mm-exit-instructions { font-size: 0.7em; }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = memoryMatchStyles;
    // Prepend style to ensure it's within gameArea if gameArea has specific scoping,
    // or append to head for global (but scoped by class names) application.
    // Appending to gameArea is fine if gameArea itself is cleared.
    gameArea.appendChild(styleSheet);


    // 3. JavaScript Logic for Memory Match
    const mm_board = document.getElementById('mm-memoryBoard');
    const mm_movesCountSpan = document.getElementById('mm-moves-count');
    const mm_matchesCountSpan = document.getElementById('mm-matches-count');
    const mm_totalPairsSpan = document.getElementById('mm-total-pairs');
    const mm_playAgainButton = document.getElementById('mm-play-again');
    const mm_winMessageDiv = document.getElementById('mm-win-message');

    // Ensure elements are found before proceeding
    if (!mm_board || !mm_movesCountSpan || !mm_matchesCountSpan || !mm_totalPairsSpan || !mm_playAgainButton || !mm_winMessageDiv) {
        console.error("Memory Match Error: One or more game elements were not found in the DOM after injection.");
        gameArea.innerHTML = "<p style='color:red;text-align:center;'>Error initializing Memory Match game components. Required elements missing.</p>";
        return;
    }

    const mm_items = ['🍕', '🎈', '🌟', '🎉', '🎁', '🚀', '🦄', '💡']; // 8 pairs
    let mm_cards = [];        // To store all card DOM elements
    let mm_flippedCards = []; // To store the 1 or 2 currently flipped cards
    let mm_matchedPairs = 0;
    let mm_moves = 0;
    let mm_totalPairs = mm_items.length;
    let mm_lockBoard = false; // To prevent clicking more than 2 cards or during checks

    function mm_createCardPairs() {
        const allItems = [...mm_items, ...mm_items]; // Duplicate for pairs
        // Fisher-Yates Shuffle algorithm
        for (let i = allItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        }
        return allItems;
    }

    function mm_generateBoard() {
        mm_board.innerHTML = ''; // Clear previous cards
        mm_winMessageDiv.style.display = 'none';
        mm_winMessageDiv.textContent = '';
        mm_totalPairsSpan.textContent = mm_totalPairs;

        const shuffledItems = mm_createCardPairs();

        shuffledItems.forEach(itemValue => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card'); // From injected CSS
            cardElement.dataset.item = itemValue; // Store the item value (emoji)

            // Card front (visible when flipped)
            const cardFaceFront = document.createElement('div');
            cardFaceFront.classList.add('card-face', 'card-front');
            cardFaceFront.textContent = itemValue;

            // Card back (visible initially)
            const cardFaceBack = document.createElement('div');
            cardFaceBack.classList.add('card-face', 'card-back');
            // cardFaceBack.textContent = '?'; // Optional placeholder for back

            cardElement.appendChild(cardFaceFront);
            cardElement.appendChild(cardFaceBack);

            cardElement.addEventListener('click', mm_handleCardClick);
            mm_board.appendChild(cardElement);
            mm_cards.push(cardElement); // Keep track of card elements
        });
    }

    function mm_handleCardClick(event) {
        if (mm_lockBoard) return; // Board is locked, do nothing
        const clickedCard = event.currentTarget;

        // Ignore if already flipped, matched, or is the first card clicked again
        if (clickedCard === mm_flippedCards[0] || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) {
            return;
        }

        clickedCard.classList.add('flipped');
        mm_flippedCards.push(clickedCard);

        if (mm_flippedCards.length === 2) {
            mm_moves++;
            mm_movesCountSpan.textContent = mm_moves;
            mm_checkForMatch();
        }
    }

    function mm_checkForMatch() {
        mm_lockBoard = true; // Lock the board during check/animation
        const [card1, card2] = mm_flippedCards;

        if (card1.dataset.item === card2.dataset.item) { // Match!
            card1.classList.add('matched');
            card2.classList.add('matched');
            mm_matchedPairs++;
            mm_matchesCountSpan.textContent = mm_matchedPairs;
            mm_flippedCards = []; // Reset for next pair
            mm_lockBoard = false; // Unlock board immediately for matches
            mm_checkWinCondition();
        } else { // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                mm_flippedCards = []; // Reset for next pair
                mm_lockBoard = false; // Unlock board after cards are flipped back
            }, 900); // Time to see non-matching cards
        }
    }

    function mm_checkWinCondition() {
        if (mm_matchedPairs === mm_totalPairs) {
            mm_winMessageDiv.textContent = `🎉 You won in ${mm_moves} moves! 🎉`;
            mm_winMessageDiv.style.display = 'block';
            mm_lockBoard = true; // Game over, lock board until reset
        }
    }

    function mm_resetGame() {
        // Reset game state variables
        mm_cards = [];
        mm_flippedCards = [];
        mm_matchedPairs = 0;
        mm_moves = 0;
        mm_lockBoard = false;

        // Update UI display
        mm_movesCountSpan.textContent = mm_moves;
        mm_matchesCountSpan.textContent = mm_matchedPairs;

        // Regenerate the board
        mm_generateBoard();
    }

    // Attach event listener to the play again button
    mm_playAgainButton.addEventListener('click', mm_resetGame);

    // Initialize Memory Match game
    mm_resetGame();

})(); // IIFE to encapsulate the game logic and avoid global scope pollution