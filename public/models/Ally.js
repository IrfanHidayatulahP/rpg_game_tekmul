import Player from './Player.js';

export default class Ally extends Player {
    constructor(x, y, type = 'melee', templateStats = null) {
        super(x, y);
        this.type = type;

        this.hp = 80;
        this.speed = 4.0;
        this.attackRange = 80;
        this.attackDamage = 12;
        this.attackDelay = 22;
        this.projectileSpeed = 8;
        this.projectileLife = 60;
        this.attackArcDeg = 120;

        if (templateStats) {
            if (typeof templateStats.hp === 'number') this.hp = templateStats.hp;
            if (typeof templateStats.speed === 'number') this.speed = templateStats.speed;
            if (typeof templateStats.attackRange === 'number') this.attackRange = templateStats.attackRange;
            if (typeof templateStats.attackDamage === 'number') this.attackDamage = templateStats.attackDamage;
            if (typeof templateStats.attackDelay === 'number') this.attackDelay = templateStats.attackDelay;
            if (typeof templateStats.projectileSpeed === 'number') this.projectileSpeed = templateStats.projectileSpeed;
            if (typeof templateStats.projectileLife === 'number') this.projectileLife = templateStats.projectileLife;
            if (typeof templateStats.attackArcDeg === 'number') this.attackArcDeg = templateStats.attackArcDeg;
        }

        this.followDistance = 72;
        this.slotIndex = 0;
        this.totalAllies = 1;
        this.autoAttackCooldown = 0;

        this.attackFlash = 0;
        this.happyBounce = Math.random() * TWO_PI;
    }

    act(player, enemies, addProjectileFn) {
        const cx = player.x + player.size / 2;
        const cy = player.y + player.size / 2;

        const n = Math.max(1, this.totalAllies || 1);
        const i = Math.max(0, this.slotIndex || 0);

        const centerAngle = Math.PI / 2;
        const spacing = 0.6;
        const offsetAngle = centerAngle + (i - (n - 1) / 2) * spacing;
        const offsetDist = this.followDistance + Math.min(20, n * 4);

        const targetX = cx + Math.cos(offsetAngle) * offsetDist - this.size / 2;
        const targetY = cy + Math.sin(offsetAngle) * offsetDist - this.size / 2;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 4) {
            this.x += (dx / dist) * this.speed * 0.95;
            this.y += (dy / dist) * this.speed * 0.95;
        } else {
            this.x = lerp(this.x, targetX, 0.25);
            this.y = lerp(this.y, targetY, 0.25);
        }

        if (this.autoAttackCooldown > 0) this.autoAttackCooldown--;

        if (this.autoAttackCooldown === 0) {
            let target = null;
            let best = Infinity;
            for (const e of enemies) {
                if (!e || e.isDead) continue;
                const ex = e.x + e.size / 2;
                const ey = e.y + e.size / 2;
                const d = Math.hypot(ex - (this.x + this.size / 2), ey - (this.y + this.size / 2));
                if (d < best) { best = d; target = e; }
            }

            if (target) {
                if (this.type === 'melee') {
                    if (best <= this.attackRange + target.size / 2) {
                        target.takeDamage(this.attackDamage);
                        this.autoAttackCooldown = this.attackDelay;
                        this.attackFlash = 8;
                        this.squashStretch = 0.85;
                    }
                } else {
                    const ang = Math.atan2(
                        (target.y + target.size / 2) - (this.y + this.size / 2),
                        (target.x + target.size / 2) - (this.x + this.size / 2)
                    );
                    const proj = {
                        x: this.x + this.size / 2 + Math.cos(ang) * (this.size / 2 + 6),
                        y: this.y + this.size / 2 + Math.sin(ang) * (this.size / 2 + 6),
                        dx: Math.cos(ang) * this.projectileSpeed,
                        dy: Math.sin(ang) * this.projectileSpeed,
                        damage: this.attackDamage,
                        life: this.projectileLife,
                        owner: 'ally',
                        type: 'arrow'
                    };
                    if (typeof addProjectileFn === 'function') addProjectileFn(proj);
                    this.autoAttackCooldown = this.attackDelay;
                    this.attackFlash = 6;
                    this.squashStretch = 0.9;
                }
            }
        }

        this.update();
        
