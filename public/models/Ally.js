// Ally.js
// Ally sekarang bisa menerima objek `templateStats` yang di-copy dari kelas Melee/Ranged
import Player from './Player.js';

export default class Ally extends Player {
    // constructor(x, y, type='melee', templateStats = null)
    constructor(x, y, type = 'melee', templateStats = null) {
        super(x, y);
        this.type = type; // 'melee' or 'ranged'

        // default stats (fallback)
        this.hp = 80;
        this.speed = 4.0;
        this.attackRange = 80;
        this.attackDamage = 12;
        this.attackDelay = 22;
        this.projectileSpeed = 8;
        this.projectileLife = 60;
        this.attackArcDeg = 120;

        // if templateStats provided, copy relevant fields so ally mirrors hero stats
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

        // formation / follow settings
        this.followDistance = 72;      // base distance from player
        this.slotIndex = 0;            // set by GameController each frame
        this.totalAllies = 1;
        this.autoAttackCooldown = 0;
    }

    // called by GameController each frame.
    // addProjectileFn: function(proj) -> push to game.projectiles
    act(player, enemies, addProjectileFn) {
        // compute formation target position relative to player using slotIndex & totalAllies
        const cx = player.x + player.size / 2;
        const cy = player.y + player.size / 2;

        const n = Math.max(1, this.totalAllies || 1);
        const i = Math.max(0, this.slotIndex || 0);

        // spread allies in a small arc behind/around player.
        // centerAngle = downward (PI/2) so allies tend to stay below player; adjust if you want different layout
        const centerAngle = Math.PI / 2;
        const spacing = 0.6; // radians between allies
        const offsetAngle = centerAngle + (i - (n - 1) / 2) * spacing;
        const offsetDist = this.followDistance + Math.min(20, n * 4);

        const targetX = cx + Math.cos(offsetAngle) * offsetDist - this.size / 2;
        const targetY = cy + Math.sin(offsetAngle) * offsetDist - this.size / 2;

        // move towards formation slot smoothly
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
            this.x += (dx / dist) * this.speed * 0.95;
            this.y += (dy / dist) * this.speed * 0.95;
        } else {
            // small jitter reduction: snap if very close
            this.x = lerp(this.x, targetX, 0.25);
            this.y = lerp(this.y, targetY, 0.25);
        }

        // cooldown
        if (this.autoAttackCooldown > 0) this.autoAttackCooldown--;

        if (this.autoAttackCooldown === 0) {
            // pick closest alive enemy
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
                    // melee ally attacks when in range
                    if (best <= this.attackRange + target.size / 2) {
                        target.takeDamage(this.attackDamage);
                        this.autoAttackCooldown = this.attackDelay;
                    }
                } else {
                    // ranged ally shoots projectile toward target
                    const ang = Math.atan2((target.y + target.size / 2) - (this.y + this.size / 2),
                        (target.x + target.size / 2) - (this.x + this.size / 2));
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
                }
            }
        }

        this.update();
    }

    render() {
        push();
        // color by type
        if (this.type === 'ranged') fill(220, 150, 60); else fill(70, 200, 160);
        stroke(200);
        rect(this.x, this.y, this.size, this.size);

        // small label to distinguish ally
        fill(10);
        textSize(10);
        textAlign(CENTER, CENTER);
        text('A', this.x + this.size - 8, this.y + 8);

        // draw small HP number above
        noStroke();
        fill(255);
        textSize(11);
        textAlign(LEFT, CENTER);
        text(`${this.hp}`, this.x + this.size + 6, this.y + 6);

        pop();
    }
}
