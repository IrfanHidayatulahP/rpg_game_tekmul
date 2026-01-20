import Player from './Player.js';

export default class RangedCharacter extends Player {
    constructor(x, y) {
        super(x, y);
        this.hp = 80;
        this.speed = 4.5;
        this.attackRange = 350;
        this.attackDamage = 9;
        this.attackDelay = 22;

        this.projectileSpeed = 10;
        this.projectileLife = 80;

        this.skillDamage = 25;
        this.skillDelay = 260;
        this.skillArcDeg = 120;

        this.muzzleFlash = 0;
        this.bowPull = 0;
        this.quiverArrows = 8;
    }

    attack(enemy) {
        if (!this.canAttack()) return false;

        const px = this.x + this.size / 2;
        const py = this.y + this.size / 2;
        const angle = this.getFacingAngle();

        const proj = {
            x: px + Math.cos(angle) * (this.size / 2 + 6),
            y: py + Math.sin(angle) * (this.size / 2 + 6),
            dx: Math.cos(angle) * this.projectileSpeed,
            dy: Math.sin(angle) * this.projectileSpeed,
            damage: this.attackDamage,
            life: this.projectileLife,
            owner: 'player',
            type: 'arrow'
        };

        this.attackCooldown = this.attackDelay;
        this.showAttackArc = 6;
        this.muzzleFlash = 6;
        this.bowPull = 8;
        this.squashStretch = 0.85;
        return proj;
    }

    useSkill(enemy) {
        if (this.skillCooldown > 0) return null;

        this.skillCooldown = this.skillDelay;
        this.showSkillArc = 12;
        this.muzzleFlash = 10;
        this.bowPull = 12;

        const angleCenter = this.getFacingAngle();
        const count = 5;
        const spread = (this.skillArcDeg * Math.PI / 180) * 0.6;
        const projs = [];
        for (let i = 0; i < count; i++) {
            const t = (i / (count - 1)) - 0.5;
            const ang = angleCenter + t * spread;
            projs.push({
                x: this.x + this.size / 2 + Math.cos(ang) * (this.size / 2 + 6),
                y: this.y + this.size / 2 + Math.sin(ang) * (this.size / 2 + 6),
                dx: Math.cos(ang) * this.projectileSpeed,
                dy: Math.sin(ang) * this.projectileSpeed,
                damage: this.skillDamage,
                life: this.projectileLife + 30,
                owner: 'player',
                type: 'arrow'
            });
        }
        return projs;
    }

    update() {
        super.update();
        if (this.muzzleFlash > 0) this.muzzleFlash--;
        if (this.bowPull > 0) this.bowPull--;
    }

