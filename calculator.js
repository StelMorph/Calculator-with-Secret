const display = document.getElementById('display');
const buttons = document.querySelectorAll('.buttons button');
const historyList = document.getElementById('history-list');
const calculatorView = document.getElementById('calculator-view');
const gameView = document.getElementById('game-view');
const gameArea = document.getElementById('game-area');
const guidanceContainer = document.querySelector('.guidance-container');

// --- Game Data for Guidance Panel ---
const gamesData = [
  { triggerDisplay: '1 + 1 =', name: 'Snake', script: 'games/snake.js' },
  { triggerDisplay: '2 + 2 =', name: 'Pong', script: 'games/pinpong.js' },
  { triggerDisplay: '3 + 3 =', name: 'Minesweeper', script: 'games/minesweeper.js' },
  { triggerDisplay: '4 + 4 =', name: 'Memory Match', script: 'games/memory-match.js' },
  { triggerDisplay: '5 + 5 =', name: 'Catch the Ball', script: 'games/catchtheball.js' },
  { triggerDisplay: '6 + 6 =', name: 'Color Reaction', script: 'games/color-reaction.js' },
  { triggerDisplay: '<strong>2048</strong> =', name: '2048 Game', script: 'games/twothousand-twentyeight.js' }
];

// --- Function to Populate Game Guidance List ---
function populateGuidance() {
  const gameListUl = document.getElementById('game-list-ul');
  if (gameListUl) {
    gameListUl.innerHTML = '';
    gamesData.forEach(game => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `${game.triggerDisplay} → ${game.name}`;
      gameListUl.appendChild(listItem);
    });
  }
}

// Button click events
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.textContent;
    if (value === 'C') {
      display.value = '';
    } else if (value === '=') {
      handleEqualPress();
    } else {
      if (value === '.' && display.value.includes('.')) return; 
      display.value += value;
    }
  });
});

// Keyboard input
document.addEventListener('keydown', (e) => {
  if (gameView && gameView.style.display === 'flex') {
    if (e.altKey && e.getModifierState('CapsLock')) {
      // Allow Alt+CapsLock to proceed
    } else {
      return; // Let the game handle all other input
    }
  }

  const key = e.key;
  if (key === 'Enter') {
     e.preventDefault();
     handleEqualPress();
  } else if (key === 'Escape') {
     display.value = '';
  }

  // Global shortcut to return from game
  if (e.altKey && e.getModifierState('CapsLock')) {
    hideGuidancePermanentlyForSession();
    if (gameView) gameView.style.display = 'none';
    if (calculatorView) calculatorView.style.display = 'flex';
    
    const oldGameScript = document.getElementById('active-game-script');
    if (oldGameScript) oldGameScript.remove();
    if (gameArea) gameArea.innerHTML = '';

    display.value = getRandomHardExpression();
    insertFakeHistory();
  }
});

// --- THIS FUNCTION IS FIXED ---
// Toggle guidance (temporary session hide)
function toggleGuidance() {
  const box = document.getElementById("guidance-box");
  const btn = document.querySelector(".guidance-container .toggle-button");
  if (box && btn) {
    // OLD LINE: if (box.style.display === "none") {
    // NEW LINE CHECKS FOR THE INITIAL HIDDEN STATE (empty string) AS WELL
    if (box.style.display === "none" || box.style.display === "") {
      box.style.display = "block";
      btn.textContent = "Hide Guidance";
    } else {
      box.style.display = "none";
      btn.textContent = "Show Guidance";
    }
  }
}
// --- END OF FIX ---

// Hides the entire guidance container for the session
function hideGuidancePermanentlyForSession() {
    if (guidanceContainer) {
        guidanceContainer.classList.add('hidden');
    }
}

// Run expression or launch game
function handleEqualPress() {
  const input = display.value.trim();

  switch (input) {
    case '1+1': launchGame('games/snake.js', 'Snake'); break;
    case '2+2': launchGame('games/pinpong.js', 'Pong'); break;
    case '3+3': launchGame('games/minesweeper.js', 'Minesweeper'); break;
    case '4+4': launchGame('games/memory-match.js', 'Memory Match'); break;
    case '5+5': launchGame('games/catchtheball.js', 'Catch the Ball'); break;
    case '6+6': launchGame('games/color-reaction.js', 'Color Reaction'); break;
    case '2048': launchGame('games/twothousand-twentyeight.js', '2048 Game'); break;
    default:
      try {
        const result = eval(input); 
        if (isNaN(result) || !isFinite(result)) throw new Error("Invalid");
        addHistory(`${input} = ${result}`);
        display.value = result;
      } catch (error) {
        display.value = 'Error';
      }
  }
}

// Launch game dynamically
function launchGame(scriptPath, gameDisplayName) {
  hideGuidancePermanentlyForSession();

  if (!calculatorView || !gameView || !gameArea) return;

  calculatorView.style.display = 'none';
  gameView.style.display = 'flex';
  gameArea.innerHTML = '';

  const oldGameScript = document.getElementById('active-game-script');
  if (oldGameScript) oldGameScript.remove();

  const script = document.createElement('script');
  script.id = 'active-game-script';
  script.src = scriptPath;
  script.async = false;
  script.onerror = () => {
      gameArea.innerHTML = `<p style="color:red; text-align:center;">Error loading game.</p>`;
  };
  document.body.appendChild(script);
}

// Random hard expression
function getRandomHardExpression() {
  const expressions = [
    '((32*14+108)/7 + 92 - 18) * 3', '(256 + 512) / (8 * 2) + 17',
  ];
  return expressions[Math.floor(Math.random() * expressions.length)];
}

// Add real history
function addHistory(entryText) {
  if (!historyList) return;
  const div = document.createElement('div');
  div.textContent = entryText;
  div.addEventListener('click', () => {
    display.value = entryText.split('=')[0].trim();
    if (display) display.focus();
  });
  historyList.prepend(div);
  if (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
}

// Fake realistic history
function insertFakeHistory() {
  if (!historyList) return;
  const entries = [
    '(12 + 34) * 2 = 92', '72 / (6 + 3) = 8', '(88 - 14) / 2 = 37',
  ];
  historyList.innerHTML = '';
  entries.forEach(text => addHistory(text));
}

// --- Initializations on page load ---
document.addEventListener('DOMContentLoaded', () => {
    populateGuidance();
    if (display) display.value = '';
    insertFakeHistory();
});