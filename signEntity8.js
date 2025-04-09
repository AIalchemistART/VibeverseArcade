/**
 * SignEntity8.js - Ceiling sign entity for Circuit Sanctum Arcade
 * Handles loading and rendering of ceiling-mounted sign entities
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class SignEntity8 extends Entity {
    /**
     * Create a new ceiling sign entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} signKey - Key for the sign asset in the asset loader
     */
    constructor(x, y, width = 4.0, height = 4.0, signKey = 'sign8') {
        super(x, y, width, height);
        
        debug(`SignEntity8: Creating new ceiling sign at (${x}, ${y}) with key ${signKey}`);
        
        // Sign specific properties
        this.signKey = signKey;         // Key for the sign asset
        this.zHeight = 60;             // Higher z-height for ceiling mounting
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
            debug(`SignEntity8: Found existing asset for ${signKey} in asset loader`);
            this.signImage = existingAsset;
        } else {
            debug(`SignEntity8: No existing asset found for ${signKey}, will load directly`);
        }
        
        // Directly try to load the sign image
        this.directLoadSignImage();
    }
    
    /**
     * Directly load the sign image without relying on asset loader
     */
    directLoadSignImage() {
        if (this.signImage) {
            debug(`SignEntity8: Sign image already loaded, skipping direct load`);
            return;
        }
        
        debug(`SignEntity8: Directly loading sign image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`SignEntity8: Successfully loaded sign image directly (${img.width}x${img.height})`);
            this.signImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.signKey] = img;
            debug(`SignEntity8: Stored sign image in asset loader with key ${this.signKey}`);
        };
        
        img.onerror = (err) => {
            console.error(`SignEntity8: Failed to load sign image directly`, err);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                debug(`SignEntity8: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                debug(`SignEntity8: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution
        const exactPath = 'assets/decor/Sign_8.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`SignEntity8: Setting image src to resolved path: ${resolvedPath}`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        debug(`SignEntity8: Trying alternative path for sign image`);
        
        const alternativePaths = [
            'assets/decor/Sign_8.png',
            '../assets/decor/Sign_8.png',
            './assets/decor/Sign_8.png',
            '/assets/decor/Sign_8.png',
            'Sign_8.png'
        ];
        
        // Use an appropriate path from the list based on current attempt
        const pathIndex = this.loadAttempts % alternativePaths.length;
        const alternativePath = alternativePaths[pathIndex];
        debug(`SignEntity8: Trying alternative path: ${alternativePath}`);
        
        const img = new Image();
        
        img.onload = () => {
            debug(`SignEntity8: Successfully loaded sign image from alternative path: ${alternativePath}`);
            this.signImage = img;
            
            // Also store in asset loader
            assetLoader.assets[this.signKey] = img;
        };
        
        img.onerror = (err) => {
            console.error(`SignEntity8: Failed to load sign image from alternative path: ${alternativePath}`, err);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                debug(`SignEntity8: Will try another path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 300);
            } else {
                debug(`SignEntity8: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        img.src = alternativePath;
    }
    
    /**
     * Create a fallback canvas-based image for the sign
     */
    createFallbackImage() {
        debug(`SignEntity8: Creating fallback sign image`);
        
        // Create a canvas for the fallback image
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw stylized fallback sign - cyberpunk style for ceiling sign
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#440044');
        gradient.addColorStop(1, '#000044');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Neon-like border
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Inner glow
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#8800FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Circuit-like lines
        ctx.beginPath();
        ctx.moveTo(30, 40);
        ctx.lineTo(80, 40);
        ctx.lineTo(80, 70);
        ctx.lineTo(canvas.width - 30, 70);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.stroke();
        
        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 10;
        ctx.fillText('CEILING SIGN', canvas.width / 2, canvas.height / 2);
        
        // Secondary text
        ctx.fillStyle = '#00FFFF';
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('Circuit Sanctum', canvas.width / 2, canvas.height / 2 + 30);
        
        // Create an image from the canvas
        const fallbackImg = new Image();
        
        // Store the fallback image
        fallbackImg.onload = () => {
            debug(`SignEntity8: Fallback image created successfully`);
            this.signImage = fallbackImg;
            assetLoader.assets[this.signKey] = fallbackImg;
        };
        
        fallbackImg.src = canvas.toDataURL('image/png');
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
        debug(`SignEntity8: Drawing fallback ceiling sign`);
        
        // Save context for restoration later
        ctx.save();
        
        // Calculate sign dimensions
        const signWidth = width * 1.56;
        const signHeight = height * 2.6;
        
        // Position sign (higher z-offset for ceiling mounting)
        const signX = screenX - signWidth / 2;
        const signY = screenY - signHeight - zOffset - this.zHeight;
        
        // Draw sign background - darker for ceiling sign
        ctx.fillStyle = '#220033';
        ctx.fillRect(
            signX,
            signY,
            signWidth,
            signHeight
        );
        
        // Add glow effect
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#FF00FF';
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
            'OUTDOOR',
            screenX,
            signY + signHeight / 3
        );
        
        ctx.fillText(
            'ADVENTURE',
            screenX,
            signY + signHeight / 2
        );
        
        // Add decorative elements
        ctx.font = '10px serif';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(
            '🌲 ⛰️ 🌊',
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
        debug(`SignEntity8: Drawing ceiling sign at (${this.x}, ${this.y}) -> screen (${screenX}, ${screenY})`);
        
        try {
            // Get sign image - either from our direct loading or asset loader as fallback
            const signImage = this.signImage || assetLoader.getAsset(this.signKey);
            
            if (signImage) {
                debug(`SignEntity8: Image found, drawing actual ceiling sign`);
                
                // Draw sign image
                const signWidth = width * 0.88;
                const signHeight = height * 1.56;
                
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
                
                debug(`SignEntity8: Ceiling sign image drawn successfully`);
            } else {
                debug(`SignEntity8: No image available, drawing fallback`);
                
                // If no image is loaded yet, try loading again if we haven't exceeded attempts
                if (this.loadAttempts < this.maxLoadAttempts) {
                    this.directLoadSignImage();
                }
                
                // Draw fallback while loading or if loading failed
                this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
            }
        } catch (err) {
            console.error(`SignEntity8: Error drawing ceiling sign:`, err);
            this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
        }
    }
}

export { SignEntity8 };
