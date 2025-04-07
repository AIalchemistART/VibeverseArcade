/**
 * RugManager2.js - Manager for second rug entities in Circuit Sanctum Arcade
 * Handles rug entity creation and placement for secondary rugs
 */

import { RugEntity2 } from './rugEntity2.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class RugManager2 {
    constructor(game) {
        this.game = game;
        this.rugs = [];
        
        debug('RugManager2: Initialized');
    }
    
    /**
     * Preload rug assets
     * @returns {Promise} - Promise that resolves when assets are loaded
     */
    preloadAssets() {
        debug('RugManager2: Preloading rug assets');
        
        return new Promise((resolve) => {
            // Preload rug image
            const rugImage = new Image();
            rugImage.onload = () => {
                debug('RugManager2: Rug image loaded successfully');
                assetLoader.assets['rug2'] = rugImage;
                resolve();
            };
            
            rugImage.onerror = () => {
                console.error('RugManager2: Failed to load rug image');
                // Resolve anyway to prevent blocking
                resolve();
            };
            
            rugImage.src = './assets/decor/Rug_2.png';
        });
    }
    
    /**
     * Add rugs to the scene
     * @param {number} count - Number of rugs to add
     * @param {Array} positions - Optional positions array [{x,y,z}]
     */
    addRugs(count = 1, positions = null) {
        debug(`RugManager2: Adding ${count} rugs to scene`);
        
        // Use predefined positions or generate random ones
        const rugPositions = positions || this.getDefaultRugPositions(count);
        
        // Create and add each rug
        rugPositions.forEach(pos => {
            const rug = new RugEntity2(pos.x, pos.y, pos.z || -0.1);
            this.game.addEntity(rug);
            this.rugs.push(rug);
            debug(`RugManager2: Added rug at (${pos.x}, ${pos.y}, ${pos.z || -0.1})`);
        });
    }
    
    /**
     * Get default rug positions
     * @param {number} count - Number of positions to generate
     * @returns {Array} - Array of position objects {x, y, z}
     */
    getDefaultRugPositions(count) {
        // Default rug positions - centered in the room or in key areas
        const defaultPositions = [
            { x: 71, y: 13, z: -0.1 }, // Different position for second rug
        ];
        
        // If more positions needed, add them procedurally
        if (count > defaultPositions.length) {
            for (let i = defaultPositions.length; i < count; i++) {
                defaultPositions.push({
                    x: 8 + Math.random() * 8,
                    y: 8 + Math.random() * 8,
                    z: -0.1
                });
            }
        }
        
        // Return requested number of positions
        return defaultPositions.slice(0, count);
    }
}
