/**
 * CouchManager.js - Manager for couch entities in AI Alchemist's Lair
 * Handles couch entity creation and placement
 */

import { CouchEntity } from './couchEntity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class CouchManager {
    constructor(game) {
        this.game = game;
        this.couches = [];
        
        debug('CouchManager: Initialized');
    }
    
    /**
     * Preload couch assets
     * @returns {Promise} - Promise that resolves when assets are loaded
     */
    preloadAssets() {
        debug('CouchManager: Preloading couch assets');
        
        return new Promise((resolve) => {
            // Preload couch image
            const couchImage = new Image();
            couchImage.onload = () => {
                debug('CouchManager: Couch image loaded successfully');
                assetLoader.assets['couch1'] = couchImage;
                resolve();
            };
            
            couchImage.onerror = () => {
                console.error('CouchManager: Failed to load couch image');
                // Resolve anyway to prevent blocking
                resolve();
            };
            
            couchImage.src = './assets/decor/Couch_1.png';
        });
    }
    
    /**
     * Add couches to the scene
     * @param {number} count - Number of couches to add
     * @param {Array} positions - Optional positions array [{x,y,z}]
     */
    addCouches(count = 1, positions = null) {
        debug(`CouchManager: Adding ${count} couches to scene`);
        
        // Use predefined positions or generate random ones
        const couchPositions = positions || this.getDefaultCouchPositions(count);
        
        // Create and add each couch
        couchPositions.forEach(pos => {
            const couch = new CouchEntity(pos.x, pos.y, pos.z || 0);
            this.game.addEntity(couch);
            this.couches.push(couch);
            debug(`CouchManager: Added couch at (${pos.x}, ${pos.y}, ${pos.z || 0})`);
        });
    }
    
    /**
     * Create a couch ground hitbox
     * This creates the collision bounds for a couch
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @return {Object} - The created hitbox entity
     */
    createCouchGroundHitbox(x, y, z = 0) {
        const hitbox = {
            x,
            y,
            z,
            width: 4.0,   // Couch is wider
            height: 1.5,  // But not as deep
            zHeight: 1.0, // Standard height for collision
            isStatic: true,
            collidable: true,
            visible: false,
            isHitbox: true,
            update: function() {} // Empty update function for static object
        };
        
        this.game.addEntity(hitbox);
        debug(`CouchManager: Added couch hitbox at (${x}, ${y}, ${z})`);
        
        return hitbox;
    }
    
    /**
     * Get default couch positions
     * @param {number} count - Number of positions to generate
     * @returns {Array} - Array of position objects {x, y, z}
     */
    getDefaultCouchPositions(count) {
        // Default couch positions - placed in nice spots in the room
        const defaultPositions = [
            { x: 104, y: 32, z: 0 }, // Couch against the wall
        ];
        
        // If more positions needed, add them procedurally
        if (count > defaultPositions.length) {
            for (let i = defaultPositions.length; i < count; i++) {
                defaultPositions.push({
                    x: 10 + Math.random() * 5,
                    y: 5 + Math.random() * 5,
                    z: 0
                });
            }
        }
        
        // Return requested number of positions
        return defaultPositions.slice(0, count);
    }
}
