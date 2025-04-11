/**
 * Visitor Counter Manager for Circuit Sanctum Arcade
 * Responsible for creating and placing visitor counter entities
 */

import { VisitorCounterEntity } from './visitorCounterEntity.js';
import { debug } from './utils.js';

class VisitorCounterManager {
    /**
     * Create a new visitor counter manager
     * @param {object} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.counters = [];
    }
    
    /**
     * Add a visitor counter at specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {object} options - Additional options
     * @returns {VisitorCounterEntity} - The created visitor counter
     */
    addCounter(x, y, options = {}) {
        // Add game reference to options
        options.game = this.game;
        
        const counter = new VisitorCounterEntity(x, y, options);
        
        // Add to the game
        if (this.game) {
            this.game.addEntity(counter);
        }
        
        // Keep track of the counter
        this.counters.push(counter);
        
        debug(`VisitorCounterManager: Added visitor counter at (${x}, ${y})`);
        
        return counter;
    }
    
    /**
     * Place visitor counters in the game world for the current scene
     * @param {string} sceneName - Current scene name
     */
    addEntities(sceneName) {
        debug(`VisitorCounterManager: Adding visitor counter to scene: ${sceneName || 'default'}`);
        
        // Place visitor counter next to the arcade cabinet
        // Position it at 71.2, 30.0 which should be near the arcade cabinet
        const counterX = 96.1;
        const counterY = 11.7;
        
        const counter = this.addCounter(counterX, counterY);
        
        debug(`VisitorCounterManager: Added visitor counter to scene at (${counterX}, ${counterY})`);
    }
    
    /**
     * Update all visitor counters
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // We don't need to update counters here since they'll be updated by the game entity system
        // This method exists for potential future use if we need manager-level updates
    }
}

export { VisitorCounterManager };
