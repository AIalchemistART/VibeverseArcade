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
        this.zoomButtonElement = null;
        this.controlsVisible = false;
        
        // Zoom toggle state (0: default, 1: zoomed in, 2: zoomed out)
        this.zoomState = 0;
        this.zoomLevels = [1.0, 1.5, 0.75]; // Default, full zoom, 3/4 zoom out
        
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
     * Update zoom button icon based on current zoom state
     */
    updateZoomButtonIcon() {
        if (!this.zoomButtonElement) return;
        
        let svgIcon;
        let glowColor;
        
        // Remove all state classes
        this.zoomButtonElement.classList.remove('zoom-state-0', 'zoom-state-1', 'zoom-state-2');
        
        switch(this.zoomState) {
            case 0: // Default zoom
                glowColor = '#00ffcc';
                svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="${glowColor}" stroke-width="2"/>
                    <path d="M15 15L20 20" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                </svg>`;
                this.zoomButtonElement.classList.add('zoom-state-0');
                break;
            case 1: // Zoomed in
                glowColor = '#00ffff';
                svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="${glowColor}" stroke-width="2"/>
                    <path d="M15 15L20 20" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 10.5H13" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                    <path d="M10.5 8V13" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                </svg>`;
                this.zoomButtonElement.classList.add('zoom-state-1');
                break;
            case 2: // Zoomed out
                glowColor = '#ff00ff';
                svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="${glowColor}" stroke-width="2"/>
                    <path d="M15 15L20 20" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 10.5H13" stroke="${glowColor}" stroke-width="2" stroke-linecap="round"/>
                </svg>`;
                this.zoomButtonElement.classList.add('zoom-state-2');
                break;
        }
        
        // Apply the SVG icon with neon glow effect
        this.zoomButtonElement.innerHTML = `<div style="filter: drop-shadow(0 0 3px ${glowColor});">${svgIcon}</div>`;
    }
    
    /**
     * Toggle between zoom levels
     */
    toggleZoomLevel() {
        // Cycle to next zoom state
        this.zoomState = (this.zoomState + 1) % this.zoomLevels.length;
        
        // Get camera reference directly from the global scope
        // We've added camera to window.gameCamera in main.js
        const camera = window.gameCamera;
        
        if (!camera) {
            console.warn('Camera not found for zoom toggle. Please reload the page.');
            
            // Show visual feedback that camera wasn't found
            this.zoomButtonElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            setTimeout(() => {
                this.updateZoomButtonIcon(); // Reset to proper state
            }, 500);
            return;
        }
        
        // Apply the new zoom level
        const newZoom = this.zoomLevels[this.zoomState];
        camera.setZoom(newZoom);
        
        // Get glow color based on state for animation
        let glowColor;
        switch(this.zoomState) {
            case 0: // Default
                glowColor = '#00ffcc';
                break;
            case 1: // Zoomed in
                glowColor = '#00ffff';
                break;
            case 2: // Zoomed out
                glowColor = '#ff00ff';
                break;
        }
        
        // Update the SVG icon and state colors based on current zoom state
        this.updateZoomButtonIcon();
        
        // Apply a quick visual feedback animation with cyberpunk effects
        this.zoomButtonElement.style.transform = 'scale(1.1)';
        this.zoomButtonElement.style.boxShadow = `0 0 20px ${glowColor}, 0 0 35px ${glowColor}80`;
        
        // After animation, let CSS classes handle the colors
        setTimeout(() => {
            this.zoomButtonElement.style.transform = 'scale(1)';
            
            // Ensure only inline transform is reset, so CSS class styling takes effect
            // Do NOT set box-shadow here; let the CSS classes handle it
            this.zoomButtonElement.style.removeProperty('box-shadow');
        }, 300);
        
        console.log(`Zoom toggled to level ${this.zoomState}: ${newZoom} with color ${glowColor}`);
    }
    
    /**
     * Show virtual joystick and touch buttons
     */
    showTouchControls() {
        console.log('Showing touch controls');
        if (this.joystickElement && this.actionButtonElement && this.escapeButtonElement && this.zoomButtonElement) {
            this.joystickElement.style.display = 'block';
            this.actionButtonElement.style.display = 'block';
            this.escapeButtonElement.style.display = 'block';
            this.zoomButtonElement.style.display = 'flex';
            
            // Ensure buttons are above any menus or overlays
            this.joystickElement.style.zIndex = '9999';
            this.actionButtonElement.style.zIndex = '9999';
            this.escapeButtonElement.style.zIndex = '9999';
            this.zoomButtonElement.style.zIndex = '9999';
            
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
        if (this.joystickElement && this.actionButtonElement && this.escapeButtonElement && this.zoomButtonElement) {
            this.joystickElement.style.display = 'none';
            this.actionButtonElement.style.display = 'none';
            this.zoomButtonElement.style.display = 'none';
            this.escapeButtonElement.style.display = 'none';
            this.controlsVisible = false;
            console.log('Touch controls hidden');
        }
    }
    
    /**
     * Creates touch UI elements (virtual joystick, action button, and zoom toggle)
     */
    createTouchUI() {
        // Import cyberpunk font if not already in the document
        if (!document.getElementById('cyberpunk-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'cyberpunk-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
            document.head.appendChild(fontLink);
            console.log('Added Orbitron cyberpunk font');
        }
        
        // Create joystick base with cyberpunk/synthwave styling
        this.joystickElement = document.createElement('div');
        this.joystickElement.id = 'virtualJoystick';
        this.joystickElement.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 120px;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(77, 5, 232, 0.2) 0%, rgba(41, 0, 128, 0.3) 70%, rgba(128, 0, 255, 0.4) 100%);
            border: 2px solid rgba(191, 87, 255, 0.8);
            box-shadow: 0 0 15px rgba(123, 31, 162, 0.7), inset 0 0 10px rgba(191, 87, 255, 0.5);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
        `;
        console.log('Created virtual joystick with cyberpunk styling');
        
        // Create joystick knob with neon glow
        this.joystickKnobElement = document.createElement('div');
        this.joystickKnobElement.id = 'joystickKnob';
        this.joystickKnobElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(255, 41, 250, 0.9) 0%, rgba(199, 0, 221, 0.7) 70%);
            border: 2px solid rgba(255, 92, 255, 0.9);
            box-shadow: 0 0 10px rgba(252, 25, 255, 0.8), 0 0 20px rgba(252, 25, 255, 0.4);
            border-radius: 50%;
            pointer-events: none;
            transition: transform 0.15s ease, box-shadow 0.2s ease;
        `;
        
        // Create interact button with magical cyberpunk styling
        this.actionButtonElement = document.createElement('div');
        this.actionButtonElement.id = 'interactButton';
        this.actionButtonElement.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 120px;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(72, 255, 168, 0.8) 0%, rgba(0, 192, 112, 0.7) 70%);
            border: 2px solid rgba(0, 255, 170, 0.9);
            box-shadow: 0 0 15px rgba(0, 230, 118, 0.7), inset 0 0 8px rgba(157, 255, 204, 0.6);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
            font-family: 'Orbitron', sans-serif;
            color: white;
            text-align: center;
            line-height: 100px;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 0 5px #00ffaa, 0 0 10px rgba(0, 255, 170, 0.6);
            transition: all 0.2s ease;
            backdrop-filter: blur(2px);
        `;
        this.actionButtonElement.textContent = 'INTERACT';
        
        // Create escape button with synthwave alert styling
        this.escapeButtonElement = document.createElement('div');
        this.escapeButtonElement.id = 'escapeButton';
        this.escapeButtonElement.style.cssText = `
            position: fixed;
            bottom: 240px;
            right: 140px;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(255, 82, 82, 0.8) 0%, rgba(192, 0, 0, 0.7) 70%);
            border: 2px solid rgba(255, 61, 61, 0.9);
            box-shadow: 0 0 15px rgba(230, 0, 0, 0.7), inset 0 0 8px rgba(255, 157, 157, 0.6);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
            display: none;
            font-family: 'Orbitron', sans-serif;
            color: white;
            text-align: center;
            line-height: 60px;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 5px #ff3838, 0 0 10px rgba(255, 0, 0, 0.6);
            transition: all 0.2s ease;
            backdrop-filter: blur(2px);
        `;
        this.escapeButtonElement.textContent = 'ESC';
        
        // Add elements to DOM
        this.joystickElement.appendChild(this.joystickKnobElement);
        document.body.appendChild(this.joystickElement);
        document.body.appendChild(this.actionButtonElement);
        document.body.appendChild(this.escapeButtonElement);
        
        // Create zoom toggle button with enhanced cyberpunk magical styling
        this.zoomButtonElement = document.createElement('div');
        this.zoomButtonElement.id = 'zoomToggleButton';
        this.zoomButtonElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 50px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(26, 5, 54, 0.9);
            border: 2px solid #00ffcc;
            box-shadow: 0 0 8px #00ffff, 0 0 16px rgba(0, 255, 204, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            font-weight: bold;
            color: #00ffcc;
            text-shadow: 0 0 5px #00ffcc, 0 0 10px rgba(0, 255, 204, 0.7);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            backdrop-filter: blur(3px);
            animation: neonZoomPulse 3s infinite;
        `;
        
        // Add key frames for subtle pulse animation and zoom button states
        if (!document.getElementById('cyberpunk-animations')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'cyberpunk-animations';
            styleSheet.textContent = `
                @keyframes neonZoomPulse {
                    0% { box-shadow: 0 0 8px #00ffcc, 0 0 12px #00ffcc; }
                    50% { box-shadow: 0 0 15px #00ffcc, 0 0 25px #00ffcc; }
                    100% { box-shadow: 0 0 8px #00ffcc, 0 0 12px #00ffcc; }
                }
                @keyframes textGlow {
                    0% { text-shadow: 0 0 5px #00ffcc, 0 0 10px rgba(0, 255, 204, 0.7); }
                    100% { text-shadow: 0 0 8px #00ffcc, 0 0 15px rgba(0, 255, 204, 0.9); }
                }
                
                /* Zoom Button State Classes - More distinctive colors */
                #zoomToggleButton.zoom-state-0 { 
                    background-color: rgba(26, 5, 54, 0.9) !important;
                    border-color: #00ffcc !important;
                    box-shadow: 0 0 10px #00ffcc, 0 0 20px rgba(0, 255, 204, 0.5) !important;
                }
                #zoomToggleButton.zoom-state-1 { 
                    background-color: rgba(0, 80, 95, 0.9) !important;
                    border-color: #00ffff !important;
                    box-shadow: 0 0 10px #00ffff, 0 0 20px rgba(0, 255, 255, 0.5) !important;
                }
                #zoomToggleButton.zoom-state-2 { 
                    background-color: rgba(90, 0, 120, 0.9) !important;
                    border-color: #ff00ff !important;
                    box-shadow: 0 0 10px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.5) !important;
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Create SVG icon for zoom button that changes based on zoom state
        this.updateZoomButtonIcon();
        document.body.appendChild(this.zoomButtonElement);
        
        // Create a single handler function for zoom level toggle to ensure consistent behavior
        const handleZoomAction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleZoomLevel();
            return false; // Prevent any default actions
        };

        // Apply pressed visual state function with enhanced cyberpunk feedback
        const applyPressedState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.zoomButtonElement.style.transform = 'scale(0.92)';
            this.zoomButtonElement.style.boxShadow = '0 0 20px #00ffcc, 0 0 35px rgba(0, 255, 204, 0.8)';
            this.zoomButtonElement.style.background = 'rgba(0, 66, 77, 0.9)';
            return false;
        };

        // Return to normal state function
        const returnToNormalState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.zoomButtonElement.style.transform = 'scale(1)';
            this.zoomButtonElement.style.boxShadow = '';
            this.zoomButtonElement.style.background = 'rgba(26, 5, 54, 0.9)';
            return false;
        };
        
        // Apply similar visual feedback for interaction buttons with actual functionality
        const applyActionPressedState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Visual feedback
            this.actionButtonElement.style.transform = 'scale(0.92)';
            this.actionButtonElement.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.9), inset 0 0 12px rgba(157, 255, 204, 0.8)';
            this.actionButtonElement.style.textShadow = '0 0 8px #00ffaa, 0 0 15px rgba(0, 255, 170, 0.8)';
            // Critical functionality: Activate interaction in the game
            this.setAction(true);
        };
        
        const returnActionToNormalState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Visual feedback
            this.actionButtonElement.style.transform = 'scale(1)';
            this.actionButtonElement.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.7), inset 0 0 8px rgba(157, 255, 204, 0.6)';
            this.actionButtonElement.style.textShadow = '0 0 5px #00ffaa, 0 0 10px rgba(0, 255, 170, 0.6)';
            // Critical functionality: Deactivate interaction in the game
            this.setAction(false);
        };
        
        // Apply escape button visual feedback with red synthwave glow & escape functionality
        const applyEscapePressedState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Visual feedback
            this.escapeButtonElement.style.transform = 'scale(0.92)';
            this.escapeButtonElement.style.boxShadow = '0 0 20px rgba(230, 0, 0, 0.9), inset 0 0 12px rgba(255, 157, 157, 0.8)';
            this.escapeButtonElement.style.textShadow = '0 0 8px #ff3838, 0 0 15px rgba(255, 0, 0, 0.8)';
            // Critical functionality: Activate escape in the game
            this.setEscape(true);
        };
        
        const returnEscapeToNormalState = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Visual feedback
            this.escapeButtonElement.style.transform = 'scale(1)';
            this.escapeButtonElement.style.boxShadow = '0 0 15px rgba(230, 0, 0, 0.7), inset 0 0 8px rgba(255, 157, 157, 0.6)';
            this.escapeButtonElement.style.textShadow = '0 0 5px #ff3838, 0 0 10px rgba(255, 0, 0, 0.6)';
            // Critical functionality: Deactivate escape in the game
            this.setEscape(false);
            
            // Also simulate Escape key press for menus that require it
            this.simulateKeyPress('Escape');
        };

        // Add Android-friendly touch events (must be added before mouse events)
        this.zoomButtonElement.addEventListener('touchstart', applyPressedState, { passive: false });
        this.zoomButtonElement.addEventListener('touchend', (e) => {
            returnToNormalState(e);
            handleZoomAction(e);
        }, { passive: false });
        
        // Add enhanced touch events for action button with direct simulation
        this.actionButtonElement.addEventListener('touchstart', (e) => {
            // Apply visual effects
            applyActionPressedState(e);
            
            // DIRECT KEY SIMULATION: Trigger an Enter key event
            // This directly simulates a keyboard event without relying on input system
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            document.dispatchEvent(enterEvent);
            console.log('🎮 INTERACT: Direct Enter keydown event dispatched');
            
            // Also set the global input flags just to be thorough
            if (window.input && window.input.keys) {
                window.input.keys['Enter'] = true;
                if (typeof window.input.enterKeyPressed !== 'undefined') {
                    window.input.enterKeyPressed = true;
                }
            }
        }, { passive: false });
        
        this.actionButtonElement.addEventListener('touchend', (e) => {
            // Apply visual effects
            returnActionToNormalState(e);
            
            // DIRECT KEY SIMULATION: Trigger an Enter key up event
            const enterUpEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            document.dispatchEvent(enterUpEvent);
            console.log('🎮 INTERACT: Direct Enter keyup event dispatched');
            
            // Clear the global input flags
            if (window.input && window.input.keys) {
                window.input.keys['Enter'] = false;
                if (typeof window.input.enterKeyPressed !== 'undefined') {
                    window.input.enterKeyPressed = false;
                }
            }
        }, { passive: false });
        
        // Add enhanced touch events for escape button with direct simulation
        this.escapeButtonElement.addEventListener('touchstart', (e) => {
            // Apply visual effects
            applyEscapePressedState(e);
            
            // DIRECT KEY SIMULATION: Trigger an Escape key event
            // This directly simulates a keyboard event without relying on input system
            const escapeEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                which: 27,
                bubbles: true
            });
            document.dispatchEvent(escapeEvent);
            console.log('🎮 ESCAPE: Direct Escape keydown event dispatched');
            
            // Also set the global input flags just to be thorough
            if (window.input && window.input.keys) {
                window.input.keys['Escape'] = true;
            }
        }, { passive: false });
        
        this.escapeButtonElement.addEventListener('touchend', (e) => {
            // Apply visual effects
            returnEscapeToNormalState(e);
            
            // DIRECT KEY SIMULATION: Trigger an Escape key up event
            const escapeUpEvent = new KeyboardEvent('keyup', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                which: 27,
                bubbles: true
            });
            document.dispatchEvent(escapeUpEvent);
            console.log('🎮 ESCAPE: Direct Escape keyup event dispatched');
            
            // Clear the global input flags
            if (window.input && window.input.keys) {
                window.input.keys['Escape'] = false;
            }
        }, { passive: false });
        
        // Cancel touch if moved out of button
        this.zoomButtonElement.addEventListener('touchcancel', returnToNormalState, { passive: false });
        this.zoomButtonElement.addEventListener('touchmove', (e) => {
            // Optional: handle if touch moves out of the button area
            const touch = e.touches[0];
            const rect = this.zoomButtonElement.getBoundingClientRect();
            if (touch.clientX < rect.left || touch.clientX > rect.right || 
                touch.clientY < rect.top || touch.clientY > rect.bottom) {
                returnToNormalState(e);
            }
        }, { passive: false });
        
        // Also add mouse events for desktop support (will be ignored on pure touch devices)
        this.zoomButtonElement.addEventListener('mousedown', applyPressedState);
        this.zoomButtonElement.addEventListener('mouseup', (e) => {
            returnToNormalState(e);
            handleZoomAction(e);
        });
        this.zoomButtonElement.addEventListener('mouseleave', returnToNormalState);
        
        // Add mouse events for action and escape buttons
        this.actionButtonElement.addEventListener('mousedown', applyActionPressedState);
        this.actionButtonElement.addEventListener('mouseup', returnActionToNormalState);
        this.actionButtonElement.addEventListener('mouseleave', returnActionToNormalState);
        
        this.escapeButtonElement.addEventListener('mousedown', applyEscapePressedState);
        this.escapeButtonElement.addEventListener('mouseup', returnEscapeToNormalState);
        this.escapeButtonElement.addEventListener('mouseleave', returnEscapeToNormalState);
        
        console.log('Touch UI elements created with cyberpunk/synthwave styling');
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
            touch-action: pan-x pan-y; /* Allow wheel events to pass through */
            background-color: transparent;
        `;
        document.body.appendChild(touchOverlay);
        console.log('Touch overlay created and added to DOM');
        
        // Listen for touch events on the entire document
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Make sure wheel events still work for zooming
        touchOverlay.addEventListener('wheel', (e) => {
            // Just let the wheel event pass through to the canvas
            const wheelEvent = new WheelEvent('wheel', {
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: true,
                cancelable: true
            });
            canvas.dispatchEvent(wheelEvent);
        }, { passive: false });
        
        // Note: we removed these listeners since they're now handled in createTouchUI
        // with our cyberpunk styling effect functions that also set the action state
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
        // First check if we're clicking on a modal (YouTube or SoundCloud)
        const youtubeModal = document.getElementById('youtube-modal');
        const soundCloudModal = document.getElementById('soundCloudPlayerModal');
        
        if (youtubeModal || soundCloudModal) {
            // If any modal is open, don't process touch events
            // This lets modal buttons receive clicks directly
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
        // Check if any modal is open (YouTube or SoundCloud)
        const youtubeModal = document.getElementById('youtube-modal');
        const soundCloudModal = document.getElementById('soundCloudPlayerModal');
        
        if (youtubeModal || soundCloudModal) {
            // If any modal is open, don't process touch events
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
        // Check if any modal is open (YouTube or SoundCloud)
        const youtubeModal = document.getElementById('youtube-modal');
        const soundCloudModal = document.getElementById('soundCloudPlayerModal');
        
        if (youtubeModal || soundCloudModal) {
            // If any modal is open, don't process touch events
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
            this.zoomButtonElement.style.display = 'flex';
            
            // Use very high z-index to ensure they appear above everything
            this.actionButtonElement.style.zIndex = '9999';
            this.escapeButtonElement.style.zIndex = '9999';
            this.zoomButtonElement.style.zIndex = '9999';
            
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
        
        // Update BOTH input system and window.input for interaction
        // This is critical because ArcadeEntity checks window.input instead of input
        if (active) {
            // Update local input object
            input.keys['Enter'] = true; // Enter key for interaction
            input.enterKeyPressed = true; // Also set the special flag
            
            // Also update global window.input object directly as ArcadeEntity checks this
            if (window.input) {
                window.input.keys['Enter'] = true;
                window.input.enterKeyPressed = true;
            }
            
            // Simulate a proper keydown event to ensure game systems detect it
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            document.dispatchEvent(enterEvent);
            
            console.log('Touch: Enter key and flag set to true (with window.input update)');
        } else {
            // Update local input object
            input.keys['Enter'] = false;
            input.enterKeyPressed = false;
            
            // Also update global window.input object directly
            if (window.input) {
                window.input.keys['Enter'] = false;
                window.input.enterKeyPressed = false;
            }
            
            // Simulate a proper keyup event
            const enterEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            document.dispatchEvent(enterEvent);
            
            console.log('Touch: Enter key and flag set to false (with window.input update)');
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
