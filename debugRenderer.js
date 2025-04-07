/**
 * Debug Renderer module for AI Alchemist's Lair
 * Provides visualization tools for collision detection, spatial grid, and other debug features
 */

import { debug } from './utils.js';

class DebugRenderer {
    constructor() {
        // Debug render state
        this.showCollisionBoxes = false;
        this.showSpatialGrid = false;
        this.showEntityInfo = false;
        this.showFPS = true;
    }

    /**
     * Toggles debug rendering features
     * @param {string} feature - Feature to toggle ('collision', 'grid', 'info', 'fps')
     */
    toggleFeature(feature) {
        switch (feature.toLowerCase()) {
            case 'collision':
                this.showCollisionBoxes = !this.showCollisionBoxes;
                debug(`Collision boxes ${this.showCollisionBoxes ? 'enabled' : 'disabled'}`);
                break;
            case 'grid':
                this.showSpatialGrid = !this.showSpatialGrid;
                debug(`Spatial grid ${this.showSpatialGrid ? 'enabled' : 'disabled'}`);
                break;
            case 'info':
                this.showEntityInfo = !this.showEntityInfo;
                debug(`Entity info ${this.showEntityInfo ? 'enabled' : 'disabled'}`);
                break;
            case 'fps':
                this.showFPS = !this.showFPS;
                debug(`FPS counter ${this.showFPS ? 'enabled' : 'disabled'}`);
                break;
            default:
                debug(`Unknown debug feature: ${feature}`);
        }
    }
    
    /**
     * Draws all entity collision boxes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} entities - Array of entities
     * @param {Object} player - Player entity
     * @param {Object} camera - Camera for viewport transformation
     * @param {Object} scene - Scene for coordinate transformation
     */
    drawCollisionBoxes(ctx, entities, player, camera, scene) {
        if (!this.showCollisionBoxes) return;
        
        // Process all entities including player
        const allEntities = [...(entities || [])];
        if (player && !allEntities.includes(player)) {
            allEntities.push(player);
        }
        
        // Draw collision boxes for all entities
        for (const entity of allEntities) {
            if (entity) {
                this.drawEntityCollisionBox(ctx, entity, scene);
            }
        }
    }
    
    /**
     * Draw collision box for a single entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} entity - Entity to draw collision box for
     * @param {TestScene} scene - Scene instance
     */
    drawEntityCollisionBox(ctx, entity, scene) {
        if (!entity) return;
        
        try {
            // Get entity position and dimensions
            const x = entity.x || 0;
            const y = entity.y || 0;
            
            // Apply 10% size increase to match collision system
            const width = (entity.width || 0.5) * scene.cellWidth * 1.1;
            const height = (entity.height || 0.5) * scene.cellHeight * 1.1;
            const z = entity.z || 0;
            const zHeight = entity.zHeight || 0.5;
            
            // Convert to isometric coordinates
            const isoX = (x - y) * (scene.cellWidth / 2);
            const isoY = (x + y) * (scene.cellHeight / 2);
            
            // Calculate Z offset for height
            const zOffset = z * scene.cellHeight;
            const zHeightPx = zHeight * scene.cellHeight;
            
            // Save context state
            ctx.save();
            
            // 1. Draw ground-level shadow/footprint for improved collision visualization
            ctx.strokeStyle = 'rgba(0, 200, 0, 0.6)'; // Green for ground level
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Dashed line for the ground footprint
            
            // Draw ground-level box
            ctx.beginPath();
            ctx.moveTo(isoX - width/2, isoY);
            ctx.lineTo(isoX, isoY + height/2);
            ctx.lineTo(isoX + width/2, isoY);
            ctx.lineTo(isoX, isoY - height/2);
            ctx.closePath();
            ctx.stroke();
            
            // Add ground shadow fill with very slight opacity
            ctx.fillStyle = 'rgba(0, 200, 0, 0.1)';
            ctx.fill();
            
            // 2. Draw the actual 3D collision box
            ctx.strokeStyle = entity.isPlayer ? 'rgba(0, 255, 255, 0.8)' : 'rgba(255, 165, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]); // Solid line for the actual collision volume
            
            // Draw bottom of collision box
            ctx.beginPath();
            ctx.moveTo(isoX - width/2, isoY);
            ctx.lineTo(isoX, isoY + height/2);
            ctx.lineTo(isoX + width/2, isoY);
            ctx.lineTo(isoX, isoY - height/2);
            ctx.closePath();
            ctx.stroke();
            
            // Draw top of collision box
            ctx.beginPath();
            ctx.moveTo(isoX - width/2, isoY - zHeightPx);
            ctx.lineTo(isoX, isoY + height/2 - zHeightPx);
            ctx.lineTo(isoX + width/2, isoY - zHeightPx);
            ctx.lineTo(isoX, isoY - height/2 - zHeightPx);
            ctx.closePath();
            ctx.stroke();
            
            // Draw vertical edges connecting top and bottom
            ctx.beginPath();
            ctx.moveTo(isoX - width/2, isoY);
            ctx.lineTo(isoX - width/2, isoY - zHeightPx);
            ctx.moveTo(isoX, isoY + height/2);
            ctx.lineTo(isoX, isoY + height/2 - zHeightPx);
            ctx.moveTo(isoX + width/2, isoY);
            ctx.lineTo(isoX + width/2, isoY - zHeightPx);
            ctx.moveTo(isoX, isoY - height/2);
            ctx.lineTo(isoX, isoY - height/2 - zHeightPx);
            ctx.stroke();
            
            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error("Error drawing collision box:", error);
        }
    }
    
