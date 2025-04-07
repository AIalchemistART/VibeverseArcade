/**
 * Pan State module for AI Alchemist's Lair
 * Manages camera panning state and events for middle-mouse dragging
 */

import { debug } from './utils.js';

// Pan state object to track middle-click dragging
const panState = {
    active: false,       // Is panning currently active?
    startX: 0,           // Starting X position of drag
    startY: 0,           // Starting Y position of drag
    deltaX: 0,           // X movement since last update
    deltaY: 0,           // Y movement since last update
    totalDeltaX: 0,      // Total X movement since drag started
    totalDeltaY: 0,      // Total Y movement since drag started
    
    // Reset all panning deltas
    resetDeltas() {
        this.deltaX = 0;
        this.deltaY = 0;
    },
    
    // Start panning from a specific position
    start(x, y) {
        this.active = true;
        this.startX = x;
        this.startY = y;
        this.totalDeltaX = 0;
        this.totalDeltaY = 0;
        debug(`Pan started at ${x}, ${y}`);
    },
    
    // Update panning with new mouse position
    update(x, y) {
        if (!this.active) return;
        
        // Calculate delta from last update
        this.deltaX = x - this.startX;
        this.deltaY = y - this.startY;
        
        // Update accumulated total delta
        this.totalDeltaX += this.deltaX;
        this.totalDeltaY += this.deltaY;
        
        // Update start position for next delta calculation
        this.startX = x;
        this.startY = y;
    },
    
    // Stop panning
    stop() {
        this.active = false;
        this.resetDeltas();
        debug(`Pan ended, total movement: ${this.totalDeltaX}, ${this.totalDeltaY}`);
    }
};

/**
 * Initialize pan event handlers for a canvas element
 * @param {HTMLCanvasElement} canvas - The canvas element to attach events to
 */
function initPanEvents(canvas) {
    if (!canvas) {
        debug('Warning: Cannot initialize pan events - canvas not found');
        return;
    }
    
    // Middle-click detect and start panning
    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 1) { // Middle click
            event.preventDefault(); // Prevent default behavior (often page scroll)
            panState.start(event.offsetX, event.offsetY);
        }
    });

    // Track mouse movement while panning
    canvas.addEventListener('mousemove', (event) => {
        if (panState.active) {
            panState.update(event.offsetX, event.offsetY);
        }
    });

    // Stop panning on mouse up (any button)
    canvas.addEventListener('mouseup', (event) => {
        if (event.button === 1 && panState.active) {
            panState.stop();
        }
    });
    
    // Stop panning if mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
        if (panState.active) {
            panState.stop();
        }
    });
    
    debug('Pan events initialized for canvas');
}

export { panState, initPanEvents };
