/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity11 extends Entity {
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_2', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_10', options = {}) {
        // Create an arcade with standard settings as a static entity
        super(x, y, 1.0, 1.0, {
            isStatic: true,
            zHeight: 1.8,
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
        this.scaleX = .55;
        this.scaleY = .55;
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
                title: 'Indiana Bones', 
                description: 'A 3D Action/Adventure Game',
                url: 'https://astro.gobienan.com/',
                imagePath: 'assets/Games/Game_15.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_15.png', 'assets/games/Game_15.png']
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
        
        console.log(`ArcadeEntity11: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity11: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_11.png',
            'assets/decor/Arcade_11.png',
            './assets/decor/Arcade_10.png',
            '/assets/decor/Arcade_8.png',
            window.location.origin + '/assets/decor/Arcade%208.png',
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
        debug(`ArcadeEntity11: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity11: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity11: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity11: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity11: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity11: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_11.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity11: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity11: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_11.png`,        // Exact filename with space
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
                debug(`ArcadeEntity11: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity11: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity11: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity11: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity11: Creating fallback asset`);
        
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
            debug(`ArcadeEntity11: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity11: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity11: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity11: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
                // Trigger a pulse effect and sound when proximity changes
                if (isNearPlayer) {
                    this.pulseGlow();
                    this.playProximitySound();
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
                debug(`ArcadeEntity11: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity11: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity11: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        debug(`ArcadeEntity11: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            debug(`ArcadeEntity11: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity11: Game interaction system not available!`);
        }
        
        // Play sound
        this.playActivateSound();
    }
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity11: Hiding game selection`);
        console.log("🎮 ArcadeEntity11: Hiding game selection and playing close sound");
        
        // Play a sound effect when closing the menu
        try {
            // Explicitly call with proper this context
            this.playMenuCloseSound();
            debug(`ArcadeEntity11: Menu close sound triggered successfully`);
        } catch (err) {
            console.error("🎮 ArcadeEntity11: Error calling playMenuCloseSound:", err);
        }
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity11: Set game interaction state to inactive`);
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
    debug(`ArcadeEntity11: Launching game: ${this.games[this.selectedGameIndex].title}`);
    
    if (this.games.length === 0) {
        debug(`ArcadeEntity11: No games available to launch`);
        return;
    }
        
    // Get the selected game
    const selectedGame = this.games[this.selectedGameIndex];
    debug(`ArcadeEntity11: Launching game: ${selectedGame.title}`);

    // Play launch sound
    this.playLaunchSound();
    
    // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity11: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity11: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    // Static audio context reference for the entire class
    static _activeAudioContexts = [];
    
    /**
     * Play a futuristic racing game startup sequence when activating the arcade cabinet
     * Simulates cyberpunk/synthwave F-Zero style sounds with digital synths and engine noises
     */
    playActivateSound() {
        console.log('ArcadeEntity11: Starting NEW cyberpunk racing sound sequence - STOPPING ALL OTHER SOUNDS');
        
        // Forcibly clean up any active contexts before creating new ones
        try {
            // Clean up our static cache of contexts
            ArcadeEntity11._activeAudioContexts.forEach(ctx => {
                try { 
                    ctx.close(); 
                    console.log('ArcadeEntity11: Closed a previous audio context');
                } catch(e) { 
                    /* ignore close errors */ 
                }
            });
            ArcadeEntity11._activeAudioContexts = [];
            
            // Create audio context for cyberpunk/synthwave racing game sequence
            const context = new (window.AudioContext || window.webkitAudioContext)();
            // Store this context in our static array
            ArcadeEntity11._activeAudioContexts.push(context);
            console.log('ArcadeEntity11: Created new cyberpunk racing sound context');
            
            // Create reverb for spatial effects (futuristic sound stage)
            const convolver = context.createConvolver();
            const reverbTime = 2.0;
            const reverbDecay = 0.2;
            const reverbBufferSize = context.sampleRate * reverbTime;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Generate cyberpunk-style reverb impulse response
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    channelData[i] = (Math.random() * 2 - 1) * 
                        Math.exp(-i / (reverbBufferSize * reverbDecay)) * 
                        (1 - Math.pow(i / reverbBufferSize, 0.5));
                }
            }
            convolver.buffer = reverbBuffer;
            convolver.connect(masterGain);
            
            // 1. Digital System Boot Sequence - futuristic racing game UI
            const bootBufferSize = context.sampleRate * 1.5;
            const bootBuffer = context.createBuffer(1, bootBufferSize, context.sampleRate);
            const bootData = bootBuffer.getChannelData(0);
            
            // Fill buffer with digital boot sequence sounds
            for (let i = 0; i < bootBufferSize; i++) {
                const progress = i / bootBufferSize;
                
                // Create futuristic boot sequence with cyberpunk elements
                const digitalSequence = 
                    0.4 * Math.sin(progress * 12000) * Math.exp(-progress * 15) + // Initial high frequency blip
                    0.3 * Math.sin(progress * 6000) * Math.exp(-(progress-0.15) * 12) * (progress > 0.15 ? 1 : 0) + // Second blip
                    0.25 * Math.sin(progress * 3000) * Math.exp(-(progress-0.3) * 10) * (progress > 0.3 ? 1 : 0) + // Third blip
                    0.2 * Math.sin(progress * 1500) * Math.exp(-(progress-0.45) * 8) * (progress > 0.45 ? 1 : 0) + // Fourth blip
                    0.2 * Math.sin(progress * 800) * Math.exp(-(progress-0.6) * 8) * (progress > 0.6 ? 1 : 0); // Final deeper blip
                
                // Add futuristic digital system noise between blips
                const systemNoise = (Math.random() * 2 - 1) * 0.08 * ( 
                    (progress < 0.1 || (progress > 0.2 && progress < 0.25) || 
                    (progress > 0.35 && progress < 0.4) || (progress > 0.5 && progress < 0.55) || 
                    progress > 0.65) ? 1 : 0.1
                );
                
                // Add digital glitch effects
                const glitchEffect = 
                    ((progress > 0.12 && progress < 0.13) || 
                    (progress > 0.27 && progress < 0.28) || 
                    (progress > 0.42 && progress < 0.43) || 
                    (progress > 0.57 && progress < 0.58)) ?
                    0.15 * (Math.random() * 2 - 1) * Math.sin(progress * 20000) : 0;
                
                // Add UI activation clicks and beeps
                const uiActivation = 
                    ((progress > 0.15 && progress < 0.16) || 
                    (progress > 0.3 && progress < 0.31) || 
                    (progress > 0.45 && progress < 0.46) || 
                    (progress > 0.6 && progress < 0.61) || 
                    (progress > 0.75 && progress < 0.76)) ?
                    0.2 * Math.sin(progress * 15000) * Math.exp(-200 * (Math.pow(progress - (progress > 0.5 ? (progress > 0.7 ? 0.755 : 0.605) : (progress > 0.4 ? 0.455 : (progress > 0.25 ? 0.305 : 0.155))), 2))) : 0;
                
                // Combine all digital cyberpunk sounds
                bootData[i] = digitalSequence + systemNoise + glitchEffect + uiActivation;
            }
            
            // Boot sequence source
            const bootSource = context.createBufferSource();
            bootSource.buffer = bootBuffer;
            
            // Digital boot sound filter 
            const bootFilter = context.createBiquadFilter();
            bootFilter.type = 'bandpass';
            bootFilter.frequency.setValueAtTime(3000, context.currentTime);
            bootFilter.frequency.linearRampToValueAtTime(1500, context.currentTime + 0.8);
            bootFilter.Q.value = 2.0;
            
            // Boot sequence gain envelope
            const bootGain = context.createGain();
            bootGain.gain.setValueAtTime(0.0, context.currentTime);
            bootGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1); // Quick attack
            bootGain.gain.setValueAtTime(0.4, context.currentTime + 0.7);
            bootGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 1.2); // Fade out
            
            // 2. Futuristic F-Zero Style Racing Engine
            const engineBufferSize = context.sampleRate * 2.0;
            const engineBuffer = context.createBuffer(1, engineBufferSize, context.sampleRate);
            const engineData = engineBuffer.getChannelData(0);
            
            // Fill buffer with futuristic racing engine sounds
            for (let i = 0; i < engineBufferSize; i++) {
                const progress = i / engineBufferSize;
                
                // Create futuristic engine with dramatic frequency rise (F-Zero style)
                const freqMultiplier = 80 + progress * 920; // Dramatic frequency rise for engine rev
                const engineIntensity = Math.min(1.0, progress * 2.5); // Intensity ramps up faster for dramatic effect
                
                // Primary engine tone (sawtooth for distinctive racing sound)
                const engineTone = 0.35 * Math.sin(progress * freqMultiplier * 80) * 
                                  (1 + 0.3 * Math.sin(progress * 20)) * // Add subtle wobble
                                  engineIntensity;
                
                // Add growling harmonics for futuristic feel
                const engineHarmonics = 
                    0.2 * Math.sin(progress * freqMultiplier * 120) * 
                    Math.pow(Math.sin(Math.PI * progress * 4), 2) * 
                    (progress > 0.2 ? 1 : 0) * engineIntensity + 
                    0.15 * Math.sin(progress * freqMultiplier * 150) * 
                    Math.pow(Math.sin(Math.PI * progress * 6), 2) * 
                    (progress > 0.4 ? 1 : 0) * engineIntensity;
                
                // Add distinctive cyberpunk engine whine/whoosh
                const engineWhine = 0.25 * Math.sin(progress * freqMultiplier * 200) * 
                                  Math.pow(Math.sin(Math.PI * progress * 1.5), 2) * 
                                  (progress > 0.3 ? 1 : 0) * engineIntensity;
                
                // Add futuristic mechanical clicks and noises
                const engineNoises = (Math.random() > 0.95) ? 
                    0.2 * (Math.random() * 2 - 1) * Math.exp(-50 * (Math.abs(progress - 0.5))) : 0;
                
                // Combine all engine sounds with volume shaping
                engineData[i] = (engineTone + engineHarmonics + engineWhine + engineNoises) * 
                                Math.pow(Math.sin(Math.PI * progress), 0.25); // Shape overall volume curve
            }
            
            const engineSource = context.createBufferSource();
            engineSource.buffer = engineBuffer;
            
            // Engine sound filter for futuristic racing feel
            const engineFilter = context.createBiquadFilter();
            engineFilter.type = 'bandpass';
            engineFilter.frequency.setValueAtTime(500, context.currentTime);
            engineFilter.frequency.linearRampToValueAtTime(2000, context.currentTime + 1.0); // More dramatic sweep
            engineFilter.Q.value = 3.0; // Sharper resonance for sci-fi feel
            
            // Engine gain envelope with dramatic curve
            const engineGain = context.createGain();
            engineGain.gain.setValueAtTime(0.0, context.currentTime);
            engineGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.1); // Initial burst
            engineGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.7); // Full power
            engineGain.gain.setValueAtTime(0.4, context.currentTime + 1.0);
            engineGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 1.5); // Sustain at idle
            
            // 3. Synthwave UI Sounds and Cyberpunk Interface Effects
            const uiBufferSize = context.sampleRate * 1.0;
            const uiBuffer = context.createBuffer(1, uiBufferSize, context.sampleRate);
            const uiData = uiBuffer.getChannelData(0);
            
            // Create synthwave UI sounds and digital interface patterns
            for (let i = 0; i < uiBufferSize; i++) {
                const progress = i / uiBufferSize;
                
                // Synthwave arpeggio tones 
                const arpeggioNotes = [440, 554, 659, 880]; // A4, C#5, E5, A5 - cyberpunk chord
                const noteIndex = Math.floor(progress * 16) % arpeggioNotes.length;
                const arpeggioNote = (progress > 0.2 && progress < 0.7) ? 
                    0.25 * Math.sin(2 * Math.PI * arpeggioNotes[noteIndex] * progress) * 
                    Math.pow(Math.sin(Math.PI * progress * 16), 8) : 0;
                
                // Digital interface confirmation beeps
                const interfaceBeep1 = (progress > 0.3 && progress < 0.32) ? 
                    0.3 * Math.sin(2 * Math.PI * 1800 * progress) : 0;
                const interfaceBeep2 = (progress > 0.5 && progress < 0.52) ? 
                    0.3 * Math.sin(2 * Math.PI * 2200 * progress) : 0;
                
                // Futuristic racing HUD activation sounds
                const hudActivation = (progress > 0.4 && progress < 0.45 || progress > 0.6 && progress < 0.65) ?
                    0.2 * Math.sin(2 * Math.PI * (1200 + progress * 400) * progress) * 
                    Math.pow(Math.sin(Math.PI * progress * 10), 2) : 0;
                
                // Digital glitch effects and data processing sounds
                const dataProcessing = (progress > 0.45 && progress < 0.48) || (progress > 0.65 && progress < 0.68) ?
                    0.15 * (Math.random() * 2 - 1) * 
                    Math.exp(-20 * Math.pow(progress - (progress > 0.6 ? 0.665 : 0.465), 2)) : 0;
                
                // Racing game announcer voice simulation (just rhythm patterns, not actual speech)
                const announcerPattern = (progress > 0.7 && progress < 0.85) ? 
                    0.15 * Math.sin(2 * Math.PI * 300 * progress) * 
                    Math.pow(Math.sin(2 * Math.PI * 3 * progress), 2) * 
                    Math.pow(Math.sin(2 * Math.PI * 0.5 * progress), 2) : 0;
                
                // Crowd/stadium ambience for racing game atmosphere
                const crowdAmbience = 0.05 * (Math.random() * 2 - 1) * 
                    Math.pow(Math.sin(Math.PI * progress * 0.5), 2) * 
                    (progress > 0.5 ? 1 : progress * 2);
                
                // Combine all synthwave UI and racing game interface sounds
                uiData[i] = arpeggioNote + interfaceBeep1 + interfaceBeep2 + 
                           hudActivation + dataProcessing + announcerPattern + crowdAmbience;
            }
            
            const uiSource = context.createBufferSource();
            uiSource.buffer = uiBuffer;
            
            // UI sounds gain envelope
            const uiGain = context.createGain();
            uiGain.gain.setValueAtTime(0.0, context.currentTime);
            uiGain.gain.setValueAtTime(0.0, context.currentTime + 0.5); // Delayed start after boot sequence
            uiGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.6);
            uiGain.gain.setValueAtTime(0.3, context.currentTime + 0.8);
            uiGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 1.2);
            
            // Master gain is already created at the beginning
            
            // Connect all nodes for cyberpunk racing game sounds
            // Connect boot sequence
            bootSource.connect(bootFilter);
            bootFilter.connect(bootGain);
            bootGain.connect(convolver); // Route to reverb for spacey sound
            bootGain.connect(masterGain); // Direct path for clarity
            
            // Connect racing engine sounds
            engineSource.connect(engineFilter);
            engineFilter.connect(engineGain);
            engineGain.connect(convolver); // Route to reverb for space
            engineGain.connect(masterGain); // Direct path for power
            
            // Connect UI sounds
            uiSource.connect(uiGain);
            uiGain.connect(masterGain);
            
            // Add a dramatic synthwave arpeggio to truly establish the racing theme
            const synthArp = context.createOscillator();
            synthArp.type = 'sawtooth'; // Classic synthwave sound
            
            // Create the synthwave lead filter
            const synthFilter = context.createBiquadFilter();
            synthFilter.type = 'lowpass';
            synthFilter.frequency.value = 1200;
            synthFilter.Q.value = 8; // Resonant filter for that synthwave character
            
            // Create gain for the synthwave lead
            const synthGain = context.createGain();
            synthGain.gain.value = 0.0;
            synthGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.8);
            synthGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 1.5);
            
            // Arpeggio pattern with cyberpunk notes
            const arpNotes = [440, 554, 659, 880, 1108]; // A, C#, E, A, D# - cyberpunk scale
            let noteIndex = 0;
            
            // Synth lead arpeggio interval
            const arpInterval = setInterval(() => {
                if (noteIndex < 8) { // Play 8 notes in the pattern
                    synthArp.frequency.setValueAtTime(
                        arpNotes[noteIndex % arpNotes.length], 
                        context.currentTime
                    );
                    noteIndex++;
                } else {
                    clearInterval(arpInterval);
                }
            }, 120); // 120ms between notes = 500bpm sixteenth notes, very synthwave!
            
            // Connect synthwave arpeggio
            synthArp.connect(synthFilter);
            synthFilter.connect(synthGain);
            synthGain.connect(convolver); // Heavy reverb for that 80s feel
            synthGain.connect(masterGain);
            
            // Start all sounds with appropriate timing
            bootSource.start(); // Begin boot sequence
            engineSource.start(); // Start racing engine
            uiSource.start(); // Play UI sounds
            
            // Start the synthwave arpeggio with a delay
            setTimeout(() => {
                synthArp.start();
                console.log('ArcadeEntity11: Synthwave arpeggio activated');
            }, 800);
            
            // Stop all sounds and clean up after the sequence completes
            setTimeout(() => {
                try {
                    console.log('ArcadeEntity11: Stopping all cyberpunk racing sounds');
                    bootSource.stop();
                    engineSource.stop();
                    uiSource.stop();
                    synthArp.stop();
                    clearInterval(arpInterval);
                    
                    // Remove this context from our static array
                    const index = ArcadeEntity11._activeAudioContexts.indexOf(context);
                    if (index > -1) {
                        ArcadeEntity11._activeAudioContexts.splice(index, 1);
                    }
                    
                    context.close();
                    debug(`ArcadeEntity11: Cyberpunk racing sound sequence complete`);
                } catch (e) {
                    debug(`ArcadeEntity11: Error during sound cleanup: ${e}`);
                }
            }, 2000); // Allow full completion of the racing startup sounds
            
            debug(`ArcadeEntity11: Played cyberpunk/synthwave F-Zero style sound sequence`);
        } catch (err) {
            debug(`ArcadeEntity11: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play futuristic racing menu selection sound with cyberpunk/synthwave feel
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create cyberpunk/synthwave racing menu UI sound
            
            // 1. Primary digital selection sound (futuristic interface)
            const selectOsc = context.createOscillator();
            selectOsc.type = 'sawtooth'; // More electronic/digital sounding than square
            selectOsc.frequency.value = 880; // A5 - higher pitch for sci-fi feel
            
            // Brief filter sweep for futuristic UI feel
            const selectFilter = context.createBiquadFilter();
            selectFilter.type = 'bandpass';
            selectFilter.frequency.setValueAtTime(4000, context.currentTime);
            selectFilter.frequency.exponentialRampToValueAtTime(2000, context.currentTime + 0.03);
            selectFilter.Q.value = 5.0; // More resonant for that digital 80s sound
            
            // Very quick gain envelope for crisp digital feel
            const selectGain = context.createGain();
            selectGain.gain.setValueAtTime(0.0, context.currentTime);
            selectGain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.005); // Ultra-quick attack
            selectGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.06); // Quick decay
            
            // 2. Synthwave sweep response (stylistic flourish)
            const sweepOsc = context.createOscillator();
            sweepOsc.type = 'triangle'; // Smoother for the sweep
            sweepOsc.frequency.setValueAtTime(1500, context.currentTime + 0.01); // Start high
            sweepOsc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.08); // Dramatic downward sweep
            
            const sweepGain = context.createGain();
            sweepGain.gain.setValueAtTime(0.0, context.currentTime);
            sweepGain.gain.setValueAtTime(0.0, context.currentTime + 0.01); // Slight delay after click
            sweepGain.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.02); // Quick rise
            sweepGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1); // Fade out
            
            // 3. Digital glitch noise (cyberpunk aesthetic)
            const glitchBufferSize = context.sampleRate * 0.08; // Shorter for more responsiveness
            const glitchBuffer = context.createBuffer(1, glitchBufferSize, context.sampleRate);
            const glitchData = glitchBuffer.getChannelData(0);
            
            // Fill buffer with digital glitch noise pattern
            for (let i = 0; i < glitchBufferSize; i++) {
                const progress = i / glitchBufferSize;
                // Create digital-sounding pattern with bit-crushing effect
                if (progress < 0.05) {
                    // Initial burst
                    glitchData[i] = (Math.random() * 2 - 1) * 0.7 * (1 - progress * 15);
                } else {
                    // Digital artifacts - quantized to create bit-reduced effect
                    const step = Math.floor(progress * 20) / 20; // Create stepped/quantized effect
                    glitchData[i] = (Math.random() * 2 - 1) * 0.15 * (1 - step) * (1 - progress);
                }
            }
            
            const glitchNoise = context.createBufferSource();
            glitchNoise.buffer = glitchBuffer;
            
            const glitchFilter = context.createBiquadFilter();
            glitchFilter.type = 'highpass';
            glitchFilter.frequency.value = 3000; // Keep it crisp and digital
            glitchFilter.Q.value = 2.0;
            
            const glitchGain = context.createGain();
            glitchGain.gain.value = 0.05;
            
            // Add reverb for synthwave spaciousness
            const convolver = context.createConvolver();
            const reverbSize = context.sampleRate * 0.5; // Short reverb
            const reverbBuffer = context.createBuffer(2, reverbSize, context.sampleRate);
            
            // Create a short, bright reverb
            for (let channel = 0; channel < 2; channel++) {
                const data = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbSize * 0.1));
                }
            }
            convolver.buffer = reverbBuffer;
            
            // Master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.6; // Louder for impact
            
            // Connect all nodes - more complex routing for richness
            selectOsc.connect(selectFilter);
            selectFilter.connect(selectGain);
            selectGain.connect(convolver); // Add some reverb
            selectGain.connect(masterGain); // Direct path too
            
            sweepOsc.connect(sweepGain);
            sweepGain.connect(convolver); // More reverb for the sweep
            sweepGain.connect(masterGain);
            
            glitchNoise.connect(glitchFilter);
            glitchFilter.connect(glitchGain);
            glitchGain.connect(masterGain);
            
            convolver.connect(masterGain); // Mix reverb into output
            masterGain.connect(context.destination);
            
            // Start sound components
            selectOsc.start();
            sweepOsc.start();
            glitchNoise.start();
            
            // Stop and clean up
            setTimeout(() => {
                selectOsc.stop();
                sweepOsc.stop();
                glitchNoise.stop();
                context.close();
            }, 200); // Short duration for responsive interface feel
            
            debug(`ArcadeEntity11: Played cyberpunk racing menu selection sound`);
        } catch (err) {
            debug(`ArcadeEntity11: Error playing selection sound: ${err}`);
        }
    }
    
    /**
     * Play a deep, powerful cyberpunk/synthwave racing game launch sound
     * Features massive bass, driving rhythms and high-energy synthwave atmosphere
     */
    playLaunchSound() {
        try {
            // Create a brand new audio context with direct instantiation
            const context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('ArcadeEntity11: Creating deep cyberpunk racing game launch sound');
            
            // Track all intervals for cleanup
            const intervals = [];
            
            // Master effects chain for power and depth
            const masterCompressor = context.createDynamicsCompressor();
            masterCompressor.threshold.value = -24;
            masterCompressor.knee.value = 12;
            masterCompressor.ratio.value = 6;
            masterCompressor.attack.value = 0.003;
            masterCompressor.release.value = 0.25;
            
            // Reverb for spatial atmosphere
            const convolver = context.createConvolver();
            const reverbTime = 3.0;
            const reverbBufferSize = context.sampleRate * reverbTime;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Create dark, cavernous reverb for racing arena
            for (let channel = 0; channel < 2; channel++) {
                const data = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbBufferSize * 0.25));
                }
            }
            convolver.buffer = reverbBuffer;
            
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.25; // Subtle but present
            
            // 1. MASSIVE SUB BASS ENGINE - This provides the deep power
            const subOsc = context.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(30, context.currentTime); // Extremely low starting frequency
            subOsc.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.5); // Low rumble
            subOsc.frequency.exponentialRampToValueAtTime(35, context.currentTime + 1.0); // Drop for impact
            subOsc.frequency.exponentialRampToValueAtTime(120, context.currentTime + 3.0); // Dramatic rise
            
            // Shape the sub bass with a lowpass filter
            const subFilter = context.createBiquadFilter();
            subFilter.type = 'lowpass';
            subFilter.frequency.value = 100;
            subFilter.Q.value = 1.2;
            
            // Sub bass gain envelope - very powerful
            const subGain = context.createGain();
            subGain.gain.setValueAtTime(0.0, context.currentTime);
            subGain.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.1); // Fast attack
            subGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.8); // Pull back
            subGain.gain.linearRampToValueAtTime(0.95, context.currentTime + 2.0); // Surge to full power
            
            // 2. MID-RANGE ENGINE ROAR - The core engine sound
            const engineOsc = context.createOscillator();
            engineOsc.type = 'sawtooth'; // Rich in harmonics
            engineOsc.frequency.setValueAtTime(100, context.currentTime);
            engineOsc.frequency.exponentialRampToValueAtTime(280, context.currentTime + 2.0);
            engineOsc.frequency.exponentialRampToValueAtTime(450, context.currentTime + 3.0);
            
            // Second engine layer for thickness
            const engineOsc2 = context.createOscillator();
            engineOsc2.type = 'square';
            engineOsc2.frequency.setValueAtTime(120, context.currentTime);
            engineOsc2.frequency.exponentialRampToValueAtTime(340, context.currentTime + 2.2);
            
            // Engine filter for character
            const engineFilter = context.createBiquadFilter();
            engineFilter.type = 'bandpass';
            engineFilter.frequency.setValueAtTime(400, context.currentTime);
            engineFilter.frequency.exponentialRampToValueAtTime(2000, context.currentTime + 2.5);
            engineFilter.Q.value = 5.0; // Very resonant for a screaming quality
            
            // Engine gain with dramatic envelope
            const engineGain = context.createGain();
            engineGain.gain.setValueAtTime(0.0, context.currentTime);
            engineGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.2);
            engineGain.gain.linearRampToValueAtTime(0.45, context.currentTime + 1.0); // Pull back
            engineGain.gain.linearRampToValueAtTime(0.85, context.currentTime + 2.5); // Surge to full power
            
            // 3. DRIVING RHYTHM SECTION - Pulsating cyberpunk beat
            const kickFreq = 4; // 4Hz = 240 BPM - extremely driving
            const kickOsc = context.createOscillator();
            kickOsc.frequency.value = kickFreq;
            
            const kickSynth = context.createOscillator();
            kickSynth.type = 'sine';
            kickSynth.frequency.value = 60; // Low kick frequency
            
            const kickGain = context.createGain();
            kickGain.gain.value = 0;
            
            // Modulate the kick with the rhythm oscillator
            const kickDepth = context.createGain();
            kickDepth.gain.value = 1.0; // Full depth modulation
            
            // Create rhythmic noise bursts for that industrial feel
            const rhythmBufferSize = context.sampleRate * 3.0;
            const rhythmBuffer = context.createBuffer(1, rhythmBufferSize, context.sampleRate);
            const rhythmData = rhythmBuffer.getChannelData(0);
            
            // Fill with rhythmic industrial noise
            for (let i = 0; i < rhythmBufferSize; i++) {
                const progress = i / rhythmBufferSize;
                const beatPhase = (i / context.sampleRate) * kickFreq % 1;
                const beatStrength = beatPhase < 0.2 ? (1 - beatPhase/0.2) : 0;
                
                // Create powerful kick drum transients at rhythm intervals
                if (beatStrength > 0) {
                    // Shape each beat with a quick attack and decay
                    rhythmData[i] = (Math.random() * 2 - 1) * 0.8 * beatStrength * 
                        Math.min(1.0, progress * 2); // Ramp up intensity over time
                } else {
                    // Background noise/texture between beats
                    rhythmData[i] = (Math.random() * 2 - 1) * 0.1 * Math.min(1.0, progress * 3);
                }
            }
            
            const rhythmSource = context.createBufferSource();
            rhythmSource.buffer = rhythmBuffer;
            
            const rhythmFilter = context.createBiquadFilter();
            rhythmFilter.type = 'bandpass';
            rhythmFilter.frequency.value = 900;
            rhythmFilter.frequency.linearRampToValueAtTime(2000, context.currentTime + 2.0);
            rhythmFilter.Q.value = 2.0;
            
            const rhythmGain = context.createGain();
            rhythmGain.gain.setValueAtTime(0.0, context.currentTime);
            rhythmGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.5); // Bring in the rhythm
            rhythmGain.gain.linearRampToValueAtTime(0.8, context.currentTime + 2.0); // Full power
            
            // 4. SYNTHWAVE ARPEGGIATOR - For that 80s cyberpunk feel
            const synthOsc = context.createOscillator();
            synthOsc.type = 'sawtooth';
            
            // Minor pentatonic scale for cyberpunk feel
            const synthNotes = [146.8, 174.6, 196.0, 220.0, 261.6, 293.7, 349.2, 392.0];
            
            // Arpeggiator pattern - dramatic ascending/descending pattern
            const arpPattern = [];
            // Build ascending
            for (let i = 0; i < synthNotes.length; i++) {
                arpPattern.push(synthNotes[i]);
            }
            // And back down with some variations
            for (let i = synthNotes.length - 2; i >= 0; i--) {
                arpPattern.push(synthNotes[i]);
                if (i % 2 === 0 && i > 0) {
                    arpPattern.push(synthNotes[i] * 2); // Add octave jumps
                }
            }
            
            // Set initial frequency
            synthOsc.frequency.setValueAtTime(arpPattern[0], context.currentTime);
            
            let arpIndex = 0;
            // Start arpeggiator after a slight delay
            const arpSpeed = 80; // Very fast - 80ms per note
            const arpStartDelay = 400; // ms
            
            // Schedule arpeggiator to start after delay
            const arpStartTimeout = setTimeout(() => {
                const arpInterval = setInterval(() => {
                    arpIndex = (arpIndex + 1) % arpPattern.length;
                    synthOsc.frequency.setValueAtTime(
                        arpPattern[arpIndex], 
                        context.currentTime
                    );
                }, arpSpeed);
                intervals.push(arpInterval);
            }, arpStartDelay);
            
            // Resonant filter for the signature synthwave sound
            const synthFilter = context.createBiquadFilter();
            synthFilter.type = 'lowpass';
            synthFilter.frequency.setValueAtTime(200, context.currentTime);
            synthFilter.frequency.linearRampToValueAtTime(5000, context.currentTime + 2.0);
            synthFilter.Q.value = 12.0; // Extremely resonant for that synthwave character
            
            // Synth gain with classic synthwave envelope
            const synthGain = context.createGain();
            synthGain.gain.setValueAtTime(0.0, context.currentTime);
            synthGain.gain.setValueAtTime(0.0, context.currentTime + (arpStartDelay/1000)); // Delay
            synthGain.gain.linearRampToValueAtTime(0.5, context.currentTime + (arpStartDelay/1000) + 0.2);
            synthGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 2.5);
            
            // 5. DISTORTION EFFECT - For gritty cyberpunk character
            const distortion = context.createWaveShaper();
            function makeDistortionCurve(amount) {
                const samples = 44100;
                const curve = new Float32Array(samples);
                const deg = Math.PI / 180;
                
                for (let i = 0; i < samples; i++) {
                    const x = (i * 2) / samples - 1;
                    curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
                }
                return curve;
            }
            distortion.curve = makeDistortionCurve(50);
            distortion.oversample = '4x';
            
            // 6. NOISE SWEEP - For intensity building
            const sweepBufferSize = context.sampleRate * 3.0;
            const sweepBuffer = context.createBuffer(1, sweepBufferSize, context.sampleRate);
            const sweepData = sweepBuffer.getChannelData(0);
            
            // Create rising noise sweep
            for (let i = 0; i < sweepBufferSize; i++) {
                const progress = i / sweepBufferSize;
                // Increase intensity over time
                const intensity = Math.min(1.0, progress * 3); 
                sweepData[i] = (Math.random() * 2 - 1) * 0.6 * intensity;
            }
            
            const sweepSource = context.createBufferSource();
            sweepSource.buffer = sweepBuffer;
            
            // Sweep filter for the rising effect
            const sweepFilter = context.createBiquadFilter();
            sweepFilter.type = 'bandpass';
            sweepFilter.frequency.setValueAtTime(400, context.currentTime);
            sweepFilter.frequency.exponentialRampToValueAtTime(8000, context.currentTime + 2.5);
            sweepFilter.Q.value = 2.0;
            
            const sweepGain = context.createGain();
            sweepGain.gain.setValueAtTime(0.0, context.currentTime);
            sweepGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.2);
            sweepGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 2.5);
            
            // Main output with master volume
            const masterGain = context.createGain();
            masterGain.gain.value = 0.9; // Powerful but not distorting
            
            // CONNECTIONS - Complex signal path for rich sound
            
            // Sub bass path
            subOsc.connect(subFilter);
            subFilter.connect(subGain);
            subGain.connect(masterCompressor);
            
            // Engine path with distortion
            engineOsc.connect(engineFilter);
            engineFilter.connect(distortion);
            distortion.connect(engineGain);
            engineGain.connect(masterCompressor);
            
            engineOsc2.connect(engineGain);
            
            // Kick drum path
            kickOsc.connect(kickDepth);
            kickDepth.connect(kickGain.gain);
            kickSynth.connect(kickGain);
            kickGain.connect(masterCompressor);
            
            // Rhythm path
            rhythmSource.connect(rhythmFilter);
            rhythmFilter.connect(rhythmGain);
            rhythmGain.connect(masterCompressor);
            
            // Synthwave path
            synthOsc.connect(synthFilter);
            synthFilter.connect(synthGain);
            synthGain.connect(convolver); // More reverb on synth
            synthGain.connect(masterCompressor);
            
            // Sweep noise path
            sweepSource.connect(sweepFilter);
            sweepFilter.connect(sweepGain);
            sweepGain.connect(masterCompressor);
            
            // Final output path
            masterCompressor.connect(masterGain);
            masterCompressor.connect(convolver);
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            masterGain.connect(context.destination);
            
            // START ALL SOURCES
            const startTime = context.currentTime;
            subOsc.start(startTime);
            engineOsc.start(startTime);
            engineOsc2.start(startTime);
            kickOsc.start(startTime);
            kickSynth.start(startTime);
            rhythmSource.start(startTime);
            synthOsc.start(startTime);
            sweepSource.start(startTime);
            
            console.log('ArcadeEntity11: Started all cyberpunk racing sound components');
            
            // STOP AND CLEANUP
            setTimeout(() => {
                try {
                    // Stop all oscillators
                    subOsc.stop();
                    engineOsc.stop();
                    engineOsc2.stop();
                    kickOsc.stop();
                    kickSynth.stop();
                    rhythmSource.stop();
                    synthOsc.stop();
                    sweepSource.stop();
                    
                    // Clear all intervals
                    clearTimeout(arpStartTimeout);
                    intervals.forEach(interval => clearInterval(interval));
                    
                    // Close the audio context
                    context.close();
                    console.log('ArcadeEntity11: Completed deep cyberpunk racing sound sequence');
                } catch (e) {
                    console.log('ArcadeEntity11: Error during sound cleanup:', e);
                }
            }, 3500); // 3.5 seconds for complete experience
            
            debug(`ArcadeEntity11: Playing deep cyberpunk racing game launch sound`);
        } catch (err) {
            debug(`ArcadeEntity11: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // Method stub for loading sound effects
        try {
            debug(`ArcadeEntity11: Loading sound effects`);
            // Implementation will be added as needed
        } catch (err) {
            debug(`ArcadeEntity11: Error loading sound effects: ${err}`);
        }
    }
    
    /**
     * Set up load handlers
     */
    onload() {
        try {
            debug(`ArcadeEntity11: Asset loaded successfully`);
            this.hasLoaded = true;
        } catch (err) {
            debug(`ArcadeEntity11: Error in onload: ${err}`);
        }
    }
    
    /**
     * Handle errors during loading
     */
    onerror(err) {
        try {
            debug(`ArcadeEntity11: Error loading asset: ${err}`);
            this.createFallbackAsset();
        } catch (error) {
            debug(`ArcadeEntity11: Error in onerror handler: ${error}`);
        }
    }
    
    /**
     * Play menu close sound
     */
    playMenuCloseSound() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.AudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity11._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity11: Playing menu close sound`);
            
            // Create oscillator for hellish portal closing sound
            const portalClose = context.createOscillator();
            portalClose.type = 'sawtooth';
            portalClose.frequency.setValueAtTime(800, context.currentTime);
            portalClose.frequency.exponentialRampToValueAtTime(150, context.currentTime + 1.5);
            
            // Create noise for demonic energy dissipation
            const bufferSize = context.sampleRate * 1.5;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            // Generate demonic noise with dissolving pattern
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Create dissolving effect - noise becomes less dense over time
                if (Math.random() > progress * 0.7) {
                    noiseData[i] = (Math.random() * 2 - 1) * (1 - progress);
                }
            }
            
            // Create noise source
            const noiseSource = context.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Create mechanical sound components
            const mechanicalSound = context.createOscillator();
            mechanicalSound.type = 'square';
            mechanicalSound.frequency.setValueAtTime(120, context.currentTime);
            mechanicalSound.frequency.linearRampToValueAtTime(40, context.currentTime + 1.0);
            
            // Create filters for each sound component
            const portalFilter = context.createBiquadFilter();
            portalFilter.type = 'lowpass';
            portalFilter.frequency.value = 1200;
            portalFilter.Q.value = 10;
            
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 600;
            noiseFilter.Q.value = 2;
            
            const mechFilter = context.createBiquadFilter();
            mechFilter.type = 'lowpass';
            mechFilter.frequency.value = 300;
            
            // Create gain nodes for volume control
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.6, context.currentTime);
            portalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
            
            const noiseGain = context.createGain();
            noiseGain.gain.setValueAtTime(0.4, context.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.3);
            
            const mechGain = context.createGain();
            mechGain.gain.setValueAtTime(0.3, context.currentTime);
            mechGain.gain.linearRampToValueAtTime(0.001, context.currentTime + 1.2);
            
            // Create simple reverb for infernal ambience
            const convolver = context.createConvolver();
            const reverbBufferSize = context.sampleRate * 2;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Fill reverb buffer with exponentially decaying noise
            for (let channel = 0; channel < 2; channel++) {
                const reverbData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbBufferSize * 0.3));
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Final output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.7;
            
            // Connect all nodes
            portalClose.connect(portalFilter);
            portalFilter.connect(portalGain);
            portalGain.connect(convolver);
            portalGain.connect(masterGain);
            
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(convolver);
            noiseGain.connect(masterGain);
            
            mechanicalSound.connect(mechFilter);
            mechFilter.connect(mechGain);
            mechGain.connect(masterGain);
            
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start all sound sources
            portalClose.start(context.currentTime);
            noiseSource.start(context.currentTime);
            mechanicalSound.start(context.currentTime);
            
            // Cleanup after playback
            setTimeout(() => {
                try {
                    portalClose.stop();
                    noiseSource.stop();
                    mechanicalSound.stop();
                    
                    setTimeout(() => {
                        context.close();
                        debug(`ArcadeEntity11: Closed menu close sound audio context`);
                    }, 100);
                } catch (err) {
                    debug(`ArcadeEntity11: Error cleaning up menu close sound: ${err}`);
                }
            }, 2000);
            
        } catch (err) {
            debug(`ArcadeEntity11: Error playing menu close sound: ${err}`);
        }
    }
    /**
     * Play activation sound - Synthwave/Cyberpunk arcade power-on sequence
     */
    playActivateSound() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.AudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity11._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity11: Playing synthwave activation sound`);
            console.log("🎹 ArcadeEntity11: Playing synthwave activation sound");
            
            // ---------- 1. DIGITAL BOOT SEQUENCE ----------
            
            // Create digital boot sequence sound
            const bootSequence = context.createOscillator();
            bootSequence.type = 'square'; // Digital/8-bit sound
            bootSequence.frequency.setValueAtTime(220, context.currentTime); // A3
            bootSequence.frequency.setValueAtTime(440, context.currentTime + 0.1); // A4
            bootSequence.frequency.setValueAtTime(880, context.currentTime + 0.2); // A5
            bootSequence.frequency.setValueAtTime(1760, context.currentTime + 0.3); // A6
            
            // Filter for boot sequence - bright and digital
            const bootFilter = context.createBiquadFilter();
            bootFilter.type = 'lowpass';
            bootFilter.frequency.value = 5000;
            bootFilter.Q.value = 1;
            
            // Gain envelope for boot sequence
            const bootGain = context.createGain();
            bootGain.gain.setValueAtTime(0.0, context.currentTime);
            bootGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.05);
            bootGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.4);
            
            // ---------- 2. RETRO COMPUTER STARTUP SOUNDS ----------
            
            // Create 8-bit style computer startup sounds
            const bufferSize = context.sampleRate * 2.5;
            const startupBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const startupData = startupBuffer.getChannelData(0);
            
            // Generate retro startup sequence with digital artifacts
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                
                // Create digital loading sequence with decreasing bit-rate
                const bitRate = Math.max(2, Math.floor(8 - progress * 3));
                const quantizationStep = 1.0 / (Math.pow(2, bitRate) - 1);
                
                // Base carrier wave
                let sample = 0;
                
                // Add digital load sequence - different segments with different tones
                if (progress < 0.3) {
                    // First segment: Low pulse sequence
                    const pulseRate = 40 + progress * 50;
                    sample = Math.sin(progress * pulseRate * Math.PI * 2) * 0.5;
                } else if (progress < 0.6) {
                    // Second segment: Higher pitched loading sequence
                    const pulseRate = 80 + (progress - 0.3) * 100;
                    sample = Math.sin(progress * pulseRate * Math.PI * 2) * 0.4;
                } else {
                    // Third segment: Digital system tones
                    const toneRate = 120 + (progress - 0.6) * 200;
                    sample = Math.sin(progress * toneRate * Math.PI * 2) * 0.3;
                    
                    // Add random digital glitches
                    if (Math.random() > 0.95) {
                        sample = (Math.random() * 2 - 1) * 0.4;
                    }
                }
                
                // Quantize the signal for retro digital effect
                const quantizedSample = Math.round(sample / quantizationStep) * quantizationStep;
                
                // Store the processed sample
                startupData[i] = quantizedSample;
                
                // Add digital "steps" - segments of constant values for digital feel
                if (Math.random() > 0.995) {
                    const stepLength = Math.floor(Math.random() * 300) + 100;
                    const stepValue = (Math.random() * 0.8 - 0.4) * (1 - progress * 0.5);
                    
                    for (let j = 0; j < stepLength && i + j < bufferSize; j++) {
                        startupData[i + j] = stepValue;
                    }
                    i += stepLength - 1; // Skip ahead (but -1 because the loop will increment i)
                }
            }
            
            const startupSource = context.createBufferSource();
            startupSource.buffer = startupBuffer;
            
            // Filter for startup sounds
            const startupFilter = context.createBiquadFilter();
            startupFilter.type = 'bandpass';
            startupFilter.frequency.value = 1500;
            startupFilter.Q.value = 2;
            
            // Gain envelope for startup sequence
            const startupGain = context.createGain();
            startupGain.gain.setValueAtTime(0.0, context.currentTime);
            startupGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1);
            startupGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 1.0);
            startupGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 2.0);
            
            // ---------- 3. SYNTHWAVE PAD SWELL ----------
            
            // Create massive analog synth pad that swells
            const synthPad = context.createOscillator();
            synthPad.type = 'sawtooth'; // Rich analog character
            synthPad.frequency.setValueAtTime(110, context.currentTime); // A2 - rich bass
            
            // Create a second oscillator for pad thickness
            const synthPad2 = context.createOscillator();
            synthPad2.type = 'sawtooth';
            synthPad2.frequency.setValueAtTime(110 * 1.005, context.currentTime); // Slightly detuned for thickness
            
            // Filter for synth pad with classic filter sweep
            const padFilter = context.createBiquadFilter();
            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(200, context.currentTime); // Start closed
            padFilter.frequency.exponentialRampToValueAtTime(4000, context.currentTime + 1.5); // Classic filter sweep
            padFilter.Q.value = 4; // Resonant filter for that synthwave character
            
            // Gain envelope for slow synth pad swell
            const padGain = context.createGain();
            padGain.gain.setValueAtTime(0.0, context.currentTime);
            padGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 1.0); // Slow attack
            padGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 2.5); // Hold then decay
            
            // ---------- 4. DIGITAL ARPEGGIOS ----------
            
            // Create arpeggio sequence oscillator
            const arpOsc = context.createOscillator();
            arpOsc.type = 'square'; // Digital character
            arpOsc.frequency.value = 220; // A3 to start
            
            // A-minor pentatonic arpeggio sequence - classic synthwave
            const arpNotes = [220, 261.63, 329.63, 440, 523.25]; // A3, C4, E4, A4, C5
            
            // Create automatic arpeggiator
            let arpIndex = 0;
            const arpSpeed = 80; // 80ms between notes (16th note at 187.5 BPM)
            const arpInterval = setInterval(() => {
                arpIndex = (arpIndex + 1) % arpNotes.length;
                arpOsc.frequency.setValueAtTime(arpNotes[arpIndex], context.currentTime);
            }, arpSpeed);
            
            // Filter for the arpeggiator
            const arpFilter = context.createBiquadFilter();
            arpFilter.type = 'bandpass';
            arpFilter.frequency.value = 2000;
            arpFilter.Q.value = 5; // Sharp resonance for that bright digital sound
            
            // Gain envelope for arpeggios
            const arpGain = context.createGain();
            arpGain.gain.setValueAtTime(0.0, context.currentTime);
            arpGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.8); // Delay entry
            arpGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1.0); // Then fade in
            arpGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 2.5); // Fade out
            
            // ---------- 5. RETRO REVERB ----------
            
            // Create 80s style reverb
            const convolver = context.createConvolver();
            const reverbBufferSize = context.sampleRate * 2.5;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Fill reverb buffer with 80s-style gated reverb
            for (let channel = 0; channel < 2; channel++) {
                const reverbData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    const position = i / reverbBufferSize;
                    
                    // Create a gated reverb effect (sharp cutoff)
                    let amplitude;
                    if (position < 0.5) { // First 50% has normal decay
                        amplitude = Math.exp(-i / (context.sampleRate * 0.5));
                    } else { // After that, sharp cutoff (gated reverb effect)
                        amplitude = Math.exp(-i / (context.sampleRate * 0.1));
                    }
                    
                    // Add some metallic character to the reverb
                    const metallic = 0.1 * Math.sin(position * 180) * amplitude;
                    
                    // Combine random noise and metallic content
                    reverbData[i] = (Math.random() * 2 - 1) * amplitude + metallic;
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Create dynamics compressor for that punchy 80s sound
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 4;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.005;
            compressor.release.value = 0.25;
            
            // Create master gain for final output
            const masterGain = context.createGain();
            masterGain.gain.value = 0.6;
            
            // Connect all audio nodes
            // Boot sequence path
            bootSequence.connect(bootFilter);
            bootFilter.connect(bootGain);
            bootGain.connect(convolver);
            bootGain.connect(masterGain);
            
            // Startup sequence path
            startupSource.connect(startupFilter);
            startupFilter.connect(startupGain);
            startupGain.connect(masterGain);
            
            // Synth pad path
            synthPad.connect(padFilter);
            synthPad2.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(convolver);
            padGain.connect(masterGain);
            
            // Arpeggio path
            arpOsc.connect(arpFilter);
            arpFilter.connect(arpGain);
            arpGain.connect(convolver);
            arpGain.connect(masterGain);
            
            // Reverb to compressor to master
            convolver.connect(masterGain);
            masterGain.connect(compressor);
            compressor.connect(context.destination);
            
            // Start all sound sources
            bootSequence.start(context.currentTime);
            startupSource.start(context.currentTime + 0.2); // Slight delay
            synthPad.start(context.currentTime + 0.5); // Delay the pad entrance
            synthPad2.start(context.currentTime + 0.5);
            arpOsc.start(context.currentTime + 0.8); // Delay the arpeggios
            
            // Cleanup after playback to prevent memory leaks
            setTimeout(() => {
                try {
                    // Stop all sources and clear intervals
                    bootSequence.stop();
                    startupSource.stop();
                    synthPad.stop();
                    synthPad2.stop();
                    arpOsc.stop();
                    clearInterval(arpInterval);
                    
                    // Close audio context after a delay
                    setTimeout(() => {
                        context.close();
                        debug(`ArcadeEntity11: Closed activation sound audio context`);
                    }, 100);
                    
                } catch (err) {
                    debug(`ArcadeEntity11: Error cleaning up activation sound: ${err}`);
                }
            }, 3000);
            
        } catch (err) {
            debug(`ArcadeEntity11: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play ambient noise for the arcade cabinet
     * Creates a chaotic hellish atmosphere with lava bubbling and demonic whispers
     */
    playAmbientNoise() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.AudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity11._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity11: Playing ambient hellish atmosphere`);
            
            // Create lava bubbling noise
            const lavaBubbleBuffer = context.createBuffer(1, context.sampleRate * 10, context.sampleRate);
            const lavaBubbleData = lavaBubbleBuffer.getChannelData(0);
            
            // Generate dynamic bubbling pattern
            for (let i = 0; i < lavaBubbleData.length; i++) {
                const progress = i / lavaBubbleData.length;
                const bubbleProbability = 0.02; // Controls density of bubbles
                
                if (Math.random() < bubbleProbability) {
                    // Create a bubble burst
                    const burstLength = Math.floor(Math.random() * 0.08 * context.sampleRate);
                    const burstAmplitude = 0.4 + Math.random() * 0.6;
                    
                    for (let j = 0; j < burstLength && i + j < lavaBubbleData.length; j++) {
                        // Shape of bubble burst
                        const shape = Math.sin(j / burstLength * Math.PI);
                        lavaBubbleData[i + j] += (Math.random() * 2 - 1) * shape * burstAmplitude;
                    }
                    
                    // Skip ahead to avoid overlapping bursts
                    i += burstLength;
                } else {
                    // Background simmering
                    lavaBubbleData[i] = (Math.random() * 2 - 1) * 0.15;
                }
            }
            
            // Create demonic whispers
            const whispersBuffer = context.createBuffer(1, context.sampleRate * 10, context.sampleRate);
            const whispersData = whispersBuffer.getChannelData(0);
            
            // Generate subtle whispers
            for (let i = 0; i < whispersData.length; i++) {
                const progress = i / whispersData.length;
                
                // Random whispers that come and go
                if (Math.random() < 0.005) { // Controls how often whispers occur
                    const whisperLength = Math.floor(Math.random() * 0.5 * context.sampleRate);
                    const frequency = 70 + Math.random() * 400; // Vocal range
                    const amplitude = 0.05 + Math.random() * 0.15; // Subtle
                    
                    for (let j = 0; j < whisperLength && i + j < whispersData.length; j++) {
                        // Modulated voice-like sounds
                        const modFreq1 = 0.5 + Math.random() * 5; // Modulation speed 1
                        const modFreq2 = 0.2 + Math.random() * 1; // Modulation speed 2
                        
                        const envelope = Math.sin(j / whisperLength * Math.PI); // Fade in/out
                        const voicelike = Math.sin(j * frequency / context.sampleRate * 2 * Math.PI);
                        const modulation = Math.sin(j * modFreq1 / context.sampleRate * 2 * Math.PI) *
                                         Math.sin(j * modFreq2 / context.sampleRate * 2 * Math.PI);
                        
                        whispersData[i + j] = voicelike * modulation * envelope * amplitude;
                    }
                    
                    // Skip ahead
                    i += whisperLength;
                }
            }
            // Create lava bubbling source
            const lavaBubbleSource = context.createBufferSource();
            lavaBubbleSource.buffer = lavaBubbleBuffer;
            lavaBubbleSource.loop = true;
            
            // Create whispers source
            const whispersSource = context.createBufferSource();
            whispersSource.buffer = whispersBuffer;
            whispersSource.loop = true;
            
            // Create infernal ambience
            const infernalDrone = context.createOscillator();
            infernalDrone.type = 'sawtooth';
            infernalDrone.frequency.value = 35; // Very low frequency for hellish rumble
            
            // Create filters
            const bubbleFilter = context.createBiquadFilter();
            bubbleFilter.type = 'lowpass';
            bubbleFilter.frequency.value = 800;
            bubbleFilter.Q.value = 1;
            
            const whispersFilter = context.createBiquadFilter();
            whispersFilter.type = 'bandpass';
            whispersFilter.frequency.value = 500;
            whispersFilter.Q.value = 2;
            
            const droneFilter = context.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.value = 100;
            droneFilter.Q.value = 8;
            
            // Create gain nodes
            const bubbleGain = context.createGain();
            bubbleGain.gain.value = 0.4;
            
            const whispersGain = context.createGain();
            whispersGain.gain.value = 0.3;
            
            const droneGain = context.createGain();
            droneGain.gain.value = 0.3;
            
            // Create reverb for hellish space
            const convolver = context.createConvolver();
            const reverbBufferSize = context.sampleRate * 3;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Fill reverb buffer with hellish decay
            for (let channel = 0; channel < 2; channel++) {
                const reverbData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    // Create spooky, cavernous reverb
                    reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbBufferSize * 0.3));
                    
                    // Add occasional hellish echoes
                    if (i % Math.floor(reverbBufferSize / 15) === 0) {
                        const echoLength = Math.floor(context.sampleRate * 0.2);
                        for (let j = 0; j < echoLength && i + j < reverbBufferSize; j++) {
                            reverbData[i + j] += Math.sin(j / echoLength * Math.PI) * 0.4;
                        }
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Create master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.5; // Overall volume
            
            // Connect nodes
            lavaBubbleSource.connect(bubbleFilter);
            bubbleFilter.connect(bubbleGain);
            bubbleGain.connect(convolver);
            bubbleGain.connect(masterGain);
            
            whispersSource.connect(whispersFilter);
            whispersFilter.connect(whispersGain);
            whispersGain.connect(convolver);
            whispersGain.connect(masterGain);
            
            infernalDrone.connect(droneFilter);
            droneFilter.connect(droneGain);
            droneGain.connect(convolver);
            droneGain.connect(masterGain);
            
            // Connect convolver to master gain for the reverb effect
            convolver.connect(masterGain);
            
            // Connect master gain to output
            masterGain.connect(context.destination);
            
            // Start sound sources
            lavaBubbleSource.start(context.currentTime);
            whispersSource.start(context.currentTime);
            infernalDrone.start(context.currentTime);
            
            debug(`ArcadeEntity11: Playing Doom-themed hellish ambient sound`);
            
            // This method is typically called for continuous ambient noise
            // Return a function that can be used to stop the ambient noise when needed
            return {
                stop: () => {
                    try {
                        lavaBubbleSource.stop();
                        whispersSource.stop();
                        infernalDrone.stop();
                        
                        // Close context after a short delay
                        setTimeout(() => {
                            context.close();
                            debug(`ArcadeEntity11: Closed ambient sound audio context`);
                        }, 100);
                    } catch (err) {
                        debug(`ArcadeEntity11: Error stopping ambient sound: ${err}`);
                    }
                }
            };
            
        } catch (err) {
            debug(`ArcadeEntity11: Error playing ambient sound: ${err}`);
            return { stop: () => {} }; // Return dummy object if there's an error
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity11: Using Web Audio API for sound generation`);
    }
    
    /**
 * Load game images for the selection screen
 */
loadGameImages() {
    debug(`ArcadeEntity11: Loading game images for Indiana Bones cabinet`); 
    console.log(`🎮 ArcadeEntity11: Loading game images for Indiana Bones cabinet`);
    
    if (!this.games || this.games.length === 0) {
        debug(`ArcadeEntity11: No games to load images for`);
        console.warn(`🎮 ArcadeEntity11: No games to load images for`);
        return;
    }
        
    console.log(`🎮 ArcadeEntity11: Loading images for ${this.games.length} games:`, 
        this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity11: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity11: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity11: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity11: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity11: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity11: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity11: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity11: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity11: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity11: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity11: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity11: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity11: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity11: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity11: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity11: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
    
    const img = new Image();
    img.onload = () => {
        console.log(`🎮 ArcadeEntity11: Successfully loaded alternative image for ${game.title}`);
        game.image = img;
    };
    
    img.onerror = () => {
        console.warn(`🎮 ArcadeEntity11: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity11: Creating canvas fallback image for ${game.title}`);

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
    
    console.log(`🎮 ArcadeEntity11: Fallback image created for ${game.title}`);
}

    /**
     * Play synthwave menu close sound with retro digital power-down sequence
     */
    playMenuCloseSound() {
        debug(`ArcadeEntity11: Starting to play synthwave menu close sound`);
        console.log("🎹 ArcadeEntity11: Starting to play synthwave menu close sound");
        
        try {
            // Create audio context with fallback and ensure user gesture requirement is met
            let context;
            try {
                context = new (window.AudioContext || window.webkitAudioContext)();
                if (context.state === 'suspended') {
                    context.resume().then(() => {
                        console.log("🎮 Audio context resumed successfully");
                    });
                }
                debug(`ArcadeEntity11: Created audio context successfully`);
            } catch (ctxErr) {
                console.error("🎮 ArcadeEntity11: Error creating audio context:", ctxErr);
                return; // Exit early if we can't create context
            }
            
            // ----- RETRO DIGITAL SYSTEM POWER-DOWN -----
            
            // 1. Create digital system shutdown sequence
            const digitalNoise = context.createBufferSource();
            const digitalBuffer = context.createBuffer(1, context.sampleRate * 1.0, context.sampleRate);
            const digitalData = digitalBuffer.getChannelData(0);
            
            // Populate buffer with retro digital shutdown noise
            for (let i = 0; i < digitalData.length; i++) {
                const progress = i / digitalData.length;
                
                // Create glitchy digital power-down effect
                const bitRate = Math.floor(32 - progress * 28); // Decreasing bit rate effect
                const quantizationStep = 1.0 / (Math.pow(2, bitRate) - 1);
                
                // Digital glitch wave with decreasing resolution
                const digitalWave = 0.25 * Math.sin(progress * 2200 + progress * progress * 6000);
                const quantizedWave = Math.round(digitalWave / quantizationStep) * quantizationStep;
                
                // Add random digital artifacts that become more pronounced as system shuts down
                const glitchIntensity = Math.pow(progress, 2) * 0.4; // Increases over time
                const digitalGlitch = (Math.random() * 2 - 1) * glitchIntensity * (Math.random() > 0.8 ? 1 : 0.1);
                
                // Add decreasing clock rate effect
                let clockEffect = 0;
                const clockRate = Math.max(4, 40 * (1 - progress)); // Clock rate drops as we progress
                if (Math.sin(progress * 200 * clockRate) > 0.5) {
                    clockEffect = 0.15 * (1 - progress);
                }
                
                digitalData[i] = quantizedWave + digitalGlitch + clockEffect;
                
                // Add digital "steps" - hard transitions between levels
                if (Math.random() > 0.99) {
                    const stepLength = Math.floor(Math.random() * 200) + 50;
                    const stepValue = (Math.random() * 0.4 - 0.2) * (1 - progress);
                    
                    for (let j = 0; j < stepLength && i + j < digitalData.length; j++) {
                        digitalData[i + j] = stepValue;
                    }
                    i += stepLength - 1; // Skip ahead (but -1 because the loop will increment i)
                }
            }
            
            digitalNoise.buffer = digitalBuffer;
            
            // Digital filter with retro synth characteristics
            const digitalFilter = context.createBiquadFilter();
            digitalFilter.type = 'lowpass';
            digitalFilter.frequency.setValueAtTime(8000, context.currentTime);
            digitalFilter.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.8); // Digital system losing bandwidth
            digitalFilter.Q.value = 4; // Moderate resonance for synth character
            
            // Digital gain envelope - smooth fade out
            const digitalGain = context.createGain();
            digitalGain.gain.setValueAtTime(0.3, context.currentTime);
            digitalGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1); // Quick peak
            digitalGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.9); // Smooth fade
            
            // ----- DEEP ANALOG BASS DROP -----
            
            // 2. Create a massive synthwave bass drop
            const synthBass = context.createOscillator();
            synthBass.type = 'sawtooth'; // Rich harmonics for analog sound
            synthBass.frequency.value = 120; // Start with higher tone
            
            // Add dramatic pitch drop for powerful effect
            synthBass.frequency.setValueAtTime(120, context.currentTime);
            synthBass.frequency.exponentialRampToValueAtTime(35, context.currentTime + 0.6); // Deep bass drop
            
            // Add a second oscillator for richer bass sound
            const synthBass2 = context.createOscillator();
            synthBass2.type = 'square'; // Add different harmonic content
            synthBass2.frequency.value = 120 * 1.01; // Slightly detuned for thickness
            synthBass2.frequency.setValueAtTime(120 * 1.01, context.currentTime);
            synthBass2.frequency.exponentialRampToValueAtTime(35 * 1.01, context.currentTime + 0.6);
            
            // Bass gain - dramatic power-down curve
            const bassGain = context.createGain();
            bassGain.gain.setValueAtTime(0.0, context.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.1); // Fast attack
            bassGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8); // Long decay
            
            const bassGain2 = context.createGain();
            bassGain2.gain.setValueAtTime(0.0, context.currentTime);
            bassGain2.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1);
            bassGain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.75);
            
            // ----- RETRO DIGITAL ARPEGGIO CASCADE -----
            
            // 3. Create falling arpeggio for retro digital cascade effect
            const arpeggioNotes = [880, 659.25, 523.25, 440, 349.23, 261.63, 220]; // A5 to A3 descending
            
            const arpeggiator = context.createBufferSource();
            const arpBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const arpData = arpBuffer.getChannelData(0);
            
            // Create descending arpeggio with digital character
            const noteDuration = arpBuffer.length / arpeggioNotes.length;
            for (let i = 0; i < arpBuffer.length; i++) {
                const noteIndex = Math.floor(i / noteDuration);
                const noteProgress = (i % noteDuration) / noteDuration;
                
                // Only play the note for the first 80% of its duration (create space between notes)
                if (noteProgress < 0.8) {
                    const frequency = arpeggioNotes[Math.min(noteIndex, arpeggioNotes.length - 1)];
                    const oscillation = 0.25 * Math.sin(2 * Math.PI * frequency * i / context.sampleRate);
                    
                    // Add envelope to each note
                    const envelope = Math.sin(Math.PI * noteProgress); // Simple sin envelope
                    
                    // Add some retro digital character
                    const bitReduction = Math.floor(oscillation * 8) / 8; // 3-bit-like effect
                    
                    arpData[i] = bitReduction * envelope * (1 - i / arpBuffer.length); // Overall fade out
                }
            }
            
            arpeggiator.buffer = arpBuffer;
            
            // Arpeggio filter for digital character
            const arpFilter = context.createBiquadFilter();
            arpFilter.type = 'bandpass';
            arpFilter.frequency.value = 2000;
            arpFilter.Q.value = 3;
            
            // Gain for the arpeggiator
            const arpGain = context.createGain();
            arpGain.gain.setValueAtTime(0.0, context.currentTime);
            arpGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.2); // Gradual fade in
            arpGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8); // Smooth fade out
            
            // ----- SYNTHWAVE REVERB EFFECTS -----
            
            // 4. Enhanced reverb for nostalgic synthwave atmosphere
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2.0, context.sampleRate);
            
            // Create synthwave reverb impulse - more 80s gated reverb character
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    const position = i / channelData.length;
                    
                    // Create a gated reverb effect (sharp cutoff)
                    let decayFactor;
                    if (position < 0.6) { // First 60% has normal decay
                        decayFactor = Math.exp(-i / (context.sampleRate * 0.5));
                    } else { // After that, sharp cutoff (gated reverb effect)
                        decayFactor = Math.exp(-i / (context.sampleRate * 0.1));
                    }
                    
                    // Base reverb with some character
                    channelData[i] = (Math.random() * 2 - 1) * decayFactor;
                    
                    // Add some modulation to the reverb for synthwave character
                    if (i > context.sampleRate * 0.1) {
                        channelData[i] += 0.1 * Math.sin(position * 220) * decayFactor;
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Master gain for overall volume
            const masterGain = context.createGain();
            masterGain.gain.value = 0.7;
            
            // Add compressor for that punchy synthwave character
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            compressor.connect(context.destination);
            
            // Connect all components
            digitalNoise.connect(digitalFilter);
            digitalFilter.connect(digitalGain);
            digitalGain.connect(convolver);
            digitalGain.connect(masterGain); // Direct path for clarity
            
            synthBass.connect(bassGain);
            bassGain.connect(convolver);
            bassGain.connect(masterGain);
            
            synthBass2.connect(bassGain2);
            bassGain2.connect(convolver);
            bassGain2.connect(masterGain);
            
            arpeggiator.connect(arpFilter);
            arpFilter.connect(arpGain);
            arpGain.connect(masterGain);
            
            convolver.connect(masterGain);
            masterGain.connect(compressor);
            
            // Play an attention-getting spike with synthwave character
            const attentionSpike = context.createOscillator();
            attentionSpike.type = 'sine';
            attentionSpike.frequency.value = 880; // Higher frequency for synthwave character
            
            const spikeGain = context.createGain();
            spikeGain.gain.setValueAtTime(0.1, context.currentTime);
            spikeGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.08);
            
            attentionSpike.connect(spikeGain);
            spikeGain.connect(masterGain);
            attentionSpike.start();
            attentionSpike.stop(context.currentTime + 0.08);
            
            // Start all synthwave sound components
            console.log("🎹 Starting all synthwave sound components for menu close");
            digitalNoise.start(context.currentTime);
            synthBass.start(context.currentTime);
            synthBass2.start(context.currentTime + 0.01); // Slight offset for richness
            arpeggiator.start(context.currentTime + 0.2); // Start after initial impact
            
            // Stop and clean up after sound completes
            setTimeout(() => {
                try {
                    digitalNoise.stop();
                    synthBass.stop();
                    synthBass2.stop();
                    arpeggiator.stop();
                    context.close();
                    debug(`ArcadeEntity11: Successfully stopped menu close sound components`);
                } catch (stopErr) {
                    console.error("🎮 ArcadeEntity11: Error stopping sound components:", stopErr);
                }
            }, 1200); // Allow for full sound plus reverb tail
            
            debug(`ArcadeEntity11: Successfully played synthwave menu close sound`);
            console.log("🎮 ArcadeEntity11: Successfully played synthwave menu close sound");
        } catch (err) {
            console.error("🎮 ArcadeEntity11: Error playing menu close sound:", err);
            debug(`ArcadeEntity11: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * Play deep, driving synthwave sounds when player enters interaction range
     * Creates a powerful, immersive cyberpunk atmosphere with heavy bass and intense arpeggios
     */
    playProximitySound() {
        try {
            debug(`ArcadeEntity11: Playing deep driving synthwave proximity sound`);
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Compressor to make everything sound tight and punchy
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -24; // Lower threshold for more compression
            compressor.knee.value = 4; // Harder knee for more aggressive sound
            compressor.ratio.value = 12; // High ratio for that pumping effect
            compressor.attack.value = 0.005; // Fast attack
            compressor.release.value = 0.25; // Medium release for that breathing quality
            compressor.connect(context.destination);
            
            // Master gain for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.025; // Reduced by 40% as requested
            masterGain.connect(compressor);
            
            // Create a cavernous reverb effect for massive synthwave atmosphere
            const convolver = context.createConvolver();
            const reverbBufferSize = context.sampleRate * 3.5; // Longer reverb
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Create huge, spacious reverb impulse response
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    // Thicker, slower decay for that massive synth hall sound
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbBufferSize * 0.5));
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Reverb gain - higher for more atmosphere
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.3; // More prominent reverb
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            
            // 1. DEEP SUB-BASS PULSE - The foundation of driving synthwave
            const subOsc = context.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.value = 55; // A1 - very deep bass
            
            // Add a slight pitch envelope for movement
            subOsc.frequency.linearRampToValueAtTime(65, context.currentTime + 0.1); // Pitch up slightly
            subOsc.frequency.linearRampToValueAtTime(55, context.currentTime + 0.2); // Back to root
            subOsc.frequency.linearRampToValueAtTime(35, context.currentTime + 0.4); // Sub-drop
            subOsc.frequency.exponentialRampToValueAtTime(55, context.currentTime + 0.8); // Back to root
            
            // Envelope for the sub bass
            const subGain = context.createGain();
            subGain.gain.setValueAtTime(0, context.currentTime);
            subGain.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.05); // Fast attack
            subGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.3); // Pull back
            subGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8); // Slow decay
            
            // 2. AGGRESSIVE SYNTHWAVE ARPEGGIATOR - Classic 80s synthwave vibe but more intense
            // Minor pentatonic scale in A minor for that darkwave feel
            const synthNotes = [110, 146.83, 164.81, 220, 293.66, 329.63, 440];
            
            // Create a faster, more complex arpeggio pattern
            const arpPattern = [];
            for (let i = 0; i < synthNotes.length; i++) {
                arpPattern.push(synthNotes[i]); // Original octave
                
                // Add some variation with octave jumps for more driving feeling
                if (i % 2 === 0) {
                    arpPattern.push(synthNotes[i] * 2); // One octave up
                }
                if (i % 3 === 0) {
                    arpPattern.push(synthNotes[synthNotes.length - 1 - i]); // Descending notes
                }
            }
            
            const synthOsc = context.createOscillator();
            synthOsc.type = 'sawtooth'; // Classic synthwave tone
            synthOsc.frequency.value = arpPattern[0];
            
            // Create a second oscillator for thickness
            const synthOsc2 = context.createOscillator();
            synthOsc2.type = 'square'; // For harmonic richness
            synthOsc2.frequency.value = arpPattern[0] * 1.005; // Slight detuning for thickness
            
            // Arpeggiator sequence tracking
            let arpIndex = 0;
            const arpSpeed = 60; // 60ms between notes - very fast for driving intensity
            const arpInterval = setInterval(() => {
                arpIndex = (arpIndex + 1) % arpPattern.length;
                const note = arpPattern[arpIndex];
                
                // Update both oscillators for thickness
                synthOsc.frequency.setValueAtTime(note, context.currentTime);
                synthOsc2.frequency.setValueAtTime(note * 1.005, context.currentTime); // Keep slight detuning
            }, arpSpeed);
            
            // Aggressively resonant filter - key to that synthwave sound
            const synthFilter = context.createBiquadFilter();
            synthFilter.type = 'lowpass';
            synthFilter.frequency.setValueAtTime(400, context.currentTime); // Start closed
            synthFilter.frequency.linearRampToValueAtTime(8000, context.currentTime + 0.6); // Open up dramatically
            synthFilter.Q.value = 15; // Extremely resonant for that screaming synth quality
            
            // Gain for the synth arpeggio with rhythmic envelope
            const synthGain = context.createGain();
            synthGain.gain.setValueAtTime(0, context.currentTime);
            synthGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.05);
            
            // 3. MASSIVE ANALOG SAW PAD - For thick atmosphere
            const padOsc = context.createOscillator();
            padOsc.type = 'sawtooth';
            padOsc.frequency.value = 220; // A3
            
            // Create chorus effect with detune for thickness
            const padOsc2 = context.createOscillator();
            padOsc2.type = 'sawtooth';
            padOsc2.frequency.value = 220 * 1.01; // Slightly detuned
            
            const padOsc3 = context.createOscillator();
            padOsc3.type = 'sawtooth';
            padOsc3.frequency.value = 220 * 0.99; // Slightly detuned other direction
            
            // Pad filter for movement
            const padFilter = context.createBiquadFilter();
            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(200, context.currentTime); // Start dark
            padFilter.frequency.exponentialRampToValueAtTime(4000, context.currentTime + 0.8); // Brighten
            padFilter.Q.value = 2; // Mild resonance
            
            // Pad gain envelope
            const padGain = context.createGain();
            padGain.gain.setValueAtTime(0, context.currentTime);
            padGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.3); // Slow attack
            padGain.gain.linearRampToValueAtTime(0.01, context.currentTime + 0.9); // Gradual fade
            
            // 4. DRIVING KICK DRUM - The heartbeat of synthwave
            const kickOsc = context.createOscillator();
            kickOsc.frequency.setValueAtTime(120, context.currentTime); // Start with a high pitch
            kickOsc.frequency.exponentialRampToValueAtTime(35, context.currentTime + 0.1); // Quick pitch drop
            
            const kickGain = context.createGain();
            kickGain.gain.setValueAtTime(0, context.currentTime);
            kickGain.gain.linearRampToValueAtTime(0.9, context.currentTime + 0.01); // Very fast attack
            kickGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3); // Medium decay
            
            // 5. ANALOG NOISE SWEEP - For that vintage synth character
            const noiseBufferSize = context.sampleRate * 1.0;
            const noiseBuffer = context.createBuffer(1, noiseBufferSize, context.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            // Create filtered noise sweep with pattern
            for (let i = 0; i < noiseBufferSize; i++) {
                const progress = i / noiseBufferSize;
                // Create rhythm pattern in the noise
                const patternGain = ((progress * 8) % 1) < 0.5 ? 0.8 : 0.2;
                noiseData[i] = (Math.random() * 2 - 1) * patternGain * (1 - progress * 0.5);
            }
            
            const noiseSource = context.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Sweeping filter on noise
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(300, context.currentTime);
            noiseFilter.frequency.exponentialRampToValueAtTime(8000, context.currentTime + 0.6);
            noiseFilter.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.9);
            noiseFilter.Q.value = 3.0;
            
            const noiseGain = context.createGain();
            noiseGain.gain.setValueAtTime(0, context.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.2);
            noiseGain.gain.linearRampToValueAtTime(0.01, context.currentTime + 0.9);
            
            // CONNECTIONS - Complex signal routing for rich sound
            
            // Subbass path
            subOsc.connect(subGain);
            subGain.connect(masterGain);
            
            // Synth path with both oscillators
            synthOsc.connect(synthFilter);
            synthOsc2.connect(synthFilter);
            synthFilter.connect(synthGain);
            synthGain.connect(convolver); // Heavy reverb on the synth
            synthGain.connect(masterGain); // Direct signal too
            
            // Pad path
            padOsc.connect(padFilter);
            padOsc2.connect(padFilter);
            padOsc3.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(convolver); // Lots of reverb on pad
            padGain.connect(masterGain); // Some direct too
            
            // Kick drum path - mostly direct for punch
            kickOsc.connect(kickGain);
            kickGain.connect(masterGain);
            
            // Noise path
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(convolver); // Some reverb
            noiseGain.connect(masterGain); // Some direct
            
            // Start all sound components
            const startTime = context.currentTime;
            subOsc.start(startTime);
            synthOsc.start(startTime);
            synthOsc2.start(startTime);
            padOsc.start(startTime);
            padOsc2.start(startTime);
            padOsc3.start(startTime);
            kickOsc.start(startTime);
            noiseSource.start(startTime);
            
            // Stop and clean up all sound sources after effect completes
            setTimeout(() => {
                try {
                    // Stop all oscillators
                    subOsc.stop();
                    synthOsc.stop();
                    synthOsc2.stop();
                    padOsc.stop();
                    padOsc2.stop();
                    padOsc3.stop();
                    kickOsc.stop();
                    noiseSource.stop();
                    
                    // Clear intervals
                    clearInterval(arpInterval);
                    
                    // Close context
                    context.close();
                    debug(`ArcadeEntity11: Stopped deep synthwave proximity sound effects`);
                } catch (e) {
                    debug(`ArcadeEntity11: Error during proximity sound cleanup: ${e}`);
                }
            }, 1000); // Longer duration for more impact
            
            debug(`ArcadeEntity11: Played deep, driving synthwave proximity sound sequence`);
        } catch (err) {
            debug(`ArcadeEntity11: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity11: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity11: Using fallback rendering`);
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
            debug(`ArcadeEntity11: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity11: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity11: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        debug(`ArcadeEntity11: Destroying entity and cleaning up event handlers`);
        
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
        debug(`ArcadeEntity11: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity11 instance
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
            // Since we're only showing Indiana Bones, we can use a larger image with 4:3 aspect ratio
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
            const textWidth = overlayCtx.measureText('@gobienan').width;
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
                url: 'https://x.com/gobienan'
            });
            
            console.log('Added ArcadeEntity11 Twitter clickable area:', 
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
        overlayCtx.fillText('@gobienan', width/2 - 0, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@gobienan').width;
        
        // Underline to show it's clickable - using measured width
        overlayCtx.fillRect(width/2 - 0, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Clean up clickable areas when the menu is closed
        if (!this.gameSelectVisible) {
            // Filter out any Twitter clickable areas when the menu is closed
            this.clickableAreas = this.clickableAreas.filter(area => area.type !== 'twitter');
            console.log('Removed ArcadeEntity11 Twitter clickable areas');
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
        debug(`ArcadeEntity11: Checking menu click at ${clientX}, ${clientY}`);
        
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
            debug(`ArcadeEntity11: Ignoring click - too soon after previous click`);
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
            
            debug(`ArcadeEntity11: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity11: Clicked on area: ${area.type}`);
                    
                    // Handle different types of clickable areas
                    switch(area.type) {
                        case 'twitter':
                            // Open the Twitter URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity11: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity11: Preventing duplicate open of Twitter URL: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity11: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity11: Preventing duplicate open of URL: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
        

    }
}

export { ArcadeEntity11 };
