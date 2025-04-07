/**
 * SignEntity2.js - Second ceiling sign entity for Circuit Sanctum Arcade
 * Handles loading and rendering of ceiling-mounted sign entities
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class SignEntity2 extends Entity {
    /**
     * Create a new ceiling sign entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} signKey - Key for the sign asset in the asset loader
     */
    constructor(x, y, width = 4.0, height = 4.0, signKey = 'sign2') {
        super(x, y, width, height);
        
        debug(`SignEntity2: Creating new ceiling sign at (${x}, ${y}) with key ${signKey}`);
        
        // Sign specific properties
        this.signKey = signKey;         // Key for the sign asset
        this.zHeight = 60;              // Higher z-height for ceiling mounting
        this.signImage = null;          // Will hold the loaded image
        this.loadAttempts = 0;          // Track loading attempts
        this.maxLoadAttempts = 3;       // Maximum loading attempts
        
        // Ensure sign has no velocity
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStatic = true;           // Make sign static so it doesn't move
        this.collidable = false;        // Disable collision for ceiling sign so player can walk beneath it
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(signKey);
        if (existingAsset) {
            debug(`SignEntity2: Found existing asset for ${signKey} in asset loader`);
            this.signImage = existingAsset;
        } else {
            debug(`SignEntity2: No existing asset found for ${signKey}, will load directly`);
        }
        
        // Directly try to load the sign image
        this.directLoadSignImage();
    }
    
    /**
     * Directly load the sign image without relying on asset loader
     */
    directLoadSignImage() {
        if (this.signImage) {
            debug(`SignEntity2: Sign image already loaded, skipping direct load`);
            return;
        }
        
        debug(`SignEntity2: Directly loading sign image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`SignEntity2: Successfully loaded sign image directly (${img.width}x${img.height})`);
            this.signImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.signKey] = img;
            debug(`SignEntity2: Stored sign image in asset loader with key ${this.signKey}`);
        };
        
        img.onerror = (err) => {
            console.error(`SignEntity2: Failed to load sign image directly`, err);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                debug(`SignEntity2: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                debug(`SignEntity2: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution
        const exactPath = 'assets/decor/Sign_2.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`SignEntity2: Setting image src to resolved path: ${resolvedPath}`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        debug(`SignEntity2: Trying alternative path for sign image`);
        
        const alternativePaths = [
            'assets/Sign_2.png',
            'assets/decor/Sign_2.png',
            'assets/images/Sign_2.png',
            'assets/images/decor/Sign_2.png',
            '/assets/decor/Sign_2.png',
            './assets/decor/Sign_2.png',
            '../assets/decor/Sign_2.png'
        ];
        
        const img = new Image();
        
        img.onload = () => {
            debug(`SignEntity2: Successfully loaded sign image from alternative path (${img.width}x${img.height})`);
            this.signImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.signKey] = img;
        };
        
        img.onerror = (err) => {
            debug(`SignEntity2: Failed to load from alternative path`);
            this.loadAttempts++;
            
            if (this.loadAttempts >= this.maxLoadAttempts) {
                debug(`SignEntity2: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                // Create a fallback canvas-based image
                this.createFallbackImage();
            } else {
                // Try next path
                const nextIndex = this.loadAttempts % alternativePaths.length;
                const nextPath = getAssetPath(alternativePaths[nextIndex]);
                debug(`SignEntity2: Trying next alternative path: ${nextPath}`);
                setTimeout(() => {
                    img.src = nextPath;
                }, 200);
            }
        };
        
        // Start with first alternative
        img.src = getAssetPath(alternativePaths[0]);
    }
    
    /**
     * Create a fallback canvas-based image for the sign
     */
    createFallbackImage() {
        debug(`SignEntity2: Creating fallback canvas image for sign`);
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions
        canvas.width = 128;
        canvas.height = 128;
        
        // Fill with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(1, '#222222');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        // Add border
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 120, 120);
        
        // Add text to the sign
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ARCADE', 64, 48);
        ctx.fillText('GAMES', 64, 76);
        
        // Add decorative elements
        ctx.beginPath();
        ctx.arc(64, 96, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FF00FF';
        ctx.fill();
        
        // Convert canvas to image
        const img = new Image();
        
        img.onload = () => {
            // Store the fallback image
            this.signImage = img;
            debug(`SignEntity2: Fallback image created and stored`);
            
            // Also store in asset loader
            assetLoader.assets[this.signKey] = img;
        };
        
        img.src = canvas.toDataURL('image/png');
    }
    
    /**
     * Draw a fallback sign when the image fails to load
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    drawFallbackSign(ctx, screenX, screenY, width, height, zOffset) {
        // Save context for restoration
        ctx.save();
        
        debug(`SignEntity2: Drawing fallback ceiling sign at (${screenX}, ${screenY})`);
        
        // Size of sign in screen coordinates
        const signWidth = width * 1.5;  // Make it wider
        const signHeight = height * 1.2; // And slightly taller
        
        // Position sign higher for ceiling mounting
        const signX = screenX - signWidth / 2;
        const signY = screenY - signHeight - zOffset - this.zHeight;
        
        // Color definitions for cyberpunk aesthetic
        const borderColor = '#FF00FF'; // Magenta
        const fillColor = '#333333';   // Dark gray
        const textColor = '#00FFFF';   // Cyan
        
        // Draw sign background
        ctx.fillStyle = fillColor;
        ctx.fillRect(
            signX,
            signY,
            signWidth,
            signHeight
        );
        
        // Draw neon-like border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            signX,
            signY,
            signWidth,
            signHeight
        );
        
        // Add tech circuit lines
        ctx.beginPath();
        ctx.moveTo(signX + signWidth * 0.2, signY + signHeight * 0.1);
        ctx.lineTo(signX + signWidth * 0.4, signY + signHeight * 0.1);
        ctx.lineTo(signX + signWidth * 0.4, signY + signHeight * 0.2);
        ctx.lineTo(signX + signWidth * 0.6, signY + signHeight * 0.2);
        ctx.strokeStyle = '#00FFFF';
        ctx.stroke();
        
        // Add text to the sign with glow
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            'ARCADE',
            screenX,
            signY + signHeight / 3
        );
        
        ctx.fillText(
            'GAMES',
            screenX,
            signY + signHeight / 2
        );
        
        // Add decorative elements
        ctx.font = '10px serif';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(
            '⚡ ✧ ⚡',
            screenX,
            signY + signHeight * 0.7
        );
        
        // No mounting chain/rope for cleaner visual appearance
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Custom draw method for sign entity
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width 
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        debug(`SignEntity2: Drawing ceiling sign at (${this.x}, ${this.y}) -> screen (${screenX}, ${screenY})`);
        
        try {
            // Get sign image - either from our direct loading or asset loader as fallback
            const signImage = this.signImage || assetLoader.getAsset(this.signKey);
            
            if (signImage) {
                debug(`SignEntity2: Image found, drawing actual ceiling sign`);
                
                // Draw sign image
                const signWidth = width * 1.2;
                const signHeight = height * 1.6;
                
                // Position sign higher for ceiling mounting
                const signX = screenX - signWidth / 2;
                const signY = screenY - signHeight - zOffset - this.zHeight;
                
                // Draw the sign
                ctx.drawImage(
                    signImage,
                    signX,
                    signY,
                    signWidth,
                    signHeight
                );
                
                // No mounting chain/rope visible for cleaner look
                
                debug(`SignEntity2: Ceiling sign image drawn successfully`);
            } else {
                debug(`SignEntity2: No image available, drawing fallback`);
                
                // If no image is loaded yet, try loading again if we haven't exceeded attempts
                if (this.loadAttempts < this.maxLoadAttempts) {
                    this.directLoadSignImage();
                }
                
                // Draw fallback while loading or if loading failed
                this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
            }
        } catch (err) {
            console.error(`SignEntity2: Error drawing ceiling sign:`, err);
            this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
        }
    }
}

export { SignEntity2 };
