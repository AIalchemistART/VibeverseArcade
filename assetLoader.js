/**
 * Asset Loader Module
 * Handles preloading and caching of assets for scenes
 */

import { getAssetPath } from './pathResolver.js';

// Force debugging to see what's happening with asset paths
console.log('Asset loader initializing...');

// Check if we're on the custom domain
const isCustomDomain = typeof window !== 'undefined' && window.location.hostname.includes('aialchemist.net');
console.log(`Running on custom domain: ${isCustomDomain}`);

// Force a base path for the custom domain
const REPO_PREFIX = '/AIalchemistsLAIR/';

class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;
        
        // Add callback for asset loading events
        this.onAssetLoaded = null;
        
        // Common assets used across all scenes
        this.commonAssets = {
            // Use consistent naming scheme
            floorTile: 'assets/decor/Floor_Tile_1.png',
            wallTileNE: 'assets/decor/Wall_Tile_NE.png',
            wallTileNW: 'assets/decor/Wall_Tile_NW.png',
            // Door assets
            doorTileNE: 'assets/decor/Door_Tile_NE.png',
            doorTileNW: 'assets/decor/Door_Tile_NW.png',
            // Open door assets
            doorTileNEOpen: 'assets/decor/Door_Tile_NE_Open.png',
            doorTileNWOpen: 'assets/decor/Door_Tile_NW_Open.png',
            // Sign assets
            sign1: 'assets/decor/Sign_1.png',
            
            // Character sprites - 8 directional wizard sprites
            wizardN: 'assets/Wizard/Wizard_N.png',
            wizardNE: 'assets/Wizard/Wizard_NE.png',
            wizardE: 'assets/Wizard/Wizard_E.png',
            wizardSE: 'assets/Wizard/Wizard_SE.png',
            wizardS: 'assets/Wizard/Wizard_S.png',
            wizardSW: 'assets/Wizard/Wizard_SW.png',
            wizardW: 'assets/Wizard/Wizard_W.png',
            wizardNW: 'assets/Wizard/Wizard_NW.png'
        };
        
        // Wait a moment for loading screen to initialize before loading assets
        setTimeout(() => {
            this.loadCommonAssets();
        }, 50);
    }
    
    /**
     * Load common assets used across all scenes
     */
    loadCommonAssets() {
        this.totalAssets = Object.keys(this.commonAssets).length;
        console.log(`AssetLoader: Loading ${this.totalAssets} common assets`);
        
        // Load all assets with proper error handling
        for (const [key, path] of Object.entries(this.commonAssets)) {
            this.loadImage(key, path)
                .catch(err => console.warn(`Asset loading issue for ${key}: ${err}`));
        }
    }

    /**
     * Preloads assets for a specific scene
     * @param {string} sceneId - The ID of the scene to load assets for
     */
    loadAssetsForScene(sceneId) {
        console.log(`Loading assets for scene: ${sceneId}`);
        // Ensure common assets are loaded first if they haven't been
        if (this.loadedAssets < Object.keys(this.commonAssets).length) {
            this.loadCommonAssets();
        }
        // Will be expanded for scene-specific assets
    }
    
    /**
     * Gets an asset by key
     * @param {string} key - Key to look up asset
     * @returns {HTMLImageElement|null} - The asset or null if not found
     */
    getAsset(key) {
        if (this.assets[key]) {
            return this.assets[key];
        } else {
            // Try to load the asset if it's in commonAssets but not loaded yet
            if (this.commonAssets[key]) {
                console.log(`Asset ${key} not loaded yet, attempting to load from ${this.commonAssets[key]}`);
                this.loadImage(key, this.commonAssets[key])
                    .then(img => {
                        console.log(`✓ Successfully loaded asset on demand: ${key}`);
                        return img;
                    })
                    .catch(err => {
                        console.error(`Failed to load asset on demand: ${key}`, err);
                        return null;
                    });
            } else {
                console.warn(`Asset not found and no path available for: ${key}`);
            }
            return null;
        }
    }
    
    /**
     * Check if a specific asset is loaded
     * @param {string} key - Key for the asset
     * @returns {boolean} - True if asset is loaded
     */
    isAssetLoaded(key) {
        return !!this.assets[key];
    }
    
    /**
     * Load an image asset
     * @param {string} key - Key for referencing the asset
     * @param {string} path - Path to the asset file
     * @returns {Promise} - Promise that resolves when the asset is loaded
     */
    loadImage(key, path) {
        // Ensure key and path are in the correct order
        // Some older code might have parameters reversed
        if (typeof key === 'string' && key.includes('/') && typeof path === 'string' && !path.includes('/')) {
            // Swap parameters if they appear to be in wrong order
            console.log(`AssetLoader: Detected reversed parameters, swapping key and path`);
            [key, path] = [path, key];
        }
        
        return new Promise((resolve, reject) => {
            // If asset is already loaded, just return it
            if (this.assets[key]) {
                console.log(`Asset ${key} already loaded, reusing`);
                // Still trigger the asset loaded callback for tracking
                if (this.onAssetLoaded) {
                    this.onAssetLoaded(this.assets[key], key);
                }
                resolve(this.assets[key]);
                return;
            }

            const img = new Image();
            console.log(`Loading image: ${key} from path: ${path}`);
            
            img.onload = () => {
                this.assets[key] = img;
                this.loadedAssets++;
                console.log(`✓ Successfully loaded asset: ${key}`);
                
                // Trigger asset loaded callback
                if (this.onAssetLoaded) {
                    this.onAssetLoaded(img, key);
                }
                
                resolve(img);
                
                // Update loading progress for the loadingController if it exists
                if (window.loadingController) {
                    // Indicate specific asset loaded (optional extension)
                    window.loadingController.assetLoaded();
                }
            };
            
            img.onerror = (err) => {
                console.error(`✗ Failed to load asset: ${key} from path: ${path}`, err);
                
                // Try multiple alternative paths as fallbacks
                // This provides a more robust approach to asset loading
                const filename = path.split('/').pop();
                
                // Generate several alternative paths to try
                const alternativePaths = [
                    // Original path with different casing
                    path.replace('/assets/', '/Assets/'),
                    path.replace('/Assets/', '/assets/'),
                    
                    // Try decor folder
                    `./assets/decor/${filename}`,
                    `./Assets/decor/${filename}`,
                    `./assets/Decor/${filename}`,
                    
                    // Force repo prefix path on the custom domain
                    `/AIalchemistsLAIR/${path.startsWith('/') ? path.substring(1) : path}`,
                    
                    // Last resort - try at root
                    `/${filename}`
                ];
                
                // Filter out the original path to avoid duplicates
                const uniquePaths = alternativePaths.filter(p => p !== path);
                console.log(`Will try ${uniquePaths.length} alternative paths for ${key}`);
                
                // Try to load from each alternative path sequentially
                const tryNextPath = (index) => {
                    if (index >= uniquePaths.length) {
                        console.error(`✗ All loading attempts failed for: ${key}`);
                        // Still count as loaded for progress tracking
                        if (window.loadingController) {
                            window.loadingController.assetLoaded();
                        }
                        reject(`Failed to load image: ${path}`);
                        return;
                    }
                    
                    const altPath = uniquePaths[index];
                    console.log(`Trying alternative path ${index+1}/${uniquePaths.length}: ${altPath}`);
                    
                    const altImg = new Image();
                    
                    altImg.onload = () => {
                        console.log(`✓ Successfully loaded asset from alternative path: ${altPath}`);
                        this.assets[key] = altImg;
                        this.loadedAssets++;
                        
                        // Trigger asset loaded callback
                        if (this.onAssetLoaded) {
                            this.onAssetLoaded(altImg, key);
                        }
                        
                        resolve(altImg);
                        
                        // Update loading progress
                        if (window.loadingController) {
                            window.loadingController.assetLoaded();
                        }
                    };
                    
                    altImg.onerror = () => {
                        // Try the next path
                        tryNextPath(index + 1);
                    };
                    
                    // Use path resolver to handle GitHub Pages deployment
                    const resolvedAltPath = getAssetPath(altPath);
                    console.log(`AssetLoader: Trying path: ${resolvedAltPath}`);
                    altImg.src = resolvedAltPath;
                };
                
                // Start trying alternative paths
                tryNextPath(0);
            };
            
            // Use path resolver to handle GitHub Pages deployment
            const resolvedPath = getAssetPath(path);
            console.log(`AssetLoader: Loading from resolved path: ${resolvedPath}`);
            img.src = resolvedPath;
        });
    }
    
    /**
     * Load a sound asset
     * @param {string} path - Path to the sound file
     * @param {Function} callback - Callback function when loading completes
     */
    loadSound(path, callback) {
        // Check if audio is supported
        if (typeof Audio === 'undefined') {
            console.warn('Audio not supported in this browser');
            if (callback) callback(null);
            return;
        }
        
        // Create an audio element
        const sound = new Audio();
        
        // Set up event handlers
        sound.addEventListener('canplaythrough', () => {
            console.log(`✓ Successfully loaded sound: ${path}`);
            
            // Store the sound in the assets with its path as key
            const key = path.split('/').pop().replace('.mp3', '').replace('.wav', '');
            this.assets[key] = sound;
            
            // Trigger callback with the sound
            if (callback) callback(sound);
            
            // Update loading progress for the loadingController if it exists
            if (window.loadingController) {
                window.loadingController.assetLoaded();
            }
        }, { once: true });
        
        sound.addEventListener('error', (err) => {
            console.error(`✗ Failed to load sound: ${path}`, err);
            
            // Still count as loaded for progress tracking
            if (window.loadingController) {
                window.loadingController.assetLoaded();
            }
            
            // Call the callback with null to indicate failure
            if (callback) callback(null);
        }, { once: true });
        
        // Load the sound file with path resolution for GitHub Pages
        const resolvedPath = getAssetPath(path);
        console.log(`AssetLoader: Loading sound from resolved path: ${resolvedPath}`);
        sound.src = resolvedPath;
        sound.load();
    }
}

// Create a singleton instance
const assetLoader = new AssetLoader();
export default assetLoader;
