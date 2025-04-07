/**
 * Doorways Module
 * Handles rendering and interaction with doorways between rooms
 */

import { scenes } from './sceneData.js';
import { getSceneManager } from './sceneIntegration.js';
import { isometricRenderer } from './isometricRenderer.js';

class Doorway {
    /**
     * Constructor for a new Doorway
     * @param {string} direction - Direction of the doorway ('north', 'south', 'east', 'west')
     * @param {string} targetScene - ID of the scene this doorway leads to
     * @param {number} x - X position of the doorway in screen coordinates
     * @param {number} y - Y position of the doorway in screen coordinates
     */
    constructor(direction, targetScene, x, y) {
        this.direction = direction;
        this.targetScene = targetScene;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.opened = false; // Track if the door has been opened
        this.closed = false; // Track if the door has been closed
        this.activationCooldown = 0;
        this.isWallDoorway = false; // Indicates if this is a wall doorway or a floor portal
        this.wallSide = null;       // 'north' or 'west'
        this.gridX = 0;             // Grid X position (used for wall doorways)
        this.gridY = 0;             // Grid Y position (used for wall doorways)
        this.showDebugInfo = true;  // Always show debug info for doorways
        
        // Entity properties for spatial grid registration
        this.entityType = 'door';   // Type for identification
        this.width = 64;            // Width in pixels
        this.height = 64;           // Height in pixels
        this.zHeight = 2.0;         // Height for Z-axis system (doors are full height)
        this.z = 0;                 // Base Z position
    }
    
    /**
     * Register this doorway in the spatial grid
     * @param {SpatialGrid} spatialGrid - The spatial grid to register in
     */
    registerInSpatialGrid(spatialGrid) {
        if (!spatialGrid) return;
        
        if (this.isWallDoorway) {
            // For wall doorways, use their grid position
            if (this.wallSide === 'north') {
                // Convert grid coordinates to world coordinates for spatial grid
                const worldX = this.gridX * spatialGrid.cellSize;
                const worldY = 0; // North wall is at y=0
                spatialGrid.addEntity(this, worldX, worldY);
                console.log(`Registered north door at grid (${this.gridX},${this.gridY}) in spatial grid at world (${worldX},${worldY})`);
            } else if (this.wallSide === 'west') {
                // Convert grid coordinates to world coordinates for spatial grid
                const worldX = 0; // West wall is at x=0
                const worldY = this.gridY * spatialGrid.cellSize;
                spatialGrid.addEntity(this, worldX, worldY);
                console.log(`Registered west door at grid (${this.gridX},${this.gridY}) in spatial grid at world (${worldX},${worldY})`);
            }
        } else {
            // For regular doorways/portals, use their screen position
            // Convert screen coordinates to world coordinates
            const worldX = this.x; 
            const worldY = this.y;
            spatialGrid.addEntity(this, worldX, worldY);
            console.log(`Registered portal doorway in spatial grid at (${worldX},${worldY})`);
        }
    }
    
    setAppearance() {
        // Set color based on direction
        switch(this.direction) {
            case 'north':
                this.color = '#00ffcc';
                this.icon = '↑';
                break;
            case 'south':
                this.color = '#00ccff';
                this.icon = '↓';
                break;
            case 'east':
                this.color = '#ff00cc';
                this.icon = '→';
                break;
            case 'west':
                this.color = '#ffcc00';
                this.icon = '←';
                break;
            default:
                this.color = '#ffffff';
                this.icon = '⊕';
                break;
        }
    }
    
    /**
     * Update doorway animation
     * @param {number} deltaTime - Time elapsed since last update
     * @param {boolean} isPlayerNear - Whether player is near the doorway
     */
    update(deltaTime, isPlayerNear) {
        // Update pulse animation
        this.pulseTime += deltaTime;
        
        // Open/close door based on player proximity (only for wall doorways)
        if (this.isWallDoorway) {
            // Door state transition - with immediate response for better gameplay feel
            if (isPlayerNear && !this.isOpen) {
                // Open door immediately when player approaches
                this.isOpen = true;
                
                // Reset any pending close timer
                if (this.closeTimeout) {
                    clearTimeout(this.closeTimeout);
                    this.closeTimeout = null;
                }
                
                // Add an opening sound effect here if desired
                // this.playDoorSound('open');
            } else if (!isPlayerNear && this.isOpen) {
                // Close the door with a slight delay for smoother gameplay
                if (!this.closeTimeout) {
                    this.closeTimeout = setTimeout(() => {
                        this.isOpen = false;
                        this.closeTimeout = null;
                        
                        // Add a closing sound effect here if desired
                        // this.playDoorSound('close');
                    }, 800); // 800ms delay for door closing
                }
            }
        }
    }
    
