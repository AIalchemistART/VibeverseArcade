/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative arcade cabinet with interactive game selection functionality
 */

// Version indicator to verify loading - this will appear in console when the file is loaded
console.log('🎮🎮🎮 ArcadeEntity12.js loaded - ' + new Date().toISOString() + ' 🎮🎮🎮');

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity12 extends Entity {
    // Static array to track all audio contexts for centralized management
    static _activeAudioContexts = [];
    // Sound playback flags to prevent overlapping sounds and allow re-triggering
    static _proximityPlaying = false;
    static _activatePlaying = false;
    static _menuClosePlaying = false;
    static _selectPlaying = false;
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_2', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_12', options = {}) {
        // Create an arcade with standard settings as a static entity
        super(x, y, 3.0, 3.0, {
            isStatic: true,
            zHeight: 1,
            collidable: true
        });
        
        // Store game reference if provided
        this.game = options.game || null;
        
        // Arcade-specific properties
        this.assetKey = assetKey;
        this.hasLoaded = false;
        this.asset = null;
        this.isInteractive = true;
        this.interactionRadius = 3.5;
        this.arcadeId = options.arcadeId || 'arcade-' + Math.floor(Math.random() * 10000);
        
        // Visual properties
        this.glowColor = '#00FFFF';
        this.glowIntensity = 5;
        this.maxGlowIntensity = 15;
        this.glowSpeed = 0.1;
        this.glowDirection = 1;
        this.scaleX = .7;
        this.scaleY = .7;
        this.groundingFactor = 0.25; // Percentage of height that sits "in" the ground
        
        // Apply positional offset like other decorative entities
        // This corrects grid alignment based on patterns from other entities
        this.x += 0;
        this.y += 0;
        
        // Interaction properties
        this.isNearPlayer = false;
        this.isInteracting = false;
        this.interactionPromptAlpha = 0;
        this.wasEnterPressed = false;  // Track previous Enter key state for edge detection
        
        // Animation properties
        this.animationFrame = 0;
        this.animationSpeed = 0.05;
        this.screenGlow = 0;
        this.screenGlowDirection = 1;
        
        // Game selection properties
        this.gameSelectVisible = false;
        
        // Click handling state for debouncing
        this._lastClickTime = 0;
        // Track URLs that have been opened to prevent duplicates
        this._openedUrls = {};
        
        // Use games from options if provided, otherwise use a fallback
        this.games = options.games || [
            { 
                title: 'Zans Cards', 
                description: 'A Trading Card Game',
                url: 'https://zanscards.com/',
                imagePath: 'assets/Games/Game_16.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_16.png', 'assets/games/Game_16.png']
            }
        ];
        
        // For each game that has an imagePath but no alternativeImagePaths, add them
        this.games.forEach(game => {
            if (game.imagePath && !game.alternativeImagePaths) {
                game.alternativeImagePaths = [game.imagePath, game.imagePath.replace('Games', 'games')];
            }
            // Initialize image property if not set
            if (game.image === undefined) {
                game.image = null;
            }
        });
        
        this.selectedGameIndex = 0;
        this.gameImagesLoaded = false;
        
        console.log(`ArcadeEntity12: Initialized with ${this.games.length} games:`, this.games);
        
        // Key state tracking
        this.wasUpPressed = false;
        this.wasDownPressed = false;
        this.wasEscapePressed = false;
        
        // Test loading immediately
        this.testImageLoad();
        
        // Flag for direct key listeners
        this.hasKeyListeners = false;
        this.menuKeyListeners = null;
        
        // Sound effects
        this.activateSound = null;
        this.selectSound = null;
        this.launchSound = null;
        
        // Load sound effects
        this.loadSoundEffects();
        
        // Load game preview images
        this.loadGameImages();
    }
    
    /**
     * Load game preview images
     */
    loadGameImages() {
        console.log("🎮 Starting to load game images");
        
        // Load images for each game
        this.games.forEach((game, index) => {
            if (game.imagePath) {
                console.log(`🎮 Attempting to load game image: ${game.imagePath}`);
                const img = new Image();
                
                // Set up load event handler before setting src
                img.onload = () => {
                    console.log(`🎮 Successfully loaded game image: ${game.imagePath}`);
                    game.image = img;
                    
                    // Check if all images are loaded
                    if (this.games.every(g => g.image)) {
                        this.gameImagesLoaded = true;
                        console.log('🎮 All game images loaded successfully!');
                    }
                };
                
                // Set up error handler
                img.onerror = () => {
                    console.error(`🎮 Failed to load game image: ${game.imagePath}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 Trying alternative paths for ${game.title}`);
                        this.tryAlternativeGameImagePaths(game, index);
                    } else {
                        // No alternatives, create fallback image
                        console.log(`🎮 No alternative paths for ${game.title}, creating fallback`);
                        this.createGameImage(game, index);
                    }
                };
                
                // Attempt to load the image with correct path for deployment
                const resolvedPath = getAssetPath(game.imagePath);
                console.log(`🎮 Resolved image path: ${resolvedPath} (original: ${game.imagePath})`);
                img.src = resolvedPath;
            } else {
                console.warn(`🎮 No image path specified for game ${index}, creating fallback`);
                this.createGameImage(game, index);
            }
        });
    }
    
    /**
     * Create a game image
     * @param {object} game - Game object to create image for
     * @param {number} index - Index of the game
     */
    createGameImage(game, index) {
        console.log(`🎮 Creating fallback game image for ${game.title}`);
        
        // Create a canvas element to draw our game image
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 225;  // 16:9 aspect ratio
        const ctx = canvas.getContext('2d');
        
        // Define color schemes for different games
        const colorThemes = [
            { // Neon Requiem - Cyberpunk purple/blue
                bg: 'linear-gradient(135deg, #1a0038 0%, #3a0068 100%)',
                accent: '#00FFFF',
                secondary: '#FF00FF'
            },
            { // Synth-Pocalypse - Retro purple/pink
                bg: 'linear-gradient(135deg, #2d004c 0%, #5d0066 100%)',
                accent: '#FF00DD',
                secondary: '#FFDD00'
            },
            { // Pixel Survivor - Green/brown survival theme
                bg: 'linear-gradient(135deg, #002200 0%, #184018 100%)',
                accent: '#00FF66',
                secondary: '#FFAA00'
            },
            { // Neon Swarm - Space themed blue/purple
                bg: 'linear-gradient(135deg, #000033 0%, #000066 100%)',
                accent: '#00FFFF',
                secondary: '#FF5500'
            },
            { // Pixel Farmer - Earthy green/brown
                bg: 'linear-gradient(135deg, #1a3300 0%, #336600 100%)',
                accent: '#AAFF00',
                secondary: '#FFAA00'
            }
        ];
        
        // Select theme based on index
        const theme = colorThemes[index % colorThemes.length];
        
        // Fill background with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, theme.bg.split(', ')[1].split(' ')[0]);
        gradient.addColorStop(1, theme.bg.split(', ')[2].split(' ')[0]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw decorative elements based on theme
        // Grid lines
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        
        // Horizontal grid lines
        for (let y = 20; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let x = 20; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Draw border
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        
        // Draw inner border
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
        
        // Draw game title with shadow
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw title that fits within the canvas width
        const title = game.title;
        const maxWidth = canvas.width - 40;
        
        // Measure text and scale down if needed
        let fontSize = 36;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        while (ctx.measureText(title).width > maxWidth && fontSize > 18) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        }
        
        // Draw title
        ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
        
        // Draw game type with smaller font
        ctx.shadowBlur = 5;
        ctx.font = '18px "Arial", sans-serif';
        ctx.fillStyle = theme.accent;
        ctx.fillText(game.description, canvas.width / 2, canvas.height / 2 + 30);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Create an image from the canvas
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        
        // Store in game object when loaded
        img.onload = () => {
            console.log(`🎮 Successfully created fallback game image for ${game.title}`);
            game.image = img;
            
            // Check if all images are loaded
            if (this.games.every(g => g.image)) {
                this.gameImagesLoaded = true;
                console.log('🎮 All game images have been created!');
            }
        };
    }
    
    /**
     * Create a fallback image for games without image assets
     * @param {object} game - Game object
     */
    createFallbackImage(game) {
        console.log(`🎮 Creating fallback image for ${game.title}`);
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Add title
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(game.title, canvas.width / 2, canvas.height / 2);
        
        // Convert to an image
        const img = new Image();
        img.src = canvas.toDataURL();
        game.image = img;
    }
    
    /**
     * Test direct image loading outside the normal flow
     */
    testImageLoad() {
        debug(`🧪 ArcadeEntity12: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_12.png',
            'assets/decor/Arcade_12.png',
            './assets/decor/Arcade_12.png',
            '/assets/decor/Arcade_12.png',
            window.location.origin + '/assets/decor/Arcade%2012.png',
            window.location.origin + '/assets/decor/arcade-cabinet.png',
            'assets/decor/arcade-cabinet.png'
        ];
        
        // Try each path one after another
        let pathIndex = 0;
        
        const tryNextPath = () => {
            if (pathIndex >= pathsToTry.length) {
                debug('❌ All test paths failed, giving up');
                return;
            }
            
            const path = pathsToTry[pathIndex];
            debug(`🔄 Testing path ${pathIndex+1}/${pathsToTry.length}: ${path}`);
            
            const testImg = new Image();
            
            testImg.onload = () => {
                debug(`✅ TEST SUCCESS: Loaded from ${path} (${testImg.width}x${testImg.height})`);
                
                // If our test image loaded but the main asset didn't, use this one
                if (!this.hasLoaded || !this.asset) {
                    debug(`🔄 Using test image as main asset since main asset failed to load`);
                    this.asset = testImg;
                    this.hasLoaded = true;
                    
                    // Also store in asset loader
                    if (window.assetLoader) {
                        window.assetLoader.assets[this.assetKey] = testImg;
                    }
                }
            };
            
            testImg.onerror = () => {
                debug(`❌ TEST FAILED: Could not load from ${path}`);
                pathIndex++;
                setTimeout(tryNextPath, 100);
            };
            
            testImg.src = path;
        };
        
        // Start trying paths
        tryNextPath();
    }
    
    /**
     * Load the arcade cabinet asset
     * @param {Function} assetLoader - Function to load assets
     */
    loadAsset(assetLoader) {
        debug(`ArcadeEntity12: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity12: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity12: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity12: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity12: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity12: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_12.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity12: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity12: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_12.png`,        // Exact filename with space
            `./assets/decor/Arcade_2.png`,      // With leading ./ and space
            `assets/decor/Arcade%202.png`,      // URL encoded space
            `assets/decor/Arcade-2.png`,        // Hyphen instead of space
            `assets/decor/Arcade2.png`,         // No space
            `assets/decor/arcade-cabinet.png`,  // Generic name
            `assets/decor/arcade.png`           // Simple name
        ];
        
        // Create alternative paths array with both regular and GitHub Pages versions
        const alternativePaths = [];
        basePaths.forEach(path => {
            alternativePaths.push(path);               // Regular path
            alternativePaths.push(getAssetPath(path)); // GitHub Pages path
        });
        
        let pathIndex = 0;
        
        const tryNextPath = () => {
            if (pathIndex >= alternativePaths.length) {
                debug(`ArcadeEntity12: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity12: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity12: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity12: Failed to load from alternative path: ${path}`);
                pathIndex++;
                // Try the next path after a short delay
                setTimeout(tryNextPath, 100);
            };
            
            // Note: No need to call getAssetPath again here, as we've already included
            // both regular and GitHub Pages paths in the alternativePaths array
            altImg.src = path;
        };
        
        // Start trying alternative paths
        tryNextPath();
    }
    
    /**
     * Create a fallback asset when loading fails
     */
    createFallbackAsset() {
        debug(`ArcadeEntity12: Creating fallback asset`);
        
        // Create a canvas to render the fallback asset
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        
        // -- CABINET BODY --
        // Draw a basic arcade cabinet shape (dark metal frame)
        ctx.fillStyle = '#222222'; 
        ctx.fillRect(15, 20, 70, 140); // Main cabinet body
        
        // Cabinet top
        ctx.fillStyle = '#333333';
        ctx.fillRect(10, 10, 80, 15);
        
        // -- SCREEN --
        // Screen background
        ctx.fillStyle = '#000000';
        ctx.fillRect(25, 30, 50, 40);
        
        // Screen content (game screen)
        ctx.fillStyle = '#000066';
        ctx.fillRect(27, 32, 46, 36);
        
        // Add simple game graphics on screen
        // Enemy characters
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(30, 35, 8, 8);
        ctx.fillRect(45, 35, 8, 8);
        ctx.fillRect(60, 35, 8, 8);
        
        // Player character
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(45, 55, 10, 10);
        
        // -- CONTROLS --
        // Control panel
        ctx.fillStyle = '#444444';
        ctx.fillRect(25, 80, 50, 30);
        
        // Joystick
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(40, 95, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(40, 95, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Buttons
        const buttonColors = ['#FF0000', '#FFFF00', '#00FF00', '#0000FF'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = buttonColors[i];
            ctx.beginPath();
            ctx.arc(60, 85 + i * 7, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // -- DECORATIVE ELEMENTS --
        // Coin slot
        ctx.fillStyle = '#666666';
        ctx.fillRect(40, 120, 20, 5);
        
        // Marquee at top
        ctx.fillStyle = '#9900FF';
        ctx.fillRect(20, 15, 60, 10);
        
        // Text on marquee
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ARCADE', 50, 23);
        
        // Add neon glow effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        
        // Glow outline
        ctx.beginPath();
        ctx.rect(15, 20, 70, 140);
        ctx.stroke();
        
        // Screen glow outline
        ctx.beginPath();
        ctx.rect(25, 30, 50, 40);
        ctx.stroke();
        
        // Convert to an image
        const img = new Image();
        img.onload = () => {
            debug(`ArcadeEntity12: Fallback asset created successfully (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Also store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        img.src = canvas.toDataURL();
    }
    
    /**
     * Check if player is near arcade cabinet
     * @param {Entity} player - Player entity
     * @returns {boolean} - Whether player is within interaction radius
     */
    isPlayerNearby(player) {
        if (!player) {
            debug(`ArcadeEntity12: No player provided to isPlayerNearby check`);
            return false;
        }
        
        // Calculate distance between player and arcade cabinet
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is within interaction radius
        const isNear = distance <= this.interactionRadius;
        
        // Log details about the proximity check
        if (isNear) {
            debug(`ArcadeEntity12: Player is nearby (distance: ${distance.toFixed(2)})`);
        }
        
        // Debug player distance occasionally
        if (Math.random() < 0.03) {
            console.log(`🎮 Player distance: ${distance.toFixed(2)}, Interaction radius: ${this.interactionRadius}`);
        }
        
        return isNear;
    }
    
    /**
     * Update the arcade cabinet state
     * @param {number} deltaTime - Time since last update in seconds
     * @param {object} input - Input state
     * @param {Entity} player - Player entity
     */
    update(deltaTime, player) {
        // Check if player is near the arcade cabinet
        if (player) {
            const isNearPlayer = this.isPlayerNearby(player);
            
            // Only trigger state change effects if proximity changed
            if (isNearPlayer !== this.isNearPlayer) {
                debug(`ArcadeEntity12: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
                // Trigger a pulse effect and sound when proximity changes
                if (isNearPlayer) {
                    this.pulseGlow();
                    
                    // Direct sound playback approach that works in ArcadeEntity11
                    // Each sound method creates its own AudioContext
                    try {
                        console.log('🎮🎮🎮 ArcadeEntity12: Directly calling playProximitySound');
                        this.playProximitySound();
                    } catch (err) {
                        console.error('🎮🎮🎮 Error playing proximity sound:', err);
                    }
                }
            }
            
            // Update proximity state
            this.isNearPlayer = isNearPlayer;
        }
        
        // Handle input when player is nearby and not already interacting
        if (this.isNearPlayer && !this.gameSelectVisible) {
            // Check for Enter key press - we check directly from the input system
            const isEnterPressed = window.input && window.input.keys && window.input.keys['Enter'];
            
            if (isEnterPressed && !this.wasEnterPressed) {
                debug(`ArcadeEntity12: Enter key pressed, starting interaction`);
                this.startInteraction();
            }
            
            // Update previous key state
            this.wasEnterPressed = isEnterPressed;
        }
        
        // Update glow effects
        if (this.isNearPlayer) {
            // Enhanced pulsing glow when player is nearby
            this.glowIntensity += this.glowDirection * this.glowSpeed;
            
            if (this.glowIntensity > this.maxGlowIntensity) {
                this.glowIntensity = this.maxGlowIntensity;
                this.glowDirection = -1;
            } else if (this.glowIntensity < this.maxGlowIntensity / 2) {
                this.glowIntensity = this.maxGlowIntensity / 2;
                this.glowDirection = 1;
            }
            
            // Fade in interaction prompt - faster fade in for better visibility
            this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + deltaTime * 4);
        } else {
            // Always maintain a base pulsing glow when player is away
            // Pulse between 20-40% of max glow intensity when not in proximity
            this.glowIntensity += this.glowDirection * (this.glowSpeed * 0.5);
            
            if (this.glowIntensity > this.maxGlowIntensity * 0.4) {
                this.glowIntensity = this.maxGlowIntensity * 0.4;
                this.glowDirection = -1;
            } else if (this.glowIntensity < this.maxGlowIntensity * 0.2) {
                this.glowIntensity = this.maxGlowIntensity * 0.2;
                this.glowDirection = 1;
            }
            
            // Fade out interaction prompt
            this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - deltaTime * 4);
            
            // If we're showing the game selection and player walks away, close it
            if (this.gameSelectVisible) {
                debug(`ArcadeEntity12: Player walked away, closing game selection`);
                this.hideGameSelection();
            }
        }
        
        // Update screen animation
        this.animationFrame += this.animationSpeed;
        if (this.animationFrame > 1) {
            this.animationFrame -= 1;
        }
        
        // Update screen glow
        this.screenGlow += this.screenGlowDirection * deltaTime * 0.5;
        if (this.screenGlow > 1) {
            this.screenGlow = 1;
            this.screenGlowDirection = -1;
        } else if (this.screenGlow < 0.5) {
            this.screenGlow = 0.5;
            this.screenGlowDirection = 1;
        }
        
        // Occasionally log input state for debugging
        if (Math.random() < 0.02 && this.isNearPlayer) {
            console.log("======= ARCADE INPUT DEBUG =======");
            console.log(`Player nearby: ${this.isNearPlayer}`);
            console.log(`Game select visible: ${this.gameSelectVisible}`);
            console.log(`Input object exists: ${!!window.input}`);
            
            if (window.input) {
                console.log(`Input keys object exists: ${!!window.input.keys}`);
                if (window.input.keys) {
                    console.log(`Enter key state: ${window.input.keys['Enter'] ? 'PRESSED' : 'not pressed'}`);
                    console.log(`Space key state: ${window.input.keys[' '] ? 'PRESSED' : 'not pressed'}`);
                    
                    // List all pressed keys for debugging
                    const pressedKeys = [];
                    for (const key in window.input.keys) {
                        if (window.input.keys[key]) {
                            pressedKeys.push(key);
                        }
                    }
                    console.log(`All pressed keys: ${pressedKeys.join(', ') || 'none'}`);
                }
            }
            console.log("==================================");
        }
        
        // Check for Enter key to start interaction
        let isEnterPressed = false;
        
        // First try window.input.keys approach
        if (window.input && window.input.keys) {
            isEnterPressed = window.input.keys['Enter'] || window.input.keys[' '];
            
            // Only detect a new press (not holding) to start interaction
            if (isEnterPressed && !this.wasEnterPressed) {
                console.log("🎮 ENTER KEY NEWLY PRESSED!");
                
                if (this.isNearPlayer && !this.gameSelectVisible) {
                    console.log("🎮 STARTING INTERACTION!");
                    this.startInteraction();
                }
            }
            
            // Update Enter key state for next frame
            this.wasEnterPressed = isEnterPressed;
        }
        
        // Setup and handle menu-specific direct keyboard controls when game selection is visible
        if (this.gameSelectVisible && !this.menuKeyListeners) {
            // Set up direct key listeners specifically for the menu
            console.log("🎮 Setting up direct menu key listeners");
            
            // Create listeners for menu navigation
            this.menuKeyListeners = {
                keydown: (e) => {
                    console.log(`🎮 Menu keydown detected: ${e.key}`);
                    
                    // Always prevent default for ANY key when menu is open
                    // This ensures no input gets to the game while in menu
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                        console.log("🎮 UP key detected for menu");
                        this.selectedGameIndex = (this.selectedGameIndex - 1 + this.games.length) % this.games.length;
                        this.playSelectSound();
                        
                        // Force redraw
                        this.drawGameSelectionInterface(null);
                    }
                    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                        console.log("🎮 DOWN key detected for menu");
                        this.selectedGameIndex = (this.selectedGameIndex + 1) % this.games.length;
                        this.playSelectSound();
                        
                        // Force redraw
                        this.drawGameSelectionInterface(null);
                    }
                    else if (e.key === 'Enter' || e.key === ' ') {
                        console.log("🎮 ENTER key detected for menu selection");
                        this.launchGame();
                    }
                    else if (e.key === 'Escape') {
                        console.log("🎮 ESCAPE key detected for menu");
                        this.hideGameSelection();
                    }
                    
                    // Also nullify the input system's knowledge of this key
                    if (window.input && window.input.keys) {
                        window.input.keys[e.key] = false;
                    }
                },
                
                // Also capture keyup events to prevent any lingering key states
                keyup: (e) => {
                    // Block all keyup events while menu is open
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Ensure the input system doesn't see this key as pressed
                    if (window.input && window.input.keys) {
                        window.input.keys[e.key] = false;
                    }
                }
            };
            
            // Add the listeners to document with capture phase
            // Using capture ensures our handlers run before the game's handlers
            document.addEventListener('keydown', this.menuKeyListeners.keydown, true);
            document.addEventListener('keyup', this.menuKeyListeners.keyup, true);
        }
        else if (!this.gameSelectVisible && this.menuKeyListeners) {
            // Remove menu listeners when menu is no longer visible
            console.log("🎮 Removing menu key listeners on hide");
            document.removeEventListener('keydown', this.menuKeyListeners.keydown, true);
            document.removeEventListener('keyup', this.menuKeyListeners.keyup, true);
            this.menuKeyListeners = null;
        }
        
        // Setup interaction key listener when near player but not in menu
        if (!this.hasKeyListeners && !this.gameSelectVisible && this.isNearPlayer) {
            // Set up one-time key listeners when player is near
            console.log("🎮 Setting up direct key listeners for arcade interaction");
            this.hasKeyListeners = true;
            
            // Add a direct document-level event listener as a fallback
            document.addEventListener('keydown', this.handleKeyDown = (e) => {
                console.log(`🎮 Direct keydown detected: ${e.key}`);
                if ((e.key === 'Enter' || e.key === ' ') && this.isNearPlayer && !this.gameSelectVisible) {
                    console.log("🎮 DIRECT ENTER KEY DETECTED - Starting interaction");
                    this.startInteraction();
                    
                    // Prevent default action
                    e.preventDefault();
                }
            });
        } else if (this.hasKeyListeners && (!this.isNearPlayer || this.gameSelectVisible)) {
            // Remove listeners when no longer needed
            console.log("🎮 Removing direct key listeners for arcade");
            document.removeEventListener('keydown', this.handleKeyDown);
            this.hasKeyListeners = false;
        }
        
        // Draw the game selection UI if it's visible
        // This needs to happen every frame to keep the UI updated
        if (this.gameSelectVisible) {
            // Get the canvas context for drawing
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    this.drawGameSelectionInterface(ctx);
                }
            }
        }
    }
    
    /**
     * Handle player input for arcade cabinet interaction
     * @param {object} input - Input state object
     * @param {Entity} player - Player entity
     */
    handleInput(input, player) {
        // This method is no longer used, as we've integrated input handling directly in update()
        // Keep it for backward compatibility but log a warning if it gets called
        debug(`ArcadeEntity12: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        debug(`ArcadeEntity12: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            debug(`ArcadeEntity12: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity12: Game interaction system not available!`);
        }
        
        // Simply play activation sound directly - each sound method creates its own AudioContext
        // This follows the pattern from ArcadeEntity11 which successfully manages audio playback
        try {
            console.log('🎮🎮🎮 ArcadeEntity12: Directly calling playActivateSound');
            this.playActivateSound();
        } catch (err) {
            console.error('🎮🎮🎮 Error playing activation sound:', err);
        }
    }
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity12: Hiding game selection`);
        console.log("🎮 ArcadeEntity12: Hiding game selection and playing close sound");
        
        // Play a sound effect when closing the menu - using direct approach that works in ArcadeEntity11
        try {
            console.log('🎮🎮🎮 ArcadeEntity12: Directly calling playMenuCloseSound');
            // Each sound method creates its own AudioContext now
            this.playMenuCloseSound();
        } catch (err) {
            console.error("🎮 ArcadeEntity12: Error calling playMenuCloseSound:", err);
        }
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity12: Set game interaction state to inactive`);
        }
        
        // Remove menu key listeners if they exist
        if (this.menuKeyListeners) {
            console.log("🎮 Removing menu key listeners on hide");
            document.removeEventListener('keydown', this.menuKeyListeners.keydown, true);
            document.removeEventListener('keyup', this.menuKeyListeners.keyup, true);
            this.menuKeyListeners = null;
        }
        
        // Remove the overlay canvas if it exists
        const overlayCanvas = document.getElementById('arcadeMenuOverlay');
        if (overlayCanvas) {
            // Remove event listeners before removing the canvas
            if (overlayCanvas._clickHandler) {
                console.log("🎮 Removing menu click handler on hide");
                overlayCanvas.removeEventListener('click', overlayCanvas._clickHandler, true);
            }
            overlayCanvas.parentElement.removeChild(overlayCanvas);
        }
        
        // Reset click timing to prevent issues on next open
        this._lastClickTime = 0;
        // Reset opened URLs tracking
        this._openedUrls = {};
        
        // Clear any lingering key states in the input system
        if (window.input && window.input.keys) {
            // Reset common control keys to prevent stuck keys
            const keysToReset = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                                'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
                                'Enter', ' ', 'Escape'];
            keysToReset.forEach(key => {
                window.input.keys[key] = false;
            });
        }
    }
    
    /**
 * Launch the selected game
 */
launchGame() {
    debug(`ArcadeEntity12: Launching game: ${this.games[this.selectedGameIndex].title}`);
    
    if (this.games.length === 0) {
        debug(`ArcadeEntity12: No games available to launch`);
        return;
    }
        
    // Get the selected game
    const selectedGame = this.games[this.selectedGameIndex];
    debug(`ArcadeEntity12: Launching game: ${selectedGame.title}`);

    // Play launch sound
    this.playLaunchSound();
    
    // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity12: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity12: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    /**
     * Play fantasy RPG menu activation sound when selecting the arcade cabinet
     * Creates an epic magical portal opening sound with mystical elements
     */
    playActivateSound() {
        console.log('🎮🎮🎮 ArcadeEntity12: Attempting to play fantasy RPG menu activation sound');
        
        // Check if sound is already playing and return if it is
        if (ArcadeEntity12._activatePlaying) {
            console.log('🎮🎮🎮 ArcadeEntity12: Activate sound already playing, skipping');
            return;
        }
        
        // Set flag to true to prevent multiple overlapping sounds
        ArcadeEntity12._activatePlaying = true;
        
        try {
            // Create a new independent audio context for each sound
            const context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎮🎮🎮 ArcadeEntity12: Created independent audio context for activate sound');
            
            // Add to tracking array for cleanup later
            if (!ArcadeEntity12._activeAudioContexts) {
                ArcadeEntity12._activeAudioContexts = [];
            }
            ArcadeEntity12._activeAudioContexts.push(context);
            console.log('🎮🎮🎮 ArcadeEntity12: Added activate sound context to tracking array');
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('🎮🎮🎮 ArcadeEntity12: Audio context is suspended, attempting to resume');
                // Return early and create a promise chain to ensure audio plays only after context resumes
                return context.resume().then(() => {
                    console.log('🎮🎮🎮 ArcadeEntity12: Audio context resumed successfully for activate sound');
                    // Reset flag so we can retry
                    ArcadeEntity12._activatePlaying = false;
                    // Call this method again (without .call) after context is resumed
                    this.playActivateSound();
                    return; // Prevent continuing with the current execution
                }).catch(err => {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error resuming audio context for activate sound:', err);
                    // Reset the flag to allow retrying
                    ArcadeEntity12._activatePlaying = false;
                });
            }
            
            console.log('🎮🎮🎮 ArcadeEntity12: Playing fantasy RPG menu activation sound with state:', context.state);
            
            // Create a master gain node for overall control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.3;
            masterGain.connect(context.destination);
            
            // 1. Create fantasy harp glissando (ascending) - iconic RPG menu sound
            const harpNotesCount = 12;
            const harpNotes = [
                294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880 // D-major scale ascending
            ];
            
            for (let i = 0; i < harpNotesCount; i++) {
                // Create an oscillator for each note in the glissando
                const harpOsc = context.createOscillator();
                harpOsc.type = 'triangle'; // Triangle wave for harp-like timbre
                harpOsc.frequency.value = harpNotes[i];
                
                // Each note starts slightly after the previous one
                const startTime = context.currentTime + (i * 0.04);
                
                // Create a gain node for the note's envelope
                const noteGain = context.createGain();
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(0.12, startTime + 0.02); // Quick attack
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5); // Long decay
                
                // Add slight stereo panning for immersive feel
                const panner = context.createStereoPanner();
                panner.pan.value = -0.5 + (i / harpNotesCount); // Pan from left to right
                
                // Connect the nodes
                harpOsc.connect(noteGain);
                noteGain.connect(panner);
                panner.connect(masterGain);
                
                // Start and stop the oscillator
                harpOsc.start(startTime);
                harpOsc.stop(startTime + 0.6);
            }
            
            // 2. Create magical shimmer effect (card game pack opening)
            const shimmerBuffer = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate);
            const shimmerData = shimmerBuffer.getChannelData(0);
            
            // Fill shimmer buffer with magical crystalline sounds
            for (let i = 0; i < shimmerData.length; i++) {
                const t = i / context.sampleRate;
                const progress = i / shimmerData.length;
                
                // Create random magical sparkles with increasing density
                if (Math.random() < 0.03 * (1 - Math.pow(progress - 0.3, 2))) {
                    const sparkleLength = Math.floor(context.sampleRate * 0.08);
                    if (i + sparkleLength < shimmerData.length) {
                        // Random sparkle frequency
                        const freq = 2000 + Math.random() * 4000;
                        
                        for (let j = 0; j < sparkleLength; j++) {
                            const decay = Math.exp(-j / (sparkleLength * 0.5));
                            // Crystalline sine wave with decay
                            shimmerData[i + j] += Math.sin(2 * Math.PI * freq * (j / context.sampleRate)) * decay * 0.15;
                        }
                    }
                }
            }
            
            const shimmerSource = context.createBufferSource();
            shimmerSource.buffer = shimmerBuffer;
            
            // Shimmer filter for magical quality
            const shimmerFilter = context.createBiquadFilter();
            shimmerFilter.type = 'bandpass';
            shimmerFilter.frequency.value = 4000;
            shimmerFilter.Q.value = 1.5;
            
            // Shimmer gain envelope
            const shimmerGain = context.createGain();
            shimmerGain.gain.setValueAtTime(0, context.currentTime);
            shimmerGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.2);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.0);
            
            // 3. Create fantasy choir/pad sound (for epic RPG feel)
            const padOsc1 = context.createOscillator();
            padOsc1.type = 'sine';
            padOsc1.frequency.value = 220; // A3
            
            const padOsc2 = context.createOscillator();
            padOsc2.type = 'sine';
            padOsc2.frequency.value = 330; // E4 (perfect fifth)
            
            const padOsc3 = context.createOscillator();
            padOsc3.type = 'sine';
            padOsc3.frequency.value = 440; // A4 (octave)
            
            // Create a common gain envelope for the pad
            const padGain = context.createGain();
            padGain.gain.setValueAtTime(0, context.currentTime);
            padGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.3);
            padGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.6);
            padGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
            
            // Create a chorus effect for the pad
            const padChorus = context.createBiquadFilter();
            padChorus.type = 'allpass';
            padChorus.frequency.value = 2;
            padChorus.Q.value = 5;
            
            // Create fantasy hall reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
            
            // Create fantasy hall reverb impulse
            for (let channel = 0; channel < 2; channel++) {
                const data = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    // Create open, airy reverb characteristic of fantasy halls
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.6)) * 0.5;
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Connect nodes
            shimmerSource.connect(shimmerFilter);
            shimmerFilter.connect(shimmerGain);
            shimmerGain.connect(masterGain);
            shimmerGain.connect(convolver);
            
            padOsc1.connect(padChorus);
            padOsc2.connect(padChorus);
            padOsc3.connect(padChorus);
            padChorus.connect(padGain);
            padGain.connect(masterGain);
            padGain.connect(convolver);
            
            convolver.connect(masterGain);
            
            // Start sources
            shimmerSource.start();
            padOsc1.start();
            padOsc2.start();
            padOsc3.start();
            
            // Stop and clean up
            setTimeout(() => {
                try {
                    padOsc1.stop();
                    padOsc2.stop();
                    padOsc3.stop();
                    
                    // Remove context from tracking array
                    const index = ArcadeEntity12._activeAudioContexts.indexOf(context);
                    if (index !== -1) {
                        ArcadeEntity12._activeAudioContexts.splice(index, 1);
                    }
                    
                    // CRITICAL: Reset the flag so the sound can be played again
                    ArcadeEntity12._activatePlaying = false;
                    console.log('🎮🎮🎮 ArcadeEntity12: Reset activate sound flag');
                    
                    // Close this context
                    context.close().then(() => {
                        console.log('🎮🎮🎮 ArcadeEntity12: Activate sound context closed successfully');
                    }).catch(err => {
                        console.error('🎮🎮🎮 ArcadeEntity12: Error closing context:', err);
                    });
                } catch (err) {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error cleaning up activate sound:', err);
                    // Still reset the flag even if cleanup fails
                    ArcadeEntity12._activatePlaying = false;
                }
            }, 2500); // Extended duration to ensure full sound playback
            
            debug(`ArcadeEntity12: Played ancient temple door activation sound`);
        } catch (err) {
            debug(`ArcadeEntity12: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play a synthwave selection sound effect for menu navigation
     * Creates a retro digital confirmation effect with synth tones and glitchy artifacts
     */
    playSelectSound() {
        // Check if sound is already playing and return if it is
        if (ArcadeEntity12._selectPlaying) {
            console.log('🎮🎮🎮 ArcadeEntity12: Select sound already playing, skipping');
            return;
        }
        
        // Set flag to prevent multiple overlapping sounds
        ArcadeEntity12._selectPlaying = true;
        
        try {
            console.log('🎮🎮🎮 ArcadeEntity12: Playing synthwave menu selection sound');
            
            // Create a new independent audio context for each sound playback
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for potential cleanup later
            if (!ArcadeEntity12._activeAudioContexts) {
                ArcadeEntity12._activeAudioContexts = [];
            }
            ArcadeEntity12._activeAudioContexts.push(context);
            console.log('🎮🎮🎮 ArcadeEntity12: Added select sound context to tracking array');
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('🎮🎮🎮 ArcadeEntity12: Audio context is suspended, attempting to resume');
                return context.resume().then(() => {
                    console.log('🎮🎮🎮 ArcadeEntity12: Audio context resumed successfully for select sound');
                    // Reset flag so we can retry
                    ArcadeEntity12._selectPlaying = false;
                    // Call this method again after context is resumed
                    this.playSelectSound();
                    return; // Prevent continuing with current execution
                }).catch(err => {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error resuming audio context for select sound:', err);
                    // Reset the flag to allow retrying
                    ArcadeEntity12._selectPlaying = false;
                });
            }
            
            // Create a master gain node for overall control
            const mainGain = context.createGain();
            mainGain.gain.value = 0.3;
            mainGain.connect(context.destination);
            
            // 1. Create retro digital confirmation tone - synthwave style
            const confirmOsc = context.createOscillator();
            confirmOsc.type = 'square'; // Digital square wave for synthwave feel
            confirmOsc.frequency.value = 880; // A5 note
            
            // Modulate the frequency for cool synthwave effect
            confirmOsc.frequency.setValueAtTime(880, context.currentTime);
            confirmOsc.frequency.exponentialRampToValueAtTime(1760, context.currentTime + 0.1); // Fast upward sweep
            
            // Create gain envelope for the confirmation tone
            const confirmGain = context.createGain();
            confirmGain.gain.setValueAtTime(0.0, context.currentTime);
            confirmGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.02); // Very quick attack
            confirmGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2); // Short decay
            
            // 2. Create analog synth backing tone for warmth
            const analogOsc = context.createOscillator();
            analogOsc.type = 'sawtooth'; // Classic analog synth sound
            analogOsc.frequency.value = 440; // A4 note - octave below
            
            // Create gain envelope for analog component
            const analogGain = context.createGain();
            analogGain.gain.setValueAtTime(0.0, context.currentTime);
            analogGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.03); // Fast attack
            analogGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); // Quick decay
            
            // 3. Create digital glitch effect
            const glitchOsc = context.createOscillator();
            glitchOsc.type = 'square';
            glitchOsc.frequency.value = 2200; // High frequency for digital artifacts
            
            // Modulate for glitchy effect
            glitchOsc.frequency.setValueAtTime(2200, context.currentTime);
            glitchOsc.frequency.linearRampToValueAtTime(1800, context.currentTime + 0.05);
            glitchOsc.frequency.linearRampToValueAtTime(3000, context.currentTime + 0.08);
            glitchOsc.frequency.linearRampToValueAtTime(1500, context.currentTime + 0.1);
            
            const glitchGain = context.createGain();
            glitchGain.gain.setValueAtTime(0.0, context.currentTime);
            glitchGain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.01); // Almost immediate attack
            glitchGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.03); // First glitch cut
            glitchGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.05); // Second glitch
            glitchGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.07); // Second cut
            glitchGain.gain.linearRampToValueAtTime(0.02, context.currentTime + 0.09); // Third glitch 
            glitchGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12); // Fade out
            
            // Create filters for better tone shaping
            const confirmFilter = context.createBiquadFilter();
            confirmFilter.type = 'bandpass';
            confirmFilter.frequency.value = 1200;
            confirmFilter.Q.value = 2.0; // More resonant for synthwave quality
            
            // Connect all nodes to the main gain node
            confirmOsc.connect(confirmFilter);
            confirmFilter.connect(confirmGain);
            confirmGain.connect(mainGain);
            
            analogOsc.connect(analogGain);
            analogGain.connect(mainGain);
            
            glitchOsc.connect(glitchGain);
            glitchGain.connect(mainGain);
            
            // Start oscillators
            confirmOsc.start(context.currentTime);
            analogOsc.start(context.currentTime);
            glitchOsc.start(context.currentTime);
            
            // Set timeout to stop and clean up
            setTimeout(() => {
                try {
                    // Stop all oscillators
                    confirmOsc.stop();
                    analogOsc.stop();
                    glitchOsc.stop();
                    
                    // Disconnect all nodes to avoid residual sounds
                    confirmGain.disconnect();
                    analogGain.disconnect();
                    glitchGain.disconnect();
                    mainGain.disconnect();
                    confirmFilter.disconnect();
                    
                    // CRITICAL: Reset the flag so the sound can be played again
                    ArcadeEntity12._selectPlaying = false;
                    console.log('🎮🎮🎮 ArcadeEntity12: Reset select sound flag');
                    
                    // Remove from tracking array
                    const index = ArcadeEntity12._activeAudioContexts.indexOf(context);
                    if (index !== -1) {
                        ArcadeEntity12._activeAudioContexts.splice(index, 1);
                        console.log('🎮🎮🎮 ArcadeEntity12: Removed select sound context from tracking array');
                    }
                    
                    // Close the context to ensure complete cleanup
                    context.close().then(() => {
                        console.log('🎮🎮🎮 ArcadeEntity12: Select sound context closed successfully');
                    }).catch(err => {
                        console.error('🎮🎮🎮 ArcadeEntity12: Error closing select sound context:', err);
                    });
                    
                    console.log('🎮🎮🎮 ArcadeEntity12: Selection sound completed');
                } catch (err) {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error cleaning up selection sound:', err);
                    // Still reset the flag even if cleanup fails
                    ArcadeEntity12._selectPlaying = false;
                }
            }, 250); // Short duration for selection effect - even shorter than before for snappy UI
            
            console.log('🎮🎮🎮 ArcadeEntity12: Played synthwave selection sound');
        } catch (err) {
            console.error('🎮🎮🎮 ArcadeEntity12: Error playing selection sound:', err);
            // CRITICAL: Reset the flag if there's an error during sound generation
            ArcadeEntity12._selectPlaying = false;
            console.log('🎮🎮🎮 ArcadeEntity12: Reset select flag after error');
        }
    }
    
    /**
     * Play epic fantasy RPG/trading card game launch sound when starting a game
     * Creates an immersive audio experience reminiscent of epic card games and fantasy adventures
     */
    playLaunchSound() {
        try {
            console.log('ArcadeEntity12: Playing fantasy RPG/TCG game launch sound');
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a master gain node for overall control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.35;
            masterGain.connect(context.destination);
            
            // 1. Create a dramatic fantasy orchestral hit - iconic for RPG game launch
            // Uses layered oscillators with carefully timed envelopes
            
            // Base orchestral hit in D major (D3, A3, D4, F#4)
            const noteFrequencies = [146.83, 220, 293.66, 369.99];
            const oscillators = [];
            
            // Create and configure each oscillator for the orchestral hit
            noteFrequencies.forEach(freq => {
                const osc = context.createOscillator();
                osc.type = 'sawtooth'; // Rich harmonic content for orchestral sound
                osc.frequency.value = freq;
                
                // Create a gain node for the oscillator's envelope
                const oscGain = context.createGain();
                oscGain.gain.setValueAtTime(0, context.currentTime);
                oscGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.08); // Fast attack
                oscGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.3); // Initial decay
                oscGain.gain.linearRampToValueAtTime(0.07, context.currentTime + 0.8); // Sustain
                oscGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.0); // Release
                
                // Connect the oscillator to its gain node
                osc.connect(oscGain);
                
                // Add a lowpass filter for warmth
                const filter = context.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(500, context.currentTime);
                filter.frequency.linearRampToValueAtTime(2000, context.currentTime + 0.2);
                filter.Q.value = 1.0;
                
                // Connect the gain node to the filter and then to the master gain
                oscGain.connect(filter);
                filter.connect(masterGain);
                
                // Start the oscillator
                osc.start();
                
                // Save reference for cleanup
                oscillators.push({osc, gain: oscGain});
            });
            
            // 2. Create magical card summoning sounds
            const cardSummonBuffer = context.createBuffer(1, context.sampleRate * 1.5, context.sampleRate);
            const cardData = cardSummonBuffer.getChannelData(0);
            
            // Fill buffer with magical card summoning effects
            for (let i = 0; i < cardData.length; i++) {
                const progress = i / cardData.length;
                const t = i / context.sampleRate;
                
                // Add magical whoosh/emergence effect
                if (progress > 0.1 && progress < 0.6) {
                    // Rising magical tone
                    const emergeFreq = 800 + 1200 * Math.pow(progress, 2);
                    const emergeAmp = 0.13 * Math.sin(Math.PI * ((progress - 0.1) / 0.5));
                    cardData[i] += Math.sin(2 * Math.PI * emergeFreq * t) * emergeAmp;
                    
                    // Add magical particle effects
                    if (Math.random() < 0.1) {
                        const particleLength = Math.floor(context.sampleRate * 0.05);
                        if (i + particleLength < cardData.length) {
                            const particleFreq = 2000 + Math.random() * 3000;
                            for (let j = 0; j < particleLength; j++) {
                                const decay = Math.exp(-j / (particleLength * 0.3));
                                if (i + j < cardData.length) {
                                    cardData[i + j] += Math.sin(2 * Math.PI * particleFreq * j / context.sampleRate) * decay * 0.07;
                                }
                            }
                        }
                    }
                }
                
                // Add card placement sound near the end
                if (progress > 0.7 && progress < 0.75) {
                    cardData[i] += (Math.random() * 2 - 1) * 0.2 * (1 - ((progress - 0.7) / 0.05));
                }
            }
            
            const cardSummonSource = context.createBufferSource();
            cardSummonSource.buffer = cardSummonBuffer;
            
            // Filter for the card summon effect
            const cardFilter = context.createBiquadFilter();
            cardFilter.type = 'bandpass';
            cardFilter.frequency.value = 2000;
            cardFilter.Q.value = 1.0;
            
            const cardGain = context.createGain();
            cardGain.gain.value = 0.25;
            
            // 3. Create epic fantasy choir/pad atmospheric sounds
            const choirPad = context.createOscillator();
            choirPad.type = 'sine';
            choirPad.frequency.value = 220; // A3
            
            const choirPad2 = context.createOscillator();
            choirPad2.type = 'sine';
            choirPad2.frequency.value = 330; // E4 - fifth
            
            const choirPad3 = context.createOscillator();
            choirPad3.type = 'sine';
            choirPad3.frequency.value = 440; // A4 - octave
            
            // Slowly modulate the choir frequency for an ethereal effect
            const choirLFO = context.createOscillator();
            choirLFO.type = 'sine';
            choirLFO.frequency.value = 0.5; // Slow modulation
            
            const choirLFOGain = context.createGain();
            choirLFOGain.gain.value = 3; // Modulation amount
            
            // Connect modulation
            choirLFO.connect(choirLFOGain);
            choirLFOGain.connect(choirPad2.frequency);
            
            // Create gain envelope for the choir
            const choirGain = context.createGain();
            choirGain.gain.setValueAtTime(0, context.currentTime);
            choirGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.5);
            choirGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 1.5);
            choirGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 3.0);
            
            // 4. Add mystical bass impact for dramatic effect
            const bassImpact = context.createOscillator();
            bassImpact.type = 'sine';
            bassImpact.frequency.value = 80; // Deep bass note
            
            const bassGain = context.createGain();
            bassGain.gain.setValueAtTime(0, context.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1); // Quick attack
            bassGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.0); // Decay
            
            // 5. Create fantasy hall reverb for immersive space
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 3, context.sampleRate);
            
            // Create fantasy hall reverb impulse
            for (let channel = 0; channel < 2; channel++) {
                const data = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.8)) * 0.6;
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Create a gentle stereo panning for spatial effects
            const pannerCardEffect = context.createStereoPanner();
            pannerCardEffect.pan.setValueAtTime(-0.3, context.currentTime);
            pannerCardEffect.pan.linearRampToValueAtTime(0.3, context.currentTime + 1.0);
            
            // Register this sound in the global sound manager to prevent overlapping
            if (window.currentArcadeSound && window.currentArcadeSound.stop) {
                console.log('ArcadeEntity12: Stopping previous arcade sound before playing launch sound');
                window.currentArcadeSound.stop();
            }
            
            // Connect all components to the audio graph
            cardSummonSource.connect(cardFilter);
            cardFilter.connect(cardGain);
            cardGain.connect(pannerCardEffect);
            pannerCardEffect.connect(masterGain);
            
            choirPad.connect(choirGain);
            choirPad2.connect(choirGain);
            choirPad3.connect(choirGain);
            choirGain.connect(masterGain);
            
            bassImpact.connect(bassGain);
            bassGain.connect(masterGain);
            
            // Send portion of signals to reverb for spatial depth
            cardGain.connect(convolver);
            choirGain.connect(convolver);
            convolver.connect(masterGain);
            
            // Start all sources
            cardSummonSource.start();
            choirPad.start();
            choirPad2.start();
            choirPad3.start();
            choirLFO.start();
            bassImpact.start();
            
            // Create a controller object for the current sound instance
            window.currentArcadeSound = {
                arcadeId: this.arcadeId || 'arcade-12',
                soundType: 'fantasy-rpg-launch',
                // Method to stop all oscillators and sources
                stop: () => {
                    try {
                        cardSummonSource.stop();
                        choirPad.stop();
                        choirPad2.stop();
                        choirPad3.stop();
                        choirLFO.stop();
                        bassImpact.stop();
                        
                        // Disconnect all nodes to allow garbage collection
                        cardGain.disconnect();
                        choirGain.disconnect();
                        bassGain.disconnect();
                        convolver.disconnect();
                        masterGain.disconnect();
                        console.log('ArcadeEntity12: Fantasy RPG/TCG launch sound stopped by manager');
                    } catch (err) {
                        console.error('ArcadeEntity12: Error stopping launch sound:', err);
                    }
                }
            };
            
            // Clean up
            setTimeout(() => {
                try {
                    // Only clean up if this is still the active sound
                    if (window.currentArcadeSound && window.currentArcadeSound.soundType === 'fantasy-rpg-launch') {
                        // Stop oscillators
                        oscillators.forEach(({osc}) => osc.stop());
                        choirPad.stop();
                        choirPad2.stop();
                        choirPad3.stop();
                        choirLFO.stop();
                        bassImpact.stop();
                        
                        // Disconnect nodes for cleanup
                        cardGain.disconnect();
                        choirGain.disconnect();
                        bassGain.disconnect();
                        convolver.disconnect();
                        masterGain.disconnect();
                        
                        // Clear the global reference if it's still this sound
                        if (window.currentArcadeSound && window.currentArcadeSound.soundType === 'fantasy-rpg-launch') {
                            window.currentArcadeSound = null;
                        }
                        
                        context.close();
                    }
                } catch (err) {
                    console.error('ArcadeEntity12: Error cleaning up launch sound resources:', err);
                }
            }, 3000); // 3 second sound duration for epic fantasy feel
            
            console.log('ArcadeEntity12: Played fantasy RPG/TCG launch fanfare');

        } catch (err) {
            console.error('ArcadeEntity12: Error playing launch sound:', err);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity12: Using Web Audio API for sound generation`);
    }
    
    /**
 * Load game images for the selection screen
 */
loadGameImages() {
    debug(`ArcadeEntity12: Loading game images for Zans Cards cabinet`); 
    console.log(`🎮 ArcadeEntity12: Loading game images for Zans Cards cabinet`);
    
    if (!this.games || this.games.length === 0) {
        debug(`ArcadeEntity12: No games to load images for`);
        console.warn(`🎮 ArcadeEntity12: No games to load images for`);
        return;
    }
        
    console.log(`🎮 ArcadeEntity12: Loading images for ${this.games.length} games:`, 
        this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity12: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity12: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity12: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity12: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity12: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity12: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity12: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity12: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity12: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity12: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity12: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity12: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity12: No image path for ${game.title}`);
                this.createFallbackImage(game);
            }
        });
    }
    
    /**
     * Try to load image from alternative paths
     * @param {Object} game - The game object
     */
    tryAlternativeImagePaths(game) {
        if (!game.alternativeImagePaths || game.alternativeImagePaths.length === 0) {
            console.warn(`🎮 ArcadeEntity12: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity12: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity12: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
            
            const img = new Image();
            img.onload = () => {
                console.log(`🎮 ArcadeEntity12: Successfully loaded alternative image for ${game.title}`);
                game.image = img;
            };
            
            img.onerror = () => {
                console.warn(`🎮 ArcadeEntity12: Failed to load alternative path: ${altPath}`);
                pathIndex++;
                tryNextPath(); // Try the next path
            };
            
            let finalPath = altPath;
    if (typeof window.getAssetPath === 'function') {
        try {
            finalPath = window.getAssetPath(altPath);
        } catch (e) {}
    }
    
    img.src = finalPath;
};
        
        tryNextPath();
    }
    
    /**
 * Create a fallback image when no game image is available
 * @param {Object} game - The game object
 */
createFallbackImage(game) {
    console.log(`🎮 ArcadeEntity12: Creating canvas fallback image for ${game.title}`);

    // Create a canvas to generate a placeholder image
    const canvas = document.createElement('canvas');
    canvas.width = 400;  // Standard game preview width
    canvas.height = 200; // Standard game preview height
        
    const ctx = canvas.getContext('2d');
    
    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#3a0d61');   // Dark purple
    gradient.addColorStop(1, '#7e1ddb');   // Light purple
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add game title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(game.title, canvas.width/2, canvas.height/2 - 10);
    
    // Add description if available
    if (game.description) {
        ctx.font = '18px Arial';
        ctx.fillText(game.description, canvas.width/2, canvas.height/2 + 20);
    }
    
    // Draw border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, canvas.width-8, canvas.height-8);
    
    // Convert canvas to image
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.src = dataUrl;
    
    // Set as game image
    game.image = img;
    
    console.log(`🎮 ArcadeEntity12: Fallback image created for ${game.title}`);
}

    /**
     * Play a fantasy RPG/trading card game menu closing sound
     * Creates a magical portal closing effect with card shuffling and mystical elements
     */
    playMenuCloseSound() {
        // Check if we're already playing the menu close sound
        if (ArcadeEntity12._menuClosePlaying) {
            console.log('🎮🎮🎮 ArcadeEntity12: Menu close sound already playing, skipping');
            return;
        }
        
        // Set flag to prevent multiple overlapping sounds
        ArcadeEntity12._menuClosePlaying = true;
        
        try {
            console.log('🎮🎮🎮 ArcadeEntity12: Playing fantasy RPG/TCG menu close sound');
            
            // Create new audio context for this sound (following ArcadeEntity11 pattern)
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for cleanup later
            if (!ArcadeEntity12._activeAudioContexts) {
                ArcadeEntity12._activeAudioContexts = [];
            }
            ArcadeEntity12._activeAudioContexts.push(context);
            console.log('🎮🎮🎮 ArcadeEntity12: Added menu close context to tracking array');
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('🎮🎮🎮 ArcadeEntity12: Audio context is suspended, attempting to resume');
                return context.resume().then(() => {
                    console.log('🎮🎮🎮 ArcadeEntity12: Audio context resumed successfully for menu close sound');
                    // Reset flag so we can retry
                    ArcadeEntity12._menuClosePlaying = false;
                    // Call this method again after context is resumed
                    this.playMenuCloseSound();
                    return; // Prevent continuing with current execution
                }).catch(err => {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error resuming audio context for menu close sound:', err);
                    // Clean up the context on error
                    try {
                        // Remove from tracking array
                        const index = ArcadeEntity12._activeAudioContexts.indexOf(context);
                        if (index !== -1) {
                            ArcadeEntity12._activeAudioContexts.splice(index, 1);
                            console.log('🎮🎮🎮 ArcadeEntity12: Removed failed context from tracking array');
                        }
                        
                        // Close the context
                        context.close().then(() => {
                            console.log('🎮🎮🎮 ArcadeEntity12: Closed context after resume failure');
                        }).catch(closeErr => {
                            console.error('🎮🎮🎮 ArcadeEntity12: Error closing context after resume failure:', closeErr);
                        });
                    } catch (cleanupErr) {
                        console.error('🎮🎮🎮 ArcadeEntity12: Error cleaning up after resume failure:', cleanupErr);
                    }
                    
                    // CRITICAL: Reset the flag to allow retrying
                    ArcadeEntity12._menuClosePlaying = false;
                    console.log('🎮🎮🎮 ArcadeEntity12: Reset menu close flag after resume failure');
                });
            }
            
            // Create a master gain node for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.4;
            masterGain.connect(context.destination);
            
            // Create mixer gain for effects chain
            const mixerGain = context.createGain();
            mixerGain.gain.value = 0.5;
            mixerGain.connect(context.destination);
            console.log('🎮🎮🎮 ArcadeEntity12: Created mixer gain node for menu close sound');
            
            // 1. Create magical card shuffling/gathering sound
            const cardBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const cardData = cardBuffer.getChannelData(0);
            
            // Fill the buffer with card shuffling and gathering sounds
            for (let i = 0; i < cardData.length; i++) {
                const progress = i / cardData.length;
                
                // Create card shuffling texture with varying density based on progress
                if (Math.random() < 0.15 * (1 - progress * 0.8)) {
                    // Card flip/shuffle sound - short envelope
                    for (let j = 0; j < 300 && i + j < cardData.length; j++) {
                        // Create a short impulse with quick decay for card movement sound
                        cardData[i + j] = (Math.random() * 2 - 1) * Math.exp(-j / 20) * 0.5 * (1 - progress * 0.7);
                    }
                    i += 100; // Skip ahead to avoid too much overlap
                }
                
                // Add some structured noise that sounds like cards being placed together
                if (progress > 0.5 && progress < 0.7) {
                    cardData[i] += (Math.random() * 2 - 1) * 0.3 * Math.sin(Math.PI * ((progress - 0.5) / 0.2));
                }
            }
            
            const cardSource = context.createBufferSource();
            cardSource.buffer = cardBuffer;
            
            // Card sound filter for authentic paper sound
            const cardFilter = context.createBiquadFilter();
            cardFilter.type = 'bandpass';
            cardFilter.frequency.value = 2000;
            cardFilter.Q.value = 1.0;
            
            // Card gain envelope
            const cardGain = context.createGain();
            cardGain.gain.setValueAtTime(0.3, context.currentTime);
            cardGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.4);
            cardGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
            
            // Connect card components
            cardSource.connect(cardFilter);
            cardFilter.connect(cardGain);
            cardGain.connect(masterGain);
            
            // 2. Create magical portal/gateway closing sound
            // Reverse glissando/sweep for closing effect (opposite of opening sound)
            const portalSweep = context.createOscillator();
            portalSweep.type = 'sine';
            portalSweep.frequency.setValueAtTime(800, context.currentTime);
            portalSweep.frequency.exponentialRampToValueAtTime(150, context.currentTime + 0.7);
            
            // Add harmonic for richness
            const portalHarmonic = context.createOscillator();
            portalHarmonic.type = 'sine';
            portalHarmonic.frequency.setValueAtTime(1200, context.currentTime);
            portalHarmonic.frequency.exponentialRampToValueAtTime(225, context.currentTime + 0.7);
            
            // Sweep gain envelope
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.1, context.currentTime);
            portalGain.gain.linearRampToValueAtTime(0.02, context.currentTime + 0.6);
            portalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
            
            // Connect portal components
            portalSweep.connect(portalGain);
            portalHarmonic.connect(portalGain);
            portalGain.connect(masterGain);
            
            // Add gentle ping/chime at end of closing for finality
            const closingChime = context.createOscillator();
            closingChime.type = 'sine';
            closingChime.frequency.value = 880; // A5
            
            const chimeGain = context.createGain();
            chimeGain.gain.setValueAtTime(0.0, context.currentTime);
            chimeGain.gain.setValueAtTime(0.0, context.currentTime + 0.5); // Delay the chime
            chimeGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.52); // Quick attack
            chimeGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2); // Long decay
            
            // Connect chime components
            closingChime.connect(chimeGain);
            chimeGain.connect(masterGain);
            
            // ----- DISTINCTIVE DUST AND DEBRIS -----
            
            // 3. Create much more noticeable dust/debris settling effect
            const dustNoise = context.createBufferSource();
            const dustBuffer = context.createBuffer(1, context.sampleRate * 1.0, context.sampleRate);
            const dustData = dustBuffer.getChannelData(0);
            
            // More distinctive dust and small rocks falling
            for (let i = 0; i < dustData.length; i++) {
                const progress = i / dustData.length;
                let particleEffect = (Math.random() * 0.1 - 0.05) * Math.exp(-progress * 2);
                
                // Add occasional small rock impacts
                if (progress > 0.4 && progress < 0.9 && Math.random() > 0.98) {
                    particleEffect += (Math.random() * 0.2 - 0.1);
                }
                
                dustData[i] = particleEffect;
            }
            
            dustNoise.buffer = dustBuffer;
            
            // Filter for dust and debris particles
            const dustFilter = context.createBiquadFilter();
            dustFilter.type = 'bandpass'; // Changed to bandpass for more distinctive sound
            dustFilter.frequency.value = 2000;
            dustFilter.Q.value = 1.0;
            
            // Louder dust effect
            const dustGain = context.createGain();
            dustGain.gain.setValueAtTime(0.0, context.currentTime);
            dustGain.gain.setValueAtTime(0.0, context.currentTime + 0.4); // Start after the thud
            dustGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.45); // Louder
            dustGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.0);
            
            // ----- IMPROVED TEMPLE ACOUSTICS -----
            
            // 4. Enhanced echo/reverb for dramatic temple acoustics
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2.0, context.sampleRate);
            
            // Create more dramatic reverb impulse with temple acoustics
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Longer decay with more pronounced reflections
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.6));
                    
                    // Add dramatic early reflections
                    if (i % (context.sampleRate * 0.1) < 300) {
                        channelData[i] *= 2.0; // Stronger reflections
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Much higher output gain
            // Connect to masterGain which we already defined
            // No need for a separate mixerGain - use the masterGain we created earlier
            masterGain.gain.value = 0.8; // Set higher volume for impact
            
            // Create the stone movement and impact components (missing previously)
            const stoneNoise = context.createBufferSource();
            const stoneBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const stoneData = stoneBuffer.getChannelData(0);
            
            // Generate fantasy stone movement sounds
            for (let i = 0; i < stoneData.length; i++) {
                const progress = i / stoneData.length;
                // Stone movement texture
                stoneData[i] = (Math.random() * 2 - 1) * 0.2 * Math.exp(-progress * 3);
                
                // Add occasional stone impacts for fantasy gate atmosphere
                if (progress > 0.1 && progress < 0.4 && Math.random() > 0.995) {
                    const impactLength = Math.floor(context.sampleRate * 0.04);
                    if (i + impactLength < stoneData.length) {
                        for (let j = 0; j < impactLength; j++) {
                            stoneData[i + j] += (Math.random() * 2 - 1) * 0.5 * Math.exp(-j / (impactLength * 0.3));
                        }
                        i += impactLength - 1;
                    }
                }
            }
            
            stoneNoise.buffer = stoneBuffer;
            
            // Stone filter for magical resonance
            const stoneFilter = context.createBiquadFilter();
            stoneFilter.type = 'lowpass';
            stoneFilter.frequency.value = 800;
            stoneFilter.Q.value = 1.0;
            
            // Stone gain envelope
            const stoneGain = context.createGain();
            stoneGain.gain.setValueAtTime(0.3, context.currentTime);
            stoneGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.4);
            stoneGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
            
            // Create thud oscillators for fantasy impact sounds
            const thudOsc = context.createOscillator();
            thudOsc.type = 'sine';
            thudOsc.frequency.setValueAtTime(85, context.currentTime); // Low thud
            thudOsc.frequency.exponentialRampToValueAtTime(35, context.currentTime + 0.2); // Descending pitch
            
            const thudGain = context.createGain();
            thudGain.gain.setValueAtTime(0.4, context.currentTime);
            thudGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            
            const thudOsc2 = context.createOscillator();
            thudOsc2.type = 'triangle';
            thudOsc2.frequency.setValueAtTime(120, context.currentTime); // Higher harmonic
            thudOsc2.frequency.exponentialRampToValueAtTime(65, context.currentTime + 0.15);
            
            const thudGain2 = context.createGain();
            thudGain2.gain.setValueAtTime(0.2, context.currentTime);
            thudGain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
            
            // Connect all components
            stoneNoise.connect(stoneFilter);
            stoneFilter.connect(stoneGain);
            stoneGain.connect(convolver);
            stoneGain.connect(masterGain); // Direct path for clarity
            
            thudOsc.connect(thudGain);
            thudGain.connect(convolver);
            thudGain.connect(masterGain);
            
            thudOsc2.connect(thudGain2);
            thudGain2.connect(convolver);
            thudGain2.connect(mixerGain);
            
            dustNoise.connect(dustFilter);
            dustFilter.connect(dustGain);
            dustGain.connect(mixerGain);
            
            convolver.connect(mixerGain);
            mixerGain.connect(context.destination);
            
            // Play an initial "attention-getting" spike to ensure audio is heard
            const attentionSpike = context.createOscillator();
            attentionSpike.type = 'sine';
            attentionSpike.frequency.value = 300;
            
            const spikeGain = context.createGain();
            spikeGain.gain.setValueAtTime(0.05, context.currentTime);
            spikeGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.05);
            
            attentionSpike.connect(spikeGain);
            spikeGain.connect(mixerGain);
            attentionSpike.start();
            attentionSpike.stop(context.currentTime + 0.05);
            
            // Start all sound components with slight staggers for naturalness
            console.log("🎮🎮🎮 Starting all sound components for menu close");
            cardSource.start(context.currentTime);
            portalSweep.start(context.currentTime);
            portalHarmonic.start(context.currentTime);
            closingChime.start(context.currentTime);
            stoneNoise.start(context.currentTime);
            thudOsc.start(context.currentTime);
            thudOsc2.start(context.currentTime + 0.01); // Slight offset for richer sound
            dustNoise.start(context.currentTime + 0.02);
            
            // Stop and clean up with longer duration to account for the longer reverb
            setTimeout(() => {
                try {
                    cardSource.stop();
                    portalSweep.stop();
                    portalHarmonic.stop();
                    closingChime.stop();
                    stoneNoise.stop();
                    thudOsc.stop();
                    thudOsc2.stop();
                    dustNoise.stop();
                    
                    // CRITICAL: Reset the flag so the sound can be played again
                    ArcadeEntity12._menuClosePlaying = false;
                    console.log('🎮🎮🎮 ArcadeEntity12: Reset menu close sound flag');
                    
                    // Disconnect all gain nodes to stop any residual sound
                    cardGain.disconnect();
                    portalGain.disconnect();
                    chimeGain.disconnect();
                    stoneGain.disconnect();
                    thudGain.disconnect();
                    dustGain.disconnect();
                    masterGain.disconnect();
                    
                    // Remove from active contexts tracking
                    const index = ArcadeEntity12._activeAudioContexts.indexOf(context);
                    if (index !== -1) {
                        ArcadeEntity12._activeAudioContexts.splice(index, 1);
                        console.log('🎮🎮🎮 ArcadeEntity12: Removed menu close context from tracking array');
                    }
                    
                    // Close the context to ensure complete cleanup
                    context.close().then(() => {
                        console.log('🎮🎮🎮 ArcadeEntity12: Menu close sound context closed successfully');
                    }).catch(err => {
                        console.error('🎮🎮🎮 ArcadeEntity12: Error closing menu close sound context:', err);
                    });
                    
                    console.log('🎮🎮🎮 ArcadeEntity12: Successfully stopped and cleaned up menu close sound');
                } catch (stopErr) {
                    console.error("🎮🎮🎮 ArcadeEntity12: Error stopping sound components:", stopErr);
                    // CRITICAL: Still reset the flag even if cleanup fails to ensure it can be played again
                    ArcadeEntity12._menuClosePlaying = false;
                    console.log('🎮🎮🎮 ArcadeEntity12: Reset menu close flag after error');
                }
            }, 1200); // Longer duration to allow the full sound to play out
            
            debug(`ArcadeEntity12: Successfully played ancient temple door closing sound`);
            console.log("🎮 ArcadeEntity12: Successfully played temple door closing sound");
        } catch (err) {
            console.error("🎮🎮🎮 ArcadeEntity12: Error playing menu close sound:", err);
            debug(`ArcadeEntity12: Error playing menu close sound: ${err}`);
            
            // CRITICAL: Reset the flag if there's an error during sound generation
            // This ensures the sound can be played again even if it fails
            ArcadeEntity12._menuClosePlaying = false;
            console.log('🎮🎮🎮 ArcadeEntity12: Reset menu close flag after creation error');
        }
    }

    /**
     * Create a pulse effect for the glow
     */
    pulseGlow() {
        this.glowIntensity = this.maxGlowIntensity;
    }
    
    /**
     * Draw the arcade cabinet
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     */
    draw(ctx, screenX, screenY) {
        // Basic debug info - use debug instead of console.log to be consistent
        debug(`ArcadeEntity12: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity12: Using fallback rendering`);
            this.drawFallbackArcade(ctx, screenX, screenY);
            return;
        }
        
        ctx.save();
        
        // Apply glow effect with more intensity
        if (this.glowIntensity > 0) {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = this.glowIntensity * 2; // Double the glow intensity for more visibility
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Apply a subtle glow layer for additional effect
            if (this.isNearPlayer) {
                // Save original globalAlpha
                const originalAlpha = ctx.globalAlpha;
                
                // Draw a slightly larger glow layer
                const width = this.asset.width * this.scaleX;
                const height = this.asset.height * this.scaleY;
                const adjustedY = screenY - height * (1 - this.groundingFactor);
                
                // Add glow layers
                ctx.globalAlpha = 0.3 * (this.glowIntensity / this.maxGlowIntensity);
                ctx.drawImage(this.asset, 
                    screenX - width / 2 - 2, 
                    adjustedY - 2, 
                    width + 4, 
                    height + 4);
                
                // Restore original alpha
                ctx.globalAlpha = originalAlpha;
            }
        }
        
        // Draw the arcade cabinet image
        const width = this.asset.width * this.scaleX;
        const height = this.asset.height * this.scaleY;
        
        // Adjust Y position to account for grounding factor
        const adjustedY = screenY - height * (1 - this.groundingFactor);
        
        // Draw the image
        ctx.drawImage(this.asset, screenX - width / 2, adjustedY, width, height);
        
        // Draw entity hitbox for debugging
        if (window.DEBUG_HITBOXES) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - width/2, adjustedY, width, height);
            
            // Draw interaction radius
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.interactionRadius * 32, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw interaction prompt if player is nearby and prompt is visible
        if (this.isNearPlayer && this.interactionPromptAlpha > 0 && !this.gameSelectVisible) {
            debug(`ArcadeEntity12: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
            this.drawInteractionPrompt(ctx, screenX, adjustedY - 50);
        }
        
        ctx.restore();
    }
    
    /**
     * Draw a fallback arcade cabinet if the asset failed to load
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     */
    drawFallbackArcade(ctx, screenX, screenY) {
        debug(`ArcadeEntity12: Drawing fallback arcade at (${screenX}, ${screenY})`);
        ctx.save();
        
        // Apply glow effect if near player
        if (this.glowIntensity > 0) {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = this.glowIntensity;
        }
        
        // Define dimensions of the fallback arcade cabinet
        const width = 80;
        const height = 160;
        
        // Adjust Y position to account for grounding factor (ensures it sits properly on the ground)
        const adjustedY = screenY - height * (1 - this.groundingFactor);
        
        // --- CABINET BODY ---
        ctx.fillStyle = '#222222'; 
        ctx.fillRect(screenX - width/2, adjustedY, width, height);
        
        // Cabinet top
        ctx.fillStyle = '#333333';
        ctx.fillRect(screenX - width/2 - 5, adjustedY - 10, width + 10, 15);
        
        // --- SCREEN ---
        // Screen background
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX - width/2 + 10, adjustedY + 10, width - 20, 40);
        
        // Screen content (game screen) with pulsing glow
        ctx.fillStyle = `rgba(0, 0, ${100 + Math.floor(this.screenGlow * 155)}, 0.8)`;
        ctx.fillRect(screenX - width/2 + 12, adjustedY + 12, width - 24, 36);
        
        // Add simple game graphics on screen
        // Enemy characters
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX - 30, adjustedY + 25, 8, 8);
        ctx.fillRect(screenX - 15, adjustedY + 25, 8, 8);
        ctx.fillRect(screenX + 0, adjustedY + 25, 8, 8);
        ctx.fillRect(screenX + 15, adjustedY + 25, 8, 8);
        
        // Player character
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(screenX - 5, adjustedY + 40, 10, 10);
        
        // --- CONTROLS ---
        // Control panel
        ctx.fillStyle = '#444444';
        ctx.fillRect(screenX - width/2 + 10, adjustedY + 60, width - 20, 30);
        
        // Joystick
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX - 15, adjustedY + 75, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(screenX - 15, adjustedY + 75, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Buttons
        const buttonColors = ['#FF0000', '#FFFF00', '#00FF00', '#0000FF'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = buttonColors[i];
            ctx.beginPath();
            ctx.arc(screenX + 15, adjustedY + 65 + i * 7, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // --- DECORATIVE ELEMENTS ---
        // Coin slot
        ctx.fillStyle = '#666666';
        ctx.fillRect(screenX - 10, adjustedY + 100, 20, 5);
        
        // Marquee at top
        ctx.fillStyle = '#9900FF';
        ctx.fillRect(screenX - width/2 + 5, adjustedY + 5, width - 10, 10);
        
        // Text on marquee
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ARCADE', screenX, adjustedY + 12);
        
        // Add neon glow effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10 + this.glowIntensity;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        
        // Glow outline
        ctx.beginPath();
        ctx.rect(screenX - width/2, adjustedY, width, height);
        ctx.stroke();
        
        // Screen glow outline
        ctx.beginPath();
        ctx.rect(screenX - width/2 + 10, adjustedY + 10, width - 20, 40);
        ctx.stroke();
        
        // Draw entity position marker for debugging
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(screenX - 3, screenY - 3, 6, 6);
        
        // Draw hitbox for debugging
        if (window.DEBUG_HITBOXES) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - width/2, adjustedY, width, height);
            
            // Draw interaction radius
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.interactionRadius * 32, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw the base point for debugging
        debug(`ArcadeEntity12: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Play Games';
        const textWidth = ctx.measureText(text).width;
        
        // Create dimensions for prompt window
        const padding = 48;
        const promptWidth = textWidth + (padding * .4);
        const promptHeight = 60;
        const promptX = x - promptWidth/2;
        const promptY = y - 30;
        
        // Create gradient background instead of solid color
        const gradient = ctx.createLinearGradient(
            promptX, 
            promptY, 
            promptX, 
            promptY + promptHeight
        );
        gradient.addColorStop(0, `rgba(0, 30, 40, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(0.5, `rgba(0, 60, 80, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(1, `rgba(0, 30, 40, ${this.interactionPromptAlpha * 0.9})`);
        
        // Draw background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
        
        // Draw border with glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15 * (this.glowIntensity > 0 ? this.glowIntensity : 1);
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);
        ctx.shadowBlur = 0;
        
        // Draw main text with stronger visibility
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.interactionPromptAlpha + 0.2)})`;
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator like in JukeboxEntity
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Draw game selection interface
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    /**
     * Clean up any click event handlers when the entity is destroyed
     * This prevents memory leaks and duplicate handlers
     */
    destroy() {
        debug(`ArcadeEntity12: Destroying entity and cleaning up event handlers`);
        
        // First call the parent destroy method
        super.destroy();
        
        // Remove the overlay canvas if it exists
        const overlayCanvas = document.getElementById('arcadeMenuOverlay');
        if (overlayCanvas) {
            // Remove event listeners
            overlayCanvas.removeEventListener('click', overlayCanvas._clickHandler);
            overlayCanvas.parentElement.removeChild(overlayCanvas);
        }
        
        // Clean up other resources as needed
        this._lastClickTime = 0;
        this._openedUrls = {};
    }
    
    /**
     * Draw game selection interface
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawGameSelectionInterface(ctx) {
        debug(`ArcadeEntity12: Drawing game selection interface`);
        
        // First identify the main game canvas - try different approaches
        let mainCanvas = null;
        
        // Approach 1: Try to find by ID
        mainCanvas = document.getElementById('gameCanvas');
        
        // Approach 2: If not found, try to find by class or tag
        if (!mainCanvas) {
            console.log("🎮 Finding game canvas by alternative methods");
            // Look for canvas elements, try to find the game canvas
            const canvases = document.getElementsByTagName('canvas');
            if (canvases.length > 0) {
                // Use the first canvas (most likely the game canvas)
                mainCanvas = canvases[0];
                console.log(`🎮 Found canvas by tag: ${mainCanvas.width}x${mainCanvas.height}`);
            }
        }
        
        // Approach 3: If still not found, use the context's canvas
        if (!mainCanvas && ctx && ctx.canvas) {
            mainCanvas = ctx.canvas;
            console.log(`🎮 Using context's canvas: ${mainCanvas.width}x${mainCanvas.height}`);
        }
        
        const width = mainCanvas.width;
        const height = mainCanvas.height;
        
        // Ensure we have dimensions
        if (!width || !height) {
            console.error("🎮 Canvas dimensions invalid!");
            return;
        }
        
        console.log(`🎮 Main canvas dimensions: ${width}x${height}`);
        
        // Determine container for overlay
        const container = mainCanvas.parentElement || document.body;
        
        // Use a separate canvas overlay for the game selection menu
        // This ensures it's drawn on top of everything
        let overlayCanvas = document.getElementById('arcadeMenuOverlay');
        let overlayCtx;
        
        if (!overlayCanvas) {
            // Create overlay canvas if it doesn't exist
            console.log("🎮 Creating overlay canvas for arcade menu");
            const newOverlay = document.createElement('canvas');
            newOverlay.id = 'arcadeMenuOverlay';
            newOverlay.width = width;
            newOverlay.height = height;
            
            // Position the overlay exactly over the game canvas
            newOverlay.style.position = 'absolute';
            
            // Get the precise position of the main canvas
            const mainRect = mainCanvas.getBoundingClientRect();
            newOverlay.style.top = mainRect.top + 'px';
            newOverlay.style.left = mainRect.left + 'px';
            newOverlay.style.width = mainRect.width + 'px';
            newOverlay.style.height = mainRect.height + 'px';
            
            newOverlay.style.zIndex = '9999'; // Very high z-index to ensure it's on top
            newOverlay.style.pointerEvents = 'auto'; // Enable pointer events for clickable areas
            
            // Add to the document body
            document.body.appendChild(newOverlay);
            
            // Store a reference to the current ArcadeEntity12 instance
            const self = this;
            
            // Create a named click handler function that stops propagation
            newOverlay._clickHandler = function(event) {
                console.log(`🎮 Overlay canvas clicked at ${event.clientX}, ${event.clientY}`);
                // Stop event propagation to prevent duplicate handling
                event.preventDefault();
                event.stopPropagation();
                
                // Use the instance method to handle the click
                self.handleMenuClick(event.clientX, event.clientY);
            };
            
            // Add click event listener to the canvas overlay using the stored handler
            newOverlay.addEventListener('click', newOverlay._clickHandler, true);
            
            // Mark that this canvas has a click listener
            newOverlay._hasClickListener = true;
            
            overlayCtx = newOverlay.getContext('2d');
            console.log(`🎮 Created overlay canvas: ${newOverlay.width}x${newOverlay.height}`);
        } else {
            // Use existing overlay
            overlayCtx = overlayCanvas.getContext('2d');
            // Clear previous frame
            overlayCtx.clearRect(0, 0, width, height);
            
            // Skip adding another click listener - the existing canvas should already have one
            // If it somehow got removed, we'll just add it again with proper tracking
            if (!overlayCanvas._hasClickListener) {
                const self = this;
                console.log(`🎮 Adding missing click listener to existing overlay canvas`);
                // Create a named click handler function that stops propagation
                overlayCanvas._clickHandler = function(event) {
                    console.log(`🎮 Existing overlay canvas clicked at ${event.clientX}, ${event.clientY}`);
                    // Stop event propagation to prevent duplicate handling
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Use the instance method to handle the click
                    self.handleMenuClick(event.clientX, event.clientY);
                };
                
                // Add click event listener to the canvas overlay using the stored handler
                overlayCanvas.addEventListener('click', overlayCanvas._clickHandler, true);
                overlayCanvas._hasClickListener = true;
            }
        }
        
        // Use the overlay context for drawing
        overlayCtx.save();
        
        // Draw semi-transparent background overlay to dim the game
        overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        overlayCtx.fillRect(0, 0, width, height);
        
        // Draw arcade cabinet header with neon glow effect
        const headerGradient = overlayCtx.createLinearGradient(width/2 - 150, height * 0.1, width/2 + 150, height * 0.1);
        headerGradient.addColorStop(0, '#00FFFF');
        headerGradient.addColorStop(0.5, '#FF00FF');
        headerGradient.addColorStop(1, '#00FFFF');
        
        overlayCtx.font = 'bold 40px "Courier New", monospace';
        overlayCtx.textAlign = 'center';
        overlayCtx.textBaseline = 'middle';
        
        // Add neon glow effect to header
        overlayCtx.shadowColor = '#00FFFF';
        overlayCtx.shadowBlur = 20;
        overlayCtx.fillStyle = headerGradient;
        overlayCtx.fillText('ARCADE GAMES', width/2, height * 0.09); // Moved header text higher
        
        // Reset shadow for other elements
        overlayCtx.shadowBlur = 0;
        
        // Draw game selection menu
        const menuWidth = width * 0.7;
        const menuHeight = height * 0.6; // Reduced height slightly
        const menuX = width/2 - menuWidth/2;
        const menuY = height * 0.15; // Moved menu higher
        
        // Draw menu background with cyberpunk/retro arcade style
        const menuBgGradient = overlayCtx.createLinearGradient(menuX, menuY, menuX, menuY + menuHeight);
        menuBgGradient.addColorStop(0, 'rgba(20, 0, 40, 0.9)');
        menuBgGradient.addColorStop(0.5, 'rgba(40, 10, 60, 0.9)');
        menuBgGradient.addColorStop(1, 'rgba(20, 0, 40, 0.9)');
        
        overlayCtx.fillStyle = menuBgGradient;
        overlayCtx.fillRect(menuX, menuY, menuWidth, menuHeight);
        
        // Draw menu border with neon effect
        const borderGradient = overlayCtx.createLinearGradient(menuX, menuY, menuX + menuWidth, menuY + menuHeight);
        borderGradient.addColorStop(0, '#00FFFF');
        borderGradient.addColorStop(0.5, '#FF00FF');
        borderGradient.addColorStop(1, '#00FFFF');
        
        overlayCtx.strokeStyle = borderGradient;
        overlayCtx.lineWidth = 3;
        overlayCtx.strokeRect(menuX, menuY, menuWidth, menuHeight);
        
        // Add inner border for extra retro feel
        overlayCtx.strokeStyle = '#0088FF';
        overlayCtx.lineWidth = 1;
        overlayCtx.strokeRect(menuX + 5, menuY + 5, menuWidth - 10, menuHeight - 10);
        
        // Make sure we have games to display
        if (this.games && this.games.length > 0) {
            // Since we're only showing Zans Cards, we can use a larger image with 4:3 aspect ratio
            const padding = 40; // Padding around the image
            
            // Calculate dimensions for a 4:3 aspect ratio image that fills the menu area
            let gameImageWidth, gameImageHeight;
            
            // Calculate max available space within the menu
            const maxWidth = menuWidth - (padding * 2);
            const maxHeight = menuHeight * 0.7; // Use 70% of menu height to leave room for description
            
            // Determine image size based on 4:3 aspect ratio
            if (maxWidth / 4 * 3 <= maxHeight) {
                // Width is the limiting factor
                gameImageWidth = maxWidth;
                gameImageHeight = maxWidth * (3/4); // 4:3 ratio
            } else {
                // Height is the limiting factor
                gameImageHeight = maxHeight;
                gameImageWidth = maxHeight * (4/3); // 4:3 ratio
            }
            
            // Center the image in the menu
            const imageSpacing = (menuHeight - gameImageHeight) / 3; // Space above and below image
            const startIdx = 0; // Only showing the first game
            const endIdx = 1; // Only showing one game
            
            // Draw selected game highlight with pulse effect
            const selectedOffset = (this.selectedGameIndex - startIdx);
            const highlightY = menuY + imageSpacing + selectedOffset * (gameImageHeight + imageSpacing);
            
            // Create time-based pulse effect
            const time = new Date().getTime() / 1000;
            const pulseSize = 3 + Math.sin(time * 5) * 2;
            
            // Draw game entries (images with descriptions)
            for (let i = startIdx; i < endIdx; i++) {
                const game = this.games[i];
                const isSelected = i === this.selectedGameIndex;
                const relativeIndex = i - startIdx;
                
                // Calculate image position
                const imageX = menuX + (menuWidth - gameImageWidth) / 2;
                const imageY = menuY + imageSpacing + relativeIndex * (gameImageHeight + imageSpacing);
                
                // Draw selection highlight for the selected game
                if (isSelected) {
                    // Draw blinking highlight border
                    overlayCtx.strokeStyle = '#00FFFF';
                    overlayCtx.lineWidth = pulseSize;
                    overlayCtx.shadowColor = '#00FFFF';
                    overlayCtx.shadowBlur = 15;
                    overlayCtx.strokeRect(imageX - 10, imageY - 10, gameImageWidth + 20, gameImageHeight + 20);
                    overlayCtx.shadowBlur = 0;
                    
                    // Draw selection indicator (triangle/arrow)
                    overlayCtx.fillStyle = '#00FFFF';
                    overlayCtx.shadowColor = '#00FFFF';
                    overlayCtx.shadowBlur = 10;
                    overlayCtx.beginPath();
                    overlayCtx.moveTo(imageX - 25, imageY + gameImageHeight/2);
                    overlayCtx.lineTo(imageX - 15, imageY + gameImageHeight/2 - 10);
                    overlayCtx.lineTo(imageX - 15, imageY + gameImageHeight/2 + 10);
                    overlayCtx.fill();
                    overlayCtx.shadowBlur = 0;
                }
                
                // Draw game image if available
                if (game.image) {
                    // Draw image with slight tinting for non-selected games
                    if (!isSelected) {
                        overlayCtx.globalAlpha = 0.7;
                    }
                    
                    // Draw the game image at the calculated position
                    overlayCtx.drawImage(game.image, imageX, imageY, gameImageWidth, gameImageHeight);
                    
                    // Reset opacity
                    overlayCtx.globalAlpha = 1.0;
                    
                    // Skip drawing the title as it's already visible in the game image
                    
                    // Calculate position to center the prompt between the image bottom and menu bottom
                    const spaceBelow = (menuY + menuHeight) - (imageY + gameImageHeight);
                    const promptY = imageY + gameImageHeight + (spaceBelow / 2) - 10; // Centered with slight adjustment
                    
                    // Set center position for prompt horizontally
                    const promptX = imageX + gameImageWidth/2;
                    
                    // Skip drawing the description text to avoid cluttering the interface
                    
                    // Initialize clickable areas array if it doesn't exist
                    if (!this.clickableAreas) this.clickableAreas = [];
                    
                    
                    // Draw a "Play Game" prompt with button-like appearance
                    overlayCtx.font = 'bold 20px "Arial", sans-serif';
                    overlayCtx.textAlign = 'center';
                    overlayCtx.shadowColor = '#00FFFF';
                    overlayCtx.shadowBlur = 12;
                    overlayCtx.fillStyle = '#00FFFF';
                    
                    // Create time-based pulse effect for the button
                    const time = new Date().getTime() / 1000;
                    const pulseIntensity = 0.7 + Math.sin(time * 3) * 0.3;
                    overlayCtx.globalAlpha = pulseIntensity;
                    
                    // Draw the play button text
                    overlayCtx.fillText('PRESS ENTER TO PLAY', promptX, promptY);
                    overlayCtx.globalAlpha = 1.0;
                    
                    // Reset shadow effect
                    overlayCtx.shadowBlur = 0;
                    
                    // Reset shadows
                    overlayCtx.shadowColor = 'transparent';
                    overlayCtx.shadowBlur = 0;
                    overlayCtx.shadowOffsetX = 0;
                    overlayCtx.shadowOffsetY = 0;
                    
                    // Reset text alignment for other elements
                    overlayCtx.textAlign = 'center';
                } else {
                    // Fallback if image not loaded - draw title
                    const titleBgHeight = 40;
                    
                    // Draw title background
                    overlayCtx.fillStyle = 'rgba(0, 20, 40, 0.8)';
                    overlayCtx.fillRect(imageX, imageY, gameImageWidth, titleBgHeight);
                    
                    // Draw title text
                    overlayCtx.font = 'bold 20px "Courier New", monospace';
                    overlayCtx.fillStyle = isSelected ? '#FFFFFF' : '#AAAAAA';
                    overlayCtx.textAlign = 'center';
                    overlayCtx.textBaseline = 'middle';
                    overlayCtx.fillText(game.title, imageX + gameImageWidth/2, imageY + titleBgHeight/2);
                    
                    // Draw description below
                    overlayCtx.font = '16px Arial, sans-serif';
                    overlayCtx.fillStyle = isSelected ? '#CCFFFF' : '#888888';
                    overlayCtx.fillText(game.description, imageX + gameImageWidth/2, imageY + titleBgHeight + 20);
                }
            }
            
            // Draw scroll indicators if there are more games than visible
            if (startIdx > 0) {
                // Draw up arrow
                overlayCtx.fillStyle = '#00FFFF';
                overlayCtx.beginPath();
                overlayCtx.moveTo(menuX + menuWidth/2 - 10, menuY + 10);
                overlayCtx.lineTo(menuX + menuWidth/2 + 10, menuY + 10);
                overlayCtx.lineTo(menuX + menuWidth/2, menuY);
                overlayCtx.fill();
            }
            
            if (endIdx < this.games.length) {
                // Draw down arrow
                overlayCtx.fillStyle = '#00FFFF';
                overlayCtx.beginPath();
                overlayCtx.moveTo(menuX + menuWidth/2 - 10, menuY + menuHeight - 10);
                overlayCtx.lineTo(menuX + menuWidth/2 + 10, menuY + menuHeight - 10);
                overlayCtx.lineTo(menuX + menuWidth/2, menuY + menuHeight);
                overlayCtx.fill();
            }
            
            // Draw URL and creator attribution at the bottom
            const selectedGame = this.games[this.selectedGameIndex];
            const detailsY = menuY + menuHeight - 15;
            
            // URL display
            overlayCtx.font = '14px Arial, sans-serif';
            overlayCtx.fillStyle = '#888888';
            overlayCtx.textAlign = 'center';
            
            // Truncate URL if too long
            let displayUrl = selectedGame.url;
            if (displayUrl.length > 40) {
                displayUrl = displayUrl.substring(0, 37) + '...';
            }
            
            overlayCtx.fillText(displayUrl, menuX + menuWidth/2, detailsY);
        } else {
            // No games found message
            overlayCtx.fillStyle = '#FF0000';
            overlayCtx.textAlign = 'center';
            overlayCtx.fillText('No games available!', width/2, menuY + menuHeight/2);
        }
        
        // Draw instructions and creator attribution at bottom
        overlayCtx.font = '18px Arial, sans-serif';
        overlayCtx.textAlign = 'center';
        overlayCtx.fillStyle = '#FFFFFF';
        
        // Draw controls footer panel
        const footerHeight = 40;
        const footerY = height * 0.86; // Move up to make space for creator attribution
        
        overlayCtx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        overlayCtx.fillRect(width/2 - 300, footerY, 600, footerHeight);
        
        // Draw footer border
        overlayCtx.strokeStyle = '#0088FF';
        overlayCtx.lineWidth = 1;
        overlayCtx.strokeRect(width/2 - 300, footerY, 600, footerHeight);
        
        // Draw simplified controls text (no navigation needed for single game)
        overlayCtx.fillStyle = '#FFFFFF';
        overlayCtx.fillText('ENTER: Launch Game | ESC: Close', width/2, footerY + footerHeight/2);
        
        // Draw creator attribution panel
        const creatorFooterY = height * 0.91; // Position below controls
        
        overlayCtx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        overlayCtx.fillRect(width/2 - 300, creatorFooterY, 600, footerHeight);
        
        // Draw creator footer border
        overlayCtx.strokeStyle = '#FF00FF'; // Different color for creator section
        overlayCtx.lineWidth = 1;
        overlayCtx.strokeRect(width/2 - 300, creatorFooterY, 600, footerHeight);
        
        // Instead of creating DOM elements, add a clickable area to the entity's internal tracking
        if (this.gameSelectVisible) {
            // Calculate the position and size of the Twitter handle
            const textWidth = overlayCtx.measureText('@LBacaj').width;
            const twitterHandleX = width/2 - 40;
            const twitterHandleY = creatorFooterY + footerHeight/2 - 20; // Adjusted to be higher for better clickability
            const twitterHandleWidth = textWidth * 2; // Make it wider
            const twitterHandleHeight = 50; // Make it taller
            
            // Add it to the clickable areas array so the entity's click handler will detect it
            this.clickableAreas.push({
                type: 'twitter',
                x: twitterHandleX,
                y: twitterHandleY,
                width: twitterHandleWidth,
                height: twitterHandleHeight,
                url: 'https://x.com/LBacaj'
            });
            
            console.log('Added ArcadeEntity12 Twitter clickable area:', 
                        `x:${twitterHandleX}, y:${twitterHandleY}, w:${twitterHandleWidth}, h:${twitterHandleHeight}`);
            
            // Set up cursor behavior for clickable areas
            if (overlayCanvas) {
                // Default cursor for the canvas
                overlayCanvas.style.cursor = 'default';
                
                // Add mousemove listener to change cursor on hover
                overlayCanvas.addEventListener('mousemove', (e) => {
                    const rect = overlayCanvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Check if cursor is over a clickable area
                    let overClickable = false;
                    
                    // Only check areas if the menu is visible
                    if (this.gameSelectVisible && this.clickableAreas && this.clickableAreas.length > 0) {
                        for (const area of this.clickableAreas) {
                            if (x >= area.x && x <= area.x + area.width && 
                                y >= area.y && y <= area.y + area.height) {
                                overClickable = true;
                                break;
                            }
                        }
                    }
                    
                    // Set appropriate cursor
                    overlayCanvas.style.cursor = overClickable ? 'pointer' : 'default';
                });
            }
            
            // Debug visualization - uncomment for debugging if needed
            /*
            overlayCtx.save();
            overlayCtx.fillStyle = 'rgba(255,0,0,0.2)';
            overlayCtx.fillRect(twitterHandleX, twitterHandleY, twitterHandleWidth, twitterHandleHeight);
            overlayCtx.strokeStyle = 'red';
            overlayCtx.strokeRect(twitterHandleX, twitterHandleY, twitterHandleWidth, twitterHandleHeight);
            overlayCtx.restore();
            */
        }
        
        // Draw creator text with special styling
        overlayCtx.fillStyle = '#FFFFFF';
        overlayCtx.textAlign = 'right';
        overlayCtx.fillText('Created by', width/2 - 20, creatorFooterY + footerHeight/2);
        
        // Twitter handle with special styling to indicate it's clickable
        overlayCtx.fillStyle = '#1DA1F2'; // Twitter blue
        overlayCtx.font = 'bold 18px Arial, sans-serif';
        overlayCtx.textAlign = 'left';
        overlayCtx.fillText('@LBacaj', width/2 - 0, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@LBacaj').width;
        
        // Underline to show it's clickable - using measured width
        overlayCtx.fillRect(width/2 - 0, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Clean up clickable areas when the menu is closed
        if (!this.gameSelectVisible) {
            // Filter out any Twitter clickable areas when the menu is closed
            this.clickableAreas = this.clickableAreas.filter(area => area.type !== 'twitter');
            console.log('Removed ArcadeEntity12 Twitter clickable areas');
        }
    }
    
    /**
     * Try loading game image from alternative paths
     * @param {object} game - Game object to try alternative paths for
     * @param {number} index - Index of the game in the games array
     */
    tryAlternativeGameImagePaths(game, index) {
        console.log(`🎮 Attempting to load game image from alternative paths for ${game.title}`);
        
        let pathIndex = 0;
        const img = new Image();
        
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 All alternative paths failed for ${game.title}, creating fallback`);
                this.createGameImage(game, index);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            const resolvedAltPath = getAssetPath(altPath);
            console.log(`🎮 Trying alternative path ${pathIndex + 1}/${game.alternativeImagePaths.length}: ${resolvedAltPath}`);
            
            // Set up new handlers for this attempt
            img.onload = () => {
                console.log(`🎮 Successfully loaded game image from alternative path: ${resolvedAltPath}`);
                game.image = img;
                // Check if all images are loaded
                if (this.games.every(g => g.image)) {
                    this.gameImagesLoaded = true;
                    console.log('🎮 All game images loaded successfully!');
                }
            };
            
            img.onerror = () => {
                console.warn(`🎮 Failed to load from alternative path: ${resolvedAltPath}`);
                pathIndex++;
                setTimeout(tryNextPath, 100); // Try next path with a small delay
            };
            
            // Try this path
            img.src = resolvedAltPath;
        };
        
        // Start trying alternative paths
        tryNextPath();
    }

    /**
     * Handle clicks on the menu overlay
     * @param {number} clientX - X position of the click in client coordinates
     * @param {number} clientY - Y position of the click in client coordinates
     */
    handleMenuClick(clientX, clientY) {
        debug(`ArcadeEntity12: Checking menu click at ${clientX}, ${clientY}`);
        
        // Skip if menu not visible
        if (!this.gameSelectVisible) return;
        
        // Basic debounce check - but we'll be more permissive to ensure links can be clicked
        const now = Date.now();
        // Initialize if not set
        if (!this._lastClickTime) {
            this._lastClickTime = 0;
        }
        
        // Only use a 200ms threshold - just enough to block true duplicates
        if ((now - this._lastClickTime) < 200) {
            debug(`ArcadeEntity12: Ignoring click - too soon after previous click`);
            return;
        }
        
        // Immediately set the last click time
        this._lastClickTime = now;
        
        // Check against stored clickable areas
        if (this.clickableAreas && this.clickableAreas.length > 0) {
            // Get canvas position for coordinate conversion
            const canvas = document.getElementById('arcadeMenuOverlay');
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            
            // Convert client coordinates to canvas coordinates
            const canvasX = clientX - rect.left;
            const canvasY = clientY - rect.top;
            
            debug(`ArcadeEntity12: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity12: Clicked on area: ${area.type}`);
                    
                    // Handle different types of clickable areas
                    switch(area.type) {
                        case 'twitter':
                            // Open the Twitter URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity12: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity12: Preventing duplicate open of Twitter URL: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity12: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity12: Preventing duplicate open of URL: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
        

    }
    
    /**
     * Play fantasy RPG/trading card game themed sound effects when player enters interaction range
     * Creates an atmosphere reminiscent of magical worlds, card games, and epic adventures
     */
    playProximitySound() {
        console.log('🎮🎮🎮 ArcadeEntity12: Playing fantasy RPG/TCG proximity sound - independent context');
        
        try {
            // Create a new audio context for each sound playback - this prevents residual tones
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for cleanup later
            if (!ArcadeEntity12._activeAudioContexts) {
                ArcadeEntity12._activeAudioContexts = [];
            }
            ArcadeEntity12._activeAudioContexts.push(audioContext);
            console.log('🎮🎮🎮 ArcadeEntity12: Added context to tracking array, total:', ArcadeEntity12._activeAudioContexts.length);
            
            // Resume context if suspended
            if (audioContext.state === 'suspended') {
                console.log("ArcadeEntity12: Resuming suspended audio context for proximity sound");
                audioContext.resume();
            }
            
            // Stop any existing arcade proximity sounds to prevent overlap
            // This uses a global sound manager approach
            if (window.currentArcadeSound) {
                console.log('ArcadeEntity12: Stopping previous arcade sound');
                try {
                    // Check if the previous sound has a stop method
                    if (window.currentArcadeSound.stop) {
                        window.currentArcadeSound.stop();
                    }
                    // Also check if it has disconnect methods for any audio nodes
                    if (window.currentArcadeSound.disconnect) {
                        window.currentArcadeSound.disconnect();
                    }
                    // If there are specific cleanup methods defined
                    if (window.currentArcadeSound.cleanup) {
                        window.currentArcadeSound.cleanup();
                    }
                } catch (err) {
                    console.error('ArcadeEntity12: Error stopping previous sound:', err);
                }
                // Clear the reference
                window.currentArcadeSound = null;
            }
            // IMPORTANT: Use the global audio context instead of creating a new one
            // This ensures consistent behavior and avoids context redeclaration
            console.log('ArcadeEntity12: Using global AudioContext for fantasy ambience, state:', audioContext.state);
            
            // Double-check if we need to handle audio context resume for autoplay policy
            if (audioContext.state === 'suspended') {
                console.log('🎮🎮🎮 ArcadeEntity12: AudioContext is still suspended, attempting to resume again');
                // Return early and create a promise chain to ensure audio plays only after context resumes
                return audioContext.resume().then(() => {
                    console.log('🎮🎮🎮 ArcadeEntity12: AudioContext resumed successfully');
                    // Call this method again after context is resumed to ensure proper sound generation
                    this.playProximitySound.call(this);
                    return; // Prevent continuing with the current execution
                }).catch(err => {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error resuming AudioContext:', err);
                });
            }
            
            // Create a master gain node for overall volume control
            const masterGain = audioContext.createGain();
            masterGain.gain.value = 0.45; // Moderate volume for the ambient effect
            masterGain.connect(audioContext.destination);
            
            // Create a convolver for fantasy hall reverb
            const convolver = audioContext.createConvolver();
            const convolverBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 2.5, audioContext.sampleRate);
            
            // Create reverb impulse response for fantasy hall-like space
            for (let channel = 0; channel < 2; channel++) {
                const data = convolverBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    // Create open, airy reverb characteristic of grand fantasy halls
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioContext.sampleRate * 0.7)) * 0.4;
                }
            }
            convolver.buffer = convolverBuffer;
            
            // Reverb gain control
            const reverbGain = audioContext.createGain();
            reverbGain.gain.value = 0.5; // Moderate reverb for fantasy ambience
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            
            // 1. Mystical ambient pad (foundation layer)
            const ambientOsc1 = audioContext.createOscillator();
            ambientOsc1.type = 'sine'; // Soft sine for gentle foundation
            ambientOsc1.frequency.setValueAtTime(220, audioContext.currentTime); // A3 - gentle base tone
            
            const ambientOsc2 = audioContext.createOscillator();
            ambientOsc2.type = 'sine';
            ambientOsc2.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4 - creates a major chord
            
            // Ambient filter - soft and airy
            const ambientFilter = audioContext.createBiquadFilter();
            ambientFilter.type = 'lowpass';
            ambientFilter.frequency.setValueAtTime(1200, audioContext.currentTime);
            ambientFilter.Q.value = 1.0; // Slightly resonant
            
            // Ambient modulation - gentle shimmer effect
            const ambientLFO = audioContext.createOscillator();
            ambientLFO.type = 'triangle';
            ambientLFO.frequency.value = 0.3; // Slow, gentle modulation
            
            const ambientLFOGain = audioContext.createGain();
            ambientLFOGain.gain.value = 10; // Amount of ambient modulation
            
            // Ambient gain envelope
            const ambientGain = audioContext.createGain();
            ambientGain.gain.setValueAtTime(0, audioContext.currentTime);
            ambientGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.5); // Gentle fade in
            
            // Connect ambient components
            ambientLFO.connect(ambientLFOGain);
            ambientLFOGain.connect(ambientFilter.frequency);
            ambientOsc1.connect(ambientFilter);
            ambientOsc2.connect(ambientFilter);
            ambientFilter.connect(ambientGain);
            ambientGain.connect(masterGain);
            ambientGain.connect(convolver);
            
            // 2. Card shuffling/dealing sounds
            const cardBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.5, audioContext.sampleRate);
            const cardData = cardBuffer.getChannelData(0);
            
            // Generate card shuffling/dealing sounds
            for (let i = 0; i < cardData.length; i++) {
                const t = i / audioContext.sampleRate;
                const progress = i / cardData.length;
                
                // Base noise component for the shuffling
                let noise = (Math.random() * 2 - 1) * 0.05;
                
                // Add card shuffling and dealing sounds
                if (progress < 0.4 && Math.random() < 0.3) {
                    // Shuffling sounds - quick bursts of noise
                    noise *= 3 * (0.1 + Math.random() * 0.3);
                } else if (progress > 0.6 && progress < 0.9 && Math.random() < 0.05) {
                    // Card placement/dealing sounds - sharper attacks
                    const cardLength = Math.floor(audioContext.sampleRate * 0.08);
                    if (i + cardLength < cardData.length) {
                        for (let j = 0; j < cardLength; j++) {
                            const phase = j / cardLength;
                            // Quick attack, medium decay envelope
                            const envelope = phase < 0.1 ? phase * 10 : Math.exp(-(phase - 0.1) * 5);
                            // Card placement sound
                            if (i + j < cardData.length) {
                                cardData[i + j] = (Math.random() * 2 - 1) * envelope * 0.3;
                            }
                        }
                        i += cardLength - 1; // Skip ahead
                    }
                } else {
                    // Background texture
                    cardData[i] = noise * (0.3 + 0.4 * Math.sin(t * 0.5));
                }
            }
            
            const cardSource = audioContext.createBufferSource();
            cardSource.buffer = cardBuffer;
            
            // Apply filtering to the card sounds
            const cardFilter = audioContext.createBiquadFilter();
            cardFilter.type = 'bandpass';
            cardFilter.frequency.value = 3000; // Focus on the crisp shuffling frequencies
            cardFilter.Q.value = 0.7;
            
            const cardGain = audioContext.createGain();
            cardGain.gain.setValueAtTime(0, audioContext.currentTime);
            cardGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.3);
            
            // Connect card sounds
            cardSource.connect(cardFilter);
            cardFilter.connect(cardGain);
            cardGain.connect(masterGain); // Connect to masterGain since there's no mixerGain
            
            // 3. Magical spell effect tones
            const spellBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.8, audioContext.sampleRate);
            const spellData = spellBuffer.getChannelData(0);
            
            // Create magical spell activation sounds
            for (let i = 0; i < spellData.length; i++) {
                const t = i / audioContext.sampleRate;
                const progress = i / spellData.length;
                
                // Random magical chime/tone events
                if (Math.random() < 0.002) {
                    const chimeLength = Math.floor(audioContext.sampleRate * (0.3 + Math.random() * 0.4));
                    const noteType = Math.floor(Math.random() * 5); // Different magical note types
                    
                    if (i + chimeLength < spellData.length) {
                        // Pick a note from a pentatonic scale for fantasy feel
                        const notes = [330, 392, 440, 494, 587]; // E4, G4, A4, B4, D5 (pentatonic)
                        const baseNote = notes[noteType];
                        
                        for (let j = 0; j < chimeLength; j++) {
                            const phase = j / chimeLength;
                            // Bell-like envelope
                            const envelope = Math.sin(Math.PI * phase) * Math.exp(-phase * 3);
                            
                            // Magical tone with harmonics
                            const tone = Math.sin(2 * Math.PI * baseNote * j / audioContext.sampleRate) * 0.4 +
                                       Math.sin(2 * Math.PI * baseNote * 2 * j / audioContext.sampleRate) * 0.2 +
                                       Math.sin(2 * Math.PI * baseNote * 3 * j / audioContext.sampleRate) * 0.1;
                            
                            // Add magical shimmer/glitter effect
                            const shimmer = Math.sin(2 * Math.PI * (baseNote * 4 + Math.sin(j * 0.01) * 20) * j / audioContext.sampleRate) * 0.05;
                            
                            // Apply envelope and add to existing data
                            if (i + j < spellData.length) {
                                spellData[i + j] = (tone + shimmer) * envelope * 0.6;
                            }
                        }
                        
                        i += chimeLength - 1; // Skip ahead
                    }
                } else {
                    // Very subtle magical background
                    spellData[i] = Math.sin(2 * Math.PI * 587 * t) * 0.01 * Math.sin(Math.PI * progress);
                }
            }
            
            const spellSource = audioContext.createBufferSource();
            spellSource.buffer = spellBuffer;
            
            // Apply filtering to the spell sounds
            const spellFilter = audioContext.createBiquadFilter();
            spellFilter.type = 'highpass';
            spellFilter.frequency.value = 800;
            spellFilter.Q.value = 1.0;
            
            const spellGain = audioContext.createGain();
            spellGain.gain.setValueAtTime(0, audioContext.currentTime);
            spellGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.6);
            
            // Connect spell sounds
            spellSource.connect(spellFilter);
            spellFilter.connect(spellGain);
            spellGain.connect(masterGain);
            spellGain.connect(convolver); // Add reverb for magical effect
            
            // 4. Harp arpeggios - quintessential fantasy RPG music element
            const harpArpeggios = [];
            
            // Fantasy scale notes (D major pentatonic)
            const harpNotes = [294, 330, 370, 440, 494, 587, 659, 740]; // D4, E4, F#4, A4, B4, D5, E5, F#5
            
            // Create several harp arpeggios
            for (let arpIndex = 0; arpIndex < 3; arpIndex++) {
                const startTime = 0.2 + arpIndex * 0.7; // Staggered start times
                const numNotes = 4 + Math.floor(Math.random() * 4); // 4-7 notes per arpeggio
                
                // Create a buffer for this arpeggio
                const arpBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2.0, audioContext.sampleRate);
                const arpData = arpBuffer.getChannelData(0);
                
                // Build the arpeggio pattern
                for (let noteIdx = 0; noteIdx < numNotes; noteIdx++) {
                    const noteStart = startTime + noteIdx * 0.15; // 150ms between notes
                    const noteFreq = harpNotes[Math.floor(Math.random() * harpNotes.length)];
                    const noteDuration = 0.3; // 300ms per note
                    
                    // Calculate buffer positions
                    const startSample = Math.floor(noteStart * audioContext.sampleRate);
                    const endSample = Math.floor((noteStart + noteDuration) * audioContext.sampleRate);
                    
                    // Generate the harp note
                    for (let i = startSample; i < endSample && i < arpData.length; i++) {
                        const t = (i - startSample) / audioContext.sampleRate;
                        const progress = (i - startSample) / (endSample - startSample);
                        
                        // Harp-like envelope - quick attack, longer decay
                        const envelope = progress < 0.05 ? progress * 20 : Math.exp(-(progress - 0.05) * 5);
                        
                        // Harp harmonics
                        const harpSound = Math.sin(2 * Math.PI * noteFreq * t) * 0.3 +
                                         Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.15 +
                                         Math.sin(2 * Math.PI * noteFreq * 3 * t) * 0.05;
                        
                        arpData[i] += harpSound * envelope * 0.25;
                    }
                }
                
                const arpSource = audioContext.createBufferSource();
                arpSource.buffer = arpBuffer;
                
                const arpFilter = audioContext.createBiquadFilter();
                arpFilter.type = 'bandpass';
                arpFilter.frequency.value = 1500;
                arpFilter.Q.value = 1.0;
                
                const arpGain = audioContext.createGain();
                arpGain.gain.value = 0.2;
                
                // Connect arpeggio sound
                arpSource.connect(arpFilter);
                arpFilter.connect(arpGain);
                arpGain.connect(masterGain);
                arpGain.connect(convolver); // Reverb for fantasy hall effect
                
                harpArpeggios.push(arpSource);
            }
            
            // Start all sound sources
            console.log('ArcadeEntity12: Starting all fantasy RPG/TCG sounds');
            ambientOsc1.start();
            ambientOsc2.start();
            ambientLFO.start();
            cardSource.start();
            spellSource.start();
            
            // Start harp arpeggios
            for (const source of harpArpeggios) {
                source.start();
            }
            
            // Register this sound in the global sound manager
            // Create a controller object for this sound instance
            window.currentArcadeSound = {
                arcadeId: this.arcadeId,
                soundType: 'fantasy-rpg',
                // Method to stop all oscillators and sources
                stop: () => {
                    try {
                        // Stop oscillators
                        ambientOsc1.stop();
                        ambientOsc2.stop();
                        ambientLFO.stop();
                        
                        // Stop buffer-based sources - critical fix for ongoing sound issue
                        cardSource.stop();
                        spellSource.stop();
                        
                        // Disconnect all nodes to allow garbage collection
                        ambientGain.disconnect();
                        cardGain.disconnect();
                        spellGain.disconnect();
                        
                        // Clean up harp arpeggio sources
                        for (const source of harpArpeggios) {
                            try {
                                source.stop();
                                source.disconnect();
                            } catch (err) {
                                console.error('ArcadeEntity12: Error cleaning up arpeggio source:', err);
                            }
                        }
                        
                        masterGain.disconnect();
                        console.log('ArcadeEntity12: Fantasy RPG/TCG sound effects stopped by manager');
                    } catch (err) {
                        console.error('ArcadeEntity12: Error stopping sound resources:', err);
                    }
                }
            };
            
            // Set timeouts to stop and clean up oscillators - ensuring all sounds end properly
            setTimeout(() => {
                try {
                    // CRITICAL: Properly clean up all audio nodes to prevent residual tones
                    try {
                        // First, stop all oscillators and sound sources
                        ambientOsc1.stop();
                        ambientOsc2.stop();
                        ambientLFO.stop();
                        cardSource.stop();
                        spellSource.stop();
                        
                        // Stop all harp arpeggios
                        for (const source of harpArpeggios) {
                            source.stop();
                            source.disconnect();
                        }
                        
                        // Disconnect all nodes to prevent sound leakage
                        ambientGain.disconnect();
                        cardGain.disconnect();
                        spellGain.disconnect();
                        masterGain.disconnect();
                        reverbGain.disconnect();
                        convolver.disconnect();
                        
                        // Clear any global references
                        if (window.currentArcadeSound && window.currentArcadeSound.arcadeId === this.arcadeId) {
                            window.currentArcadeSound = null;
                            console.log('🎮🎮🎮 ArcadeEntity12: Cleared global sound reference');
                        }
                        
                        // Remove context from tracking array
                        const index = ArcadeEntity12._activeAudioContexts.indexOf(audioContext);
                        if (index !== -1) {
                            ArcadeEntity12._activeAudioContexts.splice(index, 1);
                            console.log('🎮🎮🎮 ArcadeEntity12: Removed context from tracking array');
                        }
                        
                        // Close the entire audio context to ensure complete cleanup
                        audioContext.close().then(() => {
                            console.log('🎮🎮🎮 ArcadeEntity12: Fantasy RPG/TCG sound completely terminated');
                        }).catch((err) => {
                            console.error('🎮🎮🎮 ArcadeEntity12: Error closing audio context:', err);
                        });
                    } catch (cleanupErr) {
                        console.error('🎮🎮🎮 ArcadeEntity12: Error during sound cleanup:', cleanupErr);
                    }
                } catch (err) {
                    console.error('🎮🎮🎮 ArcadeEntity12: Error cleaning up proximity sound resources:', err);
                }
            }, 3000); // Extend to 3 seconds to ensure complete sound effect playback
        } catch (err) {
            console.error('ArcadeEntity12: Error creating approach sound:', err);
        }
    }
}

export { ArcadeEntity12 };
