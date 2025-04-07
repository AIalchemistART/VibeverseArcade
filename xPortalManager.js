/**
 * XPortalManager.js - Manages X portal entities in AI Alchemist's Lair
 * Handles creating, placing, and managing X portal entities in the game world
 */

import { PortalEntity } from './portalEntity.js';
import { debug } from './utils.js';

export class XPortalManager {
    /**
     * Create a new X portal manager
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.game = game;
        this.portals = [];
        
        debug('XPortalManager: Initialized');
    }
    
    /**
     * Preload all portal assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadAssets() {
        debug('XPortalManager: Preloading portal assets');
        
        // Create a dummy portal to trigger asset loading
        const dummyPortal = new PortalEntity(0, 0);
        
        // Remove the dummy portal (it was just for preloading)
        return Promise.resolve();
    }
    
    /**
     * Add portals to the game
     * @param {Array} portalConfigs - Array of portal configurations
     */
    addPortals(portalConfigs = []) {
        debug(`XPortalManager: Adding ${portalConfigs.length || 'default'} portals to scene`);
        
        // If no configs provided, use default portal placement
        if (!portalConfigs || portalConfigs.length === 0) {
            portalConfigs = this.getDefaultPortalConfigs();
        }
        
        // Create each portal based on config
        portalConfigs.forEach(config => {
            this.addPortal(config);
        });
    }
    
    /**
     * Add a single portal to the game
     * @param {Object} config - Portal configuration object
     * @returns {PortalEntity} - The created portal entity
     */
    addPortal(config) {
        if (!config || !config.position) {
            debug('XPortalManager: Invalid portal configuration', config);
            return null;
        }
        
        const { x, y, z } = config.position;
        
        // Create the portal entity
        const portal = new PortalEntity(x, y, z, {
            id: config.id || 'portal1',
            targetUrl: config.targetUrl || 'https://x.com/aialchemistart',
            glowColor: config.glowColor || '#8A2BE2',
            interactionDistance: config.interactionDistance || 3.0,
            maxGlowIntensity: config.maxGlowIntensity || 0.8
        });
        
        // Add to game and tracking array
        if (this.game) {
            this.game.addEntity(portal);
            this.portals.push(portal);
            debug(`XPortalManager: Added portal at (${x}, ${y}, ${z})`);
            return portal;
        } else {
            debug('XPortalManager: Cannot add portal - no game instance available');
            return null;
        }
    }
    
    /**
     * Get default portal configurations if none provided
     * @returns {Array} - Array of default portal configurations
     */
    getDefaultPortalConfigs() {
        return [
            {
                position: { x: 103, y: 55, z: 0 },
                id: 'portal1',
                targetUrl: 'https://x.com/aialchemistart',
                glowColor: '#8A2BE2', // BlueViolet color
                interactionDistance: 5.0,
                maxGlowIntensity: 0.95
            }
        ];
    }
    
    /**
     * Remove all portals from the game
     */
    removePortals() {
        if (this.game) {
            this.portals.forEach(portal => {
                this.game.removeEntity(portal);
            });
        }
        
        this.portals = [];
        debug('XPortalManager: Removed all portals');
    }
}
