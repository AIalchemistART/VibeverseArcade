/**
 * SpellbookEntity2 class
 * Represents an interactive spellbook that the player can interact with
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { input } from './input.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

export class SpellbookEntity2 extends Entity {
    /**
     * Create a new spellbook entity
     * @param {number} x - X position in the grid
     * @param {number} y - Y position in the grid
     * @param {number} z - Z position in the grid
     * @param {Object} options - Spellbook options
     */
    constructor(x, y, z = 0, options = {}) {
        super(x, y, z);
        
        // Set entity properties
        this.type = 'spellbook';
        this.isStatic = true;
        this.collidable = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.zHeight = 1.0;

        this.width = 2;   // default is probably 1.0
        this.height = 2;
        
        // Spellbook-specific properties
        this.spellbookId = options.id || 'spellbook1';
        this.glowColor = options.glowColor || '#008080'; // Teal glow matching X portal
        this.glowIntensity = 0.3; // Start at a higher intensity for more dramatic effect
        this.glowDirection = 1; // Direction of glow animation (1 = increasing, -1 = decreasing)
        this.glowSpeed = 0.02; // Matching X portal's speed for consistent feel
        this.maxGlowIntensity = options.maxGlowIntensity || 0.4; // Higher max intensity for more dramatic effect
        this.minGlowIntensity = 0.2; // Match X portal min
        this.proximityBoost = 2.5; // Higher boost for more dramatic effect in proximity
        this.interactionDistance = options.interactionDistance || 4.0; // 3 grid units
        
        // Interaction state
        this.isPlayerNearby = false;
        this.showPrompt = false;
        this.interactionEnabled = true;
        this.interactionPromptAlpha = 0; // For fade in/out effect
        this.wasEnterPressed = false;
        
        // Animation properties
        this.animationTime = 0;
        this.floatAmplitude = 0.1; // Floating animation amplitude
        this.floatSpeed = 1.5; // Floating animation speed
        
        // Image loading properties
        this.loadAttempts = 0;
        this.maxLoadAttempts = 4;
        this.spellbookImage = null;
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(this.spellbookId);
        if (existingAsset) {
            debug(`SpellbookEntity: Found existing asset for ${this.spellbookId} in asset loader`);
            this.spellbookImage = existingAsset;
        } else {
            debug(`SpellbookEntity: No existing asset found for ${this.spellbookId}, will load directly`);
        }
        
        // Load spellbook image
        this.directLoadSpellbookImage();
        
        debug(`SpellbookEntity: Created at (${x}, ${y}, ${z})`);
    }
    
    /**
     * Directly load the spellbook image without relying on asset loader
     */
    directLoadSpellbookImage() {
        if (this.spellbookImage) {
            debug(`SpellbookEntity: Spellbook image already loaded, skipping direct load`);
            return;
        }
        
        debug(`SpellbookEntity: Directly loading spellbook image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`SpellbookEntity: Successfully loaded spellbook image directly (${img.width}x${img.height})`);
            this.spellbookImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.spellbookId] = img;
            debug(`SpellbookEntity: Stored spellbook image in asset loader with key ${this.spellbookId}`);
        };
        
        img.onerror = (err) => {
            debug(`SpellbookEntity: Failed to load spellbook image directly: ${err}`);
            debug(`SpellbookEntity: Failed path was: assets/decor/Spellbook_2.png`);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                debug(`SpellbookEntity: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                debug(`SpellbookEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution for GitHub Pages compatibility
        const exactPath = 'assets/decor/Spellbook_2.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`SpellbookEntity: Setting image src to resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        debug(`SpellbookEntity: Trying alternative path (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        const paths = [
            'assets/decor/Spellbook_2.png',
            './assets/decor/Spellbook_2.png',
            'assets/decor/spellbook_2.png'
        ];
        
        const pathIndex = (this.loadAttempts - 1) % paths.length;
        const path = paths[pathIndex];
        
        debug(`SpellbookEntity: Trying path: ${path}`);
        
        const img = new Image();
        
        img.onload = () => {
            debug(`SpellbookEntity: Alternative path successful: ${path}`);
            this.spellbookImage = img;
            
            // Store in asset loader
            assetLoader.assets[this.spellbookId] = img;
        };
        
        img.onerror = () => {
            this.loadAttempts++;
            debug(`SpellbookEntity: Alternative path failed: ${path}`);
            
            if (this.loadAttempts < this.maxLoadAttempts) {
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                debug(`SpellbookEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Resolve path for GitHub Pages compatibility
        const resolvedPath = getAssetPath(path);
        debug(`SpellbookEntity: Setting alternative image src to resolved path: ${resolvedPath} (original: ${path})`);
        img.src = resolvedPath;
    }
    
    /**
     * Create a fallback image if the spellbook image fails to load
     */
    createFallbackImage() {
        debug('SpellbookEntity: Creating fallback image');
        
        // Create a canvas for the fallback image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple book shape
        ctx.fillStyle = '#8B4513'; // Brown book cover
        ctx.fillRect(32, 50, 64, 10); // Book spine
        ctx.fillRect(24, 60, 80, 30); // Book body
        
        // Add some page details
        ctx.fillStyle = '#F0E6D2'; // Parchment color
        ctx.fillRect(28, 65, 72, 20); // Pages
        
        // Add some magical runes
        ctx.strokeStyle = '#61D836'; // Green runes
        ctx.lineWidth = 2;
        
        // Rune pattern 1
        ctx.beginPath();
        ctx.moveTo(40, 75);
        ctx.lineTo(60, 75);
        ctx.moveTo(50, 65);
        ctx.lineTo(50, 85);
        ctx.stroke();
        
        // Rune pattern 2
        ctx.beginPath();
        ctx.arc(80, 75, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Convert the canvas to an image
        const img = new Image();
        img.src = canvas.toDataURL();
        
        // Store in asset loader
        assetLoader.assets[this.spellbookId] = img;
        
        debug('SpellbookEntity: Fallback image created and stored');
    }
    
    /**
     * Update the spellbook entity
     * @param {number} deltaTime - Time since last update in ms
     * @param {Entity} player - Player entity for proximity detection
     */
    update(deltaTime, player) {
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
        
        // Update animation time
        this.animationTime += deltaTime * 0.001; // Convert to seconds
        
        // Check if player is nearby for interaction
        this.updatePlayerProximity(player);
        
        // Update glow effect
        this.updateGlowEffect(deltaTime);
        
        // Check for interaction (Enter key press)
        this.checkForInteraction();
    }
    
    /**
     * Update player proximity status
     * @param {Entity} player - Player entity
     */
    updatePlayerProximity(player) {
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track previous state for transition logging
            const wasNearby = this.isPlayerNearby;
            
            // Update proximity state
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Log state changes
            if (!wasNearby && this.isPlayerNearby) {
                debug(`SpellbookEntity: Player entered interaction range (${distance.toFixed(2)} units)`);
                
                // Play magical proximity sound when player enters range
                this.playProximitySound();
            } else if (wasNearby && !this.isPlayerNearby) {
                debug(`SpellbookEntity: Player left interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Handle interaction prompt fade
            if (this.isPlayerNearby) {
                // Fade in prompt
                this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                this.showPrompt = true;
            } else {
                // Fade out prompt
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
                if (this.interactionPromptAlpha <= 0) {
                    this.showPrompt = false;
                }
            }
        }
    }
    
    /**
     * Update the glow effect based on player proximity
     * @param {number} deltaTime - Time since last update
     */
    updateGlowEffect(deltaTime) {
        // Direct glow pulsing like the X portal (simpler method)
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        
        // Reverse direction when reaching min/max values
        if (this.glowIntensity > this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity < this.minGlowIntensity) {
            this.glowIntensity = this.minGlowIntensity;
            this.glowDirection = 1;
        }
        
        // Enhance glow when player is nearby (using stronger boost)
        this.proximityBoost = this.isPlayerNearby ? 3.0 : 1.0;
        
        // Debug logging occasionally
        if (Math.random() < 0.01) {
            console.log(`Spellbook glow: intensity=${this.glowIntensity.toFixed(2)}, direction=${this.glowDirection}, proximityBoost=${this.proximityBoost}`);
        }
    }
    
    /**
     * Check for player interaction
     */
    checkForInteraction() {
        if (this.isPlayerNearby && this.interactionEnabled) {
            // Use the enhanced input system with all possible Enter key detection methods
            const isEnterPressed = input.enterKeyPressed || 
                                  input.numpadEnterPressed || 
                                  input.keys['Enter'] || 
                                  input.keys['NumpadEnter'] || 
                                  input.isKeyPressed('Enter') || 
                                  input.isKeyPressed('NumpadEnter');
            
            // Specific Enter key press detection (not just held down)
            const isNewEnterPress = isEnterPressed && !this.wasEnterPressed;
            
            // Aggressive logging to debug the issue
            console.log(`Spellbook interaction check:`, {
                isPlayerNearby: this.isPlayerNearby,
                isEnterPressed: isEnterPressed,
                wasEnterPressed: this.wasEnterPressed,
                isNewEnterPress: isNewEnterPress,
                enterFlag: input.enterKeyPressed,
                numpadEnterFlag: input.numpadEnterPressed,
                enterKey: input.keys['Enter'],
                numpadEnterKey: input.keys['NumpadEnter'],
                time: new Date().toISOString(),
                position: `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
            });
            
            // Only detect a new press (not holding)
            if (isNewEnterPress) {
                console.log('SpellbookEntity: NEW Enter key press detected, opening spellbook!');
                // Force this to run async to avoid any race conditions
                setTimeout(() => this.interact(), 50);
            }
            
            // Update previous state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Handle spellbook interaction
     */
    interact() {
        if (!this.interactionEnabled) return;
        
        debug('SpellbookEntity: Spellbook opened');
        
        // Play a sound effect
        this.playSpellbookSound();
        
        // Display the spellbook page overlay
        this.displaySpellbookPage();
        
        // Trigger game event (could be used to unlock spells, show UI, etc.)
        const event = new CustomEvent('spellbook-interaction', {
            detail: { id: this.spellbookId }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Display the Windsurf AI advertisement overlay
     */
    displaySpellbookPage() {
        // Create a global touch event interceptor
        const globalTouchInterceptor = document.createElement('div');
        globalTouchInterceptor.id = 'global-touch-interceptor';
        globalTouchInterceptor.style.position = 'fixed';
        globalTouchInterceptor.style.top = '0';
        globalTouchInterceptor.style.left = '0';
        globalTouchInterceptor.style.width = '100vw';
        globalTouchInterceptor.style.height = '100vh';
        globalTouchInterceptor.style.backgroundColor = 'transparent';
        globalTouchInterceptor.style.zIndex = '9990'; // Higher than game controls but lower than our overlay
        globalTouchInterceptor.style.touchAction = 'none'; // Disable all browser touch actions
        document.body.appendChild(globalTouchInterceptor);
        
        // Directly capture and stop all touch events at the document level
        const originalTouchStart = document.ontouchstart;
        const originalTouchMove = document.ontouchmove;
        const originalTouchEnd = document.ontouchend;
        
        // Override document-level touch handlers
        document.ontouchstart = (e) => {
            // Only allow touch events inside our overlay
            const path = e.path || (e.composedPath && e.composedPath()) || [];
            const isInsideOverlay = path.some(el => el.id === 'spellbook-overlay');
            
            if (!isInsideOverlay) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        
        document.ontouchmove = (e) => {
            // Only allow touch events inside our overlay
            const path = e.path || (e.composedPath && e.composedPath()) || [];
            const isInsideOverlay = path.some(el => el.id === 'spellbook-overlay');
            
            if (!isInsideOverlay) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        
        document.ontouchend = (e) => {
            // Only allow touch events inside our overlay
            const path = e.path || (e.composedPath && e.composedPath()) || [];
            const isInsideOverlay = path.some(el => el.id === 'spellbook-overlay');
            
            if (!isInsideOverlay) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        
        // Store the original game.js input handlers if they exist
        let originalGameHandlers = {};
        if (window.game && window.game.input) {
            ['handleMouseDown', 'handleMouseMove', 'handleMouseUp', 'handleTouchStart', 'handleTouchMove', 'handleTouchEnd'].forEach(handlerName => {
                if (typeof window.game.input[handlerName] === 'function') {
                    originalGameHandlers[handlerName] = window.game.input[handlerName];
                    // Replace with empty function
                    window.game.input[handlerName] = () => {};
                }
            });
        }
        
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'spellbook-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999'; // Increased z-index to ensure it's above all game controls
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'auto'; // Ensure pointer events work
        
        // Create spellbook page container with cyberpunk styling
        const spellbookPage = document.createElement('div');
        spellbookPage.className = 'windsurf-ad';
        spellbookPage.style.width = '90%';
        spellbookPage.style.maxWidth = '800px';
        spellbookPage.style.height = '90%';
        spellbookPage.style.maxHeight = '700px';
        spellbookPage.style.backgroundColor = '#0a0a14'; // Dark cyberpunk background
        spellbookPage.style.borderRadius = '5px';
        spellbookPage.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(128, 0, 255, 0.3)';
        spellbookPage.style.padding = '30px';
        spellbookPage.style.overflowY = 'auto';
        spellbookPage.style.overflowX = 'hidden'; // Prevent horizontal scrolling
        spellbookPage.style.color = '#e0e0ff';
        spellbookPage.style.position = 'relative';
        spellbookPage.style.fontFamily = '"Rajdhani", "Orbitron", sans-serif';
        spellbookPage.style.scrollBehavior = 'smooth'; // Add smooth scrolling effect
        spellbookPage.style.zIndex = '9000'; // Set z-index lower than radio button (10000) but above touch controls
        
        // Add visual indication that the page is scrollable
        const scrollIndicator = document.createElement('div');
        scrollIndicator.style.position = 'absolute';
        scrollIndicator.style.bottom = '15px';
        scrollIndicator.style.right = '15px';
        scrollIndicator.style.width = '40px';
        scrollIndicator.style.height = '40px';
        scrollIndicator.style.borderRadius = '50%';
        scrollIndicator.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
        scrollIndicator.style.display = 'flex';
        scrollIndicator.style.justifyContent = 'center';
        scrollIndicator.style.alignItems = 'center';
        scrollIndicator.style.pointerEvents = 'none';
        scrollIndicator.style.zIndex = '9500'; // Higher than page but lower than radio button
        scrollIndicator.style.opacity = '0.7';
        scrollIndicator.style.transition = 'opacity 0.3s ease';
        scrollIndicator.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
        scrollIndicator.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5L12 19" stroke="#0ff" stroke-width="2" stroke-linecap="round"/>
                <path d="M6 11L12 5L18 11" stroke="#0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 13L12 19L18 13" stroke="#0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Implement touch-based drag scrolling
        let isDragging = false;
        let startY = 0;
        let scrollTop = 0;
        let lastY = 0;
        let velocity = 0;
        let animationFrameId = null;
        let lastTimestamp = 0;
        
        // Handle touch start - initialize drag with enhanced reliability
        const handleTouchStart = (e) => {
            // First, always capture this event and prevent it from bubbling to game controls
            e.stopPropagation();
            
            // Check if we're touching the radio container or close button
            // Use path or composedPath() for more reliable element detection
            const path = e.path || (e.composedPath && e.composedPath()) || [];
            const isSpecialElement = path.some(el => {
                return el && el.classList && (
                    el.classList.contains('radio-container') || 
                    el.classList.contains('prominent-close-btn')
                );
            });
            
            // Don't interfere with special element interactions
            if (isSpecialElement || 
                e.target.closest('.radio-container') || 
                e.target.closest('.prominent-close-btn')) {
                console.log('Windsurf Ad: Touch on special element, ignoring for scrolling');
                return;
            }
            
            // Visual feedback - highlight the scrollable area subtly
            spellbookPage.style.boxShadow = '0 0 40px rgba(0, 255, 255, 0.7), 0 0 70px rgba(128, 0, 255, 0.4)';
            
            // Capture the initial touch position and current scroll position
            isDragging = true;
            startY = e.touches[0].clientY;
            lastY = startY;
            scrollTop = spellbookPage.scrollTop;
            velocity = 0;
            lastTimestamp = Date.now();
            
            // Show scroll indicator when starting to drag
            scrollIndicator.style.opacity = '1';
            
            // Stop any ongoing momentum scrolling
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Prevent default to avoid browser's native scrolling
            e.preventDefault();
        };
        
        // Handle touch move - perform scrolling
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            // Check if we've moved over the radio button area during drag
            const path = e.path || (e.composedPath && e.composedPath()) || [];
            const isOverRadio = path.some(el => {
                return el.classList && (el.classList.contains('radio-container') || 
                       el.parentElement?.classList?.contains('radio-container'));
            });
            
            // If we're now over the radio button, temporarily make it non-interactive
            // This prevents accidental clicks while scrolling over it
            if (isOverRadio) {
                const radioElements = document.querySelectorAll('.radio-container');
                radioElements.forEach(el => {
                    el.style.pointerEvents = 'none';
                    // Store current z-index to restore later
                    el.dataset.originalZIndex = el.style.zIndex || '10000';
                    // Temporarily lower z-index to ensure scroll takes precedence
                    el.style.zIndex = '9800';
                });
                
                // Set a timeout to restore interactivity after scrolling ends
                clearTimeout(window.radioRestoreTimeout);
                window.radioRestoreTimeout = setTimeout(() => {
                    if (!isDragging) {
                        radioElements.forEach(el => {
                            el.style.pointerEvents = 'auto';
                            // Restore original z-index
                            el.style.zIndex = el.dataset.originalZIndex || '10000';
                        });
                    }
                }, 200);
            }
            
            // Calculate the distance moved
            const currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            
            // Update the scroll position
            spellbookPage.scrollTop = scrollTop + deltaY;
            
            // Calculate velocity for momentum scrolling
            const now = Date.now();
            const timeDiff = now - lastTimestamp;
            if (timeDiff > 0) {
                velocity = (lastY - currentY) / timeDiff * 15; // Adjust multiplier for speed
                lastTimestamp = now;
                lastY = currentY;
            }
            
            // Prevent default to avoid browser's native scrolling
            e.preventDefault();
        };
        
        // Handle touch end - implement momentum scrolling with enhanced reliability
        const handleTouchEnd = (e) => {
            // Prevent event bubbling regardless of dragging state
            if (e) {
                e.stopPropagation();
            }
            
            if (!isDragging) return;
            
            // Reset dragging state
            isDragging = false;
            
            // Restore visual state for the scrollable area
            spellbookPage.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(128, 0, 255, 0.3)';
            
            // Restore radio button interactivity immediately
            const radioElements = document.querySelectorAll('.radio-container');
            radioElements.forEach(el => {
                el.style.pointerEvents = 'auto';
                // Restore original z-index to ensure radio button is on top
                el.style.zIndex = el.dataset.originalZIndex || '10000';
            });
            
            // Gradually hide scroll indicator with subtle animation
            scrollIndicator.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                scrollIndicator.style.opacity = '0.7';
            }, 500);
            
            // Implement momentum scrolling if there's velocity
            if (Math.abs(velocity) > 0.5) {
                const momentumScroll = () => {
                    // Apply velocity with friction
                    spellbookPage.scrollTop += velocity;
                    velocity *= 0.95; // Friction factor
                    
                    // Stop when velocity becomes negligible
                    if (Math.abs(velocity) > 0.1) {
                        animationFrameId = requestAnimationFrame(momentumScroll);
                    } else {
                        animationFrameId = null;
                    }
                };
                
                // Start momentum scrolling
                animationFrameId = requestAnimationFrame(momentumScroll);
            }
        };
        
        // Add touch event listeners to the spellbook page
        spellbookPage.addEventListener('touchstart', handleTouchStart, { passive: false });
        spellbookPage.addEventListener('touchmove', handleTouchMove, { passive: false });
        spellbookPage.addEventListener('touchend', handleTouchEnd);
        spellbookPage.addEventListener('touchcancel', handleTouchEnd);
        
        // Add scroll indicator to the page
        spellbookPage.appendChild(scrollIndicator);
        
        // Create neon border effect
        const borderGlow = document.createElement('div');
        borderGlow.style.position = 'absolute';
        borderGlow.style.top = '0';
        borderGlow.style.left = '0';
        borderGlow.style.width = '100%';
        borderGlow.style.height = '100%';
        borderGlow.style.boxShadow = 'inset 0 0 2px #0ff, inset 0 0 5px #0ff, inset 0 0 10px #0ff';
        borderGlow.style.pointerEvents = 'none';
        borderGlow.style.borderRadius = '5px';
        spellbookPage.appendChild(borderGlow);
        
        // Add a prominent close button in the top-right corner
        const prominentCloseBtn = document.createElement('div');
        prominentCloseBtn.className = 'prominent-close-btn';
        prominentCloseBtn.style.position = 'absolute';
        prominentCloseBtn.style.top = '10px';
        prominentCloseBtn.style.right = '10px';
        prominentCloseBtn.style.width = '60px'; // Larger touch target
        prominentCloseBtn.style.height = '60px'; // Larger touch target
        prominentCloseBtn.style.borderRadius = '50%';
        prominentCloseBtn.style.backgroundColor = 'rgba(255, 0, 60, 0.2)';
        prominentCloseBtn.style.border = '2px solid #ff003c';
        prominentCloseBtn.style.boxShadow = '0 0 15px rgba(255, 0, 60, 0.5)';
        prominentCloseBtn.style.display = 'flex';
        prominentCloseBtn.style.justifyContent = 'center';
        prominentCloseBtn.style.alignItems = 'center';
        prominentCloseBtn.style.cursor = 'pointer';
        prominentCloseBtn.style.zIndex = '10001'; // Higher than everything
        prominentCloseBtn.style.transition = 'all 0.2s ease';
        
        // Add 'X' symbol inside the button
        prominentCloseBtn.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="#ff003c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 6L18 18" stroke="#ff003c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Add touch-friendly features from memories about touch-friendly implementation
        prominentCloseBtn.style.touchAction = 'manipulation';
        prominentCloseBtn.style.webkitTapHighlightColor = 'transparent';
        prominentCloseBtn.style.userSelect = 'none';
        
        // Hover effects for the close button
        prominentCloseBtn.addEventListener('mouseover', () => {
            prominentCloseBtn.style.backgroundColor = 'rgba(255, 0, 60, 0.4)';
            prominentCloseBtn.style.transform = 'scale(1.1)';
            prominentCloseBtn.style.boxShadow = '0 0 20px rgba(255, 0, 60, 0.8)';
        });
        
        prominentCloseBtn.addEventListener('mouseout', () => {
            prominentCloseBtn.style.backgroundColor = 'rgba(255, 0, 60, 0.2)';
            prominentCloseBtn.style.transform = 'scale(1)';
            prominentCloseBtn.style.boxShadow = '0 0 15px rgba(255, 0, 60, 0.5)';
        });
        
        // Touch event handlers with visual feedback
        prominentCloseBtn.addEventListener('touchstart', () => {
            prominentCloseBtn.style.backgroundColor = 'rgba(255, 0, 60, 0.4)';
            prominentCloseBtn.style.transform = 'scale(0.95)'; // Scale down for press effect
            prominentCloseBtn.style.boxShadow = '0 0 20px rgba(255, 0, 60, 0.8)';
        }, { passive: true });
        
        prominentCloseBtn.addEventListener('touchend', () => {
            prominentCloseBtn.style.backgroundColor = 'rgba(255, 0, 60, 0.2)';
            prominentCloseBtn.style.transform = 'scale(1)';
            prominentCloseBtn.style.boxShadow = '0 0 15px rgba(255, 0, 60, 0.5)';
        }, { passive: true });
        
        // Add the close button to the spellbook page
        spellbookPage.appendChild(prominentCloseBtn);
        
        // Add header with Windsurf logo and title
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.flexDirection = 'column';
        header.style.alignItems = 'center';
        header.style.marginBottom = '25px';
        header.style.position = 'relative';
        
        // Add official Windsurf logo with image fallback
        const logoContainer = document.createElement('div');
        logoContainer.style.marginBottom = '20px';
        logoContainer.style.width = '100%';
        logoContainer.style.display = 'flex';
        logoContainer.style.justifyContent = 'center';
        
        // Create the logo wrapper with glow background
        const logoWrapper = document.createElement('div');
        logoWrapper.style.position = 'relative';
        logoWrapper.style.width = '150px';
        logoWrapper.style.height = '150px';
        logoWrapper.style.display = 'flex';
        logoWrapper.style.justifyContent = 'center';
        logoWrapper.style.alignItems = 'center';
        logoWrapper.style.backgroundColor = '#000';
        logoWrapper.style.borderRadius = '50%';
        logoWrapper.style.overflow = 'hidden';
        
        // Create glow effect container
        const glowEffect = document.createElement('div');
        glowEffect.style.position = 'absolute';
        glowEffect.style.top = '0';
        glowEffect.style.left = '0';
        glowEffect.style.width = '100%';
        glowEffect.style.height = '100%';
        glowEffect.style.background = 'radial-gradient(circle, rgba(0,255,157,0.2) 0%, transparent 70%)';
        glowEffect.style.pointerEvents = 'none';
        
        // Try to load the image first
        const logoImg = document.createElement('img');
        logoImg.style.width = '80%';
        logoImg.style.height = '80%';
        logoImg.style.objectFit = 'contain';
        logoImg.style.position = 'relative';
        logoImg.style.zIndex = '2';
        
        // Path to the image - updated with correct path from assets directory
        const logoImgPath = './assets/decor/Logo_1.png';
        logoImg.src = logoImgPath;
        
        // Add fallback to SVG if image fails to load
        logoImg.onerror = () => {
            console.log('Windsurf Ad: Logo image failed to load, using SVG fallback');
            
            // Remove the failed image
            logoImg.remove();
            
            // Add SVG fallback
            const svgContainer = document.createElement('div');
            svgContainer.style.zIndex = '2';
            svgContainer.innerHTML = `
                <svg viewBox="0 0 100 100" width="100" height="100">
                    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <g filter="url(#neonGlow)">
                        <path d="M25,30 C50,30 75,45 75,45" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
                        <path d="M25,50 C50,50 75,65 75,65" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
                        <path d="M25,70 C50,70 75,85 75,85" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
                    </g>
                </svg>
            `;
            logoWrapper.appendChild(svgContainer);
        };
        
        // Assemble the logo components
        logoWrapper.appendChild(glowEffect);
        logoWrapper.appendChild(logoImg);
        logoContainer.appendChild(logoWrapper);
        header.appendChild(logoContainer);
        
        // Title
        const title = document.createElement('h1');
        title.innerHTML = 'WINDSURF <span style="color: #0ff;">AI</span> EDITOR';
        title.style.fontSize = '36px';
        title.style.margin = '0';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
        title.style.letterSpacing = '2px';
        header.appendChild(title);
        
        // Tagline
        const tagline = document.createElement('p');
        tagline.textContent = "RIDE THE DIGITAL WAVE | CODE BEYOND REALITY";
        tagline.style.fontSize = '18px';
        tagline.style.margin = '10px 0 0';
        tagline.style.color = '#ff00ff';
        tagline.style.textAlign = 'center';
        tagline.style.fontStyle = 'italic';
        tagline.style.textShadow = '0 0 8px rgba(255, 0, 255, 0.5)';
        header.appendChild(tagline);
        
        // Create close button with cyberpunk styling
        const closeButton = document.createElement('div');
        closeButton.innerHTML = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '15px';
        closeButton.style.right = '15px';
        closeButton.style.width = '40px';
        closeButton.style.height = '40px';
        closeButton.style.borderRadius = '50%';
        closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.1) 0%, rgba(128,0,255,0.2) 100%)';
        closeButton.style.display = 'flex';
        closeButton.style.justifyContent = 'center';
        closeButton.style.alignItems = 'center';
        closeButton.style.fontSize = '28px';
        closeButton.style.color = '#ff00ff';
        closeButton.style.cursor = 'pointer';
        closeButton.style.transition = 'all 0.2s';
        closeButton.style.boxShadow = 'none';
        
        closeButton.onmouseover = () => {
            closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.2) 0%, rgba(128,0,255,0.3) 100%)';
            closeButton.style.boxShadow = '0 0 10px rgba(128,0,255,0.5)';
        };
        
        closeButton.onmouseout = () => {
            closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.1) 0%, rgba(128,0,255,0.2) 100%)';
            closeButton.style.boxShadow = 'none';
        };
        
        // closeButton.onclick will be set after the closeOverlay function is defined
        
        // Add the header to the spellbookPage
        spellbookPage.appendChild(header);
        
        // Main content container
        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.gap = '25px';
        content.style.padding = '0 15px';
        
        // Feature highlights section with cyberpunk styling
        const featuresSection = document.createElement('div');
        featuresSection.style.marginBottom = '30px';
        
        const featuresTitle = document.createElement('h2');
        featuresTitle.textContent = 'TRANSCEND YOUR CODE';
        featuresTitle.style.borderBottom = '2px solid #0ff';
        featuresTitle.style.paddingBottom = '10px';
        featuresTitle.style.color = '#0ff';
        featuresTitle.style.fontSize = '24px';
        featuresTitle.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
        featuresSection.appendChild(featuresTitle);
        
        // Features list
        const featuresList = document.createElement('ul');
        featuresList.style.listStyleType = 'none';
        featuresList.style.padding = '0';
        featuresList.style.margin = '20px 0';
        
        // Create features content with key Windsurf AI capabilities
        const features = [
            {
                title: "GENERATE COMPLEX ENVIRONMENTS",
                description: "Build fully realized 3D game engines & sophisticated applications that other AI editors struggle to create"
            },
            {
                title: "SEAMLESS CONVERSATION COPYING",
                description: "Copy entire agent conversations with one motion - including code snippets & terminal commands"
            },
            {
                title: "PROFESSIONAL VS CODE INTEGRATION",
                description: "Powerful yet accessible environment that grows with your skills beyond beginner-focused editors"
            }
        ];
        
        // Render features into the list
        features.forEach(feature => {
            const featureItem = document.createElement('li');
            featureItem.style.margin = '0 0 25px 0';
            featureItem.style.position = 'relative';
            featureItem.style.paddingLeft = '30px';
            
            // Create neon bullet point
            const bulletPoint = document.createElement('div');
            bulletPoint.style.position = 'absolute';
            bulletPoint.style.left = '0';
            bulletPoint.style.top = '5px';
            bulletPoint.style.width = '15px';
            bulletPoint.style.height = '15px';
            bulletPoint.style.borderRadius = '50%';
            bulletPoint.style.backgroundColor = '#ff00ff';
            bulletPoint.style.boxShadow = '0 0 10px #ff00ff';
            featureItem.appendChild(bulletPoint);
            
            const featureTitle = document.createElement('h3');
            featureTitle.textContent = feature.title;
            featureTitle.style.margin = '0 0 5px 0';
            featureTitle.style.fontSize = '18px';
            featureTitle.style.color = '#ff00ff';
            featureTitle.style.textShadow = '0 0 5px rgba(255, 0, 255, 0.3)';
            featureItem.appendChild(featureTitle);
            
            const featureDesc = document.createElement('p');
            featureDesc.textContent = feature.description;
            featureDesc.style.margin = '0';
            featureDesc.style.fontSize = '16px';
            featureDesc.style.color = '#e0e0ff';
            featureDesc.style.lineHeight = '1.4';
            featureItem.appendChild(featureDesc);
            
            featuresList.appendChild(featureItem);
        });
        
        // Make sure to actually append the features list to the features section
        featuresSection.appendChild(featuresList);
        
        // And append the features section to the content container
        content.appendChild(featuresSection);
        
        // Testimonial section
        const testimonialSection = document.createElement('div');
        testimonialSection.style.backgroundColor = 'rgba(0, 0, 30, 0.4)';
        testimonialSection.style.padding = '20px';
        testimonialSection.style.borderRadius = '5px';
        testimonialSection.style.marginBottom = '30px';
        testimonialSection.style.border = '1px solid rgba(0, 255, 255, 0.3)';
        testimonialSection.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.2)';
        
        const testimonialQuote = document.createElement('p');
        testimonialQuote.innerHTML = `"As a novice developer, I found Windsurf AI capable of generating complex environments I failed to achieve with other editors. After just a few dozen hours of coding experience, Windsurf became my essential creative partner."`;
        testimonialQuote.style.fontSize = '16px';
        testimonialQuote.style.fontStyle = 'italic';
        testimonialQuote.style.margin = '0 0 10px 0';
        testimonialQuote.style.lineHeight = '1.6';
        testimonialSection.appendChild(testimonialQuote);
        
        const testimonialAuthor = document.createElement('p');
        testimonialAuthor.textContent = "— AI Alchemist | Vibeverse Arcade Developer";
        testimonialAuthor.style.textAlign = 'right';
        testimonialAuthor.style.margin = '0';
        testimonialAuthor.style.fontSize = '15px';
        testimonialAuthor.style.color = '#0ff';
        testimonialSection.appendChild(testimonialAuthor);
        
        content.appendChild(testimonialSection);
        
        // Call to action section with referral link
        const ctaSection = document.createElement('div');
        ctaSection.style.textAlign = 'center';
        ctaSection.style.marginTop = '10px';
        ctaSection.style.padding = '25px';
        ctaSection.style.backgroundColor = 'rgba(128, 0, 255, 0.1)';
        ctaSection.style.borderRadius = '5px';
        ctaSection.style.border = '1px solid rgba(128, 0, 255, 0.3)';
        
        const ctaTitle = document.createElement('h3');
        ctaTitle.textContent = 'SUPPORT THE VIBE CODING COMMUNITY';
        ctaTitle.style.margin = '0 0 15px 0';
        ctaTitle.style.color = '#ff00ff';
        ctaTitle.style.fontSize = '20px';
        ctaTitle.style.textShadow = '0 0 8px rgba(255, 0, 255, 0.5)';
        ctaSection.appendChild(ctaTitle);
        
        const ctaText = document.createElement('p');
        ctaText.innerHTML = 'Sign up for a premium Windsurf account using my affiliate link.<br>Each signup earns flex credits to help create more content for the community.';
        ctaText.style.margin = '0 0 20px 0';
        ctaText.style.fontSize = '16px';
        ctaText.style.lineHeight = '1.5';
        ctaSection.appendChild(ctaText);
        
        // Radio button with cyberpunk styling for the referral link - enhanced for visibility above touch controls
        const radioContainer = document.createElement('label');
        radioContainer.className = 'radio-container'; // Added class for touch event targeting
        radioContainer.style.display = 'flex';
        radioContainer.style.alignItems = 'center';
        radioContainer.style.justifyContent = 'center';
        radioContainer.style.cursor = 'pointer';
        radioContainer.style.margin = '30px auto'; // Increased margin for better positioning
        radioContainer.style.padding = '15px 35px'; // Larger padding for easier touch target
        radioContainer.style.borderRadius = '8px'; // Increased border radius for modern look
        radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.2)'; // Slightly more visible background
        radioContainer.style.border = '2px solid #0ff'; // Thicker border for visibility
        radioContainer.style.width = 'fit-content';
        radioContainer.style.transition = 'all 0.3s ease';
        radioContainer.style.position = 'relative';
        radioContainer.style.overflow = 'hidden';
        radioContainer.style.zIndex = '10000'; // Ensure it's above everything including touch controls
        radioContainer.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)'; // Add glow for visibility
        
        // Add mobile-friendly touch styling (from the memory about touch-friendly styling)
        radioContainer.style.touchAction = 'manipulation';
        radioContainer.style.webkitTapHighlightColor = 'transparent';
        radioContainer.style.userSelect = 'none'; // Prevent text selection on mobile
        
        // Add pseudo-neon glow effect
        const radioGlow = document.createElement('div');
        radioGlow.style.position = 'absolute';
        radioGlow.style.top = '0';
        radioGlow.style.left = '0';
        radioGlow.style.right = '0';
        radioGlow.style.bottom = '0';
        radioGlow.style.boxShadow = 'inset 0 0 10px rgba(0, 255, 255, 0.5)';
        radioGlow.style.opacity = '0';
        radioGlow.style.transition = 'opacity 0.3s ease';
        radioContainer.appendChild(radioGlow);
        
        // Radiobutton with cyberpunk styling
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'signup';
        radio.style.appearance = 'none';
        radio.style.WebkitAppearance = 'none';
        radio.style.MozAppearance = 'none';
        radio.style.width = '20px';
        radio.style.height = '20px';
        radio.style.borderRadius = '50%';
        radio.style.border = '2px solid #0ff';
        radio.style.marginRight = '10px';
        radio.style.position = 'relative';
        radio.style.backgroundColor = 'transparent';
        radio.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
        radio.style.cursor = 'pointer';
        radio.style.transition = 'all 0.2s ease';
        
        // Create inner circle container for the radio button
        const radioInnerContainer = document.createElement('div');
        radioInnerContainer.style.position = 'relative';
        radioInnerContainer.style.width = '20px';
        radioInnerContainer.style.height = '20px';
        radioInnerContainer.style.marginRight = '10px';
        
        // Append the radio to the inner container
        radioInnerContainer.appendChild(radio);
        
        // Create inner circle for checked state
        const radioInner = document.createElement('div');
        radioInner.style.position = 'absolute';
        radioInner.style.top = '50%';
        radioInner.style.left = '50%';
        radioInner.style.transform = 'translate(-50%, -50%) scale(0)';
        radioInner.style.width = '10px';
        radioInner.style.height = '10px';
        radioInner.style.borderRadius = '50%';
        radioInner.style.backgroundColor = '#0ff';
        radioInner.style.boxShadow = '0 0 10px #0ff';
        radioInner.style.transition = 'transform 0.2s ease';
        radioInner.style.pointerEvents = 'none';
        
        // Append the inner circle to the container (not to the radio input itself)
        radioInnerContainer.appendChild(radioInner);
        
        // Radio button text - enhanced for better visibility
        const radioText = document.createElement('span');
        radioText.textContent = 'SIGN UP WITH MY REFERRAL LINK';
        radioText.style.fontSize = '20px'; // Even larger font for mobile visibility
        radioText.style.fontWeight = 'bold';
        radioText.style.color = '#ffffff'; // Brighter text color
        radioText.style.textShadow = '0 0 8px rgba(0, 255, 255, 0.8)'; // More pronounced glow
        radioText.style.letterSpacing = '1px'; // Improved readability
        
        // Assemble the radio button components
        radioContainer.appendChild(radioInnerContainer);
        radioContainer.appendChild(radioText);
        
        // Add hover and touch effects to radio container
        const handleButtonHighlight = () => {
            radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
            radioGlow.style.opacity = '1';
            radio.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
            radioContainer.style.transform = 'scale(0.97)'; // Subtle scale effect for tactile feedback
        };
        
        const handleButtonNormal = () => {
            radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
            radioGlow.style.opacity = '0';
            radio.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
            radioContainer.style.transform = 'scale(1)';
        };
        
        // Add both mouse and touch events (based on memory about touch-friendly implementation)
        radioContainer.addEventListener('mouseover', handleButtonHighlight);
        radioContainer.addEventListener('mouseout', handleButtonNormal);
        radioContainer.addEventListener('touchstart', handleButtonHighlight, { passive: true });
        radioContainer.addEventListener('touchend', handleButtonNormal, { passive: true });
        
        // Add click and touch effect
        const handleSignupAction = () => {
            radioInner.style.transform = 'translate(-50%, -50%) scale(1)';
            
            // Open the referral link in a new tab
            setTimeout(() => {
                window.open('https://windsurf.com/refer?referral_code=qhea2mro7z30oc0e', '_blank');
            }, 300);
            
            // Create pulse animation for feedback
            const pulse = document.createElement('div');
            pulse.style.position = 'absolute';
            pulse.style.top = '50%';
            pulse.style.left = '50%';
            pulse.style.transform = 'translate(-50%, -50%)';
            pulse.style.width = '5px';
            pulse.style.height = '5px';
            pulse.style.borderRadius = '50%';
            pulse.style.backgroundColor = '#0ff';
            pulse.style.animation = 'pulse 0.5s linear';
            
            // Add keyframes for pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { width: 5px; height: 5px; opacity: 1; }
                    100% { width: 50px; height: 50px; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // Append pulse to radioInnerContainer instead of radio input
            radioInnerContainer.appendChild(pulse);
            setTimeout(() => {
                if (pulse.parentNode === radioInnerContainer) {
                    radioInnerContainer.removeChild(pulse);
                }
            }, 500);
        };
        
        // Enhanced touch-friendly event handling based on memories about touch-friendly implementation
        // Dedicated handler function to avoid code duplication
        const handleRadioClick = (e) => {
            // Prevent event from bubbling to avoid double-triggers
            e.preventDefault();
            e.stopPropagation();
            
            // Visual feedback first
            handleButtonHighlight();
            
            // Check the radio
            radio.checked = true;
            
            // Add active state appearance
            radioContainer.style.transform = 'scale(0.95)';
            
            // Execute the signup action with slight delay for visual feedback
            setTimeout(() => {
                handleSignupAction();
                
                // Reset the visual state after a brief delay
                setTimeout(() => {
                    handleButtonNormal();
                }, 300);
            }, 50);
        };
        
        // Mouse events
        radio.addEventListener('click', handleRadioClick);
        radioContainer.addEventListener('click', handleRadioClick);
        
        // Touch-specific events with passive: false to allow preventDefault
        radioContainer.addEventListener('touchstart', handleButtonHighlight, { passive: true });
        radioContainer.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent ghost clicks
            handleRadioClick(e);
        }, { passive: false });
        
        // Add radio button to CTA section
        ctaSection.appendChild(radioContainer);
        content.appendChild(ctaSection);
        
        // CRITICAL: Attach the content container to the spellbookPage
        spellbookPage.appendChild(content);
        
        // Add animated scanning lines for cyberpunk effect
        const scanLines = document.createElement('div');
        scanLines.style.position = 'absolute';
        scanLines.style.top = '0';
        scanLines.style.left = '0';
        scanLines.style.width = '100%';
        scanLines.style.height = '100%';
        scanLines.style.backgroundImage = 'linear-gradient(transparent 50%, rgba(0, 255, 255, 0.03) 50%)';
        scanLines.style.backgroundSize = '100% 4px';
        scanLines.style.pointerEvents = 'none';
        scanLines.style.zIndex = '1';
        spellbookPage.appendChild(scanLines);
        
        // Function to close the overlay and clean up
        const closeOverlay = () => {
            console.log('Windsurf Ad: Closing overlay');
            // Play closing sound effect if available
            if (typeof this.playPageTurnSound === 'function') {
                this.playPageTurnSound();
            }
            
            // Fade out animation
            overlay.style.opacity = '0';
            
            // Remove overlay and clean up resources
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                    // Remove the escape key event listener
                    document.removeEventListener('keydown', escapeKeyHandler);
                    
                    // Clean up touch event listeners
                    if (spellbookPage) {
                        spellbookPage.removeEventListener('touchstart', handleTouchStart);
                        spellbookPage.removeEventListener('touchmove', handleTouchMove);
                        spellbookPage.removeEventListener('touchend', handleTouchEnd);
                        spellbookPage.removeEventListener('touchcancel', handleTouchEnd);
                    }
                    
                    // Cancel any ongoing animations
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                    
                    // Remove the global touch interceptor
                    const interceptor = document.getElementById('global-touch-interceptor');
                    if (interceptor && interceptor.parentNode) {
                        interceptor.parentNode.removeChild(interceptor);
                    }
                    
                    // Restore original document touch handlers
                    document.ontouchstart = originalTouchStart;
                    document.ontouchmove = originalTouchMove;
                    document.ontouchend = originalTouchEnd;
                    
                    // Restore game.js input handlers if they were modified
                    if (window.game && window.game.input && Object.keys(originalGameHandlers).length > 0) {
                        Object.keys(originalGameHandlers).forEach(handlerName => {
                            window.game.input[handlerName] = originalGameHandlers[handlerName];
                        });
                    }
                    
                    console.log('Windsurf Ad: Game touch controls restored');
                }
            }, 500);
        };
        
        // Connect the original close button to close action
        closeButton.onclick = closeOverlay;
        
        // Connect the new prominent close button to close action
        prominentCloseBtn.addEventListener('click', closeOverlay);
        prominentCloseBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent ghost clicks
            closeOverlay();
        }, { passive: false });
        
        // Escape key handler function
        const escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                console.log('Windsurf Ad: Escape key detected, closing overlay');
                closeOverlay(); // Use the closeOverlay function directly
            }
        };
        
        // Add event listener for keyboard navigation
        document.addEventListener('keydown', escapeKeyHandler);
        
        // Add the spellbook page to the overlay
        overlay.appendChild(spellbookPage);
        
        // Add the overlay to the document body
        document.body.appendChild(overlay);
        
        // Fade in the overlay
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Play a sound effect for immersion
        if (typeof this.playPageTurnSound === 'function') {
            this.playPageTurnSound();
        }
        
        console.log('Windsurf AI advertisement displayed');
        
        return overlay;
    }
    
    /**
     * Play a page turning sound when opening/closing the spellbook
     */
    playPageTurnSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create white noise for page rustle
            const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Fill with noise, more pronounced at start and end
            for (let i = 0; i < bufferSize; i++) {
                const position = i / bufferSize; // 0 to 1
                const envelope = Math.sin(position * Math.PI); // Amplitude envelope
                data[i] = (Math.random() * 2 - 1) * envelope * 0.15; // Scaled noise
            }
            
            // Create white noise source
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;
            
            // Create a bandpass filter for paper sound
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200;
            filter.Q.value = 0.5;
            
            // Create gain node for volume control
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.3;
            
            // Connect nodes
            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Play the sound
            noiseSource.start();
        } catch (err) {
            debug(`SpellbookEntity: Page turn sound error: ${err.message}`);
        }
    }
    
    /**
     * Play sound effect when interacting with spellbook
     */
    playSpellbookSound() {
        // Create a simple oscillator for magical sound
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create oscillator
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); // A5
            
            // Configure volume
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
            
            // Connect and start
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
        } catch (err) {
            debug(`SpellbookEntity: Sound error: ${err.message}`);
        }
    }
    
    /**
     * Display a magical effect when interacting with the spellbook
     */
    displayMagicalEffect() {
        // Create and style the overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = this.glowColor;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Animate the transition
        setTimeout(() => {
            overlay.style.opacity = '0.3';
            overlay.style.transition = 'opacity 0.2s ease-in-out';
            
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
            }, 200);
        }, 50);
    }
    
    /**
     * Draw the spellbook entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Calculate adjusted position with proper grounding
        const groundingFactor = -2; // Adjust to make spellbook appear at right height
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply floating animation
        const floatOffset = Math.sin(this.animationTime * this.floatSpeed) * this.floatAmplitude * height;
        
        // Apply vertical offset based on z position and floating
        const drawY = adjustedScreenY - (this.z * 2) + floatOffset;
        
        // Save the current context state
        ctx.save();
        
        // Check if spellbook image is loaded
        if (this.spellbookImage) {
            // Calculate scale factor to fit in the desired width/height
            const img = this.spellbookImage;
            const scale = Math.min(width * 4 / img.width, height * 4 / img.height);
            
            // Calculate centered position
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const drawX = screenX - drawWidth / 2;
            
            // Apply glow effect with shadow
            if (this.glowIntensity > 0.1) {
                ctx.shadowColor = this.glowColor;
                
                // Apply proximity boost to enhance glow when player is nearby
                const boostFactor = this.proximityBoost || 1.0;
                ctx.shadowBlur = (25 + (this.glowIntensity * 20)) * boostFactor; 
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Create a hyper-concentrated glow layer effect
                // Save original globalAlpha
                const originalAlpha = ctx.globalAlpha;
                
                // Create multiple tightly concentrated glow layers
                const layers = 4; // More layers for better intensity
                const baseScale = 1.005; // Ultra-tight scaling for maximum concentration
                
                // Draw multiple concentrated glow layers
                for (let i = 0; i < layers; i++) {
                    const layerScale = baseScale + (i * 0.005); // Even smaller increments
                    const outerDrawWidth = drawWidth * layerScale;
                    const outerDrawHeight = drawHeight * layerScale;
                    const outerDrawX = screenX - outerDrawWidth / 2;
                    
                    // Higher opacity and less falloff between layers
                    ctx.globalAlpha = (0.8 - (i * 0.05)) * this.glowIntensity;
                    ctx.drawImage(img, outerDrawX, drawY - (i * 0.2), outerDrawWidth, outerDrawHeight);
                }
                
                // Add double-layered intense center glow
                ctx.globalAlpha = 0.9 * this.glowIntensity;
                ctx.drawImage(img, screenX - drawWidth/2, drawY, drawWidth, drawHeight);
                
                ctx.globalAlpha = 0.95 * this.glowIntensity;
                ctx.drawImage(img, screenX - drawWidth/2 * 0.995, drawY, drawWidth * 0.995, drawHeight * 0.995);
                
                // Restore original alpha
                ctx.globalAlpha = originalAlpha;
            }
            
            // Draw the spellbook
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // Reset shadow
            ctx.shadowBlur = 0;
        } else {
            // Fallback if image not loaded yet
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - width/4, drawY, width/2, height/3);
            
            // Logging to debug image loading issues
            if (Math.random() < 0.01) { // Only log occasionally to avoid spam
                debug(`SpellbookEntity: Drawing fallback at (${screenX}, ${drawY}), image load status: ${!!this.spellbookImage}, load attempts: ${this.loadAttempts}`);
            }
        }
        
        // Draw interaction prompt if player is nearby
        if (this.interactionPromptAlpha > 0) {
            this.drawInteractionPrompt(ctx, screenX, drawY - height * 1.5);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    /**
     * Draw the interaction prompt
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position to draw at
     * @param {number} y - Y position to draw at
     */
    drawInteractionPrompt(ctx, x, y) {
        ctx.save();
        
        // Set up text style with larger font
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Open Spellbook';
        const textWidth = ctx.measureText(text).width;
        
        // Create dimensions for prompt window
        const padding = 48;
        const promptWidth = textWidth + (padding * .4);
        const promptHeight = 60;
        const promptX = x - promptWidth/2;
        const promptY = y - 20;
        
        // Create gradient background instead of solid color
        const gradient = ctx.createLinearGradient(
            promptX, 
            promptY, 
            promptX, 
            promptY + promptHeight
        );
        gradient.addColorStop(0, `rgba(35, 0, 60, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(0.5, `rgba(75, 0, 130, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(1, `rgba(35, 0, 60, ${this.interactionPromptAlpha * 0.9})`);
        
        // Draw background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
        
        // Draw border with glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15 * this.glowIntensity;
        ctx.strokeStyle = `rgba(75, 0, 130, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);
        ctx.shadowBlur = 0;
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText(text, x, y);
        
       // Draw key indicator
       ctx.font = 'bold 16px monospace';
       ctx.fillStyle = `rgba(138, 43, 226, ${this.interactionPromptAlpha})`;
       ctx.fillText('[ ENTER ]', x, y + 25);

        ctx.restore();
    }
    
    /**
     * Play a magical proximity sound when player approaches the spellbook
     */
    playProximitySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a magical descending arpeggio using mystical intervals
            // These notes form a pentatonic minor scale which sounds mystical
            const magicalNotes = [587.33, 523.25, 440.00, 392.00, 329.63];
            const durations = [0.15, 0.15, 0.15, 0.15, 0.3];
            
            // Create a common gain node for the overall sound
            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
            
            // Create a convolver for magical reverb effect
            const convolver = audioCtx.createConvolver();
            
            // Generate impulse response for magical shimmer reverb
            const reverbLength = audioCtx.sampleRate * 2; // 2 seconds reverb tail
            const impulse = audioCtx.createBuffer(2, reverbLength, audioCtx.sampleRate);
            const impulseL = impulse.getChannelData(0);
            const impulseR = impulse.getChannelData(1);
            
            // Fill buffer with decaying random values for reverb effect
            for(let i = 0; i < reverbLength; i++) {
                // Exponential decay
                const decay = Math.exp(-i / (audioCtx.sampleRate * 0.5));
                // Randomize for diffusion with slight shimmer effect
                impulseL[i] = (Math.random() * 2 - 1) * decay * 0.5;
                impulseR[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
            
            convolver.buffer = impulse;
            convolver.connect(masterGain);
            
            // Add a slight delay effect for magic echoes
            const delay = audioCtx.createDelay(0.5);
            delay.delayTime.value = 0.3;
            
            const delayGain = audioCtx.createGain();
            delayGain.gain.value = 0.2;
            
            // Play each note in sequence to create the arpeggio
            let startTime = audioCtx.currentTime;
            
            magicalNotes.forEach((note, i) => {
                // Create main oscillator for the note
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = note;
                
                // Create a secondary oscillator for harmonic shimmer
                const shimmerOsc = audioCtx.createOscillator();
                shimmerOsc.type = 'triangle';
                shimmerOsc.frequency.value = note * 1.5; // Harmonic shimmer
                
                // Individual note envelope
                const noteGain = audioCtx.createGain();
                noteGain.gain.setValueAtTime(0.0, startTime);
                noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + durations[i]);
                
                // Connect primary oscillator
                osc.connect(noteGain);
                
                // Connect shimmer at lower volume
                const shimmerGain = audioCtx.createGain();
                shimmerGain.gain.value = 0.03;
                shimmerOsc.connect(shimmerGain);
                shimmerGain.connect(noteGain);
                
                // Connect note to effects and output
                noteGain.connect(convolver);
                noteGain.connect(delay);
                delay.connect(delayGain);
                delayGain.connect(convolver);
                noteGain.connect(masterGain);
                
                // Schedule note start and stop
                osc.start(startTime);
                osc.stop(startTime + durations[i] + 0.05);
                
                shimmerOsc.start(startTime);
                shimmerOsc.stop(startTime + durations[i] + 0.05);
                
                // Move to next note
                startTime += durations[i];
            });
            
            // Schedule context closure after all notes have played plus reverb tail
            setTimeout(() => {
                audioCtx.close();
            }, (startTime - audioCtx.currentTime + 2.5) * 1000);
            
            debug(`SpellbookEntity: Played magical proximity sound`);
        } catch (err) {
            debug(`SpellbookEntity: Error playing proximity sound: ${err.message}`);
        }
    }
}
