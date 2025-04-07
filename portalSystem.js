/**
 * Portal System Module for AI Alchemist's Lair
 * Manages portals connecting scenes and doorways
 */

import { scenes } from './sceneData.js';

class PortalSystem {
    /**
     * Create a new portal system
     * @param {Object} sceneManager - The scene manager instance
     */
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.portals = new Map();
        this.debug = true;
        this.initializePortals();
    }

    /**
     * Initialize portals from scene data
     */
    initializePortals() {
        Object.values(scenes).forEach(scene => {
            if (!scene.exits || !Array.isArray(scene.exits)) return;
            
            scene.exits.forEach(exit => {
                // Create a unique ID for this portal
                const portalId = `${scene.id}-${exit.direction}`;
                
                // Store portal data
                const portalData = {
                    sourceScene: scene.id,
                    targetScene: exit.to,
                    gridX: exit.gridX,
                    gridY: exit.gridY,
                    direction: exit.direction
                };
                
                // Add external URL properties if present
                if (exit.externalUrl) {
                    portalData.externalUrl = exit.externalUrl;
                }
                
                // Add label if present
                if (exit.label) {
                    portalData.label = exit.label;
                }
                
                this.portals.set(portalId, portalData);
                
                if (this.debug) {
                    console.log(`Registered portal: ${portalId} at grid (${exit.gridX},${exit.gridY}) -> ${exit.to}`);
                }
            });
        });
        
        if (this.debug) {
            console.log(`Total portals registered: ${this.portals.size}`);
        }
    }

    /**
     * Get portal by ID
     * @param {string} portalId - The portal ID
     * @returns {Object|null} The portal object or null if not found
     */
    getPortal(portalId) {
        return this.portals.get(portalId) || null;
    }

    /**
     * Get all portals for a scene
     * @param {string} sceneId - The scene ID
     * @returns {Array} Array of portal objects
     */
    getPortalsForScene(sceneId) {
        return Array.from(this.portals.entries())
            .filter(([_, portal]) => portal.sourceScene === sceneId)
            .map(([id, portal]) => ({ id, ...portal }));
    }

    /**
     * Find portals near the player
     * @param {number} playerX - Player's grid X position
     * @param {number} playerY - Player's grid Y position
     * @param {string} currentSceneId - Current scene ID
     * @param {number} proximityThreshold - How close the player needs to be (grid units)
     * @returns {Array} Array of nearby portal IDs
     */
    getNearbyPortals(playerX, playerY, currentSceneId, proximityThreshold = 1) {
        return this.getPortalsForScene(currentSceneId)
            .filter(portal => {
                const dx = Math.abs(portal.gridX - playerX);
                const dy = Math.abs(portal.gridY - playerY);
                return Math.max(dx, dy) <= proximityThreshold;
            })
            .map(portal => portal.id);
    }

    /**
     * Transition the player through a portal
     * @param {string} portalId - ID of the portal to use
     * @param {Object} player - The player object
     * @returns {boolean} Whether the transition was successful
     */
    transitionThroughPortal(portalId, player) {
        const portal = this.portals.get(portalId);
        if (!portal) {
            console.error(`Portal ${portalId} not found`);
            return false;
        }
        
        // Check if this portal leads to a 'comingSoon' scene
        if (portal.targetScene === 'comingSoon') {
            console.log(`Portal ${portalId} leads to a coming soon area. Showing notification instead of transitioning.`);
            
            // Play the 'coming soon' notification sound
            this.playComingSoonSound();
            
            // Don't perform the actual transition
            return false;
        }
        
        // Check for external URL portal (where targetScene === 'externalUrl')
        if (portal.targetScene === 'externalUrl' && portal.externalUrl) {
            console.log(`Portal ${portalId} redirecting to external URL: ${portal.externalUrl}`);
            
            // Create a temporary notification to show the user is leaving
            const notificationText = `Traveling to ${portal.label || 'AI Alchemist\'s Lair'}...`;
            console.log(notificationText);
            
            // For a nice effect - give a short delay before redirecting
            setTimeout(() => {
                window.location.href = portal.externalUrl;
            }, 1000);
            
            return true; // Return true to indicate successful transition
        }

        if (this.debug) {
            console.log(`Transitioning through portal ${portalId} to ${portal.targetScene}`);
        }

        // Find the corresponding entry point in the target scene
        const targetScene = scenes[portal.targetScene];
        if (!targetScene) {
            console.error(`Target scene ${portal.targetScene} not found`);
            return false;
        }

        // Find matching entry portal (exit that points back to our source scene)
        const entryExit = targetScene.exits.find(exit => exit.to === portal.sourceScene);
        
        // Position player based on entry position in target scene
        if (entryExit && entryExit.gridX !== undefined && entryExit.gridY !== undefined) {
            // Position player at the corresponding entry point
            player.x = entryExit.gridX;
            player.y = entryExit.gridY;
            
            // Add a small offset to position player just inside the door
            // This prevents immediately triggering the portal again
            if (entryExit.direction === 'north') {
                player.y += 0.5; // Move slightly down from north door
            } else if (entryExit.direction === 'south') {
                player.y -= 0.5; // Move slightly up from south door
            } else if (entryExit.direction === 'east') {
                player.x -= 0.5; // Move slightly left from east door
            } else if (entryExit.direction === 'west') {
                player.x += 0.5; // Move slightly right from west door
            }
            
            if (this.debug) {
                console.log(`Positioned player at grid (${player.x},${player.y}) in ${portal.targetScene}`);
            }
        } else {
            // Fallback positioning based on direction
            this.positionPlayerAtSceneEntry(player, portal.direction, targetScene);
        }

        // Transition to the target scene
        this.sceneManager.loadScene(portal.targetScene);
        return true;
    }

    /**
     * Position the player at a logical entry point based on direction
     * @param {Object} player - The player object 
     * @param {string} entryDirection - Direction the player is entering from
     * @param {Object} targetScene - The scene being entered
     */
    positionPlayerAtSceneEntry(player, entryDirection, targetScene) {
        // Calculate position based on opposite of entry direction
        switch (entryDirection) {
            case 'north': // Entering from the south
                player.x = 8; // Center
                player.y = 14; // Bottom
                break;
            case 'south': // Entering from the north
                player.x = 8; // Center
                player.y = 1; // Top
                break;
            case 'east': // Entering from the west
                player.x = 1; // Left
                player.y = 6; // Center
                break;
            case 'west': // Entering from the east
                player.x = 14; // Right
                player.y = 6; // Center
                break;
            default:
                player.x = 8; // Center
                player.y = 7; // Center
                break;
        }
        
        if (this.debug) {
            console.log(`Fallback positioning: player at grid (${player.x},${player.y}) in ${targetScene.id}`);
        }
    }

    /**
     * Debug method to list all portals
     */
    debugListPortals() {
        console.log('==== REGISTERED PORTALS ====');
        this.portals.forEach((portal, id) => {
            console.log(`Portal ${id}: ${portal.sourceScene} (${portal.gridX},${portal.gridY}) → ${portal.targetScene}`);
        });
        console.log('==========================');
    }
    
    /**
     * Play a sound effect for the 'Coming Soon' notification
     * Uses Web Audio API to generate a custom sound
     */
    playComingSoonSound() {
        // Check if we already played recently to prevent sound spam
        if (this._lastComingSoonSound && (Date.now() - this._lastComingSoonSound < 2000)) {
            return; // Don't play if we played less than 2 seconds ago
        }
        
        // Record timestamp for cooldown
        this._lastComingSoonSound = Date.now();
        
        // Create audio context
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for primary tone
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.2); // Down to A3
        
        // Create gain node for envelope
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        
        // Create filter for color
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.5);
        
        // Connect nodes: oscillator -> filter -> gain -> output
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Start and stop
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
        
        console.log('Playing Coming Soon sound effect');
    }
}

// Export singleton
export default PortalSystem;