    render(ctx, camera) {
        // Skip doorway rendering if it's a wall doorway (handled by isometric renderer)
        if (this.isWallDoorway) {
            return;
        }
        
        // Convert grid coordinates to screen coordinates
        const screenX = (this.x - camera.x) * camera.zoom + ctx.canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + ctx.canvas.height / 2;
        
        // Calculate pulse intensity (0.5 to 1.0)
        const pulse = 0.5 + (Math.sin(this.pulseTime * 3) + 1) / 4;
        
        // Get canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Draw doorway
        ctx.save();
        
        // Draw glow (larger radius for visibility)
        const glowRadius = this.glowRadius + 10 * pulse;
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, glowRadius
        );
        gradient.addColorStop(0, this.color + 'CC'); // More opaque in center 
        gradient.addColorStop(1, this.color + '00'); // Transparent at edge
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw portal frame (rounded rectangle)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 + 2 * pulse;
        ctx.globalAlpha = 0.8 + 0.2 * pulse;
        
        // Draw rounded rectangle frame
        this.roundRect(
            ctx, 
            screenX - this.width/2, 
            screenY - this.height, 
            this.width, 
            this.height, 
            10
        );
        ctx.stroke();
        
        // Draw direction icon (larger for visibility)
        ctx.fillStyle = this.color;
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8 + 0.2 * pulse;
        ctx.fillText(this.icon, screenX, screenY - this.height/2);
        
        // Draw target room name
        ctx.font = '14px Arial';
        ctx.fillText(this.targetScene, screenX, screenY - this.height/2 + 25);
        
        ctx.restore();
    }
    
    // Helper method to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width/2;
        if (height < 2 * radius) radius = height/2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
    
    // Check if player is colliding with this doorway
    isPlayerColliding(playerX, playerY, cellWidth, cellHeight) {
        // Simple, direct distance-based check using grid coordinates
        const dx = Math.abs(this.gridX - playerX);
        const dy = Math.abs(this.gridY - playerY);
        const distance = Math.sqrt(dx*dx + dy*dy);
        const proximityThreshold = .5; // Generous radius in grid units
        
        // For edge doorways, add additional constraints
        if (this.isWallDoorway) {
            if (this.wallSide === 'north' && playerY > 5) return false;
            if (this.wallSide === 'west' && playerX > 5) return false;
        }
        
        return distance < proximityThreshold;
    }
}

class DoorwayManager {
    constructor() {
        this.doorwaysByScene = {};
        this.activeDoorways = [];
        this.transitionCooldown = 0;
        this.debug = true;
        
        this.initDoorways();
    }
    
