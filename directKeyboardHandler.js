/**
 * directKeyboardHandler.js - Direct keyboard event handling for Enter key interactions
 * 
 * This script bypasses the normal input handling system and adds a direct document-level
 * event listener that will manually trigger interaction checks for nearby entities when
 * the Enter key is pressed. This is a failsafe measure to ensure that Enter key presses
 * are never missed by interactive entities.
 */

// Create the direct keyboard handler
class DirectKeyboardHandler {
    constructor() {
        this.initialized = false;
        this.lastInteractionTime = 0;
        this.interactionCooldown = 500; // ms cooldown between interactions
        this.initializeHandler();
    }
    
    initializeHandler() {
        if (this.initialized) return;
        
        console.log('📢 DirectKeyboardHandler: Setting up global keyboard event listeners');
        
        // Add document-level event listeners that cannot be overridden
        document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
        
        // Set up a backup polling mechanism
        setInterval(() => this.checkForInteractions(), 100);
        
        this.initialized = true;
    }
    
    handleKeyDown(event) {
        // Only handle Enter keys
        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            console.log(`📢 DirectKeyboardHandler: ${event.key} key captured at document level`);
            
            // Force interaction for all nearby entities
            this.forceInteractions();
            
            // For diagnostic purposes, let's log any active entities
            this.logActiveEntities();
        }
    }
    
    forceInteractions() {
        // Prevent too frequent interactions
        const now = Date.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            console.log('📢 DirectKeyboardHandler: Interaction cooldown active, ignoring');
            return;
        }
        
        // Game must be available
        if (!window.game) {
            console.log('📢 DirectKeyboardHandler: Game not available yet');
            return;
        }
        
        // Player must be available
        if (!window.game.player) {
            console.log('📢 DirectKeyboardHandler: Player not available yet');
            return;
        }
        
        console.log('📢 DirectKeyboardHandler: Searching for interactive entities...');
        
        // Get the current player position
        const player = window.game.player;
        
        // Find all interactive entities
        const entities = window.game.entities.filter(e => 
            e && typeof e.interact === 'function' && typeof e.isPlayerNearby !== 'undefined'
        );
        
        console.log(`📢 DirectKeyboardHandler: Found ${entities.length} interactive entities`);
        
        // Check each entity for proximity
        entities.forEach(entity => {
            // Calculate distance to player
            const dx = player.x - entity.x;
            const dy = player.y - entity.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Get interaction distance from entity or use a fallback
            const interactionDistance = entity.interactionDistance || 3.0;
            
            // Check if player is in range 
            const isInRange = distance <= interactionDistance;
            
            // Update the entity's player proximity flag directly
            entity.isPlayerNearby = isInRange;
            
            console.log(`📢 Entity ${entity.constructor?.name || 'Unknown'} at (${entity.x.toFixed(1)}, ${entity.y.toFixed(1)}) - Distance: ${distance.toFixed(2)}, In range: ${isInRange}`);
            
            // If in range, directly trigger interaction
            if (isInRange && entity.interactionEnabled !== false) {
                try {
                    // Force wasEnterPressed to false to ensure detection
                    const originalWasPressed = entity.wasEnterPressed;
                    entity.wasEnterPressed = false;
                    
                    console.log(`📢 DirectKeyboardHandler: Force-triggering interaction for ${entity.constructor?.name || 'Unknown'}`);
                    entity.interact();
                    
                    // Reset wasEnterPressed to prevent double-triggering
                    entity.wasEnterPressed = true;
                    
                    // Set interaction time to prevent rapid repeats
                    this.lastInteractionTime = now;
                } catch (e) {
                    console.error(`📢 DirectKeyboardHandler: Error calling interact() on entity:`, e);
                }
            }
        });
    }
    
    checkForInteractions() {
        // Check if any Enter key is actually pressed
        const isEnterPressed = 
            window.input?.keys?.['Enter'] || 
            window.input?.keys?.['NumpadEnter'] ||
            window.input?.enterKeyPressed ||
            window.input?.numpadEnterPressed;
        
        if (isEnterPressed) {
            console.log('📢 DirectKeyboardHandler: Enter key detected in polling');
            this.forceInteractions();
        }
    }
    
    logActiveEntities() {
        if (!window.game || !window.game.entities) return;
        
        const interactiveCount = window.game.entities.filter(e => 
            e && typeof e.interact === 'function'
        ).length;
        
        const nearbyCount = window.game.entities.filter(e => 
            e && typeof e.isPlayerNearby !== 'undefined' && e.isPlayerNearby
        ).length;
        
        console.log(`📢 DirectKeyboardHandler: Game has ${window.game.entities.length} total entities, ${interactiveCount} interactive, ${nearbyCount} nearby player`);
    }
}

// Initialize immediately when script loads
console.log('📢 DirectKeyboardHandler: Script loaded, initializing...');
const directKeyboardHandler = new DirectKeyboardHandler();

// Also export for module usage
export { DirectKeyboardHandler };

// Make it globally available for debugging and direct access
window.directKeyboardHandler = directKeyboardHandler;
