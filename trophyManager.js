/**
 * TrophyManager.js - Manages trophy entities in AI Alchemist's Lair
 * Handles creating, placing, and managing trophy entities in the game world
 */

import { TrophyEntity } from './trophyEntity.js';
import { debug } from './utils.js';

export class TrophyManager {
    /**
     * Create a new trophy manager
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.game = game;
        this.trophies = [];
        
        debug('TrophyManager: Initialized');
    }
    
    /**
     * Preload all trophy assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadAssets() {
        debug('TrophyManager: Preloading trophy assets');
        
        // Create a dummy trophy to trigger asset loading
        const dummyTrophy = new TrophyEntity(0, 0);
        
        // Remove the dummy trophy (it was just for preloading)
        return Promise.resolve();
    }
    
    /**
     * Add trophies to the game
     * @param {Array} trophyConfigs - Array of trophy configurations
     */
    addTrophies(trophyConfigs = []) {
        debug(`TrophyManager: Adding ${trophyConfigs.length || 'default'} trophies to scene`);
        
        // If no configs provided, use default trophy placement
        if (!trophyConfigs || trophyConfigs.length === 0) {
            trophyConfigs = this.getDefaultTrophyConfigs();
        }
        
        // Create each trophy based on config
        trophyConfigs.forEach(config => {
            this.addTrophy(config);
        });
    }
    
    /**
     * Add a single trophy to the game
     * @param {Object} config - Trophy configuration object
     * @returns {TrophyEntity} - The created trophy entity
     */
    addTrophy(config) {
        if (!config || !config.position) {
            debug('TrophyManager: Invalid trophy configuration', config);
            return null;
        }
        
        const { x, y, z } = config.position;
        
        // Create the trophy entity
        const trophy = new TrophyEntity(x, y, z, {
            id: config.id || 'trophy1',
            targetUrl: config.targetUrl || 'https://jam.pieter.com',
            glowColor: config.glowColor || '#ffcc00',
            interactionDistance: config.interactionDistance || 2.5,
            maxGlowIntensity: config.maxGlowIntensity || 0.8
        });
        
        // Add to game and tracking array
        if (this.game) {
            this.game.addEntity(trophy);
            this.trophies.push(trophy);
            debug(`TrophyManager: Added trophy at (${x}, ${y}, ${z})`);
            return trophy;
        } else {
            debug('TrophyManager: Cannot add trophy - no game instance available');
            return null;
        }
    }
    
    /**
     * Get default trophy configurations if none provided
     * @returns {Array} - Array of default trophy configurations
     */
    getDefaultTrophyConfigs() {
        return [
            {
                position: { x: 109.1, y: 44.6, z: 0 },
                id: 'trophy1',
                targetUrl: 'https://jam.pieter.com',
                glowColor: '#FFDF00', // Bright gold color
                interactionDistance: 3.0, // Slightly increased interaction range
                maxGlowIntensity: 0.95 // Enhanced glow intensity
            }
        ];
    }
    
    /**
     * Remove all trophies from the game
     */
    removeTrophies() {
        if (this.game) {
            this.trophies.forEach(trophy => {
                this.game.removeEntity(trophy);
            });
        }
        
        this.trophies = [];
        debug('TrophyManager: Removed all trophies');
    }
}
