/**
 * Physics module for AI Alchemist's Lair
 * Handles core physics calculations including gravity and other world physics.
 */

class Physics {
    constructor(gravity = 0.5) {
        this.gravity = gravity;
    }

    /**
     * Applies gravity to an entity if it is not grounded
     * @param {Object} entity - The entity to apply gravity to
     */
    applyGravity(entity) {
        if (!entity.isGrounded) {
            entity.velocityY += this.gravity;
        }
    }

    /**
     * Checks and handles collision with the ground
     * @param {Object} entity - The entity to check for ground collision
     * @param {number} groundLevel - The Y coordinate of the ground level
     * @param {boolean} considerHeight - Whether to consider entity's height in collision
     */
    checkGroundCollision(entity, groundLevel, considerHeight = true) {
        // Get the total height including both static height and dynamic jump height
        const totalHeight = considerHeight ? (entity.height + entity.zHeight + entity.z) : entity.height;
        
        // Only check for ground collision in a real isometric game context
        // For our test environment, we'll skip this to allow free movement
        // This prevents getting stuck at ground level during development
        const ENFORCE_GROUND_COLLISION = false;
        
        if (ENFORCE_GROUND_COLLISION && entity.y + totalHeight >= groundLevel) {
            // Prevent entity from falling below ground level
            entity.y = groundLevel - totalHeight;
            entity.velocityY = 0;
            entity.isGrounded = true;
        } else if (ENFORCE_GROUND_COLLISION) {
            // Entity is in the air only when we're enforcing ground collision
            entity.isGrounded = false;
        } else {
            // When not enforcing ground collision, always treat as grounded for jump mechanics
            entity.isGrounded = true;
        }
    }
}

export { Physics };
