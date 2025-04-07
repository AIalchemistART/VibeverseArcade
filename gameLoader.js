/**
 * gameLoader.js
 * 
 * Initializes and manages the loading process for the AI Alchemist's Lair.
 * This file connects the loading screen to the game's initialization process
 * without modifying the core files directly.
 */

import { LoadingScreen } from './loadingScreen.js';
import assetLoader from './assetLoader.js';

class GameLoader {
    constructor() {
        this.loadingScreen = new LoadingScreen();
        this.isInitialized = false;
        this.originalStartGame = null;
        this.assetManifest = null;
    }

    /**
     * Initialize the game loading process
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Show loading screen immediately
        this.loadingScreen.show();
        
        // Listen for DOMContentLoaded to ensure we can access the DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLoading());
        } else {
            // DOM already loaded, set up immediately
            this.setupLoading();
        }
        
        this.isInitialized = true;
        debug('GameLoader: Initialized');
    }
    
    /**
     * Set up asset loading tracking
     */
    setupLoading() {
        // Create a record of all assets that need to be loaded
        this.collectAssetManifest();
        
        // Track the original loadImage method to preserve its functionality
        const originalLoadImage = assetLoader.loadImage;
        
        // Override the asset loader's loadImage method to track progress
        assetLoader.loadImage = async (key, path) => {
            try {
                // Call the original method
                const result = await originalLoadImage.call(assetLoader, key, path);
                
                // Track progress after each asset is loaded
                this.updateLoadingProgress();
                
                return result;
            } catch (error) {
                console.error(`Error loading asset ${key} from ${path}:`, error);
                // Still count this as "processed" for progress calculation
                this.updateLoadingProgress();
                throw error;
            }
        };
        
        // Initial loading screen update
        this.loadingScreen.updateProgress(0);
        
        // Listen for the custom 'gameReady' event that will be dispatched from main.js
        window.addEventListener('gameReady', () => {
            // Hide loading screen with transition
            this.loadingScreen.hide(() => {
                debug('GameLoader: Game is ready, loading screen hidden');
            });
            
            // Restore original method
            assetLoader.loadImage = originalLoadImage;
        });
    }
    
    /**
     * Collect all assets that need to be loaded
     */
    collectAssetManifest() {
        // Start with common assets
        this.assetManifest = { ...assetLoader.commonAssets };
        
        // Count total assets for progress tracking
        const totalAssets = Object.keys(this.assetManifest).length;
        debug(`GameLoader: Found ${totalAssets} assets to load`);
    }
    
    /**
     * Update the loading progress based on loaded assets
     */
    updateLoadingProgress() {
        // Calculate current progress
        const totalAssets = Object.keys(this.assetManifest).length;
        const loadedAssets = Object.keys(assetLoader.assets).length;
        const progress = Math.min(100, Math.round((loadedAssets / totalAssets) * 100));
        
        // Update loading screen
        this.loadingScreen.updateProgress(progress);
        
        debug(`GameLoader: Loaded ${loadedAssets}/${totalAssets} assets (${progress}%)`);
    }
}

// Create and export a singleton instance
const gameLoader = new GameLoader();
export default gameLoader;
