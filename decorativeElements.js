/**
 * Decorative Elements Module for AI Alchemist's Lair
 * Handles additional visual elements for specific rooms
 */

class DecorativeElements {
    constructor() {
        this.enabled = true;
        console.log('Simple DecorativeElements module initialized');
    }
    
    /**
     * Render decorative elements for a specific scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {string} sceneId - Current scene ID
     */
    render(ctx, sceneId) {
        if (!this.enabled) return;
        
        console.log('Trying to render decorative elements for scene:', sceneId);
        
        // Add scene-specific decorative elements
        if (sceneId === 'neonPhylactery') {
            console.log('FOUND NEON PHYLACTERY - DRAWING DOORS');
            this.renderNeonPhylacteryDecorations(ctx);
        }
    }
    
    /**
     * Render decorative elements for the neonPhylactery scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    renderNeonPhylacteryDecorations(ctx) {
        try {
            // Save context state
            ctx.save();
            
            // SE Door at (14.0, 5.5) - using direct pixel positioning
            const seDoorX = 550;
            const seDoorY = 350;
            
            // Draw a very visible SE door using basic canvas operations
            this.drawSimpleDoor(ctx, seDoorX, seDoorY, '#ff00ff', 'SE Door');
            
            // SW Door at (7.5, 14.0) - using direct pixel positioning
            const swDoorX = 250;
            const swDoorY = 450;
            
            // Draw a very visible SW door using basic canvas operations
            this.drawSimpleDoor(ctx, swDoorX, swDoorY, '#00ffff', 'SW Door');
            
            // Restore context state
            ctx.restore();
            
            console.log('Neon phylactery decorations rendered successfully');
        } catch (error) {
            console.error('Error rendering decorative elements:', error);
        }
    }
    
    /**
     * Draw a simple door shape to make it very visible for debugging
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Door color
     * @param {string} label - Door label
     */
    drawSimpleDoor(ctx, x, y, color, label) {
        // Draw door frame - make it very visible
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        
        // Draw door shape (arch)
        ctx.beginPath();
        ctx.moveTo(x - 30, y + 40);
        ctx.lineTo(x - 30, y - 20);
        ctx.quadraticCurveTo(x, y - 50, x + 30, y - 20);
        ctx.lineTo(x + 30, y + 40);
        ctx.closePath();
        
        // Fill and stroke
        ctx.fill();
        ctx.stroke();
        
        // Add decorative elements
        ctx.beginPath();
        ctx.arc(x, y - 10, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add label
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 20);
        
        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        console.log(`Drew ${label} at ${x},${y}`);
    }
    
    /**
     * Toggle decorative elements on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log(`Decorative elements ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    }
}

// Create a singleton instance
const decorativeElements = new DecorativeElements();

export default decorativeElements;
