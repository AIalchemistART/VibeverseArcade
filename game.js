/**
 * Game module for AI Alchemist's Lair
 * Handles core game mechanics including physics, collision, and entity management
 */

import { Physics } from './physics.js';
import { Collision } from './collision.js';
import { Player } from './player.js';
import { debug, info, error } from './utils.js';
import { input } from './input.js';
import { SpatialGrid } from './spatialGrid.js';
import { DebugRenderer } from './debugRenderer.js';

class Game {
    constructor() {
        // Core game systems
        this.physics = new Physics();
        this.entities = [];
        this.player = null;
        this.groundLevel = 400; // Default ground level
        
        // Initialize spatial grid for collision optimization
        this.spatialGrid = new SpatialGrid(1); // 1 unit cell size (was 100, which was far too large)
        
        // Initialize debug renderer
        this.debugRenderer = new DebugRenderer();
        
        // Portal transition state
        this._portalTransitionActive = false;
        
        // Interaction state for menus and dialogs
        this._interactionActive = false;
        
        debug('Game instance created');
    }

    /**
     * Initializes player entity
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @returns {Player} - The initialized player object
     */
    initPlayer(x, y) {
        this.player = new Player(x, y);
        debug('Player initialized at', { x, y });
        return this.player;
    }

    /**
     * Toggles a debug visualization feature
     * @param {string} feature - Feature to toggle ('collision', 'grid', 'info', 'fps')
     */
    toggleDebugFeature(feature) {
        this.debugRenderer.toggleFeature(feature);
    }

    /**
     * Gets the player entity
     * @returns {Player} - The player entity
     */
    getPlayer() {
        return this.player;
    }
    
    /**
     * Handle portal entry event
     * @param {string} portalType - Type of portal ('start' or 'exit')
     * @param {string} targetUrl - URL to navigate to
     */
    onPortalEntry(portalType, targetUrl) {
        debug(`Game: Player entered ${portalType} portal targeting: ${targetUrl}`);
        
        // Pause game physics/input during transition
        this._portalTransitionActive = true;
        
        // Show visual feedback
        if (this.player) {
            // Optionally freeze player movement
            this.player._previousVelocityX = this.player.velocityX;
            this.player._previousVelocityY = this.player.velocityY;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            
            // Play portal effect if available
            if (typeof this.player.playEffect === 'function') {
                this.player.playEffect('portal-enter');
            }
        }
        
        // Resume game after transition (if navigation fails)
        setTimeout(() => {
            this._portalTransitionActive = false;
            if (this.player) {
                // Restore player state if we're still here
                if (this.player._previousVelocityX !== undefined) {
                    this.player.velocityX = this.player._previousVelocityX;
                    this.player.velocityY = this.player._previousVelocityY;
                }
            }
        }, 2000);
    }

    /**
     * Adds an entity to the game world
     * @param {Object} entity - Entity to add
     */
    addEntity(entity) {
        // Ensure entity has proper collision properties
        if (!entity.width) entity.width = 0.6;
        if (!entity.height) entity.height = 0.6;
        if (entity.zHeight === undefined) entity.zHeight = 0.5;
        if (entity.z === undefined) entity.z = 0;
        
        // Add to entity list
        this.entities.push(entity);
        
        // Also add to spatial grid for collision detection
        this.spatialGrid.addEntity(entity);
        
        debug('Entity added to game world');
    }

    /**
     * Removes an entity from the game world
     * @param {Object} entity - Entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            debug('Entity removed from game world');
        }
    }

    /**
     * Clears all entities except the player
     */
    clearEntities() {
        // Preserve player entity
        const player = this.player;
        
        // Clear all other entities
        this.entities = this.entities.filter(e => e === player);
        
        // Reset spatial grid
        this.spatialGrid.clear();
        
        // Re-add player to spatial grid if it exists
        if (player) {
            this.spatialGrid.addEntity(player);
        }
        
        info('All entities cleared except player');
    }

