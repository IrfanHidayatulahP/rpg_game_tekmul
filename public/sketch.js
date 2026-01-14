import GameController from './controllers/GameController.js';

let game;
window.gameStarted = false;

// fungsi global supaya button bisa memanggilnya
window.startGame = function (difficulty = 'normal') {
  // read selected character type from menu
  const sel = window.__selectedCharacterType || 'melee';
  game = new GameController(sel); // create with chosen char

  // apply difficulty
  if (difficulty === 'easy') {
    game.enemy.hp = 30;
    game.enemy.speed = 0.9;
  } else if (difficulty === 'hard') {
    game.enemy.hp = 80;
    game.enemy.speed = 1.7;
  } else {
    game.enemy.hp = 50;
    game.enemy.speed = 1.2;
  }

  // hide overlay
  const ov = document.getElementById('startOverlay');
  if (ov) ov.style.display = 'none';

  // show control buttons
  toggleGameButtons(true);

  // focus canvas
  const canv = document.querySelector('canvas');
  if (canv) canv.focus();

  window.gameStarted = true;
  console.log('Game started with', sel, 'difficulty', difficulty);
};

window.setup = function () {
  const container = document.getElementById('game-root');
  const c = createCanvas(900, 550);
  c.parent('game-root');
  rectMode(CORNER);
  textFont('Arial');

  // wire start button
  const startBtn = document.getElementById('startBtn');
  const diffEl = document.getElementById('difficulty');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const difficulty = diffEl ? diffEl.value : 'normal';
      window.startGame(difficulty);
    });
  }

  // restart/menu buttons wired after canvas created
  const restartBtn = document.getElementById('restartBtn');
  const menuBtn = document.getElementById('menuBtn');
  if (restartBtn) restartBtn.addEventListener('click', () => { if (game) game.restart(); });
  if (menuBtn) menuBtn.addEventListener('click', () => { if (game) game.goToMenu(); toggleGameButtons(false); });
  toggleGameButtons(false); // hide in menu initially
};

window.draw = function () {
  // draw dark background even on menu so canvas area looks consistent
  background(20);

  if (!window.gameStarted) {
    // optional: draw faint "paused" canvas background / logo behind overlay
    push();
    fill(255, 255, 255, 6);
    noStroke();
    rect(0, 0, width, height);
    pop();
    return;
  }

  // when started run the game
  game.update();
  game.render();
};

function toggleGameButtons(show) {
  document.getElementById('restartBtn').style.display = show ? 'block' : 'none';
  document.getElementById('menuBtn').style.display = show ? 'block' : 'none';
  document.getElementById('skillBtn').style.display = show ? 'block' : 'none';
}