        this.happyBounce += 0.08;
        if (this.attackFlash > 0) this.attackFlash--;
    }

    render() {
        push();
        
        const happyOffset = Math.sin(this.happyBounce) * 2;
        const shakeX = this.hitShake > 0 ? Math.random() * 3 - 1.5 : 0;
        
        translate(
            this.x + this.size/2 + shakeX, 
            this.y + this.size/2 + happyOffset
        );
        
        scale(this.squashStretch, 1/this.squashStretch);

        push();
        noStroke();
        fill(0, 0, 0, 50);
        ellipse(0, this.size/2 - happyOffset + 5, this.size * 0.7, this.size * 0.25);
        pop();
        strokeWeight(3);
        stroke(0);
        
        if (this.type === 'melee') {
            fill(70, 200, 160);
            ellipse(0, 0, this.size * 0.9, this.size * 0.9);
            fill(90, 220, 180);
            noStroke();
            arc(-this.size/3, 0, 12, 15, -PI/2, PI/2);
            stroke(0);
            strokeWeight(2);
            fill(80, 180, 140);
            arc(0, -this.size/2.5, this.size * 0.7, this.size * 0.4, PI, TWO_PI);
        } else {
            fill(220, 150, 60);
            ellipse(0, 0, this.size * 0.9, this.size * 0.9);
            fill(180, 120, 50);
            noStroke();
            rect(-this.size/3, -5, 6, 12, 2);
            stroke(0);
            strokeWeight(2);
            fill(200, 130, 50);
            arc(0, -this.size/2.5, this.size * 0.7, this.size * 0.4, PI, TWO_PI);
        }

        fill(255);
        noStroke();
        
        const eyeY = -3;
        const eyeSpacing = 7;
        if (this.blinkDuration > 0) {
            stroke(0);
            strokeWeight(2);
            arc(-eyeSpacing, eyeY, 6, 4, 0, PI);
            arc(eyeSpacing, eyeY, 6, 4, 0, PI);
        } else {
            fill(255);
            ellipse(-eyeSpacing, eyeY, 7, 7);
            ellipse(eyeSpacing, eyeY, 7, 7);
            
            fill(0);
            ellipse(-eyeSpacing, eyeY, 3, 3);
            ellipse(eyeSpacing, eyeY, 3, 3);
            
            fill(255);
            ellipse(-eyeSpacing - 1, eyeY - 1, 1.5, 1.5);
            ellipse(eyeSpacing - 1, eyeY - 1, 1.5, 1.5);
        }

        noFill();
        stroke(0);
        strokeWeight(2);
        arc(0, 5, 10, 8, 0, PI);
        
        noStroke();
        fill(255, 150, 150, 120);
        ellipse(-10, 4, 5, 4);
        ellipse(10, 4, 5, 4);

        push();
        translate(this.size/3, -this.size/3);
        fill(255, 200, 50);
        stroke(0);
        strokeWeight(2);
        ellipse(0, 0, 12, 12);
        
        fill(0);
        noStroke();
        textSize(9);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text('A', 0, 0);
        pop();

        pop();

        if (this.attackFlash > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            
            push();
            translate(cx, cy);
            
            const alpha = map(this.attackFlash, 0, 8, 0, 150);
            
            if (this.type === 'melee') {
                stroke(100, 255, 200, alpha);
                strokeWeight(3);
                for (let i = 0; i < 3; i++) {
                    const angle = -PI/4 + i * PI/6;
                    line(
                        cos(angle) * 10,
                        sin(angle) * 10,
                        cos(angle) * 25,
                        sin(angle) * 25
                    );
                }
            } else {
                noStroke();
                fill(255, 200, 100, alpha);
                for (let i = 0; i < 5; i++) {
                    ellipse(15 + i * 5, 0, 4 - i * 0.5, 4 - i * 0.5);
                }
            }
            pop();
        }

        push();
        const hpX = this.x + this.size/2;
        const hpY = this.y - 8;
        
        textSize(10);
        textAlign(CENTER);
        textStyle(BOLD);
        
        fill(0);
        text(`${this.hp}`, hpX + 1, hpY + 1);
        
        if (this.type === 'melee') {
            fill(100, 255, 200);
        } else {
            fill(255, 200, 150);
        }
        text(`${this.hp}`, hpX, hpY);
        pop();
    }
}