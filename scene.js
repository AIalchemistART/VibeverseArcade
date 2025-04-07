/**
 * Scene module for AI Alchemist's Lair
 * Handles rendering of game objects and environments
 */

import { debug } from './utils.js';
import assetLoader from './assetLoader.js';
import { isometricRenderer } from './isometricRenderer.js';
import doorwayManager from './doorways.js';
import { directionalLabelsManager } from './directionalLabels.js'; 
import { characterRenderer } from './characterRenderer.js';

// Set to false to disable verbose rendering optimization logs
const VERBOSE_RENDERING_DEBUG = false;

// Helper function to conditionally log only when verbose debugging is enabled
function conditionalDebug(...args) {
    if (VERBOSE_RENDERING_DEBUG) {
        debug(...args);
    }
}

class TestScene {
    constructor() {
        // Grid cell dimensions
        this.cellWidth = 64;
        this.cellHeight = 32;
        
        // Grid size - Increased from 10x10 to provide a larger game world
        this.gridWidth = 200;
        this.gridHeight = 80;
        
        // Flag to show entity names
        this.showEntityNames = true;
        
        // Define doorway positions in walls
        this.doorPositions = {
            north: 93, // Position along the north wall (0-gridWidth)
            west: 6   // Position along the west wall (0-gridHeight)
        };
        
        console.log('Door positions set:', this.doorPositions);
        
        debug('TestScene initialized', { 
            gridSize: `${this.gridWidth}x${this.gridHeight}`,
            cellSize: `${this.cellWidth}x${this.cellHeight}`
        });
    }
    
    /**
     * Initialize the scene
     */
    initialize() {
        // Create spatial grid for efficient collision detection
        this.spatialGrid = new SpatialGrid(this.cellSize, this.cellWidth, this.cellHeight);
        console.log("Scene.initialize: Spatial grid created with cellSize:", this.cellSize);
        
        // Initialize player
        this.initializePlayer();
        
        // Initialize and register doorways
        this.initializeDoorways();
        
        this.initialized = true;
        
        console.log(`Scene initialized: ${this.id}`);
    }
    
    /**
     * Initialize doorways for this scene
     */
    initializeDoorways() {
        // Get the doorways for this scene from the doorway manager
        const doorways = doorwayManager.getActiveDoorsForScene(this.id);
        
        // Register all doorways in the spatial grid
        if (doorways && doorways.length > 0) {
            console.log(`Registering ${doorways.length} doorways in spatial grid for scene ${this.id}`);
            
            doorways.forEach(door => {
                // Register in spatial grid with appropriate world coordinates
                door.registerInSpatialGrid(this.spatialGrid);
            });
            
            // Count entities registered
            console.log(`Spatial grid now contains ${Array.from(this.spatialGrid.grid.values()).flat().length} entities`);
        } else {
            console.log(`No doorways found to register for scene ${this.id}`);
        }
    }
    
