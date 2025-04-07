/**
 * Couch2Manager.js - Manager for couch2 entities in AI Alchemist's Lair
 * Handles couch2 entity creation and placement
 */

import { Couch2Entity } from './couch2Entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class Couch2Manager {
    constructor(game) {
        this.game = game;
        this.couches = [];
        
        debug('Couch2Manager: Initialized');
    }
    
    /**
     * Preload couch2 assets
     * @returns {Promise} - Promise that resolves when assets are loaded
     */
    preloadAssets() {
        debug('Couch2Manager: Preloading couch2 assets');
        
        return new Promise((resolve) => {
            // Preload couch image
            const couchImage = new Image();
            couchImage.onload = () => {
                debug('Couch2Manager: Couch2 image loaded successfully');
                assetLoader.assets['couch2'] = couchImage;
                resolve();
            };
            
            couchImage.onerror = () => {
                console.error('Couch2Manager: Failed to load couch2 image');
                // Resolve anyway to prevent blocking
                resolve();
            };
            
            couchImage.src = './assets/decor/Couch_2.png';
        });
    }
    
    /**
     * Add couches to the scene
     * @param {number} count - Number of couches to add
     * @param {Array} positions - Optional positions array [{x,y,z}]
     */
    addCouches(count = 1, positions = null) {
        debug(`Couch2Manager: Adding ${count} couches to scene`);
        
        // Use provided positions or generate default ones
        const couchPositions = positions || this.getDefaultCouchPositions(count);
        
        // Create and add couches
        for (let i = 0; i < Math.min(count, couchPositions.length); i++) {
            const pos = couchPositions[i];
            
            // Create new couch entity
            const couch = new Couch2Entity(pos.x, pos.y, pos.z || 0);
            
            // Add to game
            if (this.game && typeof this.game.addEntity === 'function') {
                this.game.addEntity(couch);
                this.couches.push(couch);
                debug(`Couch2Manager: Added couch at (${pos.x}, ${pos.y})`);
            } else {
                console.error('Couch2Manager: Game instance not available, cannot add couch entity');
            }
        }
    }
    
    /**
     * Get default positions for couches
     * @param {number} count - Number of positions to generate
     * @returns {Array} - Array of positions [{x,y,z}]
     */
    getDefaultCouchPositions(count) {
        // Default couch positions - placed along walls or in corners
        const defaultPositions = [
            { x: 104, y: 43, z: 0 }, // Against the left wall
        ];
        
        // If more positions needed, add them procedurally
        if (count > defaultPositions.length) {
            // Add procedurally generated positions
            for (let i = defaultPositions.length; i < count; i++) {
                defaultPositions.push({
                    x: 8 + Math.random() * 3,
                    y: 5 + Math.random() * 3,
                    z: 0
                });
            }
        }
        
        return defaultPositions;
    }
}
