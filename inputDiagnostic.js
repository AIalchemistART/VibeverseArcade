/**
 * Input Diagnostic Tool
 * This script helps diagnose input-related issues by monitoring key events and displaying diagnostic information
 */

class InputDiagnostic {
    constructor() {
        this.active = false;
        this.keyStates = {};
        this.diagnosticElement = null;
        
        // Bind methods to this instance
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.update = this.update.bind(this);
    }
    
    /**
     * Start monitoring input events
     */
    start() {
        if (this.active) return;
        
        console.log('Starting input diagnostics');
        this.active = true;
        
        // Create diagnostic overlay if it doesn't exist
        if (!this.diagnosticElement) {
            this.createDiagnosticOverlay();
        }
        
        // Attach event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Start update loop
        this.updateInterval = setInterval(this.update, 100);
        
        // Force display
        this.diagnosticElement.style.display = 'block';
        
        // Log input module status
        if (window.input) {
            console.log('Input module state:', JSON.stringify(window.input.keys));
        } else {
            console.log('Input module not available');
        }
    }
    
    /**
     * Stop monitoring input events
     */
    stop() {
        if (!this.active) return;
        
        console.log('Stopping input diagnostics');
        this.active = false;
        
        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Stop update loop
        clearInterval(this.updateInterval);
        
        // Hide overlay
        if (this.diagnosticElement) {
            this.diagnosticElement.style.display = 'none';
        }
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        // Record key state
        this.keyStates[event.key] = true;
        
        // Log to console
        console.log(`[Diagnostic] Key down: ${event.key}`);
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        // Record key state
        this.keyStates[event.key] = false;
        
        // Log to console
        console.log(`[Diagnostic] Key up: ${event.key}`);
    }
    
    /**
     * Update diagnostic display
     */
    update() {
        if (!this.active || !this.diagnosticElement) return;
        
        // Check if input module exists and compare states
        let inputModuleStatus = 'Not Available';
        if (window.input) {
            // Compare our observed states with input module states
            const inputKeys = window.input.keys;
            const importantKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
            
            let differences = [];
            for (const key of importantKeys) {
                if (this.keyStates[key] !== inputKeys[key]) {
                    differences.push(`${key}: diagnostic=${!!this.keyStates[key]}, input=${!!inputKeys[key]}`);
                }
            }
            
            if (differences.length > 0) {
                inputModuleStatus = `Differences: ${differences.join(', ')}`;
            } else {
                inputModuleStatus = 'In Sync';
            }
        }
        
        // Update display
        this.diagnosticElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Input Diagnostic</div>
            <div>Input Module: ${inputModuleStatus}</div>
            <div>Arrow Keys: ↑:${!!this.keyStates['ArrowUp']} ↓:${!!this.keyStates['ArrowDown']} ←:${!!this.keyStates['ArrowLeft']} →:${!!this.keyStates['ArrowRight']}</div>
            <div>WASD: W:${!!this.keyStates['W'] || !!this.keyStates['w']} A:${!!this.keyStates['A'] || !!this.keyStates['a']} S:${!!this.keyStates['S'] || !!this.keyStates['s']} D:${!!this.keyStates['D'] || !!this.keyStates['d']}</div>
            <div>Last Updated: ${new Date().toLocaleTimeString()}</div>
            <div><button id="force-input-reset" style="margin-top: 5px; padding: 2px 5px; font-size: 10px;">Reset Input</button></div>
        `;
        
        // Add event listener to reset button
        const resetButton = document.getElementById('force-input-reset');
        if (resetButton) {
            resetButton.onclick = this.forceInputReset.bind(this);
        }
    }
    
    /**
     * Create diagnostic overlay
     */
    createDiagnosticOverlay() {
        this.diagnosticElement = document.createElement('div');
        this.diagnosticElement.id = 'input-diagnostic';
        this.diagnosticElement.style.position = 'fixed';
        this.diagnosticElement.style.bottom = '10px';
        this.diagnosticElement.style.left = '10px';
        this.diagnosticElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.diagnosticElement.style.color = '#fff';
        this.diagnosticElement.style.padding = '10px';
        this.diagnosticElement.style.borderRadius = '5px';
        this.diagnosticElement.style.fontFamily = 'monospace';
        this.diagnosticElement.style.fontSize = '12px';
        this.diagnosticElement.style.zIndex = '9999';
        this.diagnosticElement.style.maxWidth = '300px';
        document.body.appendChild(this.diagnosticElement);
    }
    
    /**
     * Force input system reset
     */
    forceInputReset() {
        console.log('Forcing input system reset');
        
        // Reset our own tracking
        this.keyStates = {};
        
        // Reset the game's input system if available
        if (window.input && typeof window.input.reset === 'function') {
            window.input.reset();
        }
        
        // Dispatch input reset event
        document.dispatchEvent(new CustomEvent('inputReset'));
        
        // Force release all keys
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
        for (const key of keys) {
            const keyupEvent = new KeyboardEvent('keyup', {
                key: key,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(keyupEvent);
        }
        
        // Update display
        this.update();
    }
}

// Create global instance
const inputDiagnostic = new InputDiagnostic();

// Auto-start diagnostics when the game is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure the game has loaded
    setTimeout(() => {
        inputDiagnostic.start();
    }, 1000);
});

// Also set up a listener for when loading completes
window.addEventListener('loadingComplete', () => {
    console.log('Loading complete, starting input diagnostics');
    
    // Start with a delay to ensure everything is initialized
    setTimeout(() => {
        inputDiagnostic.start();
    }, 500);
});

// Export the diagnostic tool
export { inputDiagnostic };