    /**
     * Render the scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} playerX - Player X position in grid coordinates
     * @param {number} playerY - Player Y position in grid coordinates
     * @param {Camera} camera - Camera to render through
     * @param {Object} playerEntity - Player entity for rendering
     * @param {Game} game - Game instance
     */
    render(ctx, playerX, playerY, camera, playerEntity, game) {
        // Store the current scene ID from URL or scene data
        this.id = window.location.hash.substring(1) || game?.currentScene || 'unknown';
        console.log('Current scene ID from render:', this.id);
        
        // Store player position for coming soon proximity detection
        if (playerEntity) {
            this.playerX = playerEntity.x;
            this.playerY = playerEntity.y;
        }
        
        // Save the context state
        ctx.save();
        
        // Center point for the canvas
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // Render differently based on whether a camera is provided
        if (camera) {
            // Use properties from scene for grid calculation
            const cellWidth = this.cellWidth;
            const cellHeight = this.cellHeight;
            
            // Calculate visible area based on camera view
            const viewWidth = ctx.canvas.width / camera.zoom;
            const viewHeight = ctx.canvas.height / camera.zoom;
            
            // Add padding to ensure grid cells at the edges are rendered
            // Increased padding to extend draw distance
            const padding = 12; // Increased from 2 to 6 for greater draw distance
            
            // Get camera viewport corners in world coordinates
            const topLeftWorldX = camera.x - viewWidth / 2;
            const topLeftWorldY = camera.y - viewHeight / 2;
            const bottomRightWorldX = camera.x + viewWidth / 2;
            const bottomRightWorldY = camera.y + viewHeight / 2;
            
            // Convert world coordinates to isometric grid cell ranges
            // Formula derived from the transformation used to convert grid to ISO
            // These are approximate and include padding to ensure we render everything visible
            const topLeftIsoX = topLeftWorldX;
            const topLeftIsoY = topLeftWorldY;
            const bottomRightIsoX = bottomRightWorldX;
            const bottomRightIsoY = bottomRightWorldY;
            
            // Calculate grid cell range to render based on isometric coordinates
            // Convert back from isometric to grid coordinates
            const startI = Math.floor((topLeftIsoX / (this.cellWidth / 2) + topLeftIsoY / (this.cellHeight / 2)) / 2) - padding;
            const startJ = Math.floor((topLeftIsoY / (this.cellHeight / 2) - topLeftIsoX / (this.cellWidth / 2)) / 2) - padding;
            const endI = Math.ceil((bottomRightIsoX / (this.cellWidth / 2) + bottomRightIsoY / (this.cellHeight / 2)) / 2) + padding;
            const endJ = Math.ceil((bottomRightIsoY / (this.cellHeight / 2) - bottomRightIsoX / (this.cellWidth / 2)) / 2) + padding;
            
            // Count rendered vs. total cells for debugging
            let renderedCells = 0;
            const totalCells = this.gridWidth * this.gridHeight;
            
            conditionalDebug('Rendering with camera', { 
                position: `${camera.x.toFixed(2)}, ${camera.y.toFixed(2)}`, 
                zoom: camera.zoom.toFixed(2),
                viewRange: `${startI}:${endI}, ${startJ}:${endJ}`
            });
            
            // Apply transformations in the proper order:
            // 1. Translate to center of canvas
            ctx.translate(centerX, centerY);
            
            // 2. Apply zoom (scale)
            ctx.scale(camera.zoom, camera.zoom);
            
            // 3. Translate to offset camera position
            ctx.translate(-camera.x, -camera.y);
            
            // Draw floor tiles first (bottom layer)
            for (let i = Math.max(0, startI); i < Math.min(this.gridWidth, endI); i++) {
                for (let j = Math.max(0, startJ); j < Math.min(this.gridHeight, endJ); j++) {
                    // Use the cellWidth and cellHeight of the scene for consistency
                    const screenX = (i - j) * (this.cellWidth / 2);
                    const screenY = (i + j) * (this.cellHeight / 2);
                    
                    // Use isometricRenderer to draw the floor tile
                    isometricRenderer.renderFloorTile(ctx, screenX, screenY, this.cellWidth, this.cellHeight);
                    
                    renderedCells++;
                }
            }
            
            // Draw walls for the boundaries (after floor tiles)
            this.drawWalls(ctx);
            
            // Log optimization statistics
            conditionalDebug('Rendering optimization', { 
                renderedCells,
                totalCells,
                efficiency: `${((1 - renderedCells / totalCells) * 100).toFixed(1)}% reduction`
            });
        } else {
            // Fallback to centered rendering if no camera is provided
            ctx.translate(centerX, centerY - 150);
            debug('Rendering without camera (centered)');
            
            // Draw full isometric grid when no camera is available
            for (let i = 0; i < this.gridWidth; i++) {
                for (let j = 0; j < this.gridHeight; j++) {
                    // Use the cellWidth and cellHeight of the scene for consistency
                    const screenX = (i - j) * (this.cellWidth / 2);
                    const screenY = (i + j) * (this.cellHeight / 2);
                    
                    // Use isometricRenderer to draw the floor tile
                    isometricRenderer.renderFloorTile(ctx, screenX, screenY, this.cellWidth, this.cellHeight);
                }
            }
            
            // Draw walls for the boundaries (after floor tiles)
            this.drawWalls(ctx);
        }
        
        // Collect all entities for depth sorting
        const allEntities = [];
        
        // Add player to the entities list for proper depth sorting
        if (playerEntity) {
            allEntities.push(playerEntity);
            conditionalDebug("RENDER", "Added player to render list:", playerEntity);
        }
        
        // Add all game entities to the sorting list (if game is provided)
        if (game && game.entities) {
            conditionalDebug("RENDER", `Game has ${game.entities.length} entities to render`);
            
            // Force display of all game entities (ensuring none are filtered)
            for (const entity of game.entities) {
                if (entity !== playerEntity) { // Avoid duplicating player
                    allEntities.push(entity);
                    
                    // Log details for first few entities only
                    if (allEntities.length <= 3) {
                        conditionalDebug("RENDER", `Added entity to render list: ${entity.name || 'unnamed'} at (${entity.x}, ${entity.y}), height: ${entity.zHeight}`);
                    }
                }
            }
        } else {
            conditionalDebug("RENDER", "Game object or entities not available:", {
                gameExists: !!game,
                entitiesExist: !!(game && game.entities),
                entitiesLength: game && game.entities ? game.entities.length : 0
            });
        }
        
        // Apply painter's algorithm - sort entities by depth (y position + height)
        // This ensures entities in the back are drawn first
        allEntities.sort((a, b) => {
            // First check for explicit render priorities
            if (a.renderPriority !== undefined && b.renderPriority !== undefined) {
                if (a.renderPriority !== b.renderPriority) {
                    return a.renderPriority - b.renderPriority; // Lower priority renders first (underneath)
                }
            } else if (a.renderPriority !== undefined) {
                return -1; // If only a has priority, it goes first
            } else if (b.renderPriority !== undefined) {
                return 1;  // If only b has priority, it goes first
            }
            
            // If no priorities or they're equal, use the standard depth sorting
            // Calculate effective y-position including z-height for proper sorting
            const aDepth = a.y + (a.z || 0);
            const bDepth = b.y + (b.z || 0);
            return aDepth - bDepth; // Sort from back to front
        });
        
        // Draw all entities in depth-sorted order
        conditionalDebug("RENDER", `Rendering ${allEntities.length} entities in depth-sorted order`);
        
        // Track actual entities rendered successfully
        let renderedCount = 0;
        
        this.drawEntities(ctx, allEntities);
        
        conditionalDebug("RENDER", `Successfully rendered ${renderedCount}/${allEntities.length} entities`);
        
        // Draw debug information if game is provided
        if (game && game.debugRenderer) {
            // Draw debug visuals separately - don't call draw directly
            if (game.debugRenderer.showCollisionBoxes) {
                game.debugRenderer.drawCollisionBoxes(ctx, game.entities, playerEntity, camera, this);
            }
            
            if (game.debugRenderer.showSpatialGrid) {
                game.debugRenderer.drawSpatialGrid(ctx, game.spatialGrid, camera, this);
            }
            
            if (game.debugRenderer.showEntityInfo && playerEntity) {
                game.debugRenderer.drawEntityInfo(ctx, playerEntity, camera, this);
            }
        }
        
        // Draw spatial grid debug visualization
        this.renderDebug(ctx);
        
        // Draw decorative doors
        this.drawDecorativeDoors(ctx);
        
        // Draw room labels
        this.drawRoomLabels(ctx);
        
        // Draw directional labels pointing back to startRoom (when in other rooms)
        this.drawDirectionalLabels(ctx);
        
        // Restore the context state
        ctx.restore();
    }
    
