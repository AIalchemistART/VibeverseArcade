/**
 * SignManager9.js - Manager for ceiling sign entities in Circuit Sanctum Arcade
 * Handles ceiling sign entity creation and placement
 */

import { SignEntity9 } from './signEntity9.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

/**
 * Manages ceiling sign creation and placement
 */
class SignManager9 {
    /**
     * Create a new ceiling sign manager
     * @param {Game} game - Game reference
     */
    constructor(game) {
        this.game = game;
        this.signs = [];
        debug('SignManager9: Initialized');
    }
    
    /**
     * Preload sign assets
     */
    preloadSigns() {
        debug('SignManager9: Preloading ceiling sign assets');
        this.loadSign('sign9');
    }
    
    /**
     * Load a specific sign asset
     * @param {string} signKey - The sign asset key to load
     */
    loadSign(signKey) {
        debug(`SignManager9: Beginning dedicated sign loading for ${signKey}`);
        // Load via asset loader
        const assetPath = `assets/decor/Sign_9.png`;
        debug(`SignManager9: Attempting to load via AssetLoader: ${assetPath}`);
        
        return new Promise((resolve) => {
            // Create a new image
            const signImage = new Image();
            
            signImage.onload = () => {
                debug(`SignManager9: Sign image loaded successfully`);
                assetLoader.assets[signKey] = signImage;
                resolve(true);
            };
            
            signImage.onerror = () => {
                console.error(`SignManager9: Failed to load sign image from ${assetPath}`);
                // Resolve anyway to prevent blocking
                resolve(false);
            };
            
            signImage.src = assetPath;
        });
    }
    
    /**
     * Add signs to the game at predetermined positions
     */
    addSigns() {
        console.log('Adding ceiling signs to scene...');
        
        // Create ceiling signs at strategic positions
        // Positioned in the center of various areas for visibility
        const signPositions = [
            { x: 97.5, y: 14.1, key: 'sign9' } // Central position in the arcade
        ];
        
        // Add each sign
        signPositions.forEach(pos => {
            this.addSign(pos.x, pos.y, pos.key);
        });
        
        console.log('Ceiling signs added successfully');
    }
    
    /**
     * Add a sign to the game at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} signKey - The sign key
     */
    addSign(x, y, signKey) {
        debug(`SignManager9: Adding ceiling sign at (${x}, ${y}) with key ${signKey}`);
        
        // Create sign entity with appropriate dimensions for ceiling sign
        const sign = new SignEntity9(x, y, 4.0, 4.0, signKey);
        
        // Add to game
        if (this.game) {
            this.game.addEntity(sign);
            this.signs.push(sign);
            debug('SignManager9: Ceiling sign added to game successfully');
            
            // If the sign image is loaded, log its dimensions
            if (sign.signImage) {
                debug(`SignManager9: Successfully preloaded ${signKey} (${sign.signImage.width}x${sign.signImage.height})`);
            }
        } else {
            console.error('SignManager9: Game instance not available');
        }
    }
}

export { SignManager9 };
