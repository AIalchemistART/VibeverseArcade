/**
 * Directional Labels Module for AI Alchemist's Lair
 * Renders direction labels with arrows pointing back to the startRoom
 */

import { debug } from './utils.js';
import { isSceneTestingActive } from './gameBridge.js';

class DirectionalLabelsManager {
    constructor() {
        // Track initialization
        this.initialized = false;
        
        // Store reference points for directional labels - using small integer values for easy viewing
        this.labelPositions = {
            // Circuit Sanctum (north room) - arrow points south back to startRoom
            circuitSanctum: {
                gridX: 4,   // Positive values should be more easily visible
                gridY: 4,   // Positive values should be more easily visible
                text: 'BACK TO START ROOM',
                color: '#00ffcc', // Cyan color
                rotation: 0,      // No rotation for south-facing label
                arrowDirection: 'south'
            },
            // Neon Phylactery (east room) - arrow points west back to startRoom
            neonPhylactery: {
                gridX: 2,   // Positive values should be more easily visible
                gridY: 3,   // Positive values should be more easily visible
                text: 'BACK TO START ROOM',
                color: '#00ffcc', // Cyan color
                rotation: 135,    // Rotation for west-facing label
                arrowDirection: 'west'
            }
        };
        
        console.log('DirectionalLabelsManager initialized with label positions:', this.labelPositions);
    }
    
    /**
     * Render directional labels for the current scene
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} currentSceneId - ID of the current scene
     * @param {Function} gridToScreenFn - Function to convert grid to screen coordinates
     * @param {Function} drawLabelFn - Function to draw the isometric label
     */
    renderDirectionalLabels(ctx, currentSceneId, gridToScreenFn, drawLabelFn) {
        // Skip if in startRoom - no need for return labels
        if (currentSceneId === 'startRoom') {
            console.log('In startRoom - skipping directional labels');
            return;
        }
        
        console.log(`Attempting to render directional label for scene: ${currentSceneId}`);
        
        // Get label data for the current scene
        const labelData = this.labelPositions[currentSceneId];
        if (!labelData) {
            console.error(`No directional label defined for scene: ${currentSceneId}`);
            return;
        }
        
        console.log(`Rendering directional label for ${currentSceneId} pointing to startRoom:`, labelData);
        
        try {
            // Draw a test label directly at canvas center to verify label drawing works
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            
            // Draw a debug marker at center
            ctx.save();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Convert grid position to screen coordinates
            const screenPos = gridToScreenFn(labelData.gridX, labelData.gridY);
            
            console.log(`Converted grid position (${labelData.gridX}, ${labelData.gridY}) to screen coordinates:`, screenPos);
            
            if (!screenPos) {
                console.error('Could not convert grid position to screen coordinates');
                return;
            }
            
            // Draw a debug marker at the computed position
            ctx.save();
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Draw the label with arrow
            this.drawLabelWithArrow(
                ctx, 
                screenPos.x, 
                screenPos.y, 
                labelData.text, 
                labelData.color, 
                labelData.rotation,
                labelData.arrowDirection,
                drawLabelFn
            );
            
            console.log(`Successfully drew label at screen coordinates (${screenPos.x}, ${screenPos.y})`);
        } catch (error) {
            console.error(`Error rendering directional label for ${currentSceneId}:`, error);
        }
    }
    
    /**
     * Draw a label with an arrow pointing in the specified direction
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Label text
     * @param {string} color - Label color
     * @param {number} rotation - Label rotation
     * @param {string} arrowDirection - Direction for the arrow ('north', 'south', 'east', 'west')
     * @param {Function} drawLabelFn - Function to draw the isometric label
     */
    drawLabelWithArrow(ctx, x, y, text, color, rotation, arrowDirection, drawLabelFn) {
        console.log(`Drawing label with arrow at (${x}, ${y}), text: "${text}", direction: ${arrowDirection}`);
        
        // First draw a visible marker at the exact position
        ctx.save();
        ctx.fillStyle = '#ff00ff'; // Bright magenta for visibility
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Now draw the base label with the correct parameter order
        drawLabelFn(ctx, x, y, text, color, rotation);
        
        // Save context for the arrow drawing
        ctx.save();
        
        // Move to the label position
        ctx.translate(x, y);
        
        // Draw a bright visible arrow regardless of direction
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        // Draw arrow based on direction
        if (arrowDirection === 'south') {
            // Draw a simple vertical arrow pointing down
            ctx.beginPath();
            ctx.moveTo(0, 30);  // Start below the label
            ctx.lineTo(0, 70);  // Draw downward
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(0, 70);  // Arrow tip
            ctx.lineTo(-15, 50); // Left wing
            ctx.lineTo(15, 50);  // Right wing
            ctx.closePath();
            ctx.fill();
        } else if (arrowDirection === 'west') {
            // Draw a simple horizontal arrow pointing left
            ctx.beginPath();
            ctx.moveTo(-30, 0);  // Start to the left of the label
            ctx.lineTo(-70, 0);  // Draw leftward
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(-70, 0);   // Arrow tip
            ctx.lineTo(-50, -15); // Upper wing
            ctx.lineTo(-50, 15);  // Lower wing
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        console.log(`Drew directional arrow for "${text}" at ${x},${y} pointing ${arrowDirection}`);
    }
}

// Create a singleton instance
const directionalLabelsManager = new DirectionalLabelsManager();

export { directionalLabelsManager };
