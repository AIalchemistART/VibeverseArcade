/**
 * Browser Compatibility Check for AI Alchemist's Lair
 * Verifies browser support for required features and APIs
 */

import { warn, error } from './utils.js';

// Collection of required browser features
const REQUIRED_FEATURES = {
    CANVAS: {
        name: 'Canvas API',
        supported: false,
        critical: true,
        test: () => !!window.HTMLCanvasElement
    },
    CANVAS_2D: {
        name: 'Canvas 2D Context',
        supported: false,
        critical: true,
        test: () => {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext && !!canvas.getContext('2d');
        }
    },
    REQUEST_ANIMATION_FRAME: {
        name: 'requestAnimationFrame',
        supported: false,
        critical: true,
        test: () => !!window.requestAnimationFrame
    },
    MODULE_SUPPORT: {
        name: 'ES6 Modules',
        supported: false,
        critical: true,
        // If this code is executing, module support exists
        test: () => true
    },
    LOCAL_STORAGE: {
        name: 'Local Storage',
        supported: false,
        critical: false,
        test: () => {
            try {
                return !!window.localStorage;
            } catch (e) {
                return false;
            }
        }
    },
    AUDIO: {
        name: 'Web Audio API',
        supported: false,
        critical: false,
        test: () => !!window.AudioContext || !!window.webkitAudioContext
    }
};

/**
 * Check if the browser supports a specific feature
 * @param {string} featureKey - Key of the feature to check
 * @returns {boolean} - Whether the feature is supported
 */
function checkFeatureSupport(featureKey) {
    const feature = REQUIRED_FEATURES[featureKey];
    if (!feature) {
        warn(`Unknown feature check requested: ${featureKey}`);
        return false;
    }
    
    try {
        feature.supported = feature.test();
        return feature.supported;
    } catch (e) {
        feature.supported = false;
        error(`Error checking support for ${feature.name}`, e);
        return false;
    }
}

/**
 * Run all compatibility checks
 * @returns {object} - Results of compatibility checks
 */
function checkBrowserCompatibility() {
    const results = {
        allCriticalSupported: true,
        unsupportedFeatures: []
    };
    
    // Check each feature
    for (const key in REQUIRED_FEATURES) {
        const feature = REQUIRED_FEATURES[key];
        const isSupported = checkFeatureSupport(key);
        
        if (!isSupported) {
            results.unsupportedFeatures.push(feature.name);
            
            if (feature.critical) {
                results.allCriticalSupported = false;
                error(`Critical feature not supported: ${feature.name}`);
            } else {
                warn(`Optional feature not supported: ${feature.name}`);
            }
        }
    }
    
    return results;
}

/**
 * Create a user-friendly compatibility error message
 * @param {Array} unsupportedFeatures - List of unsupported features
 * @returns {string} - HTML for the error message
 */
function createCompatibilityErrorMessage(unsupportedFeatures) {
    return `
        <div style="color: #ff3366; background: rgba(0, 0, 0, 0.8); padding: 20px; margin: 20px auto; max-width: 800px; border-radius: 5px; font-family: monospace; border: 2px solid #ff3366;">
            <h2>🔍 Browser Compatibility Issue</h2>
            <p>Your browser doesn't support the following required features:</p>
            <ul>
                ${unsupportedFeatures.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <p>Please try using a modern browser like Chrome, Firefox, Edge, or Safari.</p>
        </div>
    `;
}

export {
    checkBrowserCompatibility,
    createCompatibilityErrorMessage,
    REQUIRED_FEATURES
};