    /**
     * Renders spatial grid cells for visualization
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {SpatialGrid} spatialGrid - Spatial grid to render
     * @param {Object} camera - Camera for viewport transformation
     * @param {Object} scene - Scene for coordinate transformation
     */
    drawSpatialGrid(ctx, spatialGrid, camera, scene) {
        if (!this.showSpatialGrid || !spatialGrid || !camera || !scene) return;
        
        // Save context for restoration
        ctx.save();
        
        try {
            // Calculate visible grid region (optimized to only draw what's visible)
            const visibleCellsX = Math.ceil(ctx.canvas.width / (scene.cellWidth / 2)) + 4;
            const visibleCellsY = Math.ceil(ctx.canvas.height / (scene.cellHeight / 2)) + 4;
            
            // Calculate player grid cell position (as center point of view)
            // Use the same rounding as in spatialGrid.js for consistency
            const centerGridX = Math.round((camera.target?.x || 0) / spatialGrid.cellSize);
            const centerGridY = Math.round((camera.target?.y || 0) / spatialGrid.cellSize);
            
            // Determine grid boundaries based on visible region
            const startGridX = centerGridX - Math.floor(visibleCellsX / 2);
            const endGridX = centerGridX + Math.floor(visibleCellsX / 2);
            const startGridY = centerGridY - Math.floor(visibleCellsY / 2);
            const endGridY = centerGridY + Math.floor(visibleCellsY / 2);
            
            // Draw grid cells - only the visible ones
            for (let gridX = startGridX; gridX <= endGridX; gridX++) {
                for (let gridY = startGridY; gridY <= endGridY; gridY++) {
                    const key = `${gridX},${gridY}`;
                    const entities = spatialGrid.grid.get(key) || [];
                    
                    // Calculate world position of cell center (use exact center)
                    const worldX = gridX * spatialGrid.cellSize;
                    const worldY = gridY * spatialGrid.cellSize;
                    
                    // Convert to isometric screen coordinates
                    const iso = this.worldToIso(worldX, worldY, scene);
                    
                    // Cell dimensions scaled by cell size (matching the isometric grid)
                    const cellWidth = spatialGrid.cellSize * scene.cellWidth / 2;
                    const cellHeight = spatialGrid.cellSize * scene.cellHeight / 2;
                    
                    // Calculate opacity based on distance from center for a nicer visual effect
                    const distFromCenter = Math.sqrt(
                        Math.pow(gridX - centerGridX, 2) + 
                        Math.pow(gridY - centerGridY, 2)
                    );
                    const opacity = Math.max(0.1, 1 - (distFromCenter / (visibleCellsX / 2)));
                    
                    // Draw diamond shape for grid cell
                    const hasEntities = entities.length > 0;
                    ctx.strokeStyle = hasEntities 
                        ? `rgba(255, 200, 0, ${opacity * 0.8})`
                        : `rgba(0, 255, 0, ${opacity * 0.4})`;
                    ctx.fillStyle = hasEntities 
                        ? `rgba(255, 200, 0, ${opacity * 0.2})`
                        : `rgba(0, 200, 0, ${opacity * 0.1})`;
                    
                    ctx.beginPath();
                    ctx.moveTo(iso.x, iso.y - cellHeight/2);              // Top
                    ctx.lineTo(iso.x + cellWidth/2, iso.y);               // Right
                    ctx.lineTo(iso.x, iso.y + cellHeight/2);              // Bottom
                    ctx.lineTo(iso.x - cellWidth/2, iso.y);               // Left
                    ctx.closePath();
                    
                    ctx.fill();
                    ctx.stroke();
                    
                    // Draw entity count if there are entities in this cell
                    if (entities.length > 0) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${entities.length}`, iso.x, iso.y + 4);
                    }
                    
                    // Draw grid coordinates (only on hover or when explicitly enabled)
                    if (this.showEntityInfo && entities.length > 0) {
                        ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
                        ctx.font = '8px Arial';
                        ctx.fillText(`${gridX},${gridY}`, iso.x, iso.y - 10);
                    }
                }
            }
        } catch (error) {
            // Silently fail for debug visualization - this prevents errors from breaking the game
            console.warn('Error in spatial grid visualization:', error);
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Converts world coordinates to isometric screen coordinates
     * @param {number} x - World x coordinate
     * @param {number} y - World y coordinate
     * @param {Object} scene - Scene for coordinate transformation
     * @returns {Object} Isometric screen coordinates {x, y}
     */
    worldToIso(x, y, scene) {
        // Ensure x, y, and scene are properly defined
        if (x === undefined || y === undefined || !scene) {
            return { x: 0, y: 0 };
        }
        
        // Use safe access for cellWidth and cellHeight with defaults
        const cellWidth = scene.cellWidth || 64;
        const cellHeight = scene.cellHeight || 32;
        
        return {
            x: (x - y) * (cellWidth / 2),
            y: (x + y) * (cellHeight / 2)
        };
    }
    
    /**
     * Converts isometric screen coordinates to world coordinates
     * @param {number} isoX - Isometric screen x coordinate
     * @param {number} isoY - Isometric screen y coordinate
     * @param {Object} scene - Scene for coordinate transformation
     * @returns {Object} World coordinates {x, y}
     */
    isoToWorld(isoX, isoY, scene) {
        // Isometric conversion matrix inversion
        const determinant = scene.cellWidth * scene.cellHeight / 4;
        
        return {
            x: (isoX * scene.cellHeight + isoY * scene.cellWidth) / (2 * determinant),
            y: (isoY * scene.cellWidth - isoX * scene.cellHeight) / (2 * determinant)
        };
    }
    
    /**
     * Draws entity information for debugging
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} entity - Entity to draw info for
     * @param {Object} camera - Camera for viewport transformation
     * @param {Object} scene - Scene for coordinate transformation
     */
    drawEntityInfo(ctx, entity, camera, scene) {
        if (!this.showEntityInfo) return;
        
        // Convert world position to screen position
        const iso = this.worldToIso(entity.x, entity.y, scene);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(iso.x - 60, iso.y - 70, 120, 60);
        
        // Draw entity information
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        
        // Position info
        ctx.fillText(`Pos: (${entity.x.toFixed(1)}, ${entity.y.toFixed(1)})`, iso.x - 55, iso.y - 55);
        
        // Height info
        ctx.fillText(`Height: ${entity.zHeight.toFixed(1)} + ${entity.z.toFixed(2)}`, iso.x - 55, iso.y - 40);
        
        // Velocity info
        ctx.fillText(`Vel: (${entity.velocityX.toFixed(2)}, ${entity.velocityY.toFixed(2)})`, iso.x - 55, iso.y - 25);
        
        // Grounded state
        const groundedColor = entity.isGrounded ? 'lime' : 'red';
        ctx.fillStyle = groundedColor;
        ctx.fillText(`Grounded: ${entity.isGrounded}`, iso.x - 55, iso.y - 10);
    }

    /**
     * Main draw method to render all debug visuals in one call
     * @param {CanvasRenderingContext2D} ctx - Canvas context 
     * @param {Game} game - Game instance with entities
     * @param {Camera} camera - Camera for view transformations
     * @param {Scene} scene - Scene for coordinate transformations
     */
    draw(ctx, game, camera, scene) {
        // Only proceed if valid parameters
        if (!ctx || !game || !camera || !scene) return;
        
        try {
            // Draw collision boxes for all entities
            this.drawCollisionBoxes(ctx, game.entities, game.player, camera, scene);
            
            // Draw spatial grid visualization
            this.drawSpatialGrid(ctx, game.spatialGrid, camera, scene);
            
            // Draw entity info if enabled
            if (this.showEntityInfo) {
                // Draw player info if available
                if (game.player) {
                    this.drawEntityInfo(ctx, game.player, camera, scene);
                }
                
                // Draw info for other entities in view
                for (const entity of game.entities) {
                    if (entity !== game.player) {
                        this.drawEntityInfo(ctx, entity, camera, scene);
                    }
                }
            }
        } catch (error) {
            console.warn('Error in debug rendering:', error);
        }
    }
}

export { DebugRenderer };
