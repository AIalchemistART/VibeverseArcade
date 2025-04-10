/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity8 extends Entity {
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_2', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_8', options = {}) {
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
        this.scaleX = .40;
        this.scaleY = .40;
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
                url: 'https://indiana-bones.vercel.app/',
                imagePath: 'assets/Games/Game_12.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_12.png', 'assets/games/Game_12.png']
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
        
        console.log(`ArcadeEntity8: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity8: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_8.png',
            'assets/decor/Arcade_8.png',
            './assets/decor/Arcade_8.png',
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
        debug(`ArcadeEntity8: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity8: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity8: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity8: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity8: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity8: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_8.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity8: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity8: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_8.png`,        // Exact filename with space
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
                debug(`ArcadeEntity8: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity8: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity8: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity8: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity8: Creating fallback asset`);
        
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
            debug(`ArcadeEntity8: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity8: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity8: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity8: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
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
                debug(`ArcadeEntity8: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity8: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity8: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        debug(`ArcadeEntity8: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            debug(`ArcadeEntity8: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity8: Game interaction system not available!`);
        }
        
        // Play sound
        this.playActivateSound();
    }
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity8: Hiding game selection`);
        console.log("🎮 ArcadeEntity8: Hiding game selection and playing close sound");
        
        // Play a sound effect when closing the menu
        try {
            // Explicitly call with proper this context
            this.playMenuCloseSound();
            debug(`ArcadeEntity8: Menu close sound triggered successfully`);
        } catch (err) {
            console.error("🎮 ArcadeEntity8: Error calling playMenuCloseSound:", err);
        }
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity8: Set game interaction state to inactive`);
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
    debug(`ArcadeEntity8: Launching game: ${this.games[this.selectedGameIndex].title}`);
    
    if (this.games.length === 0) {
        debug(`ArcadeEntity8: No games available to launch`);
        return;
    }
        
    // Get the selected game
    const selectedGame = this.games[this.selectedGameIndex];
    debug(`ArcadeEntity8: Launching game: ${selectedGame.title}`);

    // Play launch sound
    this.playLaunchSound();
    
    // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity8: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity8: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    /**
     * Play an ancient temple door opening sound when activating the arcade cabinet
     */
    playActivateSound() {
        try {
            // Create audio context for ancient temple door sound
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create nodes for ancient stone door opening components
            
            // 1. Stone grinding/scraping sound (door opening) using noise
            const bufferSize = 2 * context.sampleRate;
            const stoneNoiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const stoneOutput = stoneNoiseBuffer.getChannelData(0);
            
            // Fill buffer with noise - shaped for stone grinding
            for (let i = 0; i < bufferSize; i++) {
                // More consistent noise for stone grinding with some pulsing
                const progress = i / bufferSize;
                const pulseEffect = 0.7 + 0.3 * Math.sin(progress * 20);
                stoneOutput[i] = (Math.random() * 0.5 - 0.25) * pulseEffect * Math.pow(1 - progress, 0.8);
            }
            
            // Create noise source from buffer
            const stoneNoise = context.createBufferSource();
            stoneNoise.buffer = stoneNoiseBuffer;
            
            // Create filter for stone grinding sound shaping
            const stoneFilter = context.createBiquadFilter();
            stoneFilter.type = 'bandpass';
            stoneFilter.frequency.setValueAtTime(150, context.currentTime);
            stoneFilter.frequency.linearRampToValueAtTime(300, context.currentTime + 0.5);
            stoneFilter.Q.value = 1.5;
            
            // Stone grinding gain envelope
            const stoneGain = context.createGain();
            stoneGain.gain.setValueAtTime(0.02, context.currentTime); // Start quiet
            stoneGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.1); // Ramp up
            stoneGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.4); // Sustain
            stoneGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8); // Fade out
            
            // 2. Low rumble/vibration (ancient power awakening)
            const rumbleOsc = context.createOscillator();
            rumbleOsc.type = 'sine';
            rumbleOsc.frequency.value = 40; // Very low frequency for temple rumble
            
            const rumbleGain = context.createGain();
            rumbleGain.gain.setValueAtTime(0.0, context.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.2);
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.0);
            
            // 3. Mystical chimes and resonance (magical energies)
            const chimeOsc = context.createOscillator();
            chimeOsc.type = 'sine';
            chimeOsc.frequency.setValueAtTime(900, context.currentTime + 0.3); // Delayed start
            chimeOsc.frequency.linearRampToValueAtTime(1200, context.currentTime + 0.4);
            chimeOsc.frequency.linearRampToValueAtTime(800, context.currentTime + 0.6);
            
            const chimeGain = context.createGain();
            chimeGain.gain.setValueAtTime(0.0, context.currentTime);
            chimeGain.gain.setValueAtTime(0.0, context.currentTime + 0.3); // Delay start
            chimeGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.4);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.9);
            
            // 4. Cavernous reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
            
            // Create temple cavern reverb impulse
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Long decay for cavernous sound
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.5));
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Final output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.25;
            
            // Connect all nodes
            stoneNoise.connect(stoneFilter);
            stoneFilter.connect(stoneGain);
            stoneGain.connect(convolver);
            stoneGain.connect(masterGain); // Direct path for clarity
            
            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(masterGain);
            
            chimeOsc.connect(chimeGain);
            chimeGain.connect(masterGain);
            
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start sources
            stoneNoise.start();
            rumbleOsc.start();
            chimeOsc.start();
            
            // Stop and clean up
            setTimeout(() => {
                stoneNoise.stop();
                rumbleOsc.stop();
                chimeOsc.stop();
                context.close();
            }, 1000); // Longer duration for the temple door effect
            
            debug(`ArcadeEntity8: Played ancient temple door activation sound`);
        } catch (err) {
            debug(`ArcadeEntity8: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play a magical artifact selection sound for menu navigation
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create mystical chime sound (primary tone)
            const chimeOsc = context.createOscillator();
            chimeOsc.type = 'sine';
            chimeOsc.frequency.value = 880; // A5 note
            
            // Modulate the frequency for magical quality
            chimeOsc.frequency.setValueAtTime(880, context.currentTime);
            chimeOsc.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.15); // Upward sweep
            
            // Create gain envelope for the chime
            const chimeGain = context.createGain();
            chimeGain.gain.setValueAtTime(0.0, context.currentTime);
            chimeGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.03); // Quick attack
            chimeGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3); // Longer decay for magical trail
            
            // Create crystal-like harmonic (secondary tone)
            const crystalOsc = context.createOscillator();
            crystalOsc.type = 'triangle';
            crystalOsc.frequency.value = 1320; // Musical fifth above primary
            
            // Create gain envelope for crystal tone
            const crystalGain = context.createGain();
            crystalGain.gain.setValueAtTime(0.0, context.currentTime);
            crystalGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.02); // Fast attack
            crystalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2); // Medium decay
            
            // Create gentle shimmer effect (high frequency sparkle)
            const shimmerOsc = context.createOscillator();
            shimmerOsc.type = 'sine';
            shimmerOsc.frequency.value = 3520; // Very high note for shimmer
            
            // Modulate shimmer for more magical quality
            shimmerOsc.frequency.setValueAtTime(3520, context.currentTime);
            shimmerOsc.frequency.linearRampToValueAtTime(2640, context.currentTime + 0.1);
            
            const shimmerGain = context.createGain();
            shimmerGain.gain.setValueAtTime(0.0, context.currentTime);
            shimmerGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.01); // Very quick attack
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); // Short decay
            
            // Create filters for better tone shaping
            const chimeFilter = context.createBiquadFilter();
            chimeFilter.type = 'lowpass';
            chimeFilter.frequency.value = 3000;
            chimeFilter.Q.value = 1.0;
            
            // Connect all nodes
            chimeOsc.connect(chimeFilter);
            chimeFilter.connect(chimeGain);
            chimeGain.connect(context.destination);
            
            crystalOsc.connect(crystalGain);
            crystalGain.connect(context.destination);
            
            shimmerOsc.connect(shimmerGain);
            shimmerGain.connect(context.destination);
            
            // Start oscillators
            chimeOsc.start();
            crystalOsc.start();
            shimmerOsc.start();
            
            // Stop and clean up
            setTimeout(() => {
                chimeOsc.stop();
                crystalOsc.stop();
                shimmerOsc.stop();
                context.close();
            }, 300); // Longer duration for magical trail
            
            debug(`ArcadeEntity8: Played magical artifact selection sound`);
        } catch (err) {
            debug(`ArcadeEntity8: Error playing selection sound: ${err}`);
        }
    }
    
    /**
     * Play an epic treasure discovery fanfare for game launch
     */
    playLaunchSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for a magnificent treasure discovery fanfare
            
            // 1. Create the initial treasure chest opening creaking sound
            const creakBufferSize = context.sampleRate * 0.5; // 0.5 seconds
            const creakBuffer = context.createBuffer(1, creakBufferSize, context.sampleRate);
            const creakData = creakBuffer.getChannelData(0);
            
            // Fill creak buffer with wood creaking noise
            for (let i = 0; i < creakBufferSize; i++) {
                const progress = i / creakBufferSize;
                // Shaped noise for wooden creak effect
                const creakIntensity = Math.sin(progress * Math.PI) * 0.7;
                const modulation = Math.sin(progress * 60) * 0.3;
                creakData[i] = (Math.random() * 0.5 - 0.25) * creakIntensity * (1 + modulation);
            }
            
            const creak = context.createBufferSource();
            creak.buffer = creakBuffer;
            
            // Creak filter for wood resonance
            const creakFilter = context.createBiquadFilter();
            creakFilter.type = 'bandpass';
            creakFilter.frequency.value = 450;
            creakFilter.Q.value = 2.0;
            
            // Creak gain envelope
            const creakGain = context.createGain();
            creakGain.gain.setValueAtTime(0.0, context.currentTime);
            creakGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.1);
            creakGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5);
            
            // 2. Create the main treasure reveal chord/fanfare
            // Base chord components with perfect fifth and major third
            const baseNote = 220; // A3
            
            // Create triumphant brass-like chord (root, fifth, octave)
            const rootOsc = context.createOscillator();
            rootOsc.type = 'sawtooth';
            rootOsc.frequency.value = baseNote;
            
            const fifthOsc = context.createOscillator();
            fifthOsc.type = 'sawtooth';
            fifthOsc.frequency.value = baseNote * 1.5; // Perfect fifth
            
            const octaveOsc = context.createOscillator();
            octaveOsc.type = 'sawtooth';
            octaveOsc.frequency.value = baseNote * 2; // Octave
            
            // Add third for major chord quality
            const thirdOsc = context.createOscillator();
            thirdOsc.type = 'sawtooth';
            thirdOsc.frequency.value = baseNote * 1.25; // Major third
            
            // Create tone filter for brass-like quality
            const brassFilter = context.createBiquadFilter();
            brassFilter.type = 'lowpass';
            brassFilter.frequency.setValueAtTime(800, context.currentTime + 0.3);
            brassFilter.frequency.linearRampToValueAtTime(2000, context.currentTime + 0.5);
            brassFilter.Q.value = 1.0;
            
            // Gain nodes for chord components
            const chordGain = context.createGain();
            chordGain.gain.setValueAtTime(0.0, context.currentTime);
            chordGain.gain.setValueAtTime(0.0, context.currentTime + 0.3); // Delay start until after creak
            chordGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.5); // Rise up
            chordGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.8); // Sustain
            chordGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.8); // Fade out
            
            // 3. Create magical shimmer/sparkle effect for the treasure
            const shimmerBufferSize = context.sampleRate * 1.5;
            const shimmerBuffer = context.createBuffer(1, shimmerBufferSize, context.sampleRate);
            const shimmerData = shimmerBuffer.getChannelData(0);
            
            // Fill shimmer buffer with golden sparkle noise
            for (let i = 0; i < shimmerBufferSize; i++) {
                const progress = i / shimmerBufferSize;
                // Create random sparkles with time-varying density
                if (Math.random() < 0.1 * (1 - Math.pow(progress, 0.5))) {
                    // When a sparkle occurs, create a short envelope
                    for (let j = 0; j < 300 && i + j < shimmerBufferSize; j++) {
                        shimmerData[i + j] = (Math.random() * 2 - 1) * Math.exp(-j / 50) * 0.4;
                    }
                    i += 300; // Skip ahead to avoid overlapping sparkles
                } else {
                    shimmerData[i] = 0;
                }
            }
            
            const shimmer = context.createBufferSource();
            shimmer.buffer = shimmerBuffer;
            
            // Shimmer filter for sparkling high frequencies
            const shimmerFilter = context.createBiquadFilter();
            shimmerFilter.type = 'highpass';
            shimmerFilter.frequency.value = 4000;
            
            // Shimmer gain
            const shimmerGain = context.createGain();
            shimmerGain.gain.setValueAtTime(0.0, context.currentTime);
            shimmerGain.gain.setValueAtTime(0.0, context.currentTime + 0.4); // Delay start
            shimmerGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.6); // Rise after chord
            shimmerGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 1.2); // Fade slowly
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.0); // Complete fade
            
            // 4. Create low rumble/bass boom when treasure is revealed
            const boomOsc = context.createOscillator();
            boomOsc.type = 'sine';
            boomOsc.frequency.value = 60; // Very low frequency
            
            // Boom gain envelope
            const boomGain = context.createGain();
            boomGain.gain.setValueAtTime(0.0, context.currentTime);
            boomGain.gain.setValueAtTime(0.0, context.currentTime + 0.3); // Delay start
            boomGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.4); // Quick rise
            boomGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2); // Slow fade
            
            // 5. Add cathedral-like reverb for epic atmosphere
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 3, context.sampleRate);
            
            // Create grand cathedral reverb impulse
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Long decay with some early reflections for cathedral sound
                    const progress = i / channelData.length;
                    // Add early reflections
                    if (i % (context.sampleRate * 0.1) < 50) {
                        channelData[i] = (Math.random() * 2 - 1) * 0.7;
                    } else {
                        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-progress * 5) * 0.5;
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Master gain for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.25;
            
            // Connect all nodes
            
            // Creak path
            creak.connect(creakFilter);
            creakFilter.connect(creakGain);
            creakGain.connect(masterGain);
            
            // Chord fanfare path
            rootOsc.connect(brassFilter);
            fifthOsc.connect(brassFilter);
            octaveOsc.connect(brassFilter);
            thirdOsc.connect(brassFilter);
            brassFilter.connect(chordGain);
            chordGain.connect(convolver);
            chordGain.connect(masterGain); // Direct path for clarity
            
            // Shimmer path
            shimmer.connect(shimmerFilter);
            shimmerFilter.connect(shimmerGain);
            shimmerGain.connect(masterGain);
            
            // Boom path
            boomOsc.connect(boomGain);
            boomGain.connect(masterGain);
            
            // Connect reverb to output
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start all sound sources
            creak.start();
            rootOsc.start();
            fifthOsc.start();
            octaveOsc.start();
            thirdOsc.start();
            shimmer.start();
            boomOsc.start();
            
            // Stop and clean up
            setTimeout(() => {
                creak.stop();
                rootOsc.stop();
                fifthOsc.stop();
                octaveOsc.stop();
                thirdOsc.stop();
                shimmer.stop();
                boomOsc.stop();
                context.close();
            }, 2000); // Longer duration for the epic fanfare
            
            debug(`ArcadeEntity8: Played epic treasure discovery fanfare`);
        } catch (err) {
            debug(`ArcadeEntity8: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity8: Using Web Audio API for sound generation`);
    }
    
    /**
 * Load game images for the selection screen
 */
loadGameImages() {
    debug(`ArcadeEntity8: Loading game images for Indiana Bones cabinet`); 
    console.log(`🎮 ArcadeEntity8: Loading game images for Indiana Bones cabinet`);
    
    if (!this.games || this.games.length === 0) {
        debug(`ArcadeEntity8: No games to load images for`);
        console.warn(`🎮 ArcadeEntity8: No games to load images for`);
            return;
        }
        
        console.log(`🎮 ArcadeEntity8: Loading images for ${this.games.length} games:`, 
            this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity8: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity8: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity8: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity8: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity8: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity8: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity8: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity8: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity8: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity8: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity8: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity8: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity8: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity8: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity8: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
    console.log(`🎮 ArcadeEntity8: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
    
    const img = new Image();
    img.onload = () => {
        console.log(`🎮 ArcadeEntity8: Successfully loaded alternative image for ${game.title}`);
        game.image = img;
    };
    
    img.onerror = () => {
        console.warn(`🎮 ArcadeEntity8: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity8: Creating canvas fallback image for ${game.title}`);

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
    
    console.log(`🎮 ArcadeEntity8: Fallback image created for ${game.title}`);
}

    /**
     * Play an ancient temple door closing sound when closing the menu
     * This version is louder and more distinctive than the previous implementation
     */
    playMenuCloseSound() {
        debug(`ArcadeEntity8: Starting to play menu close sound`);
        console.log("🎮 ArcadeEntity8: Starting to play menu close sound");
        
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
                debug(`ArcadeEntity8: Created audio context successfully`);
            } catch (ctxErr) {
                console.error("🎮 ArcadeEntity8: Error creating audio context:", ctxErr);
                return; // Exit early if we can't create context
            }
            
            // ----- GREATLY ENHANCED STONE DOOR SOUND -----
            
            // 1. Create a LOUD stone door closing sound with dramatic movement
            const stoneNoise = context.createBufferSource();
            const stoneBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const stoneData = stoneBuffer.getChannelData(0);
            
            // Populate buffer with noise shaped for a dramatic stone door closing
            for (let i = 0; i < stoneData.length; i++) {
                const progress = i / stoneData.length;
                
                // Make the stone sound more dramatic with stronger textures and variations
                const stoneTexture = 0.8 + 0.5 * Math.sin(progress * 100) + 0.3 * Math.sin(progress * 233);
                
                // Add some cracking/grinding sound as the door closes
                let crackEffect = 0;
                if (progress > 0.2 && progress < 0.6 && Math.random() > 0.92) {
                    crackEffect = (Math.random() * 0.5 - 0.25); // Random cracking sounds
                }
                
                // Combine effects for a richer sound
                stoneData[i] = (
                    (Math.random() * 0.3 - 0.15) * stoneTexture * Math.pow(1-progress, 0.4) + 
                    crackEffect
                ) * (1.2 - progress * 0.7); // Gradual fade out
            }
            
            stoneNoise.buffer = stoneBuffer;
            
            // Heavy stone filter with resonance
            const stoneFilter = context.createBiquadFilter();
            stoneFilter.type = 'bandpass';
            stoneFilter.frequency.setValueAtTime(300, context.currentTime);
            stoneFilter.frequency.linearRampToValueAtTime(80, context.currentTime + 0.6);
            stoneFilter.Q.value = 2.0; // More resonant for a heavier feel
            
            // Stone door gain envelope - MUCH LOUDER
            const stoneGain = context.createGain();
            stoneGain.gain.setValueAtTime(0.05, context.currentTime);
            stoneGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1); // Higher peak volume
            stoneGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.7);
            
            // ----- DRAMATIC IMPACT THUD -----
            
            // 2. Create a MASSIVE thud component for the door settling into place
            const thudOsc = context.createOscillator();
            thudOsc.type = 'sine';
            thudOsc.frequency.value = 60; // Lower frequency for deeper impact
            
            // Add some pitch drop for more dramatic impact
            thudOsc.frequency.setValueAtTime(90, context.currentTime + 0.35);
            thudOsc.frequency.exponentialRampToValueAtTime(40, context.currentTime + 0.5);
            
            // Add a second oscillator for richer impact
            const thudOsc2 = context.createOscillator();
            thudOsc2.type = 'triangle';
            thudOsc2.frequency.value = 120;
            thudOsc2.frequency.setValueAtTime(120, context.currentTime + 0.35);
            thudOsc2.frequency.exponentialRampToValueAtTime(60, context.currentTime + 0.5);
            
            // Much stronger impact
            const thudGain = context.createGain();
            thudGain.gain.setValueAtTime(0.0, context.currentTime);
            thudGain.gain.setValueAtTime(0.0, context.currentTime + 0.35); // Delay the thud
            thudGain.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.37); // SHARP attack
            thudGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8); // Long decay
            
            const thudGain2 = context.createGain();
            thudGain2.gain.setValueAtTime(0.0, context.currentTime);
            thudGain2.gain.setValueAtTime(0.0, context.currentTime + 0.35);
            thudGain2.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.37);
            thudGain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
            
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
            const masterGain = context.createGain();
            masterGain.gain.value = 0.8; // 4x louder than before
            
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
            thudGain2.connect(masterGain);
            
            dustNoise.connect(dustFilter);
            dustFilter.connect(dustGain);
            dustGain.connect(masterGain);
            
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
            
            // Start all sound components with slight staggers for naturalness
            console.log("🎮 Starting all sound components for menu close");
            stoneNoise.start(context.currentTime);
            thudOsc.start(context.currentTime);
            thudOsc2.start(context.currentTime + 0.01); // Slight offset for richer sound
            dustNoise.start(context.currentTime + 0.02);
            
            // Stop and clean up with longer duration to account for the longer reverb
            setTimeout(() => {
                try {
                    stoneNoise.stop();
                    thudOsc.stop();
                    thudOsc2.stop();
                    dustNoise.stop();
                    context.close();
                    debug(`ArcadeEntity8: Successfully stopped menu close sound components`);
                } catch (stopErr) {
                    console.error("🎮 ArcadeEntity8: Error stopping sound components:", stopErr);
                }
            }, 1200); // Longer duration to allow the full sound to play out
            
            debug(`ArcadeEntity8: Successfully played ancient temple door closing sound`);
            console.log("🎮 ArcadeEntity8: Successfully played temple door closing sound");
        } catch (err) {
            console.error("🎮 ArcadeEntity8: Error playing menu close sound:", err);
            debug(`ArcadeEntity8: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * Play a treasure discovery sound when player enters interaction range
     */
    playProximitySound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for treasure discovery/sparkle sound
            
            // 1. Magical chime sound (treasure discovery)
            const chimeOsc = context.createOscillator();
            chimeOsc.type = 'sine';
            chimeOsc.frequency.setValueAtTime(1200, context.currentTime);
            chimeOsc.frequency.exponentialRampToValueAtTime(1800, context.currentTime + 0.15);
            
            const chimeFilter = context.createBiquadFilter();
            chimeFilter.type = 'bandpass';
            chimeFilter.frequency.value = 1500;
            chimeFilter.Q.value = 8;
            
            const chimeGain = context.createGain();
            chimeGain.gain.setValueAtTime(0.0, context.currentTime);
            chimeGain.gain.linearRampToValueAtTime(0.07, context.currentTime + 0.05);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
            
            // 2. Sparkling high frequency sounds (treasure glint)
            const sparkleOsc = context.createOscillator();
            sparkleOsc.type = 'triangle';
            sparkleOsc.frequency.setValueAtTime(2000, context.currentTime);
            sparkleOsc.frequency.linearRampToValueAtTime(3000, context.currentTime + 0.05);
            sparkleOsc.frequency.linearRampToValueAtTime(2500, context.currentTime + 0.1);
            sparkleOsc.frequency.linearRampToValueAtTime(3500, context.currentTime + 0.15);
            
            const sparkleFilter = context.createBiquadFilter();
            sparkleFilter.type = 'highpass';
            sparkleFilter.frequency.value = 2000;
            sparkleFilter.Q.value = 5;
            
            const sparkleGain = context.createGain();
            sparkleGain.gain.setValueAtTime(0.0, context.currentTime);
            sparkleGain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.05);
            sparkleGain.gain.linearRampToValueAtTime(0.01, context.currentTime + 0.2);
            sparkleGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.25);
            sparkleGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.4);
            
            // 3. Low mystery tone (ancient artifact awakening)
            const mysteryOsc = context.createOscillator();
            mysteryOsc.type = 'sine';
            mysteryOsc.frequency.value = 180;
            
            const mysteryFilter = context.createBiquadFilter();
            mysteryFilter.type = 'lowpass';
            mysteryFilter.frequency.value = 300;
            
            const mysteryGain = context.createGain();
            mysteryGain.gain.setValueAtTime(0.0, context.currentTime);
            mysteryGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.1);
            mysteryGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.4);
            
            // Connect all components
            chimeOsc.connect(chimeFilter);
            chimeFilter.connect(chimeGain);
            chimeGain.connect(context.destination);
            
            sparkleOsc.connect(sparkleFilter);
            sparkleFilter.connect(sparkleGain);
            sparkleGain.connect(context.destination);
            
            mysteryOsc.connect(mysteryFilter);
            mysteryFilter.connect(mysteryGain);
            mysteryGain.connect(context.destination);
            
            // Start oscillators
            chimeOsc.start();
            sparkleOsc.start();
            mysteryOsc.start();
            
            // Stop all oscillators after effect completes
            setTimeout(() => {
                chimeOsc.stop();
                sparkleOsc.stop();
                mysteryOsc.stop();
                context.close();
            }, 500); // Slightly longer duration for the magical effect
            
            debug(`ArcadeEntity8: Played treasure discovery sound on approach`);
        } catch (err) {
            debug(`ArcadeEntity8: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity8: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity8: Using fallback rendering`);
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
            debug(`ArcadeEntity8: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity8: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity8: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        debug(`ArcadeEntity8: Destroying entity and cleaning up event handlers`);
        
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
        debug(`ArcadeEntity8: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity8 instance
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
            const textWidth = overlayCtx.measureText('@lukevanin').width;
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
                url: 'https://x.com/lukevanin'
            });
            
            console.log('Added ArcadeEntity8 Twitter clickable area:', 
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
        overlayCtx.fillText('@lukevanin', width/2 - 0, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@lukevanin').width;
        
        // Underline to show it's clickable - using measured width
        overlayCtx.fillRect(width/2 - 0, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Clean up clickable areas when the menu is closed
        if (!this.gameSelectVisible) {
            // Filter out any Twitter clickable areas when the menu is closed
            this.clickableAreas = this.clickableAreas.filter(area => area.type !== 'twitter');
            console.log('Removed ArcadeEntity8 Twitter clickable areas');
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
        debug(`ArcadeEntity8: Checking menu click at ${clientX}, ${clientY}`);
        
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
            debug(`ArcadeEntity8: Ignoring click - too soon after previous click`);
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
            
            debug(`ArcadeEntity8: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity8: Clicked on area: ${area.type}`);
                    
                    // Handle different types of clickable areas
                    switch(area.type) {
                        case 'twitter':
                            // Open the Twitter URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity8: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity8: Preventing duplicate open of Twitter URL: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab with URL tracking
                            if (area.url) {
                                // Check if this URL was recently opened
                                if (!this._openedUrls[area.url]) {
                                    debug(`ArcadeEntity8: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    
                                    // Mark this URL as opened and set timeout to clear it
                                    this._openedUrls[area.url] = true;
                                    setTimeout(() => {
                                        this._openedUrls[area.url] = false;
                                    }, 2000);
                                    
                                    // Save the last click time
                                    this._lastClickTime = Date.now();
                                } else {
                                    debug(`ArcadeEntity8: Preventing duplicate open of URL: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
        

    }
}

export { ArcadeEntity8 };
