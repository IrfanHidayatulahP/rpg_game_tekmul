export default class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 48;

        this.maxHp = 50;
        this.hp = this.maxHp;
        this.isDead = false;

        this.speed = 1.2;
        this.attackRange = 70;
        this.attackDamage = 8;
        this.attackDelay = 60; // frames
        this.attackCooldown = 0;

        this.facingAngle = 0;
        this.showAttackArc = 0;
    }

    // helper: minimal absolute angular difference in radians
    angleDiff(a, b) {
        let d = Math.abs(a - b) % (Math.PI * 2);
        if (d > Math.PI) d = Math.abs(d - Math.PI * 2);
        return d;
    }

    // calculate facing angle toward player
    getFacingAngleTo(player) {
        return Math.atan2(
            (player.y + player.size / 2) - (this.y + this.size / 2),
            (player.x + player.size / 2) - (this.x + this.size / 2)
        );
    }

    canAttack() {
        return this.attackCooldown === 0;
    }

    // attempt to attack player; returns true if attack HIT the player
    attack(player) {
        if (!this.canAttack() || this.isDead) return false;

        const px = player.x + player.size / 2;
        const py = player.y + player.size / 2;
        const ex = this.x + this.size / 2;
        const ey = this.y + this.size / 2;

        const distance = Math.hypot(px - ex, py - ey);

        // distance check
        if (distance > this.attackRange + player.size / 2) {
            // set cooldown & show arc anyway to indicate swing
            this.attackCooldown = this.attackDelay;
            this.showAttackArc = 8;
            return false;
        }

        // orientation: facingAngle should already point roughly to player (set in update)
        const facingAng = this.facingAngle;
        const toPlayerAng = Math.atan2(py - ey, px - ex);
        const diff = this.angleDiff(facingAng, toPlayerAng);
        const halfArcRad = (this.attackArcDeg / 2) * (Math.PI / 180);

        const hit = diff <= halfArcRad;

        if (hit) {
            player.hp = Math.max(0, player.hp - this.attackDamage);
            console.log('Player hit by enemy! HP:', player.hp);
        }

        // apply cooldown & show arc
        this.attackCooldown = this.attackDelay;
        this.showAttackArc = 12;
        return hit;
    }

    // update returns true if enemy attacked (hit) player this frame
    update(player) {
        if (this.isDead) return false;

        const px = player.x + player.size / 2;
        const py = player.y + player.size / 2;
        const ex = this.x + this.size / 2;
        const ey = this.y + this.size / 2;

        const dx = px - ex;
        const dy = py - ey;
        const dist = Math.hypot(dx, dy);

        this.facingAngle = Math.atan2(dy, dx);

        // move if too far
        if (dist > this.attackRange + 8) {
            this.x += Math.cos(this.facingAngle) * this.speed;
            this.y += Math.sin(this.facingAngle) * this.speed;
        }

        // cooldown handling
        if (this.attackCooldown > 0) this.attackCooldown--;

        // if in range try attack
        if (dist <= this.attackRange + player.size / 2 && this.attackCooldown === 0) {
            // perform attack: reduce player HP
            player.hp = Math.max(0, player.hp - this.attackDamage);
            this.attackCooldown = this.attackDelay;
            this.showAttackArc = 10;
            return true; // indicates player hit this frame
        }

        // reduce visual arc
        if (this.showAttackArc > 0) this.showAttackArc--;

        return false;
    }

    render() {
        if (this.isDead) return;

        // body
        push();
        fill(220, 60, 60);
        stroke(140, 20, 20);
        rect(this.x, this.y, this.size, this.size);
        pop();

        // HP bar
        this.drawHP();
        if (this.showAttackArc > 0) {
            this.drawAttackArc();
        }

        // attack cone visual when active — oriented by this.facingAngle
        if (this.showAttackArc > 0) {
            this.drawAttackArc();
        }
    }

    drawAttackArc() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        const arcDeg = 90;
        const start = this.facingAngle - (arcDeg / 2) * (Math.PI / 180);
        const end = this.facingAngle + (arcDeg / 2) * (Math.PI / 180);

        push();
        translate(cx, cy);
        noStroke();
        fill(255, 80, 80, 100);
        arc(0, 0, this.attackRange * 2, this.attackRange * 2, start, end, PIE);
        pop();
    }

    drawHP() {
        // fixed width (doesn't grow with maxHp)
        const barW = 56;
        const barH = 6;
        const cx = this.x + this.size / 2 - barW / 2;
        const cy = this.y - 12;

        push();
        noStroke();
        // background bar
        fill(30);
        rect(cx, cy, barW, barH, 3);
        // filled portion based on hp / maxHp
        const pct = this.maxHp > 0 ? Math.max(0, Math.min(1, this.hp / this.maxHp)) : 0;
        fill(0, 200, 80);
        rect(cx, cy, barW * pct, barH, 3);
        // numeric HP shown to the right
        fill(255);
        textSize(11);
        textAlign(LEFT, CENTER);
        text(`${this.hp}`, cx + barW + 8, cy + barH / 2);
        pop();
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }
}
