class WorldModel {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
    }

    update() {
        Matter.Engine.update(this.engine);
    }
}