    /**
     * Handles collision response between two entities
     * @param {Object} entity1 - First entity in collision
     * @param {Object} entity2 - Second entity in collision
     * @param {Object} collisionInfo - Information about the collision
     */
    handleCollision(entity1, entity2, collisionInfo) {
        // Skip self-collisions and collisions with special objects if needed
        if (entity1 === entity2) return;
        
        // Add detailed logging to track the collision resolution
        console.log(`[COLLISION HANDLER] Starting collision handling: 
            Entity1 pos: (${entity1.x.toFixed(3)}, ${entity1.y.toFixed(3)})
            Entity1 vel: (${(entity1.velocityX || 0).toFixed(3)}, ${(entity1.velocityY || 0).toFixed(3)})
            Entity2 pos: (${entity2.x.toFixed(3)}, ${entity2.y.toFixed(3)})`);
        
        // Calculate centers and distances - more precise calculations
        const e1CenterX = entity1.x + (entity1.width || 0.6) / 2;
        const e1CenterY = entity1.y + (entity1.height || 0.6) / 2;
        const e2CenterX = entity2.x + (entity2.width || 0.6) / 2;
        const e2CenterY = entity2.y + (entity2.height || 0.6) / 2;
        
        // Determine collision direction (which side the player is approaching from)
        const dx = e1CenterX - e2CenterX;
        const dy = e1CenterY - e2CenterY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // Log the exact collision vector
        console.log(`[COLLISION VECTOR] dx=${dx.toFixed(4)}, dy=${dy.toFixed(4)}, absDx=${absDx.toFixed(4)}, absDy=${absDy.toFixed(4)}`);
        
        // Get collision penetration depths - how far entity1 has penetrated entity2
        const halfWidth1 = (entity1.width || 0.6) / 2;
        const halfHeight1 = (entity1.height || 0.6) / 2;
        const halfWidth2 = (entity2.width || 0.6) / 2;
        const halfHeight2 = (entity2.height || 0.6) / 2;
        
        const overlapX = halfWidth1 + halfWidth2 - absDx;
        const overlapY = halfHeight1 + halfHeight2 - absDy;
        
        console.log(`[COLLISION OVERLAP] overlapX=${overlapX.toFixed(4)}, overlapY=${overlapY.toFixed(4)}`);
        
        // Determine if collision is more horizontal or vertical
        // Use a slightly different approach - pick the axis with minimal penetration
        // This helps prevent slingshotting by choosing the "easiest" way out
        const isHorizontalCollision = overlapX < overlapY;
        
        console.log(`[COLLISION TYPE] ${isHorizontalCollision ? 'Horizontal' : 'Vertical'} collision detected`);
        
        // Store original position for comparison
        const originalX = entity1.x;
        const originalY = entity1.y;
        
        // ENHANCED COLLISION RESPONSE: Use a larger multiplier for stronger push-back
        // This is the key factor in making collisions feel solid and preventing pass-through
        const separationMultiplier = 1.25; // Increased from 1.05 to 1.25 for more solid feel
        
        if (isHorizontalCollision) {
            // Horizontal collision - stop X velocity completely
            entity1.velocityX = 0;
            
            // Apply stronger response for horizontal collisions
            if (dx > 0) { // Entity1 is to the right of Entity2
                // Use more forceful adjustment
                const adjustmentX = overlapX * separationMultiplier;
                
                console.log(`[HORIZONTAL ADJUST] Right collision, adjustment=${adjustmentX.toFixed(5)}`);
                entity1.x += adjustmentX;
                
                // Apply a small extra push in the opposite direction of movement
                // This helps prevent slingshotting by adding a small buffer zone
                if (entity1.lastVelocityX < 0) { // Was moving left
                    entity1.x += 0.05; // Extra small buffer
                }
            } else { // Entity1 is to the left of Entity2
                // Use more forceful adjustment
                const adjustmentX = -overlapX * separationMultiplier;
                
                console.log(`[HORIZONTAL ADJUST] Left collision, adjustment=${adjustmentX.toFixed(5)}`);
                entity1.x += adjustmentX;
                
                // Apply a small extra push in the opposite direction of movement
                if (entity1.lastVelocityX > 0) { // Was moving right
                    entity1.x -= 0.05; // Extra small buffer
                }
            }
        } else {
            // Vertical collision - stop Y velocity completely
            entity1.velocityY = 0;
            
            // Apply stronger response for vertical collisions
            if (dy > 0) { // Entity1 is below Entity2
                // Use more forceful adjustment
                const adjustmentY = overlapY * separationMultiplier;
                
                console.log(`[VERTICAL ADJUST] Bottom collision, adjustment=${adjustmentY.toFixed(5)}`);
                entity1.y += adjustmentY;
                
                // Apply a small extra push in the opposite direction of movement
                if (entity1.lastVelocityY < 0) { // Was moving up
                    entity1.y += 0.05; // Extra small buffer
                }
            } else { // Entity1 is above Entity2
                // Use more forceful adjustment
                const adjustmentY = -overlapY * separationMultiplier;
                
                console.log(`[VERTICAL ADJUST] Top collision, adjustment=${adjustmentY.toFixed(5)}`);
                entity1.y += adjustmentY;
                
                // Apply a small extra push in the opposite direction of movement
                if (entity1.lastVelocityY > 0) { // Was moving down
                    entity1.y -= 0.05; // Extra small buffer
                }
            }
        }
        
        // Store last velocity for next collision check
        entity1.lastVelocityX = entity1.velocityX;
        entity1.lastVelocityY = entity1.velocityY;
        
        // Log the final position and velocity after adjustment
        console.log(`[COLLISION RESULT] 
            Final position: (${entity1.x.toFixed(3)}, ${entity1.y.toFixed(3)})
            Position change: (${(entity1.x - originalX).toFixed(5)}, ${(entity1.y - originalY).toFixed(5)})
            Final velocity: (${(entity1.velocityX || 0).toFixed(3)}, ${(entity1.velocityY || 0).toFixed(3)})`);
    }

