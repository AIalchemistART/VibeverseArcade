/**
 * Camera module for AI Alchemist's Lair
 * Handles viewport management, smooth following, zooming and boundaries
 */

import { info, debug } from './utils.js';

// Set to true to enable verbose camera debug logging
const VERBOSE_CAMERA_DEBUG = false;

// Helper function to conditionally log only when verbose debugging is enabled
function conditionalDebug(...args) {
    if (VERBOSE_CAMERA_DEBUG) {
        debug(...args);
    }
}

class Camera {
    constructor(width = 800, height = 600) {
        // Camera position in world coordinates
        this.x = 0;
        this.y = 0;
        
        // Camera dimensions
        this.width = width;
        this.height = height;
        
        // Target position for smooth following
        this.targetX = 0;
        this.targetY = 0;
        
        // Zoom properties
        this.zoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 1.5;
        this.targetZoom = 1;
        
        // Smoothing factor for camera movement (0-1)
        // Lower = smoother/slower, Higher = more responsive/faster
        this.smoothing = 0.1;
        
        // Map boundaries (in world units, calculated from grid dimensions)
        this.mapWidth = 640; // Default: 10 grid cells * 64 pixels
        this.mapHeight = 320; // Default: 10 grid cells * 32 pixels
        
        // Initial debug message, still keep this one
        debug('Camera initialized', { width, height });
    }
    
    /**
     * Set map boundaries to constrain camera movement
     * @param {number} gridWidth - Map width in grid units
     * @param {number} gridHeight - Map height in grid units
     * @param {number} cellWidth - Width of a grid cell in pixels
     * @param {number} cellHeight - Height of a grid cell in pixels
     */
    setMapBoundaries(gridWidth, gridHeight, cellWidth = 64, cellHeight = 32) {
        // Calculate map dimensions in world units (pixels)
        // For isometric grid, the total width is cellWidth * gridWidth
        // and the total height is cellHeight * gridHeight
        this.mapWidth = gridWidth * cellWidth;
        this.mapHeight = gridHeight * cellHeight;
        
        conditionalDebug(`Camera boundaries set: ${this.mapWidth}x${this.mapHeight} pixels (${gridWidth}x${gridHeight} grid)`);
    }
    
    /**
     * Center camera immediately on a specific position
     * @param {number} x - X coordinate to center on
     * @param {number} y - Y coordinate to center on
     */
    centerOn(x, y) {
        // Set target to the specified position
        this.targetX = x;
        this.targetY = y;
        
        // Apply position directly without smoothing
        this.x = this.targetX;
        this.y = this.targetY;
        
        conditionalDebug(`Camera centered on: ${x}, ${y}`);
    }
    
    /**
     * Set target position for smooth following
     * @param {number} x - Target X coordinate 
     * @param {number} y - Target Y coordinate
     */
    follow(x, y) {
        this.targetX = x;
        this.targetY = y;
        conditionalDebug(`Camera following: ${x}, ${y}`);
    }
    
    /**
     * Update camera position with smooth interpolation toward target
     */
    update() {
        // Smoothly move camera toward target position using smoothing factor
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
        
        // Smoothly adjust zoom level
        this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
        
        conditionalDebug(`Camera position updated: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), zoom: ${this.zoom.toFixed(2)}`);
    }
    
    /**
     * Set camera to specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate 
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        conditionalDebug(`Camera position set: ${x}, ${y}`);
    }
    
    /**
     * Get camera smoothing factor
     * @returns {number} Current smoothing factor
     */
    getSmoothingFactor() {
        return this.smoothing;
    }
    
    /**
     * Set camera smoothing factor
     * @param {number} factor - Smoothing factor (0-1)
     */
    setSmoothingFactor(factor) {
        // Clamp factor to valid range (0-1)
        this.smoothing = Math.max(0, Math.min(1, factor));
        conditionalDebug(`Camera smoothing set to: ${this.smoothing}`);
    }
    
    /**
     * Increase camera zoom level
     * @param {number} factor - Zoom factor (default = 1.1)
     */
    zoomIn(factor = 1.1) {
        this.targetZoom = Math.min(this.maxZoom, this.targetZoom * factor);
        conditionalDebug(`Camera zoom in: target=${this.targetZoom.toFixed(2)}, current=${this.zoom.toFixed(2)}`);
    }
    
    /**
     * Decrease camera zoom level
     * @param {number} factor - Zoom factor (default = 1.1)
     */
    zoomOut(factor = 1.1) {
        this.targetZoom = Math.max(this.minZoom, this.targetZoom / factor);
        conditionalDebug(`Camera zoom out: target=${this.targetZoom.toFixed(2)}, current=${this.zoom.toFixed(2)}`);
    }
    
    /**
     * Set zoom level directly
     * @param {number} level - New zoom level
     */
    setZoom(level) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        conditionalDebug(`Camera zoom set: ${this.targetZoom.toFixed(2)}`);
    }
    
    /**
     * Reset camera to center position and default zoom
     */
    reset() {
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1;
        conditionalDebug('Camera reset to default position and zoom');
    }
    
    /**
     * Pan the camera by the specified delta
     * @param {number} dx - X delta in pixels (screen space)
     * @param {number} dy - Y delta in pixels (screen space)
     */
    pan(dx, dy) {
        // Convert screen space delta to world space delta based on zoom level
        // Apply a multiplier to increase panning strength
        const panStrength = 5.0; // Significantly increase panning effect for more freedom
        const worldDx = (dx * panStrength) / this.zoom;
        const worldDy = (dy * panStrength) / this.zoom;
        
        // Update target position directly for panning
        this.targetX -= worldDx;
        this.targetY -= worldDy;
        
        conditionalDebug(`Camera panned: ${worldDx.toFixed(2)}, ${worldDy.toFixed(2)} (strength: ${panStrength})`);
    }
}

export { Camera };
