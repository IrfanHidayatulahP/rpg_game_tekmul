import Player from './Player.js';

export default class MeleeCharacter extends Player {
    constructor(x, y) {
        super(x, y);
        this.hp = 120;
        this.speed = 4;
        this.attackRange = 80;
        this.attackDamage = 16;
        this.attackArcDeg = 140;
        this.attackDelay = 18;

        this.skillDamage = 45;
        this.skillRange = 140;
        this.skillArcDeg = 170;
        this.skillDelay = 200;

        this.swordSwing = 0;
        this.swordAngle = 0;
    }

    attack(enemy) {
        const result = super.attack(enemy);
        if (this.showAttackArc > 0) {
            this.swordSwing = 10;
            this.swordAngle = this.getFacingAngle();
        }
        return result;
    }

    update() {
        super.update();
        if (this.swordSwing > 0) {
            this.swordSwing--;
        }
    }

    render() {
        for (const p of this.dustParticles) {
            push();
            noStroke();
            fill(100, 200, 150, map(p.life, 0, 20, 0, 120));
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

        strokeWeight(4);
        stroke(0);
        fill(12, 200, 150);
        
        ellipse(0, 0, this.size, this.size);

        fill(80, 180, 130);
        noStroke();
        triangle(-8, -this.size/2, -12, -this.size/2-8, -5, -this.size/2-6);
        triangle(8, -this.size/2, 12, -this.size/2-8, 5, -this.size/2-6);

        strokeWeight(2);
        stroke(0);
        fill(100, 220, 170);
        arc(0, 5, 25, 20, 0, PI);

        fill(255);
        noStroke();
        
        const eyeY = -3;
        const eyeSpacing = 9;
        
        if (this.blinkDuration > 0) {
            strokeWeight(3);
            stroke(0);
            line(-eyeSpacing - 3, eyeY, -eyeSpacing + 3, eyeY);
            line(eyeSpacing - 3, eyeY, eyeSpacing + 3, eyeY);
        } else {
            fill(255);
            ellipse(-eyeSpacing, eyeY, 7, 9);
            ellipse(eyeSpacing, eyeY, 7, 9);
            
            fill(0);
            const pupilX = this.facing === 'right' ? 2 : -2;
            ellipse(-eyeSpacing + pupilX, eyeY, 3, 4);
            ellipse(eyeSpacing + pupilX, eyeY, 3, 4);
            
            stroke(0);
            strokeWeight(2);
            line(-eyeSpacing - 4, eyeY - 6, -eyeSpacing + 2, eyeY - 4);
            line(eyeSpacing + 4, eyeY - 6, eyeSpacing - 2, eyeY - 4);
        }

        noFill();
        stroke(0);
        strokeWeight(2);
        line(-5, 8, 5, 8);

        stroke(50, 150, 100);
        strokeWeight(1);
        line(-10, -2, -7, 2);

        pop();

        if (this.swordSwing > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const progress = 1 - (this.swordSwing / 10);
            
            push();
            translate(cx, cy);
            rotate(this.swordAngle);
            
            const alpha = map(this.swordSwing, 0, 10, 0, 200);
            strokeWeight(6);
            stroke(255, 230, 100, alpha);
            
            const startDist = 15;
            const endDist = 60;
            const arc = this.attackArcDeg * PI / 180;
            
            for (let i = 0; i < 7; i++) {
                const angle = -arc/2 + (arc * i / 6);
                const dist = lerp(startDist, endDist, progress);
                const x = cos(angle) * dist;
                const y = sin(angle) * dist;
                point(x, y);
            }
            
            push();
            rotate(-arc/2 + arc * progress);
            strokeWeight(4);
            stroke(200, 200, 220);
            line(15, 0, 50, 0);
            
            fill(220, 220, 240);
            stroke(0);
            strokeWeight(2);
            triangle(50, 0, 55, -3, 55, 3);
            
            fill(100, 60, 20);
            rect(10, -3, 8, 6, 2);
            pop();
            
            pop();
        }

        if (this.showAttackArc > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const facing = this.getFacingAngle();
            
            push();
            translate(cx, cy);
            
            for (let i = 0; i < 5; i++) {
                const ang = facing + (Math.random() - 0.5) * this.attackArcDeg * PI / 180;
                const dist = 30 + Math.random() * 40;
                const x = cos(ang) * dist;
                const y = sin(ang) * dist;
                const size = 6 + Math.random() * 4;
                const alpha = map(this.showAttackArc, 0, 6, 0, 255);
                
                noStroke();
                fill(255, 230, 100, alpha);
                this.drawStar(x, y, size);
            }
            
            for (let i = -2; i <= 2; i++) {
                const ang = facing + i * 0.15;
                const len = this.attackRange * 0.7;
                const alpha = map(this.showAttackArc, 0, 6, 0, 200);
                strokeWeight(5 - Math.abs(i));
                stroke(255, 220, 60, alpha);
                
                const x1 = cos(ang) * 20;
                const y1 = sin(ang) * 20;
                const x2 = cos(ang) * len;
                const y2 = sin(ang) * len;
                line(x1, y1, x2, y2);
            }
            pop();
        }

        if (this.showSkillArc > 0) {
            this.drawCartoonArc(this.skillRange, this.skillArcDeg, 255, 150, 50);
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            push();
            translate(cx, cy);
            noFill();
            strokeWeight(4);
            const alpha = map(this.showSkillArc, 0, 10, 0, 200);
            stroke(255, 200, 100, alpha);
            for (let i = 1; i <= 3; i++) {
                const r = this.skillRange * 0.3 * i;
                ellipse(0, 0, r, r);
            }
            pop();
        }

        push();
        textSize(14);
        textAlign(CENTER);
        textStyle(BOLD);
        fill(0);
        text(`HP:${this.hp}`, this.x + this.size/2 + 1, this.y - 11);
        fill(100, 255, 200);
        text(`HP:${this.hp}`, this.x + this.size/2, this.y - 12);
        pop();
    }

    drawStar(x, y, size) {
        push();
        translate(x, y);
        rotate(frameCount * 0.1);
        
        beginShape();
        for (let i = 0; i < 10; i++) {
            const angle = (i * PI) / 5;
            const r = i % 2 === 0 ? size : size / 2;
            vertex(cos(angle) * r, sin(angle) * r);
        }
        endShape(CLOSE);
        pop();
    }
}