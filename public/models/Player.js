export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.speed = 4;
        this.hp = 100;

        this.attackRange = 70;
        this.attackDamage = 10;
        this.attackCooldown = 0;
        this.attackDelay = 20;
        this.attackArcDeg = 120;

        this.skillCooldown = 0;
        this.skillDelay = 180;
        this.skillDamage = 30;
        this.skillRange = 180;
        this.skillArcDeg = 160;
        this.facing = 'right';
        this.lastMove = { x: 1, y: 0 };

        this.showAttackArc = 0;
        this.showSkillArc = 0;

        this.bounceOffset = 0;
        this.bounceSpeed = 0.15;
        this.squashStretch = 1;
        this.blinkTimer = 0;
        this.blinkDuration = 0;
        this.hitShake = 0;
        this.dustParticles = [];
    }

    move(dx, dy) {
        if (dx === 0 && dy === 0) return;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        if (Math.random() < 0.3) {
            this.dustParticles.push({
                x: this.x + this.size/2 + Math.random()*10-5,
                y: this.y + this.size,
                vx: -dx * 0.5 + Math.random()*2-1,
                vy: Math.random()*2,
                life: 20,
                size: Math.random()*4+2
            });
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        this.x = constrain(this.x, 0, width - this.size);
        this.y = constrain(this.y, 0, height - this.size);

        if (dx < 0) this.facing = 'left';
        else if (dx > 0) this.facing = 'right';

        if (dx !== 0) this.lastMove.x = dx;
        if (dy !== 0) this.lastMove.y = dy;

        this.squashStretch = lerp(this.squashStretch, 0.9, 0.3);
    }

    canAttack() {
        return this.attackCooldown === 0;
    }

    getFacingAngle() {
        if (this.lastMove && (this.lastMove.x !== 0 || this.lastMove.y !== 0)) {
            return Math.atan2(this.lastMove.y, this.lastMove.x);
        }
        return this.facing === 'right' ? 0 : Math.PI;
    }

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

        if (hit) {
            enemy.takeDamage(this.attackDamage);
            this.squashStretch = 0.85;
        }

        this.attackCooldown = this.attackDelay;
        this.showAttackArc = 6;
        return hit;
    }

    useSkill(enemy) {
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
        
        if (hit) {
            enemy.takeDamage(this.skillDamage);
            this.squashStretch = 0.8;
        }

        this.skillCooldown = this.skillDelay;
        this.showSkillArc = 10;
        return hit;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.hitShake = 10;
        this.squashStretch = 0.7;
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillCooldown > 0) this.skillCooldown--;

        if (this.showAttackArc > 0) this.showAttackArc--;
        if (this.showSkillArc > 0) this.showSkillArc--;

        this.bounceOffset = Math.sin(frameCount * this.bounceSpeed) * 3;
        this.squashStretch = lerp(this.squashStretch, 1, 0.15);
        
        if (this.blinkDuration > 0) {
            this.blinkDuration--;
        } else if (Math.random() < 0.01) {
            this.blinkDuration = 8;
        }

        if (this.hitShake > 0) this.hitShake--;

        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            const p = this.dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            p.size *= 0.95;
            if (p.life <= 0) this.dustParticles.splice(i, 1);
        }
    }

    render() {
        for (const p of this.dustParticles) {
            push();
            noStroke();
            fill(150, 150, 150, map(p.life, 0, 20, 0, 100));
            ellipse(p.x, p.y, p.size);
            pop();
        }

        push();
        const shakeX = this.hitShake > 0 ? Math.random() * 4 - 2 : 0;
        const shakeY = this.hitShake > 0 ? Math.random() * 4 - 2 : 0;
        
        translate(this.x + this.size/2 + shakeX, this.y + this.size/2 + this.bounceOffset + shakeY);
        
        scale(this.squashStretch, 1/this.squashStretch);

        push();
        noStroke();
        fill(0, 0, 0, 60);
        ellipse(0, this.size/2 - this.bounceOffset + 8, this.size * 0.8, this.size * 0.3);
        pop();

        strokeWeight(3);
        stroke(0);
        fill(0, 200, 255);
        
        ellipse(0, 0, this.size, this.size);
        fill(255);
        noStroke();
        
        const eyeY = -5;
        const eyeSpacing = 10;
        
        if (this.blinkDuration > 0) {
            strokeWeight(2);
            stroke(0);
            if (this.facing === 'right') {
                line(eyeSpacing - 4, eyeY, eyeSpacing + 4, eyeY);
                line(-eyeSpacing - 4, eyeY, -eyeSpacing + 4, eyeY);
            } else {
                line(-eyeSpacing - 4, eyeY, -eyeSpacing + 4, eyeY);
                line(eyeSpacing - 4, eyeY, eyeSpacing + 4, eyeY);
            }
        } else {
            fill(255);
            ellipse(-eyeSpacing, eyeY, 8, 10);
            ellipse(eyeSpacing, eyeY, 8, 10);
            
            fill(0);
            const pupilX = this.facing === 'right' ? 2 : -2;
            ellipse(-eyeSpacing + pupilX, eyeY, 4, 5);
            ellipse(eyeSpacing + pupilX, eyeY, 4, 5);
            
            fill(255);
            ellipse(-eyeSpacing + pupilX - 1, eyeY - 1, 2, 2);
            ellipse(eyeSpacing + pupilX - 1, eyeY - 1, 2, 2);
        }

        noFill();
        stroke(0);
        strokeWeight(2);
        arc(0, 5, 15, 10, 0, PI);

        if (this.hitShake > 0) {
            noStroke();
            fill(255, 100, 100, 150);
            ellipse(-12, 3, 6, 4);
            ellipse(12, 3, 6, 4);
        }

        pop();

        if (this.showAttackArc > 0) {
            this.drawCartoonArc(this.attackRange, this.attackArcDeg, 255, 200, 0);
        }
        if (this.showSkillArc > 0) {
            this.drawCartoonArc(this.skillRange, this.skillArcDeg, 255, 100, 255);
        }

        push();
        textSize(14);
        textAlign(CENTER);
        fill(0);
        text(`HP:${this.hp}`, this.x + this.size/2 + 1, this.y - 11);
        fill(255);
        text(`HP:${this.hp}`, this.x + this.size/2, this.y - 12);
        pop();
    }

    drawCartoonArc(range, arcDeg, r, g, b) {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        const facing = this.getFacingAngle();
        const start = facing - (arcDeg / 2) * (Math.PI / 180);
        const end = facing + (arcDeg / 2) * (Math.PI / 180);
        
        push();
        translate(cx, cy);
        for (let i = 3; i > 0; i--) {
            noStroke();
            const alpha = 80 * (i / 3);
            fill(r, g, b, alpha);
            arc(0, 0, range * 2 * (i/3), range * 2 * (i/3), start, end, PIE);
        }
        
        stroke(r, g, b, 150);
        strokeWeight(3);
        for (let i = 0; i < 5; i++) {
            const angle = start + (end - start) * (i / 4);
            const len = range * 0.7;
            line(
                cos(angle) * range * 0.3,
                sin(angle) * range * 0.3,
                cos(angle) * len,
                sin(angle) * len
            );
        }
        pop();
    }

    drawArc(range, arcDeg, r, g, b, alpha = 120) {
        this.drawCartoonArc(range, arcDeg, r, g, b);
    }
}