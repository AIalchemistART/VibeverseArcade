/**
 * JukeboxManager for AI Alchemist's Lair
 * Manages jukebox entities in the game world
 */

import { JukeboxEntity } from './jukeboxEntity.js';
import { Entity } from './entity.js';
import { debug } from './utils.js';

/**
 * Manages jukebox creation and placement
 */
class JukeboxManager {
    /**
     * Create a new jukebox manager
     * @param {Game} game - Game reference
     */
    constructor(game) {
        this.game = game;
        debug('JukeboxManager: Initialized');
    }
    
    /**
     * Preload jukebox assets
     */
    preloadJukeboxes() {
        debug('JukeboxManager: Preloading jukebox assets');
        this.loadJukebox('jukebox1');
    }
    
    /**
     * Load a specific jukebox asset
     * @param {string} jukeboxKey - The jukebox asset key to load
     */
    loadJukebox(jukeboxKey) {
        debug(`JukeboxManager: Beginning dedicated jukebox loading for ${jukeboxKey}`);
        // Load via asset loader
        const assetPath = `assets/decor/Jukebox_1.png`;
        debug(`JukeboxManager: Attempting to load via AssetLoader: ${assetPath}`);
        
        try {
            const loadStatus = this.game.assetLoader.isAssetLoaded(jukeboxKey);
            if (loadStatus) {
                debug(`JukeboxManager: Jukebox ${jukeboxKey} already loaded in asset loader`);
            } 
        } catch (error) {
            console.error(`JukeboxManager: Error checking jukebox load status:`, error);
        }
    }
    
    /**
     * Add jukeboxes to the scene
     */
    addJukeboxes() {
        console.log('Adding jukebox to scene...');
        
        // Place the jukebox in the opposite corner from the sign
        // Using -1,-1 positions the hitbox to match the visual appearance at 0,0
        const jukeboxX = 88;
        const jukeboxY = 42;
        this.addJukebox(jukeboxX, jukeboxY, 'jukebox1');
        
        console.log('Jukebox added successfully');
    }
    
    /**
     * Add a single jukebox at specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} jukeboxKey - Key for the jukebox asset
     */
    addJukebox(x, y, jukeboxKey = 'jukebox1') {
        debug(`JukeboxManager: Adding jukebox at (${x}, ${y}) with key ${jukeboxKey}`);
        
        // Create jukebox entity
        const jukebox = new JukeboxEntity(x, y, 1.125, 1.875, jukeboxKey);
        
        // Add to game
        if (this.game) {
            this.game.addEntity(jukebox);
            console.log(`JukeboxManager: Jukebox added to game at (${x}, ${y})`);
            
            // Create a shadow hitbox entity for the base of the jukebox
            this.createJukeboxGroundHitbox(x, y);
        } else {
            console.error('JukeboxManager: Game instance not available, cannot add jukebox entity');
        }
        
        return jukebox;
    }
    
    /**
     * Create a shadow hitbox entity at the base of the jukebox for better collision detection
     * @param {number} x - Grid X position of the jukebox
     * @param {number} y - Grid Y position of the jukebox
     */
    createJukeboxGroundHitbox(x, y) {
        if (!this.game) {
            console.error('JukeboxManager: Game instance not available, cannot create ground hitbox');
            return;
        }
        
        console.log(`JukeboxManager: Creating ground hitbox for jukebox at (${x}, ${y})`);
        
        // Create a basic entity that will serve as the ground hitbox
        const groundHitbox = new Entity(x, y, 6, 6);
        
        // Configure the ground hitbox properties
        groundHitbox.isStatic = true;
        groundHitbox.velocityX = 0;
        groundHitbox.velocityY = 0;
        groundHitbox.z = 0;                 // Position it low to the ground
        groundHitbox.zHeight = 2.0;            // Give it enough height to catch the player
        groundHitbox.isJukeboxGroundHitbox = true;  // Mark it as a special type
        
        // Override the draw method to show hitbox in debug mode
        groundHitbox.draw = function(ctx, screenX, screenY, width, height, zOffset) {
            // Only show in debug mode
            if (window.DEBUG_MODE) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    screenX - width/2,
                    screenY - height/2,
                    width,
                    height
                );
                ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
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
                ctx.fillText('JUKEBOX-GROUND', screenX, screenY);
            }
        };
        
        // Add the ground hitbox to the game
        this.game.addEntity(groundHitbox);
        console.log(`JukeboxManager: Ground hitbox added to game at (${x}, ${y}), z=${groundHitbox.z}`);
    }
}

export { JukeboxManager };