    /**
     * Handles player input
     */
    handlePlayerInput() {
        // Skip input handling if portal transition is active or interaction is active
        if (this._portalTransitionActive || this._interactionActive) {
            // Reset velocity to ensure player doesn't move
            if (this.player) {
                this.player.velocityX = 0;
                this.player.velocityY = 0;
            }
            return;
        }
        
        // Skip if player not available
        if (!this.player) return;
        
        // Reset velocity
        this.player.velocityX = 0;
        this.player.velocityY = 0;

        // Get movement inputs
        const upPressed = input.isKeyPressed('ArrowUp') || input.isKeyPressed('w') || input.isKeyPressed('W');
        const downPressed = input.isKeyPressed('ArrowDown') || input.isKeyPressed('s') || input.isKeyPressed('S');
        const leftPressed = input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a') || input.isKeyPressed('A');
        const rightPressed = input.isKeyPressed('ArrowRight') || input.isKeyPressed('d') || input.isKeyPressed('D');

        // Only process movement if no interaction is active
        if (!this._interactionActive) {
            // Handle movement based on key presses
            if (upPressed) this.player.velocityY = -this.player.speed;
            if (downPressed) this.player.velocityY = this.player.speed;
            if (leftPressed) this.player.velocityX = -this.player.speed;
            if (rightPressed) this.player.velocityX = this.player.speed;

            // Normalize diagonal movement
            if ((upPressed || downPressed) && (leftPressed || rightPressed)) {
                this.player.velocityX *= 0.7071; // 1 / sqrt(2)
                this.player.velocityY *= 0.7071; // 1 / sqrt(2)
            }
        }

        // Handle jump action
        if (input.isKeyPressed(' ') || input.isKeyPressed('Spacebar')) {
            this.player.jump();
        }
    }

