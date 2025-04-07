/**
 * Timing utilities for the AI Alchemist's Lair game
 * Provides frame rate limiting and timing-related functionality
 */

// Frame rate settings
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // Time per frame in ms

// Timing state
let lastFrameTime = 0;
let deltaTime = 0;

// FPS monitoring
let fpsUpdateInterval = 500; // Update FPS display every 500ms
let fpsLastUpdate = 0;
let frameCount = 0;
let currentFps = 0;

/**
 * Checks if enough time has passed to render the next frame
 * @param {number} currentTime - Current timestamp from requestAnimationFrame
 * @returns {boolean} - Whether to proceed with the frame
 */
function shouldRenderFrame(currentTime) {
    if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        return true;
    }
    
    // Calculate time since last frame
    deltaTime = currentTime - lastFrameTime;
    
    // Only render if enough time has passed (60 FPS cap)
    if (deltaTime >= FRAME_TIME) {
        lastFrameTime = currentTime;
        return true;
    }
    
    return false;
}

/**
 * Get the time elapsed since the last frame in seconds
 * @returns {number} - Delta time in seconds
 */
function getDeltaTime() {
    return deltaTime / 1000;
}

/**
 * Updates FPS counter and returns current FPS value
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 * @returns {number} - Current FPS
 */
function updateFps(timestamp) {
    // Count this frame
    frameCount++;
    
    // Check if it's time to update the FPS display
    if (timestamp - fpsLastUpdate >= fpsUpdateInterval) {
        // Calculate FPS: frames / seconds
        currentFps = Math.round((frameCount * 1000) / (timestamp - fpsLastUpdate));
        
        // Reset counters
        fpsLastUpdate = timestamp;
        frameCount = 0;
    }
    
    return currentFps;
}

export { 
    shouldRenderFrame, 
    getDeltaTime, 
    updateFps,
    TARGET_FPS 
};
