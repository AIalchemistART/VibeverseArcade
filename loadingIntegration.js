/**
 * loadingIntegration.js
 * 
 * Integrates the loading screen with the main game initialization.
 * This file acts as a bridge between our loading system and the game's main entry point,
 * following our pattern of keeping components separate and focused.
 */

import loadingManager from './loadingManager.js';
import assetLoader from './assetLoader.js';

/**
 * Initialize the loading screen before the game starts
 */
export function initLoadingScreen() {
    // Show the loading screen immediately
    loadingManager.initialize();
    
    // Monitor the DOM ready state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('LoadingIntegration: DOM loaded, tracking startup progress');
        });
    }
    
    return loadingManager;
}

/**
 * Signal that the game is ready to play
 * Call this when the game has completed critical initialization
 */
export function signalGameReady() {
    // Short delay to ensure all rendering completes
    setTimeout(() => {
        // Dispatch a custom event that the game is ready to play
        const event = new CustomEvent('gameReady');
        window.dispatchEvent(event);
        console.log('LoadingIntegration: Game ready signal sent');
    }, 500);
}

// Listen for asset loading events to update progress
const originalLoadCallback = assetLoader.onAssetLoaded;
assetLoader.onAssetLoaded = (asset, key) => {
    // Still call original callback if it exists
    if (originalLoadCallback) {
        originalLoadCallback(asset, key);
    }
};

// Handle the loadingComplete event
window.addEventListener('loadingComplete', () => {
    console.log('LoadingIntegration: Loading complete event received');
    // Additional initialization that should happen after loading screen disappears
});
