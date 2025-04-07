/**
 * SpellbookManager Module
 * Manages spellbook entities across the game world
 */

import { SpellbookEntity } from './spellbookEntity.js';
import { debug } from './utils.js';

export class SpellbookManager {
    /**
     * Create a new spellbook manager
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.game = game;
        this.spellbooks = [];
        
        debug('SpellbookManager: Initialized');
    }
    
    /**
     * Preload all spellbook assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadAssets() {
        debug('SpellbookManager: Preloading spellbook assets');
        
        // Create a dummy spellbook to trigger asset loading
        const dummySpellbook = new SpellbookEntity(0, 0);
        
        // Remove the dummy spellbook (it was just for preloading)
        return Promise.resolve();
    }
    
    /**
     * Add spellbooks to the game
     * @param {Array} spellbookConfigs - Array of spellbook configurations
     */
    addSpellbooks(spellbookConfigs = []) {
        debug(`SpellbookManager: Adding ${spellbookConfigs.length || 'default'} spellbooks to scene`);
        
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
            debug('SpellbookManager: Invalid spellbook configuration', config);
            return null;
        }
        
        const { x, y, z } = config.position;
        
        // Create the spellbook entity
        const spellbook = new SpellbookEntity(x, y, z, {
            id: config.id || 'spellbook1',
            glowColor: config.glowColor || '#008080',
            interactionDistance: config.interactionDistance || 4.0,
            maxGlowIntensity: config.maxGlowIntensity || 0.9
        });
        
        // Add to game and tracking array
        if (this.game) {
            this.game.addEntity(spellbook);
            this.spellbooks.push(spellbook);
            debug(`SpellbookManager: Added spellbook at (${x}, ${y}, ${z})`);
            return spellbook;
        } else {
            debug('SpellbookManager: Cannot add spellbook - no game instance available');
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
                position: { x: 95, y: 18, z: 0 },
                id: 'spellbook1',
                glowColor: '#008080', // Teal color
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
        debug('SpellbookManager: Removed all spellbooks');
    }
}
