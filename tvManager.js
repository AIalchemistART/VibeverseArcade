/**
 * TVManager for AI Alchemist's Lair
 * Manages television entities in the game world
 */

import { TVEntity } from './tvEntity.js';
import { Entity } from './entity.js';
import { debug } from './utils.js';

/**
 * Manages TV creation and placement
 */
class TVManager {
    /**
     * Create a new TV manager
     * @param {Game} game - Game reference
     */
    constructor(game) {
        this.game = game;
        debug('TVManager: Initialized');
    }
    
    /**
     * Preload TV assets
     */
    preloadTVs() {
        debug('TVManager: Preloading TV assets');
        this.loadTV('tv1');
    }
    
    /**
     * Load a specific TV asset
     * @param {string} tvKey - The TV asset key to load
     */
    loadTV(tvKey) {
        debug(`TVManager: Beginning dedicated TV loading for ${tvKey}`);
        // Load via asset loader
        const assetPath = `assets/decor/Television_1.png`;
        debug(`TVManager: Attempting to load via AssetLoader: ${assetPath}`);
        
        try {
            const loadStatus = this.game.assetLoader.isAssetLoaded(tvKey);
            if (loadStatus) {
                debug(`TVManager: TV ${tvKey} already loaded in asset loader`);
            } 
        } catch (error) {
            console.error(`TVManager: Error checking TV load status:`, error);
        }
    }
    
    /**
     * Add TVs to the scene
     */
    addTVs() {
        console.log('Adding TV to scene...');
        
        // Place the TV in a different location from the jukebox
        // Position it against a wall
        const tvX = 89.5;
        const tvY = 30.5;
        this.addTV(tvX, tvY, 'tv1');
        
        console.log('TV added successfully');
    }
    
    /**
     * Add a single TV at specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} tvKey - Key for the TV asset
     */
    addTV(x, y, tvKey = 'tv1') {
        debug(`TVManager: Adding TV at (${x}, ${y}) with key ${tvKey}`);
        
        // Create TV entity
        const tv = new TVEntity(x, y, 1.6875, 2.8125, tvKey);
        
        // Add to game
        if (this.game) {
            this.game.addEntity(tv);
            console.log(`TVManager: TV added to game at (${x}, ${y})`);
            
            // Create a shadow hitbox entity for the base of the TV
           // this.createTVGroundHitbox(x, y);
        } else {
            console.error('TVManager: Game instance not available, cannot add TV entity');
        }
        
        return tv;
    }
    
    /**
     * Create a shadow hitbox entity at the base of the TV for better collision detection
     * @param {number} x - Grid X position of the TV
     * @param {number} y - Grid Y position of the TV
     */
    createTVGroundHitbox(x, y) {
        if (!this.game) {
            console.error('TVManager: Game instance not available, cannot create ground hitbox');
            return;
        }
        
        console.log(`TVManager: Creating ground hitbox for TV at (${x}, ${y})`);
        
        // Create a basic entity that will serve as the ground hitbox
        // Update size to match the TV dimensions (3x5)
        const groundHitbox = new Entity(x, y, 3, 5);
        
        // Configure the ground hitbox properties
        groundHitbox.isStatic = true;
        groundHitbox.velocityX = 0;
        groundHitbox.velocityY = 0;
        groundHitbox.z = 0;                 // Position it low to the ground
        groundHitbox.zHeight = 2.0;         // Give it enough height to catch the player
        groundHitbox.isTVGroundHitbox = true;  // Mark it as a special type
        
        // Override the draw method to show hitbox in debug mode
        groundHitbox.draw = function(ctx, screenX, screenY, width, height, zOffset) {
            // Only show in debug mode
            if (window.DEBUG_MODE) {
                ctx.save();
                ctx.strokeStyle = 'rgba(61, 245, 255, 0.5)';  // Cyan color for TV hitbox
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    screenX - width/2,
                    screenY - height/2,
                    width,
                    height
                );
                ctx.fillStyle = 'rgba(61, 245, 255, 0.2)';
                ctx.fillRect(
                    screenX - width/2,
                    screenY - height/2,
                    width,
                    height
                );
                ctx.restore();
                
                // Draw label for debugging
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.fillText('TV-GROUND', screenX, screenY);
            }
        };
        
        // Add the ground hitbox to the game
        this.game.addEntity(groundHitbox);
        console.log(`TVManager: Ground hitbox added to game at (${x}, ${y}), z=${groundHitbox.z}`);
    }
}

export { TVManager };
