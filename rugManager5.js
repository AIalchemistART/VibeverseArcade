/**
 * RugManager5.js - Manager for fifth rug entities in Circuit Sanctum Arcade
 * Handles rug entity creation and placement for tertiary rugs
 */

import { RugEntity5 } from './rugEntity5.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class RugManager5 {
    constructor(game) {
        this.game = game;
        this.rugs = [];
        
        debug('RugManager5: Initialized');
    }
    
    /**
     * Preload rug assets
     * @returns {Promise} - Promise that resolves when assets are loaded
     */
    preloadAssets() {
        debug('RugManager5: Preloading rug assets');
        console.log('RugManager5: Preloading assets - starting');
        
        return new Promise((resolve) => {
            // Preload rug image
            const rugImage = new Image();
            rugImage.onload = () => {
                console.log('RugManager5: Rug image loaded successfully');
                // Important: Store in asset loader with the correct key
                assetLoader.assets['rug5'] = rugImage;
                resolve();
            };
            
            rugImage.onerror = (err) => {
                console.error('RugManager5: Failed to load rug image', err);
                // Create a basic fallback image
                const canvas = document.createElement('canvas');
                canvas.width = 180;
                canvas.height = 180;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, 0, 180, 180);
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 10;
                ctx.strokeRect(10, 10, 160, 160);
                
                // Create an image from the canvas
                const fallbackImg = new Image();
                fallbackImg.src = canvas.toDataURL();
                
                // Store fallback in asset loader
                assetLoader.assets['rug5'] = fallbackImg;
                console.log('RugManager5: Created fallback image after load error');
                
                // Resolve anyway to prevent blocking
                resolve();
            };
            
            // Important: Use the correct path
            const assetPath = './assets/decor/Rug_5.png';
            console.log('RugManager5: Loading from path:', assetPath);
            rugImage.src = assetPath;
        });
    }
    
    /**
     * Add rugs to the scene
     * @param {number} count - Number of rugs to add
     * @param {Array} positions - Optional positions array [{x,y,z}]
     */
    addRugs(count = 1, positions = null) {
        debug(`RugManager5: Adding ${count} rugs to scene`);
        
        // Use predefined positions or generate random ones
        const rugPositions = positions || this.getDefaultRugPositions(count);
        
        // Create and add each rug
        rugPositions.forEach(pos => {
            const rug = new RugEntity5(pos.x, pos.y, pos.z || -0.1);
            this.game.addEntity(rug);
            this.rugs.push(rug);
            debug(`RugManager5: Added rug at (${pos.x}, ${pos.y}, ${pos.z || -0.1})`);
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
            { x: 71, y: 45, z: -0.1 }, // Different position for fifth rug
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