    /**
     * Draw entities in the scene with depth sorting
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Array} entities - List of entities to draw
     */
    drawEntities(ctx, entities) {
        // Save canvas state
        ctx.save();
        
        try {
            // Diagnostic counters
            let entitiesRendered = 0;
            let playerEntityFound = false;
            
            // Draw all entities with proper depth
            for (const entity of entities) {
                // Check if this is the player entity for diagnostics
                if (entity.isPlayer) {
                    playerEntityFound = true;
                    console.log('RENDERING PLAYER ENTITY:', {
                        x: entity.x.toFixed(2), 
                        y: entity.y.toFixed(2),
                        hasDrawMethod: typeof entity.draw === 'function',
                        direction: entity.getDirection ? entity.getDirection() : 'unknown'
                    });
                }
                
                // Render the entity
                try {
                    this.drawEntity(ctx, entity);
                    entitiesRendered++;
                } catch (error) {
                    console.error("Error rendering entity:", error, entity);
                }
            }
            
            // Log rendering diagnostics
            console.log(`Rendered ${entitiesRendered}/${entities.length} entities. Player found: ${playerEntityFound}`);
            
            // Alert if player entity wasn't found
            if (!playerEntityFound) {
                console.warn('⚠️ No player entity found in scene!');
            }
        } catch (error) {
            console.error("Error in drawEntities:", error);
        }
        
        // Restore canvas state
        ctx.restore();
    }
    
    /**
     * Draw an entity with proper isometric perspective and z-height
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} entity - Entity to draw
     */
    drawEntity(ctx, entity) {
        if (!entity) {
            debug("Attempted to draw undefined entity");
            return;
        }
        
        try {
            // Get entity properties with defaults
            const x = entity.x || 0;
            const y = entity.y || 0;
            const width = entity.width || 0.6;
            const height = entity.height || 0.6;
            const z = entity.z || 0;
            const zHeight = entity.zHeight || 0.5;
            
            // Calculate isometric coordinates for entity position
            const screenX = (x - y) * (this.cellWidth / 2);
            const screenY = (x + y) * (this.cellHeight / 2);
            
            // Apply z-height offset for elevation
            const zOffset = z * this.cellHeight;
            
            // Scale entity dimensions to match grid cell size
            const entityWidth = width * this.cellWidth;
            const entityHeight = height * this.cellHeight;
            const entityZHeight = zHeight * this.cellHeight;
            
            // Check if entity has a custom draw method
            if (typeof entity.draw === 'function') {
                if (entity.isPlayer) {
                    console.log('Drawing player entity with custom draw method');
                } else {
                    // Debug line to track what other entities are using custom draw methods
                    console.log(`Drawing entity with custom draw method: ${entity.constructor.name} at (${x}, ${y})`);
                }
                
                // Call the entity's own draw method which handles sprite rendering
                entity.draw(ctx, screenX, screenY, entityWidth, entityHeight, zOffset);
                
                // Draw debug collision box if enabled
                if (this.showEntityBoundaries) {
                    ctx.strokeStyle = '#0ef';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        screenX - entityWidth/2,
                        screenY - entityHeight - zOffset,
                        entityWidth,
                        entityHeight
                    );
                    
                    // Mark center point
                    ctx.fillStyle = 'yellow';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // For entities without custom draw methods, use the original 3D rendering
                this.renderBasic3DEntity(ctx, entity, screenX, screenY, entityWidth, entityHeight, entityZHeight, zOffset);
            }
        } catch (error) {
            console.error("Error drawing entity:", error, entity);
        }
    }
    
