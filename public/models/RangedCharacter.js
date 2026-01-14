import Player from './Player.js';

export default class RangedCharacter extends Player {
    constructor(x, y) {
        super(x, y);
        this.hp = 80;
        this.speed = 4.5;
        this.attackRange = 350;   // DIPERPANJANG (was ~240)
        this.attackDamage = 9;
        this.attackDelay = 22;

        // projectile
        this.projectileSpeed = 10; // sedikit lebih cepat
        this.projectileLife = 80;

        // skill = volley
        this.skillDamage = 25;
        this.skillDelay = 260;
        this.skillArcDeg = 120;

        // muzzle flash timer
        this.muzzleFlash = 0;
    }

    // override attack => return projectile object
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
        return proj;
    }

    // override useSkill: volley (array of projectiles)
    useSkill(enemy) {
        if (this.skillCooldown > 0) return null;

        this.skillCooldown = this.skillDelay;
        this.showSkillArc = 12;
        this.muzzleFlash = 10;

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
    }

    render() {
        // body with distinct color
        push();
        fill(255, 140, 80); // ranged are warm orange
        stroke(200);
        rect(this.x, this.y, this.size, this.size);
        pop();

        // draw base arcs
        if (this.showAttackArc > 0) {
            // small translucent cone to show attack direction (visual cue even for ranged)
            this.drawArc(40, 30, 255, 200, 120, 80); // small indicator in front
        }
        if (this.showSkillArc > 0) {
            this.drawArc(this.skillRange * 0.6, this.skillArcDeg, 255, 160, 60, 120);
        }

        // muzzle flash when firing
        if (this.muzzleFlash > 0) {
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            const ang = this.getFacingAngle();
            push();
            translate(cx, cy);
            rotate(ang);
            noStroke();
            const a = map(this.muzzleFlash, 0, 10, 0, 220);
            fill(255, 230, 150, a);
            // triangular flash in front
            triangle(
                this.size * 0.6, 0,
                this.size * 0.6 + 14, -8,
                this.size * 0.6 + 14, 8
            );
            pop();
        }

        // hp / debug
        noStroke();
        fill(255);
        textSize(12);
        text(`HP:${this.hp}`, this.x, this.y - 10);
    }
}
