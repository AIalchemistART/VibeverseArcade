const input = {
    keys: {},
    // Store previous key states for detecting key presses
    previousKeys: {},
    mouse: { x: 0, y: 0, leftClick: false, rightClick: false },
    initialized: false,
    // Add a flag specifically for Enter key
    enterKeyPressed: false,
    numpadEnterPressed: false,
    
    /**
     * Checks if a specific key is pressed
     * @param {string} key - The key to check
     * @returns {boolean} - True if key is pressed, false otherwise
     */
    isKeyPressed(key) {
        // Special case for Enter key to ensure it works consistently
        if (key === 'Enter' || key === 'NumpadEnter') {
            return this.keys['Enter'] || this.keys['NumpadEnter'] || 
                   this.enterKeyPressed || this.numpadEnterPressed || false;
        }
        return this.keys[key] || false;
    },
    
    /**
     * Checks if any key in the given array is pressed
     * @param {string[]} keys - Array of keys to check
     * @returns {boolean} - True if any key is pressed, false otherwise
     */
    isAnyKeyPressed(keys) {
        return keys.some(key => this.isKeyPressed(key));
    },
    
    /**
     * Resets the input state, clearing all pressed keys
     * Useful after loading screens or when changing scenes
     */
    reset() {
        console.log('Resetting input system');
        this.keys = {};
        this.mouse.leftClick = false;
        this.mouse.rightClick = false;
    },
    
    /**
     * Initialize input handlers
     * This can be called multiple times safely to ensure handlers are attached
     */
    initialize() {
        if (this.initialized) {
            console.log('Input system already initialized');
            return;
        }
        
        console.log('Initializing input system with event listeners');
        
        // Listen for custom inputReset event
        document.addEventListener('inputReset', () => {
            this.reset();
            
            // Debug info
            const debugElement = document.getElementById('input-debug');
            if (debugElement) {
                debugElement.style.display = 'block';
                debugElement.textContent = 'Input Reset: ' + new Date().toLocaleTimeString();
                
                // Hide after 5 seconds
                setTimeout(() => {
                    debugElement.style.display = 'none';
                }, 5000);
            }
        });
        
        // Set up event handlers for keyboard
        window.addEventListener('keydown', (event) => {
            // Backup previous key states for edge detection
            this.previousKeys = {...this.keys};
            
            // Store the key state
            this.keys[event.key] = true;
            
            // Special enhanced handling for Enter keys
            if (event.key === 'Enter') {
                this.keys['Enter'] = true;
                this.enterKeyPressed = true;
                console.log('Main Enter key pressed and explicitly flagged as true', new Date().toISOString());
            } else if (event.key === 'NumpadEnter') {
                this.keys['NumpadEnter'] = true;
                this.keys['Enter'] = true; // Also set standard Enter
                this.numpadEnterPressed = true;
                console.log('Numpad Enter key pressed and both Enter keys set to true', new Date().toISOString());
            }
            
            // Extra logging for problematic keys
            if (event.key === 'Enter' || event.key === 'NumpadEnter') {
                console.log('Enter key state:', {
                    keyName: event.key,
                    enterKey: this.keys['Enter'],
                    numpadEnterKey: this.keys['NumpadEnter'],
                    enterFlag: this.enterKeyPressed,
                    numpadEnterFlag: this.numpadEnterPressed,
                    keyCode: event.keyCode || 'N/A', // For older browser support
                    timestamp: new Date().toISOString()
                });
            }
            
            // Debug key presses to console
            console.log(`Key pressed: ${event.key} (${new Date().toISOString()})`);
            
            // Show visual feedback for key presses in debug element
            const debugElement = document.getElementById('input-debug');
            if (debugElement) {
                debugElement.style.display = 'block';
                debugElement.textContent = `Key: ${event.key}`;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
            
            // Special enhanced handling for Enter keys
            if (event.key === 'Enter') {
                this.keys['Enter'] = false;
                this.enterKeyPressed = false;
                console.log('Main Enter key released and explicitly flagged as false', new Date().toISOString());
            } else if (event.key === 'NumpadEnter') {
                this.keys['NumpadEnter'] = false;
                this.keys['Enter'] = false; // Also clear standard Enter 
                this.numpadEnterPressed = false;
                console.log('Numpad Enter key released and both Enter keys set to false', new Date().toISOString());
            }
            
            // Extra logging for problematic keys
            if (event.key === 'Enter' || event.key === 'NumpadEnter') {
                console.log('Enter key release state:', {
                    keyName: event.key,
                    enterKey: this.keys['Enter'],
                    numpadEnterKey: this.keys['NumpadEnter'],
                    enterFlag: this.enterKeyPressed,
                    numpadEnterFlag: this.numpadEnterPressed,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Set up mouse event handlers
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', (event) => {
                this.mouse.x = event.offsetX;
                this.mouse.y = event.offsetY;
            });
            
            canvas.addEventListener('mousedown', (event) => {
                if (event.button === 0) this.mouse.leftClick = true;
                if (event.button === 2) this.mouse.rightClick = true;
            });
            
            canvas.addEventListener('mouseup', (event) => {
                if (event.button === 0) this.mouse.leftClick = false;
                if (event.button === 2) this.mouse.rightClick = false;
            });
            
            canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
            
            this.initialized = true;
            console.log('Input system initialized successfully');
        } else {
            console.warn('Canvas not found, input initialization delayed');
            
            // Try again later when canvas might be available
            setTimeout(() => {
                if (!this.initialized) {
                    console.log('Retrying input initialization');
                    this.initialize();
                }
            }, 500);
        }
    }
};

// DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize input system once DOM is loaded
    input.initialize();
    
    // Also listen for loading complete event to reinitialize
    window.addEventListener('loadingComplete', () => {
        console.log('Loading complete event received in input.js');
        
        // Reset and reinitialize input system after loading completes
        input.reset();
        
        // Force re-initialization to ensure event handlers are properly attached
        input.initialized = false;
        input.initialize();
    });
});

export { input };