    /**
     * Render a basic 3D entity (used for non-player entities or as fallback)
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} entity - Entity to draw
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} entityWidth - Entity width in screen units
     * @param {number} entityHeight - Entity height in screen units
     * @param {number} entityZHeight - Entity Z height in screen units
     * @param {number} zOffset - Z offset for jumping
     */
    renderBasic3DEntity(ctx, entity, screenX, screenY, entityWidth, entityHeight, entityZHeight, zOffset) {
        // Determine entity color (use custom colors if provided)
        const baseColor = entity.color || (entity.isPlayer ? '#4499ff' : '#ff6644');
        
        // Calculate color variations for 3D sides
        const topColor = entity.topColor || this.adjustBrightness(baseColor, 30);  // Top is lightest
        const leftColor = entity.leftColor || this.adjustBrightness(baseColor, -30); // Left side is darkest
        const rightColor = entity.rightColor || this.adjustBrightness(baseColor, -15); // Right side is medium
        
        // Draw entity body as a 3D shape
        // 1. Draw left side (darkest)
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - zOffset);
        ctx.lineTo(screenX - entityWidth/2, screenY + entityHeight/2 - zOffset);
        ctx.lineTo(screenX - entityWidth/2, screenY + entityHeight/2 - zOffset - entityZHeight);
        ctx.lineTo(screenX, screenY - zOffset - entityZHeight);
        ctx.closePath();
        ctx.fill();
        
