/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity10 extends Entity {
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
                url: 'https://www.vector-tango.com/',
                imagePath: 'assets/Games/Game_14.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_14.png', 'assets/games/Game_14.png']
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
        
        console.log(`ArcadeEntity10: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity10: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_10.png',
            'assets/decor/Arcade_10.png',
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
        debug(`ArcadeEntity10: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity10: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity10: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity10: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity10: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity10: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_10.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity10: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity10: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_10.png`,        // Exact filename with space
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
                debug(`ArcadeEntity10: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity10: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity10: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity10: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity10: Creating fallback asset`);
        
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
            debug(`ArcadeEntity10: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity10: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity10: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity10: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
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
                debug(`ArcadeEntity10: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity10: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity10: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        debug(`ArcadeEntity10: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            debug(`ArcadeEntity10: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity10: Game interaction system not available!`);
        }
        
        // Play sound
        this.playActivateSound();
    }
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity10: Hiding game selection`);
        console.log("🎮 ArcadeEntity10: Hiding game selection and playing close sound");
        
        // Play a sound effect when closing the menu
        try {
            // Explicitly call with proper this context
            this.playMenuCloseSound();
            debug(`ArcadeEntity10: Menu close sound triggered successfully`);
        } catch (err) {
            console.error("🎮 ArcadeEntity10: Error calling playMenuCloseSound:", err);
        }
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity10: Set game interaction state to inactive`);
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
    debug(`ArcadeEntity10: Launching game: ${this.games[this.selectedGameIndex].title}`);
    
    if (this.games.length === 0) {
        debug(`ArcadeEntity10: No games available to launch`);
        return;
    }
        
    // Get the selected game
    const selectedGame = this.games[this.selectedGameIndex];
    debug(`ArcadeEntity10: Launching game: ${selectedGame.title}`);

    // Play launch sound
    this.playLaunchSound();
    
    // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity10: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity10: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    // Static audio context reference for the entire class
    static _activeAudioContexts = [];
    
    /**
     * Play a flight simulator startup sequence when activating the arcade cabinet
     * Simulates aviation sounds, air traffic control, and airport ambience
     */
    playActivateSound() {
        console.log('ArcadeEntity10: Starting NEW aviation sound sequence - STOPPING ALL OTHER SOUNDS');
        
        // Forcibly clean up any active contexts before creating new ones
        try {
            // Clean up our static cache of contexts
            ArcadeEntity10._activeAudioContexts.forEach(ctx => {
                try { 
                    ctx.close(); 
                    console.log('ArcadeEntity10: Closed a previous audio context');
                } catch(e) { 
                    /* ignore close errors */ 
                }
            });
            ArcadeEntity10._activeAudioContexts = [];
            
            // Create audio context for flight simulator startup sequence
            const context = new (window.AudioContext || window.webkitAudioContext)();
            // Store this context in our static array
            ArcadeEntity10._activeAudioContexts.push(context);
            console.log('ArcadeEntity10: Created new aviation sound context');
            
            // Create components for aircraft/cockpit startup sounds
            
            // 1. Systems power-up sound - electronic initialization
            const systemBufferSize = context.sampleRate * 1.0;
            const systemBuffer = context.createBuffer(1, systemBufferSize, context.sampleRate);
            const systemData = systemBuffer.getChannelData(0);
            
            // Fill buffer with electronic system initialization sounds
            for (let i = 0; i < systemBufferSize; i++) {
                const progress = i / systemBufferSize;
                
                // Create digital electronic startup patterns with 20% gain boost
                const digitalPattern = 
                    0.36 * Math.sin(progress * 8000) * Math.exp(-progress * 20) + // Fast initial beep (0.3 → 0.36)
                    0.24 * Math.sin(progress * 4000) * Math.exp(-(progress-0.2) * 10) * (progress > 0.2 ? 1 : 0) + // Second beep (0.2 → 0.24)
                    0.18 * Math.sin(progress * 2000) * Math.exp(-(progress-0.4) * 8) * (progress > 0.4 ? 1 : 0); // Third beep (0.15 → 0.18)
                
                // Add computer/system noise between beeps (20% louder)
                const systemNoise = (Math.random() * 2 - 1) * 0.06 * ( // 0.05 → 0.06
                    (progress < 0.15 || (progress > 0.25 && progress < 0.35) || progress > 0.45) ? 1 : 0.1
                );
                
                // Add aviation radio squelch effects
                const radioSquelch = (progress > 0.3 && progress < 0.32) || (progress > 0.5 && progress < 0.52) ?
                    0.12 * (Math.random() * 2 - 1) * Math.exp(-30 * (Math.pow(progress - (progress > 0.4 ? 0.51 : 0.31), 2))) : 0;
                
                // Terminal/display activation clicks
                const displayClick = (progress > 0.15 && progress < 0.16) || (progress > 0.35 && progress < 0.36) ?
                    0.12 * Math.sin(progress * 12000) * Math.exp(-200 * (Math.pow(progress - (progress > 0.3 ? 0.355 : 0.155), 2))) : 0;
                
                // Combine all aviation electronic system sounds
                systemData[i] = digitalPattern + systemNoise + radioSquelch + displayClick;
            }
            
            // System power-up source
            const systemSource = context.createBufferSource();
            systemSource.buffer = systemBuffer;
            
            // System sound filter for crisp digital character
            const systemFilter = context.createBiquadFilter();
            systemFilter.type = 'bandpass';
            systemFilter.frequency.setValueAtTime(2000, context.currentTime);
            systemFilter.frequency.linearRampToValueAtTime(3500, context.currentTime + 0.5);
            systemFilter.Q.value = 1.0;
            
            // System gain envelope - increased by 20%
            const systemGain = context.createGain();
            systemGain.gain.setValueAtTime(0.24, context.currentTime);
            systemGain.gain.linearRampToValueAtTime(0.36, context.currentTime + 0.1); // Ramp up
            systemGain.gain.setValueAtTime(0.36, context.currentTime + 0.7);
            systemGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.9); // Fade out
            
            // 2. Auxiliary power unit (APU) startup whine
            const apuBufferSize = context.sampleRate * 1.5;
            const apuBuffer = context.createBuffer(1, apuBufferSize, context.sampleRate);
            const apuData = apuBuffer.getChannelData(0);
            
            // Fill buffer with APU turbine spool-up noise
            for (let i = 0; i < apuBufferSize; i++) {
                const progress = i / apuBufferSize;
                
                // Create turbine whine that increases in frequency (20% louder)
                const whineFreq = 30 + progress * 70; // Frequency increases with spool up
                const whineIntensity = Math.min(1.0, progress * 3); // Intensity ramps up
                
                // Combine noise with pitched whine for turbine effect (20% louder)
                const turbineWhine = (
                    (Math.random() * 0.2 - 0.1) * whineIntensity * 1.2 + // Turbine noise component (20% louder)
                    0.24 * Math.sin(progress * whineFreq * 100) * whineIntensity // Whine component (0.2 → 0.24)
                );
                
                // Add jet engine harmonics
                const jetHarmonics = 0.12 * Math.sin(progress * (whineFreq * 1.5) * 100) * 
                                   Math.pow(Math.sin(Math.PI * progress * 2), 2) * 
                                   (progress > 0.3 ? 1 : 0) * whineIntensity;
                
                // Add mechanical startup clicks
                const mechanicalClicks = (Math.random() > 0.97 && progress < 0.4) ? 
                    0.18 * Math.sin(progress * 12000) * Math.exp(-200 * progress) : 0;
                
                // Combine all APU sounds with volume ramp
                apuData[i] = (turbineWhine + jetHarmonics + mechanicalClicks) * 
                             Math.min(1.0, progress * 2); // Overall volume ramp
            }
            
            const apuSource = context.createBufferSource();
            apuSource.buffer = apuBuffer;
            
            // APU filter for turbine characteristics
            const apuFilter = context.createBiquadFilter();
            apuFilter.type = 'bandpass';
            apuFilter.frequency.setValueAtTime(300, context.currentTime);
            apuFilter.frequency.linearRampToValueAtTime(800, context.currentTime + 1.0);
            apuFilter.Q.value = 2.0;
            
            // APU gain envelope - increased by 20%
            const apuGain = context.createGain();
            apuGain.gain.setValueAtTime(0.0, context.currentTime);
            apuGain.gain.linearRampToValueAtTime(0.24, context.currentTime + 0.3); // Delayed start
            apuGain.gain.linearRampToValueAtTime(0.36, context.currentTime + 0.7); // Rise to full power
            apuGain.gain.setValueAtTime(0.36, context.currentTime + 1.0);
            apuGain.gain.linearRampToValueAtTime(0.12, context.currentTime + 1.4); // Sustain at idle
            
            // 3. Cockpit alert chimes and flight computer voice
            const alertBufferSize = context.sampleRate * 1.0;
            const alertBuffer = context.createBuffer(1, alertBufferSize, context.sampleRate);
            const alertData = alertBuffer.getChannelData(0);
            
            // Create alert chimes and faux voice patterns
            for (let i = 0; i < alertBufferSize; i++) {
                const progress = i / alertBufferSize;
                
                // Cockpit chimes - two clear tones - increased by 20%
                const chime1 = (progress > 0.3 && progress < 0.35) ? 
                    0.36 * Math.sin(2 * Math.PI * 1200 * progress) : 0; // 0.3 → 0.36
                const chime2 = (progress > 0.4 && progress < 0.45) ? 
                    0.36 * Math.sin(2 * Math.PI * 1500 * progress) : 0; // 0.3 → 0.36
                
                // Air Traffic Control radio communications (20% louder)
                const atcVoice = (progress > 0.5 && progress < 0.55 || progress > 0.7 && progress < 0.75) ?
                    0.18 * (Math.random() * 2 - 1) * 
                    Math.pow(Math.sin(Math.PI * progress * 8), 2) : 0; // Radio static pattern
                
                // ATC radio squelch and clicks
                const radioSquelch = (progress > 0.48 && progress < 0.5) || (progress > 0.68 && progress < 0.7) ?
                    0.24 * Math.sin(2 * Math.PI * 220 * progress) * 
                    Math.exp(-120 * Math.pow(progress - (progress > 0.6 ? 0.69 : 0.49), 2)) : 0;
                
                // Flight computer voice announcements (just rhythm patterns, not actual speech) - 20% louder
                const voicePattern = (progress > 0.55 && progress < 0.65) ? 
                    0.12 * Math.sin(2 * Math.PI * 600 * progress) * // 0.1 → 0.12
                    Math.pow(Math.sin(2 * Math.PI * 2 * progress), 2) : 0;
                
                // Airport ambient background (terminal announcements, distant aircraft)
                const airportAmbient = 0.06 * (Math.random() * 2 - 1) * // 0.05 → 0.06
                    Math.pow(Math.sin(Math.PI * progress * 0.5), 2) * 
                    (1 - Math.pow(Math.sin(Math.PI * progress * 3), 4));
                
                // Combine all cockpit and aviation sounds
                alertData[i] = chime1 + chime2 + atcVoice + radioSquelch + voicePattern + airportAmbient;
            }
            
            const alertSource = context.createBufferSource();
            alertSource.buffer = alertBuffer;
            
            // Cabin alert gain envelope - increased by 20%
            const alertGain = context.createGain();
            alertGain.gain.setValueAtTime(0.0, context.currentTime);
            alertGain.gain.setValueAtTime(0.0, context.currentTime + 0.5); // Delayed start after systems
            alertGain.gain.linearRampToValueAtTime(0.24, context.currentTime + 0.6);
            alertGain.gain.setValueAtTime(0.24, context.currentTime + 0.8);
            alertGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 1.0);
            
            // 4. Cockpit ambient reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 1.0, context.sampleRate);
            
            // Create enclosed cockpit-like reverb
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Short decay for enclosed cockpit sound
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.05));
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Final output gain - increased by 20%
            const masterGain = context.createGain();
            masterGain.gain.value = 0.36;
            
            // Connect all nodes
            systemSource.connect(systemFilter); // Systems power-up
            systemFilter.connect(systemGain);
            systemGain.connect(convolver); // Route to cockpit reverb
            systemGain.connect(masterGain); // Direct path for clarity
            
            apuSource.connect(apuFilter); // APU startup
            apuFilter.connect(apuGain);
            apuGain.connect(convolver); // Route to cockpit reverb
            apuGain.connect(masterGain);
            
            alertSource.connect(alertGain); // Cockpit alerts
            alertGain.connect(masterGain);
            
            convolver.connect(masterGain); // Add cockpit reverb to output
            masterGain.connect(context.destination);
            
            // Start all sounds with appropriate timing
            systemSource.start(); // Begin system initialization
            apuSource.start(); // Start APU turbine
            alertSource.start(); // Play cockpit alerts
            
            // Stop and clean up after the sequence completes
            // Make the aviation sounds much more prominent and distinct
            masterGain.gain.value = 0.65; // Higher gain to override other sounds
            
            // Add a distinct jet engine sound that clearly identifies it as aviation
            const jetEngine = context.createOscillator();
            jetEngine.type = 'sawtooth';
            jetEngine.frequency.setValueAtTime(120, context.currentTime);
            jetEngine.frequency.linearRampToValueAtTime(180, context.currentTime + 0.5);
            
            const jetFilter = context.createBiquadFilter();
            jetFilter.type = 'bandpass';
            jetFilter.frequency.value = 800;
            jetFilter.Q.value = 2;
            
            const jetGain = context.createGain();
            jetGain.gain.value = 0.4; // Loud jet engine
            
            jetEngine.connect(jetFilter);
            jetFilter.connect(jetGain);
            jetGain.connect(masterGain);
            
            // Start the jet engine with a delay
            setTimeout(() => {
                jetEngine.start();
                console.log('ArcadeEntity10: Jet engine spooling up');
            }, 200);
            
            // Stop all sounds and clean up after the sequence completes
            setTimeout(() => {
                try {
                    console.log('ArcadeEntity10: Stopping all aviation sounds');
                    systemSource.stop();
                    apuSource.stop();
                    alertSource.stop();
                    jetEngine.stop();
                    
                    // Remove this context from our static array
                    const index = ArcadeEntity10._activeAudioContexts.indexOf(context);
                    if (index > -1) {
                        ArcadeEntity10._activeAudioContexts.splice(index, 1);
                    }
                    
                    context.close();
                    debug(`ArcadeEntity10: Flight simulator sound sequence complete`);
                } catch (e) {
                    debug(`ArcadeEntity10: Error during sound cleanup: ${e}`);
                }
            }, 1500); // Allow full completion of the flight simulator startup
            
            debug(`ArcadeEntity10: Played flight simulator startup sequence sound`);
        } catch (err) {
            debug(`ArcadeEntity10: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play cockpit button click sound for menu navigation
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create cockpit button click sound with electronic response
            
            // 1. Primary click/switch sound
            const clickOsc = context.createOscillator();
            clickOsc.type = 'square';
            clickOsc.frequency.value = 440; // Base frequency for button click
            
            // Brief filter sweep for mechanical click characteristic
            const clickFilter = context.createBiquadFilter();
            clickFilter.type = 'bandpass';
            clickFilter.frequency.setValueAtTime(3000, context.currentTime);
            clickFilter.frequency.exponentialRampToValueAtTime(1500, context.currentTime + 0.02);
            clickFilter.Q.value = 2.0;
            
            // Very quick gain envelope for sharp click
            const clickGain = context.createGain();
            clickGain.gain.setValueAtTime(0.0, context.currentTime);
            clickGain.gain.linearRampToValueAtTime(0.07, context.currentTime + 0.005); // Ultra-quick attack
            clickGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.07); // Quick decay
            
            // 2. Electronic acknowledgment beep (autopilot/system response)
            const beepOsc = context.createOscillator();
            beepOsc.type = 'sine';
            beepOsc.frequency.value = 1200; // Higher pitch for acknowledgment
            
            // Brief frequency movement mimicking system response
            beepOsc.frequency.setValueAtTime(1200, context.currentTime + 0.03); // Delayed start
            beepOsc.frequency.linearRampToValueAtTime(900, context.currentTime + 0.08);
            
            const beepGain = context.createGain();
            beepGain.gain.setValueAtTime(0.0, context.currentTime);
            beepGain.gain.setValueAtTime(0.0, context.currentTime + 0.03); // Delay start after click
            beepGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.04);
            beepGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
            
            // 3. Switch mechanism noise (extra realism)
            // Create noise buffer for switch mechanism
            const switchBufferSize = context.sampleRate * 0.1;
            const switchBuffer = context.createBuffer(1, switchBufferSize, context.sampleRate);
            const switchData = switchBuffer.getChannelData(0);
            
            // Fill buffer with switch mechanism noise
            for (let i = 0; i < switchBufferSize; i++) {
                const progress = i / switchBufferSize;
                // More intense at start, then quick falloff for mechanical sound
                if (progress < 0.1) {
                    switchData[i] = (Math.random() * 2 - 1) * 0.6 * (1 - progress * 8);
                } else {
                    switchData[i] = (Math.random() * 2 - 1) * 0.1 * (1 - progress);
                }
            }
            
            const switchNoise = context.createBufferSource();
            switchNoise.buffer = switchBuffer;
            
            const switchFilter = context.createBiquadFilter();
            switchFilter.type = 'bandpass';
            switchFilter.frequency.value = 2000;
            switchFilter.Q.value = 1.0;
            
            const switchGain = context.createGain();
            switchGain.gain.value = 0.03;
            
            // Connect all nodes
            clickOsc.connect(clickFilter);
            clickFilter.connect(clickGain);
            clickGain.connect(context.destination);
            
            beepOsc.connect(beepGain);
            beepGain.connect(context.destination);
            
            switchNoise.connect(switchFilter);
            switchFilter.connect(switchGain);
            switchGain.connect(context.destination);
            
            // Start sound components
            clickOsc.start();
            beepOsc.start();
            switchNoise.start();
            
            // Stop and clean up
            setTimeout(() => {
                clickOsc.stop();
                beepOsc.stop();
                switchNoise.stop();
                context.close();
            }, 200); // Short duration for crisp interface feel
            
            debug(`ArcadeEntity10: Played cockpit button click sound`);
        } catch (err) {
            debug(`ArcadeEntity10: Error playing selection sound: ${err}`);
        }
    }
    
    /**
     * Play a simplified but unmistakable jet aircraft takeoff sound
     * Direct approach for reliability and clear aviation theme
     */
    playLaunchSound() {
        try {
            // Create a brand new audio context with direct instantiation
            const context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('ArcadeEntity10: Created simplified jet takeoff sound');
            
            // Create instantly recognizable jet turbine sound
            // JET ENGINE SPOOL UP - Primary oscillator
            const jetPrimary = context.createOscillator();
            jetPrimary.type = 'sawtooth'; // Sharp jet turbine character
            jetPrimary.frequency.setValueAtTime(80, context.currentTime);
            jetPrimary.frequency.exponentialRampToValueAtTime(250, context.currentTime + 2.0);
            
            // JET ENGINE HARMONIC - Secondary oscillator for realism
            const jetHarmonic = context.createOscillator();
            jetHarmonic.type = 'triangle';
            jetHarmonic.frequency.setValueAtTime(120, context.currentTime);
            jetHarmonic.frequency.exponentialRampToValueAtTime(380, context.currentTime + 1.8);
            
            // NOISE COMPONENT - For air rush sound
            const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                const progress = i / noiseData.length;
                noiseData[i] = (Math.random() * 2 - 1) * Math.min(1.0, progress * 3);
            }
            const noiseSource = context.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // RADIO EFFECT - For ATC communications
            const radioOsc = context.createOscillator();
            radioOsc.type = 'sine';
            radioOsc.frequency.setValueAtTime(800, context.currentTime);
            radioOsc.frequency.setValueAtTime(950, context.currentTime + 0.3);
            radioOsc.frequency.setValueAtTime(700, context.currentTime + 0.6);
            radioOsc.frequency.setValueAtTime(900, context.currentTime + 0.9);
            
            // GAIN CONTROLS - With 20% boost on all components
            const jetPrimaryGain = context.createGain();
            jetPrimaryGain.gain.setValueAtTime(0.0, context.currentTime);
            jetPrimaryGain.gain.linearRampToValueAtTime(0.48, context.currentTime + 0.1); // 0.4 + 20%
            jetPrimaryGain.gain.linearRampToValueAtTime(0.72, context.currentTime + 1.5); // 0.6 + 20%
            
            const jetHarmonicGain = context.createGain();
            jetHarmonicGain.gain.setValueAtTime(0.0, context.currentTime);
            jetHarmonicGain.gain.linearRampToValueAtTime(0.24, context.currentTime + 0.2); // 0.2 + 20%
            jetHarmonicGain.gain.linearRampToValueAtTime(0.36, context.currentTime + 1.7); // 0.3 + 20%
            
            const noiseGain = context.createGain();
            noiseGain.gain.setValueAtTime(0.0, context.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.06, context.currentTime + 0.8); // 0.05 + 20%
            noiseGain.gain.linearRampToValueAtTime(0.36, context.currentTime + 2.0); // 0.3 + 20%
            
            const radioGain = context.createGain();
            radioGain.gain.setValueAtTime(0.0, context.currentTime);
            radioGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.1); // 0.15 + 20%
            radioGain.gain.setValueAtTime(0.0, context.currentTime + 0.25);
            radioGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.3); // 0.15 + 20%
            radioGain.gain.setValueAtTime(0.0, context.currentTime + 0.55);
            radioGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.6); // 0.15 + 20%
            radioGain.gain.setValueAtTime(0.0, context.currentTime + 0.85);
            radioGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.9); // 0.15 + 20%
            radioGain.gain.setValueAtTime(0.0, context.currentTime + 1.15);
            
            // FILTERS - For more realistic sound shaping
            const jetFilter = context.createBiquadFilter();
            jetFilter.type = 'bandpass';
            jetFilter.frequency.value = 800;
            jetFilter.Q.value = 2.0;
            
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;
            
            const radioFilter = context.createBiquadFilter();
            radioFilter.type = 'bandpass';
            radioFilter.frequency.value = 1500;
            radioFilter.Q.value = 5.0;
            
            // MASTER OUTPUT - With 20% boost
            const masterGain = context.createGain();
            masterGain.gain.value = 0.6; // 0.5 + 20%
            
            // CONNECTIONS - For aviation sound path
            jetPrimary.connect(jetFilter);
            jetFilter.connect(jetPrimaryGain);
            jetPrimaryGain.connect(masterGain);
            
            jetHarmonic.connect(jetHarmonicGain);
            jetHarmonicGain.connect(masterGain);
            
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            
            radioOsc.connect(radioFilter);
            radioFilter.connect(radioGain);
            radioGain.connect(masterGain);
            
            masterGain.connect(context.destination);
            
            // START ALL SOUND SOURCES
            jetPrimary.start();
            jetHarmonic.start();
            noiseSource.start();
            radioOsc.start();
            
            console.log('ArcadeEntity10: Started all aviation takeoff sounds');
            
            // STOP AND CLEANUP - After sound completes
            setTimeout(() => {
                try {
                    jetPrimary.stop();
                    jetHarmonic.stop();
                    noiseSource.stop();
                    radioOsc.stop();
                    context.close();
                    console.log('ArcadeEntity10: Completed takeoff sound sequence');
                } catch (e) {
                    console.log('ArcadeEntity10: Error during takeoff sound cleanup:', e);
                }
            }, 3000); // 3 seconds for complete takeoff experience
            
            debug(`ArcadeEntity10: Playing aviation takeoff sound`);
        } catch (err) {
            debug(`ArcadeEntity10: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // Method stub for loading sound effects
        try {
            debug(`ArcadeEntity10: Loading sound effects`);
            // Implementation will be added as needed
        } catch (err) {
            debug(`ArcadeEntity10: Error loading sound effects: ${err}`);
        }
    }
    
    /**
     * Set up load handlers
     */
    onload() {
        try {
            debug(`ArcadeEntity10: Asset loaded successfully`);
            this.hasLoaded = true;
        } catch (err) {
            debug(`ArcadeEntity10: Error in onload: ${err}`);
        }
    }
    
    /**
     * Handle errors during loading
     */
    onerror(err) {
        try {
            debug(`ArcadeEntity10: Error loading asset: ${err}`);
            this.createFallbackAsset();
        } catch (error) {
            debug(`ArcadeEntity10: Error in onerror handler: ${error}`);
        }
    }
    
    /**
     * Play menu close sound
     */
    playMenuCloseSound() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity10._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity10: Playing menu close sound`);
            
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
                        debug(`ArcadeEntity10: Closed menu close sound audio context`);
                    }, 100);
                } catch (err) {
                    debug(`ArcadeEntity10: Error cleaning up menu close sound: ${err}`);
                }
            }, 2000);
            
        } catch (err) {
            debug(`ArcadeEntity10: Error playing menu close sound: ${err}`);
        }
    }
    /**
     * Play activation sound - Doom-themed hellish awakening sequence
     */
    playActivateSound() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity10._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity10: Playing activation sound`);
            
            // Create demonic drone oscillator
            const demonicDrone = context.createOscillator();
            demonicDrone.type = 'sawtooth';
            demonicDrone.frequency.setValueAtTime(60, context.currentTime);
            demonicDrone.frequency.linearRampToValueAtTime(90, context.currentTime + 2.0);
            
            // Create mechanical activation sound
            const mechanical = context.createOscillator();
            mechanical.type = 'square';
            mechanical.frequency.setValueAtTime(140, context.currentTime);
            mechanical.frequency.setValueAtTime(180, context.currentTime + 0.2);
            mechanical.frequency.setValueAtTime(120, context.currentTime + 0.4);
            mechanical.frequency.setValueAtTime(200, context.currentTime + 0.6);
            
            // Create hellfire noise
            const bufferSize = context.sampleRate * 2.5;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            // Generate demonic hellfire noise with increasing intensity
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Create pulsing hellfire effect
                const pulseRate = 2 + progress * 10;
                const pulse = 0.5 + 0.5 * Math.sin(progress * pulseRate);
                
                // Demonic whispers and crackling elements increase over time
                if (Math.random() > 0.7 - progress * 0.4) {
                    noiseData[i] = (Math.random() * 2 - 1) * (0.3 + progress * 0.7) * pulse;
                } else {
                    noiseData[i] = (Math.random() * 2 - 1) * 0.2 * pulse;
                }
            }
            
            const noiseSource = context.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Create infernal ambience
            const infernal = context.createOscillator();
            infernal.type = 'triangle';
            infernal.frequency.setValueAtTime(40, context.currentTime);
            infernal.frequency.linearRampToValueAtTime(70, context.currentTime + 2.0);
            
            // Create filters for each sound component
            const droneFilter = context.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.value = 200;
            droneFilter.Q.value = 5;
            
            const mechFilter = context.createBiquadFilter();
            mechFilter.type = 'bandpass';
            mechFilter.frequency.value = 800;
            mechFilter.Q.value = 1;
            
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 500;
            
            const infernalFilter = context.createBiquadFilter();
            infernalFilter.type = 'lowpass';
            infernalFilter.frequency.value = 100;
            infernalFilter.Q.value = 3;
            
            // Create gain nodes for volume control
            const droneGain = context.createGain();
            droneGain.gain.setValueAtTime(0.0, context.currentTime);
            droneGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.5);
            droneGain.gain.setValueAtTime(0.5, context.currentTime + 1.8);
            droneGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 2.5);
            
            const mechGain = context.createGain();
            mechGain.gain.setValueAtTime(0.0, context.currentTime);
            mechGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1);
            mechGain.gain.setValueAtTime(0.4, context.currentTime + 0.7);
            mechGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 1.0);
            
            const noiseGain = context.createGain();
            noiseGain.gain.setValueAtTime(0.0, context.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.7);
            noiseGain.gain.setValueAtTime(0.3, context.currentTime + 1.5);
            noiseGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 2.5);
            
            const infernalGain = context.createGain();
            infernalGain.gain.setValueAtTime(0.0, context.currentTime);
            infernalGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1.2);
            infernalGain.gain.setValueAtTime(0.3, context.currentTime + 2.0);
            infernalGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 2.5);
            // Create simple reverb for hellish chamber effect
            const convolver = context.createConvolver();
            const reverbBufferSize = context.sampleRate * 3;
            const reverbBuffer = context.createBuffer(2, reverbBufferSize, context.sampleRate);
            
            // Fill reverb buffer with infernal chamber echo
            for (let channel = 0; channel < 2; channel++) {
                const reverbData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < reverbBufferSize; i++) {
                    // Create spooky, cavernous, hellish reverb
                    reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbBufferSize * 0.25));
                    
                    // Add demonic pulses
                    if (i % Math.floor(reverbBufferSize / 20) === 0) {
                        const pulseLength = Math.floor(context.sampleRate * 0.1);
                        for (let j = 0; j < pulseLength && i + j < reverbBufferSize; j++) {
                            reverbData[i + j] = Math.sin(j / pulseLength * Math.PI) * 0.5;
                        }
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Create master gain for final output
            const masterGain = context.createGain();
            masterGain.gain.value = 0.65;
            
            // Connect all audio nodes
            // Drone path
            demonicDrone.connect(droneFilter);
            droneFilter.connect(droneGain);
            droneGain.connect(convolver);
            droneGain.connect(masterGain);
            
            // Mechanical path
            mechanical.connect(mechFilter);
            mechFilter.connect(mechGain);
            mechGain.connect(masterGain);
            
            // Noise path
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(convolver);
            noiseGain.connect(masterGain);
            
            // Infernal path
            infernal.connect(infernalFilter);
            infernalFilter.connect(infernalGain);
            infernalGain.connect(convolver);
            infernalGain.connect(masterGain);
            
            // Reverb to master
            convolver.connect(masterGain);
            
            // Final output
            masterGain.connect(context.destination);
            
            // Start all sound sources
            demonicDrone.start(context.currentTime);
            mechanical.start(context.currentTime);
            noiseSource.start(context.currentTime);
            infernal.start(context.currentTime);
            
            // Cleanup after playback to prevent memory leaks
            setTimeout(() => {
                try {
                    // Stop all sources to prevent lingering sounds
                    demonicDrone.stop();
                    mechanical.stop();
                    noiseSource.stop();
                    infernal.stop();
                    
                    // Close audio context after a delay
                    setTimeout(() => {
                        context.close();
                        debug(`ArcadeEntity10: Closed activation sound audio context`);
                    }, 100);
                    
                } catch (err) {
                    debug(`ArcadeEntity10: Error cleaning up activation sound: ${err}`);
                }
            }, 3000);
            
        } catch (err) {
            debug(`ArcadeEntity10: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play ambient noise for the arcade cabinet
     * Creates a chaotic hellish atmosphere with lava bubbling and demonic whispers
     */
    playAmbientNoise() {
        try {
            // Create audio context
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Add to tracking array for potential cleanup later
            ArcadeEntity10._activeAudioContexts.push(context);
            
            debug(`ArcadeEntity10: Playing ambient hellish atmosphere`);
            
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
            
            debug(`ArcadeEntity10: Playing Doom-themed hellish ambient sound`);
            
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
                            debug(`ArcadeEntity10: Closed ambient sound audio context`);
                        }, 100);
                    } catch (err) {
                        debug(`ArcadeEntity10: Error stopping ambient sound: ${err}`);
                    }
                }
            };
            
        } catch (err) {
            debug(`ArcadeEntity10: Error playing ambient sound: ${err}`);
            return { stop: () => {} }; // Return dummy object if there's an error
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity10: Using Web Audio API for sound generation`);
    }
    
    /**
 * Load game images for the selection screen
 */