    /**
     * Initialize doorways from scene data
     */
    initDoorways() {
        // Get the spatial grid for registration
        const sceneManager = getSceneManager();
        const spatialGrid = sceneManager.currentScene?.spatialGrid;
        
        // Loop through all scenes
        Object.keys(scenes).forEach(sceneName => {
            const scene = scenes[sceneName];
            
            // Create doorways array for this scene
            this.doorwaysByScene[sceneName] = [];
            
            // Process specific scene exits from scene data
            if (scene.exits && Array.isArray(scene.exits)) {
                scene.exits.forEach(exit => {
                    const direction = exit.direction;
                    const targetScene = exit.to;
                    const position = exit.position || {};
                    const gridX = exit.gridX !== undefined ? exit.gridX : (position.x / scene.width * 16);
                    const gridY = exit.gridY !== undefined ? exit.gridY : (position.y / scene.height * 16);
                    
                    // Create a doorway for this exit
                    const doorway = new Doorway(
                        direction, 
                        targetScene, 
                        position.x || 0, 
                        position.y || 0
                    );
                    
                    // Set grid coordinates for this doorway
                    doorway.gridX = gridX;
                    doorway.gridY = gridY;
                    
                    // Configure as a wall doorway if it's on the edge of the grid
                    if (direction === 'north' || direction === 'south' || direction === 'east' || direction === 'west') {
                        doorway.isWallDoorway = true;
                        
                        // Set wall side based on direction
                        if (direction === 'north' || direction === 'south') {
                            doorway.wallSide = 'north';
                        } else if (direction === 'east' || direction === 'west') {
                            doorway.wallSide = 'west';
                        }
                    }
                    
                    // Special case for startRoom east door to match (0.0, 5.3)
                    if (sceneName === 'startRoom' && direction === 'east') {
                        doorway.wallSide = 'west';
                        doorway.gridX = 0;
                        doorway.gridY = 5.3; // Position at (0.0, 5.3) as desired
                        console.log(`Special positioning for startRoom east door: (${doorway.gridX}, ${doorway.gridY})`);
                    }
                    
                    // Special case for neonPhylactery west door - ensure it's properly positioned at (14.0, 6.3)
                    if (sceneName === 'neonPhylactery' && direction === 'west') {
                        doorway.wallSide = 'west';
                        doorway.gridX = 14.0;
                        doorway.gridY = 6.3;
                        console.log(`Special positioning for neonPhylactery west door: (${doorway.gridX}, ${doorway.gridY})`);
                    }
                    
                    // Add this doorway to the scene
                    this.doorwaysByScene[sceneName].push(doorway);
                    
                    // Register this doorway in the spatial grid
                    if (spatialGrid) {
                        doorway.registerInSpatialGrid(spatialGrid);
                    }
                });
            }
            
            if (this.debug) {
                console.log('Doorways initialized:', this.doorwaysByScene);
            }
        });
    }
    
    /**
     * Process and apply doorway to the scene
     * @param {string} sceneName - Scene name
     * @param {object} doorway - Doorway object
     */
    processDoorway(sceneName, doorway) {
        // Ensure doorways collection for this scene exists
        if (!this.doorwaysByScene[sceneName]) {
            this.doorwaysByScene[sceneName] = [];
        }
        
        // Set the ID if not provided
        if (!doorway.id) {
            doorway.id = `doorway_${sceneName}_${this.doorwaysByScene[sceneName].length}`;
        }
        
        // Extract direction, target scene, visibility settings
        const { direction, to, isVisible = true, isWallDoorway = false } = doorway;
        
        // Store the target scene name for rendering labels
        doorway.targetScene = to;
        
        // Log the doorway for debugging
        console.log(`Processing doorway: ${JSON.stringify(doorway)}`);
        
        // Add doorway
        this.doorwaysByScene[sceneName].push(doorway);
    }
    
    /**
     * Get active doorways for a specific scene
     * @param {string} sceneId - Scene ID to get doorways for
     * @returns {Array} Array of doorway objects for the scene
     */
    getActiveDoorsForScene(sceneId) {
        if (!sceneId) return [];
        
        // Return doorways for the specified scene or an empty array if none
        return this.doorwaysByScene[sceneId] || [];
    }
    
    update(deltaTime, playerX, playerY, scene) {
        // Decrease cooldown
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime;
        }
        
        // Get current scene
        const sceneManager = getSceneManager();
        const currentScene = sceneManager.getCurrentScene();
        
        if (!currentScene) return;
        
        // Get doorways for current scene
        this.activeDoorways = this.doorwaysByScene[currentScene.id] || [];
        
        // Disabled general position debug logs to reduce console noise
        // console.log(`Player position: (${playerX.toFixed(2)}, ${playerY.toFixed(2)})`);
        
        // Store doorways that should show "Coming Soon" message
        this.doorsNeedingComingSoon = [];
        
