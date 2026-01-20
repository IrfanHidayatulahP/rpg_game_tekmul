import Player from '../models/Player.js';
import Enemy from '../models/Enemy.js';
import MeleeCharacter from '../models/MeleeCharacter.js';
import RangedCharacter from '../models/RangedCharacter.js';
import Ally from '../models/Ally.js';

export default class GameController {
    constructor(characterType = 'melee', startFloor = 1, difficulty = 'normal') {
        this.characterType = characterType;
        this.startingFloor = Math.max(1, startFloor | 0);
        this.floor = this.startingFloor;
        this.difficulty = difficulty;
        this.createPlayer();

        this.enemies = [];
        this.allies = [];

        this.slashes = [];
        this.skillEffects = [];
        this.hitEffects = [];
        this.projectiles = [];

        this.skillRequested = false;
        this.spawnForCurrentFloor();

        const btn = document.getElementById('skillBtn');
        if (btn) btn.addEventListener('click', () => (this.skillRequested = true));
    }

    createPlayer() {
        if (this.characterType === 'ranged') this.player = new RangedCharacter(120, 120);
        else if (this.characterType === 'melee') this.player = new MeleeCharacter(120, 120);
        else this.player = new Player(120, 120);
    }

    enemiesCountForFloor() {
        return 1 + Math.floor((this.floor - 1) / 3);
    }

    spawnEnemies(count) {
        this.enemies.length = 0;
        const baseHp = 30 + (this.floor - 1) * 18;
        const baseSpeed = 1.0 + (this.floor - 1) * 0.08;
        const diffMult = this.difficulty === 'hard' ? 1.4 : this.difficulty === 'easy' ? 0.7 : 1.0;

        for (let i = 0; i < count; i++) {
            const ex = width - 220 + (i * 48);
            const ey = height / 2 - 40 + (i * 30);
            const e = new Enemy(ex, ey);
            e.maxHp = Math.ceil(baseHp * diffMult);
            e.hp = e.maxHp;
            e.speed = baseSpeed * diffMult;
            e.isDead = false;
            this.enemies.push(e);
        }
    }

    spawnForCurrentFloor() {
        const count = this.enemiesCountForFloor();
        this.spawnEnemies(count);
    }

