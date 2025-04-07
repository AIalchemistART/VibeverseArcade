/**
 * Character Renderer Module for AI Alchemist's Lair
 * Handles directional sprite rendering for the player character
 */

import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

class CharacterRenderer {
    constructor() {
        // Track when assets are ready
        this.assetsReady = false;
        
        // Define the 8 directional sprite names
        this.directionSprites = {
            'north': 'wizardN',
            'northeast': 'wizardNE',
            'east': 'wizardE',
            'southeast': 'wizardSE',
            'south': 'wizardS',
            'southwest': 'wizardSW',
            'west': 'wizardW',
            'northwest': 'wizardNW'
        };
        
        // Map for translating grid direction vectors to named directions
        this.directionMap = {
            '0,-1': 'north',    // Up
            '1,-1': 'northeast', // Up-right
            '1,0': 'east',      // Right
            '1,1': 'southeast',  // Down-right
            '0,1': 'south',     // Down
            '-1,1': 'southwest', // Down-left
            '-1,0': 'west',     // Left
            '-1,-1': 'northwest' // Up-left
        };
        
        // Last movement direction (for stationary rendering)
        this.lastDirection = 'south'; // Default facing south
        
        // Check if all assets are loaded
        this.checkAssetsInterval = setInterval(() => this.checkAssets(), 500);
        
        // Force checking assets immediately on initialization
        setTimeout(() => this.checkAssets(), 100);
        
        console.log('CharacterRenderer initialized');
    }
    
    /**
     * Check if required assets are loaded
     * @returns {boolean} - True if all required assets are loaded
     */
    checkAssets() {
        // Check if all direction sprites are loaded
        const allDirections = Object.values(this.directionSprites);
        
        // Log all sprite names we're trying to load
        console.log('Checking for wizard sprites:', allDirections);
        
        // Check each asset individually and log its status
        let allLoaded = true;
        allDirections.forEach(name => {
            const asset = assetLoader.getAsset(name);
            console.log(`Sprite ${name}: ${asset ? '✅ LOADED' : '❌ NOT LOADED'}`);
            if (!asset) {
                allLoaded = false;
            }
        });
        
        // Update assets ready state
        this.assetsReady = allLoaded;
        
        // Log when assets are ready
        if (this.assetsReady) {
            console.log('All wizard character sprites loaded successfully!');
            clearInterval(this.checkAssetsInterval);
        } else {
            // Log missing assets for debugging
            const missing = allDirections.filter(name => !assetLoader.getAsset(name));
            if (missing.length > 0) {
                console.log(`Missing wizard sprites: ${missing.join(', ')}`);
            }
        }
        
        // TEMPORARY FIX: Force assetsReady to true even if some sprites are not loaded
        // This will let us test with whatever sprites are available
        if (allLoaded || true) {
            console.log('FORCING assetsReady to TRUE for debug purposes');
            this.assetsReady = true;
        }
        
        return this.assetsReady;
    }
    
    /**
     * Get the direction name based on movement vector
     * @param {number} dx - X direction component
     * @param {number} dy - Y direction component
     * @returns {string} - Direction name
     */
    getDirectionFromVector(dx, dy) {
        // Normalize the direction
        const normalizedDx = Math.sign(dx);
        const normalizedDy = Math.sign(dy);
        
        // Log movement for debugging
        console.log(`Player movement: dx=${dx}, dy=${dy} → normalized: ${normalizedDx},${normalizedDy}`);
        
        // Create lookup key
        const directionKey = `${normalizedDx},${normalizedDy}`;
        
        // Get direction name or use last direction if no movement
        if (normalizedDx === 0 && normalizedDy === 0) {
            console.log(`No movement, using last direction: ${this.lastDirection}`);
            return this.lastDirection;
        }
        
        const direction = this.directionMap[directionKey] || 'south';
        console.log(`Determined direction: ${direction} from key ${directionKey}`);
        
        // Store this as the last direction for when player is stationary
        this.lastDirection = direction;
        
        return direction;
    }
    