loadGameImages() {
    debug(`ArcadeEntity10: Loading game images for Indiana Bones cabinet`); 
    console.log(`🎮 ArcadeEntity10: Loading game images for Indiana Bones cabinet`);
    
    if (!this.games || this.games.length === 0) {
        debug(`ArcadeEntity10: No games to load images for`);
        console.warn(`🎮 ArcadeEntity10: No games to load images for`);
        return;
    }
        
    console.log(`🎮 ArcadeEntity10: Loading images for ${this.games.length} games:`, 
        this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity10: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity10: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity10: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity10: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity10: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity10: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity10: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity10: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity10: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity10: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity10: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity10: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity10: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity10: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity10: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity10: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
    
    const img = new Image();
    img.onload = () => {
        console.log(`🎮 ArcadeEntity10: Successfully loaded alternative image for ${game.title}`);
        game.image = img;
    };
    
    img.onerror = () => {
        console.warn(`🎮 ArcadeEntity10: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity10: Creating canvas fallback image for ${game.title}`);

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
    
    console.log(`🎮 ArcadeEntity10: Fallback image created for ${game.title}`);
}

    /**
     * Play hellish portal closing sound when closing the menu (Doom-themed)
     */
    playMenuCloseSound() {
        debug(`ArcadeEntity10: Starting to play hellish portal closing sound`);
        console.log("🔥 ArcadeEntity10: Starting to play hellish portal closing sound");
        
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
                debug(`ArcadeEntity10: Created audio context successfully`);
            } catch (ctxErr) {
                console.error("🎮 ArcadeEntity10: Error creating audio context:", ctxErr);
                return; // Exit early if we can't create context
            }
            
            // ----- DEMONIC ENERGY DISSIPATION -----
            
            // 1. Create hellish portal closing sound with demonic energy
            const portalNoise = context.createBufferSource();
            const portalBuffer = context.createBuffer(1, context.sampleRate * 1.0, context.sampleRate);
            const portalData = portalBuffer.getChannelData(0);
            
            // Populate buffer with chaotic hellish portal closing noise
            for (let i = 0; i < portalData.length; i++) {
                const progress = i / portalData.length;
                
                // Create chaotic demonic energy dissipation
                const chaosWave = 0.3 * Math.sin(progress * 800 + progress * progress * 5000) * Math.pow(progress, 0.5);
                const hellNoise = (Math.random() * 0.8 - 0.4) * (1.0 - progress) * Math.pow(progress, 0.3);
                
                // Add hellish fluctuations and distortion
                const demonic = chaosWave * (1.0 + 0.2 * Math.sin(progress * 120));
                
                // Add demonic screams (randomly triggered)
                let demonicScream = 0;
                if ((progress > 0.3 && progress < 0.35) || (progress > 0.5 && progress < 0.55) && Math.random() > 0.7) {
                    demonicScream = 0.4 * Math.sin(progress * 2000) * Math.exp(-30 * Math.pow(progress - 0.325, 2));
                }
                
                // Add fading distorted feedback
                const feedback = 0.15 * Math.sin(progress * 1000) * Math.sin(progress * 330) * (1.0 - progress);
                
                portalData[i] = demonic + hellNoise + demonicScream + feedback;
            }
            
            portalNoise.buffer = portalBuffer;
            
            // Hellish portal filter with infernal characteristics
            const portalFilter = context.createBiquadFilter();
            portalFilter.type = 'bandpass';
            portalFilter.frequency.setValueAtTime(1200, context.currentTime);
            portalFilter.frequency.linearRampToValueAtTime(300, context.currentTime + 0.8); // Downward frequency sweep
            portalFilter.Q.value = 2.5; // More resonant for demonic tone
            
            // Demonic portal gain envelope - LOUD hellish sound
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.2, context.currentTime);
            portalGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.1); // Higher peak volume
            portalGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.0); // Longer fade for ominous effect
            
            // ----- DEMONIC IMPACT EFFECTS -----
            
            // 2. Create a MASSIVE demonic impact as the hellish portal seals
            const demonicOsc = context.createOscillator();
            demonicOsc.type = 'sawtooth'; // Harsher waveform for hellish sound
            demonicOsc.frequency.value = 65; // Deep demonic frequency
            
            // Add pitch drop for infernal impact
            demonicOsc.frequency.setValueAtTime(80, context.currentTime + 0.4);
            demonicOsc.frequency.exponentialRampToValueAtTime(30, context.currentTime + 0.6); // Deeper drop for hellish effect
            
            // Add a second oscillator for richer demonic impact
            const demonicOsc2 = context.createOscillator();
            demonicOsc2.type = 'square'; // More distorted waveform
            demonicOsc2.frequency.value = 110;
            demonicOsc2.frequency.setValueAtTime(110, context.currentTime + 0.4);
            demonicOsc2.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.6);
            
            // Demonic impact gain - more aggressive
            const demonicGain = context.createGain();
            demonicGain.gain.setValueAtTime(0.0, context.currentTime);
            demonicGain.gain.setValueAtTime(0.0, context.currentTime + 0.4); // Delayed impact
            demonicGain.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.42); // SHARP attack
            demonicGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.9); // Longer decay for ominous effect
            
            const demonicGain2 = context.createGain();
            demonicGain2.gain.setValueAtTime(0.0, context.currentTime);
            demonicGain2.gain.setValueAtTime(0.0, context.currentTime + 0.4);
            demonicGain2.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.42);
            demonicGain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
            
            // ----- DISTINCTIVE DUST AND DEBRIS -----
            
            // 3. Create hellish mechanical components for demonic portal closure
            const mechanicalNoise = context.createBufferSource();
            const mechanicalBuffer = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate);
            const mechanicalData = mechanicalBuffer.getChannelData(0);
            
            // Create demonic mechanical noises - gears, chains, and infernal machinery
            for (let i = 0; i < mechanicalData.length; i++) {
                const progress = i / mechanicalData.length;
                
                // Base mechanical sound
                let mechanicalEffect = (Math.random() * 0.15 - 0.075) * Math.exp(-progress * 1.5);
                
                // Add hellish machinery sounds with distortion
                if (progress > 0.4 && progress < 0.9 && Math.random() > 0.97) {
                    mechanicalEffect += (Math.random() * 0.3 - 0.15) * Math.sin(progress * 440);
                }
                
                // Add rhythmic infernal mechanical sound
                if (progress > 0.3) {
                    mechanicalEffect += 0.05 * Math.sin(progress * 520) * Math.sin(progress * 13) * (1 - progress);
                }
                
                mechanicalData[i] = mechanicalEffect;
            }
            
            mechanicalNoise.buffer = mechanicalBuffer;
            
            // Filter for hellish mechanical sounds
            const mechanicalFilter = context.createBiquadFilter();
            mechanicalFilter.type = 'bandpass'; // Harsh metallic sound
            mechanicalFilter.frequency.value = 2400; // Higher frequency for metallic sound
            mechanicalFilter.Q.value = 2.5; // More resonant for infernal machinery
            
            // Gain envelope for infernal mechanical sounds
            const mechanicalGain = context.createGain();
            mechanicalGain.gain.setValueAtTime(0.0, context.currentTime);
            mechanicalGain.gain.setValueAtTime(0.0, context.currentTime + 0.5); // Start after the demonic impact
            mechanicalGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.55); // Louder for hellish machinery
            mechanicalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.3); // Longer decay for ominous effect
            
            // ----- HELLISH REVERB EFFECTS -----
            
            // 4. Enhanced echo/reverb for demonic hellish atmosphere
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2.5, context.sampleRate); // Longer reverb
            
            // Create hellish reverb impulse with infernal acoustic pattern
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Create an impulse response that simulates a cavernous hellish dimension
                    const position = i / channelData.length;
                    
                    // Longer, more chaotic decay pattern
                    const decayFactor = Math.exp(-i / (context.sampleRate * 0.8));
                    
                    // Base chaotic reverb
                    channelData[i] = (Math.random() * 2 - 1) * decayFactor;
                    
                    // Add hellish warble effect to the reverb
                    if (i > context.sampleRate * 0.2) {
                        channelData[i] += 0.2 * Math.sin(position * 440) * decayFactor;
                    }
                    
                    // Add occasional demonic echos
                    if (i % (context.sampleRate * 0.15) < 400) {
                        channelData[i] *= 2.5; // Stronger, more intense reflections
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Much higher output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.8; // 4x louder than before
            
            // Connect all components
            portalNoise.connect(portalFilter);
            portalFilter.connect(portalGain);
            portalGain.connect(convolver);
            portalGain.connect(masterGain); // Direct path for clarity
            
            demonicOsc.connect(demonicGain);
            demonicGain.connect(convolver);
            demonicGain.connect(masterGain);
            
            demonicOsc2.connect(demonicGain2);
            demonicGain2.connect(convolver);
            demonicGain2.connect(masterGain);
            
            mechanicalNoise.connect(mechanicalFilter);
            mechanicalFilter.connect(mechanicalGain);
            mechanicalGain.connect(masterGain);
            
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Play an initial "attention-getting" spike to ensure audio is heard
            const attentionSpike = context.createOscillator();
            attentionSpike.type = 'sine';
            attentionSpike.frequency.value = 300;
            
            const spikeGain = context.createGain();
            spikeGain.gain.setValueAtTime(0.05, context.currentTime);
            spikeGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.05);
            
            attentionSpike.connect(spikeGain);
            spikeGain.connect(masterGain);
            attentionSpike.start();
            attentionSpike.stop(context.currentTime + 0.05);
            
            // Start all hellish sound components with slight staggers for a more chaotic effect
            console.log("🔥 Starting all demonic sound components for menu close");
            portalNoise.start(context.currentTime);
            demonicOsc.start(context.currentTime);
            demonicOsc2.start(context.currentTime + 0.01); // Slight offset for more chaotic sound
            mechanicalNoise.start(context.currentTime + 0.02);
            
            // Stop and clean up with longer duration to account for the longer hellish reverb
            setTimeout(() => {
                try {
                    portalNoise.stop();
                    demonicOsc.stop();
                    demonicOsc2.stop();
                    mechanicalNoise.stop();
                    context.close();
                    debug(`ArcadeEntity10: Successfully stopped menu close sound components`);
                } catch (stopErr) {
                    console.error("🎮 ArcadeEntity10: Error stopping sound components:", stopErr);
                }
            }, 1200); // Longer duration to allow the full sound to play out
            
            debug(`ArcadeEntity10: Successfully played ancient temple door closing sound`);
            console.log("🎮 ArcadeEntity10: Successfully played temple door closing sound");
        } catch (err) {
            console.error("🎮 ArcadeEntity10: Error playing menu close sound:", err);
            debug(`ArcadeEntity10: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * Play air traffic control radio chatter when player enters interaction range
     */
    playProximitySound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for air traffic control radio and airport ambience
            
            // 1. Radio static and transmission noise
            const staticBufferSize = context.sampleRate * 0.6;
            const staticBuffer = context.createBuffer(1, staticBufferSize, context.sampleRate);
            const staticData = staticBuffer.getChannelData(0);
            
            // Fill with shaped radio static noise
            for (let i = 0; i < staticBufferSize; i++) {
                const progress = i / staticBufferSize;
                // Create radio transmission pulses pattern
                let pulseIntensity = 0.4;
                
                // Add transmission pulses
                if (i > staticBufferSize * 0.05 && i < staticBufferSize * 0.1 ||
                    i > staticBufferSize * 0.2 && i < staticBufferSize * 0.3 ||
                    i > staticBufferSize * 0.45 && i < staticBufferSize * 0.55) {
                    pulseIntensity = 0.8; // Higher amplitude during "transmission"
                } else {
                    pulseIntensity = 0.2; // Lower during "silence"
                }
                
                // Add shaped noise with pulses
                staticData[i] = (Math.random() * 2 - 1) * pulseIntensity * (1 - progress * 0.4);
            }
            
            // Radio static source
            const radioStatic = context.createBufferSource();
            radioStatic.buffer = staticBuffer;
            
            // Radio static filter to shape the sound like AM/VHF radio
            const radioFilter = context.createBiquadFilter();
            radioFilter.type = 'bandpass';
            radioFilter.frequency.value = 1200; // Voice range frequency
            radioFilter.Q.value = 0.8; // Wider bandwidth for radio sound
            
            // Create gain envelope for radio static
            const radioGain = context.createGain();
            radioGain.gain.setValueAtTime(0.0, context.currentTime);
            radioGain.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.05);
            radioGain.gain.setValueAtTime(0.08, context.currentTime + 0.2);
            radioGain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.3);
            radioGain.gain.setValueAtTime(0.06, context.currentTime + 0.35);
            radioGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
            
            // 2. Airport terminal beep tones (like announcement system)
            const beepOsc = context.createOscillator();
            beepOsc.type = 'sine';
            beepOsc.frequency.value = 880; // Standard announcement beep
            
            const beepGain = context.createGain();
            beepGain.gain.setValueAtTime(0.0, context.currentTime);
            beepGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.01);
            beepGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.1);
            beepGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.12);
            beepGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.2);
            
            // 3. Low aircraft engine rumble in the background
            const rumbleOsc = context.createOscillator();
            rumbleOsc.type = 'sine';
            rumbleOsc.frequency.value = 85; // Low frequency engine rumble
            
            // Create engine rumble noise
            const engineBufferSize = context.sampleRate * 0.4;
            const engineBuffer = context.createBuffer(1, engineBufferSize, context.sampleRate);
            const engineData = engineBuffer.getChannelData(0);
            
            // Fill with shaped engine noise
            for (let i = 0; i < engineBufferSize; i++) {
                const progress = i / engineBufferSize;
                // Create engine drone with slight fluctuations
                engineData[i] = (Math.random() * 0.4 - 0.2) * (1 - progress * 0.6) * 
                               (1 + 0.2 * Math.sin(progress * 30));
            }
            
            const engineNoise = context.createBufferSource();
            engineNoise.buffer = engineBuffer;
            
            // Engine filter for rumble characteristics
            const engineFilter = context.createBiquadFilter();
            engineFilter.type = 'lowpass';
            engineFilter.frequency.value = 200;
            
            const rumbleGain = context.createGain();
            rumbleGain.gain.setValueAtTime(0.0, context.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.1);
            rumbleGain.gain.linearRampToValueAtTime(0.02, context.currentTime + 0.4);
            
            // Connect all components
            radioStatic.connect(radioFilter);
            radioFilter.connect(radioGain);
            radioGain.connect(context.destination);
            
            beepOsc.connect(beepGain);
            beepGain.connect(context.destination);
            
            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(context.destination);
            
            engineNoise.connect(engineFilter);
            engineFilter.connect(rumbleGain);
            
            // Start all sound sources
            radioStatic.start();
            beepOsc.start();
            rumbleOsc.start();
            engineNoise.start();
            
            // Stop all oscillators after effect completes
            setTimeout(() => {
                radioStatic.stop();
                beepOsc.stop();
                rumbleOsc.stop();
                engineNoise.stop();
                context.close();
            }, 700); // Longer for the radio transmission effect
            
            debug(`ArcadeEntity10: Played air traffic control radio chatter on approach`);
        } catch (err) {
            debug(`ArcadeEntity10: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity10: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity10: Using fallback rendering`);
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
            debug(`ArcadeEntity10: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity10: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity10: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        debug(`ArcadeEntity10: Destroying entity and cleaning up event handlers`);
        
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
        debug(`ArcadeEntity10: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity10 instance
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
            const textWidth = overlayCtx.measureText('@scobelverse').width;
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
                url: 'https://x.com/scobelverse'
            });
            
            console.log('Added ArcadeEntity10 Twitter clickable area:', 
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
        overlayCtx.fillText('@scobelverse', width/2 - 0, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@scobelverse').width;
        
        // Underline to show it's clickable - using measured width
        overlayCtx.fillRect(width/2 - 0, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Clean up clickable areas when the menu is closed
        if (!this.gameSelectVisible) {
            // Filter out any Twitter clickable areas when the menu is closed
            this.clickableAreas = this.clickableAreas.filter(area => area.type !== 'twitter');
            console.log('Removed ArcadeEntity10 Twitter clickable areas');
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
        debug(`ArcadeEntity10: Checking menu click at ${clientX}, ${clientY}`);
        
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
            debug(`ArcadeEntity10: Ignoring click - too soon after previous click`);
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
            
            debug(`ArcadeEntity10: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity10: Clicked on area: ${area.type}`);
                    
                    // Handle different types of clickable areas
                    switch(area.type) {
                        case 'twitter':
                            // Open the Twitter URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity10: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity10: Preventing duplicate open of Twitter URL: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity10: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity10: Preventing duplicate open of URL: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
        

    }
}

export { ArcadeEntity10 };
