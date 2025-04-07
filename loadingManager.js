/**
 * loadingManager.js
 * 
 * Manager class that handles the loading screen lifecycle and integration with the asset loading system.
 * Following our established Entity Manager pattern for clean separation of concerns.
 */

import { LoadingScreen } from './loadingScreen.js';
import assetLoader from './assetLoader.js';

class LoadingManager {
    constructor() {
        this.loadingScreen = null;
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.originalLoadAsset = null;
    }
    
    /**
     * Initialize the loading manager
     * Called before any other game initialization to ensure loading screen appears first
     */
    initialize() {
        console.log('LoadingManager: Initializing loading screen...');
        
        // Create the loading screen
        this.loadingScreen = new LoadingScreen();
        
        // Display the loading screen immediately
        this.loadingScreen.show();
        
        // Setup tracking for asset loading
        this.setupAssetTracking();
        
        return this;
    }
    
    /**
     * Setup tracking of asset loading progress
     */
    setupAssetTracking() {
        // Store reference to original asset loading method
        this.originalLoadAsset = assetLoader.loadImage;
        
        // Count expected assets
        this.countTotalAssets();
        
        // Override asset loader's loadImage method to track progress
        assetLoader.loadImage = async (key, path) => {
            try {
                // Call original method
                const result = await this.originalLoadAsset.call(assetLoader, key, path);
                
                // Track progress
                this.assetLoaded(key, path);
                
                return result;
            } catch (error) {
                console.error(`Failed to load asset ${key} from ${path}: ${error.message}`);
                // Still count as processed for progress calculation
                this.assetLoaded(key, path, true);
                throw error;
            }
        };
    }
    
    /**
     * Count the total number of assets that need to be loaded
     */
    countTotalAssets() {
        this.totalAssets = Object.keys(assetLoader.commonAssets).length;
        
        // Add additional assets we expect to load during gameplay
        // This is an estimate based on entities and their assets
        this.totalAssets += 15; // Approximate additional assets
        
        console.log(`LoadingManager: Found ${this.totalAssets} assets to track`);
    }
    
    /**
     * Track when an asset is loaded and update progress
     */
    assetLoaded(key, path, isError = false) {
        this.loadedAssets++;
        
        // Calculate progress percentage
        const progress = Math.min(100, Math.round((this.loadedAssets / this.totalAssets) * 100));
        
        // Update loading screen
        this.loadingScreen.updateProgress(progress);
        
        if (!isError) {
            console.log(`LoadingManager: Loaded asset ${key} (${this.loadedAssets}/${this.totalAssets}, ${progress}%)`);
        }
        
        // If we've loaded all expected assets or reached close to 100%, consider loading complete
        if (progress >= 95) {
            this.prepareCompletion();
        }
    }
    
    /**
     * Prepare to complete the loading process
     */
    prepareCompletion() {
        // Only run this once
        if (this._completionStarted) return;
        this._completionStarted = true;
        
        console.log('LoadingManager: Loading nearly complete, preparing transition');
        
        // Add a slight delay to ensure UI renders properly
        setTimeout(() => {
            this.completeLoading();
        }, 800);
    }
    
    /**
     * Complete the loading process and transition to the game
     */
    completeLoading() {
        console.log('LoadingManager: Loading complete, hiding loading screen');
        
        // Hide the loading screen with callback
        this.loadingScreen.hide(() => {
            // Restore original asset loading method
            assetLoader.loadImage = this.originalLoadAsset;
            
            // Dispatch event to signal loading is complete
            const event = new CustomEvent('loadingComplete');
            window.dispatchEvent(event);
            
            console.log('LoadingManager: Game ready to play');
        });
    }
}

// Create and export singleton instance
const loadingManager = new LoadingManager();
export default loadingManager;