        // 2. Draw right side (medium)
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - zOffset);
        ctx.lineTo(screenX + entityWidth/2, screenY + entityHeight/2 - zOffset);
        ctx.lineTo(screenX + entityWidth/2, screenY + entityHeight/2 - zOffset - entityZHeight);
        ctx.lineTo(screenX, screenY - zOffset - entityZHeight);
        ctx.closePath();
        ctx.fill();
        
        // 3. Draw top (brightest)
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - zOffset - entityZHeight);
        ctx.lineTo(screenX - entityWidth/2, screenY + entityHeight/2 - zOffset - entityZHeight);
        ctx.lineTo(screenX, screenY + entityHeight - zOffset - entityZHeight);
        ctx.lineTo(screenX + entityWidth/2, screenY + entityHeight/2 - zOffset - entityZHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw entity-specific decorations if any
        if (entity.isPlayer) {
            // Add indicator for player (e.g., a small dot on top)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenX, screenY - zOffset - entityZHeight - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw entity name if it has one (for test entities)
        if (entity.name && this.showEntityNames) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(entity.name, screenX, screenY - zOffset - entityZHeight - 10);
            
            // Show height if we have it
            if (entity.zHeight) {
                ctx.fillStyle = 'rgba(200, 255, 200, 0.8)';
                ctx.fillText(`h: ${entity.zHeight}`, screenX, screenY - zOffset - entityZHeight - 22);
            }
        }
    }
    
    /**
     * Draw walls for the boundaries
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawWalls(ctx) {
        // Get the current scene ID for doorway integration
        const currentScene = 'testScene'; // This should be obtained from scene manager in production
        
        // Wall height in grid units (how many wall tiles to stack)
        const wallHeight = 4; // Increased from 2 to 3 rows for taller walls
        
        // Draw north wall (along the top edge of the grid)
        for (let i = 0; i < this.gridWidth; i++) {
            // First row of wall tiles
            this.drawNorthWallRow(ctx, i, 0, currentScene, 0);
            
            // Additional rows of wall tiles (stacked on top)
            for (let row = 1; row < wallHeight; row++) {
                const verticalOffset = -row * this.cellHeight * .95; // Stack tiles with some overlap
                this.drawNorthWallRow(ctx, i, verticalOffset, currentScene, row);
            }
        }
        
        // Draw west wall (along the left edge of the grid)
        for (let j = 0; j < this.gridHeight; j++) {
            // First row of wall tiles
            this.drawWestWallRow(ctx, j, 0, currentScene, 0);
            
            // Additional rows of wall tiles (stacked on top)
            for (let row = 1; row < wallHeight; row++) {
                const verticalOffset = -row * this.cellHeight * .95; // Stack tiles with some overlap
                this.drawWestWallRow(ctx, j, verticalOffset, currentScene, row);
            }
        }
        
        // Add glowing edge effect at corners
        const cornerX = (0 - 0) * (this.cellWidth / 2); // Corner at (0,0)
        const cornerY = (0 + 0) * (this.cellHeight / 2);
        
        const DEBUG_SHOW_CORNER_MARKERS = false;

        if (DEBUG_SHOW_CORNER_MARKERS) {
            const wallHighlightColor = '#00ffcc';
            ctx.fillStyle = wallHighlightColor;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(cornerX, cornerY, 5, 0, Math.PI * 2);
            ctx.fill();
        
            // Add glow effect
            ctx.shadowColor = wallHighlightColor;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(cornerX, cornerY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset shadow and alpha
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * Draw a single row of the north wall
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} position - Position along the wall
     * @param {number} verticalOffset - Vertical offset for stacking
     * @param {string} currentScene - Current scene ID
     * @param {number} row - Row index (0 = bottom, 1+ = stacked rows)
     */
    drawNorthWallRow(ctx, position, verticalOffset, currentScene, row) {
        // Calculate isometric position for the wall tile
        const i = position;
        const j = 0;
        const screenX = (i - j) * (this.cellWidth / 2);
        const screenY = (i + j) * (this.cellHeight / 2) + verticalOffset;
        
        // For doors, only render them on the bottom row (row 0)
        // and render taller doors that span both rows
        if (position === this.doorPositions.north && row === 0) {
            // DIRECT DEBUG: First check if the door is open by querying doorwayManager directly
            const doorways = doorwayManager.doorwaysByScene[currentScene] || [];
            const matchingDoors = doorways.filter(door => 
                door.isWallDoorway && 
                door.wallSide === 'north' && 
                door.gridX === position
            );
            
            if (matchingDoors.length > 0) {
                const door = matchingDoors[0];
                const isOpen = door.isOpen;
                
                console.log(`DIRECT DOOR CHECK: Found north door at pos ${position}, isOpen=${isOpen}`);
                
                // DRAW EXTREMELY VISIBLE door state
                ctx.save();
                
                // Draw bright background based on door state
                if (isOpen) {
                    // Bright green for open doors
                    ctx.fillStyle = 'lime';
                } else {
                    // Bright red for closed doors
                    ctx.fillStyle = 'red';
                }
                
                // Draw a MASSIVE rectangle to be unmistakable
                const size = 100;
                ctx.fillRect(
                    screenX - size/2, 
                    screenY - size/2, 
                    size, 
                    size
                );
                
                // Add clear text
                ctx.fillStyle = 'black';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    isOpen ? 'OPEN DOOR' : 'CLOSED DOOR',
                    screenX,
                    screenY
                );
                
                ctx.restore();
                
                // Optional: draw base door graphic under our debug indicator
                isometricRenderer.renderNorthWall(ctx, screenX, screenY, this.cellWidth, this.cellHeight);
            } else {
                console.log(`DIRECT DOOR CHECK: No north door found at pos ${position}`);
                
                // Check with doorway manager if there's a door at this position
                const doorRendered = doorwayManager.renderWallDoor(
                    ctx, 
                    currentScene, 
                    'north', 
                    position, 
                    screenX, 
                    screenY, 
                    this.cellWidth, 
                    this.cellHeight,
                    true // Indicate this is a double-height door
                );
                
                // If no door was rendered by the manager, use the fallback
                if (!doorRendered) {
                    // Use isometricRenderer to draw the northeast door at double height
                    isometricRenderer.renderDoorway(
                        ctx, 
                        screenX, 
                        screenY, 
                        this.cellWidth, 
                        this.cellHeight, 
                        'NE', 
                        false,
                        true // Double height
                    );
                }
            }
        } 
        // Skip rendering the wall tile behind the door on the second row
        else if (position === this.doorPositions.north && row > 0) {
            // Skip rendering wall tile here (door spans this space)
        }
        else {
            // Regular wall tile
            isometricRenderer.renderNorthWall(ctx, screenX, screenY, this.cellWidth, this.cellHeight);
        }
    }
    
    /**
     * Draw a single row of the west wall
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} position - Position along the wall
     * @param {number} verticalOffset - Vertical offset for stacking
     * @param {string} currentScene - Current scene ID
     * @param {number} row - Row index (0 = bottom, 1+ = stacked rows)
     */
    drawWestWallRow(ctx, position, verticalOffset, currentScene, row) {
        // Calculate isometric position for the wall tile
        const i = 0;
        const j = position;
        const screenX = (i - j) * (this.cellWidth / 2);
        const screenY = (i + j) * (this.cellHeight / 2) + verticalOffset;
        
        // West wall door rendering has been removed - always render regular wall tiles
        // regardless of whether we're at the door position or not
        isometricRenderer.renderWestWall(ctx, screenX, screenY, this.cellWidth, this.cellHeight);
    }
    
    /**
     * Render the scene debug info
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    renderDebug(ctx) {
        // Skip debug rendering if not needed
        if (!window.DEBUG_RENDERING) return;

        // Draw world coordinate origin marker at (0,0)
        // Remove or comment out these lines to remove the teal dot at origin
        /*
        const originScreen = this.gridToScreen(0, 0);
        this.drawWorldOriginMarker(ctx, originScreen.x, originScreen.y);
        */
        
        // Show scene ID
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.fillText(`Scene ID: ${this.id}`, 10, 20);
        
        // Show player position
        if (this.player) {
            ctx.fillText(`Player: ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}, ${this.player.z.toFixed(1)}`, 10, 40);
        }
        
        // Show FPS
        ctx.fillText(`FPS: ${this.fps || 0}`, 10, 60);
        
        // SPATIAL GRID DEBUG - Show all entities in the spatial grid
        if (this.spatialGrid) {
            const entities = [];
            
            // Collect all entities from the spatial grid
            for (const [key, cellEntities] of this.spatialGrid.grid.entries()) {
                if (cellEntities) {
                    entities.push(...cellEntities.filter(e => e).map(e => ({
                        type: e.entityType || 'unknown',
                        key,
                        x: e.x || 0,
                        y: e.y || 0,
                        door: e.isWallDoorway ? `${e.wallSide} (${e.isOpen ? 'OPEN' : 'CLOSED'})` : undefined
                    })));
                }
            }
            
            // Display entity count and details
            ctx.fillText(`Spatial Grid: ${entities.length} entities`, 10, 80);
            
            // Show door details specifically
            const doors = entities.filter(e => e.door);
            if (doors.length > 0) {
                doors.forEach((door, i) => {
                    ctx.fillText(`Door ${i+1}: ${door.door} at cell ${door.key}`, 10, 100 + (i * 20));
                    
                    try {
                        // Safely draw a circle at the door's location
                        ctx.fillStyle = door.door.includes('OPEN') ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                        ctx.beginPath();
                        ctx.arc(200 + (i * 30), 150, 10, 0, Math.PI * 2);
                        ctx.fill();
                    } catch (e) {
                        console.warn("Error drawing door debug circle:", e);
                    }
                });
            } else {
                ctx.fillText('No doors in spatial grid!', 10, 100);
            }
        }
    }
    
    /**
     * Draw decorative doors specific to the neonPhylactery scene
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawDecorativeDoors(ctx) {
        try {
            // Get current scene ID from hash (or default to startRoom)
            const currentSceneId = window.location.hash.substring(1) || 'startRoom';
            
            // Only draw decorative doors in the neonPhylactery (previously portfolioShowcase)
            if (currentSceneId !== 'neonPhylactery') {
                return;
            }
            
            console.log('Drawing decorative doors for neonPhylactery scene');
            
            // Get drawing context
            const context = ctx;
            
            // Draw SE wall door (NW style) at (14.0, 5.5)
            const seDoorPoint = this.gridToScreen(14.0, 5.5);
            if (seDoorPoint) {
                isometricRenderer.renderDoorway(
                    context,
                    seDoorPoint.x,
                    seDoorPoint.y,
                    64, // Cell width
                    32, // Cell height
                    'NW', // Northwest style door
                    false, // Not open
                    true // Double height
                );
                console.log('Drew SE wall door at', seDoorPoint.x, seDoorPoint.y);
            }
            
            // Draw SW wall door (NE style) at (7.5, 14.0)
            const swDoorPoint = this.gridToScreen(7.5, 14.0);
            if (swDoorPoint) {
                isometricRenderer.renderDoorway(
                    context,
                    swDoorPoint.x,
                    swDoorPoint.y,
                    64, // Cell width
                    32, // Cell height
                    'NE', // Northeast style door
                    false, // Not open
                    true // Double height
                );
                console.log('Drew SW wall door at', swDoorPoint.x, swDoorPoint.y);
            }
            
        } catch (error) {
            console.error('Error drawing decorative doors:', error);
        }
    }
    
    /**
     * Draws room labels above doors in the startRoom
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawRoomLabels(ctx) {
        try {
            // Only draw labels in the startRoom
            const currentSceneId = window.location.hash.substring(1) || 'startRoom';
            if (currentSceneId !== 'startRoom') return;
            
            console.log('Drawing room labels for startRoom doors');
            
            // Get grid cell dimensions and center
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 3;
            const tileWidth = this.cellWidth;
            const tileHeight = this.cellHeight;
            
            // Draw Circuit Sanctum label directly above the north door
            // Using precise grid coordinates based on the screenshot position (7.1, 0.0)
            
            // Grid coordinate positioning
            const circuitGridX = 107.5;    // Exact X position from the screenshot
            const circuitGridY = 26;   // Positioned above the north door
            
            // Convert grid position to screen coordinates
            const circuitPos = this.gridToScreen(circuitGridX, circuitGridY);
            if (circuitPos) {
                this.drawIsometricLabel(ctx, circuitPos.x, circuitPos.y, 'AI ALCHEMIST\'S LAIR', '#ff00ff');
            }
            
            // Neon Phylactery label removed as it's no longer needed in Circuit Sanctum Arcade
            
            // Also draw Coming Soon labels if we're in the startRoom
            this.drawComingSoonLabels(ctx);
            
        } catch (error) {
            console.error('Error drawing room labels:', error);
        }
    }
    
    /**
     * Draws 'COMING SOON' labels for applicable doors
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawComingSoonLabels(ctx) {
        // Coming Soon labels removed as they are no longer needed
        // All rooms now implemented in the Circuit Sanctum Arcade
        return;
    }
    
    /**
     * Draws directional labels pointing back to the startRoom in other scenes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawDirectionalLabels(ctx) {
        try {
            // Get current scene ID - try different sources to ensure we get a value
            let currentSceneId = window.location.hash.substring(1) || 'startRoom';
            
            // Additionally, check the game property if available (more reliable in some cases)
            if (window.game && window.game.currentScene) {
                currentSceneId = window.game.currentScene;
                console.log(`Using game.currentScene: ${currentSceneId}`);
            }
            
            console.log(`Drawing directional labels check - current scene: ${currentSceneId}`);
            
            // DEBUG: Force a known scene to test labels visibility
            // Uncomment to test specific scenes:
            // currentSceneId = 'circuitSanctum'; // For testing
            
            // Only draw directional labels when NOT in startRoom
            if (currentSceneId === 'startRoom') {
                console.log('In startRoom - skipping directional labels');
                return;
            }
            
            console.log(`Drawing directional labels for ${currentSceneId} pointing to startRoom`);
            
            // Draw a red square in the center of the screen for debugging position
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            ctx.save();
            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fillRect(centerX - 10, centerY - 10, 20, 20);
            ctx.restore();
            
            // Use the directional labels manager to render the labels
            directionalLabelsManager.renderDirectionalLabels(
                ctx,
                currentSceneId,
                this.gridToScreen.bind(this),  // Pass the grid-to-screen conversion function
                this.drawIsometricLabel.bind(this) // Pass the label drawing function
            );
            
            // Draw some test labels at fixed screen coordinates for debugging
            console.log("Drawing test labels at fixed screen coordinates");
            this.drawIsometricLabel(ctx, centerX, centerY - 100, "TEST LABEL", "#ff00ff");
            this.drawIsometricLabel(ctx, centerX + 100, centerY, "FIXED POSITION", "#00ffff", 135);
        } catch (error) {
            console.error('Error drawing directional labels:', error);
        }
    }
    
    /**
     * Draw a cyberpunk-style label with isometric perspective
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position of the label
     * @param {number} y - Y position of the label
     * @param {string} text - Text to display
     * @param {string} glowColor - Color for the glow effect
     * @param {number} rotation - Rotation angle in degrees (optional)
     */
    drawIsometricLabel(ctx, x, y, text, glowColor, rotation = 0) {
        // Save context for transformations
        ctx.save();

        // First move to the target position
        ctx.translate(x, y);
        
        // Special case for northwest wall alignment (parallel to the northwest wall)
        if (rotation === 135) {
            // This rotation value is a signal to align perpendicular to the floor in isometric view
            
            // Apply a rotation that makes the label appear perpendicular to the isometric floor
            ctx.rotate(-Math.PI / 6.2); // Keep the current rotation angle
            
            // Apply a custom transform to make the label perpendicular to the floor
            // This replaces the simple scaling with a complete transform
            ctx.transform(
                1.7,    // Horizontal scaling
                0.1,    // Horizontal skewing (reduced to flatten)
                1.2,   // Vertical skewing (adjusted for perpendicular appearance)
                1.2,    // Vertical scaling
                0,      // Horizontal translation
                0       // Vertical translation
            );
            
            // Adjust position to align with floor grid
            ctx.translate(0, 3);
            
            // Text style
            ctx.font = 'bold 8px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate text width
            const textWidth = ctx.measureText(text).width;
            
            // Draw background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Border
            ctx.lineWidth = 1;
            ctx.strokeStyle = glowColor;
            ctx.strokeRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Glow effects
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#000000';
            ctx.fillText(text, 0, 0);
            
            ctx.shadowBlur = 5;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, 0, 0);
            
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 0, 0);
            
            // Circuit decorations
            ctx.beginPath();
            ctx.moveTo(-textWidth/1.5 - 5, -6);
            ctx.lineTo(-textWidth/1.5 - 15, -6);
            ctx.moveTo(-textWidth/1.5 - 5, 6);
            ctx.lineTo(-textWidth/1.5 - 15, 6);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(textWidth/1.5 + 5, -6);
            ctx.lineTo(textWidth/1.5 + 15, -6);
            ctx.moveTo(textWidth/1.5 + 5, 6);
            ctx.lineTo(textWidth/1.5 + 15, 6);
            ctx.stroke();
        } else if (rotation === 45) {
            // Special case for labels on NW walls (45° looks better than 90°)
            // Apply rotation first
            ctx.rotate(Math.PI / 4); // 45 degrees in radians
            
            // Scale differently to account for perspective
            ctx.scale(0.8, 0.8);
            
            // Calculate text width for background
            ctx.font = 'bold 9px "Courier New", monospace';
            const textWidth = ctx.measureText(text).width;
            
            // Draw background panel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Draw border
            ctx.lineWidth = 1;
            ctx.strokeStyle = glowColor;
            ctx.strokeRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Styling
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Apply glow effects
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#000000';
            ctx.fillText(text, 0, 0);
            
            // Inner text layers
            ctx.shadowBlur = 5;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, 0, 0);
            
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 0, 0);
            
            // Circuit decorations
            ctx.beginPath();
            ctx.moveTo(-textWidth/1.5 - 5, -6);
            ctx.lineTo(-textWidth/1.5 - 15, -6);
            ctx.moveTo(-textWidth/1.5 - 5, 6);
            ctx.lineTo(-textWidth/1.5 - 15, 6);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(textWidth/1.5 + 5, -6);
            ctx.lineTo(textWidth/1.5 + 15, -6);
            ctx.moveTo(textWidth/1.5 + 5, 6);
            ctx.lineTo(textWidth/1.5 + 15, 6);
            ctx.stroke();
        } else {
            // Default for N-S walls - standard isometric transformation
            ctx.transform(
                1,      // Horizontal scaling
                0.5,    // Horizontal skewing
                -1.4,     // Vertical skewing
                0.5,    // Vertical scaling
                0,      // Horizontal translation
                0       // Vertical translation
            );
            
            // Text style
            ctx.font = 'bold 9px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate dimensions
            const textWidth = ctx.measureText(text).width;
            
            // Draw background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Border
            ctx.lineWidth = 1;
            ctx.strokeStyle = glowColor;
            ctx.strokeRect(-textWidth/1.5, -12, textWidth*1.3, 24);
            
            // Text with glow effects
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#000000';
            ctx.fillText(text, 0, 0);
            
            ctx.shadowBlur = 5;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, 0, 0);
            
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 0, 0);
            
            // Circuit decorations
            ctx.beginPath();
            ctx.moveTo(-textWidth/1.5 - 5, -6);
            ctx.lineTo(-textWidth/1.5 - 15, -6);
            ctx.moveTo(-textWidth/1.5 - 5, 6);
            ctx.lineTo(-textWidth/1.5 - 15, 6);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(textWidth/1.5 + 5, -6);
            ctx.lineTo(textWidth/1.5 + 15, -6);
            ctx.moveTo(textWidth/1.5 + 5, 6);
            ctx.lineTo(textWidth/1.5 + 15, 6);
            ctx.stroke();
        }
        
        // Log for debugging
        console.log(`Drew isometric "${text}" label at ${x},${y} with rotation ${rotation}°`);
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Convert grid coordinates to screen coordinates
     * @param {number} gridX - X coordinate in grid
     * @param {number} gridY - Y coordinate in grid
     * @returns {Object} Object with x and y screen coordinates
     */
    gridToScreen(gridX, gridY) {
        // Convert grid coordinates to isometric screen coordinates
        // Use the canvas dimensions to properly center
        const centerX = 400; // Canvas center X
        const centerY = 300; // Canvas center Y
        
        // Scale factor for grid to pixel conversion
        const scaleX = 64; // Width of grid cell in pixels
        const scaleY = 32; // Height of grid cell in pixels
        
        // Convert from grid to isometric coordinates
        const isoX = (gridX - gridY) * (scaleX / 2);
        const isoY = (gridX + gridY) * (scaleY / 2);
        
        return { 
            x: centerX + isoX, 
            y: centerY + isoY * 0.5 // Adjust Y scale to match the game's isometric perspective
        };
    }
    
    /**
     * Utility to adjust color brightness for 3D effects
     * @param {string} color - Base color in hex format (#RRGGBB)
     * @param {number} percent - Percent to adjust brightness (-100 to 100)
     * @returns {string} - Adjusted color
     */
    adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + percent));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
        return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
}

export { TestScene };
