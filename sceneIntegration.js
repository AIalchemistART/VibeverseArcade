/**
 * Scene Integration Module
 * Connects the SceneManager with the main game loop
 */

import { SceneManager } from './sceneManager.js';
import { SceneRenderer } from './sceneRenderer.js';
import { input } from './input.js';
import { ObjectInteraction } from './objectInteraction.js';
import { isSceneTestingActive, getCurrentTestScene, isForceRerenderRequested } from './gameBridge.js';
import PortalSystem from './portalSystem.js';
import PortalRenderer from './portalRenderer.js';

// Canvas reference for rendering
let canvasContext;
let canvasElement;

// Initialize the scene manager and renderer
const sceneManager = new SceneManager();
let sceneRenderer;
let objectInteraction;

// Initialize the portal system
const portalSystem = new PortalSystem(sceneManager);

// Initialize the portal renderer and make it globally accessible
const portalRenderer = new PortalRenderer(portalSystem);
window.portalRenderer = portalRenderer; // Make available globally for renderer access

// Timestamp to track last render
let lastRenderTime = 0;

// Track consumed keys to avoid interfering with movement
const consumedKeys = {
    ShiftE: false,
    ShiftD: false,
    ShiftS: false,
    ShiftF: false
};

/**
 * Initialize the scene system
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context for rendering
 * @param {HTMLCanvasElement} canvas - The canvas element
 */
export function initSceneSystem(ctx, canvas) {
    canvasContext = ctx;
    canvasElement = canvas;
    sceneRenderer = new SceneRenderer(ctx);
    
    // Initialize object interaction with class-based approach
    objectInteraction = new ObjectInteraction(canvas, sceneRenderer, sceneManager);
    
    // Load the initial scene
    sceneManager.loadScene('startRoom');
    
    // Add debug portal listing to window for easy testing
    window.debug = window.debug || {};
    window.debug.listPortals = () => portalSystem.debugListPortals();
}

/**
 * Update and render the current scene
 * To be called from the main game loop
 * @param {number} deltaTime - Time elapsed since last frame
 * @param {Object} player - The player object (passed from game.js)
 */
export function updateScene(deltaTime, player) {
    // Check for scene transition input
    handleSceneTransitions();
    
    // Reset consumed keys to allow movement in the next frame
    Object.keys(consumedKeys).forEach(key => {
        consumedKeys[key] = false;
    });
    
    const currentScene = sceneManager.getCurrentScene();
    if (currentScene) {
        // Check if testing is active and force rerender is requested
        const forceRerender = isForceRerenderRequested();
        const now = Date.now();
        
        // Check for nearby portals if player exists
        if (player && player.x !== undefined && player.y !== undefined) {
            // Convert player position to grid coordinates if needed
            const playerGridX = player.gridX !== undefined ? player.gridX : Math.floor(player.x);
            const playerGridY = player.gridY !== undefined ? player.gridY : Math.floor(player.y);
            
            // Check for nearby portals (with a proximity threshold of 1.5 grid units)
            const nearbyPortals = portalSystem.getNearbyPortals(
                playerGridX, 
                playerGridY, 
                currentScene.id,
                1.5
            );
            
            // If player is near a portal, trigger transition
            if (nearbyPortals.length > 0) {
                // Use the first nearby portal
                const portalId = nearbyPortals[0];
                console.log(`Player near portal: ${portalId}`);
                
                // Check if player's Z position allows them to use the portal
                // (must be on the ground to use portals, not jumping)
                if (player.z <= 0.1) {
                    portalSystem.transitionThroughPortal(portalId, player);
                }
            }
        }
        
        // Only render if enough time has passed or a force rerender is requested
        if (forceRerender || now - lastRenderTime > 16) { // ~60fps
            // Scene update logic can be expanded here
            
            // Render the current scene
            if (sceneRenderer) {
                // Clear canvas before rendering
                canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                
                sceneRenderer.render(currentScene);
                lastRenderTime = now;
            }
        }
    }
    
    return currentScene;
}

/**
 * Handle scene transitions based on directional input
 */
function handleSceneTransitions() {
    // Only check for transitions if we have a current scene and not already handling key presses
    if (!sceneManager.getCurrentScene()) return;
    
    // Keep track of transition commands for this frame
    let transitionDetected = false;

    // Use Shift+E for north/up transition
    if (input.isKeyPressed('e') && input.isKeyPressed('Shift') && !consumedKeys.ShiftE) {
        sceneManager.transitionTo('north');
        transitionDetected = true;
        consumedKeys.ShiftE = true;
    }
    
    // Use Shift+D for south/down transition
    if (input.isKeyPressed('d') && input.isKeyPressed('Shift') && !consumedKeys.ShiftD) {
        sceneManager.transitionTo('south');
        transitionDetected = true;
        consumedKeys.ShiftD = true;
    }
    
    // Use Shift+S for west/left transition
    if (input.isKeyPressed('s') && input.isKeyPressed('Shift') && !consumedKeys.ShiftS) {
        sceneManager.transitionTo('west');
        transitionDetected = true;
        consumedKeys.ShiftS = true;
    }
    
    // Use Shift+F for east/right transition
    if (input.isKeyPressed('f') && input.isKeyPressed('Shift') && !consumedKeys.ShiftF) {
        sceneManager.transitionTo('east');
        transitionDetected = true;
        consumedKeys.ShiftF = true;
    }
    
    // Don't reset input state - let the main game handle movement
}

/**
 * Get the current scene manager instance
 * @returns {SceneManager} The scene manager instance
 */
export function getSceneManager() {
    return sceneManager;
}

/**
 * Get the scene renderer instance
 * @returns {SceneRenderer} The scene renderer instance
 */
export function getSceneRenderer() {
    return sceneRenderer;
}
