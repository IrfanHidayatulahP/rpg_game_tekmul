import GameController from './controllers/GameController.js';

let game = null;
window.gameStarted = false;
window.awaitingNextFloor = false;

window.startGame = function (difficulty = 'normal') {
  const sel = window.__selectedCharacterType || 'melee';
  const floorEl = document.getElementById('startFloor');
  const startFloor = floorEl ? Math.max(1, parseInt(floorEl.value || 1)) : 1;

  game = new GameController(sel, startFloor, difficulty);

  const ov = document.getElementById('startOverlay'); if (ov) ov.style.display = 'none';
  const gameOverOv = document.getElementById('gameOverOverlay'); if (gameOverOv) gameOverOv.style.display = 'none';
  toggleGameButtons(true);
  const canv = document.querySelector('canvas'); if (canv) canv.focus();

  window.gameStarted = true;
  window.awaitingNextFloor = false;
  console.log('Game started', sel, 'floor', startFloor, 'diff', difficulty);
};

window.setup = function () {
  const container = document.getElementById('game-root');
  const c = createCanvas(900, 550);
  c.parent('game-root');
  rectMode(CORNER); textFont('Arial');

  const startBtn = document.getElementById('startBtn');
  const diffEl = document.getElementById('difficulty');
  if (startBtn) startBtn.addEventListener('click', () => {
    const difficulty = diffEl ? diffEl.value : 'normal';
    window.startGame(difficulty);
  });

  const restartBtn = document.getElementById('restartBtn');
  const menuBtn = document.getElementById('menuBtn');
  if (restartBtn) restartBtn.addEventListener('click', () => { if (game) game.restart(); });
  if (menuBtn) menuBtn.addEventListener('click', () => { if (game) game.goToMenu(); toggleGameButtons(false); });

  const nextFloorBtn = document.getElementById('nextFloorBtn');
  const floorToMenuBtn = document.getElementById('floorToMenuBtn');
  if (nextFloorBtn) nextFloorBtn.addEventListener('click', () => {
    if (!game) return;
    const fo = document.getElementById('floorOverlay'); if (fo) fo.style.display = 'none';
    game.nextFloor();
    toggleGameButtons(true);
    window.awaitingNextFloor = false;
  });
  if (floorToMenuBtn) floorToMenuBtn.addEventListener('click', () => {
    const fo = document.getElementById('floorOverlay'); if (fo) fo.style.display = 'none';
    if (game) game.goToMenu();
    toggleGameButtons(false);
    window.awaitingNextFloor = false;
  });

  const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
  const gameOverMenuBtn = document.getElementById('gameOverMenuBtn');
  
  if (gameOverRestartBtn) gameOverRestartBtn.addEventListener('click', () => {
    const gameOverOv = document.getElementById('gameOverOverlay');
    if (gameOverOv) gameOverOv.style.display = 'none';
    if (game) {
      game.restart();
      toggleGameButtons(true);
      loop();
    }
  });

  if (gameOverMenuBtn) gameOverMenuBtn.addEventListener('click', () => {
    const gameOverOv = document.getElementById('gameOverOverlay');
    if (gameOverOv) gameOverOv.style.display = 'none';
    if (game) game.goToMenu();
    toggleGameButtons(false);
    loop();
  });

  toggleGameButtons(false);
};

window.draw = function () {
  background(12);

  if (!window.gameStarted || !game) {
    push(); fill(255, 255, 255, 6); noStroke(); rect(0, 0, width, height); pop();
    return;
  }

  game.update();
  game.render();

  if (game && game.player.hp <= 0) {
    showGameOverModal();
    noLoop();
    return;
  }

  if (game && game.getAliveEnemies().length === 0 && !window.awaitingNextFloor) {
    window.awaitingNextFloor = true;
    toggleGameButtons(false);

    if (game.floor % 3 === 0) {
      const helper = document.getElementById('helperOverlay');
      if (helper) helper.style.display = 'flex';
      document.getElementById('helperMeleeBtn').onclick = () => {
        if (game) game.addAlly('melee');
        helper.style.display = 'none';
        document.getElementById('nextFloorText').textContent = `You chose a helper — move to floor ${game.floor + 1}?`;
        document.getElementById('floorOverlay').style.display = 'flex';
      };
      document.getElementById('helperRangedBtn').onclick = () => {
        if (game) game.addAlly('ranged');
        helper.style.display = 'none';
        document.getElementById('nextFloorText').textContent = `You chose a helper — move to floor ${game.floor + 1}?`;
        document.getElementById('floorOverlay').style.display = 'flex';
      };
      document.getElementById('helperNoneBtn').onclick = () => {
        helper.style.display = 'none';
        document.getElementById('nextFloorText').textContent = `No helper chosen. Ready for floor ${game.floor + 1}?`;
        document.getElementById('floorOverlay').style.display = 'flex';
      };
    } else {
      document.getElementById('nextFloorText').textContent = `You cleared floor ${game.floor}! Ready for floor ${game.floor + 1}?`;
      document.getElementById('floorOverlay').style.display = 'flex';
    }
  }
};

function showGameOverModal() {
  if (!game) return;

  const gameOverOv = document.getElementById('gameOverOverlay');
  const statsEl = document.getElementById('gameOverStats');
  
  if (gameOverOv && statsEl) {
    const characterName = game.characterType === 'melee' ? '🛡️ Vanguard' : '🏹 Archer';
    const difficulty = game.difficulty === 'hard' ? '🔥 Hard' : game.difficulty === 'easy' ? '🌱 Easy' : '⚔️ Normal';
    
    statsEl.innerHTML = `
      <strong>Character:</strong> ${characterName}<br>
      <strong>Highest Floor Reached:</strong> Floor ${game.floor}<br>
      <strong>Difficulty:</strong> ${difficulty}<br>
      <strong>Allies:</strong> ${game.allies.length}
    `;
    
    gameOverOv.style.display = 'flex';
  }

  toggleGameButtons(false);
}

function toggleGameButtons(show) {
  document.getElementById('restartBtn').style.display = show ? 'block' : 'none';
  document.getElementById('menuBtn').style.display = show ? 'block' : 'none';
  document.getElementById('skillBtn').style.display = show ? 'block' : 'none';
}