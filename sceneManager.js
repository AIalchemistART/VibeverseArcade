import { scenes } from './sceneData.js';
import assetLoader from './assetLoader.js';
import { getSceneRenderer } from './sceneIntegration.js';
import { debug } from './utils.js';

// Set to false to disable verbose scene management logs
const VERBOSE_SCENE_MANAGER_DEBUG = false;

// Helper function to conditionally log only when verbose debugging is enabled
function conditionalDebug(...args) {
    if (VERBOSE_SCENE_MANAGER_DEBUG) {
        debug(...args);
    }
}

class SceneManager {
    constructor() {
        this.currentScene = null;
    }

    loadScene(sceneId) {
        // Call onExit for current scene if it exists
        if (this.currentScene && this.currentScene.logic && this.currentScene.logic.onExit) {
            this.currentScene.logic.onExit();
        }
        
        // Load assets for the new scene
        assetLoader.loadAssetsForScene(sceneId);
        
        // Get the scene data
        const scene = scenes[sceneId];
        if (scene) {
            this.currentScene = scene;
            conditionalDebug("SCENE", `Loaded scene: ${scene.name}`);
            
            // Start fade-in animation effect
            const sceneRenderer = getSceneRenderer();
            if (sceneRenderer) {
                sceneRenderer.startFadeIn();
                conditionalDebug("SCENE", 'Started fade-in animation for new scene');
            }
            
            // Call onEnter for the new scene
            if (this.currentScene.logic && this.currentScene.logic.onEnter) {
                this.currentScene.logic.onEnter();
            }
        } else {
            console.error(`Scene not found: ${sceneId}`);
        }
    }

    getCurrentScene() {
        return this.currentScene;
    }
    
    /**
     * Get the current player entity
     * @returns {Object} Player entity or null if not found
     */
    getCurrentPlayer() {
        // Access the player entity from the game instance
        if (window.game && window.game.player) {
            return window.game.player;
        }
        return null;
    }

    transitionTo(direction) {
        const currentExits = this.currentScene.exits;
        const exit = currentExits.find(exit => exit.direction === direction);
        if (exit) {
            this.loadScene(exit.to);
        } else {
            conditionalDebug("SCENE", `No exit in direction: ${direction}`);
        }
    }
}

export { SceneManager };
