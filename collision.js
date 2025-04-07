/**
 * Collision detection module for AI Alchemist's Lair
 * Handles entity collision detection with height awareness for isometric gameplay
 * 
 * This module implements a 3D collision system that considers:
 * 1. X/Y position in the isometric world (horizontal plane)
 * 2. Z-axis height and elevation for vertical collision checking
 * 3. Variable object heights allowing objects to pass over/under each other
 */

class Collision {
    /**
     * Checks for collision between two entities using axis-aligned bounding boxes (AABB)
     * with height (z-axis) consideration
     * 
     * The collision system uses a two-phase approach:
     * 1. First checks horizontal (X/Y) collision with expanded hitboxes (buffer)
     * 2. Then validates vertical (Z) collision for proper 3D interaction
     * 
     * @param {Object} entity1 - First entity to check
     * @param {Object} entity2 - Second entity to check
     * @returns {boolean} - True if collision detected, false otherwise
     */
    static checkCollision(entity1, entity2) {
        // Safety checks for undefined entities
        if (!entity1 || !entity2) return false;
        
        // Skip self-collision
        if (entity1 === entity2) return false;
        
        // Check if either entity has collidable set to false
        if (entity1.collidable === false || entity2.collidable === false) {
            return false; // Non-collidable entities never collide
        }
        
        // Define collision buffer (20% larger hitbox)
        // This creates a stronger collision boundary and prevents entities from
        // getting too close to each other before collision is detected
        const buffer = 1.2;
        
        // Default sizes if width/height not specified
        // Uses standard grid cell size (0.6) as fallback
        const width1 = entity1.width || 0.6;
        const height1 = entity1.height || 0.6;
        const width2 = entity2.width || 0.6;
        const height2 = entity2.height || 0.6;
        
        // PHASE 1: HORIZONTAL COLLISION DETECTION
        // Standard AABB (Axis-Aligned Bounding Box) collision check
        // Uses expanded hitbox dimensions (with buffer) for more generous detection
        const horizontalCollision = (
            entity1.x < entity2.x + width2 * buffer &&
            entity1.x + width1 * buffer > entity2.x &&
            entity1.y < entity2.y + height2 * buffer &&
            entity1.y + height1 * buffer > entity2.y
        );
        
        // Only proceed with height check if horizontal collision detected
        // This optimization prevents unnecessary Z-axis calculations
        if (horizontalCollision) {
            // PHASE 2: VERTICAL (HEIGHT) COLLISION DETECTION
            
            // Calculate the total height of each entity by combining:
            // - z: Current elevation/position on z-axis (dynamic, changes during jumps)
            // - zHeight: The static height of the entity (doesn't change)
            const entity1Height = (entity1.z || 0) + (entity1.zHeight || 0);
            const entity2Height = (entity2.z || 0) + (entity2.zHeight || 0);
            
            // Log collision debugging information
            console.log("[COLLISION] Horizontal collision detected!", 
                {e1: {pos: [entity1.x, entity1.y], height: entity1Height},
                 e2: {pos: [entity2.x, entity2.y], height: entity2Height}});
                
            // Height-based collision check (z-axis)
            // For a true 3D collision, entities must overlap in the vertical axis
            // This allows entities to jump over obstacles or pass under tall objects
            const verticalCollision = (
                entity1.z < entity2.z + entity2.zHeight &&
                entity1.z + entity1.zHeight > entity2.z
            );
            
            // If no vertical overlap, entities can pass through each other
            // Example: Player jumping over a short wall, or ducking under an obstacle
            if (!verticalCollision) {
                console.log("[COLLISION] No height overlap - entities can pass each other");
                return false;
            }
            
            // Both horizontal AND vertical collision conditions are met
            console.log("[COLLISION] FULL COLLISION DETECTED - Heights overlap");
            
            // Full 3D collision detected
            return true;
        }
        
        return false;
    }

    /**
     * Provides detailed collision information including collision direction
     * and depth for proper collision response
     * 
     * This method calculates:
     * 1. The precise overlap amount between entities
     * 2. The direction of collision (which entity is where relative to the other)
     * 3. The minimal movement needed to resolve the collision
     * 
     * @param {Object} entity1 - First entity to check
     * @param {Object} entity2 - Second entity to check
     * @returns {Object|null} - Collision information or null if no collision
     */
    static getCollisionInfo(entity1, entity2) {
        // Only proceed if actual collision exists
        if (!this.checkCollision(entity1, entity2)) {
            return null;
        }
        
        // Use expanded hitboxes for collision resolution
        // The 15% expansion ensures entities don't get too close and provides
        // a better safety margin for calculating resolution vectors
        const width1 = (entity1.width || 0.6) * 1.15;
        const height1 = (entity1.height || 0.6) * 1.15;
        const width2 = (entity2.width || 0.6) * 1.15;
        const height2 = (entity2.height || 0.6) * 1.15;
        
        // Calculate center points of each entity
        // These are used to determine direction and distance between entities
        const entity1CenterX = entity1.x + ((entity1.width || 0.6) / 2);
        const entity1CenterY = entity1.y + ((entity1.height || 0.6) / 2);
        const entity2CenterX = entity2.x + ((entity2.width || 0.6) / 2);
        const entity2CenterY = entity2.y + ((entity2.height || 0.6) / 2);
        
        // Calculate vector from entity2 to entity1
        // This vector points in the direction entity1 needs to move to avoid entity2
        const dx = entity1CenterX - entity2CenterX;
        const dy = entity1CenterY - entity2CenterY;
        
        // Calculate half-widths and half-heights for overlap calculation
        // Using the combined dimensions of both entities divided by 2
        const halfWidths = (width1 + width2) / 2;
        const halfHeights = (height1 + height2) / 2;
        
        // Calculate overlap on each axis
        // This is the actual penetration depth between the two entities
        const overlapX = halfWidths - Math.abs(dx);
        const overlapY = halfHeights - Math.abs(dy);
        
        // Determine collision resolution vector by finding smallest overlap
        // We always want to resolve along the axis with minimal penetration
        // This creates more natural-looking collision responses
        let resolveX = 0;
        let resolveY = 0;
        
        // Choose resolution axis based on minimal penetration
        // This prevents entities from "popping" through walls
        if (overlapX < overlapY) {
            // Resolve on X axis (horizontal collision)
            // Direction based on relative positions (dx positive = move right)
            resolveX = (dx > 0 ? 1 : -1) * overlapX;
        } else {
            // Resolve on Y axis (vertical collision)
            // Direction based on relative positions (dy positive = move down)
            resolveY = (dy > 0 ? 1 : -1) * overlapY;
        }
        
        // Log detailed collision information for debugging
        console.log("[COLLISION INFO] Detailed collision data:", {
            centers: {dx, dy},
            overlaps: {x: overlapX, y: overlapY},
            resolution: {x: resolveX, y: resolveY}
        });
        
        // Return comprehensive collision data
        // This information is used by the collision resolver to properly
        // move entities apart and apply appropriate physics responses
        return {
            entity1,          // Reference to first entity
            entity2,          // Reference to second entity
            overlapX,         // X-axis penetration depth
            overlapY,         // Y-axis penetration depth
            resolveX,         // X-component of resolution vector
            resolveY,         // Y-component of resolution vector
            dx,               // X-distance between centers
            dy                // Y-distance between centers
        };
    }

