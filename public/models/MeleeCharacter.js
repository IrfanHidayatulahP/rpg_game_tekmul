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

        // skill: big slash cone
        this.skillDamage = 45;
        this.skillRange = 140;
        this.skillArcDeg = 170;
        this.skillDelay = 200;
    }

    // override render to give distinct color + extra slash glow when attacking
    render() {
        // base body but with different color
        push();
        fill(12, 200, 150); // melees are teal/greenish
        stroke(220);
        strokeWeight(2);
        rect(this.x, this.y, this.size, this.size);

        // eyes
        fill(10);
        if (this.facing === 'right') {
            ellipse(this.x + this.size * 0.7, this.y + this.size * 0.35, 4, 4);
            ellipse(this.x + this.size * 0.7, this.y + this.size * 0.65, 4, 4);
        } else {
            ellipse(this.x + this.size * 0.3, this.y + this.size * 0.35, 4, 4);
            ellipse(this.x + this.size * 0.3, this.y + this.size * 0.65, 4, 4);
        }
        pop();

        // call base arcs (attack/skill) - base draws translucent arcs
        if (this.showAttackArc > 0) {
            // draw heavier, orange slash overlay
            this.drawArc(this.attackRange, this.attackArcDeg, 255, 140, 20, 200);
            // extra slashes: short lines radiating in the cone
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const facing = this.getFacingAngle();
            push();
            translate(cx, cy);
            for (let i = -2; i <= 2; i++) {
                const ang = facing + i * 0.12;
                const len = this.attackRange * (0.6 + Math.abs(i) * 0.08);
                const alpha = map(this.showAttackArc, 0, 6, 0, 200);
                stroke(255, 220, 60, alpha);
                strokeWeight(4 - Math.abs(i));
                const x1 = Math.cos(ang) * (this.size * 0.6);
                const y1 = Math.sin(ang) * (this.size * 0.6);
                const x2 = Math.cos(ang) * len;
                const y2 = Math.sin(ang) * len;
                line(x1, y1, x2, y2);
            }
            pop();
        }

        if (this.showSkillArc > 0) {
            // bigger, bright effect
            this.drawArc(this.skillRange, this.skillArcDeg, 255, 100, 30, 220);
        }

        // debug / hp
        noStroke();
        fill(255);
        textSize(12);
        text(`HP:${this.hp}`, this.x, this.y - 10);
    }
}
