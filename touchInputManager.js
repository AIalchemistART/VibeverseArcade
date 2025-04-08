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
        
        // Arcade navigation properties with cooldown
        this.arcadeNavigation = {
            lastNavigationTime: 0,
            cooldownPeriod: 300, // 300ms cooldown between selections
            isInCooldown: false,
            lastDirection: null  // Tracks the last direction used (up/down)
        };
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
        
        // Listen for menu/overlay events to ensure controls remain visible
        // Using both window and document event listeners for better coverage
        window.addEventListener('overlayOpened', this.ensureControlsVisibility.bind(this));
        window.addEventListener('menuOpened', this.ensureControlsVisibility.bind(this));
        document.addEventListener('overlayOpened', this.ensureControlsVisibility.bind(this));
        document.addEventListener('menuOpened', this.ensureControlsVisibility.bind(this));
        
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
        // Check for actual touch capability (rather than device type)
        const hasTouchSupport = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 ||
                            navigator.msMaxTouchPoints > 0;
        
        // Still check user agent for debugging/logging purposes
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const strictMobileRegex = /android|iphone|ipad|ipod|blackberry|windows phone|opera mini/i;
        const isDefinitelyMobile = strictMobileRegex.test(userAgent);
        
        // Log detection results
        console.log('Touch capability detection:', {
            userAgent,
            hasTouchSupport,
            isDefinitelyMobile, // for debugging only
            touchPoints: navigator.maxTouchPoints,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        });
        
        // Show controls only if touch is actually supported
        if (hasTouchSupport) {
            console.log('Touch support detected, showing touch controls');
            this.showTouchControls();
        } else {
            console.log('No touch support detected, hiding touch controls');
            this.hideTouchControls();
        }
    }
    
    /**
     * Show virtual joystick and touch buttons
     */
    showTouchControls() {
        console.log('Showing touch controls');
        if (this.joystickElement && this.actionButtonElement && this.escapeButtonElement) {
            this.joystickElement.style.display = 'block';
            this.actionButtonElement.style.display = 'block';
            this.escapeButtonElement.style.display = 'block';
            
            // Ensure buttons are above any menus or overlays
            this.joystickElement.style.zIndex = '9999';
            this.actionButtonElement.style.zIndex = '9999';
            this.escapeButtonElement.style.zIndex = '9999';
            
            this.controlsVisible = true;
            console.log('Touch control elements are now visible and above overlays');
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
     * Hide virtual joystick and touch buttons
     */
    hideTouchControls() {
        if (this.joystickElement && this.actionButtonElement && this.escapeButtonElement) {
            this.joystickElement.style.display = 'none';
            this.actionButtonElement.style.display = 'none';
            this.escapeButtonElement.style.display = 'none';
            this.controlsVisible = false;
            console.log('Touch controls hidden');
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
        
        // Create interact button (previously action button)
        this.actionButtonElement = document.createElement('div');
        this.actionButtonElement.id = 'interactButton';
        this.actionButtonElement.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 120px;
            width: 100px;
            height: 100px;
            background-color: rgba(100, 200, 100, 0.6);
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
        this.actionButtonElement.textContent = 'INTERACT';
        
        // Create escape button
        this.escapeButtonElement = document.createElement('div');
        this.escapeButtonElement.id = 'escapeButton';
        this.escapeButtonElement.style.cssText = `
            position: fixed;
            bottom: 240px;
            right: 140px;
            width: 60px;
            height: 60px;
            background-color: rgba(255, 100, 100, 0.6);
            border: 2px solid rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
            font-family: Arial, sans-serif;
            color: white;
            text-align: center;
            line-height: 60px;
            font-size: 12px;
            font-weight: bold;
        `;
        this.escapeButtonElement.textContent = 'ESC';
        
        // Add elements to DOM
        this.joystickElement.appendChild(this.joystickKnobElement);
        document.body.appendChild(this.joystickElement);
        document.body.appendChild(this.actionButtonElement);
        document.body.appendChild(this.escapeButtonElement);
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
        // First check if we're clicking on the YouTube modal or shuffle button
        const youtubeModal = document.getElementById('youtube-modal');
        if (youtubeModal) {
            // If the YouTube modal is open, don't process touch events
            // This lets the shuffle button receive clicks directly
            return;
        }
        
        // Only proceed with default behavior if not in the YouTube modal
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
            // Check if touch is on right half of screen (buttons area)
            else {
                // Check if it's within the interact button bounds - more precise interaction
                if (this.actionButtonElement && 
                    x >= this.actionButtonElement.getBoundingClientRect().left &&
                    x <= this.actionButtonElement.getBoundingClientRect().right &&
                    y >= this.actionButtonElement.getBoundingClientRect().top &&
                    y <= this.actionButtonElement.getBoundingClientRect().bottom) {
                    
                    // Interact button pressed - simulate Enter key
                    this.simulateKeyPress('Enter');
                    this.setAction(true);
                    console.log('Touch: Interact button specifically pressed');
                    
                    // Show active state on interact button
                    this.actionButtonElement.style.backgroundColor = 'rgba(100, 255, 100, 0.9)';
                } else {
                    // Default to escape for the rest of right side - simulate Escape key
                    this.simulateKeyPress('Escape');
                    this.setEscape(true);
                    console.log('Touch: Right side pressed, defaulting to escape');
                    
                    // Show active state on escape button
                    this.escapeButtonElement.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
                }
            }
        }
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        // Check if YouTube modal is open
        const youtubeModal = document.getElementById('youtube-modal');
        if (youtubeModal) {
            // If YouTube modal is open, don't process touch events
            return;
        }
        
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
        // Check if YouTube modal is open
        const youtubeModal = document.getElementById('youtube-modal');
        if (youtubeModal) {
            // If YouTube modal is open, don't process touch events
            return;
        }
        
        // Check if all touches are gone (e.touches.length will be 0 if no touches remain)
        if (e.touches.length === 0) {
            // Reset joystick
            this.joystick.active = false;
            this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
            this.joystickElement.style.transform = 'none';
            
            // Reset interact button
            this.actionButtonElement.style.backgroundColor = 'rgba(100, 200, 100, 0.6)';
            this.setAction(false);
            
            // Reset escape button
            this.escapeButtonElement.style.backgroundColor = 'rgba(255, 100, 100, 0.6)';
            this.setEscape(false);
            
            // Reset all directions
            this.resetDirections();
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
        
        // Check if spellbook overlay is open
        const spellbookOverlay = document.getElementById('spellbook-overlay');
        
        // If spellbook is open, use joystick for scrolling
        if (spellbookOverlay) {
            // Get the spellbook page content that needs scrolling
            const spellbookPage = spellbookOverlay.querySelector('.spellbook-page');
            
            if (spellbookPage) {
                // Calculate scroll speed based on joystick displacement
                // Use a multiplier to control sensitivity
                const scrollSpeed = 10;
                let scrollAmount = 0;
                
                // Determine scroll direction based on joystick position
                if (angle >= -135 && angle < -45) { // Up
                    // Scroll up
                    scrollAmount = -scrollSpeed;
                    console.log('Joystick: Scrolling spellbook UP');
                } else if (angle >= 45 && angle < 135) { // Down
                    // Scroll down
                    scrollAmount = scrollSpeed;
                    console.log('Joystick: Scrolling spellbook DOWN');
                }
                
                // Apply scrolling if there's a scroll amount
                if (scrollAmount !== 0) {
                    // Calculate scroll intensity based on joystick displacement
                    const intensity = Math.min(Math.max(distance / this.joystick.maxDistance, 0.2), 1.0);
                    const finalScrollAmount = scrollAmount * intensity * 2;
                    
                    // Smoothly scroll the content
                    spellbookPage.scrollBy({
                        top: finalScrollAmount,
                        behavior: 'auto' // Use 'auto' for immediate response
                    });
                    
                    // Important: Reset directions but skip updating the input system
                    // This prevents character movement while scrolling
                    this.resetDirections();
                    return; // Exit without updating input system for game movement
                }
            }
        }
        
        // Check if arcade game selection is open by looking for the overlay
        const arcadeSelectionElement = document.getElementById('arcadeMenuOverlay');
        
        if (arcadeSelectionElement) {
            // Get current time to check cooldown
            const currentTime = Date.now();
            
            // Check if we're in cooldown period
            if (this.arcadeNavigation.isInCooldown) {
                // If cooldown has expired, reset it
                if (currentTime - this.arcadeNavigation.lastNavigationTime > this.arcadeNavigation.cooldownPeriod) {
                    this.arcadeNavigation.isInCooldown = false;
                } else {
                    // Still in cooldown, don't process navigation input
                    this.resetDirections();
                    return;
                }
            }
            
            // Determine navigation direction for arcade menu
            let direction = null;
            
            if (angle >= -135 && angle < -45) { // Up
                direction = 'up';
                console.log('Joystick: Arcade menu navigation UP');
                
                // Simulate ArrowUp keypress to navigate the menu
                this.simulateKeyPress('ArrowUp');
                
                // Set cooldown
                this.arcadeNavigation.lastNavigationTime = currentTime;
                this.arcadeNavigation.isInCooldown = true;
                this.arcadeNavigation.lastDirection = 'up';
                
                // Reset directions but don't update the input system
                this.resetDirections();
                return;
            } else if (angle >= 45 && angle < 135) { // Down
                direction = 'down';
                console.log('Joystick: Arcade menu navigation DOWN');
                
                // Simulate ArrowDown keypress to navigate the menu
                this.simulateKeyPress('ArrowDown');
                
                // Set cooldown
                this.arcadeNavigation.lastNavigationTime = currentTime;
                this.arcadeNavigation.isInCooldown = true;
                this.arcadeNavigation.lastDirection = 'down';
                
                // Reset directions but don't update the input system
                this.resetDirections();
                return;
            } else if (angle >= -45 && angle < 45) { // Right - for selecting a game
                direction = 'right';
                console.log('Joystick: Arcade menu SELECT game');
                
                // Simulate Enter keypress to select the current game
                this.simulateKeyPress('Enter');
                
                // Set cooldown with longer period for selection
                this.arcadeNavigation.lastNavigationTime = currentTime;
                this.arcadeNavigation.isInCooldown = true;
                this.arcadeNavigation.lastDirection = 'select';
                
                // Reset directions but don't update the input system
                this.resetDirections();
                return;
            }
        }
        
        // Reset all directions for normal gameplay
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
     * Ensure touch controls remain visible above any overlays or menus
     */
    ensureControlsVisibility() {
        console.log('Ensuring touch controls visibility during overlay/menu');
        if (this.controlsVisible) {
            // Make sure buttons are displayed and with high z-index
            this.actionButtonElement.style.display = 'block';
            this.escapeButtonElement.style.display = 'block';
            
            // Use very high z-index to ensure they appear above everything
            this.actionButtonElement.style.zIndex = '9999';
            this.escapeButtonElement.style.zIndex = '9999';
            
            console.log('Touch controls visibility and z-index refreshed');
        }
    }
    
    /**
     * Set action button state
     * @param {boolean} active - Whether action is active
     */
    setAction(active) {
        this.activeDirections.action = active;
        console.log('Touch: setAction called with active =', active);
        
        // Update input system - now using Enter key for interaction
        if (active) {
            input.keys['Enter'] = true; // Enter key for interaction
            input.enterKeyPressed = true; // Also set the special flag
            console.log('Touch: Enter key and flag set to true');
        } else {
            input.keys['Enter'] = false;
            input.enterKeyPressed = false;
            console.log('Touch: Enter key and flag set to false');
        }
    }
    
    /**
     * Set escape button state
     * @param {boolean} active - Whether escape is active
     */
    setEscape(active) {
        console.log('Touch: setEscape called with active =', active);
        
        // Update input system with explicit tracking
        if (active) {
            input.keys['Escape'] = true;
            console.log('Touch: Escape key set to true');
        } else {
            input.keys['Escape'] = false;
            console.log('Touch: Escape key set to false');
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
        console.log(`Touch: Simulating ${key} key press`); 
        
        // Set key state directly in input system
        input.keys[key] = true;
        
        // Create key-specific details
        let keyCode, keyCodeStr;
        if (key === 'Enter') {
            keyCode = 13;
            keyCodeStr = 'Enter';
            input.enterKeyPressed = true;
            console.log('Touch: Set enterKeyPressed flag to true');
        } else if (key === 'Escape') {
            keyCode = 27;
            keyCodeStr = 'Escape';
            console.log('Touch: Simulating Escape key');
        } else {
            // For other keys
            keyCode = key.charCodeAt(0);
            keyCodeStr = key;
        }
        
        // Dispatch a custom keydown event for better compatibility
        const downEvent = new KeyboardEvent('keydown', {
            key: key,
            code: keyCodeStr,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true
        });
        document.dispatchEvent(downEvent);
        
        // Clear key after a longer delay to ensure detection
        setTimeout(() => {
            console.log(`Touch: Clearing ${key} key press`);
            input.keys[key] = false;
            
            // Reset special flags
            if (key === 'Enter') {
                input.enterKeyPressed = false;
            }
            
            // Dispatch corresponding keyup event
            const upEvent = new KeyboardEvent('keyup', {
                key: key,
                code: keyCodeStr,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true
            });
            document.dispatchEvent(upEvent);
        }, 250); // Longer delay for better detection
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
