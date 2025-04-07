/**
 * Asset Management System for AI Alchemist's Lair
 * Handles loading, caching, and accessing game assets including images, sounds, and data
 */

// Store for loaded assets
const assetCache = {
    images: {},
    sounds: {},
    data: {}
};

// Loading status tracking
const loadingStatus = {
    total: 0,
    loaded: 0,
    failed: 0
};

/**
 * Load an image asset
 * @param {string} key - Unique identifier for the asset
 * @param {string} src - Source URL for the image
 * @returns {Promise} - Promise that resolves when the image is loaded
 */
function loadImage(key, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            assetCache.images[key] = img;
            loadingStatus.loaded++;
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            loadingStatus.failed++;
            reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
        loadingStatus.total++;
    });
}

/**
 * Load a sound asset
 * @param {string} key - Unique identifier for the asset
 * @param {string} src - Source URL for the sound
 * @returns {Promise} - Promise that resolves when the sound is loaded
 */
function loadSound(key, src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
            assetCache.sounds[key] = audio;
            loadingStatus.loaded++;
            resolve(audio);
        };
        audio.onerror = () => {
            console.error(`Failed to load sound: ${src}`);
            loadingStatus.failed++;
            reject(new Error(`Failed to load sound: ${src}`));
        };
        audio.src = src;
        loadingStatus.total++;
    });
}

/**
 * Load a JSON data asset
 * @param {string} key - Unique identifier for the asset
 * @param {string} src - Source URL for the JSON file
 * @returns {Promise} - Promise that resolves when the data is loaded
 */
function loadData(key, src) {
    return new Promise((resolve, reject) => {
        fetch(src)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                assetCache.data[key] = data;
                loadingStatus.loaded++;
                resolve(data);
            })
            .catch(error => {
                console.error(`Failed to load data: ${src}`, error);
                loadingStatus.failed++;
                reject(error);
            });
        loadingStatus.total++;
    });
}

/**
 * Load multiple assets in parallel
 * @param {Array} assetManifest - Array of asset descriptions to load
 * @returns {Promise} - Promise that resolves when all assets are loaded
 */
function loadAssets(assetManifest) {
    const promises = assetManifest.map(asset => {
        switch (asset.type) {
            case 'image':
                return loadImage(asset.key, asset.src);
            case 'sound':
                return loadSound(asset.key, asset.src);
            case 'data':
                return loadData(asset.key, asset.src);
            default:
                console.warn(`Unknown asset type: ${asset.type}`);
                return Promise.resolve();
        }
    });
    
    return Promise.all(promises);
}

/**
 * Get a loaded image asset
 * @param {string} key - Key of the image to retrieve
 * @returns {Image|null} - The image object or null if not found
 */
function getImage(key) {
    return assetCache.images[key] || null;
}

/**
 * Get a loaded sound asset
 * @param {string} key - Key of the sound to retrieve
 * @returns {Audio|null} - The audio object or null if not found
 */
function getSound(key) {
    return assetCache.sounds[key] || null;
}

/**
 * Get a loaded data asset
 * @param {string} key - Key of the data to retrieve
 * @returns {Object|null} - The data object or null if not found
 */
function getData(key) {
    return assetCache.data[key] || null;
}

/**
 * Get the current loading status
 * @returns {Object} - Current loading status
 */
function getLoadingStatus() {
    return {
        ...loadingStatus,
        progress: loadingStatus.total > 0 
            ? Math.floor((loadingStatus.loaded / loadingStatus.total) * 100) 
            : 100
    };
}

// Example asset manifest for Phase 2
const PHASE2_ASSETS = [
    // { type: 'image', key: 'player', src: 'assets/images/player.png' },
    // { type: 'image', key: 'tileset', src: 'assets/images/tileset.png' },
    // { type: 'sound', key: 'bgm', src: 'assets/sounds/background.mp3' },
    // { type: 'data', key: 'levels', src: 'assets/data/levels.json' },
];

export {
    loadImage,
    loadSound,
    loadData,
    loadAssets,
    getImage,
    getSound,
    getData,
    getLoadingStatus,
    PHASE2_ASSETS
};
