/**
 * Mini-Map module for AI Alchemist's Lair
 * Provides a spatial navigation aid to help with orientation
 */

import { debug } from './utils.js';

class MiniMap {
    constructor(gridWidth, gridHeight, cellWidth, cellHeight, canvasWidth, canvasHeight) {
        // Store grid dimensions and cell size
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        
        // Convert grid dimensions to world pixel dimensions
        this.mapWidth = gridWidth * cellWidth;
        this.mapHeight = gridHeight * cellHeight;
        
        // Store reference canvas dimensions
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Mini-map dimensions and position
        this.width = 150;
        this.height = 150;
        this.padding = 10;
        
        // Position in top right corner instead of top left
        this.x = this.canvasWidth - this.width - this.padding;
        this.y = this.padding;
        
        // For isometric grid, we need to adjust the scaling to maintain proportions
        // Use a scale factor to make the grid representation smaller within the minimap
        const scaleFactor = 3.5; // Increase this value to make the grid appear smaller
        
        const mapDiagonalWidth = (gridWidth + gridHeight) * (cellWidth / 2) * scaleFactor;
        const mapDiagonalHeight = (gridWidth + gridHeight) * (cellHeight / 2) * scaleFactor;
        
        // Calculate scaling factors based on the effective isometric dimensions
        this.scaleX = this.width / mapDiagonalWidth;
        this.scaleY = this.height / mapDiagonalHeight;
        
        // Appearance settings
        this.backgroundColor = 'rgba(0, 0, 0, 0.7)';  // Dark background
        this.borderColor = '#00ffcc';                 // Cyberpunk cyan
        this.playerColor = '#ff3366';                 // Bright magenta-red for player
        this.gridColor = 'rgba(255, 255, 255, 0.15)'; // Subtle grid lines - slightly brighter
        this.viewportColor = '#ffffff';               // White viewport rectangle
        this.borderWidth = 2;
        
        // Toggleable state
        this.visible = false; // Hidden by default, can be toggled with M key
        
        debug('MiniMap initialized', { 
            gridSize: `${gridWidth}x${gridHeight}`,
            dimensions: `${this.width}x${this.height}`,
            position: `${this.x},${this.y}`,
            scale: `${this.scaleX.toFixed(4)}x${this.scaleY.toFixed(4)}`
        });
    }
    
    /**
     * Toggle mini-map visibility
     * @returns {boolean} New visibility state
     */
    toggle() {
        this.visible = !this.visible;
        debug(`Mini-map visibility toggled: ${this.visible ? 'visible' : 'hidden'}`);
        return this.visible;
    }
    
    /**
     * Convert isometric grid position to minimap coordinates
     * @param {number} gridX - X position in grid
     * @param {number} gridY - Y position in grid
     * @returns {Object} x and y coordinates on minimap
     */
    gridToMinimap(gridX, gridY) {
        // First convert grid coordinates to isometric coordinates
        const isoX = (gridX - gridY) * (this.cellWidth / 2);
        const isoY = (gridX + gridY) * (this.cellHeight / 2);
        
        // Calculate the center of the grid in isometric space
        const centerIsoX = (this.gridWidth - this.gridHeight) * (this.cellWidth / 4);
        const centerIsoY = (this.gridWidth + this.gridHeight) * (this.cellHeight / 4);
        
        // Calculate position relative to center, then scale and offset to minimap
        return {
            x: this.x + this.width / 2 + (isoX - centerIsoX) * this.scaleX,
            y: this.y + this.height / 2 + (isoY - centerIsoY) * this.scaleY
        };
    }
    
    /**
     * Render the mini-map
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} playerX - Player X position in grid coordinates
     * @param {number} playerY - Player Y position in grid coordinates
     * @param {Camera} camera - Camera instance
     */
    render(ctx, playerX, playerY, camera) {
        // Skip rendering if not visible
        if (!this.visible) return;
        
        // Save context state
        ctx.save();
        
        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        
        // Background with border
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw grid representation
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 0.5;
        
        // Draw more visible isometric grid
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                const miniPos = this.gridToMinimap(i, j);
                
                // Draw a diamond shape for each grid cell
                const cellSize = 0.8; // Size of the cell representation - reduced further to match new scale
                
                ctx.beginPath();
                // Draw diamond (rhombus) shape to represent isometric cell
                ctx.moveTo(miniPos.x, miniPos.y - cellSize);
                ctx.lineTo(miniPos.x + cellSize, miniPos.y);
                ctx.lineTo(miniPos.x, miniPos.y + cellSize);
                ctx.lineTo(miniPos.x - cellSize, miniPos.y);
                ctx.closePath();
                
                // Fill with a subtle color
                ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
                ctx.fill();
                
                // Stroke the outline
                ctx.stroke();
            }
        }
        
        // Draw player position
        const playerMiniPos = this.gridToMinimap(playerX, playerY);
        ctx.fillStyle = this.playerColor;
        ctx.beginPath();
        ctx.arc(playerMiniPos.x, playerMiniPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw camera viewport rectangle
        ctx.strokeStyle = this.viewportColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]); // Dashed line for viewport
        
        // Convert camera position to isometric coordinates
        const cameraIsoX = camera.x;
        const cameraIsoY = camera.y;
        
        // Calculate the center for the viewport rectangle
        const centerMiniX = this.x + this.width / 2;
        const centerMiniY = this.y + this.height / 2;
        
        // Calculate viewport size in minimap space
        // Maintain aspect ratio of the canvas
        const aspect = camera.width / camera.height;
        
        // Base size adjusted by zoom level - as zoom increases, viewport size decreases
        const baseViewportHeight = this.height / 3; // Use 1/3 of minimap height for viewport
        
        // Adjust viewport size based on zoom level
        // When zoomed in (zoom > 1), we see less of the world, so viewport should be smaller
        // When zoomed out (zoom < 1), we see more of the world, so viewport should be larger
        const viewportHeight = baseViewportHeight / camera.zoom;
        const viewportWidth = viewportHeight * aspect;
        
        // Calculate offset from center based on camera position
        const offsetX = (cameraIsoX - camera.targetX) * this.scaleX;
        const offsetY = (cameraIsoY - camera.targetY) * this.scaleY;
        
        // Draw viewport rectangle centered on player's position with camera offset
        let vpX = playerMiniPos.x - viewportWidth / 2 + offsetX;
        let vpY = playerMiniPos.y - viewportHeight / 2 + offsetY;
        
        // Create clip region for the minimap
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();
        
        // Draw the viewport rectangle (will be clipped to minimap boundaries)
        ctx.strokeRect(
            vpX, 
            vpY, 
            viewportWidth, 
            viewportHeight
        );
        
        // Add legend/title
        ctx.font = '10px monospace';
        ctx.fillStyle = this.borderColor;
        ctx.textAlign = 'center';
        ctx.fillText('MINI-MAP', this.x + this.width/2, this.y - 3);
        
        // Add key tip
        ctx.font = '8px monospace';
        ctx.fillText('Press M to toggle', this.x + this.width/2, this.y + this.height + 10);
        
        // Reset line dash and restore context
        ctx.setLineDash([]);
        ctx.restore();
    }
}

export { MiniMap };