    render() {
        for (const p of this.dustParticles) {
            push();
            noStroke();
            fill(255, 200, 150, map(p.life, 0, 20, 0, 120));
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

        if (this.bowPull > 0) {
            const ang = this.getFacingAngle();
            push();
            rotate(ang);
            
            stroke(100, 70, 40);
            strokeWeight(2);
            const pullAmount = map(this.bowPull, 0, 8, 0, 15);
            
            noFill();
            stroke(120, 80, 40);
            strokeWeight(3);
            arc(15 - pullAmount, 0, 30, 25, -PI/2, PI/2);
            
            stroke(200, 200, 180);
            strokeWeight(1);
            line(15, -12, -pullAmount, 0);
            line(15, 12, -pullAmount, 0);
            
            stroke(180, 120, 60);
            strokeWeight(2);
            line(-pullAmount, 0, 15, 0);
            
            fill(220, 180, 100);
            noStroke();
            triangle(15, 0, 18, -2, 18, 2);
            pop();
        }

        strokeWeight(3);
        stroke(0);
        fill(255, 140, 80);
        
        ellipse(0, 0, this.size, this.size);

        fill(200, 100, 50);
        noStroke();
        arc(0, -this.size/2, this.size * 0.9, this.size * 0.6, PI, TWO_PI);
        
        fill(100, 200, 100);
        triangle(-8, -this.size/2, -5, -this.size/2-10, -2, -this.size/2);

        stroke(100, 60, 30);
        strokeWeight(2);
        line(-10, -10, -10, 10);
        line(10, -10, 10, 10);

        fill(255);
        noStroke();
        
        const eyeY = -2;
        const eyeSpacing = 8;
        
        if (this.blinkDuration > 0) {
            strokeWeight(2);
            stroke(0);
            line(-eyeSpacing - 3, eyeY, -eyeSpacing + 3, eyeY);
            line(eyeSpacing - 3, eyeY, eyeSpacing + 3, eyeY);
        } else {
            fill(255);
            ellipse(-eyeSpacing, eyeY, 8, 8);
            ellipse(eyeSpacing, eyeY, 8, 8);
            
            fill(30, 100, 200);
            const pupilX = this.facing === 'right' ? 2 : -2;
            ellipse(-eyeSpacing + pupilX, eyeY, 3, 4);
            ellipse(eyeSpacing + pupilX, eyeY, 3, 4);
            
            fill(255);
            ellipse(-eyeSpacing + pupilX - 1, eyeY - 1, 2, 2);
            ellipse(eyeSpacing + pupilX - 1, eyeY - 1, 2, 2);
        }

        noFill();
        stroke(0);
        strokeWeight(2);
        arc(0, 7, 12, 8, 0, PI);

        fill(200, 120, 80);
        noStroke();
        ellipse(-10, 4, 2, 2);
        ellipse(-7, 5, 1.5, 1.5);
        ellipse(10, 4, 2, 2);
        ellipse(7, 5, 1.5, 1.5);

        pop();

        if (this.muzzleFlash > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const ang = this.getFacingAngle();
            
            push();
            translate(cx, cy);
            rotate(ang);
            
            const alpha = map(this.muzzleFlash, 0, 10, 0, 220);
            for (let i = 0; i < 5; i++) {
                stroke(255, 230, 150, alpha * (1 - i * 0.15));
                strokeWeight(3 - i * 0.5);
                line(20, -5 + i * 2.5, 40 + i * 5, -5 + i * 2.5);
            }
            
            noStroke();
            fill(255, 250, 200, alpha);
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * TWO_PI;
                const len = 8 + Math.random() * 6;
                ellipse(20 + cos(a) * len, sin(a) * len, 3, 3);
            }
            pop();
        }

        if (this.showAttackArc > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const ang = this.getFacingAngle();
            
            push();
            translate(cx, cy);
            rotate(ang);
            
            const alpha = map(this.showAttackArc, 0, 6, 0, 150);
            
            noFill();
            stroke(255, 200, 100, alpha);
            strokeWeight(2);
            for (let i = 0; i < 3; i++) {
                arc(30, 0, 30 + i * 10, 20 + i * 8, -PI/4, PI/4);
            }
            
            stroke(255, 100, 100, alpha);
            strokeWeight(2);
            noFill();
            ellipse(70, 0, 15, 15);
            line(70, -10, 70, 10);
            line(60, 0, 80, 0);
            pop();
        }

        if (this.showSkillArc > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const facing = this.getFacingAngle();
            
            push();
            translate(cx, cy);
            
            const alpha = map(this.showSkillArc, 0, 12, 0, 200);
            const colors = [
                [255, 100, 100],
                [255, 200, 100],
                [255, 255, 100],
                [100, 255, 100],
                [100, 100, 255]
            ];
            
            for (let i = 0; i < 5; i++) {
                const spread = this.skillArcDeg * PI / 180;
                const angle = facing - spread/2 + (spread * i / 4);
                
                stroke(...colors[i], alpha);
                strokeWeight(3);
                
                const len = this.skillRange * 0.6;
                line(
                    cos(angle) * 20,
                    sin(angle) * 20,
                    cos(angle) * len,
                    sin(angle) * len
                );
                
                push();
                translate(cos(angle) * len, sin(angle) * len);
                rotate(angle);
                fill(...colors[i], alpha);
                noStroke();
                triangle(0, 0, -8, -4, -8, 4);
                pop();
            }
            
            pop();
        }

        push();
        textSize(14);
        textAlign(CENTER);
        textStyle(BOLD);
        fill(0);
        text(`HP:${this.hp}`, this.x + this.size/2 + 1, this.y - 11);
        fill(255, 200, 150);
        text(`HP:${this.hp}`, this.x + this.size/2, this.y - 12);
        pop();
    }
}