    /**
     * Render the character sprite
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position in screen coordinates
     * @param {number} y - Y position in screen coordinates
     * @param {number} width - Width of the sprite
     * @param {number} height - Height of the sprite
     * @param {number} dx - X movement direction (-1, 0, 1)
     * @param {number} dy - Y movement direction (-1, 0, 1)
     * @param {number} z - Z position for vertical offset (jumping)
     * @param {string} [explicitDirection] - Optional explicit direction to use
     */
    renderCharacter(ctx, x, y, width, height, dx, dy, z = 0, explicitDirection = null) {
        // Get the direction based on movement or use explicit direction if provided
        const direction = explicitDirection || this.getDirectionFromVector(dx, dy);
        
        console.log(`Rendering character with direction: ${direction} (explicit: ${!!explicitDirection})`);
        
        // Get the sprite asset name for this direction
        const spriteName = this.directionSprites[direction];
        
        // Apply vertical offset for jumping
        const jumpOffset = z * -height/2; // Negative because up is negative y
        
        // Get the sprite from the asset loader
        const sprite = assetLoader.getAsset(spriteName);
        
        console.log(`Rendering character at (${x}, ${y}) direction: ${direction}, sprite: ${spriteName}, found: ${!!sprite}, this.assetsReady: ${this.assetsReady}`);
        
        // DRAW SPRITE DIRECTLY - Force drawing the sprite if it exists regardless of assetsReady
        if (sprite) {
            console.log(`✅ Drawing sprite ${spriteName} directly`);
            // Draw the character sprite
            ctx.drawImage(
                sprite,
                x - width/2,
                y - height/2 + jumpOffset,
                width,
                height
            );
            
            // Add a subtle shadow beneath the character
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(
                x, 
                y + height/4, // Shadow at character's feet
                width/2.5,   // Shadow x radius
                height/5,    // Shadow y radius
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
            
            // Draw debug info for the sprite
            ctx.save();
            ctx.fillStyle = 'yellow';
            ctx.font = '12px Arial';
            ctx.fillText(`${direction}`, x, y - height/2 - 10);
            ctx.restore();
            
            return; // Exit early since we drew the sprite successfully
        }
        
        // If we reached here, we couldn't find the sprite - use fallback
        console.log(`❌ Fallback rendering: sprite not found`);
        this.renderFallbackCharacter(ctx, x, y, width, height, direction, z);
    }
    
    /**
     * Render a fallback character when sprites aren't loaded
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} direction - Direction the character is facing
     * @param {number} z - Z position (jumping)
     */
    renderFallbackCharacter(ctx, x, y, width, height, direction, z = 0) {
        // Apply vertical offset for jumping
        const jumpOffset = z * -height/2; // Negative because up is negative y
        
        // Color indicators for different directions
        const directionColors = {
            'north': '#00ffff',
            'northeast': '#ffff00',
            'east': '#ff00ff',
            'southeast': '#ff0000',
            'south': '#00ff00',
            'southwest': '#0000ff',
            'west': '#ff8800',
            'northwest': '#88ff00'
        };
        
        // Get color for the current direction
        const color = directionColors[direction] || '#00ffff';
        
        // Draw a simple colored rectangle with a direction indicator
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            x, 
            y + height/4, // Shadow at character's feet
            width/2.5,   // Shadow x radius
            height/5,    // Shadow y radius
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw character body
        ctx.fillStyle = color;
        ctx.fillRect(
            x - width/2,
            y - height/2 + jumpOffset,
            width,
            height
        );
        
        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        
        // Create an arrow pointing in the direction
        switch(direction) {
            case 'north':
                ctx.moveTo(x, y - height/3 + jumpOffset);
                ctx.lineTo(x + width/4, y + jumpOffset);
                ctx.lineTo(x - width/4, y + jumpOffset);
                break;
            case 'northeast':
                ctx.moveTo(x + width/3, y - height/3 + jumpOffset);
                ctx.lineTo(x, y + jumpOffset);
                ctx.lineTo(x + width/4, y - height/4 + jumpOffset);
                break;
            case 'east':
                ctx.moveTo(x + width/3, y + jumpOffset);
                ctx.lineTo(x, y - height/4 + jumpOffset);
                ctx.lineTo(x, y + height/4 + jumpOffset);
                break;
            case 'southeast':
                ctx.moveTo(x + width/3, y + height/3 + jumpOffset);
                ctx.lineTo(x, y + jumpOffset);
                ctx.lineTo(x + width/4, y + height/4 + jumpOffset);
                break;
            case 'south':
                ctx.moveTo(x, y + height/3 + jumpOffset);
                ctx.lineTo(x + width/4, y + jumpOffset);
                ctx.lineTo(x - width/4, y + jumpOffset);
                break;
            case 'southwest':
                ctx.moveTo(x - width/3, y + height/3 + jumpOffset);
                ctx.lineTo(x, y + jumpOffset);
                ctx.lineTo(x - width/4, y + height/4 + jumpOffset);
                break;
            case 'west':
                ctx.moveTo(x - width/3, y + jumpOffset);
                ctx.lineTo(x, y - height/4 + jumpOffset);
                ctx.lineTo(x, y + height/4 + jumpOffset);
                break;
            case 'northwest':
                ctx.moveTo(x - width/3, y - height/3 + jumpOffset);
                ctx.lineTo(x, y + jumpOffset);
                ctx.lineTo(x - width/4, y - height/4 + jumpOffset);
                break;
        }
        
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Create a singleton instance
const characterRenderer = new CharacterRenderer();

export { characterRenderer };
