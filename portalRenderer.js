/**
 * Portal Renderer for AI Alchemist's Lair
 * Renders portals with a medieval-cyberpunk aesthetic
 */

import { scenes } from './sceneData.js';

class PortalRenderer {
    /**
     * Create a new portal renderer
     * @param {Object} portalSystem - The portal system instance
     */
    constructor(portalSystem) {
        this.portalSystem = portalSystem;
        this.pulseTime = 0;
        
        // Portal visual properties
        this.portalColors = {
            north: { base: '#0af', glow: '#0ff' },
            south: { base: '#0f8', glow: '#0fa' },
            east: { base: '#f0a', glow: '#f0f' },
            west: { base: '#fa0', glow: '#ff0' }
        };
        
        // Z-axis properties for portals
        this.portalZHeight = 0.5;  // Standard portal height
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        // Update pulse animation
        this.pulseTime += deltaTime * 2;
        if (this.pulseTime > Math.PI * 2) {
            this.pulseTime -= Math.PI * 2;
        }
    }
    
    /**
     * Render portals for a scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {string} sceneId - Current scene ID
     * @param {Object} renderParams - Parameters for rendering
     */
    renderPortals(ctx, sceneId, renderParams) {
        // Get all portals for the current scene
        const portals = this.portalSystem.getPortalsForScene(sceneId);
        
        // If no portals, exit early
        if (!portals || portals.length === 0) return;
        
        // Save context state
        ctx.save();
        
        // Draw each portal
        portals.forEach(portal => {
            this.renderPortal(ctx, portal, renderParams);
        });
        
        // Restore context state
        ctx.restore();
    }
    
    /**
     * Render a single portal
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} portal - Portal object
     * @param {Object} renderParams - Parameters for rendering
     */
    renderPortal(ctx, portal, renderParams) {
        // If this is portfolioShowcase scene, don't render portals - we're handling them custom elsewhere
        if (portal.sceneId === 'portfolioShowcase') {
            console.log('Skipping portal rendering for portfolioShowcase scene');
            return;
        }
        
        const { cellWidth, cellHeight, gridToPixel } = renderParams;
        
        // Get portal position in pixels
        const pixelPos = gridToPixel(portal.gridX, portal.gridY);
        
        // Debug - log portal position for alignment verification
        console.log(`Portal ${portal.direction} at grid (${portal.gridX},${portal.gridY}) → pixel (${pixelPos.x},${pixelPos.y})`);
        
        // Get portal colors based on direction
        const colors = this.portalColors[portal.direction] || this.portalColors.north;
        
        // Calculate pulse effect (0-1 range)
        const pulse = (Math.sin(this.pulseTime) * 0.5) + 0.5;
        
        // Draw portal base
        this.drawPortalBase(ctx, pixelPos.x, pixelPos.y, cellWidth, cellHeight, colors, pulse);
        
        // Draw glowing runes around the portal
        this.drawPortalRunes(ctx, pixelPos.x, pixelPos.y, cellWidth, cellHeight, colors, pulse);
        
        // Draw portal label
        this.drawPortalLabel(ctx, pixelPos.x, pixelPos.y, portal.targetScene, cellHeight);
    }
    
    /**
     * Draw the base of the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @param {number} width - Cell width
     * @param {number} height - Cell height
     * @param {Object} colors - Portal colors
     * @param {number} pulse - Pulse animation value (0-1)
     */
    drawPortalBase(ctx, x, y, width, height, colors, pulse) {
        // Draw a glowing cyan circle for the portal base
        const glowRadius = (width * 0.4) * (0.8 + pulse * 0.2);
        
        // Draw outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, colors.base);
        gradient.addColorStop(0.7, colors.glow);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner portal circle
        ctx.fillStyle = colors.base;
        ctx.globalAlpha = 0.7 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * Draw decorative runes around the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @param {number} width - Cell width
     * @param {number} height - Cell height
     * @param {Object} colors - Portal colors
     * @param {number} pulse - Pulse animation value (0-1)
     */
    drawPortalRunes(ctx, x, y, width, height, colors, pulse) {
        // Draw 3-4 small runes around the portal
        const runeCount = 3;
        const runeRadius = width * 0.1;
        const orbitRadius = width * 0.35;
        
        // Save current alpha and composite operation
        const originalAlpha = ctx.globalAlpha;
        
        // Draw each rune
        for (let i = 0; i < runeCount; i++) {
            // Calculate position around the portal
            const angle = (i / runeCount) * Math.PI * 2 + this.pulseTime * 0.5;
            const runeX = x + Math.cos(angle) * orbitRadius;
            const runeY = y + Math.sin(angle) * orbitRadius;
            
            // Draw rune with pulsing glow
            ctx.fillStyle = colors.glow;
            ctx.globalAlpha = 0.6 + pulse * 0.4;
            
            // Draw rune shape (simple shapes that look like magical symbols)
            if (i % 3 === 0) {
                // Triangle rune
                ctx.beginPath();
                ctx.moveTo(runeX, runeY - runeRadius);
                ctx.lineTo(runeX + runeRadius, runeY + runeRadius);
                ctx.lineTo(runeX - runeRadius, runeY + runeRadius);
                ctx.closePath();
                ctx.fill();
            } else if (i % 3 === 1) {
                // Diamond rune
                ctx.beginPath();
                ctx.moveTo(runeX, runeY - runeRadius);
                ctx.lineTo(runeX + runeRadius, runeY);
                ctx.lineTo(runeX, runeY + runeRadius);
                ctx.lineTo(runeX - runeRadius, runeY);
                ctx.closePath();
                ctx.fill();
            } else {
                // Circle rune
                ctx.beginPath();
                ctx.arc(runeX, runeY, runeRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Restore original alpha
        ctx.globalAlpha = originalAlpha;
    }
    
    /**
     * Draw a label for the portal showing its destination
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @param {string} targetScene - Target scene ID
     * @param {number} height - Cell height
     */
    drawPortalLabel(ctx, x, y, targetScene, height) {
        // Get target scene name
        const scene = scenes[targetScene] || {};
        const sceneName = scene.name || targetScene;
        
        // Draw text label
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sceneName, x, y - height * 0.7);
    }
}

export default PortalRenderer;
