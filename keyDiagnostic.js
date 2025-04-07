/**
 * KeyDiagnostic.js - Enhanced keyboard diagnostics for AI Alchemist's Lair
 * Provides a fail-safe system to detect and log all keyboard events at the document level
 * 
 * NOTE: This diagnostic module has been disabled for deployment.
 * The code is kept for reference but will not create any visual elements or log output.
 */

// Create a global keyboard diagnostic system (disabled for deployment)
const keyDiagnostic = {
    // Track all Enter key presses at document level
    capturedKeys: [],
    
    // Track if the diagnostic is initialized
    initialized: false,
    
    // Diagnostic is disabled for deployment
    enabled: false,
    
    // Add a DOM-level event listener that will catch ALL keyboard events
    initialize() {
        if (this.initialized || !this.enabled) return;
        
        // Disabled console logging for deployment
        
        // Add document-level event listeners that will capture ALL keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
        document.addEventListener('keyup', this.handleKeyUp.bind(this), true);
        
        // Create diagnostic overlay - disabled for deployment
        this.createDiagnosticOverlay();
        
        // Set up polling to check for input module synchronization
        this.startInputSyncCheck();
        
        this.initialized = true;
    },
    
    // Handle key down events at document level
    handleKeyDown(event) {
        if (!this.enabled) return;
        
        // We're specifically interested in Enter key variants
        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            const keyData = {
                type: 'keydown',
                key: event.key,
                timestamp: new Date().toISOString(),
                target: event.target?.tagName || 'unknown'
            };
            
            // Store in our captured keys array
            this.capturedKeys.push(keyData);
            
            // Limit array size to avoid memory issues
            if (this.capturedKeys.length > 20) {
                this.capturedKeys.shift();
            }
            
            // Log this capture - disabled for deployment
            
            // Update diagnostic overlay - disabled for deployment
            // this.updateDiagnosticOverlay();
            
            // Force manual trigger of entity checking as a fallback
            this.triggerEntityChecks();
        }
    },
    
    // Handle key up events at document level
    handleKeyUp(event) {
        if (!this.enabled) return;
        
        // We're specifically interested in Enter key variants
        if (event.key === 'Enter' || event.key === 'NumpadEnter') {
            const keyData = {
                type: 'keyup',
                key: event.key,
                timestamp: new Date().toISOString(),
                target: event.target?.tagName || 'unknown'
            };
            
            // Store in our captured keys array
            this.capturedKeys.push(keyData);
            
            // Limit array size to avoid memory issues
            if (this.capturedKeys.length > 20) {
                this.capturedKeys.shift();
            }
            
            // Log this capture - disabled for deployment
            
            // Update diagnostic overlay - disabled for deployment
            // this.updateDiagnosticOverlay();
        }
    },
    
    // Create a diagnostic overlay for visual feedback (disabled for deployment)
    createDiagnosticOverlay() {
        // Disabled for deployment
        if (!this.enabled) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'keyDiagnosticOverlay';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '10px';
        overlay.style.right = '10px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = '#fff';
        overlay.style.padding = '10px';
        overlay.style.borderRadius = '5px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        overlay.style.zIndex = '9999';
        overlay.style.maxWidth = '300px';
        overlay.style.maxHeight = '150px';
        overlay.style.overflowY = 'auto';
        overlay.style.display = 'none'; // Explicitly hidden
        overlay.innerHTML = '<strong>Key Diagnostic Active</strong><br>Waiting for Enter key...';
        
        document.body.appendChild(overlay);
    },
    
    // Update the diagnostic overlay with key data
    updateDiagnosticOverlay() {
        const overlay = document.getElementById('keyDiagnosticOverlay');
        if (!overlay) return;
        
        let html = '<strong>🔍 Key Diagnostic</strong><br>';
        
        // Add most recent key events
        const recentKeys = this.capturedKeys.slice(-5);
        recentKeys.forEach(keyData => {
            const time = keyData.timestamp.split('T')[1].substring(0, 12);
            html += `${keyData.type === 'keydown' ? '⬇️' : '⬆️'} ${keyData.key} @ ${time}<br>`;
        });
        
        // Add input module state
        const inputModule = window.input;
        if (inputModule) {
            html += '<hr>Input Module State:<br>';
            html += `Enter: ${inputModule.keys['Enter'] ? '✅' : '❌'} `;
            html += `NumpadEnter: ${inputModule.keys['NumpadEnter'] ? '✅' : '❌'}<br>`;
            html += `enterKeyPressed: ${inputModule.enterKeyPressed ? '✅' : '❌'} `;
            html += `numpadEnterPressed: ${inputModule.numpadEnterPressed ? '✅' : '❌'}`;
        }
        
        overlay.innerHTML = html;
    },
    
    // Check if input module is properly synchronized with our key events
    startInputSyncCheck() {
        // Check every 500ms if input module has correct state
        setInterval(() => {
            const inputModule = window.input;
            if (!inputModule) return;
            
            // Get most recent keydown/up events
            const mostRecentDown = this.capturedKeys
                .filter(k => k.type === 'keydown' && (k.key === 'Enter' || k.key === 'NumpadEnter'))
                .pop();
                
            const mostRecentUp = this.capturedKeys
                .filter(k => k.type === 'keyup' && (k.key === 'Enter' || k.key === 'NumpadEnter'))
                .pop();
            
            // If we have a keydown without a matching keyup, Enter should be true
            if (mostRecentDown && (!mostRecentUp || new Date(mostRecentDown.timestamp) > new Date(mostRecentUp.timestamp))) {
                if (!inputModule.keys['Enter'] && !inputModule.enterKeyPressed) {
                    console.warn('🔍 KeyDiagnostic: Input module desynchronized - fixing Enter key state');
                    // Fix the state
                    inputModule.keys['Enter'] = true;
                    inputModule.enterKeyPressed = true;
                    
                    if (mostRecentDown.key === 'NumpadEnter') {
                        inputModule.keys['NumpadEnter'] = true;
                        inputModule.numpadEnterPressed = true;
                    }
                }
            } 
            // If most recent event is keyup, Enter should be false
            else if (mostRecentUp && (!mostRecentDown || new Date(mostRecentUp.timestamp) > new Date(mostRecentDown.timestamp))) {
                if (inputModule.keys['Enter'] || inputModule.enterKeyPressed) {
                    console.warn('🔍 KeyDiagnostic: Input module desynchronized - fixing Enter key release state');
                    // Fix the state
                    inputModule.keys['Enter'] = false;
                    inputModule.enterKeyPressed = false;
                    inputModule.keys['NumpadEnter'] = false;
                    inputModule.numpadEnterPressed = false;
                }
            }
            
            // Update overlay to reflect current state
            this.updateDiagnosticOverlay();
        }, 500);
    },
    
    // Force trigger entity checks as a fallback
    triggerEntityChecks() {
        // We need to access the game's entities that handle Enter key
        if (!window.game) return;
        
        // Get all interactive entities
        const entities = window.game.entities.filter(entity => 
            entity && entity.checkForInteraction && entity.isPlayerNearby
        );
        
        if (entities.length > 0) {
            console.log(`🔍 KeyDiagnostic: Force-checking ${entities.length} nearby interactive entities`);
            
            // Force check each entity
            entities.forEach(entity => {
                // Force the Enter key state to be true for one frame
                const originalEnterState = window.input.keys['Enter'];
                window.input.keys['Enter'] = true;
                window.input.enterKeyPressed = true;
                
                // Call the entity's check method
                try {
                    entity.checkForInteraction();
                    console.log(`🔍 Force-checked entity: ${entity.constructor.name}`);
                } catch (e) {
                    console.error('Error force-checking entity:', e);
                }
                
                // Restore original state (don't want to trigger twice)
                window.input.keys['Enter'] = originalEnterState;
            });
        }
    }
};

// Initialize the diagnostic system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 KeyDiagnostic: DOM ready, initializing...');
    keyDiagnostic.initialize();
});

// Also expose it globally so it can be accessed from the console
window.keyDiagnostic = keyDiagnostic;

export { keyDiagnostic };
