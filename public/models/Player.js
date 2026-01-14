export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.speed = 4;
        this.hp = 100;

        // attack (defaults)
        this.attackRange = 70;
        this.attackDamage = 10;
        this.attackCooldown = 0;
        this.attackDelay = 20;
        this.attackArcDeg = 120;

        // skill (defaults)
        this.skillCooldown = 0;
        this.skillDelay = 180;
        this.skillDamage = 30;
        this.skillRange = 180;
        this.skillArcDeg = 160;

        // facing & movement
        this.facing = 'right';
        this.lastMove = { x: 1, y: 0 };

        // visuals
        this.showAttackArc = 0;
        this.showSkillArc = 0;
    }

    move(dx, dy) {
        // allow 0,0 (no move)
        if (dx === 0 && dy === 0) return;

        // normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        this.x = constrain(this.x, 0, width - this.size);
        this.y = constrain(this.y, 0, height - this.size);

        if (dx < 0) this.facing = 'left';
        else if (dx > 0) this.facing = 'right';

        if (dx !== 0) this.lastMove.x = dx;
        if (dy !== 0) this.lastMove.y = dy;
    }

    canAttack() {
        return this.attackCooldown === 0;
    }

    // facing angle (radians). Uses lastMove if present for diagonal facing.
    getFacingAngle() {
        if (this.lastMove && (this.lastMove.x !== 0 || this.lastMove.y !== 0)) {
            return Math.atan2(this.lastMove.y, this.lastMove.x);
        }
        return this.facing === 'right' ? 0 : Math.PI;
    }

    // melee cone attack (default). Returns:
    // - boolean true if hit,
    // - false if no hit or cooldown,
    // - for ranged override may return projectile object/array
    attack(enemy) {
        if (!this.canAttack() || !enemy || enemy.isDead) return false;

        const px = this.x + this.size / 2;
        const py = this.y + this.size / 2;
        const ex = enemy.x + enemy.size / 2;
        const ey = enemy.y + enemy.size / 2;

        const distance = Math.hypot(px - ex, py - ey);
        if (distance > this.attackRange + enemy.size / 2) {
            this.attackCooldown = this.attackDelay;
            this.showAttackArc = 6;
            return false;
        }

        const facingAng = this.getFacingAngle();
        const toEnemyAng = Math.atan2(ey - py, ex - px);
        const diff = Math.abs((facingAng - toEnemyAng + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        const halfArc = (this.attackArcDeg / 2) * (Math.PI / 180);
        const hit = diff <= halfArc;

        if (hit) enemy.takeDamage(this.attackDamage);

        this.attackCooldown = this.attackDelay;
        this.showAttackArc = 6;
        return hit;
    }

    useSkill(enemy) {
        // default: big melee cone
        if (this.skillCooldown > 0 || !enemy || enemy.isDead) return false;

        const px = this.x + this.size / 2;
        const py = this.y + this.size / 2;
        const ex = enemy.x + enemy.size / 2;
        const ey = enemy.y + enemy.size / 2;
        const distance = Math.hypot(px - ex, py - ey);

        if (distance > this.skillRange + enemy.size / 2) {
            this.skillCooldown = this.skillDelay;
            this.showSkillArc = 10;
            return false;
        }

        const facingAng = this.getFacingAngle();
        const toEnemyAng = Math.atan2(ey - py, ex - px);
        const diff = Math.abs((facingAng - toEnemyAng + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        const halfArc = (this.skillArcDeg / 2) * (Math.PI / 180);
        const hit = diff <= halfArc;
        if (hit) enemy.takeDamage(this.skillDamage);

        this.skillCooldown = this.skillDelay;
        this.showSkillArc = 10;
        return hit;
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillCooldown > 0) this.skillCooldown--;

        if (this.showAttackArc > 0) this.showAttackArc--;
        if (this.showSkillArc > 0) this.showSkillArc--;
    }

    // basic render (child classes may extend)
    render() {
        push();
        fill(0, 200, 255);
        stroke(255);
        strokeWeight(2);
        rect(this.x, this.y, this.size, this.size);

        // eyes
        fill(0);
        if (this.facing === 'right') {
            ellipse(this.x + this.size * 0.7, this.y + this.size * 0.35, 4, 4);
            ellipse(this.x + this.size * 0.7, this.y + this.size * 0.65, 4, 4);
        } else {
            ellipse(this.x + this.size * 0.3, this.y + this.size * 0.35, 4, 4);
            ellipse(this.x + this.size * 0.3, this.y + this.size * 0.65, 4, 4);
        }

        // draw attack arc if active
        if (this.showAttackArc > 0) {
            this.drawArc(this.attackRange, this.attackArcDeg, 200, 140, 40, 120);
        }
        if (this.showSkillArc > 0) {
            this.drawArc(this.skillRange, this.skillArcDeg, 255, 120, 20, 180);
        }

        // debug text
        noStroke();
        fill(255);
        textSize(12);
        text(`HP:${this.hp}`, this.x, this.y - 10);

        pop();
    }

    drawArc(range, arcDeg, r, g, b, alpha = 120) {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        const facing = this.getFacingAngle();
        const start = facing - (arcDeg / 2) * (Math.PI / 180);
        const end = facing + (arcDeg / 2) * (Math.PI / 180);
        push();
        translate(cx, cy);
        noStroke();
        fill(r, g, b, alpha * 0.6);
        arc(0, 0, range * 2, range * 2, start, end, PIE);
        pop();
    }
}
