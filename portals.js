/**
 * Portals Module
 * Handles doorway/portal rendering and interaction for scene transitions
 */

class Portal {
    constructor(x, y, targetScene, direction) {
        this.x = x;
        this.y = y;
        this.targetScene = targetScene;
        this.direction = direction;
        
        // Visual properties
        this.width = 1.2;  // Grid units
        this.height = 2.0; // Grid units
        this.zHeight = 0.2; // Slight elevation from ground
        this.pulseAnimation = 0;
        
        // Interaction properties
        this.collisionRadius = 1.0; // Grid units
        this.active = true;
        
        // Direction-specific appearance adjustments
        switch(direction) {
            case 'north':
                this.color = '#00ffcc'; // Cyan
                break;
            case 'south':
                this.color = '#00ccff'; // Blue
                break;
            case 'east':
                this.color = '#ff00cc'; // Magenta
                break;
            case 'west':
                this.color = '#ffcc00'; // Gold
                break;
            default:
                this.color = '#ffffff'; // White (fallback)
        }
    }
    
    /**
     * Update portal animation
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Pulsating glow effect
        this.pulseAnimation = (this.pulseAnimation + deltaTime * 2) % (Math.PI * 2);
    }
    
    /**
     * Render portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} camera - Camera instance
     * @param {object} scene - Scene instance with cell dimensions
     */
    render(ctx, camera, scene) {
        // Convert from scene units to grid units
        const gridX = this.x / scene.cellWidth * 2; // Convert scene x to approximate grid coordinate
        const gridY = this.y / scene.cellHeight * 2; // Convert scene y to approximate grid coordinate
        
        // Calculate isometric position
        const isoX = (gridX - gridY) * (scene.cellWidth / 2);
        const isoY = (gridX + gridY) * (scene.cellHeight / 2);
        
        // Apply camera translation
        const screenX = isoX - camera.x + ctx.canvas.width / 2;
        const screenY = isoY - camera.y + ctx.canvas.height / 2;
        
        // Calculate pulse glow intensity (0.6 - 1.0)
        const glowIntensity = 0.6 + 0.4 * Math.sin(this.pulseAnimation);
        
        // Calculate portal dimensions
        const portalWidth = this.width * scene.cellWidth / 2;
        const portalHeight = this.height * scene.cellHeight;
        
        ctx.save();
        
        // Draw portal base (rectangle with rounded corners)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3 + 0.4 * glowIntensity; // Translucent glow effect
        
        // Create rectangular path with rounded corners
        roundRect(ctx, screenX - portalWidth / 2, screenY - portalHeight, portalWidth, portalHeight, 10);
        ctx.fill();
        
        // Draw portal border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = glowIntensity;
        ctx.stroke();
        
        // Draw portal icon based on direction
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        
        // Direction indicator
        let icon = '';
        switch(this.direction) {
            case 'north': icon = '↑'; break;
            case 'south': icon = '↓'; break;
            case 'east': icon = '→'; break;
            case 'west': icon = '←'; break;
            default: icon = '⊕'; // Default portal symbol
        }
        
        ctx.fillText(icon, screenX, screenY - portalHeight / 2);
        
        // Draw target room name
        ctx.font = '12px Arial';
        ctx.fillText(this.targetScene, screenX, screenY - portalHeight / 2 + 20);
        
        ctx.restore();
    }
    
    /**
     * Check if player is colliding with portal
     * @param {number} playerX - Player X position in grid coordinates
     * @param {number} playerY - Player Y position in grid coordinates
     * @returns {boolean} True if player is colliding with portal
     */
    isCollidingWithPlayer(playerX, playerY) {
        if (!this.active) return false;
        
        // Convert portal position from scene units to grid units for comparison
        const gridX = this.x / 32; // Assuming a cellWidth of ~64 for grid conversion
        const gridY = this.y / 16; // Assuming a cellHeight of ~32 for grid conversion
        
        // Simple distance check for collision
        const dx = gridX - playerX;
        const dy = gridY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.collisionRadius;
    }
}

/**
 * Helper function to draw a rectangle with rounded corners
 */
function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

/**
 * Create portal instances for all scene exits
 * @param {Object} scenes - Scene data containing exits
 * @returns {Object} Map of scene IDs to arrays of Portal instances
 */
function createPortalsFromScenes(scenes) {
    const portalsByScene = {};
    
    // Process each scene in the scenes object
    Object.keys(scenes).forEach(sceneId => {
        const scene = scenes[sceneId];
        portalsByScene[sceneId] = [];
        
        // Create a portal for each exit in the scene
        if (scene.exits && Array.isArray(scene.exits)) {
            scene.exits.forEach(exit => {
                if (exit.position && exit.direction && exit.to) {
                    const portal = new Portal(
                        exit.position.x, 
                        exit.position.y,
                        exit.to,
                        exit.direction
                    );
                    portalsByScene[sceneId].push(portal);
                }
            });
        }
    });
    
    return portalsByScene;
}

export { Portal, createPortalsFromScenes };
