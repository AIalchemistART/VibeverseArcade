/**
 * Interactive Objects Module
 * Defines interactive elements that can be placed in scenes
 */

class InteractiveObject {
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = position;
    }

    interact() {
        console.log(`Interacted with ${this.id}`);
    }
}

export { InteractiveObject };
