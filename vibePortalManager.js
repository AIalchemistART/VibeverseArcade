/**
 * VibePortalManager.js - Manager for VIBEVERSE portal entities
 * Handles portal creation, placement, and interactions
 */

import { VibePortalEntity } from './vibePortalEntity.js';
import { debug, info } from './utils.js';

export class VibePortalManager {
    /**
     * Create a new VIBEVERSE portal manager
     * @param {Game} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.portals = [];
        
        // Check URL parameters to determine if the return portal should be shown
        this.shouldShowReturnPortal = this.checkPortalVisibility();
        
        // Setup portal event listeners
        this.setupEventListeners();
        
        debug('VibePortalManager: Initialized');
        info(`VibePortalManager: Return portal visibility: ${this.shouldShowReturnPortal ? 'VISIBLE' : 'HIDDEN'}`);
    }
    
    /**
     * Check URL parameters to determine if the return portal should be shown
     * @returns {boolean} - Whether the return portal should be shown
     */
    checkPortalVisibility() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if portal=true and ref parameter exists
        const portalParam = urlParams.get('portal');
        const refParam = urlParams.get('ref');
        
        // Return portal should only be visible when portal=true and ref exists
        const isVisible = portalParam === 'true' && refParam !== null;
        
        debug('VibePortalManager: URL parameters -', { portal: portalParam, ref: refParam });
        debug(`VibePortalManager: Return portal visibility determined to be ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
        
        return isVisible;
    }
    
    /**
     * Setup event listeners for portal interactions
     */
    setupEventListeners() {
        // Listen for portal entry events
        document.addEventListener('portal-entry', this.handlePortalEntry.bind(this));
        
        debug('VibePortalManager: Event listeners initialized');
    }
    
    /**
     * Handle portal entry events
     * @param {CustomEvent} event - Portal entry event
     */
    handlePortalEntry(event) {
        const { portalType, targetUrl } = event.detail;
        
        debug(`VibePortalManager: Portal entry detected - ${portalType} portal`);
        debug(`VibePortalManager: Target URL - ${targetUrl}`);
        
        // Notify game of portal entry
        if (this.game && typeof this.game.onPortalEntry === 'function') {
            this.game.onPortalEntry(portalType, targetUrl);
        }
        
        // Broadcast event to any other subscribed components
        const gameEvent = new CustomEvent('game-portal-entry', {
            bubbles: true,
            detail: {
                portalType,
                targetUrl,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(gameEvent);
        
        // We don't navigate here - that's handled by the entity itself
    }
    
    /**
     * Add start portal to scene
     * @param {Object} options - Portal options like position, color, etc.
     */
    addStartPortal(options = {}) {
        const portalOptions = {
            type: 'start',
            color: '#ff0000', // Red for start portal
            label: 'RETURN PORTAL',
            ...options
        };
        
        // Default position for start portal
        const position = options.position || { x: 20, y: 15, z: 0 };
        
        debug('VibePortalManager: Creating start portal at', position);
        
        // Create and add the portal
        const startPortal = new VibePortalEntity(
            position.x, position.y, position.z,
            portalOptions
        );
        
        if (this.game && typeof this.game.addEntity === 'function') {
            this.game.addEntity(startPortal);
            this.portals.push(startPortal);
            debug('VibePortalManager: Start portal added to game');
        } else {
            console.error('VibePortalManager: Game instance not available, cannot add portal entity');
        }
        
        return startPortal;
    }
    
    /**
     * Add exit portal to scene
     * @param {Object} options - Portal options like position, color, etc.
     */
    addExitPortal(options = {}) {
        const portalOptions = {
            type: 'exit',
            color: '#00ff00', // Green for exit portal
            label: 'ENTER VIBEVERSE',
            ...options
        };
        
        // Default position for exit portal
        const position = options.position || { x: 14, y: 10, z: 0 };
        
        debug('VibePortalManager: Creating exit portal at', position);
        
        // Create and add the portal
        const exitPortal = new VibePortalEntity(
            position.x, position.y, position.z,
            portalOptions
        );
        
        if (this.game && typeof this.game.addEntity === 'function') {
            this.game.addEntity(exitPortal);
            this.portals.push(exitPortal);
            debug('VibePortalManager: Exit portal added to game');
        } else {
            console.error('VibePortalManager: Game instance not available, cannot add portal entity');
        }
        
        return exitPortal;
    }
    
    /**
     * Add both start and exit portals to scene
     * @param {Object} startOptions - Options for start portal
     * @param {Object} exitOptions - Options for exit portal
     */
    addPortals(startOptions = {}, exitOptions = {}) {
        // Add start portal only if URL parameters indicate it should be shown
        if (startOptions.enabled !== false && this.shouldShowReturnPortal) {
            info('VibePortalManager: Adding return portal - Player arrived via external portal');
            this.addStartPortal(startOptions);
        } else if (startOptions.enabled !== false && !this.shouldShowReturnPortal) {
            info('VibePortalManager: Return portal not shown - Normal game entry detected');
        }
        
        // Add exit portal if specified
        if (exitOptions.enabled !== false) {
            this.addExitPortal(exitOptions);
        }
        
        debug(`VibePortalManager: Added ${this.portals.length} portals to scene`);
    }
    
    /**
     * Update all portals
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Get player entity for proximity detection
        const player = this.game ? this.game.getPlayer() : null;
        
        // Update each portal
        this.portals.forEach(portal => {
            portal.update(deltaTime, player);
        });
    }
}
