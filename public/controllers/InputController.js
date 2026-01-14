export default class InputController {
    constructor() {
        this.keys = {};
    }

    keyPressed(key) {
        this.keys[key] = true;
    }

    keyReleased(key) {
        this.keys[key] = false;
    }

    isPressed(key) {
        return this.keys[key];
    }
}
