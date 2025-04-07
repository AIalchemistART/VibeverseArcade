/**
 * Sign Loader for AI Alchemist's Lair
 * Dedicated module for loading and managing sign assets
 */

import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

/**
 * Load a sign asset and make it available for rendering
 * @param {string} signKey - Key to store the sign under in the asset loader
 * @param {string} signPath - Path to the sign asset
 * @returns {Promise} - Promise that resolves when the sign is loaded
 */
export function loadSignAsset(signKey = 'sign1', signPath = 'assets/decor/Sign_1.png') {
    debug(`SignLoader: Beginning dedicated sign loading for ${signKey}`);
    
    // Use multiple methods to ensure the sign loads
    return new Promise((resolve) => {
        // Method 1: Try using the Asset Loader directly
        debug(`SignLoader: Attempting to load via AssetLoader: ${signPath}`);
        
        // First check if it already exists
        if (assetLoader.assets[signKey]) {
            debug(`SignLoader: Sign ${signKey} already loaded in asset loader`);
            resolve(assetLoader.assets[signKey]);
            return;
        }
        
        // Method 2: Direct image loading with DOM
        const img = new Image();
        debug(`SignLoader: Attempting direct image loading: ${signPath}`);
        
        img.onload = () => {
            debug(`SignLoader: ✓ Successfully loaded sign via direct Image loading`);
            // Add to asset loader for future use
            assetLoader.assets[signKey] = img;
            resolve(img);
        };
        
        img.onerror = () => {
            debug(`SignLoader: ✗ Direct loading failed, trying with absolute path`);
            
            // Method 3: Try with absolute path from root
            const absolutePathImg = new Image();
            const absolutePath = `/assets/decor/Sign_1.png`;
            
            absolutePathImg.onload = () => {
                debug(`SignLoader: ✓ Successfully loaded sign with absolute path`);
                assetLoader.assets[signKey] = absolutePathImg;
                resolve(absolutePathImg);
            };
            
            absolutePathImg.onerror = () => {
                debug(`SignLoader: ✗ Absolute path loading failed, trying alternative paths`);
                
                // Method 4: Try alternative file names
                tryAlternativePaths(signKey, resolve);
            };
            
            absolutePathImg.src = absolutePath;
        };
        
        // Start the loading process
        img.src = signPath;
    });
}

/**
 * Try loading the sign from various alternative paths
 * @param {string} signKey - Key to store the sign under
 * @param {function} resolve - Resolve function for the Promise
 */
function tryAlternativePaths(signKey, resolve) {
    const paths = [
        './assets/decor/Sign_1.png',
        './assets/decor/Sign1.png',
        'assets/decor/Sign1.png',
        'assets/decor/sign1.png',
        'assets/decor/sign_1.png',
        '../assets/decor/Sign_1.png',
        '/assets/decor/Sign_1.png'
    ];
    
    // Try each path sequentially with a slight delay to avoid browser throttling
    let index = 0;
    
    function tryNextPath() {
        if (index >= paths.length) {
            debug(`SignLoader: All paths failed, creating fallback image`);
            createFallbackImage(signKey, resolve);
            return;
        }
        
        const path = paths[index++];
        debug(`SignLoader: Trying alternative path ${index}: ${path}`);
        
        const img = new Image();
        img.onload = () => {
            debug(`SignLoader: ✓ Success with alternative path: ${path}`);
            assetLoader.assets[signKey] = img;
            resolve(img);
        };
        
        img.onerror = () => {
            debug(`SignLoader: ✗ Failed with path: ${path}`);
            // Try next path after a short delay
            setTimeout(tryNextPath, 50);
        };
        
        img.src = path;
    }
    
    // Start trying paths
    tryNextPath();
}

/**
 * Create a fallback canvas-based image for the sign
 * @param {string} signKey - Key to store under
 * @param {function} resolve - Resolve function for the Promise
 */
function createFallbackImage(signKey, resolve) {
    debug(`SignLoader: Creating fallback canvas image for ${signKey}`);
    
    // Create a canvas to generate an image
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw a medieval-cyberpunk style sign
    ctx.fillStyle = '#3D2314'; // Dark wood color
    ctx.fillRect(10, 20, 108, 60);
    
    // Add cyan neon glow border for cyberpunk feel
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 20, 108, 60);
    
    // Add post
    ctx.fillStyle = '#8B4513'; // Brown wood
    ctx.fillRect(54, 80, 20, 40);
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIGN', 64, 55);
    
    // Convert the canvas to an image
    const image = new Image();
    image.src = canvas.toDataURL();
    
    debug(`SignLoader: Fallback image created successfully`);
    assetLoader.assets[signKey] = image;
    resolve(image);
}

/**
 * Preload the sign asset before it's needed
 */
export function preloadSign() {
    debug('SignLoader: Preloading sign asset');
    loadSignAsset().then(img => {
        debug(`SignLoader: Sign preload complete, size: ${img.width}x${img.height}`);
    }).catch(err => {
        debug(`SignLoader: Sign preload error: ${err}`);
    });
}
