const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 20; i++) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.left = Math.random() * 100 + '%';
  particle.style.animationDelay = Math.random() * 8 + 's';
  particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
  particlesContainer.appendChild(particle);
}

(function () {
  const melee = document.getElementById('card-melee');
  const ranged = document.getElementById('card-ranged');

  function select(type) {
    melee.classList.toggle('selected', type === 'melee');
    ranged.classList.toggle('selected', type === 'ranged');
    window.__selectedCharacterType = type;
  }

  melee.addEventListener('click', () => select('melee'));
  ranged.addEventListener('click', () => select('ranged'));

  select('melee');
})();
