import Player from '../models/Player.js';
import Enemy from '../models/Enemy.js';
import MeleeCharacter from '../models/MeleeCharacter.js';
import RangedCharacter from '../models/RangedCharacter.js';

export default class GameController {
    constructor(characterType = 'melee') {
        // choose hero class
        if (characterType === 'ranged') {
            this.player = new RangedCharacter(120, 120);
        } else if (characterType === 'melee') {
            this.player = new MeleeCharacter(120, 120);
        } else {
            this.player = new Player(120, 120); // fallback
        }

        this.enemy = new Enemy(600, 120);

        // effects and projectiles
        this.slashes = [];
        this.skillEffects = [];
        this.hitEffects = [];
        this.projectiles = []; // {x,y,dx,dy,damage,life,owner}

        // skill button hook
        this.skillRequested = false;
        const btn = document.getElementById('skillBtn');
        if (btn) btn.addEventListener('click', () => (this.skillRequested = true));
    }

    handleInput() {
        let dx = 0;
        let dy = 0;

        if (keyIsDown(65)) dx = -1;
        if (keyIsDown(68)) dx = 1;
        if (keyIsDown(87)) dy = -1;
        if (keyIsDown(83)) dy = 1;

        if (keyIsDown(LEFT_ARROW)) dx = -1;
        if (keyIsDown(RIGHT_ARROW)) dx = 1;
        if (keyIsDown(UP_ARROW)) dy = -1;
        if (keyIsDown(DOWN_ARROW)) dy = 1;

        this.player.move(dx, dy);

        // attack: melee returns boolean (handled inside), ranged returns projectile or array
        if (keyIsDown(32)) {
            const result = this.player.attack(this.enemy);
            if (result) {
                // if ranged: result is object or array
                if (Array.isArray(result)) {
                    for (const p of result) this.projectiles.push(p);
                } else if (typeof result === 'object') {
                    this.projectiles.push(result);
                } else {
                    // melee hit -> spawn small slash
                    if (result === true) {
                        this.spawnSlash(this.enemy.x + this.enemy.size / 2, this.enemy.y + this.enemy.size / 2);
                    }
                }
            }
        }

        // skill via F
        if (keyIsDown(70)) this.skillRequested = true;
    }

    spawnSlash(x, y) {
        this.slashes.push({ x, y, life: 12, size: 22 });
    }

    spawnSkillEffect(cx, cy) {
        this.skillEffects.push({ x: cx, y: cy, life: 30, size: 120 });
    }

    spawnHitEffect(x, y) {
        this.hitEffects.push({ x, y, life: 18, size: 40 });
    }

