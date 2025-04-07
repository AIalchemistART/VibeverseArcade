/**
 * Game Bridge Module
 * Provides a connection between the scene system and the main game loop
 */

// Game state flags
let isTestingScenes = false;
let currentTestScene = '';
let sceneForceRerender = false;

/**
 * Set testing mode
 * @param {boolean} testing - Whether scene testing is active
 */
export function setSceneTestingMode(testing) {
    isTestingScenes = testing;
    sceneForceRerender = true;
}

/**
 * Check if scene testing is active
 * @returns {boolean} Whether scene testing is active
 */
export function isSceneTestingActive() {
    return isTestingScenes;
}

/**
 * Set current test scene
 * @param {string} sceneName - Name of the current test scene
 */
export function setCurrentTestScene(sceneName) {
    currentTestScene = sceneName;
    sceneForceRerender = true;
}

/**
 * Get current test scene
 * @returns {string} Current test scene name
 */
export function getCurrentTestScene() {
    return currentTestScene;
}

/**
 * Check if a force rerender is requested
 * @returns {boolean} Whether a force rerender is requested
 */
export function isForceRerenderRequested() {
    if (sceneForceRerender) {
        sceneForceRerender = false;
        return true;
    }
    return false;
}

/**
 * Request a force rerender
 */
export function requestForceRerender() {
    sceneForceRerender = true;
}