    /**
     * Updates all game entities and checks for collisions
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Skip if no player
        if (!this.player) return;
        
        // Store original player position for collision detection
        const originalPlayerX = this.player.x;
        const originalPlayerY = this.player.y;
        
        // Ensure player has lastVelocity properties for collision handling
        if (this.player.lastVelocityX === undefined) {
            this.player.lastVelocityX = 0;
            this.player.lastVelocityY = 0;
        }
        
        // Store current velocity before handling input
        this.player.lastVelocityX = this.player.velocityX || 0;
        this.player.lastVelocityY = this.player.velocityY || 0;
        
        // Handle player input - skip if interaction is active
        if (!this._interactionActive) {
            this.handlePlayerInput();
        } else {
            // Ensure player is stopped during interactions
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
        
        // Apply physics to player - only apply if player is moving
        // IMPORTANT FIX: Only apply physics if player hasn't collided
        this.physics.applyGravity(this.player);
        
        // IMPORTANT: When we update player position, we want to be able to revert back if collision occurs
        // Update player with deltaTime
        const oldX = this.player.x;
        const oldY = this.player.y;
        this.player.update(deltaTime);
        
        // Check ground collision for player
        this.physics.checkGroundCollision(this.player, this.groundLevel);
        
        // Store player's post-update position before any collisions are resolved
        const playerPhysicsX = this.player.x;
        const playerPhysicsY = this.player.y;
        
        // Diagnostic: Find all jukebox entities for debugging
        if (Math.random() < 0.01) { // Only log occasionally to avoid spam
            const jukeboxEntities = this.entities.filter(entity => 
                entity && entity.constructor && entity.constructor.name === 'JukeboxEntity'
            );
            
            if (jukeboxEntities.length > 0) {
                console.log(`[GAME] Found ${jukeboxEntities.length} jukebox entities`);
                jukeboxEntities.forEach((jukebox, index) => {
                    console.log(`[GAME] Jukebox ${index + 1} position: (${jukebox.x.toFixed(2)}, ${jukebox.y.toFixed(2)})`);
                });
                console.log(`[GAME] Player position: (${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)})`);
            } else {
                console.warn('[GAME] No jukebox entities found in the game world');
            }
        }
        
        // Update all other entities
        this.entities.forEach(entity => {
            if (entity === this.player) return; // Skip player entity in this list
            
            // Skip physics updates during portal transitions for non-portal entities
            if (this._portalTransitionActive && entity.constructor && entity.constructor.name !== 'VibePortalEntity') {
                return;
            }
            
            this.physics.applyGravity(entity);
            if (typeof entity.update === 'function') {
                // Check if entity is an interactive entity that needs player reference
                if (entity.constructor && 
                    (entity.constructor.name === 'JukeboxEntity' || 
                     entity.constructor.name === 'TVEntity' ||
                     entity.constructor.name === 'TrophyEntity' ||
                     entity.constructor.name === 'PortalEntity' ||
                     entity.constructor.name === 'SpellbookEntity' ||
                     entity.constructor.name === 'ArcadeEntity' ||
                     entity.constructor.name === 'ArcadeEntity2' ||
                     entity.constructor.name === 'ArcadeEntity3' ||
                     entity.constructor.name === 'ArcadeEntity4' ||
                     entity.constructor.name === 'ArcadeEntity5' ||
                     entity.constructor.name === 'ArcadeEntity6' ||
                     entity.constructor.name === 'ArcadeEntity7' ||
                     entity.constructor.name === 'ArcadeEntity8' ||
                     entity.constructor.name === 'ArcadeEntity9' ||
                     entity.constructor.name === 'ArcadeEntity10' ||
                     entity.constructor.name === 'ArcadeEntity11' ||
                     entity.constructor.name === 'VibePortalEntity')) {
                    console.log(`[GAME] Updating ${entity.constructor.name} at (${entity.x.toFixed(2)}, ${entity.y.toFixed(2)}) with player ref`);
                    entity.update(deltaTime, this.player);
                } else {
                    entity.update(deltaTime);
                }
            }
            
            // Check ground collision for entity
            this.physics.checkGroundCollision(entity, this.groundLevel);
        });
        
        // FULL COLLISION DETECTION SYSTEM
        // Clear and rebuild spatial grid
        this.spatialGrid.clear();
        
        // Update cell dimensions based on scene (if available)
        if (window.testScene) {
            this.spatialGrid.updateCellDimensions(
                window.testScene.cellWidth,
                window.testScene.cellHeight
            );
        }
        
        // Add player to spatial grid
        if (this.player) {
            this.spatialGrid.addEntity(this.player);
        }
        
        // Add all other entities to spatial grid
        this.entities.forEach(entity => {
            if (entity === this.player) return; // Skip player, already added
            if (entity) {
                this.spatialGrid.addEntity(entity);
            }
        });
        
        // Check for collisions using spatial grid optimization
        const nearbyEntities = this.spatialGrid.getSurroundingEntities(this.player, 2);
        
        // Flag to track if any collision was detected
        let collisionDetected = false;
        
        // Only check collisions with nearby entities
        nearbyEntities.forEach(entity => {
            // Skip collision with self
            if (entity === this.player) return;
            
            // ANTI-SLINGSHOT FIX: Test if the collision happens at current position
            if (Collision.checkCollision(this.player, entity)) {
                collisionDetected = true;
                
                // Store player position BEFORE collision handling
                const beforeHandlingX = this.player.x;
                const beforeHandlingY = this.player.y;
                
                // Handle the collision
                this.handleCollision(this.player, entity);
                
                // Verify player didn't move too far (prevent slingshotting)
                const xDiff = Math.abs(this.player.x - beforeHandlingX);
                const yDiff = Math.abs(this.player.y - beforeHandlingY);
                
                // If movement from collision resolution is too large, reset to a safer position
                // This effectively limits how far a collision can push the player
                const MAX_ADJUST = 0.35; // Increased to allow stronger collision responses
                
                if (xDiff > MAX_ADJUST || yDiff > MAX_ADJUST) {
                    console.log(`[ANTI-SLINGSHOT] Excessive movement detected (${xDiff.toFixed(3)}, ${yDiff.toFixed(3)})`);
                    
                    // Choose a safer position - either original position or an intermediate one
                    // Calculate an intermediate position that moves slightly away from obstacle
                    if (xDiff > MAX_ADJUST) {
                        // Determine which direction we need to move (away from entity)
                        const entityCenterX = entity.x + (entity.width || 0.6) / 2;
                        const playerCenterX = beforeHandlingX + (this.player.width || 0.6) / 2;
                        const moveDirection = playerCenterX > entityCenterX ? 1 : -1; // Away from entity
                        
                        // Calculate a proper adjustment that's proportional to the penetration
                        // but capped at MAX_ADJUST
                        const safeAdjustment = Math.min(xDiff * 0.95, MAX_ADJUST) * moveDirection;
                        
                        // Move player by a substantial amount in the proper direction
                        this.player.x = beforeHandlingX + safeAdjustment;
                        this.player.velocityX = 0; // Stop horizontal movement
                        
                        console.log(`[ANTI-SLINGSHOT] X position adjusted to ${this.player.x.toFixed(3)} (safe adjustment: ${safeAdjustment.toFixed(3)})`);
                    }
                    
                    if (yDiff > MAX_ADJUST) {
                        // Determine which direction we need to move (away from entity)
                        const entityCenterY = entity.y + (entity.height || 0.6) / 2;
                        const playerCenterY = beforeHandlingY + (this.player.height || 0.6) / 2;
                        const moveDirection = playerCenterY > entityCenterY ? 1 : -1; // Away from entity
                        
                        // Calculate a proper adjustment that's proportional to the penetration
                        // but capped at MAX_ADJUST
                        const safeAdjustment = Math.min(yDiff * 0.95, MAX_ADJUST) * moveDirection;
                        
                        // Move player by a substantial amount in the proper direction
                        this.player.y = beforeHandlingY + safeAdjustment;
                        this.player.velocityY = 0; // Stop vertical movement
                        
                        console.log(`[ANTI-SLINGSHOT] Y position adjusted to ${this.player.y.toFixed(3)} (safe adjustment: ${safeAdjustment.toFixed(3)})`);
                    }
                }
                
                // After collision is resolved, perform a second check to ensure we're really clear
                // This "double check" approach helps prevent entities from getting stuck
                if (Collision.checkCollision(this.player, entity)) {
                    console.log(`[COLLISION SAFETY] Still colliding after resolution - applying additional force`);
                    
                    // Calculate direction to push player away from entity
                    const pushDirX = this.player.x > entity.x ? 1 : -1;
                    const pushDirY = this.player.y > entity.y ? 1 : -1;
                    
                    // Apply a stronger push in the appropriate direction
                    // Use whichever axis has more room to move
                    if (Math.abs(this.player.lastVelocityX) > Math.abs(this.player.lastVelocityY)) {
                        // Was moving more horizontally - push horizontally
                        this.player.x += pushDirX * 0.1;
                        console.log(`[COLLISION SAFETY] Applied extra horizontal push: ${pushDirX * 0.1}`);
                    } else {
                        // Was moving more vertically - push vertically
                        this.player.y += pushDirY * 0.1;
                        console.log(`[COLLISION SAFETY] Applied extra vertical push: ${pushDirY * 0.1}`);
                    }
                }
            }
        });
        
        // If collision was detected, log player position changes
        if (collisionDetected) {
            console.log(`[POSITION SUMMARY] Player movement:
                Starting:  (${originalPlayerX.toFixed(3)}, ${originalPlayerY.toFixed(3)})
                Physics:   (${playerPhysicsX.toFixed(3)}, ${playerPhysicsY.toFixed(3)})
                Final:     (${this.player.x.toFixed(3)}, ${this.player.y.toFixed(3)})
                Delta:     (${(this.player.x - originalPlayerX).toFixed(3)}, ${(this.player.y - originalPlayerY).toFixed(3)})`
            );
        }
    }

    /**
     * Creates test entities around the player to demonstrate spatial grid and depth sorting
     * @param {number} count - Number of entities to create
     */
    createTestEntities(count = 10) {
        // Define entity types with different heights and colors
        const entityTypes = [
            { color: '#FFCC00', zHeight: 0.3, name: 'Yellow Block' },   // Very short
            { color: '#00CC66', zHeight: 0.5, name: 'Green Obstacle' }, // Low
            { color: '#FF33CC', zHeight: 0.4, name: 'Magenta Block' },  // Low
            { color: '#9933FF', zHeight: 0.8, name: 'Purple Wall' },    // Medium
            { color: '#33CCFF', zHeight: 1.2, name: 'Cyan Wall' },      // Taller
            { color: '#FF3333', zHeight: 2.0, name: 'Red Wall' }        // Very tall
        ];
        
        // Clear existing entities (except player)
        this.clearEntities();
        
        // Create entities in a pattern around the player
        const playerPos = this.player ? { x: this.player.x, y: this.player.y } : { x: 5, y: 5 };
        
        // Log starting position for entity creation (not too verbose)
        info(`[TEST ENTITIES] Creating test entities around position: ${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)}`);
        
        // Add entities in a grid pattern
        let entityCount = 0;
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                // Skip the center position (where player is)
                if (i === 0 && j === 0) continue;
                
                // Calculate position with small random offset
                const x = playerPos.x + i + (Math.random() * 0.4 - 0.2);
                const y = playerPos.y + j + (Math.random() * 0.4 - 0.2);
                
                // Select a random entity type
                const type = entityTypes[Math.floor(Math.random() * entityTypes.length)];
                
                // Create entity with position and properties
                const entity = {
                    x, y,
                    width: 0.6,
                    height: 0.6,
                    z: 0,
                    zHeight: type.zHeight,
                    color: type.color, 
                    name: type.name,
                    // Add these critical fields that might be expected by renderer and collision system
                    isEntity: true,
                    isStatic: true,
                    // Add velocity properties to ensure collision system works
                    velocityX: 0,
                    velocityY: 0,
                    // Ensure collision flag is set
                    collidable: true
                };
                
                // Force log every entity creation for debugging
                console.log(`[TEST ENTITY] Creating ${type.name} at (${x.toFixed(1)}, ${y.toFixed(1)}) with height ${type.zHeight}`, entity);
                
                // Add entity to game
                this.addEntity(entity);
                entityCount++;
                
                // Log every few entities (not each one to avoid spam)
                if (entityCount <= 3 || entityCount % 8 === 0) {
                    info(`[TEST ENTITIES] Added ${type.name} at (${x.toFixed(1)}, ${y.toFixed(1)}) with height ${type.zHeight}`);
                }
            }
        }
        
        // Force rebuild spatial grid immediately
        this.spatialGrid.clear();
        
        // Add all entities to spatial grid
        if (this.player) {
            this.spatialGrid.addEntity(this.player);
        }
        
        this.entities.forEach(entity => {
            if (entity !== this.player) {
                this.spatialGrid.addEntity(entity);
            }
        });
        
        // Log comprehensive entity creation summary
        info(`[TEST ENTITIES] Created ${entityCount} test entities with various heights`);
        info(`[TEST ENTITIES] Total entities in game: ${this.entities.length}`);
        info(`[TEST ENTITIES] Entity types: ${this.entities.slice(0, 3).map(e => e.name || 'unnamed').join(', ')}... (truncated)`);
        
        // Log entity data for debugging
        console.log("[TEST ENTITIES] Complete entity list:", this.entities);
        
        // Log specific details about a sample entity for debugging
        if (this.entities.length > 1) {
            const sampleEntity = this.entities[1]; // First non-player entity
            console.log("[ENTITY DEBUG] Sample entity properties:", sampleEntity);
        }
    }

    /**
     * Set the interaction active state for menus and dialogs
     * @param {boolean} isActive - Whether interaction is active
     */
    setInteractionActive(isActive) {
        console.log(`Game: Setting interaction active state to ${isActive}`);
        
        // Update the interaction state
        this._interactionActive = isActive;
        
        if (isActive) {
            // Store player state when entering interaction
            if (this.player) {
                this.player._preInteractionVelocityX = this.player.velocityX;
                this.player._preInteractionVelocityY = this.player.velocityY;
                
                // Stop the player during interaction
                this.player.velocityX = 0;
                this.player.velocityY = 0;
            }
            
            // Optionally play a sound or visual effect
            // this.playSound('menu-open');
        } else {
            // Restore player state when exiting interaction
            if (this.player && this.player._preInteractionVelocityX !== undefined) {
                // Don't restore velocity - just allow movement again
                // The player should press keys again to move
            }
        }
        
        debug(`Game: Interaction active state set to ${this._interactionActive}`);
    }
}

export { Game };
