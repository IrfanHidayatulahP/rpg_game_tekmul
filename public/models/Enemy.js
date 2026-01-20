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
        this.attackDelay = 60;
        this.attackCooldown = 0;

        this.facingAngle = 0;
        this.showAttackArc = 0;

        this.bounceOffset = 0;
        this.bounceSpeed = 0.12;
        this.angryShake = 0;
        this.blinkTimer = 0;
        this.breatheScale = 1;
        this.hitFlash = 0;
    }

    angleDiff(a, b) {
        let d = Math.abs(a - b) % (Math.PI * 2);
        if (d > Math.PI) d = Math.abs(d - Math.PI * 2);
        return d;
    }

    getFacingAngleTo(player) {
        return Math.atan2(
            (player.y + player.size / 2) - (this.y + this.size / 2),
            (player.x + player.size / 2) - (this.x + this.size / 2)
        );
    }

    canAttack() {
        return this.attackCooldown === 0;
    }

    attack(player) {
        if (!this.canAttack() || this.isDead) return false;

        const px = player.x + player.size / 2;
        const py = player.y + player.size / 2;
        const ex = this.x + this.size / 2;
        const ey = this.y + this.size / 2;

        const distance = Math.hypot(px - ex, py - ey);

        if (distance > this.attackRange + player.size / 2) {
            this.attackCooldown = this.attackDelay;
            this.showAttackArc = 8;
            return false;
        }

        const facingAng = this.facingAngle;
        const toPlayerAng = Math.atan2(py - ey, px - ex);
        const diff = this.angleDiff(facingAng, toPlayerAng);
        const halfArcRad = (90 / 2) * (Math.PI / 180);

        const hit = diff <= halfArcRad;

        if (hit) {
            player.hp = Math.max(0, player.hp - this.attackDamage);
        }

        this.attackCooldown = this.attackDelay;
        this.showAttackArc = 12;
        this.angryShake = 8;
        return hit;
    }

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

        if (dist > this.attackRange + 8) {
            this.x += Math.cos(this.facingAngle) * this.speed;
            this.y += Math.sin(this.facingAngle) * this.speed;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (dist <= this.attackRange + player.size / 2 && this.attackCooldown === 0) {
            player.hp = Math.max(0, player.hp - this.attackDamage);
            this.attackCooldown = this.attackDelay;
            this.showAttackArc = 10;
            this.angryShake = 10;
            return true;
        }

        if (this.showAttackArc > 0) this.showAttackArc--;

        this.bounceOffset = Math.sin(frameCount * this.bounceSpeed) * 2;
        this.breatheScale = 1 + Math.sin(frameCount * 0.08) * 0.05;
        if (this.angryShake > 0) this.angryShake--;
        if (this.hitFlash > 0) this.hitFlash--;
        
        if (Math.random() < 0.008) {
            this.blinkTimer = 6;
        }
        if (this.blinkTimer > 0) this.blinkTimer--;

        return false;
    }

    render() {
        if (this.isDead) {
            push();
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            translate(cx, cy);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * TWO_PI;
                const dist = 20;
                noStroke();
                fill(150, 150, 150, 100);
                ellipse(cos(angle) * dist, sin(angle) * dist, 8, 8);
            }
            
            textSize(24);
            textAlign(CENTER, CENTER);
            fill(255, 100, 100);
            text("💀", 0, 0);
            pop();
            return;
        }

        const shakeX = this.angryShake > 0 ? Math.random() * 3 - 1.5 : 0;
        const shakeY = this.angryShake > 0 ? Math.random() * 3 - 1.5 : 0;

        push();
        translate(
            this.x + this.size/2 + shakeX, 
            this.y + this.size/2 + this.bounceOffset + shakeY
        );
        
        scale(this.breatheScale);

        push();
        noStroke();
        fill(0, 0, 0, 50);
        ellipse(0, this.size/2 - this.bounceOffset + 6, this.size * 0.9, this.size * 0.25);
        pop();

        if (this.hitFlash > 0) {
            fill(255, 255, 255);
        } else {
            fill(220, 60, 60);
        }
        
        strokeWeight(3);
        stroke(140, 20, 20);
        
        beginShape();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * TWO_PI;
            const r = (this.size / 2) * (i % 2 === 0 ? 1 : 0.85);
            vertex(cos(angle) * r, sin(angle) * r);
        }
        endShape(CLOSE);

        fill(180, 40, 40);
        noStroke();
        triangle(-12, -this.size/2.5, -16, -this.size/2-8, -9, -this.size/2-5);
        triangle(12, -this.size/2.5, 16, -this.size/2-8, 9, -this.size/2-5);
        fill(255, 255, 0);
        stroke(0);
        strokeWeight(2);
        
        const eyeY = -5;
        const eyeSpacing = 10;
        
        if (this.blinkTimer > 0) {
            line(-eyeSpacing - 4, eyeY, -eyeSpacing + 4, eyeY);
            line(eyeSpacing - 4, eyeY, eyeSpacing + 4, eyeY);
        } else {
            ellipse(-eyeSpacing, eyeY, 10, 12);
            ellipse(eyeSpacing, eyeY, 10, 12);
            fill(200, 0, 0);
            ellipse(-eyeSpacing, eyeY + 1, 5, 6);
            ellipse(eyeSpacing, eyeY + 1, 5, 6);
            fill(255, 200, 200);
            noStroke();
            ellipse(-eyeSpacing - 2, eyeY - 1, 2, 2);
            ellipse(eyeSpacing - 2, eyeY - 1, 2, 2);
            stroke(0);
            strokeWeight(3);
            line(-eyeSpacing - 5, eyeY - 7, -eyeSpacing + 3, eyeY - 4);
            line(eyeSpacing + 5, eyeY - 7, eyeSpacing - 3, eyeY - 4);
        }

        fill(100, 20, 20);
        stroke(0);
        strokeWeight(2);
        arc(0, 8, 18, 12, 0, PI);
        
        fill(255);
        noStroke();
        for (let i = 0; i < 5; i++) {
            const tx = -8 + i * 4;
            triangle(tx, 8, tx + 2, 8, tx + 1, 14);
        }

        stroke(150, 30, 30);
        strokeWeight(2);
        line(-8, 2, -5, -2);
        line(5, -3, 8, 1);

        pop();

        this.drawHP();

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
        for (let i = 3; i > 0; i--) {
            noStroke();
            const alpha = 60 * (i / 3) * (this.showAttackArc / 10);
            fill(255, 80, 80, alpha);
            arc(0, 0, this.attackRange * 2 * (i/3), this.attackRange * 2 * (i/3), start, end, PIE);
        }
        
        stroke(255, 100, 100, this.showAttackArc * 15);
        strokeWeight(4);
        for (let i = 0; i < 3; i++) {
            const angle = start + (end - start) * ((i + 1) / 4);
            const len = this.attackRange * 0.8;
            line(
                cos(angle) * 15,
                sin(angle) * 15,
                cos(angle) * len,
                sin(angle) * len
            );
        }
        
        for (let i = 0; i < 4; i++) {
            const angle = start + (end - start) * (i / 3);
            const dist = this.attackRange * 0.6;
            const x = cos(angle) * dist;
            const y = sin(angle) * dist;
            
            push();
            translate(x, y);
            rotate(frameCount * 0.2);
            noStroke();
            fill(255, 200, 100, this.showAttackArc * 20);
            
            beginShape();
            for (let j = 0; j < 8; j++) {
                const a = (j / 8) * TWO_PI;
                const r = (j % 2 === 0) ? 6 : 3;
                vertex(cos(a) * r, sin(a) * r);
            }
            endShape(CLOSE);
            pop();
        }
        
        pop();
    }

    drawHP() {
        const barW = 56;
        const barH = 8;
        const cx = this.x + this.size / 2 - barW / 2;
        const cy = this.y - 16;

        push();
        
        strokeWeight(2);
        stroke(0);
        fill(40, 40, 40);
        rect(cx, cy, barW, barH, 4);
        
        noStroke();
        const pct = this.maxHp > 0 ? Math.max(0, Math.min(1, this.hp / this.maxHp)) : 0;
        
        if (pct > 0.6) {
            fill(100, 220, 100);
        } else if (pct > 0.3) {
            fill(255, 200, 80);
        } else {
            fill(255, 80, 80);
        }
        
        rect(cx + 1, cy + 1, (barW - 2) * pct, barH - 2, 3);
        
        textAlign(CENTER, CENTER);
        textSize(11);
        textStyle(BOLD);
        fill(0);
        text(`${this.hp}`, cx + barW/2 + 1, cy + barH/2 + 1);
        fill(255);
        text(`${this.hp}`, cx + barW/2, cy + barH/2);
        
        pop();
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        this.hitFlash = 4;
        this.angryShake = 6;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }
}