    /**
     * Resolves collision between two entities with improved stability
     * 
     * This method handles the actual collision response by:
     * 1. Calculating how to separate the entities
     * 2. Applying velocity changes (stopping or bouncing)
     * 3. Using a separation buffer to prevent sticking/tunneling
     * 4. Handling different behaviors for static vs. dynamic entities
     * 
     * @param {Object} entity1 - First entity in collision (typically the player)
     * @param {Object} entity2 - Second entity in collision (typically an obstacle)
     * @returns {boolean} - True if collision was resolved, false otherwise
     */
    static resolveCollision(entity1, entity2) {
        // Get detailed collision information
        const collisionInfo = this.getCollisionInfo(entity1, entity2);
        
        // If no collision or no valid entities, return false
        if (!collisionInfo || !entity1 || !entity2) {
            return false;
        }
        
        // Log collision resolution data
        console.log(`[COLLISION RESOLVE] Starting collision resolution between entities`);
        
        // Check if entity2 is static (doesn't move)
        // Static entities like walls should not be moved during collision
        const isStatic = entity2.isStatic === true;
        
        // Use a strong separation force with buffer
        // The 25% extra separation (1.25) prevents entities from sticking together
        // and helps avoid the "tunneling" problem in fast-moving collisions
        const separationBuffer = 1.25; // 25% extra separation to prevent sticking
        
        // HORIZONTAL COLLISION RESOLUTION
        if (Math.abs(collisionInfo.resolveX) > 0) {
            // X-axis collision resolution
            if (isStatic) {
                // For static objects (walls, obstacles):
                // 1. Stop entity1's horizontal velocity completely
                // 2. Push entity1 out with buffer for solid feel
                entity1.velocityX = 0;
                entity1.x += collisionInfo.resolveX * separationBuffer;
                console.log(`[COLLISION] X-axis push: ${(collisionInfo.resolveX * separationBuffer).toFixed(4)}`);
            } else {
                // For dynamic objects (other moving entities):
                // 1. Distribute the movement between both entities (70/30 split)
                // 2. Apply physics response (bounce) to both
                const entity1Ratio = 0.7; // Entity1 takes most of the adjustment
                entity1.x += collisionInfo.resolveX * entity1Ratio * separationBuffer;
                entity2.x -= collisionInfo.resolveX * (1 - entity1Ratio) * separationBuffer;
                
                // Apply physics responses to velocities
                entity1.velocityX = 0;
                if (entity2.velocityX) entity2.velocityX *= -0.5; // Bounce back with reduced velocity
            }
        }
        
        // VERTICAL COLLISION RESOLUTION
        if (Math.abs(collisionInfo.resolveY) > 0) {
            // Y-axis collision resolution
            if (isStatic) {
                // For static objects (walls, obstacles):
                // 1. Stop entity1's vertical velocity completely
                // 2. Push entity1 out with buffer for solid feel
                entity1.velocityY = 0;
                entity1.y += collisionInfo.resolveY * separationBuffer;
                console.log(`[COLLISION] Y-axis push: ${(collisionInfo.resolveY * separationBuffer).toFixed(4)}`);
            } else {
                // For dynamic objects (other moving entities):
                // 1. Distribute the movement between both entities (70/30 split)
                // 2. Apply physics response (bounce) to both
                const entity1Ratio = 0.7; // Entity1 takes most of the adjustment
                entity1.y += collisionInfo.resolveY * entity1Ratio * separationBuffer;
                entity2.y -= collisionInfo.resolveY * (1 - entity1Ratio) * separationBuffer;
                
                // Apply physics responses to velocities
                entity1.velocityY = 0;
                if (entity2.velocityY) entity2.velocityY *= -0.5; // Bounce back with reduced velocity
            }
        }
        
        // Log successful collision resolution
        console.log("[COLLISION RESOLVE] Collision resolved successfully");
        
        return true;
    }
}

export { Collision };
