/**
 * Player Class for AI Alchemist's Lair
 * Based on the entity class, adds player-specific functionality
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

class Player extends Entity {
    constructor(x, y, width = 0.7, height = 0.75) {
        // When calling super, explicitly set isPlayer=true and isStatic=false
        super(x, y, width, height, { 
            isPlayer: true,    // Critical flag to identify this as the player
            isStatic: false,   // Ensure player is never static
            zHeight: 0.5,      // Standard height
            collidable: true   // Enable collisions
        });
        
        // Player specific properties
        this.speed = 3;             // Increased by 30% from 3.0 for faster portal navigation
        this.jumpStrength = 1.6;      // Jump strength (reduced from 2.0 for gameplay balance)
        this.jumpProgress = 0;        // Track jump animation progress
        this.isJumping = false;       // Track if player is currently jumping
        this.canJump = true;          // Prevent double jumps
        
        // Track last movement direction for sprite rendering
        this.lastDirection = 'south'; // Default facing south
        this.isMoving = false;        // Track if player is currently moving
    }

    /**
     * Moves the player in a specific direction
     * @param {string} direction - Direction to move ('up', 'down', 'left', 'right', 'none', or diagonal combinations)
     * @param {number} deltaTime - Time step in seconds
     */
    move(direction, deltaTime) {
        // Reset velocity if no movement or 'none' is passed
        if (!direction || direction === 'none') {
            this.velocityX = 0;
            this.velocityY = 0;
            return;
        }
        
        // Calculate the normalized time step (prevent extreme speeds on lag)
        const normalizedDelta = deltaTime > 0 ? deltaTime : 1/60;
        
        // Reset velocities
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Handle cardinal directions
        if (direction === 'left' || direction === 'west') {
            this.velocityX = -this.speed;
        } 
        else if (direction === 'right' || direction === 'east') {
            this.velocityX = this.speed;
        }
        
        if (direction === 'up' || direction === 'north') {
            this.velocityY = -this.speed;
        } 
        else if (direction === 'down' || direction === 'south') {
            this.velocityY = this.speed;
        }
        
        // Handle diagonal directions
        if (direction === 'northwest' || direction === 'northleft') {
            this.velocityX = -this.speed;
            this.velocityY = -this.speed;
        } 
        else if (direction === 'northeast' || direction === 'northright') {
            this.velocityX = this.speed;
            this.velocityY = -this.speed;
        } 
        else if (direction === 'southwest' || direction === 'southleft') {
            this.velocityX = -this.speed;
            this.velocityY = this.speed;
        } 
        else if (direction === 'southeast' || direction === 'southright') {
            this.velocityX = this.speed;
            this.velocityY = this.speed;
        }
        
        // Normalize diagonal speed to prevent moving faster diagonally
        if (this.velocityX !== 0 && this.velocityY !== 0) {
            const normalizeFactor = 1 / Math.sqrt(2);
            this.velocityX *= normalizeFactor;
            this.velocityY *= normalizeFactor;
        }
        
        // Update position based on velocity
        this.x += this.velocityX * normalizedDelta;
        this.y += this.velocityY * normalizedDelta;
        
        // Update the direction immediately if we're moving
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.updateDirection();
        }
    }
    
    /**
     * Updates the player's direction based on current velocity
     */
    updateDirection() {
        // Only update direction if the player is actually moving
        if (this.velocityX === 0 && this.velocityY === 0) {
            console.log(`Not updating direction - velocities are zero [${this.velocityX}, ${this.velocityY}]`);
            return; // Keep current direction if not moving
        }
        
        // Save previous direction for comparison
        const prevDirection = this.lastDirection;
        
        // Debug current velocities
        console.log(`Updating direction: vX=${this.velocityX.toFixed(2)}, vY=${this.velocityY.toFixed(2)}`);
        
        // Determine basic direction based on velocity
        if (this.velocityX > 0 && this.velocityY < 0) {
            this.lastDirection = 'northeast';
            console.log('Direction check: velocityX > 0 && velocityY < 0 => northeast');
        } else if (this.velocityX > 0 && this.velocityY > 0) {
            this.lastDirection = 'southeast';
            console.log('Direction check: velocityX > 0 && velocityY > 0 => southeast');
        } else if (this.velocityX < 0 && this.velocityY > 0) {
            this.lastDirection = 'southwest';
            console.log('Direction check: velocityX < 0 && velocityY > 0 => southwest');
        } else if (this.velocityX < 0 && this.velocityY < 0) {
            this.lastDirection = 'northwest';
            console.log('Direction check: velocityX < 0 && velocityY < 0 => northwest');
        } else if (this.velocityX > 0) {
            this.lastDirection = 'east';
            console.log('Direction check: velocityX > 0 => east');
        } else if (this.velocityX < 0) {
            this.lastDirection = 'west';
            console.log('Direction check: velocityX < 0 => west');
        } else if (this.velocityY < 0) {
            this.lastDirection = 'north';
            console.log('Direction check: velocityY < 0 => north');
        } else if (this.velocityY > 0) {
            this.lastDirection = 'south';
            console.log('Direction check: velocityY > 0 => south');
        }
        
        console.log(`Direction changed: ${prevDirection} -> ${this.lastDirection} [vX=${this.velocityX.toFixed(2)}, vY=${this.velocityY.toFixed(2)}]`);
    }

    /**
     * Stops player movement
     */
    stop() {
        this.velocityX = 0;
        this.velocityY = 0;
        this.isMoving = false;
    }

    /**
     * Initiates a jump if the player is grounded
     */
    jump() {
        if (this.isGrounded && this.canJump) {
            this.isJumping = true;
            this.isGrounded = false;
            this.canJump = false;
            this.jumpProgress = 0;
            debug('Player jumped');
        }
    }

    /**
     * Handles the jump animation
     * @param {number} deltaTime - Time step in seconds
     */
    updateJump(deltaTime) {
        // Update jump progress
        this.jumpProgress += 0.05;
        
        // Parabolic jump curve: z = jumpStrength * (t - t²)
        // This creates a smooth up and down motion
        this.z = this.jumpStrength * (this.jumpProgress - (this.jumpProgress * this.jumpProgress));
        
        // End jump when animation completes
        if (this.jumpProgress >= 1) {
            this.isJumping = false;
            this.z = 0;
            
            // Allow jumping again when grounded
            if (this.isGrounded) {
                this.canJump = true;
            }
        }
    }

    /**
     * Updates player state based on input and physics
     * @param {number} deltaTime - Time step in seconds
     */
    update(deltaTime) {
        // Apply velocity to position
        super.update(deltaTime);
        
        // Update jump animation if currently jumping
        if (this.isJumping) {
            this.updateJump(deltaTime);
        }
        
        // Check if player is moving and update direction accordingly
        if (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1) {
            this.isMoving = true;
            this.updateDirection();
        } else {
            this.isMoving = false;
            // We've stopped - set velocities to exactly zero to avoid floating point issues
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }
    
    /**
     * Gets the current facing direction of the player
     * @returns {string} Direction ('north', 'northeast', 'east', etc.)
     */
    getDirection() {
        // Return the player's facing direction
        return this.lastDirection;
    }
    
    /**
     * Gets the appropriate sprite name based on current direction
     * @returns {string} Sprite name (e.g., 'wizardN', 'wizardS', etc.)
     */
    getSpriteName() {
        // Map direction to sprite key
        const directionMap = {
            'north': 'wizardN',
            'northeast': 'wizardNE',
            'east': 'wizardE',
            'southeast': 'wizardSE',
            'south': 'wizardS',
            'southwest': 'wizardSW',
            'west': 'wizardW',
            'northwest': 'wizardNW'
        };
        
        return directionMap[this.lastDirection] || 'wizardS'; // Default to south
    }
    
    /**
     * Check if the player is currently moving
     * @returns {boolean} True if the player is moving
     */
    isPlayerMoving() {
        return this.isMoving;
    }
    
    /**
     * Draw the player sprite directly on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context 
     * @param {number} screenX - Isometric X position
     * @param {number} screenY - Isometric Y position 
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Height offset for jumping
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        try {
            // Get the sprite for the current direction
            const spriteName = this.getSpriteName();
            const sprite = assetLoader.getAsset(spriteName);
            
            // Check if all direction sprites are loaded
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const loadedSprites = directions.map(dir => {
                const key = `wizard${dir}`;
                return { dir, key, loaded: !!assetLoader.getAsset(key) };
            });
            
            // Log detailed sprite info
            console.log(`Player direction: ${this.lastDirection}`);
            console.log(`Using sprite: ${spriteName}, loaded: ${!!sprite}`);
            console.log('Available sprites:', loadedSprites.filter(s => s.loaded).map(s => s.key).join(', '));
            console.log('Missing sprites:', loadedSprites.filter(s => !s.loaded).map(s => s.key).join(', '));
            
            if (sprite) {
                // Draw shadow under player
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(
                    screenX, 
                    screenY, 
                    width / 2, 
                    width / 4, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                
                // Calculate sprite dimensions (making character 2x taller)
                const spriteWidth = width * 1.5;
                const spriteHeight = height * 3.5; // Doubled from 2.2 to 4.4
                
                // Position sprite so feet are at entity position
                // Adjust Y position to account for increased height
                const spriteX = screenX - spriteWidth / 2;
                const spriteY = screenY - spriteHeight + height / 1.5 - zOffset;
                
                // Draw sprite
                ctx.drawImage(
                    sprite,
                    spriteX,
                    spriteY,
                    spriteWidth,
                    spriteHeight
                );
            } else {
                // Fallback: draw colored rectangle if sprite not available
                ctx.fillStyle = '#00BFFF'; // Light blue placeholder
                ctx.fillRect(
                    screenX - width / 2,
                    screenY - height - zOffset, 
                    width, 
                    height
                );
                
                console.warn('Player sprite not available, using fallback rendering');
            }
        } catch (err) {
            console.error('Error drawing player sprite:', err);
            
            // Emergency fallback
            ctx.fillStyle = 'red';
            ctx.fillRect(
                screenX - width / 2,
                screenY - height - zOffset, 
                width, 
                height
            );
        }
    }
}

export { Player };
