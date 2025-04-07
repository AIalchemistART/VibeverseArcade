/**
 * RugEntity3.js - Decorative third rug entity for Circuit Sanctum Arcade
 * A floor decoration that doesn't have collision and renders under other entities
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class RugEntity3 extends Entity {
    /**
     * Create a new rug entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position (should be lower than other entities)
     */
    constructor(x, y, z = -0.1) {
        // Set z to a negative value to ensure it renders below other entities
        super(x, y, z);
        
        // Set static properties (non-moving decorative element)
        this.isStatic = true;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Set appearance properties - larger than standard entities
        this.width = 18.0;  // Wide rug
        this.height = 18.0; // Deep rug
        this.zHeight = 0.05; // Very low height (it's flat)
        
        // No collision for the rug - player can walk over it
        this.collidable = false;
        
        // Set render priority to ensure it draws under other entities
        this.renderPriority = -1; // Lower number = render earlier (underneath)
        
        // Set appearance properties
        this.rugKey = 'rug3';
        this.rugImage = null;
        this.loadAttempts = 0;
        this.maxLoadAttempts = 3;
        
        // Try loading the rug image
        this.directLoadRugImage();
        
        debug('RugEntity3: Created new rug at', { x, y, z });
    }
    
    /**
     * Directly load the rug image
     * Tries to load from asset folder with fallback
     */
    directLoadRugImage() {
        this.loadAttempts++;
        
        try {
            // Try to get the image from the asset loader first
            this.rugImage = assetLoader.getAsset(this.rugKey);
            if (this.rugImage) {
                console.log('RugEntity3: Successfully retrieved image from asset loader');
            }
            
            // If not already loaded, try loading it directly
            if (!this.rugImage) {
                console.log('RugEntity3: Image not in asset loader, loading directly');
                
                // Create a new image
                const img = new Image();
                
                // Add event handlers before setting src
                img.onload = () => {
                    console.log('RugEntity3: Image loaded successfully');
                    // Important: Set this.rugImage in the onload handler
                    this.rugImage = img;
                    // Add to asset loader for future use
                    assetLoader.assets[this.rugKey] = img;
                };
                
                img.onerror = (err) => {
                    console.error('RugEntity3: Error loading image:', err);
                    // Create fallback after error
                    if (this.loadAttempts >= this.maxLoadAttempts) {
                        this.createFallbackRug();
                    }
                };
                
                const imagePath = './assets/decor/Rug_3.png';
                console.log('RugEntity3: Setting image src to:', imagePath);
                img.src = imagePath;
            }
        } catch (err) {
            console.error('RugEntity3: Failed to load rug image:', err);
            // Will use fallback rendering in draw() method
        }
    }
    
    /**
     * Create a fallback rug image
     * Used when the real image fails to load
     */
    createFallbackRug() {
        debug('RugEntity3: Creating fallback rug image');
        
        // Create a canvas for the fallback image
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple rug shape
        ctx.fillStyle = '#8B4513'; // Brown base
        ctx.fillRect(0, 0, 120, 120);
        
        // Add a decorative border
        ctx.strokeStyle = '#CD853F'; // Light brown border
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 100, 100);
        
        // Add some simple patterns
        ctx.fillStyle = '#CD853F'; // Light brown patterns
        ctx.fillRect(30, 30, 60, 60);
        
        // Add contrasting center pattern
        ctx.fillStyle = '#8B4513'; // Dark brown center
        ctx.fillRect(40, 40, 40, 40);
        
        // Generate an image from the canvas
        this.rugImage = new Image();
        this.rugImage.src = canvas.toDataURL();
        
        // Also store in asset loader for other components
        assetLoader.assets[this.rugKey] = this.rugImage;
    }
    
    /**
     * Update rug state - called each frame
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Skip physics updates for static rug
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
    }
    
    /**
     * Override collision detection to ensure the rug is never considered for collision
     * @returns {boolean} Always returns false
     */
    checkCollision() {
        // Always return false to ensure no collision is ever detected
        return false;
    }
    
    /**
     * Draw the rug entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Calculate adjusted position - flat on the ground
        const groundingFactor = 0.98; // Almost entirely on the ground
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position (very slight for rug)
        const drawY = adjustedScreenY - (this.z * 0.2);
        
        // Draw rug image if loaded
        if (this.rugImage) {
            // Save context for transformations
            ctx.save();
            
            // Scale the image to match the desired width/height
            const scaleFactor = 1.8; // Adjust scale factor for proper size
            const drawWidth = width * scaleFactor;
            const drawHeight = height * scaleFactor;
            
            // Draw rug - centered on position
            ctx.drawImage(
                this.rugImage,
                screenX - drawWidth / 2,
                drawY - drawHeight / 2,
                drawWidth,
                drawHeight
            );
            
            ctx.restore();
        } else {
            // Fallback if image not loaded: create one
            if (this.loadAttempts < this.maxLoadAttempts) {
                this.directLoadRugImage();
            } else {
                // If we've tried loading too many times, use fallback
                this.createFallbackRug();
            }
            
            // Draw a temporary rectangle
            ctx.save();
            ctx.fillStyle = '#8B4513'; // Brown color
            ctx.fillRect(
                screenX - width / 2,
                drawY - height / 2,
                width,
                height
            );
            ctx.restore();
        }
        
        // Draw debug info
        if (window.DEBUG_MODE) {
            ctx.save();
            
            // Draw outline of rug
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'; // Green for non-collidable
            ctx.lineWidth = 2;
            ctx.strokeRect(
                screenX - width / 2,
                drawY - height / 2,
                width,
                height
            );
            
            // Draw rug info
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Rug(${this.x.toFixed(1)},${this.y.toFixed(1)})`, screenX, drawY - height / 2 - 10);
            
            ctx.restore();
        }
    }
}
