/**
 * Touch Input Manager for Circuit Sanctum Arcade
 * Handles touch controls and maps them to existing keyboard input
 */

import { input } from './input.js';

class TouchInputManager {
    constructor() {
        this.initialized = false;
        
        // Virtual joystick properties
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deadzone: 20, // Minimum distance to register movement
            maxDistance: 100, // Maximum distance for joystick range
        };
        
        // Tap properties
        this.tapTimeout = null;
        this.doubleTapThreshold = 300; // ms
        this.lastTapTime = 0;
        
        // Track active directions for virtual joystick
        this.activeDirections = {
            up: false,
            down: false,
            left: false,
            right: false,
            action: false
        };
        
        // UI Elements
        this.joystickElement = null;
        this.joystickKnobElement = null;
        this.actionButtonElement = null;
        this.controlsVisible = false;
    }
    
    /**
     * Initialize touch controls
     */
    initialize() {
        if (this.initialized) {
            console.log('Touch input system already initialized');
            return;
        }
        
        console.log('Initializing touch input system with event listeners');
        
        // Create touch UI elements
        this.createTouchUI();
        
        // Get canvas reference
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('Canvas not found, touch initialization delayed');
            setTimeout(() => this.initialize(), 500);
            return;
        }
        
        // Add touch event listeners
        this.addTouchListeners(canvas);
        
        // Add window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Add orientation change handler
        window.addEventListener('orientationchange', () => this.handleResize());
        
        // Check if device supports touch
        this.checkTouchSupport();
        
        this.initialized = true;
        console.log('Touch input system initialized successfully');
    }
    
    /**
     * Check if device supports touch and show controls if needed
     */
    checkTouchSupport() {
        // Directly check for known mobile patterns in user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Very strict mobile-only regex: only match common mobile OS patterns
        const strictMobileRegex = /android|iphone|ipad|ipod|blackberry|windows phone|opera mini/i;
        
        // Check if we're absolutely certain this is a mobile device
        const isDefinitelyMobile = strictMobileRegex.test(userAgent);
        
        // Console logging for debugging
        console.log('Mobile detection:', {
            userAgent,
            isDefinitelyMobile,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        });
        
        // STRICT MODE: Only show controls on definitively identified mobile devices
        if (isDefinitelyMobile) {
            console.log('Mobile device confirmed, showing touch controls');
            this.showTouchControls();
        } else {
            console.log('Non-mobile device detected, hiding touch controls');
            this.hideTouchControls();
        }
        
        // OVERRIDE: Force hide controls on all devices - this ensures desktop never shows controls
        this.hideTouchControls();
        
        // On mobile only, re-show controls after a delay
        setTimeout(() => {
            if (isDefinitelyMobile) {
                this.showTouchControls();
                console.log('Mobile device, showing touch controls after delay');
            }
        }, 1000);
    }
    
    /**
     * Show virtual joystick and action button
     */
    showTouchControls() {
        console.log('Showing touch controls');
        if (this.joystickElement && this.actionButtonElement) {
            this.joystickElement.style.display = 'block';
            this.actionButtonElement.style.display = 'block';
            this.controlsVisible = true;
            console.log('Touch control elements are now visible');
        } else {
            console.error('Touch control elements not created yet');
        }
        
        // Add mobile-friendly meta tag if not already present
        if (!document.querySelector('meta[name="viewport"]')) {
            const metaTag = document.createElement('meta');
            metaTag.name = 'viewport';
            metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(metaTag);
        }
    }
    
    /**
     * Hide virtual joystick and action button
     */
    hideTouchControls() {
        if (this.joystickElement && this.actionButtonElement) {
            this.joystickElement.style.display = 'none';
            this.actionButtonElement.style.display = 'none';
            this.controlsVisible = false;
        }
    }
    
    /**
     * Creates touch UI elements (virtual joystick and action button)
     */
    createTouchUI() {
        // Create joystick base
        this.joystickElement = document.createElement('div');
        this.joystickElement.id = 'virtualJoystick';
        this.joystickElement.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 120px;
            width: 150px;
            height: 150px;
            background-color: rgba(255, 255, 255, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
        `;
        console.log('Created virtual joystick element');
        
        // Create joystick knob
        this.joystickKnobElement = document.createElement('div');
        this.joystickKnobElement.id = 'joystickKnob';
        this.joystickKnobElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
        `;
        
        // Create action button
        this.actionButtonElement = document.createElement('div');
        this.actionButtonElement.id = 'actionButton';
        this.actionButtonElement.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 120px;
            width: 100px;
            height: 100px;
            background-color: rgba(255, 100, 100, 0.6);
            border: 2px solid rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
            font-family: Arial, sans-serif;
            color: white;
            text-align: center;
            line-height: 100px;
            font-size: 16px;
            font-weight: bold;
        `;
        this.actionButtonElement.textContent = 'ACTION';
        
        // Add elements to DOM
        this.joystickElement.appendChild(this.joystickKnobElement);
        document.body.appendChild(this.joystickElement);
        document.body.appendChild(this.actionButtonElement);
    }
    
    /**
     * Add touch event listeners to canvas
     * @param {HTMLElement} canvas - Game canvas element
     */
    addTouchListeners(canvas) {
        // Create a transparent overlay for touch controls
        const touchOverlay = document.createElement('div');
        touchOverlay.id = 'touchOverlay';
        touchOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999;
            touch-action: none;
            background-color: transparent;
        `;
        document.body.appendChild(touchOverlay);
        console.log('Touch overlay created and added to DOM');
        
        // Listen for touch events on the entire document
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Special listener for the action button
        this.actionButtonElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.setAction(true);
        });
        
        this.actionButtonElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.setAction(false);
        });
    }
    
    /**
     * Handle window resize or orientation change
     */
    handleResize() {
        if (!this.controlsVisible) return;
        
        // Reposition controls for new screen dimensions
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Landscape orientation
            this.joystickElement.style.left = '120px';
            this.joystickElement.style.bottom = '120px';
            
            this.actionButtonElement.style.right = '120px';
            this.actionButtonElement.style.bottom = '120px';
        } else {
            // Portrait orientation
            this.joystickElement.style.left = '70px';
            this.joystickElement.style.bottom = '180px';
            
            this.actionButtonElement.style.right = '70px';
            this.actionButtonElement.style.bottom = '180px';
        }
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        // Prevent default behavior to stop scrolling
        e.preventDefault();
        
        // Get touch points
        const touches = e.touches;
        
        // Process each touch point
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const x = touch.clientX;
            const y = touch.clientY;
            
            // Check if touch is on left half of screen (joystick area)
            if (x < window.innerWidth / 2) {
                // Activate joystick
                this.joystick.active = true;
                this.joystick.startX = x;
                this.joystick.startY = y;
                this.joystick.currentX = x;
                this.joystick.currentY = y;
                
                // Position joystick at touch point
                this.joystickElement.style.left = (x - 75) + 'px';
                this.joystickElement.style.top = (y - 75) + 'px';
                this.joystickElement.style.transform = 'none';
                this.joystickKnobElement.style.left = '50%';
                this.joystickKnobElement.style.top = '50%';
                console.log('Joystick positioned at:', x, y);
                
                // Make joystick visible
                this.joystickElement.style.display = 'block';
            } 
            // Check if touch is on right half of screen (action area)
            else {
                // Check for double tap (Enter key)
                const now = Date.now();
                if (now - this.lastTapTime < this.doubleTapThreshold) {
                    // Double tap detected - simulate Enter key
                    this.simulateKeyPress('Enter');
                    this.lastTapTime = 0; // Reset to prevent triple tap
                } else {
                    // Single tap - simulate space/action
                    this.setAction(true);
                    // Store tap time for double tap detection
                    this.lastTapTime = now;
                }
                
                // Show active state on action button
                this.actionButtonElement.style.backgroundColor = 'rgba(255, 100, 100, 0.9)';
            }
        }
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        // Prevent default behavior to stop scrolling
        e.preventDefault();
        
        // Only process if joystick is active
        if (!this.joystick.active) return;
        
        // Find the touch point that started in the joystick area
        let joystickTouch = null;
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.clientX < window.innerWidth / 2) {
                joystickTouch = touch;
                break;
            }
        }
        
        if (joystickTouch) {
            // Update joystick position
            this.joystick.currentX = joystickTouch.clientX;
            this.joystick.currentY = joystickTouch.clientY;
            
            // Calculate joystick displacement
            let deltaX = this.joystick.currentX - this.joystick.startX;
            let deltaY = this.joystick.currentY - this.joystick.startY;
            
            // Calculate distance from center
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Limit distance to max range
            if (distance > this.joystick.maxDistance) {
                const ratio = this.joystick.maxDistance / distance;
                deltaX *= ratio;
                deltaY *= ratio;
            }
            
            // Move joystick knob
            this.joystickKnobElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            // Detect direction
            this.processJoystickInput(deltaX, deltaY, distance);
        }
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        // Check if all touches are gone (e.touches.length will be 0 if no touches remain)
        if (e.touches.length === 0) {
            // Reset joystick
            this.joystick.active = false;
            this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
            this.joystickElement.style.transform = 'none';
            
            // Reset action button
            this.actionButtonElement.style.backgroundColor = 'rgba(255, 100, 100, 0.6)';
            
            // Reset all directions
            this.resetDirections();
            
            // Release action button after a short delay (to allow double tap detection)
            clearTimeout(this.tapTimeout);
            this.tapTimeout = setTimeout(() => {
                this.setAction(false);
            }, 50);
        } else {
            // Some touches remain - check if joystick touch is gone
            let joystickTouchExists = false;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].clientX < window.innerWidth / 2) {
                    joystickTouchExists = true;
                    break;
                }
            }
            
            // If no joystick touch exists, reset joystick
            if (!joystickTouchExists) {
                this.joystick.active = false;
                this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
                this.resetDirections();
            }
            
            // Check if action button touch is gone
            let actionTouchExists = false;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].clientX >= window.innerWidth / 2) {
                    actionTouchExists = true;
                    break;
                }
            }
            
            // If no action touch exists, reset action
            if (!actionTouchExists) {
                this.actionButtonElement.style.backgroundColor = 'rgba(255, 100, 100, 0.6)';
                
                // Release action button after a short delay (to allow double tap detection)
                clearTimeout(this.tapTimeout);
                this.tapTimeout = setTimeout(() => {
                    this.setAction(false);
                }, 50);
            }
        }
    }
    
    /**
     * Process joystick input and convert to directional commands
     * @param {number} deltaX - X displacement from joystick center
     * @param {number} deltaY - Y displacement from joystick center
     * @param {number} distance - Distance from joystick center
     */
    processJoystickInput(deltaX, deltaY, distance) {
        // Only process if beyond deadzone
        if (distance < this.joystick.deadzone) {
            this.resetDirections();
            return;
        }
        
        // Determine direction
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Reset all directions
        this.resetDirections();
        
        // Map angle to direction
        // Right: -45 to 45 degrees
        // Down: 45 to 135 degrees
        // Left: 135 to 180 or -135 to -180 degrees
        // Up: -45 to -135 degrees
        
        if (angle >= -45 && angle < 45) {
            this.activeDirections.right = true;
        } else if (angle >= 45 && angle < 135) {
            this.activeDirections.down = true;
        } else if (angle >= 135 || angle < -135) {
            this.activeDirections.left = true;
        } else if (angle >= -135 && angle < -45) {
            this.activeDirections.up = true;
        }
        
        // Diagonal detection
        if ((angle > -67.5 && angle < -22.5) || (angle > 22.5 && angle < 67.5) || 
            (angle > 112.5 && angle < 157.5) || (angle > -157.5 && angle < -112.5)) {
            // This is a diagonal direction
            if (angle > -67.5 && angle < -22.5) {
                this.activeDirections.up = true;
                this.activeDirections.right = true;
            } else if (angle > 22.5 && angle < 67.5) {
                this.activeDirections.right = true;
                this.activeDirections.down = true;
            } else if (angle > 112.5 && angle < 157.5) {
                this.activeDirections.down = true;
                this.activeDirections.left = true;
            } else if (angle > -157.5 && angle < -112.5) {
                this.activeDirections.left = true;
                this.activeDirections.up = true;
            }
        }
        
        // Update input system with joystick directions
        this.updateInputSystem();
    }
    
    /**
     * Reset all active directions
     */
    resetDirections() {
        this.activeDirections.up = false;
        this.activeDirections.down = false;
        this.activeDirections.left = false;
        this.activeDirections.right = false;
        
        // Update input system to clear directions
        this.updateInputSystem();
    }
    
    /**
     * Set action button state
     * @param {boolean} active - Whether action is active
     */
    setAction(active) {
        this.activeDirections.action = active;
        
        // Update input system
        if (active) {
            input.keys[' '] = true; // Space bar for action
        } else {
            input.keys[' '] = false;
        }
    }
    
    /**
     * Update the input system with touch directions
     */
    updateInputSystem() {
        // Map directions to key states
        input.keys['ArrowUp'] = this.activeDirections.up;
        input.keys['ArrowDown'] = this.activeDirections.down;
        input.keys['ArrowLeft'] = this.activeDirections.left;
        input.keys['ArrowRight'] = this.activeDirections.right;
        
        // Also map to WASD for systems that use those
        input.keys['w'] = this.activeDirections.up;
        input.keys['s'] = this.activeDirections.down;
        input.keys['a'] = this.activeDirections.left;
        input.keys['d'] = this.activeDirections.right;
        
        // Debug output
        // console.log('Touch directions:', this.activeDirections);
    }
    
    /**
     * Simulate a key press event
     * @param {string} key - Key to simulate
     */
    simulateKeyPress(key) {
        // Set key state directly in input system
        input.keys[key] = true;
        
        // Clear key after a short delay
        setTimeout(() => {
            input.keys[key] = false;
        }, 100);
        
        // Handle special case for Enter key
        if (key === 'Enter') {
            input.enterKeyPressed = true;
            setTimeout(() => {
                input.enterKeyPressed = false;
            }, 100);
        }
    }
}

// Create singleton instance
const touchInputManager = new TouchInputManager();

// Initialize on DOMContentLoaded
// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded, initializing touch controls immediately');
    setTimeout(() => touchInputManager.initialize(), 1000);
} else {
    // Otherwise wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded event fired, initializing touch controls');
        setTimeout(() => touchInputManager.initialize(), 1000);
        
        // Also listen for loading complete event to reinitialize
        window.addEventListener('loadingComplete', () => {
            console.log('Loading complete event received in touchInputManager.js');
            setTimeout(() => touchInputManager.initialize(), 1000);
        });
    });
}

// Add a fallback initialization after a delay
setTimeout(() => {
    console.log('Fallback touch controls initialization');
    if (!touchInputManager.initialized) {
        touchInputManager.initialize();
    } else {
        console.log('Touch controls were already initialized, forcing show');
        touchInputManager.showTouchControls();
    }
}, 3000);

export { touchInputManager };
