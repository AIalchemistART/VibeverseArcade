/**
 * Sign Entity for AI Alchemist's Lair
 * Handles loading and rendering of sign entities in the game world
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class SignEntity extends Entity {
    /**
     * Create a new sign entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} signKey - Key for the sign asset in the asset loader
     */
    constructor(x, y, width = 4.2, height = 3.2, signKey = 'sign1') {
        super(x, y, width, height);
        
        console.log(`SignEntity: Creating new sign at (${x}, ${y}) with key ${signKey}`);
        
        // Sign specific properties
        this.signKey = signKey;         // Key for the sign asset
        this.zHeight = 0.5;             // Medium height for sign
        this.signImage = null;          // Will hold the loaded image
        this.loadAttempts = 0;          // Track loading attempts
        this.maxLoadAttempts = 3;       // Maximum loading attempts
        
        // Ensure sign has no velocity
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStatic = true;           // Make sign static so it doesn't move

        this.x += 1;
        this.y += 0;
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(signKey);
        if (existingAsset) {
            console.log(`SignEntity: Found existing asset for ${signKey} in asset loader`);
            this.signImage = existingAsset;
        } else {
            console.log(`SignEntity: No existing asset found for ${signKey}, will load directly`);
        }
        
        // Directly try to load the sign image
        this.directLoadSignImage();
    }
    
    /**
     * Directly load the sign image without relying on asset loader
     */
    directLoadSignImage() {
        if (this.signImage) {
            console.log(`SignEntity: Sign image already loaded, skipping direct load`);
            return;
        }
        
        console.log(`SignEntity: Directly loading sign image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        console.log(`SignEntity: Current time: ${new Date().toISOString()}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            console.log(`SignEntity: Successfully loaded sign image directly (${img.width}x${img.height})`);
            this.signImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.signKey] = img;
            console.log(`SignEntity: Stored sign image in asset loader with key ${this.signKey}`);
        };
        
        img.onerror = (err) => {
            console.log(`SignEntity: Failed to load sign image directly`, err);
            console.log(`SignEntity: Failed path was: assets/decor/Sign_1.png`);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`SignEntity: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log(`SignEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution for GitHub Pages compatibility
        const exactPath = 'assets/decor/Sign_1.png';
        const resolvedPath = getAssetPath(exactPath);
        console.log(`SignEntity: Setting image src to resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        console.log(`SignEntity: Trying alternative path (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        const paths = [
            'assets/decor/Sign1.png',
            './assets/decor/Sign_1.png',
            './assets/decor/Sign1.png'
        ];
        
        const pathIndex = (this.loadAttempts - 1) % paths.length;
        const path = paths[pathIndex];
        
        console.log(`SignEntity: Selected path ${pathIndex+1}/${paths.length}: ${path}`);
        
        const img = new Image();
        
        img.onload = () => {
            console.log(`SignEntity: Successfully loaded sign from alternative path: ${path} (${img.width}x${img.height})`);
            this.signImage = img;
            assetLoader.assets[this.signKey] = img;
        };
        
        img.onerror = (err) => {
            console.log(`SignEntity: Failed to load sign from alternative path: ${path}`, err);
            
            // Try next attempt if we haven't reached the maximum
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`SignEntity: Will try next alternative path (attempt ${this.loadAttempts + 1})`);
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log('SignEntity: All sign loading attempts failed. Using fallback.');
                // Create a fallback canvas-based image
                this.createFallbackImage();
            }
        };
        
        // Resolve path for GitHub Pages compatibility
        const resolvedPath = getAssetPath(path);
        console.log(`SignEntity: Setting alternative image src to resolved path: ${resolvedPath} (original: ${path})`);
        img.src = resolvedPath;
    }
    
    /**
     * Create a fallback canvas-based image for the sign
     */
    createFallbackImage() {
        console.log('SignEntity: Creating fallback canvas image');
        
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a medieval-cyberpunk style sign
        // Draw wooden post
        ctx.fillStyle = '#8B4513'; // Brown wood
        ctx.fillRect(54, 75, 20, 50);
        
        // Add slight wood texture to post
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(54 + i*4, 75, 2, 50);
        }
        
        // Draw main sign background (dark wood)
        ctx.fillStyle = '#3D2314';
        ctx.fillRect(24, 20, 80, 50);
        
        // Add wooden texture to sign
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(24, 20 + i*6, 80, 3);
        }
        
        // Add a metal frame around the sign
        ctx.fillStyle = '#555';
        ctx.fillRect(22, 18, 84, 4); // Top
        ctx.fillRect(22, 68, 84, 4); // Bottom
        ctx.fillRect(22, 18, 4, 54); // Left
        ctx.fillRect(102, 18, 4, 54); // Right
        
        // Add neon cyan glow border for cyberpunk feel
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 20, 80, 50);
        
        // Draw tech elements (circuit patterns)
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(30, 30);
        ctx.lineTo(45, 30);
        ctx.lineTo(45, 40);
        ctx.lineTo(60, 40);
        ctx.lineTo(60, 50);
        ctx.lineTo(75, 50);
        ctx.stroke();
        
        // Add text with glow
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGN', 64, 45);
        
        // Add subtle magic runes
        ctx.font = '10px serif';
        ctx.fillStyle = '#FFA500';
        ctx.fillText('✧ ★ ∞', 64, 60);
        
        // Convert the canvas to an image
        const image = new Image();
        image.src = canvas.toDataURL();
        
        console.log('SignEntity: Fallback image created successfully');
        
        // Store the fallback image
        image.onload = () => {
            console.log(`SignEntity: Fallback canvas image loaded with size ${image.width}x${image.height}`);
            this.signImage = image;
            assetLoader.assets[this.signKey] = image;
        };
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
        console.log(`SignEntity: Drawing fallback sign at (${screenX}, ${screenY})`);
        
        // Save context for transformations
        ctx.save();
        
        // Calculate dimensions for the sign
        const signWidth = width * 1.2;
        const signHeight = height * 1.5;
        const postWidth = width * 0.2;
        
        // Position sign so it appears at the correct isometric position
        const signX = screenX - signWidth / 2;
        const signY = screenY - signHeight + height / 2 - zOffset;
        
        // Draw sign post (brown wood color)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(
            screenX - postWidth / 2,
            screenY - height / 2 - zOffset,
            postWidth,
            height
        );
        
        // Add wood grain texture to post
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(
                screenX - postWidth / 2 + i * (postWidth/3),
                screenY - height / 2 - zOffset,
                postWidth / 6,
                height
            );
        }
        
        // Draw sign board (dark wood with medieval-cyberpunk style)
        ctx.fillStyle = '#3D2314';
        ctx.fillRect(
            signX,
            signY,
            signWidth,
            signHeight / 2
        );
        
        // Add wood grain to sign
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(
                signX,
                signY + i * (signHeight/10),
                signWidth,
                signHeight/20
            );
        }
        
        // Add metal frame
        ctx.fillStyle = '#555';
        const frameThickness = width * 0.05;
        // Top frame
        ctx.fillRect(signX - frameThickness, signY - frameThickness, signWidth + frameThickness*2, frameThickness);
        // Bottom frame
        ctx.fillRect(signX - frameThickness, signY + signHeight/2, signWidth + frameThickness*2, frameThickness);
        // Left frame
        ctx.fillRect(signX - frameThickness, signY - frameThickness, frameThickness, signHeight/2 + frameThickness*2);
        // Right frame
        ctx.fillRect(signX + signWidth, signY - frameThickness, frameThickness, signHeight/2 + frameThickness*2);
        
        // Add a cyan neon glow border for cyberpunk feel
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            signX,
            signY,
            signWidth,
            signHeight / 2
        );
        
        // Add tech circuit lines
        ctx.beginPath();
        ctx.moveTo(signX + signWidth * 0.2, signY + signHeight * 0.1);
        ctx.lineTo(signX + signWidth * 0.4, signY + signHeight * 0.1);
        ctx.lineTo(signX + signWidth * 0.4, signY + signHeight * 0.2);
        ctx.lineTo(signX + signWidth * 0.6, signY + signHeight * 0.2);
        ctx.stroke();
        
        // Add text to the sign with glow
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            'SIGN',
            screenX,
            signY + signHeight / 4
        );
        
        // Add magical runes
        ctx.font = '8px serif';
        ctx.fillStyle = '#FFA500';
        ctx.fillText(
            '✧ ★ ∞',
            screenX,
            signY + signHeight / 3
        );
        
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
        console.log(`SignEntity: Drawing sign at (${this.x}, ${this.y}) -> screen (${screenX}, ${screenY})`);
        
        try {
            // Get sign image - either from our direct loading or asset loader as fallback
            const signImage = this.signImage || assetLoader.getAsset(this.signKey);
            
            if (signImage) {
                console.log(`SignEntity: Image found (${signImage.width}x${signImage.height}), drawing actual sign`);
                
                // Draw sign image
                const signWidth = width * 1.2;
                const signHeight = height * 2;
                
                // Position sign so it appears at the correct isometric position
                const signX = screenX - signWidth / 2;
                const signY = screenY - signHeight + height / 2 - zOffset;
                
                // Log detailed positioning
                console.log(`SignEntity: Drawing at pos (${signX}, ${signY}) with size ${signWidth}x${signHeight}`);
                
                // Draw the sign
                ctx.drawImage(
                    signImage,
                    signX,
                    signY,
                    signWidth,
                    signHeight
                );
                
                console.log(`SignEntity: Sign image drawn successfully`);
            } else {
                console.log(`SignEntity: No image available, drawing fallback`);
                
                // If no image is loaded yet, try loading again if we haven't exceeded attempts
                if (this.loadAttempts < this.maxLoadAttempts) {
                    console.log(`SignEntity: Retrying image load, current attempts: ${this.loadAttempts}`);
                    this.directLoadSignImage();
                } else {
                    console.log(`SignEntity: Max load attempts (${this.maxLoadAttempts}) reached, using fallback only`);
                }
                
                // Draw fallback while loading or if loading failed
                this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
            }
        } catch (err) {
            console.error(`SignEntity: Error drawing sign:`, err);
            this.drawFallbackSign(ctx, screenX, screenY, width, height, zOffset);
        }
    }
}

export { SignEntity };
