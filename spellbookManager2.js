/**
 * SpellbookManager Module
 * Manages spellbook entities across the game world
 */

import { SpellbookEntity2 } from './spellbookEntity2.js';
import { debug } from './utils.js';

export class SpellbookManager2 {
    /**
     * Create a new spellbook manager
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.game = game;
        this.spellbooks = [];
        
        debug('SpellbookManager2: Initialized');
    }
    
    /**
     * Preload all spellbook assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadAssets() {
        debug('SpellbookManager2: Preloading spellbook assets');
        
        // Create a dummy spellbook to trigger asset loading
        const dummySpellbook = new SpellbookEntity2(0, 0);
        
        // Remove the dummy spellbook (it was just for preloading)
        return Promise.resolve();
    }
    
    /**
     * Add spellbooks to the game
     * @param {Array} spellbookConfigs - Array of spellbook configurations
     */
    addSpellbooks(spellbookConfigs = []) {
        debug(`SpellbookManager2: Adding ${spellbookConfigs.length || 'default'} spellbooks to scene`);
        
        // If no configs provided, use default spellbook placement
        if (!spellbookConfigs || spellbookConfigs.length === 0) {
            spellbookConfigs = this.getDefaultSpellbookConfigs();
        }
        
        // Create each spellbook based on config
        spellbookConfigs.forEach(config => {
            this.addSpellbook(config);
        });
    }
    
    /**
     * Add a single spellbook to the game
     * @param {Object} config - Spellbook configuration object
     * @returns {SpellbookEntity} - The created spellbook entity
     */
    addSpellbook(config) {
        if (!config || !config.position) {
            debug('SpellbookManager2: Invalid spellbook configuration', config);
            return null;
        }
        
        const { x, y, z } = config.position;
        
        // Create the spellbook entity
        const spellbook = new SpellbookEntity2(x, y, z, {
            id: config.id || 'spellbook2',
            glowColor: config.glowColor || '#008080',
            interactionDistance: config.interactionDistance || 4.0,
            maxGlowIntensity: config.maxGlowIntensity || 0.9
        });
        
        // Add to game and tracking array
        if (this.game) {
            this.game.addEntity(spellbook);
            this.spellbooks.push(spellbook);
            debug(`SpellbookManager2: Added spellbook at (${x}, ${y}, ${z})`);
            return spellbook;
        } else {
            debug('SpellbookManager2: Cannot add spellbook - no game instance available');
            return null;
        }
    }
    
    /**
     * Get default spellbook configurations if none provided
     * @returns {Array} - Array of default spellbook configurations
     */
    getDefaultSpellbookConfigs() {
        return [
            {
                position: { x: 125, y: 28, z: 0 }, // Different position from original spellbook
                id: 'spellbook2',
                glowColor: '#008080', // Teal color to differentiate from original
                interactionDistance: 3.0,
                maxGlowIntensity: 0.9
            }
        ];
    }
    
    /**
     * Remove all spellbooks from the game
     */
    removeSpellbooks() {
        if (this.game) {
            this.spellbooks.forEach(spellbook => {
                this.game.removeEntity(spellbook);
            });
        }
        
        this.spellbooks = [];
        debug('SpellbookManager2: Removed all spellbooks');
    }
}
