/**
 * SpatialGrid module for AI Alchemist's Lair
 * Implements spatial partitioning for efficient collision detection
 * Optimized for isometric coordinate system
 */

import { debug, info } from './utils.js';

class SpatialGrid {
    /**
     * Creates a new spatial grid for efficient entity queries
     * @param {number} cellSize - Size of each grid cell in world units
     * @param {number} cellWidth - Width of isometric cell in pixels
     * @param {number} cellHeight - Height of isometric cell in pixels
     */
    constructor(cellSize, cellWidth = 64, cellHeight = 32) {
        this.cellSize = cellSize;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.grid = new Map();
        this.neighborOffsets = [];
        
        // Pre-calculate neighbor cell offsets for efficient lookup
        // Include current cell and all 8 surrounding cells
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                this.neighborOffsets.push({x, y});
            }
        }
    }

    /**
     * Get the cell key for an entity in isometric space
     * @param {Entity} entity - The entity to get the cell for
     * @returns {string} The cell key
     */
    getCellKey(entity) {
        if (!entity) return "0,0";
        
        // Ensure we have valid coordinates
        const x = entity.x || 0;
        const y = entity.y || 0;
        
        // Round to nearest cell to avoid grid alignment issues
        // This ensures entities are placed in the cell they visually appear in
        const cellX = Math.round(x / this.cellSize);
        const cellY = Math.round(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    /**
     * Get world cell coordinates from world position
     * @param {number} x - World x position
     * @param {number} y - World y position
     * @returns {Object} Cell coordinates {x, y}
     */
    worldToCell(x, y) {
        return {
            x: Math.round(x / this.cellSize),
            y: Math.round(y / this.cellSize)
        };
    }
    
    /**
     * Get world position from cell coordinates
     * @param {number} cellX - Cell x coordinate
     * @param {number} cellY - Cell y coordinate
     * @returns {Object} World position {x, y} (center of cell)
     */
    cellToWorld(cellX, cellY) {
        return {
            x: (cellX + 0.5) * this.cellSize,
            y: (cellY + 0.5) * this.cellSize
        };
    }
    
    /**
     * Convert world coordinates to isometric coordinates
     * @param {number} worldX - World x coordinate
     * @param {number} worldY - World y coordinate
     * @returns {Object} Isometric coordinates {x, y}
     */
    worldToIso(worldX, worldY) {
        return {
            x: (worldX - worldY) * (this.cellWidth / 2) / this.cellSize,
            y: (worldX + worldY) * (this.cellHeight / 2) / this.cellSize
        };
    }
    
    /**
     * Convert isometric coordinates to world coordinates
     * @param {number} isoX - Isometric x coordinate
     * @param {number} isoY - Isometric y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    isoToWorld(isoX, isoY) {
        // Isometric conversion matrix inversion
        const determinant = this.cellWidth * this.cellHeight / 4;
        
        return {
            x: (isoX * this.cellHeight + isoY * this.cellWidth) / (2 * determinant) * this.cellSize,
            y: (isoY * this.cellWidth - isoX * this.cellHeight) / (2 * determinant) * this.cellSize
        };
    }

    /**
     * Add an entity to the spatial grid
     * @param {Entity} entity - The entity to add
     */
    addEntity(entity) {
        const key = this.getCellKey(entity);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }

    /**
     * Get all entities in the same cell as the given entity
     * @param {Entity} entity - The entity to check
     * @returns {Array} Array of entities in the same cell
     */
    getNearbyEntities(entity) {
        const key = this.getCellKey(entity);
        const result = this.grid.get(key) || [];
        return result.filter(e => e !== entity);
    }

    /**
     * Get all entities in the same cell as the given entity and in neighboring cells
     * @param {Entity} entity - The entity to check
     * @param {number} range - Range in grid cells to check (default: 2)
     * @returns {Array} Array of entities in the same and neighboring cells
     */
    getSurroundingEntities(entity, range = 2) {
        if (!entity) return [];
        
        const result = [];
        // Use the same rounding method as getCellKey for consistency
        const entityCellX = Math.round((entity.x || 0) / this.cellSize);
        const entityCellY = Math.round((entity.y || 0) / this.cellSize);
        
        // Check current cell and cells within range
        for (let offsetX = -range; offsetX <= range; offsetX++) {
            for (let offsetY = -range; offsetY <= range; offsetY++) {
                const neighborX = entityCellX + offsetX;
                const neighborY = entityCellY + offsetY;
                const neighborKey = `${neighborX},${neighborY}`;
                
                const entitiesInCell = this.grid.get(neighborKey);
                if (entitiesInCell) {
                    // Filter out the entity itself and avoid duplicates
                    entitiesInCell.forEach(e => {
                        if (e !== entity && !result.includes(e)) {
                            result.push(e);
                        }
                    });
                }
            }
        }
        
        return result;
    }

    /**
     * Clear all entities from the grid
     */
    clear() {
        // Reset the grid to an empty Map
        this.grid = new Map();
        // Reduce verbosity - only log once when specifically requested
        // info('Spatial grid cleared');
    }
    
    /**
     * Gets the number of cells in the grid
     * @returns {number} Number of cells
     */
    getCellCount() {
        return this.grid.size;
    }

    /**
     * Gets the total number of entities in the grid
     * @returns {number} Total entity count
     */
    getEntityCount() {
        let count = 0;
        for (const entities of this.grid.values()) {
            count += entities.length;
        }
        return count;
    }
    
    /**
     * Updates the cell width and height based on scene values
     * @param {number} cellWidth - Width of isometric cell in pixels
     * @param {number} cellHeight - Height of isometric cell in pixels
     */
    updateCellDimensions(cellWidth, cellHeight) {
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
    }
}

export { SpatialGrid };
