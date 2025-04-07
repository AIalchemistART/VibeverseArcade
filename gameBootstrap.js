/**
 * gameBootstrap.js
 * 
 * A non-invasive bootstrap file that integrates the loading screen with the game's main flow.
 * This follows our established pattern of keeping components separate and maintaining
 * a clean architecture without modifying core files.
 */

import loadingManager from './loadingManager.js';
import { debug } from './utils.js'; 

class GameBootstrap {
    constructor() {
        this.initialized = false;
        this.gameStarted = false;
    }
    
    /**
     * Initialize the bootstrap before any other initialization
     */
    initialize() {
        if (this.initialized) return;
        
        debug('GameBootstrap: Starting initialization sequence');
        
        // Initialize loading screen first
        loadingManager.initialize();
        
        // Hook into the main game cycle by using a non-invasive approach
        this.hookIntoGameFlow();
        
        this.initialized = true;
    }
    
    /**
     * Hook into the game's main flow without modifying core files
     */
    hookIntoGameFlow() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGameHooks());
        } else {
            this.setupGameHooks();
        }
    }
    
    /**
     * Set up hooks into the game's initialization flow
     */
    setupGameHooks() {
        // Set up a global event listener for game initialization
        window.addEventListener('gameInitialized', () => {
            debug('GameBootstrap: Received game initialized event');
            this.onGameInitialized();
        });
        
        // Add a small script to the DOM that will help us detect when main.js finishes
        const detector = document.createElement('script');
        detector.textContent = `
            // Original game initialization function reference
            const originalGameLoop = window.gameLoop;
            
            // Hook into the gameLoop to detect when game is ready
            if (typeof window.gameLoop === 'function') {
                window.gameLoop = function(timestamp) {
                    // Only trigger this once when the game first starts
                    if (!window.gameLoopStarted) {
                        window.gameLoopStarted = true;
                        console.log('Game loop started, signaling game is ready');
                        
                        // Signal that game initialization is complete
                        window.dispatchEvent(new CustomEvent('gameInitialized'));
                    }
                    
                    // Call the original game loop
                    return originalGameLoop(timestamp);
                };
            }
        `;
        document.head.appendChild(detector);
    }
    
    /**
     * Handler for when the game is initialized
     */
    onGameInitialized() {
        if (this.gameStarted) return;
        
        debug('GameBootstrap: Game initialized, preparing to hide loading screen');
        
        // Small delay to allow any final assets to load
        setTimeout(() => {
            loadingManager.completeLoading();
            this.gameStarted = true;
        }, 1000);
    }
}

// Create singleton instance
const gameBootstrap = new GameBootstrap();

// Initialize bootstrap immediately
gameBootstrap.initialize();

// Export for any modules that need it
export default gameBootstrap;