    addAlly(type = 'melee') {
        let template = null;
        if (type === 'melee') {
            template = new MeleeCharacter(0, 0);
        } else {
            template = new RangedCharacter(0, 0);
        }

        const stats = {
            hp: template.hp,
            speed: template.speed,
            attackRange: template.attackRange,
            attackDamage: template.attackDamage,
            attackDelay: template.attackDelay,
            projectileSpeed: template.projectileSpeed || 0,
            projectileLife: template.projectileLife || 0,
            attackArcDeg: template.attackArcDeg || 120
        };

        const a = new Ally(this.player.x + 40, this.player.y + 40, type, stats);
        this.allies.push(a);
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e && !e.isDead);
    }

    getNearestEnemy() {
        const alive = this.getAliveEnemies();
        if (alive.length === 0) return null;

        const px = this.player.x + this.player.size / 2;
        const py = this.player.y + this.player.size / 2;

        let nearest = null;
        let minDist = Infinity;

        for (const e of alive) {
            const ex = e.x + e.size / 2;
            const ey = e.y + e.size / 2;
            const dist = Math.hypot(ex - px, ey - py);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }

        return nearest;
    }

    findTargetsInCone(range, arcDeg) {
        const px = this.player.x + this.player.size / 2;
        const py = this.player.y + this.player.size / 2;
        const facing = this.player.getFacingAngle();
        const halfRad = (arcDeg / 2) * Math.PI / 180;
        const hits = [];
        for (const e of this.getAliveEnemies()) {
            const ex = e.x + e.size / 2;
            const ey = e.y + e.size / 2;
            const d = Math.hypot(ex - px, ey - py);
            if (d <= range + e.size / 2) {
                const toAng = Math.atan2(ey - py, ex - px);
                let diff = Math.abs((facing - toAng + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                if (diff <= halfRad) hits.push({ enemy: e, dist: d });
            }
        }
        hits.sort((a, b) => a.dist - b.dist);
        return hits.map(h => h.enemy);
    }

    handleInput() {
        let dx = 0, dy = 0;
        if (keyIsDown(65)) dx = -1;
        if (keyIsDown(68)) dx = 1;
        if (keyIsDown(87)) dy = -1;
        if (keyIsDown(83)) dy = 1;
        if (keyIsDown(LEFT_ARROW)) dx = -1;
        if (keyIsDown(RIGHT_ARROW)) dx = 1;
        if (keyIsDown(UP_ARROW)) dy = -1;
        if (keyIsDown(DOWN_ARROW)) dy = 1;
        this.player.move(dx, dy);

        if (keyIsDown(32)) {
            if (this.player instanceof RangedCharacter) {
                const nearestEnemy = this.getNearestEnemy();
                const proj = this.player.attack(nearestEnemy);
                if (proj) this.projectiles.push(proj);
            } else {
                const targets = this.findTargetsInCone(this.player.attackRange, this.player.attackArcDeg);
                if (targets.length > 0) {
                    this.player.attack(targets[0]);
                    this.spawnSlash(targets[0].x + targets[0].size / 2, targets[0].y + targets[0].size / 2);
                } else {
                    this.player.attack(null);
                }
            }
        }

        if (keyIsDown(70)) this.skillRequested = true;
    }

    spawnSlash(x, y) { this.slashes.push({ x, y, life: 12, size: 22 }); }
    spawnSkillEffect(cx, cy) { this.skillEffects.push({ x: cx, y: cy, life: 30, size: 120 }); }
    spawnHitEffect(x, y) { this.hitEffects.push({ x, y, life: 18, size: 40 }); }

    update() {
        this.handleInput();
        this.player.update();

        for (let idx = 0; idx < this.allies.length; idx++) {
            const a = this.allies[idx];
            if (!a) continue;
            a.slotIndex = idx;
            a.totalAllies = this.allies.length;
            a.act(this.player, this.getAliveEnemies(), (proj) => this.projectiles.push(proj));
        }

        for (const e of this.enemies) {
            if (!e) continue;
            const hit = e.update(this.player);
            if (hit) this.spawnHitEffect(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2);
        }

        if (this.skillRequested) {
            if (this.player instanceof RangedCharacter) {
                const nearestEnemy = this.getNearestEnemy();
                const projs = this.player.useSkill(nearestEnemy);
                if (Array.isArray(projs)) this.projectiles.push(...projs);
            } else {
                const targets = this.findTargetsInCone(this.player.skillRange, this.player.skillArcDeg);
                for (const t of targets) t.takeDamage(this.player.skillDamage);
                this.spawnSkillEffect(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2);
                this.player.useSkill(null);
            }
            this.skillRequested = false;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.life--;
            if ((p.owner === 'player' || p.owner === 'ally') && this.getAliveEnemies().length) {
                for (const e of this.enemies) {
                    if (!e || e.isDead) continue;
                    if (p.x > e.x && p.x < e.x + e.size && p.y > e.y && p.y < e.y + e.size) {
                        e.takeDamage(p.damage);
                        this.spawnSlash(e.x + e.size / 2, e.y + e.size / 2);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            if (p && p.life <= 0) this.projectiles.splice(i, 1);
        }

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

    renderProjectiles() {
        for (const p of this.projectiles) {
            push();
            stroke(255, 200, 120, map(p.life, 0, 80, 0, 200) * 0.6);
            strokeWeight(2);
            line(p.x, p.y, p.x - p.dx * 0.8, p.y - p.dy * 0.8);
            noStroke();
            if (p.type === 'arrow') {
                const ang = Math.atan2(p.dy, p.dx);
                translate(p.x, p.y); rotate(ang);
                fill(255, 230, 150); ellipse(0, 0, 8, 5);
                fill(220, 160, 60); triangle(4, 0, -4, -3, -4, 3);
            } else {
                fill(255, 230, 150); ellipse(p.x, p.y, 8);
            }
            pop();
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

    render() {
        this.renderGrid();
        this.player.render();

        for (const a of this.allies) if (a) a.render();
        for (const e of this.enemies) if (e) e.render();

        this.renderProjectiles();
        this.renderSlashes();
        this.renderSkillEffects();
        this.renderHitEffects();

        push();
        fill(255);
        textSize(14);
        text(`Player HP: ${this.player.hp}`, 10, 20);
        text(`Enemies: ${this.getAliveEnemies().length}/${this.enemies.length}`, 10, 40);
        text(`Floor: ${this.floor}`, 10, 60);
        text(`Skill CD: ${Math.max(0, Math.ceil(this.player.skillCooldown / 60))}s`, 10, 80);
        pop();

    }

    nextFloor() {
        this.floor++;
        this.player.hp = Math.min(9999, this.player.hp + 20);
        this.slashes = []; this.projectiles = []; this.skillEffects = []; this.hitEffects = [];
        this.spawnForCurrentFloor();
    }

    restart() {
        this.floor = this.startingFloor;
        this.createPlayer();
        this.enemies = [];
        this.allies = [];
        this.projectiles = []; this.slashes = []; this.skillEffects = []; this.hitEffects = [];
        this.spawnForCurrentFloor();
        window.gameStarted = true;
        loop();
    }

    goToMenu() {
        window.gameStarted = false;
        const overlay = document.getElementById('startOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    renderGrid() {
        push();
        stroke(40); strokeWeight(1);
        for (let gx = 0; gx < width; gx += 50) line(gx, 0, gx, height);
        for (let gy = 0; gy < height; gy += 50) line(0, gy, width, gy);
        pop();
    }
}