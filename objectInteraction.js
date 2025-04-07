/**
 * Object Interaction Module
 * Handles click detection and object interaction within scenes
 */

import { detectHit } from './hitDetection.js';

class ObjectInteraction {
    constructor(canvas, sceneRenderer, sceneManager) {
        this.canvas = canvas;
        this.sceneRenderer = sceneRenderer;
        this.sceneManager = sceneManager;
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const scene = this.sceneManager.getCurrentScene();
        const clickedObject = detectHit(x, y, scene.objects);
        if (clickedObject) {
            this.sceneRenderer.handleInteraction(clickedObject.id, this.sceneManager);
        }
    }
}

export { ObjectInteraction };
