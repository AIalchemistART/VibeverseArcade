/**
 * Portal Manager Module
 * Manages portals across scenes and handles portal-player interaction
 */

import { scenes } from './sceneData.js';
import { createPortalsFromScenes } from './portals.js';
import { getSceneManager } from './sceneIntegration.js';

class PortalManager {
    constructor() {
        // Initialize portals for all scenes
        this.portalsByScene = createPortalsFromScenes(scenes);
        this.activePortals = [];
        this.transitionCooldown = 0;
        this.transitionCooldownDuration = 1.0; // Seconds before another transition is allowed
        
        // Debug flag
        this.debug = true;
    }

    /**
     * Update all portals in the current scene
     * @param {number} deltaTime - Time since last frame
     * @param {number} playerX - Player X position in grid coordinates
     * @param {number} playerY - Player Y position in grid coordinates
     */
    update(deltaTime, playerX, playerY) {
        // Decrease transition cooldown
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime;
        }

        // Get current scene ID
        const sceneManager = getSceneManager();
        const currentScene = sceneManager.getCurrentScene();
        
        if (!currentScene) return;
        
        // Get active portals for current scene
        this.activePortals = this.portalsByScene[currentScene.id] || [];
        
        if (this.debug && this.activePortals.length > 0 && Math.random() < 0.01) {
            console.log(`[DEBUG] Active portals for ${currentScene.id}:`, this.activePortals.length);
            console.log(`[DEBUG] First portal at x:${this.activePortals[0].x}, y:${this.activePortals[0].y} to ${this.activePortals[0].targetScene}`);
        }
        
        // Update each portal animation
        this.activePortals.forEach(portal => {
            portal.update(deltaTime);
            
            // Check for collision with player if not in cooldown
            if (this.transitionCooldown <= 0 && portal.isCollidingWithPlayer(playerX, playerY)) {
                if (this.debug) {
                    console.log(`[DEBUG] Portal collision detected! Transitioning to ${portal.targetScene}`);
                }
                
                // Transition to the target scene
                sceneManager.loadScene(portal.targetScene);
                
                // Set transition cooldown to prevent rapid transitions
                this.transitionCooldown = this.transitionCooldownDuration;
            }
        });
    }

    /**
     * Render all portals in the current scene
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} camera - Camera instance
     * @param {object} scene - Scene instance with cell dimensions
     */
    render(ctx, camera, scene) {
        // Ensure we have the scene cell dimensions for proper rendering
        if (!scene || !scene.cellWidth || !scene.cellHeight) {
            if (this.debug) {
                console.warn('[DEBUG] Scene or cell dimensions missing in portal rendering:', scene);
            }
            return;
        }
        
        // Render each active portal
        this.activePortals.forEach(portal => {
            try {
                portal.render(ctx, camera, scene);
            } catch (error) {
                if (this.debug) {
                    console.error('[DEBUG] Error rendering portal:', error);
                }
            }
        });
        
        // Debug rendering: Show portal count
        if (this.debug) {
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`Portals: ${this.activePortals.length}`, 10, 60);
            ctx.restore();
        }
    }
}

// Create a singleton instance
const portalManager = new PortalManager();

export { portalManager };
