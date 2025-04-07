/**
 * SpellbookEntity class
 * Represents an interactive spellbook that the player can interact with
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { input } from './input.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

export class SpellbookEntity extends Entity {
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
            debug(`SpellbookEntity: Failed path was: assets/decor/Spellbook_1.png`);
            
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
        const exactPath = 'assets/decor/Spellbook_1.png';
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
            'assets/decor/Spellbook1.png',
            './assets/decor/Spellbook_1.png',
            'assets/decor/spellbook_1.png'
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
     * Display the spellbook page overlay
     */
    displaySpellbookPage() {
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
        overlay.style.zIndex = '1000';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        overlay.style.opacity = '0';
        
        // Create spellbook page content
        const spellbookPage = document.createElement('div');
        spellbookPage.className = 'spellbook-page';
        spellbookPage.style.width = '80%';
        spellbookPage.style.maxWidth = '800px';
        spellbookPage.style.height = '90%';
        spellbookPage.style.maxHeight = '700px';
        spellbookPage.style.backgroundColor = '#f0e6d2'; // Parchment color
        spellbookPage.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'smallGrid\' width=\'10\' height=\'10\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 10 0 L 0 0 0 10\' fill=\'none\' stroke=\'rgba(90, 50, 10, 0.2)\' stroke-width=\'0.5\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23smallGrid)\'/%3E%3C/svg%3E")';
        spellbookPage.style.border = '20px solid #8B4513'; // Wooden frame
        spellbookPage.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.7), inset 0 0 30px rgba(0, 0, 0, 0.4)';
        spellbookPage.style.borderRadius = '5px';
        spellbookPage.style.padding = '40px';
        spellbookPage.style.overflowY = 'auto';
        spellbookPage.style.fontFamily = '"Palatino Linotype", "Book Antiqua", Palatino, serif';
        spellbookPage.style.color = '#3a3a3a';
        spellbookPage.style.position = 'relative';
        
        // Add border decorations to mimic an arcane spellbook
        const borderDecorations = `
            <div style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden;">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; top:0; left:0; width:100%; height:100%;">
                    <path d="M0,0 L100,0 L100,100 L0,100 Z" stroke="#4B0082" stroke-width="0.5" fill="none" vector-effect="non-scaling-stroke" />
                    <path d="M10,10 L90,10 L90,90 L10,90 Z" stroke="#4B0082" stroke-width="0.3" fill="none" vector-effect="non-scaling-stroke" />
                    <path d="M0,0 L20,20 M100,0 L80,20 M0,100 L20,80 M100,100 L80,80" stroke="#4B0082" stroke-width="0.3" fill="none" vector-effect="non-scaling-stroke" />
                    <circle cx="50" cy="10" r="3" fill="none" stroke="#4B0082" stroke-width="0.3" vector-effect="non-scaling-stroke" />
                    <circle cx="50" cy="90" r="3" fill="none" stroke="#4B0082" stroke-width="0.3" vector-effect="non-scaling-stroke" />
                    <circle cx="10" cy="50" r="3" fill="none" stroke="#4B0082" stroke-width="0.3" vector-effect="non-scaling-stroke" />
                    <circle cx="90" cy="50" r="3" fill="none" stroke="#4B0082" stroke-width="0.3" vector-effect="non-scaling-stroke" />
                </svg>
            </div>
        `;
        
        // Add close button (styled as an arcane symbol)
        const closeButton = document.createElement('div');
        closeButton.style.position = 'absolute';
        closeButton.style.top = '15px';
        closeButton.style.right = '15px';
        closeButton.style.width = '40px';
        closeButton.style.height = '40px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.borderRadius = '50%';
        closeButton.style.display = 'flex';
        closeButton.style.justifyContent = 'center';
        closeButton.style.alignItems = 'center';
        closeButton.style.background = 'radial-gradient(circle, rgba(75,0,130,0.1) 0%, rgba(75,0,130,0.2) 100%)';
        closeButton.style.border = '1px solid rgba(75,0,130,0.3)';
        closeButton.style.color = '#4B0082';
        closeButton.style.fontSize = '24px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.transition = 'all 0.2s ease-in-out';
        closeButton.style.boxShadow = '0 0 10px rgba(75,0,130,0.5)';
        closeButton.innerHTML = '×';
        
        closeButton.onmouseover = () => {
            closeButton.style.background = 'radial-gradient(circle, rgba(75,0,130,0.2) 0%, rgba(75,0,130,0.3) 100%)';
            closeButton.style.boxShadow = '0 0 10px rgba(75,0,130,0.5)';
        };
        
        closeButton.onmouseout = () => {
            closeButton.style.background = 'radial-gradient(circle, rgba(75,0,130,0.1) 0%, rgba(75,0,130,0.2) 100%)';
            closeButton.style.boxShadow = 'none';
        };
        
        closeButton.onclick = () => {
            // Fade out and remove overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 500);
            
            // Play closing sound
            this.playPageTurnSound();
        };
        
        // Create the content
        const content = document.createElement('div');
        content.style.textAlign = 'center';
        
        // Title with arcane styling
        const title = document.createElement('h1');
        title.style.fontFamily = '"Cinzel Decorative", "Palatino Linotype", serif';
        title.style.fontSize = '28px';
        title.style.color = '#4B0082';
        title.style.marginBottom = '20px';
        title.style.textShadow = '0 0 5px rgba(75,0,130,0.3)';
        title.style.borderBottom = '1px solid #4B0082';
        title.style.paddingBottom = '10px';
        title.style.letterSpacing = '1px';
        title.innerHTML = 'The Alchemist\'s Grimoire';
        
        // Profile section with arcane border styling
        const profileSection = document.createElement('div');
        profileSection.style.display = 'flex';
        profileSection.style.flexDirection = 'column';
        profileSection.style.alignItems = 'center';
        profileSection.style.padding = '20px';
        profileSection.style.margin = '20px 0';
        profileSection.style.border = '1px solid rgba(75,0,130,0.3)';
        profileSection.style.borderRadius = '5px';
        profileSection.style.boxShadow = '0 0 10px rgba(75,0,130,0.1)';
        profileSection.style.background = 'radial-gradient(circle, rgba(240,230,210,1) 0%, rgba(230,220,200,0.5) 100%)';
        
        // Create parent container for flexible image display
        const imageContainer = document.createElement('div');
        imageContainer.style.width = '180px';
        imageContainer.style.height = '180px';
        imageContainer.style.borderRadius = '50%';
        imageContainer.style.border = '3px solid #4B0082';
        imageContainer.style.boxShadow = '0 0 20px rgba(75,0,130,0.5)';
        imageContainer.style.marginBottom = '20px';
        imageContainer.style.overflow = 'hidden';
        imageContainer.style.backgroundColor = '#4B0082';
        imageContainer.style.position = 'relative';
        imageContainer.style.padding = '0';
        
        // Create image element
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.margin = '0';
        img.style.padding = '0';
        img.style.display = 'block';
        
        // Try loading the local image first
        const localImagePath = './assets/Wizard/Wizard_1.png';
        debug('SpellbookEntity: Attempting to load image from ' + localImagePath);
        img.src = localImagePath;
        
        // Fallback to embedded solution if local image fails
        img.onerror = () => {
            debug('SpellbookEntity: Local image failed to load, using embedded fallback');
            
            // Remove the failed image
            img.remove();
            
            // Set up embedded solution styling
            imageContainer.style.display = 'flex';
            imageContainer.style.justifyContent = 'center';
            imageContainer.style.alignItems = 'center';
            imageContainer.style.flexDirection = 'column';
            imageContainer.style.backgroundImage = 'radial-gradient(circle, #673AB7, #4B0082)';
            
            // Add decorative SVG
            const svgContainer = document.createElement('div');
            svgContainer.style.position = 'absolute';
            svgContainer.style.top = '0';
            svgContainer.style.left = '0';
            svgContainer.style.width = '100%';
            svgContainer.style.height = '100%';
            svgContainer.style.opacity = '0.6';
            svgContainer.innerHTML = `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" style="stop-color:#9C27B0;stop-opacity:0.7" />
                            <stop offset="100%" style="stop-color:#4B0082;stop-opacity:0" />
                        </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" stroke="gold" stroke-width="0.5" fill="none" />
                    <circle cx="50" cy="50" r="30" fill="url(#glow)" />
                    <path d="M50,10 L50,90 M10,50 L90,50 M14.6,14.6 L85.4,85.4 M14.6,85.4 L85.4,14.6" stroke="gold" stroke-width="0.3" fill="none" />
                </svg>
            `;
            imageContainer.appendChild(svgContainer);
            
            // Add a large stylized symbol
            const alchemySymbol = document.createElement('div');
            alchemySymbol.textContent = '⚗️';
            alchemySymbol.style.fontSize = '70px';
            alchemySymbol.style.color = 'gold';
            alchemySymbol.style.marginBottom = '5px';
            alchemySymbol.style.zIndex = '2';
            alchemySymbol.style.textShadow = '0 0 15px rgba(255,215,0,0.7)';
            imageContainer.appendChild(alchemySymbol);
            
            // Add text
            const text = document.createElement('div');
            text.textContent = 'AI Alchemist';
            text.style.color = 'gold';
            text.style.fontSize = '16px';
            text.style.fontWeight = 'bold';
            text.style.fontFamily = '"Cinzel Decorative", serif';
            text.style.zIndex = '2';
            text.style.textShadow = '0 0 10px rgba(255,215,0,0.5)';
            imageContainer.appendChild(text);
        };
        
        // Add the image to the container
        imageContainer.appendChild(img);
        
        // Add the image container to the profile section
        profileSection.appendChild(imageContainer);
        
        // Name/pseudonym with full title in one element
        const name = document.createElement('h2');
        name.style.fontFamily = '"Cinzel Decorative", "Palatino Linotype", serif';
        name.style.fontSize = '22px';
        name.style.color = '#4B0082';
        name.style.margin = '10px 0';
        name.style.textShadow = '0 0 3px rgba(75,0,130,0.2)';
        name.style.lineHeight = '1.4';
        name.innerHTML = 'The AI Alchemist:<br><span style="font-size: 18px; font-style: italic; color: #555;">Conjurer of AI-Fueled Artistry</span>';
        
        // Contact section with arcane styling
        const contactSection = document.createElement('div');
        contactSection.style.margin = '20px 0';
        contactSection.style.padding = '20px';
        contactSection.style.border = '1px solid rgba(75,0,130,0.3)';
        contactSection.style.borderRadius = '5px';
        contactSection.style.background = 'rgba(240,230,210,0.5)';
        contactSection.style.position = 'relative';
        
        // Add arcane symbols to contact section
        contactSection.innerHTML = `
            <svg viewBox="0 0 100 100" style="position:absolute; top:5px; left:5px; width:30px; height:30px; opacity:0.3;">
                <circle cx="50" cy="50" r="45" stroke="#4B0082" stroke-width="1" fill="none" />
                <path d="M50,10 L50,90 M10,50 L90,50 M14.6,14.6 L85.4,85.4 M14.6,85.4 L85.4,14.6" stroke="#4B0082" stroke-width="0.5" fill="none" />
                <circle cx="50" cy="50" r="10" fill="rgba(75,0,130,0.2)" />
            </svg>
            <svg viewBox="0 0 100 100" style="position:absolute; top:5px; right:5px; width:30px; height:30px; opacity:0.3;">
                <polygon points="50,10 90,50 50,90 10,50" stroke="#4B0082" stroke-width="2" fill="none" />
                <circle cx="50" cy="50" r="10" stroke="#4B0082" stroke-width="1" fill="none" />
            </svg>
        `;
        
        // Contact header
        const contactHeader = document.createElement('h3');
        contactHeader.style.fontFamily = '"Cinzel Decorative", "Palatino Linotype", serif';
        contactHeader.style.fontSize = '20px';
        contactHeader.style.color = '#4B0082';
        contactHeader.style.marginBottom = '15px';
        contactHeader.innerHTML = 'Arcane Communications';
        
        // Email
        const email = document.createElement('p');
        email.style.margin = '10px 0';
        email.style.fontSize = '16px';
        
        // Create the label span
        const emailLabel = document.createElement('span');
        emailLabel.style.color = '#4B0082';
        emailLabel.style.fontWeight = 'bold';
        emailLabel.innerHTML = '📜 Ethereal Message: ';
        email.appendChild(emailLabel);
        
        // Create the clickable email link
        const emailLink = document.createElement('a');
        emailLink.href = 'mailto:manny@aialchemist.net';
        emailLink.textContent = 'manny@aialchemist.net';
        emailLink.style.color = '#4B0082';
        emailLink.style.textDecoration = 'none';
        emailLink.style.borderBottom = '1px dotted #4B0082';
        emailLink.style.transition = 'all 0.2s ease-in-out';
        
        // Add hover effect to email link
        emailLink.onmouseover = () => {
            emailLink.style.color = '#8A2BE2';
            emailLink.style.borderBottom = '1px solid #8A2BE2';
            emailLink.style.textShadow = '0 0 3px rgba(75,0,130,0.2)';
        };
        
        emailLink.onmouseout = () => {
            emailLink.style.color = '#4B0082';
            emailLink.style.borderBottom = '1px dotted #4B0082';
            emailLink.style.textShadow = 'none';
        };
        
        email.appendChild(emailLink);
        
        // Message about contact 
        const contactMessage = document.createElement('p');
        contactMessage.style.margin = '15px 0';
        contactMessage.style.lineHeight = '1.5';
        contactMessage.style.fontSize = '15px';
        contactMessage.innerHTML = 'Send forth thy ravens with ideas for new enchantments, reports of arcane anomalies, proposals for alchemical collaborations, advertising opportunities, or simply to exchange pleasantries with this humble spellcrafter.';
        
        // PayPal donation link with arcane styling
        const donationSection = document.createElement('div');
        donationSection.style.margin = '20px 0';
        donationSection.style.padding = '15px';
        donationSection.style.border = '1px solid rgba(218,165,32,0.4)';
        donationSection.style.borderRadius = '5px';
        donationSection.style.background = 'radial-gradient(circle, rgba(253,245,230,1) 0%, rgba(240,230,140,0.1) 100%)';
        
        const donationHeader = document.createElement('h3');
        donationHeader.style.fontFamily = '"Cinzel Decorative", "Palatino Linotype", serif';
        donationHeader.style.fontSize = '18px';
        donationHeader.style.color = '#8B4513';
        donationHeader.style.margin = '5px 0 10px';
        donationHeader.innerHTML = 'Contribute Arcane Reagents';
        
        const donationText = document.createElement('p');
        donationText.style.fontSize = '14px';
        donationText.style.margin = '5px 0 10px';
        donationText.innerHTML = 'Support the continued research of magical innovations with a contribution of gold coins.';
        
        // PayPal link (styled as an arcane button)
        const donationLink = document.createElement('a');
        donationLink.href = 'https://paypal.me/aialchemistart';
        donationLink.target = '_blank';
        donationLink.style.display = 'inline-block';
        donationLink.style.padding = '8px 15px';
        donationLink.style.margin = '10px 0';
        donationLink.style.background = 'linear-gradient(135deg, rgba(218,165,32,0.2) 0%, rgba(218,165,32,0.5) 100%)';
        donationLink.style.border = '1px solid rgba(218,165,32,0.6)';
        donationLink.style.borderRadius = '3px';
        donationLink.style.color = '#8B4513';
        donationLink.style.textDecoration = 'none';
        donationLink.style.fontFamily = '"Cinzel", serif';
        donationLink.style.fontSize = '16px';
        donationLink.style.transition = 'all 0.2s ease-in-out';
        donationLink.style.boxShadow = '0 0 5px rgba(218,165,32,0.3)';
        donationLink.innerHTML = 'Donate Gold Coins';
        
        donationLink.onmouseover = () => {
            donationLink.style.background = 'linear-gradient(135deg, rgba(218,165,32,0.3) 0%, rgba(218,165,32,0.6) 100%)';
            donationLink.style.boxShadow = '0 0 10px rgba(218,165,32,0.5)';
        };
        
        donationLink.onmouseout = () => {
            donationLink.style.background = 'linear-gradient(135deg, rgba(218,165,32,0.2) 0%, rgba(218,165,32,0.5) 100%)';
            donationLink.style.boxShadow = '0 0 5px rgba(218,165,32,0.3)';
        };
        
        // Footer with arcane symbol
        const footer = document.createElement('div');
        footer.style.marginTop = '30px';
        footer.style.fontSize = '12px';
        footer.style.color = '#777';
        footer.style.fontStyle = 'italic';
        footer.style.textAlign = 'center';
        footer.innerHTML = `
            <div style="display:inline-block; margin:10px auto; width:40px; height:40px;">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#4B0082" stroke-width="1" fill="none" />
                    <path d="M50,10 L50,90 M10,50 L90,50 M15,15 L85,85 M15,85 L85,15" stroke="#4B0082" stroke-width="0.5" fill="none" />
                    <circle cx="50" cy="50" r="10" fill="rgba(75,0,130,0.2)" />
                </svg>
            </div>
            <p>Crafted with arcane wisdom in the AI Alchemist\'s Lair</p>
        `;
        
        // Assemble the sections
        profileSection.appendChild(name);
        
        contactSection.appendChild(contactHeader);
        contactSection.appendChild(email);
        contactSection.appendChild(contactMessage);
        
        donationSection.appendChild(donationHeader);
        donationSection.appendChild(donationText);
        donationSection.appendChild(donationLink);
        
        // Add everything to content div
        content.appendChild(title);
        content.appendChild(profileSection);
        content.appendChild(contactSection);
        content.appendChild(donationSection);
        content.appendChild(footer);
        
        // Put everything together
        spellbookPage.innerHTML += borderDecorations;
        spellbookPage.appendChild(content);
        spellbookPage.appendChild(closeButton);
        overlay.appendChild(spellbookPage);
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Play opening sound
        this.playPageTurnSound();
        
        // Trigger fade in
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
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
