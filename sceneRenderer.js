/**
 * Scene Renderer Module
 * Handles visual rendering of scene objects and elements
 */

import { isSceneTestingActive } from './gameBridge.js';
import { debug } from './utils.js';

// Set to false to disable verbose rendering logs
const VERBOSE_RENDERER_DEBUG = false;

// Helper function to conditionally log only when verbose debugging is enabled
function conditionalDebug(...args) {
    if (VERBOSE_RENDERER_DEBUG) {
        debug(...args);
    }
}

class SceneRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.transitionAnimation = 0;
        this.transitionActive = false;
        this.lastRenderTime = Date.now();
        this.alpha = 1; // Opacity for fade in/out effects
        this.fadeInActive = false;
        
        // Create scene-specific visual settings
        this.sceneVisuals = {
            startRoom: {
                bgColor: '#111122',
                gridColor: '#223344',
                accentColor: '#00ffcc',
                wallColor: '#334455',
                floorColor: '#1a2a3a',
                title: 'AI Alchemist\'s Lair',
                pattern: this.drawHexGrid.bind(this)
            },
            circuitSanctum: {
                bgColor: '#221133',
                gridColor: '#442255',
                accentColor: '#ff00cc',
                wallColor: '#553366',
                floorColor: '#2a1a3a',
                title: 'Circuit Sanctum',
                pattern: this.drawCircuitPattern.bind(this)
            },
            neonPhylactery: {
                bgColor: '#112233',
                gridColor: '#334455',
                accentColor: '#00ccff',
                wallColor: '#335577',
                floorColor: '#1a2a3a',
                title: 'Neon Phylactery',
                pattern: this.drawCircuitPattern.bind(this)
            }
        };
    }

    render(scene) {
        if (!scene) {
            debug('SceneRenderer: Null scene provided to render');
            return;
        }
        
        // Get scene ID
        const sceneId = scene.id;
        
        // Get time elapsed since last render
        const now = Date.now();
        const elapsed = now - this.lastRenderTime;
        this.lastRenderTime = now;
        
        // Get visual settings for this scene (or use defaults)
        const visuals = this.sceneVisuals[sceneId] || this.sceneVisuals.startRoom;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Apply fade-in effect if active
        if (this.fadeInActive) {
            this.ctx.globalAlpha = this.alpha;
        }
        
        // Fill background with the scene's background color
        this.ctx.fillStyle = visuals.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw floor with the scene's floor color - FORCE CANVAS DIMENSIONS
        this.drawFloor(visuals.floorColor);
        
        // Draw scene-specific pattern
        if (visuals.pattern) {
            visuals.pattern(visuals.gridColor);
        }
        
        // Draw walls with the scene's wall color - FORCE CANVAS DIMENSIONS
        this.drawWalls(visuals.wallColor, visuals.accentColor);
        
        // Render portals if the portalRenderer is available - DISABLED
        // We're keeping the doorway functionality but removing the visual representation
        /* 
        if (window.portalRenderer && typeof window.portalRenderer.renderPortals === 'function') {
            // Create grid to pixel conversion function for portals
            const gridToPixel = (gridX, gridY) => {
                // Convert grid coordinates to isometric screen coordinates
                // Add canvas center offset to ensure proper positioning
                const centerX = this.ctx.canvas.width / 2;
                const centerY = this.ctx.canvas.height / 3; // Shift up slightly to match the game's viewpoint
                
                // Scale factor for grid to pixel conversion
                const tileWidth = this.ctx.canvas.width / 15;
                const tileHeight = this.ctx.canvas.height / 15;
                
                // Convert from grid to isometric coordinates
                // For neonPhylactery scene, make a specific adjustment to match (0.0, 5.3)
                if (sceneId === 'neonPhylactery' && gridX === 0 && gridY === 5) {
                    // Hard-code the position for this specific point to ensure it matches
                    return { 
                        x: centerX - 5 * (tileWidth / 2), 
                        y: centerY + 5.3 * (tileHeight / 2)
                    };
                }
                
                // Normal isometric conversion for other coordinates
                const isoX = (gridX - gridY) * (tileWidth / 2);
                const isoY = (gridX + gridY) * (tileHeight / 2);
                
                return { 
                    x: centerX + isoX, 
                    y: centerY + isoY 
                };
            };
            
            // Prepare parameters for portal rendering
            const renderParams = {
                cellWidth: this.ctx.canvas.width / 15,
                cellHeight: this.ctx.canvas.height / 15,
                gridToPixel
            };
            
            // Render portals for the current scene
            window.portalRenderer.renderPortals(this.ctx, sceneId, renderParams);
        }
        */
        
        // Draw scene border
        this.drawSceneBorder(visuals.accentColor);
        
        // Draw scene name with larger, more prominent text
        this.ctx.fillStyle = visuals.accentColor;
        this.ctx.font = '30px monospace';
        this.ctx.fillText(visuals.title, 20, 50);
        
        // HIDDEN: Debug info (scene ID and render counter) is now conditionally rendered
        if (window.DEBUG_MODE) {
            // Add scene ID for debugging 
            this.ctx.font = '16px monospace';
            this.ctx.fillText(`Scene ID: ${sceneId}`, 20, 80);
            
            // Draw refreshing timestamp to confirm rendering is working
            this.ctx.fillText(`Render: ${now % 10000} (Δ: ${elapsed}ms)`, 20, 100);
        }
        
        // Draw objects
        if (scene.objects && scene.objects.length > 0) {
            scene.objects.forEach(object => {
                this.drawObject(object, visuals.accentColor);
            });
        }
        
        // Reset alpha for next drawing operations
        this.ctx.globalAlpha = 1.0;
        
        // Continue fade-in animation if needed
        if (this.fadeInActive && this.alpha < 1) {
            this.alpha += 0.05; // Fade in speed
            if (this.alpha >= 1) {
                this.alpha = 1;
                this.fadeInActive = false;
            } else {
                // Request another render frame to continue the fade-in
                requestAnimationFrame(() => this.render(scene));
            }
        }
    }
    
    /**
     * Draw room floor with a subtle grid pattern
     * @param {string} color - Floor color
     */
    drawFloor(color) {
        // Always use canvas dimensions for consistent rendering
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        // Draw main floor
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw subtle grid pattern on floor
        this.ctx.strokeStyle = `${color}99`; // Semi-transparent version of floor color
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        // Draw horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Draw vertical lines
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw room walls with accent lighting
     * @param {string} wallColor - Main wall color
     * @param {string} accentColor - Accent lighting color
     */
    drawWalls(wallColor, accentColor) {
        // Always use canvas dimensions for consistent rendering
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        const wallThickness = 15;
        
        // Draw the main walls
        this.ctx.fillStyle = wallColor;
        
        // Top wall
        this.ctx.fillRect(0, 0, width, wallThickness);
        
        // Bottom wall
        this.ctx.fillRect(0, height - wallThickness, width, wallThickness);
        
        // Left wall
        this.ctx.fillRect(0, 0, wallThickness, height);
        
        // Right wall
        this.ctx.fillRect(width - wallThickness, 0, wallThickness, height);
        
        // Draw accent lighting along wall edges
        this.ctx.strokeStyle = accentColor;
        this.ctx.lineWidth = 2;
        
        // Inner wall edge with glow
        this.ctx.shadowColor = accentColor;
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        // Top inner edge
        this.ctx.moveTo(wallThickness, wallThickness);
        this.ctx.lineTo(width - wallThickness, wallThickness);
        
        // Right inner edge
        this.ctx.moveTo(width - wallThickness, wallThickness);
        this.ctx.lineTo(width - wallThickness, height - wallThickness);
        
        // Bottom inner edge
        this.ctx.moveTo(width - wallThickness, height - wallThickness);
        this.ctx.lineTo(wallThickness, height - wallThickness);
        
        // Left inner edge
        this.ctx.moveTo(wallThickness, height - wallThickness);
        this.ctx.lineTo(wallThickness, wallThickness);
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw visual markers for room exits
     */
    // Removed the drawExitMarkers method since it's no longer being used
    
    // Start the fade-in animation
    startFadeIn() {
        this.alpha = 0;
        this.fadeInActive = true;
    }
    
    renderErrorScene() {
        // Render an error scene with red indicators
        this.ctx.fillStyle = '#330000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.moveTo(this.ctx.canvas.width, 0);
        this.ctx.lineTo(0, this.ctx.canvas.height);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '30px monospace';
        this.ctx.fillText('ERROR: Invalid Scene Data', 20, 50);
    }
    
    drawSceneBorder(color) {
        const { width, height } = this.ctx.canvas;
        const borderWidth = 8; // Thicker border for visibility
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = borderWidth;
        this.ctx.beginPath();
        this.ctx.rect(
            borderWidth / 2, 
            borderWidth / 2, 
            width - borderWidth, 
            height - borderWidth
        );
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15; // Increased blur for more visibility
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawHexGrid(color) {
        const { width, height } = this.ctx.canvas;
        const hexSize = 30;
        const rows = Math.ceil(height / (hexSize * 1.5));
        const cols = Math.ceil(width / (hexSize * Math.sqrt(3)));
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const offset = row % 2 === 0 ? 0 : hexSize * Math.sqrt(3) / 2;
                const x = col * hexSize * Math.sqrt(3) + offset;
                const y = row * hexSize * 1.5;
                this.drawHexagon(x, y, hexSize, color);
            }
        }
    }
    
    drawCircuitPattern(color) {
        const { width, height } = this.ctx.canvas;
        const spacing = 40;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        // Draw horizontal lines
        for (let y = spacing; y < height; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
            
            // Add circuit nodes
            for (let x = spacing; x < width; x += spacing * 2) {
                if (Math.random() > 0.7) {
                    this.drawCircuitNode(x, y, color);
                }
            }
        }
        
        // Draw vertical lines
        for (let x = spacing; x < width; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }
    
    drawHexagon(x, y, size, color) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            const xPos = x + size * Math.cos(angle);
            const yPos = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(xPos, yPos);
            } else {
                this.ctx.lineTo(xPos, yPos);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawCircuitNode(x, y, color) {
        const size = 5;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glowing effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawObject(object, color) {
        const x = object.position.x * 50 + 100;
        const y = object.position.y * 50 + 100;
        
        // Draw object based on type
        switch (object.type) {
            case 'portal':
                this.drawPortal(x, y, color);
                break;
            case 'item':
                this.drawItem(x, y, color);
                break;
            default:
                this.drawGenericObject(x, y, color);
        }
        
        // Draw label
        this.ctx.fillStyle = color;
        this.ctx.font = '12px monospace';
        this.ctx.fillText(object.id, x - 20, y + 30);
    }
    
    drawPortal(x, y, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add pulsing glow effect
        const pulseAmount = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10 * pulseAmount;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawItem(x, y, color) {
        const size = 10;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.rect(x - size / 2, y - size / 2, size, size);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawGenericObject(x, y, color) {
        const size = 10;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.closePath();
        this.ctx.fill();
    }

    handleInteraction(objectId, sceneManager) {
        const scene = sceneManager.getCurrentScene();
        if (!scene) return;
        
        conditionalDebug("INTERACTION", `Handling interaction with object: ${objectId} in scene: ${scene.id}`);
        
        const object = scene.objects.find(obj => obj.id === objectId);
        if (object) {
            object.interact();
        }
    }
}

export { SceneRenderer };
