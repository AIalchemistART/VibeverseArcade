/**
 * Debug utilities for AI Alchemist's Lair
 * Provides performance monitoring and debug visualization features
 */

// Debug configuration
const DEBUG_CONFIG = {
    SHOW_FPS: false,         // FPS counter disabled for deployment
    FPS_TEXT_COLOR: '#00ffcc', // Neon cyan to match the medieval-cyberpunk theme
    FPS_BACKGROUND: 'rgba(0, 0, 0, 0.5)',
    FPS_FONT: '14px monospace',
    FPS_PADDING: 5,
    logSceneRendering: false, // Toggle scene rendering logs for debugging
};

// Set global debug mode flag (controls scene ID and render counter visibility)
window.DEBUG_MODE = false;

/**
 * Toggles global debug mode
 */
function toggleDebugMode() {
    window.DEBUG_MODE = !window.DEBUG_MODE;
    console.log(`Debug Mode: ${window.DEBUG_MODE ? 'Enabled' : 'Disabled'}`);
}

/**
 * Draws FPS counter on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} fps - Current frames per second
 */
function drawFpsCounter(ctx, fps) {
    if (!DEBUG_CONFIG.SHOW_FPS) return;
    
    // Save current context state
    ctx.save();
    
    // Configure text style
    ctx.font = DEBUG_CONFIG.FPS_FONT;
    ctx.fillStyle = DEBUG_CONFIG.FPS_BACKGROUND;
    
    // Measure text for background
    const text = `FPS: ${fps}`;
    const metrics = ctx.measureText(text);
    const textHeight = parseInt(DEBUG_CONFIG.FPS_FONT) + 2;
    
    // Draw background
    ctx.fillRect(
        DEBUG_CONFIG.FPS_PADDING, 
        DEBUG_CONFIG.FPS_PADDING, 
        metrics.width + DEBUG_CONFIG.FPS_PADDING * 2,
        textHeight + DEBUG_CONFIG.FPS_PADDING
    );
    
    // Draw text
    ctx.fillStyle = DEBUG_CONFIG.FPS_TEXT_COLOR;
    ctx.fillText(
        text, 
        DEBUG_CONFIG.FPS_PADDING * 2, 
        DEBUG_CONFIG.FPS_PADDING + textHeight - 2
    );
    
    // Restore context
    ctx.restore();
}

/**
 * Toggle FPS counter visibility
 */
function toggleFpsDisplay() {
    DEBUG_CONFIG.SHOW_FPS = !DEBUG_CONFIG.SHOW_FPS;
    console.log(`FPS Counter: ${DEBUG_CONFIG.SHOW_FPS ? 'Visible' : 'Hidden'}`);
}

// F key toggle for FPS counter disabled for deployment
// document.addEventListener('keydown', (event) => {
//     if (event.key === 'f' || event.key === 'F') {
//         toggleFpsDisplay();
//     }
// });

export { 
    drawFpsCounter, 
    toggleFpsDisplay,
    toggleDebugMode,
    DEBUG_CONFIG
};
