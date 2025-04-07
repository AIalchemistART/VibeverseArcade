/**
 * Entity module for AI Alchemist's Lair
 * Base class for all game objects with position, dimension, and physics properties
 */

class Entity {
    constructor(x, y, width = 0.6, height = 0.6, options = {}) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0; // Added velocityZ property
        this.isGrounded = false;
        
        // Z-axis properties for height-based rendering and collision
        this.z = options.z || 0;           // Dynamic height (for jumping)
        this.zHeight = options.zHeight || 0.5;   // Static base height of the entity
        
        // Visual properties
        this.color = options.color || null;
        this.name = options.name || null;
        
        // Physics properties
        this.isStatic = options.isStatic || false;  // Static entities don't move with physics
        this.isPlayer = options.isPlayer || false;  // Added isPlayer property
        this.keepOffGrid = options.keepOffGrid || false;  // Added keepOffGrid property
        this.gravity = options.gravity || 0.1;  // Added gravity property
    }
    
    /**
     * Updates entity position based on velocity
     * @param {number} deltaTime - Time step in seconds
     */
    update(deltaTime) {
        // Skip physics update if entity is static, UNLESS it's the player
        // The isPlayer flag ensures player always gets updated even if erroneously marked as static
        if (this.isStatic && !this.isPlayer) {
            return;
        }
        
        // Check if entity was marked as off-grid during loading (e.g., off-screen decorations)
        if (this.keepOffGrid) {
            // For off-grid entities, just maintain their current state without physics
            return;
        }
        
        // Apply velocities
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.z += this.velocityZ * deltaTime;
        
        // Apply gravity if entity is in the air
        if (this.z > 0) {
            this.velocityZ -= this.gravity * deltaTime;
        } else {
            // Stop falling when entity hits the ground
            this.z = 0;
            this.velocityZ = 0;
        }
    }
    
    /**
     * Creates a colored entity with specified properties
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Entity options (color, zHeight, name, width, height)
     * @returns {Entity} - New entity instance
     */
    static createColoredEntity(x, y, options = {}) {
        const width = options.width || 0.6;
        const height = options.height || 0.6;
        const entity = new Entity(x, y, width, height, options);
        return entity;
    }
}

export { Entity };
