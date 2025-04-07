/**
 * Isometric Renderer Module for AI Alchemist's Lair
 * Handles advanced isometric rendering with image assets
 */

import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

/**
 * Handles advanced isometric grid rendering with image-based tiles
 */
class IsometricRenderer {
    constructor() {
        // Track when assets are ready
        this.assetsReady = false;
        this.checkAssetsInterval = setInterval(() => this.checkAssets(), 500);
    }
    
    /**
     * Check if required assets are loaded
     * @returns {boolean} - True if all required assets are loaded
     */
    checkAssets() {
        // Check for required assets
        const hasFloorTile = !!assetLoader.getAsset('floorTile');
        const hasWallTileNE = !!assetLoader.getAsset('wallTileNE');
        const hasWallTileNW = !!assetLoader.getAsset('wallTileNW');
        
        // Update assets ready state
        this.assetsReady = hasFloorTile && hasWallTileNE && hasWallTileNW;
        
        // Log when assets are ready
        if (this.assetsReady) {
            debug('RENDERER', 'Isometric renderer assets loaded');
            clearInterval(this.checkAssetsInterval);
        }
        
        return this.assetsReady;
    }
    
    /**
     * Render a floor tile at the specified isometric position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderFloorTile(ctx, isoX, isoY, tileWidth, tileHeight) {
        const floorTile = assetLoader.getAsset('floorTile');
        
        if (floorTile) {
            // Add a small overlap factor to close gaps between tiles
            const overlapFactor = 1.30; // 30% larger to ensure overlap
            
            // Draw floor tile centered on grid position with overlap
            ctx.drawImage(
                floorTile,
                isoX - (tileWidth * overlapFactor) / 2,
                isoY - (tileHeight * overlapFactor) / 2,
                tileWidth * overlapFactor,
                tileHeight * overlapFactor
            );
        } else {
            // Fallback to drawn floor tile if image isn't loaded yet
            this.renderBasicFloorTile(ctx, isoX, isoY, tileWidth, tileHeight);
        }
    }
    
    /**
     * Render a basic floor tile (fallback when image not loaded)
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderBasicFloorTile(ctx, isoX, isoY, tileWidth, tileHeight) {
        // Create a floor tile path (diamond shape)
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2); // Top point
        ctx.lineTo(isoX + tileWidth / 2, isoY); // Right point
        ctx.lineTo(isoX, isoY + tileHeight / 2); // Bottom point
        ctx.lineTo(isoX - tileWidth / 2, isoY); // Left point
        ctx.closePath();
        
        // Fill with a darker base color
        ctx.fillStyle = '#333333';
        ctx.fill();
        
        // Add grid lines with a subtle cyberpunk glow
        ctx.strokeStyle = '#00ffcc44'; // Cyan with transparency
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add a small marker at the center for reference
        ctx.fillStyle = '#555555';
        ctx.fillRect(isoX - 2, isoY - 2, 4, 4);
    }
    
    /**
     * Render a wall tile at the north edge
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderNorthWall(ctx, isoX, isoY, tileWidth, tileHeight) {
        // Get wall tile from asset loader
        const wallTile = assetLoader.getAsset('wallTileNE');
        const wallHeight = tileHeight * 2; // Make walls twice as tall
        
        // Use overlap factor for consistent sizing
        const overlapFactor = .92;
        
        if (wallTile) {
            // Draw wall tile with increased size
            ctx.drawImage(
                wallTile,
                isoX - (tileWidth * overlapFactor) / 2,
                isoY - (wallHeight * overlapFactor) / 2, // Position higher to account for wall height
                tileWidth * overlapFactor,
                wallHeight * overlapFactor
            );
        } else {
            // Fallback to drawn wall if image isn't loaded yet
            this.renderBasicWall(ctx, isoX, isoY, tileWidth, tileHeight, 'north');
        }
    }
    
    /**
     * Render a wall tile at the west edge
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderWestWall(ctx, isoX, isoY, tileWidth, tileHeight) {
        // Get wall tile from asset loader
        const wallTile = assetLoader.getAsset('wallTileNW');
        const wallHeight = tileHeight * 2; // Make walls twice as tall
        
        // Use overlap factor for consistent sizing
        const overlapFactor = .92;
        
        if (wallTile) {
            // Draw wall tile with increased size
            ctx.drawImage(
                wallTile,
                isoX - (tileWidth * overlapFactor) / 2,
                isoY - (wallHeight * overlapFactor) / 2, // Position higher to account for wall height
                tileWidth * overlapFactor,
                wallHeight * overlapFactor
            );
        } else {
            // Fallback to drawn wall if image isn't loaded yet
            this.renderBasicWall(ctx, isoX, isoY, tileWidth, tileHeight, 'west');
        }
    }
    
    /**
     * Render a basic wall (fallback when image not loaded)
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     * @param {string} direction - Wall direction ('north' or 'west')
     */
    renderBasicWall(ctx, isoX, isoY, tileWidth, tileHeight, direction) {
        const wallHeight = 40; // Height of walls in pixels
        
        // Get wall base color and highlight color
        const wallBaseColor = '#222255'; // Dark blue base
        const wallHighlightColor = '#00ffcc'; // Cyan highlight
        
        // Draw the top face of the wall
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2); // Top point
        ctx.lineTo(isoX + tileWidth / 2, isoY); // Right point
        ctx.lineTo(isoX, isoY + tileHeight / 2); // Bottom point
        ctx.lineTo(isoX - tileWidth / 2, isoY); // Left point
        ctx.closePath();
        