    update() {
        this.handleInput();
        this.player.update();

        // enemy attack logic
        const enemyHit = this.enemy.update(this.player);
        if (enemyHit) this.spawnHitEffect(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2);

        // handle skillRequest (player.useSkill may return projectiles or boolean)
        if (this.skillRequested) {
            const skillResult = this.player.useSkill(this.enemy);
            if (skillResult) {
                if (Array.isArray(skillResult)) {
                    for (const p of skillResult) this.projectiles.push(p);
                } else if (typeof skillResult === 'object') {
                    this.projectiles.push(skillResult);
                } else if (skillResult === true) {
                    // melee skill hit spawn big effect
                    this.spawnSkillEffect(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2);
                }
            } else {
                // still spawn visual for skill activation
                this.spawnSkillEffect(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2);
            }
            this.skillRequested = false;
        }

        // update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.life--;
            // hit enemy?
            if (p.owner === 'player' && !this.enemy.isDead) {
                if (p.x > this.enemy.x && p.x < this.enemy.x + this.enemy.size &&
                    p.y > this.enemy.y && p.y < this.enemy.y + this.enemy.size) {
                    this.enemy.takeDamage(p.damage);
                    this.spawnSlash(this.enemy.x + this.enemy.size / 2, this.enemy.y + this.enemy.size / 2);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
            if (p.life <= 0) this.projectiles.splice(i, 1);
        }

        // update other effects (slahes/skill/hit) - same as before
        for (let i = this.slashes.length - 1; i >= 0; i--) {
            this.slashes[i].life--;
            if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
        }
        for (let i = this.skillEffects.length - 1; i >= 0; i--) {
            this.skillEffects[i].life--;
            if (this.skillEffects[i].life <= 0) this.skillEffects.splice(i, 1);
        }
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].life--;
            if (this.hitEffects[i].life <= 0) this.hitEffects.splice(i, 1);
        }
    }

    render() {
        this.renderGrid();
        this.player.render();
        this.enemy.render();
        this.renderProjectiles();
        this.renderSlashes();
        this.renderSkillEffects();
        this.renderHitEffects();

        // HUD
        push();
        fill(255);
        textSize(14);
        text(`Player HP: ${this.player.hp}`, 10, 20);
        text(`Enemy HP: ${this.enemy.isDead ? 0 : this.enemy.hp}`, 10, 40);
        text(`Skill CD: ${Math.max(0, Math.ceil(this.player.skillCooldown / 60))}s`, 10, 60);
        pop();

        if (this.enemy.isDead) {
            push();
            fill(0, 255, 0);
            textSize(28);
            textAlign(CENTER, CENTER);
            text('ENEMY DEFEATED!', width / 2, height / 2);
            pop();
        }

        if (this.player.hp <= 0) {
            push();
            fill(255, 50, 50);
            textSize(36);
            textAlign(CENTER, CENTER);
            text('GAME OVER', width / 2, height / 2);
            pop();
            noLoop();
        }
    }

    renderSlashes() {
        for (const s of this.slashes) {
            push();
            translate(s.x, s.y);
            const alpha = map(s.life, 0, 12, 0, 255);
            stroke(255, 220, 0, alpha);
            strokeWeight(4);
            line(-s.size, 0, s.size, 0);
            pop();
        }
    }

    renderSkillEffects() {
        for (const eff of this.skillEffects) {
            push();
            translate(eff.x, eff.y);
            const alpha = map(eff.life, 0, eff.size / 2, 0, 200);
            noStroke();
            fill(255, 140, 0, alpha);
            ellipse(0, 0, lerp(eff.size * 0.5, eff.size, eff.life / 30));
            pop();
        }
    }

    renderHitEffects() {
        for (const h of this.hitEffects) {
            push();
            translate(h.x, h.y);
            const alpha = map(h.life, 0, 18, 0, 200);
            noStroke();
            fill(255, 80, 80, alpha);
            ellipse(0, 0, lerp(h.size * 0.3, h.size, h.life / 18));
            pop();
        }
    }

    renderProjectiles() {
        for (const p of this.projectiles) {
            push();

            // trail: a faint line behind projectile using remaining life
            const trailLen = 10;
            const alphaTrail = map(p.life, 0, p.life + 30, 0, 200);
            stroke(255, 200, 120, alphaTrail * 0.6);
            strokeWeight(2);
            // draw a short line opposite direction of velocity
            line(p.x, p.y, p.x - p.dx * 0.8, p.y - p.dy * 0.8);

            noStroke();

            if (p.type === 'arrow') {
                // draw rotated arrow / projectile
                const ang = Math.atan2(p.dy, p.dx);
                translate(p.x, p.y);
                rotate(ang);
                // body
                fill(255, 230, 150);
                ellipse(0, 0, 8, 5);
                // arrow head
                fill(220, 160, 60);
                triangle(4, 0, -4, -3, -4, 3);
            } else {
                // default small projectile
                fill(255, 230, 150);
                ellipse(p.x, p.y, 8);
            }

            pop();
        }
    }

    restart() {
        this.player = new Player(120, 120);
        this.enemy = new Enemy(600, 120);
    }

    goToMenu() {
        window.gameStarted = false;
        const overlay = document.getElementById('startOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    renderGrid() {
        push();
        stroke(40);
        strokeWeight(1);
        for (let gx = 0; gx < width; gx += 50) line(gx, 0, gx, height);
        for (let gy = 0; gy < height; gy += 50) line(0, gy, width, gy);
        pop();
    }
}
