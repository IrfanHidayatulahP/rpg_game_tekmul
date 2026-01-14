export default class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.size = 48;
        this.hp = 50;
        this.speed = 1.2;

        // attack properties (frames & units)
        this.attackRange = 70;      // distance in px
        this.attackArcDeg = 90;     // cone angle total (degrees)
        this.attackDamage = 8;      // damage to player
        this.attackCooldown = 0;    // current cooldown (frames)
        this.attackDelay = 60;      // cooldown length (frames)

        // facing angle toward player (radians)
        this.facingAngle = 0;

        // visual
        this.showAttackArc = 0;     // frames left to draw arc
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

        // compute vector to player and facing
        const dx = (player.x + player.size / 2) - (this.x + this.size / 2);
        const dy = (player.y + player.size / 2) - (this.y + this.size / 2);
        const dist = Math.hypot(dx, dy);

        // update facing angle toward player
        this.facingAngle = Math.atan2(dy, dx);

        // movement: move toward player if outside (a bit less than attackRange)
        const stopDist = this.attackRange * 0.9;
        if (dist > stopDist) {
            this.x += Math.cos(this.facingAngle) * this.speed;
            this.y += Math.sin(this.facingAngle) * this.speed;
        }

        // countdown cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;

        // attempt attack if in range and cooldown ready
        let attacked = false;
        if (this.canAttack() && dist <= this.attackRange + player.size * 0.6) {
            attacked = this.attack(player);
        }

        // decrease visual arc lifetime
        if (this.showAttackArc > 0) this.showAttackArc--;

        return attacked;
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
        push();
        noStroke();
        fill(0);
        rect(this.x, this.y - 8, this.size, 5);
        fill(0, 255, 0);
        const hpRatio = Math.max(0, this.hp) / 50;
        rect(this.x, this.y - 8, this.size * hpRatio, 5);
        pop();

        // attack cone visual when active — oriented by this.facingAngle
        if (this.showAttackArc > 0) {
            this.drawAttackArc();
        }
    }

    drawAttackArc() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        const facing = this.facingAngle;
        const start = facing - (this.attackArcDeg / 2) * (Math.PI / 180);
        const end = facing + (this.attackArcDeg / 2) * (Math.PI / 180);

        push();
        translate(cx, cy);
        noStroke();
        fill(255, 80, 80, 120);
        // draw arc oriented to facing
        arc(0, 0, this.attackRange * 2, this.attackRange * 2, start, end, PIE);
        pop();
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
            console.log('Enemy died');
        } else {
            console.log('Enemy HP:', this.hp);
        }
    }
}