        // Update doorways and check collisions
        this.activeDoorways.forEach(doorway => {
            // Check if player is near the door using the updated isPlayerColliding method
            const isPlayerNear = doorway.isPlayerColliding(playerX, playerY, scene.cellWidth, scene.cellHeight);
            
            // Disabled generic door state logs to reduce console noise
            /*if (doorway.isWallDoorway) {
                console.log(`Door ${doorway.wallSide} at pos ${doorway.wallSide === 'north' ? doorway.gridX : doorway.gridY}: ` + 
                           `${isPlayerNear ? 'PLAYER NEAR' : 'player far'}, ` +
                           `current state: ${doorway.isOpen ? 'OPEN' : 'CLOSED'}`);
            }*/
            
            // Update the doorway with the calculated proximity
            doorway.update(deltaTime, isPlayerNear);
            
            // Check if player is near a doorway
            if (isPlayerNear) {
                // If we're in the start room, mark ALL doorways for "Coming Soon" messages
                if (currentScene.id === 'startRoom') {
                        // Mark doorway by creating a unique identifier based on position rather than object reference
                    const doorId = doorway.wallSide ? `${doorway.wallSide}_${doorway.gridX}_${doorway.gridY}` : `regular_${doorway.gridX}_${doorway.gridY}`;
                    doorway.needsComingSoon = true;
                    doorway.comingSoonId = doorId;
                    
                    // Store identifiers instead of object references
                    if (!this.comingSoonDoorIds) this.comingSoonDoorIds = new Set();
                    this.comingSoonDoorIds.add(doorId);
                    
                    // Add to the array as well (for backward compatibility)
                    this.doorsNeedingComingSoon.push(doorway);
                    
                    console.log('DOORWAY-DEBUG: Marked doorway for Coming Soon', doorId);
                    
                    // Play sound effect (but don't spam it)
                    if (this.transitionCooldown <= 0) {
                        console.log('SHOWING: Coming Soon - This area is under construction!');
                        this.playComingSoonSound();
                        this.transitionCooldown = 3.0; // Seconds before playing sound again
                    }
                }
                // If it's not the start room and this is not a wall doorway, allow transitions
                else if (this.transitionCooldown <= 0 && !doorway.isWallDoorway && currentScene.id !== 'startRoom') {
                    if (this.debug) {
                        console.log(`Player collided with doorway to ${doorway.targetScene}`);
                    }
                    
                    // Load target scene (only if we're not in the startRoom)
                    sceneManager.loadScene(doorway.targetScene);
                    
                    // Set cooldown to prevent rapid transitions
                    this.transitionCooldown = 0.5; // Seconds
                }
            }
        });
    }
    
    /**
     * Show a temporary notification in the center of the screen
     * @param {string} message - The message to display
     * @param {string} color - The color of the message
     */
    showTemporaryNotification(message, color = '#ffffff') {
        // Get the game canvas
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Create a notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'absolute';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.color = color;
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.padding = '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.fontFamily = '"Courier New", monospace';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '24px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = `0 0 20px ${color}`;
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease-in-out';
        
        // Add notification to the body
        document.body.appendChild(notification);
        
        // Play a notification sound effect
        this.playComingSoonSound();
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after a delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }
    
    /**
     * Render an animated "COMING SOON" message over a door in the isometric environment
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {number} alpha - Opacity value (0-1)
     */
    // This method is no longer used directly - we now use scene.js's drawIsometricLabel
    renderComingSoonOverDoor(ctx, x, y, alpha = 1.0) {
        console.log('DOORWAY-DEBUG: Drawing Coming Soon fallback method at', x, y);
        // This method is left as a fallback but shouldn't be called anymore
        // The scene.js drawIsometricLabel method will be used instead
        
        // Save context for safety
        ctx.save();
        
        // Simple text rendering if needed as fallback
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('COMING SOON', x, y - 50);
        
        // Log for debugging
        console.log(`Drew fallback COMING SOON at ${x},${y-50}`);
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Play a sound effect for the 'Coming Soon' notification
     * Uses Web Audio API to generate a custom sound
     * (DISABLED - no longer needed as Coming Soon functionality is removed)
     */
    playComingSoonSound() {
        // Sound function disabled - returning early
        console.log('Coming Soon sound effect disabled');
        return;
        try {
            // Initialize audio context if not already done
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const audioContext = window.audioContext;
            const masterGain = audioContext.createGain();
            masterGain.gain.value = 0.4; // Master volume control
            masterGain.connect(audioContext.destination);
            
            // Create a notification sound - electronic, futuristic "access denied" type sound
            // Main tone - slightly dissonant
            const oscillator1 = audioContext.createOscillator();
            oscillator1.type = 'sawtooth';
            oscillator1.frequency.value = 380; // Higher frequency for alert sound
            
            // Secondary tone
            const oscillator2 = audioContext.createOscillator();
            oscillator2.type = 'square';
            oscillator2.frequency.value = 280;
            
            // Create gain nodes for shaping the sound
            const gain1 = audioContext.createGain();
            const gain2 = audioContext.createGain();
            
            // Connect oscillators to their gain nodes
            oscillator1.connect(gain1);
            oscillator2.connect(gain2);
            
            // Connect gains to master output
            gain1.connect(masterGain);
            gain2.connect(masterGain);
            
            // Set initial gain values
            gain1.gain.value = 0;
            gain2.gain.value = 0;
            
            // Start the oscillators
            const now = audioContext.currentTime;
            oscillator1.start(now);
            oscillator2.start(now);
            
            // Schedule the envelope
            // Quick attack
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.6, now + 0.05);
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.3, now + 0.05);
            
            // First part - hold briefly
            gain1.gain.setValueAtTime(0.6, now + 0.1);
            gain2.gain.setValueAtTime(0.3, now + 0.1);
            
            // Quick decay to zero
            gain1.gain.linearRampToValueAtTime(0, now + 0.3);
            gain2.gain.linearRampToValueAtTime(0, now + 0.3);
            
            // Second part - slight pause then repeat
            gain1.gain.setValueAtTime(0, now + 0.4);
            gain1.gain.linearRampToValueAtTime(0.5, now + 0.45);
            gain2.gain.setValueAtTime(0, now + 0.4);
            gain2.gain.linearRampToValueAtTime(0.25, now + 0.45);
            
            // Final decay
            gain1.gain.linearRampToValueAtTime(0, now + 0.8);
            gain2.gain.linearRampToValueAtTime(0, now + 0.8);
            
            // Pitch bend for effect
            oscillator1.frequency.setValueAtTime(380, now);
            oscillator1.frequency.linearRampToValueAtTime(320, now + 0.3);
            oscillator1.frequency.setValueAtTime(420, now + 0.4);
            oscillator1.frequency.linearRampToValueAtTime(280, now + 0.8);
            
            oscillator2.frequency.setValueAtTime(280, now);
            oscillator2.frequency.linearRampToValueAtTime(240, now + 0.3);
            oscillator2.frequency.setValueAtTime(320, now + 0.4);
            oscillator2.frequency.linearRampToValueAtTime(200, now + 0.8);
            
            // Stop the oscillators
            oscillator1.stop(now + 1.0);
            oscillator2.stop(now + 1.0);
            
            console.log('Coming Soon sound effect played');
            
        } catch (error) {
            console.error('Error playing Coming Soon sound effect:', error);
        }
    }
    
    /**
     * Render Coming Soon labels at all doorway positions in the start room
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    renderAllComingSoonLabels(ctx) {
        // Make sure doorPositions array is initialized
        if (!this.doorPositions) {
            console.log('DOORWAY-DEBUG: doorPositions array is not initialized');
            return;
        }
        
        // Debug log to check doorPositions array
        console.log(`DOORWAY-DEBUG: doorPositions array has ${this.doorPositions.length} items:`, this.doorPositions);
        
        // Get canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // In isometric view, the player is always in the center of the screen
        const playerScreenX = canvasWidth / 2;
        const playerScreenY = canvasHeight / 2;
        
        console.log(`DOORWAY-DEBUG: Player at screen center (${playerScreenX}, ${playerScreenY})`);
        
        // Process each door position
        this.doorPositions.forEach(pos => {
            // Calculate distance to player
            const dx = pos.x - playerScreenX;
            const dy = pos.y - playerScreenY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only show Coming Soon label when player is within proximity distance
            // Use a distance-based alpha to fade in/out smoothly
            const proximityThreshold = 400; // Show when within 400 pixels (increased range)
            const fadeDistance = 150;      // Start fading at 400-150=250 pixels
            
            if (distance < proximityThreshold) {
                // Calculate alpha based on distance (1.0 when close, fades to 0 at threshold)
                let alpha = 1.0;
                
                // If in fade zone, calculate smooth fade
                if (distance > proximityThreshold - fadeDistance) {
                    alpha = 1.0 - ((distance - (proximityThreshold - fadeDistance)) / fadeDistance);
                }
                
                console.log(`DOORWAY-DEBUG: Door at (${pos.x}, ${pos.y}) is visible. Distance: ${distance.toFixed(2)}, Alpha: ${alpha.toFixed(2)}`);
                
                // Render with calculated alpha
                this.renderComingSoonOverDoor(ctx, pos.x, pos.y, alpha);
                
                // Play sound when we're very close (if not played recently)
                if (distance < proximityThreshold / 6 && 
                    (!this._lastComingSoonSound || (Date.now() - this._lastComingSoonSound > 5000))) {
                    this.playComingSoonSound();
                    this._lastComingSoonSound = Date.now();
                    console.log('DOORWAY-DEBUG: Played Coming Soon sound at distance ' + distance.toFixed(2));
                }
            } else {
                console.log(`DOORWAY-DEBUG: Door at (${pos.x}, ${pos.y}) too far. Distance: ${distance.toFixed(2)}`);
            }
        });
    }
    
    /**
     * Render "Coming Soon" message over a door with arcade-style text box
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {number} alpha - Opacity of the message (0-1)
     */
    renderComingSoonOverDoor(ctx, x, y, alpha = 1.0) {
        // Save context
        ctx.save();
        
        // Set the font and alignment
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Measure text for background sizing
        const text = 'COMING SOON';
        const textWidth = ctx.measureText(text).width;
        
        // Draw background
        const paddingX = 20;
        const paddingY = 10;
        const promptWidth = textWidth + paddingX * 2;
        const promptHeight = 30 + paddingY;
        const promptX = x - promptWidth / 2;
        const promptY = y - promptHeight / 2;
        
        // Create arcade-style box with red theme (similar to arcade box but in red)
        // Background with red gradient
        const gradient = ctx.createLinearGradient(promptX, promptY, promptX, promptY + promptHeight);
        gradient.addColorStop(0, `rgba(40, 0, 0, ${0.9 * alpha})`);
        gradient.addColorStop(0.5, `rgba(80, 0, 0, ${0.8 * alpha})`);
        gradient.addColorStop(1, `rgba(40, 0, 0, ${0.9 * alpha})`);
        
        // Draw background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
        
        // Draw border with glowing effect
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);
        
        // Add inner border for arcade style (like the ENTER to Play Games box)
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.7})`;
        ctx.strokeRect(promptX + 3, promptY + 3, promptWidth - 6, promptHeight - 6);
        
        // Draw text with glow effect
        ctx.shadowColor = `rgba(255, 0, 0, ${alpha})`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillText(text, x, y);
        
        // Add secondary glow layer for better visibility
        ctx.shadowBlur = 5;
        ctx.fillStyle = `rgba(255, 180, 180, ${alpha * 0.8})`;
        ctx.fillText(text, x, y);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Render all doorways for a specific scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context 
     * @param {Camera} camera - Camera to render through
     * @param {Object} scene - The current scene
     */
    render(ctx, camera, scene) {
        // Get doorways for current scene
        const currentScene = getSceneManager().getCurrentScene();
        if (!currentScene) return;
        
        const doorways = this.doorwaysByScene[currentScene.id] || [];
        const sceneName = currentScene.id;
        
        // Store door positions for Coming Soon messages
        this.doorPositions = [];
        
        // If we're in the start room, prepare to render Coming Soon messages
        if (sceneName === 'startRoom') {
            console.log('DOORWAY-DEBUG: Adding Coming Soon positions for startRoom');
            // Only show Coming Soon for the NEON PHYLACTERY door now (east door)
            // Drew isometric "NEON PHYLACTERY" label at -230.4,-9.6 with rotation 135°
            // North door (AI Alchemist's Lair) is now enabled and no longer shows Coming Soon
            this.doorPositions.push({ x: -230.4, y: -9.6 });      // NEON PHYLACTERY door position
            
            console.log('DOORWAY-DEBUG: doorPositions array updated:', JSON.stringify(this.doorPositions));
        }
        
        // Keep only essential debug logs for Coming Soon doorway issue
        if (this.doorsNeedingComingSoon && this.doorsNeedingComingSoon.length > 0) {
            console.log('DOORWAY-DEBUG: ComingSoon doors:', this.doorsNeedingComingSoon.length);
        }
        
        // Render each doorway
        doorways.forEach(doorway => {
            doorway.render(ctx, camera);
            
            // For non-wall doorways only (wall doorways skip rendering)
            if (!doorway.isWallDoorway && sceneName === 'startRoom') {
                // Calculate screen position
                const screenX = doorway.screenX;
                const screenY = doorway.screenY;
                
                if (!isNaN(screenX) && !isNaN(screenY)) {
                    // We're now using a simpler approach with standard door labels
                    this.renderDoorLabel(ctx, screenX, screenY, doorway, sceneName);
                }
            }
        });
        // We're moving sound logic to the proximity-based system in renderAllComingSoonLabels
    
    }
    
    /**
     * Render a wall door at the given position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {string} wallSide - Side of the wall (north, east, south, west)
     * @param {number} position - Position along the wall
     * @param {object} sceneData - Current scene data
     */
    renderWallDoor(ctx, wallSide, position, sceneData) {
        // Make sure we have doors data
        if (!this.doors || !this.doors.length) return;
        
        // Find all doors that match this wall and position
        const matchingDoors = this.doors.filter((door) => { 
            return door.isWallDoorway && 
            door.wallSide === wallSide && 
            (wallSide === 'north' ? door.gridX === position : door.gridY === position);
        });
        
        if (!matchingDoors.length) return;
        
        // Calculate the screen position based on the isometric grid
        const currentSceneId = window.location.hash.substring(1) || game?.currentScene || 'startRoom';
        
        // Render each door at this position
        matchingDoors.forEach(door => {
            const originX = door.screenX;
            const originY = door.screenY;
            
            // Render the door
            this.renderDoorAtPosition(ctx, originX, originY, door, currentSceneId);
            
            // Add cyberpunk-style room name label above the door
            this.renderDoorLabel(ctx, originX, originY, door, currentSceneId);
        });
    }
    
    /**
     * Render a door at a specific screen position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context 
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {object} door - Door object data
     * @param {string} currentSceneId - Current scene ID
     */
    renderDoorAtPosition(ctx, x, y, door, currentSceneId) {
        // Safety check
        if (!door || !ctx) return;
        
        // Get direction based on wall side
        let direction = 'N'; // Default
        
        switch (door.wallSide) {
            case 'north': direction = 'S'; break;
            case 'east': direction = 'W'; break;
            case 'south': direction = 'N'; break;
            case 'west': direction = 'E'; break;
        }
        
        // Combine for style - e.g., 'NE', 'SW', etc.
        // Special case - if in neonPhylactery and on SE wall, use NW style
        // if in neonPhylactery and on SW wall, use NE style
        let style = '';
        
        if (currentSceneId === 'neonPhylactery') {
            if (door.gridX === 14.0 && Math.abs(door.gridY - 5.5) < 0.1) {
                style = 'NW'; // Override for SE wall in neonPhylactery
            } else if (Math.abs(door.gridX - 7.5) < 0.1 && door.gridY === 14.0) {
                style = 'NE'; // Override for SW wall in neonPhylactery
            } else {
                style = direction;
            }
        } else {
            style = direction;
        }
        
        // Render the doorway
        isometricRenderer.renderDoorway(
            ctx, 
            x, 
            y, 
            64, // width
            32, // height
            style,
            door.isOpen,
            door.doubleHeight || false
        );
    }
    
    /**
     * Render cyberpunk-style label above the door
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {object} door - Door object data
     * @param {string} currentSceneId - Current scene ID
     */
    renderDoorLabel(ctx, x, y, door, currentSceneId) {
        // Get destination room name
        let destinationId = door.to || door.targetScene;
        
        // Log the door info to help with debugging
        console.log('Rendering door label for door:', door);
        
        // Skip if we don't have a valid destination
        if (!destinationId) {
            console.warn('Door missing destination ID:', door);
            return;
        }
        
        let labelText = '';
        let glowColor = '';
        let showComingSoon = false;
        
        // Check for the comingSoon flag in the exit definition
        if (door.comingSoon) {
            showComingSoon = true;
            glowColor = '#ff3333'; // Red glow for coming soon
        }
        // Also check if this is a doorway in the startRoom that should show 'Coming Soon'
        else if (destinationId === 'comingSoon') {
            showComingSoon = true;
            glowColor = '#ff3333'; // Red glow for coming soon
        }
        // Check if this is one of the wall doorways we want to mark as "coming soon"
        else if (door.isWallDoorway) {
            if ((door.wallSide === 'north' && currentSceneId === 'startRoom') || 
                (door.wallSide === 'west' && currentSceneId === 'startRoom')) {
                // Add coming soon message for the door tiles
                showComingSoon = true;
                glowColor = '#ff3333'; // Red glow for coming soon
            }
        }
        
        // Map scene IDs to display names and assign glow colors
        if (showComingSoon) {
            labelText = 'COMING SOON';
            // Play the sound effect when rendering the coming soon label
            // BUT only if we haven't played it recently (use a cooldown)
            if (!this._lastComingSoonSound || (Date.now() - this._lastComingSoonSound > 2000)) {
                this.playComingSoonSound();
                this._lastComingSoonSound = Date.now();
            }
        } else {
            switch (destinationId) {
                case 'startRoom':
                    labelText = 'NEXUS CORE';
                    glowColor = '#ffd700'; // Gold glow for start room
                    break;
                case 'neonPhylactery':
                    labelText = 'NEON PHYLACTERY';
                    glowColor = '#00ffff'; // Cyan glow
                    break;
                case 'circuitSanctum':
                    labelText = 'CIRCUIT SANCTUM';
                    glowColor = '#ff00ff'; // Magenta glow
                    break;
                default:
                    labelText = destinationId.toUpperCase();
                    glowColor = '#00ffff'; // Default cyan glow
                    break;
            }
        }
        
        // Only proceed if we have a label
        if (!labelText) return;
        
        // Save context
        ctx.save();
        
        // Position label above the door
        const labelX = x;
        const labelY = y - 50; // Position above the door
        
        // Text style - cyberpunk/synthwave aesthetic
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multi-layer glow effect for cyberpunk appearance
        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#000000';
        ctx.fillText(labelText, labelX, labelY + 1);
        
        // Inner glow
        ctx.shadowBlur = 5;
        ctx.fillStyle = glowColor;
        ctx.fillText(labelText, labelX, labelY);
        
        // Core text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, labelX, labelY);
        
        console.log(`Drew "${labelText}" label at ${labelX},${labelY}`);
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Force a specific door to open
     * This is a debugging helper to verify door rendering works properly
     * @param {string} sceneId - Scene ID
     * @param {string} wallSide - Wall side ('north' or 'west')
     * @param {number} doorPosition - Door position on that wall
     * @param {boolean} open - Whether to open or close the door
     */
    forceDoorState(sceneId, wallSide, doorPosition, open) {
        const doorways = this.doorwaysByScene[sceneId] || [];
        
        // Find the matching door
        doorways.forEach((doorway) => {
            if (doorway.isWallDoorway && doorway.wallSide === wallSide) {
                // For north walls, match on gridX
                if (wallSide === 'north' && doorway.gridX === doorPosition) {
                    doorway.isOpen = open;
                    console.log(`DEBUG: Forced ${sceneId} north door at position ${doorPosition} ${open ? 'OPEN' : 'CLOSED'}`);
                }
                // For west walls, match on gridY
                else if (wallSide === 'west' && doorway.gridY === doorPosition) {
                    doorway.isOpen = open;
                    console.log(`DEBUG: Forced ${sceneId} west door at position ${doorPosition} ${open ? 'OPEN' : 'CLOSED'}`);
                }
            }
        });
    }
}

// Create singleton instance
const doorwayManager = new DoorwayManager();

// Export both the instance and the class
export default doorwayManager;
export { DoorwayManager };