        // Fill with wall color
        ctx.fillStyle = wallBaseColor;
        ctx.fill();
        
        // Add grid lines with a bright highlight
        ctx.strokeStyle = `${wallHighlightColor}88`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the vertical face of the wall
        ctx.beginPath();
        
        if (direction === 'north') {
            // North wall - left side drawn 
            ctx.moveTo(isoX - tileWidth / 2, isoY); // Left corner
            ctx.lineTo(isoX, isoY + tileHeight / 2); // Bottom corner
            ctx.lineTo(isoX, isoY + tileHeight / 2 - wallHeight); // Bottom corner raised
            ctx.lineTo(isoX - tileWidth / 2, isoY - wallHeight); // Left corner raised
            
            // Fill with a slightly lighter shade
            ctx.fillStyle = this.adjustBrightness(wallBaseColor, 10);
        } else {
            // West wall - right side drawn
            ctx.moveTo(isoX + tileWidth / 2, isoY); // Right corner
            ctx.lineTo(isoX, isoY + tileHeight / 2); // Bottom corner
            ctx.lineTo(isoX, isoY + tileHeight / 2 - wallHeight); // Bottom corner raised
            ctx.lineTo(isoX + tileWidth / 2, isoY - wallHeight); // Right corner raised
            
            // Fill with a slightly lighter shade
            ctx.fillStyle = this.adjustBrightness(wallBaseColor, 20);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add glow effect
        ctx.strokeStyle = `${wallHighlightColor}66`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    /**
     * Render a doorway at the specified position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - X position in isometric space
     * @param {number} isoY - Y position in isometric space
     * @param {number} tileWidth - Width of a tile
     * @param {number} tileHeight - Height of a tile
     * @param {string} direction - Direction of the door ('NE' or 'NW')
     * @param {boolean} isOpen - Whether the door is open
     * @param {boolean} doubleHeight - Whether to render a multi-height door
     */
    renderDoorway(ctx, isoX, isoY, tileWidth, tileHeight, direction, isOpen = false, doubleHeight = false, currentSceneId = '') {
        // Block west wall doors (NW direction) to implement complete west wall door removal
        if (direction === 'NW') {
            console.log('West wall door rendering blocked - NW doors have been completely removed');
            return;
        }
        
        // Debug door state for other doors that are still allowed
        console.log(`Rendering door: direction=${direction}, isOpen=${isOpen}`);
        
        // Calculate wall height for consistent dimensions - increased for better visibility
        const wallHeight = tileHeight * 6.5; // Increased height for better door visibility
        const overlapFactor = .9; // Increased from 2.0 to make door larger and overlap walls
        const verticalOffset = doubleHeight ? -tileHeight * 0.85 : -3; // Added slight upward shift
        
        // Store screen coordinates for use with Coming Soon labels
        const screenX = isoX;
        const screenY = isoY + verticalOffset;
        
        // Check if we need to render a Coming Soon label
        // This direct approach ensures wall doorways in the startRoom show Coming Soon labels
        if (currentSceneId === 'startRoom') {
            console.log('DOORWAY-DEBUG: Wall doorway in startRoom at', screenX, screenY);
            
            // Only proceed if we have the doorway manager available
            if (window.doorwayManager) {
                // Call after a short delay to ensure the door is rendered first
                setTimeout(() => {
                    window.doorwayManager.renderComingSoonOverDoor(ctx, screenX, screenY - 20);
                }, 100);
            }
        }

        // Use the closed door asset as the base (we know this works)
        const doorAssetKey = direction === 'NE' ? 'doorTileNE' : 'doorTileNW';
        const doorTile = assetLoader.getAsset(doorAssetKey);
        
        if (doorTile) {
            // Draw the base door with increased size to ensure it's visible over walls
            // Save context to apply special rendering properties for doors
            ctx.save();
            
            // Apply a slight shadow to help door stand out from background wall
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            
            // Draw the door with enhanced visibility and slight position adjustment
            ctx.drawImage(
                doorTile,
                isoX - (tileWidth * overlapFactor) / 2,
                isoY - (wallHeight * overlapFactor) / 2 + verticalOffset - 5, // Move up slightly
                tileWidth * overlapFactor,
                wallHeight * overlapFactor
            );
            
            ctx.restore();
            
            // If the door should be open, draw a special indicator
            if (isOpen) {
                // Draw a very distinctive open door indication
                ctx.save();
                
                // Draw a bright opening in the door
                ctx.fillStyle = 'rgba(0, 255, 255, 0.7)'; // Cyan for open doors
                
                // Draw the door opening as a rectangle
                const openingWidth = tileWidth * 0.6;
                const openingHeight = wallHeight * 0.7;
                
                ctx.fillRect(
                    isoX - openingWidth/2,
                    isoY - openingHeight/2 + verticalOffset,
                    openingWidth,
                    openingHeight
                );
                
                // Add a text label for clarity during debugging
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('OPEN', isoX, isoY + verticalOffset);
                
                ctx.restore();
            }
        } else {
            // Fallback rendering if door assets aren't available
            ctx.save();
            ctx.fillStyle = isOpen ? 'rgba(0, 200, 255, 0.7)' : 'rgba(200, 100, 0, 0.7)';
            ctx.fillRect(
                isoX - tileWidth / 2,
                isoY - tileHeight + verticalOffset,
                tileWidth,
                tileHeight * 2
            );
            
            // Text indicator
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(isOpen ? 'OPEN' : 'CLOSED', isoX, isoY + verticalOffset);
            
            ctx.restore();
        }
    }
    
    /**
     * Render a fallback door when door assets aren't available
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     * @param {string} direction - Direction of the door ('NE' or 'NW')
     * @param {boolean} isOpen - Whether the door is open
     * @param {boolean} doubleHeight - Whether to render a multi-height door
     */
    renderFallbackDoor(ctx, isoX, isoY, tileWidth, tileHeight, direction, isOpen, doubleHeight = false) {
        const wallHeight = tileHeight * 3.75; // Back to 2-wall-tile height
        const doorColor = '#444466'; // Darker blue-gray
        const doorHighlightColor = '#00ffcc'; // Cyan highlight
        
        // Position door in the middle of the 3-row wall
        const verticalOffset = doubleHeight ? -tileHeight * 0.85 : 0;
        
        // Draw the appropriate wall first (as a base)
        if (direction === 'NE') {
            // For triple-height, draw a custom taller wall
            if (doubleHeight) {
                // Draw a taller north wall
                this.renderNorthWallDouble(ctx, isoX, isoY, tileWidth, tileHeight);
            } else {
                this.renderBasicWall(ctx, isoX, isoY, tileWidth, tileHeight, 'north');
            }
        } else {
            // For triple-height, draw a custom taller wall
            if (doubleHeight) {
                // Draw a taller west wall
                this.renderWestWallDouble(ctx, isoX, isoY, tileWidth, tileHeight);
            } else {
                this.renderBasicWall(ctx, isoX, isoY, tileWidth, tileHeight, 'west');
            }
        }
        
        // Now draw a doorway opening on top of the wall
        const doorWidth = tileWidth * 0.6;
        const doorHeightPixels = wallHeight * 0.7;
        
        // Door vertical position adjustment for proper placement
        const doorYOffset = tileHeight * 0.1 + verticalOffset;
        
        // Create door shape based on direction
        ctx.beginPath();
        
        if (direction === 'NE') {
            // NE door - on north wall (left face)
            if (isOpen) {
                // Door is open - draw it ajar
                ctx.fillStyle = '#000000aa'; // Dark shadow for open doorway
                ctx.fillRect(
                    isoX - tileWidth * 0.3,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.6,
                    doorHeightPixels * 0.8
                );
            } else {
                // Draw closed door
                ctx.fillStyle = doorColor;
                ctx.fillRect(
                    isoX - tileWidth * 0.3,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.6,
                    doorHeightPixels * 0.8
                );
                
                // Door frame
                ctx.strokeStyle = doorHighlightColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    isoX - tileWidth * 0.3,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.6,
                    doorHeightPixels * 0.8
                );
                
                // Door handle
                ctx.fillStyle = doorHighlightColor;
                ctx.beginPath();
                ctx.arc(
                    isoX - tileWidth * 0.2,
                    isoY + doorYOffset,
                    3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            // NW door - on west wall (right face)
            if (isOpen) {
                // Door is open - draw it ajar
                ctx.fillStyle = '#000000aa'; // Dark shadow for open doorway
                ctx.fillRect(
                    isoX + tileWidth * 0.1,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.5,
                    doorHeightPixels * 0.8
                );
            } else {
                // Draw closed door
                ctx.fillStyle = doorColor;
                ctx.fillRect(
                    isoX + tileWidth * 0.1,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.5,
                    doorHeightPixels * 0.8
                );
                
                // Door frame
                ctx.strokeStyle = doorHighlightColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    isoX + tileWidth * 0.1,
                    isoY - doorHeightPixels * 0.4 + doorYOffset,
                    doorWidth * 0.5,
                    doorHeightPixels * 0.8
                );
                
                // Door handle
                ctx.fillStyle = doorHighlightColor;
                ctx.beginPath();
                ctx.arc(
                    isoX + tileWidth * 0.2,
                    isoY + doorYOffset,
                    3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Add glowing doorway effect
        ctx.shadowColor = doorHighlightColor;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.strokeStyle = `${doorHighlightColor}99`;
        ctx.lineWidth = 1;
        if (direction === 'NE') {
            ctx.strokeRect(
                isoX - tileWidth * 0.32,
                isoY - doorHeightPixels * 0.42 + doorYOffset,
                doorWidth * 0.64,
                doorHeightPixels * 0.84
            );
        } else {
            ctx.strokeRect(
                isoX + tileWidth * 0.08,
                isoY - doorHeightPixels * 0.42 + doorYOffset,
                doorWidth * 0.54,
                doorHeightPixels * 0.84
            );
        }
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    /**
     * Render a double-height north wall
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderNorthWallDouble(ctx, isoX, isoY, tileWidth, tileHeight) {
        const wallBaseColor = '#222255'; // Dark blue base
        const wallHighlightColor = '#00ffcc'; // Cyan highlight
        const wallHeight = tileHeight * 5.5; // Taller wall height for 3 rows
        const verticalOffset = -tileHeight * 1.2; // Increased offset for triple height
        
        // Draw the top face of the wall (north wall)
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2 + verticalOffset); // Top corner of tile
        ctx.lineTo(isoX + tileWidth / 2, isoY + verticalOffset); // Right corner of tile
        ctx.lineTo(isoX, isoY + tileHeight / 2 + verticalOffset); // Bottom corner of tile
        ctx.lineTo(isoX - tileWidth / 2, isoY + verticalOffset); // Left corner of tile
        ctx.closePath();
        
        // Fill with wall color
        ctx.fillStyle = wallBaseColor;
        ctx.fill();
        
        // Add grid lines with a bright highlight
        ctx.strokeStyle = `${wallHighlightColor}88`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the vertical face of the north wall
        ctx.beginPath();
        ctx.moveTo(isoX - tileWidth / 2, isoY + verticalOffset); // Left corner
        ctx.lineTo(isoX, isoY + tileHeight / 2 + verticalOffset); // Bottom corner
        ctx.lineTo(isoX, isoY + tileHeight / 2 - wallHeight + verticalOffset); // Bottom corner raised
        ctx.lineTo(isoX - tileWidth / 2, isoY - wallHeight + verticalOffset); // Left corner raised
        ctx.closePath();
        
        // Fill with a slightly lighter shade
        ctx.fillStyle = this.adjustBrightness(wallBaseColor, 10);
        ctx.fill();
        
        // Add glow effect
        ctx.strokeStyle = `${wallHighlightColor}66`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    /**
     * Render a double-height west wall
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} isoX - Isometric X position
     * @param {number} isoY - Isometric Y position
     * @param {number} tileWidth - Width of the tile
     * @param {number} tileHeight - Height of the tile
     */
    renderWestWallDouble(ctx, isoX, isoY, tileWidth, tileHeight) {
        const wallBaseColor = '#222255'; // Dark blue base
        const wallHighlightColor = '#00ffcc'; // Cyan highlight
        const wallHeight = tileHeight * 5.5; // Taller wall height for 3 rows
        const verticalOffset = -tileHeight * 1.2; // Increased offset for triple height
        
        // Draw the top face of the wall (west wall)
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2 + verticalOffset); // Top corner of tile
        ctx.lineTo(isoX + tileWidth / 2, isoY + verticalOffset); // Right corner of tile
        ctx.lineTo(isoX, isoY + tileHeight / 2 + verticalOffset); // Bottom corner of tile
        ctx.lineTo(isoX - tileWidth / 2, isoY + verticalOffset); // Left corner of tile
        ctx.closePath();
        
        // Fill with wall color
        ctx.fillStyle = wallBaseColor;
        ctx.fill();
        
        // Add grid lines with a bright highlight
        ctx.strokeStyle = `${wallHighlightColor}88`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the vertical face of the west wall
        ctx.beginPath();
        ctx.moveTo(isoX + tileWidth / 2, isoY + verticalOffset); // Right corner
        ctx.lineTo(isoX, isoY + tileHeight / 2 + verticalOffset); // Bottom corner
        ctx.lineTo(isoX, isoY + tileHeight / 2 - wallHeight + verticalOffset); // Bottom corner raised
        ctx.lineTo(isoX + tileWidth / 2, isoY - wallHeight + verticalOffset); // Right corner raised
        ctx.closePath();
        
        // Fill with a slightly lighter shade
        ctx.fillStyle = this.adjustBrightness(wallBaseColor, 20);
        ctx.fill();
        
        // Add glow effect
        ctx.strokeStyle = `${wallHighlightColor}66`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    /**
     * Utility to adjust color brightness
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

// Create a singleton instance
const isometricRenderer = new IsometricRenderer();

export { isometricRenderer, IsometricRenderer };
