/**
 * RugManager.js - Manager for rug entities in AI Alchemist's Lair
 * Handles rug entity creation and placement
 */

import { RugEntity } from './rugEntity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class RugManager {
    constructor(game) {
        this.game = game;
        this.rugs = [];
        
        debug('RugManager: Initialized');
    }
    
    /**
     * Preload rug assets
     * @returns {Promise} - Promise that resolves when assets are loaded
     */
    preloadAssets() {
        debug('RugManager: Preloading rug assets');
        
        return new Promise((resolve) => {
            // Preload rug image
            const rugImage = new Image();
            rugImage.onload = () => {
                debug('RugManager: Rug image loaded successfully');
                assetLoader.assets['rug1'] = rugImage;
                resolve();
            };
            
            rugImage.onerror = () => {
                console.error('RugManager: Failed to load rug image');
                // Resolve anyway to prevent blocking
                resolve();
            };
            
            rugImage.src = './assets/decor/Rug_1.png';
        });
    }
    
    /**
     * Add rugs to the scene
     * @param {number} count - Number of rugs to add
     * @param {Array} positions - Optional positions array [{x,y,z}]
     */
    addRugs(count = 1, positions = null) {
        debug(`RugManager: Adding ${count} rugs to scene`);
        
        // Use predefined positions or generate random ones
        const rugPositions = positions || this.getDefaultRugPositions(count);
        
        // Create and add each rug
        rugPositions.forEach(pos => {
            const rug = new RugEntity(pos.x, pos.y, pos.z || -0.1);
            this.game.addEntity(rug);
            this.rugs.push(rug);
            debug(`RugManager: Added rug at (${pos.x}, ${pos.y}, ${pos.z || -0.1})`);
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
            { x: 100, y: 40, z: -0.1 }, // Center of the room
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
