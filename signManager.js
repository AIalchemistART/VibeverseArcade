/**
 * SignManager for AI Alchemist's Lair
 * Manages sign entities in the game world
 */

import { SignEntity } from './signEntity.js';
import { debug } from './utils.js';

/**
 * Manages sign creation and placement
 */
class SignManager {
    /**
     * Create a new sign manager
     * @param {Game} game - Game reference
     */
    constructor(game) {
        this.game = game;
        debug('SignManager: Initialized');
    }
    
    /**
     * Preload sign assets
     */
    preloadSigns() {
        debug('SignManager: Preloading sign assets');
        this.loadSign('sign1');
    }
    
    /**
     * Load a specific sign asset
     * @param {string} signKey - The sign asset key to load
     */
    loadSign(signKey) {
        debug(`SignLoader: Beginning dedicated sign loading for ${signKey}`);
        // Load via asset loader
        const assetPath = `assets/decor/Sign_1.png`;
        debug(`SignLoader: Attempting to load via AssetLoader: ${assetPath}`);
        
        try {
            const loadStatus = this.game.assetLoader.isAssetLoaded(signKey);
            if (loadStatus) {
                debug(`SignLoader: Sign ${signKey} already loaded in asset loader`);
            } 
        } catch (error) {
            console.error(`SignLoader: Error checking sign load status:`, error);
        }
    }
    
    /**
     * Add a sign to the game at a specific position
     * Explicitly creates one sign at the specified position
     */
    addSigns() {
        console.log('Adding sign to scene...');
        
        // Create a single, larger sign at the requested position
        const signX = 96.5;
        const signY = 1.5;
        this.addSign(signX, signY, 'sign1');
        
        console.log('Sign added successfully');
    }
    
    /**
     * Add a sign to the game at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} signKey - The sign key
     */
    addSign(x, y, signKey) {
        debug(`SignManager: Adding sign at (${x}, ${y}) with key ${signKey}`);
        
        // Create sign entity
        const sign = new SignEntity(x, y, 3.2, 3.2, signKey);
        
        // Add to game
        if (this.game) {
            this.game.addEntity(sign);
            debug('SignManager: Sign added to game successfully');
            
            // If the sign image is loaded, log its dimensions
            if (sign.signImage) {
                debug(`SignManager: Successfully preloaded ${signKey} (${sign.signImage.width}x${sign.signImage.height})`);
            }
        } else {
            console.error('SignManager: Game instance not available');
        }
    }
}

export { SignManager };
