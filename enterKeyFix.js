/**
 * enterKeyFix.js - Global Enter key event handler for AI Alchemist's Lair
 * 
 * This script provides a global enter key event handler that intercepts all Enter key presses
 * at the document level and ensures they are properly propagated to the game's entities.
 * 
 * It uses a direct approach by capturing Enter key events at the document level and
 * manually checking nearby entities for interaction.
 * 
 * NOTE: This diagnostic module has been disabled for deployment.
 * The core functionality remains but with diagnostic logging removed.
 */

// Create a global solution to the Enter key problem
const enterKeyFix = {
    // Initialize called flag
    initialized: false,
    
    // Last time we checked for nearby entities
    lastCheckTime: 0,
    
    // Current state of the enter key
    enterKeyState: false,
    
    // Disable diagnostic logging for deployment
    enableLogging: false,
    
    // Initialize the fix
    initialize() {
        if (this.initialized) return;
        
        if (this.enableLogging) {
            console.log('🔑 Enter Key Fix: Initializing global Enter key handler');
        }
        
        // Add document-level event listeners with capturing phase to catch ALL key events
        document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
        document.addEventListener('keyup', this.handleKeyUp.bind(this), true);
        
        // Set up interval to check for entities periodically (backup)
        setInterval(this.checkForEntities.bind(this), 100);
        
        // Flag as initialized
        this.initialized = true;
    },
    
    // Handle key down events at document level
    handleKeyDown(event) {
        // We're only interested in Enter key variants
        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            if (this.enableLogging) {
                console.log(`🔑 Enter Key Fix: ${event.key} pressed, propagating to game`);
            }
            
            // Store state
            this.enterKeyState = true;
            
            // Force update of input module
            if (window.input) {
                window.input.keys['Enter'] = true;
                window.input.enterKeyPressed = true;
                
                if (event.key === 'NumpadEnter') {
                    window.input.keys['NumpadEnter'] = true;
                    window.input.numpadEnterPressed = true;
                }
            }
            
            // Immediately check for entities 
            this.checkForEntities();
        }
    },
    
    // Handle key up events at document level
    handleKeyUp(event) {
        // We're only interested in Enter key variants
        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            if (this.enableLogging) {
                console.log(`🔑 Enter Key Fix: ${event.key} released`);
            }
            
            // Store state
            this.enterKeyState = false;
            
            // Force update of input module
            if (window.input) {
                window.input.keys['Enter'] = false;
                window.input.enterKeyPressed = false;
                window.input.keys['NumpadEnter'] = false;
                window.input.numpadEnterPressed = false;
            }
        }
    },
    
    // Check for entities that might need to respond to Enter key
    checkForEntities() {
        // Rate limit checks to avoid performance issues
        const now = Date.now();
        if (now - this.lastCheckTime < 100) return;
        this.lastCheckTime = now;
        
        // Only proceed if Enter key is pressed
        if (!this.enterKeyState) return;
        
        // We need the game object
        if (!window.game) return;
        
        // Find all entities with checkForInteraction method
        const interactiveEntities = window.game.entities.filter(entity => 
            entity && 
            typeof entity.checkForInteraction === 'function' && 
            entity.isPlayerNearby && 
            entity.interactionEnabled
        );
        
        // Find the player
        const player = window.game.player;
        
        if (interactiveEntities.length > 0) {
            console.log(`🔑 Enter Key Fix: Found ${interactiveEntities.length} interactive entities`);
            
            // Force each nearby entity to check for interaction
            interactiveEntities.forEach(entity => {
                // Calculate distance to player (if available)
                let distance = Infinity;
                if (player && entity) {
                    const dx = player.x - entity.x;
                    const dy = player.y - entity.y;
                    distance = Math.sqrt(dx*dx + dy*dy);
                }
                
                console.log(`🔑 Enter Key Fix: Entity ${entity.constructor.name} is ${distance.toFixed(2)} units from player`);
                
                // Only trigger if the entity is close to the player
                if (distance < (entity.interactionDistance || 5)) {
                    console.log(`🔑 Enter Key Fix: Forcing interaction check for ${entity.constructor.name}`);
                    
                    // Temporarily force wasEnterPressed to false to ensure detection of "new" press
                    const originalWasPressed = entity.wasEnterPressed;
                    entity.wasEnterPressed = false;
                    
                    // Call the interaction check
                    try {
                        entity.checkForInteraction();
                    } catch (e) {
                        console.error(`Error checking interaction for ${entity.constructor.name}:`, e);
                    }
                    
                    // Restore original state
                    entity.wasEnterPressed = originalWasPressed;
                }
            });
        }
    }
};

// Initialize the fix when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Disabled console logging for deployment
    enterKeyFix.initialize();
    
    // Also try to initialize after a short delay in case the DOM event already fired
    setTimeout(() => {
        if (!enterKeyFix.initialized) {
            enterKeyFix.initialize();
        }
    }, 1000);
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Disabled console logging for deployment
    enterKeyFix.initialize();
}

// Also expose globally for debugging
window.enterKeyFix = enterKeyFix;

export { enterKeyFix };
