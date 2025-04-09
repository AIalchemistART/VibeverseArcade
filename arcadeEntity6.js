/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative third arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity6 extends Entity {
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_6', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_6', options = {}) {
        // Create an arcade with standard settings as a static entity
        super(x, y, 2.0, 2.0, {
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
        this.interactionRadius = 4;
        this.arcadeId = options.arcadeId || 'arcade6-' + Math.floor(Math.random() * 10000);
        
        // Visual properties
        this.glowColor = '#00FFFF';
        this.glowIntensity = 5;
        this.maxGlowIntensity = 15;
        this.glowSpeed = 0.1;
        this.glowDirection = 1;
        this.scaleX = .57;
        this.scaleY = .57;
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
        
        // Use games from options if provided, otherwise use a fallback
        this.games = options.games || [
            { 
                title: 'Vibe Disc', 
                description: 'A disc golf game',
                url: 'https://vibedisc.com/',
                imagePath: 'assets/Games/Game_10.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_10.png', 'assets/games/Game_10.png']
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
        
        console.log(`ArcadeEntity6: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity6: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_6.png',
            'assets/decor/Arcade_6.png',
            './assets/decor/Arcade_6.png',
            '/assets/decor/Arcade_6.png',
            window.location.origin + '/assets/decor/Arcade%206.png',
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
        debug(`ArcadeEntity6: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity6: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity6: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity6: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity6: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity6: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_6.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity6: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity6: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_6.png`,        // Exact filename with space
            `./assets/decor/Arcade_6.png`,      // With leading ./ and space
            `assets/decor/Arcade%206.png`,      // URL encoded space
            `assets/decor/Arcade-6.png`,        // Hyphen instead of space
            `assets/decor/Arcade6.png`,         // No space
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
                debug(`ArcadeEntity6: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity6: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity6: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity6: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity6: Creating fallback asset`);
        
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
            debug(`ArcadeEntity6: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity6: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity6: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity6: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
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
                debug(`ArcadeEntity6: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity6: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity6: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        console.log(`ArcadeEntity6: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            console.log(`ArcadeEntity6: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity6: Game interaction system not available!`);
        }
        
        // Play sound
        console.log('ArcadeEntity6: About to call playActivateSound...');
        this.playActivateSound();
        console.log('ArcadeEntity6: Called playActivateSound');
    }
    
    /**
     * Hide game selection menu
     */
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity6: Hiding game selection`);
        
        // Play a sound effect when closing the menu
        this.playMenuCloseSound();
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity6: Set game interaction state to inactive`);
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
            overlayCanvas.parentElement.removeChild(overlayCanvas);
        }
        
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
        
        // Clean up clickable areas when the menu is closed
        if (this.clickableAreas && this.clickableAreas.length > 0) {
            // Filter out any Twitter clickable areas when the menu is closed
            this.clickableAreas = this.clickableAreas.filter(area => area.type !== 'twitter');
            console.log('ArcadeEntity6: Removed Twitter clickable areas');
        }
    }
    
    /**
     * Launch the selected game
     */
    launchGame() {
        debug(`ArcadeEntity6: Launching game: ${this.games[this.selectedGameIndex].title}`);
        
        if (this.games.length === 0) {
            debug(`ArcadeEntity6: No games available to launch`);
            return;
        }
        
        // Get the selected game
        const selectedGame = this.games[this.selectedGameIndex];
        debug(`ArcadeEntity6: Launching game: ${selectedGame.title}`);
        
        // Play launch sound
        this.playLaunchSound();
        
        // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity6: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity6: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    /**
     * Play morning wilderness awakening sounds when powering on the arcade cabinet
     * Creates an immersive daybreak sequence with forest ambience, birds, gentle streams and adventure preparation
     */
    playActivateSound() {
        console.log('ArcadeEntity6: playActivateSound called - creating outdoor morning wilderness sound');
        try {
            // Create audio context for morning wilderness awakening sequence
            const context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('ArcadeEntity6: AudioContext created, state:', context.state);
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('ArcadeEntity6: AudioContext is suspended, attempting to resume');
                context.resume().then(() => {
                    console.log('ArcadeEntity6: AudioContext resumed successfully');
                }).catch(err => {
                    console.error('ArcadeEntity6: Error resuming AudioContext:', err);
                });
            }
            
            // Create a master gain node for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.4; // Moderate volume for the entire sound sequence
            masterGain.connect(context.destination);
            
            // Create a convolver for reverb (outdoor forest environment)
            const convolver = context.createConvolver();
            const convolverBuffer = context.createBuffer(2, context.sampleRate * 0.5, context.sampleRate);
            
            // Create reverb impulse response for outdoor forest clearing
            for (let channel = 0; channel < 2; channel++) {
                const data = convolverBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    // Create natural forest reverb with open air quality
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.1)) * 0.5;
                }
            }
            convolver.buffer = convolverBuffer;
            
            // Reverb gain control
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.3; // Good amount of reverb for open space
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            
            // 1. Morning breeze (foundation layer)
            const breezeOsc = context.createOscillator();
            breezeOsc.type = 'sine'; // Smooth wind sound
            breezeOsc.frequency.setValueAtTime(220, context.currentTime); // Base frequency
            breezeOsc.frequency.linearRampToValueAtTime(280, context.currentTime + 0.3); // Rising wind

            // Breeze filter
            const breezeFilter = context.createBiquadFilter();
            breezeFilter.type = 'lowpass';
            breezeFilter.frequency.setValueAtTime(800, context.currentTime);
            breezeFilter.frequency.linearRampToValueAtTime(1200, context.currentTime + 0.5);
            
            // Breeze modulation
            const breezeLFO = context.createOscillator();
            breezeLFO.type = 'sine';
            breezeLFO.frequency.value = 2.5; // Slow natural modulation
            
            const breezeLFOGain = context.createGain();
            breezeLFOGain.gain.value = 30; // Amount of breeze variation
            
            // Breeze gain envelope
            const breezeGain = context.createGain();
            breezeGain.gain.setValueAtTime(0, context.currentTime);
            breezeGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.3); // Fade in
            breezeGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.7); // Slight decrease
            
            // Connect breeze components
            breezeLFO.connect(breezeLFOGain);
            breezeLFOGain.connect(breezeOsc.frequency);
            breezeOsc.connect(breezeFilter);
            breezeFilter.connect(breezeGain);
            breezeGain.connect(masterGain);
            breezeGain.connect(convolver);
            
            // 2. Bird chirps (sporadic morning birds)
            const birdBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const birdData = birdBuffer.getChannelData(0);
            
            // Generate random bird chirps
            for (let i = 0; i < birdData.length; i++) {
                const progress = i / birdData.length;
                const birdDensity = Math.min(0.5, progress * 1.5);
                
                if (Math.random() < 0.003 * birdDensity) {
                    const chirpLength = Math.floor(context.sampleRate * 0.05);
                    const chirpFreq = 2000 + Math.random() * 1500;
                    
                    for (let j = 0; j < chirpLength && (i + j) < birdData.length; j++) {
                        const chirpEnvelope = Math.sin(Math.PI * j / chirpLength);
                        birdData[i + j] = Math.sin(2 * Math.PI * chirpFreq * j / context.sampleRate) * 0.3 * chirpEnvelope;
                    }
                    
                    i += chirpLength - 1;
                }
            }
            
            const birdSource = context.createBufferSource();
            birdSource.buffer = birdBuffer;
            
            const birdGain = context.createGain();
            birdGain.gain.setValueAtTime(0, context.currentTime);
            birdGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.4);
            
            // Connect bird sounds
            birdSource.connect(birdGain);
            birdGain.connect(masterGain);
            birdGain.connect(convolver);
            
            // 3. Stream sounds (gentle water background)
            const waterBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const waterData = waterBuffer.getChannelData(0);
            
            for (let i = 0; i < waterData.length; i++) {
                const progress = i / waterData.length;
                waterData[i] = (Math.random() * 2 - 1) * Math.min(0.2, progress * 0.3);
            }
            
            const waterSource = context.createBufferSource();
            waterSource.buffer = waterBuffer;
            
            const waterFilter = context.createBiquadFilter();
            waterFilter.type = 'bandpass';
            waterFilter.frequency.value = 600;
            waterFilter.Q.value = 1.0;
            
            const waterGain = context.createGain();
            waterGain.gain.setValueAtTime(0, context.currentTime);
            waterGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.3);
            
            // Connect water sounds
            waterSource.connect(waterFilter);
            waterFilter.connect(waterGain);
            waterGain.connect(masterGain);
            waterGain.connect(convolver);
            
            // 4. Equipment preparation sounds
            const equipmentSounds = [
                { type: 'zip', startTime: 0.2, duration: 0.15, frequency: 800 },
                { type: 'clink', startTime: 0.4, duration: 0.05, frequency: 1200 },
                { type: 'rustle', startTime: 0.6, duration: 0.2, frequency: 500 }
            ];
            
            const equipmentOscs = [];
            const equipmentGains = [];
            
            for (const sound of equipmentSounds) {
                const osc = context.createOscillator();
                
                if (sound.type === 'zip') {
                    osc.type = 'sawtooth';
                } else if (sound.type === 'clink') {
                    osc.type = 'triangle';
                } else { // rustle
                    osc.type = 'sine';
                }
                
                osc.frequency.value = sound.frequency;
                
                const gain = context.createGain();
                gain.gain.setValueAtTime(0, context.currentTime);
                gain.gain.setValueAtTime(0, context.currentTime + sound.startTime);
                
                if (sound.type === 'zip') {
                    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + sound.startTime + 0.02);
                    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + sound.startTime + sound.duration - 0.02);
                    gain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                } else if (sound.type === 'clink') {
                    gain.gain.linearRampToValueAtTime(0.15, context.currentTime + sound.startTime + 0.005);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + sound.startTime + sound.duration);
                } else { // rustle
                    gain.gain.linearRampToValueAtTime(0.1, context.currentTime + sound.startTime + 0.05);
                    gain.gain.linearRampToValueAtTime(0.05, context.currentTime + sound.startTime + sound.duration - 0.05);
                    gain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                }
                
                // Connect equipment sounds
                osc.connect(gain);
                gain.connect(masterGain);
                gain.connect(convolver);
                
                equipmentOscs.push(osc);
                equipmentGains.push(gain);
            }
            
            // Start all sound sources
            console.log('ArcadeEntity6: Starting all wilderness sounds');
            breezeOsc.start();
            breezeLFO.start();
            birdSource.start();
            waterSource.start();
            
            for (const osc of equipmentOscs) {
                osc.start();
            }
            
            // Stop and clean up after sequence completes
            setTimeout(() => {
                console.log('ArcadeEntity6: Stopping wilderness sounds');
                breezeOsc.stop();
                breezeLFO.stop();
                
                for (const osc of equipmentOscs) {
                    osc.stop();
                }
                
                // Close context after a short delay
                setTimeout(() => {
                    context.close();
                    console.log('ArcadeEntity6: Audio context closed');
                }, 100);
            }, 800); // Total duration for activation sequence
            
            console.log('ArcadeEntity6: Morning wilderness sound sequence created and playing');
            debug(`ArcadeEntity6: Played morning wilderness awakening sound effect`);
        } catch (err) {
            console.error('ArcadeEntity6: Error playing activation sound:', err);
            debug(`ArcadeEntity6: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play outdoor equipment and trail map selection sounds when changing menu options
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Main trail map rustle/unfold sound
            const mapOsc = context.createOscillator();
            mapOsc.type = 'triangle'; // Softer edge for paper sound
            mapOsc.frequency.setValueAtTime(800, context.currentTime); // Higher pitch for paper
            mapOsc.frequency.linearRampToValueAtTime(600, context.currentTime + 0.04); // Quick paper movement
            
            // Map rustle envelope - crisp attack but natural decay
            const mapGain = context.createGain();
            mapGain.gain.setValueAtTime(0.0, context.currentTime);
            mapGain.gain.linearRampToValueAtTime(0.39, context.currentTime + 0.01); // 30% increase from original 0.3
            mapGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); // Slightly longer decay
            
            // 2. Compass click/GPS beep navigation tool sounds
            const navOsc = context.createOscillator();
            navOsc.type = 'sine'; // Clean electronic tone for GPS/compass
            navOsc.frequency.setValueAtTime(1200, context.currentTime + 0.01); // Slightly delayed
            navOsc.frequency.setValueAtTime(1800, context.currentTime + 0.03); // Quick jump up
            navOsc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.08); // Return to base
            
            // Navigation tool envelope
            const navGain = context.createGain();
            navGain.gain.setValueAtTime(0.0, context.currentTime);
            navGain.gain.setValueAtTime(0.0, context.currentTime + 0.01); // Delay start slightly
            navGain.gain.linearRampToValueAtTime(0.195, context.currentTime + 0.02); // 30% increase from original 0.15
            navGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12); // Medium decay
            
            // Filter for electronic navigation sound
            const navFilter = context.createBiquadFilter();
            navFilter.type = 'bandpass';
            navFilter.frequency.value = 1500;
            navFilter.Q.value = 4.0; // Sharp resonance for electronic beep
            
            // 3. Natural marker sound (twig snap/stone drop)
            const markerOsc = context.createOscillator();
            markerOsc.type = 'triangle';
            markerOsc.frequency.setValueAtTime(800, context.currentTime + 0.03); // Higher pitch twig snap
            markerOsc.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.08); // Quick drop
            
            // Natural marker envelope
            const markerGain = context.createGain();
            markerGain.gain.setValueAtTime(0.0, context.currentTime);
            markerGain.gain.setValueAtTime(0.0, context.currentTime + 0.03); // Delayed start
            markerGain.gain.linearRampToValueAtTime(0.195, context.currentTime + 0.04); // 30% increase from original 0.15
            markerGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12); // Shorter decay
            
            // Band-pass filter for natural wood/stone sounds
            const markerFilter = context.createBiquadFilter();
            markerFilter.type = 'bandpass';
            markerFilter.frequency.value = 500;
            markerFilter.Q.value = 1.0; // Natural resonance
            
            // 4. Equipment adjustment sounds (backpack/gear adjustment)
            const gearBuffer = context.createBuffer(1, context.sampleRate * 0.15, context.sampleRate);
            const gearData = gearBuffer.getChannelData(0);
            
            // Fill buffer with noise, shaped to sound like outdoor equipment rustling
            for (let i = 0; i < gearBuffer.length; i++) {
                const progress = i / gearBuffer.length;
                
                // Create rustling fabric/nylon sound for outdoor gear
                if (progress > 0.01 && progress < 0.1) { // Longer, more organic texture
                    // Fabric rustling with some randomness
                    const rustleRate = 200; // Slower rustling frequency
                    const rustleBase = Math.sin(progress * rustleRate * Math.PI * 2) * 0.3;
                    // Add some random crinkles
                    const crinkle = (Math.random() * 2 - 1) * 0.5;
                    gearData[i] = (rustleBase + crinkle * (progress > 0.05 ? 0.6 : 0.2)) * 0.39; // 30% increase from original 0.3
                } else {
                    gearData[i] = 0; // Silent elsewhere
                }
            }
            
            const gear = context.createBufferSource();
            gear.buffer = gearBuffer;
            
            const gearGain = context.createGain();
            gearGain.gain.value = 0.104; // 30% increase from original 0.08
            
            // Small amount of outdoor reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 0.2, context.sampleRate);
            const leftChannel = reverbBuffer.getChannelData(0);
            const rightChannel = reverbBuffer.getChannelData(1);
            
            // Create short decay impulse response - open forest/trail environment
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.7, i / (context.sampleRate * 0.05)); // Slightly longer decay for outdoor space
                leftChannel[i] = (Math.random() * 2 - 1) * decay;
                rightChannel[i] = (Math.random() * 2 - 1) * decay;
            }
            convolver.buffer = reverbBuffer;
            
            // Master output
            const masterGain = context.createGain();
            masterGain.gain.value = 0.26; // 30% increase from original 0.2
            
            // Connect everything
            mapOsc.connect(mapGain);
            navOsc.connect(navFilter);
            navFilter.connect(navGain);
            markerOsc.connect(markerFilter);
            markerFilter.connect(markerGain);
            gear.connect(gearGain);
            
            mapGain.connect(convolver);
            navGain.connect(convolver);
            markerGain.connect(convolver);
            gearGain.connect(convolver);
            
            mapGain.connect(masterGain); // Direct signals
            navGain.connect(masterGain);
            markerGain.connect(masterGain);
            gearGain.connect(masterGain);
            convolver.connect(masterGain); // Reverb
            
            masterGain.connect(context.destination);
            
            // Start all sound sources
            mapOsc.start();
            navOsc.start();
            markerOsc.start();
            gear.start();
            
            // Stop after sound completes
            setTimeout(() => {
                mapOsc.stop();
                navOsc.stop();
                markerOsc.stop();
                gear.stop();
                context.close();
            }, 350); // Slightly longer for natural sounds
            
            debug(`ArcadeEntity6: Played outdoor equipment selection sound`);
        } catch (err) {
            debug(`ArcadeEntity6: Error playing selection sound: ${err}`);
        }
    }
    
    /**
     * Play an outdoor adventure launch sound effect for game start
     * A wilderness-themed sequence with morning forest ambience, bird calls, and a trail start signal
     */
    playLaunchSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for an inspiring outdoor adventure start sequence
            
            // 1. Morning forest ambience (foundation of the effect)
            const windOsc = context.createOscillator();
            windOsc.type = 'sine'; // Smooth wind sound
            windOsc.frequency.setValueAtTime(80, context.currentTime); // Low wind tone
            windOsc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.8); // Light breeze grows
            windOsc.frequency.exponentialRampToValueAtTime(120, context.currentTime + 1.5); // Stronger morning breeze
            
            // Wind modulation for realistic forest breeze pattern
            const breezeOsc = context.createOscillator();
            breezeOsc.type = 'triangle';
            breezeOsc.frequency.setValueAtTime(0.3, context.currentTime); // Slow breeze pattern
            breezeOsc.frequency.linearRampToValueAtTime(0.8, context.currentTime + 1.0); // Gradually intensifies
            
            const breezeGain = context.createGain();
            breezeGain.gain.setValueAtTime(10, context.currentTime); // Initial breeze intensity
            breezeGain.gain.linearRampToValueAtTime(15, context.currentTime + 1.5); // Growing intensity
            
            // Connect breeze modulation to wind frequency
            breezeOsc.connect(breezeGain);
            breezeGain.connect(windOsc.frequency);
            
            // Wind sound filter for natural outdoors feel
            const windFilter = context.createBiquadFilter();
            windFilter.type = 'lowshelf';
            windFilter.frequency.setValueAtTime(200, context.currentTime);
            windFilter.gain.value = 8; // Boost low end for authentic wind sound
            
            // 2. Bird calls and forest awakening sounds
            const birdOsc = context.createOscillator();
            birdOsc.type = 'sine';
            birdOsc.frequency.setValueAtTime(800, context.currentTime); // Starting pitch for early bird calls
            birdOsc.frequency.linearRampToValueAtTime(1200, context.currentTime + 0.8); // Morning bird songs rise
            birdOsc.frequency.linearRampToValueAtTime(1400, context.currentTime + 1.5); // More birds join in
            birdOsc.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 2.5); // Stabilize into daytime calls
            
            const birdFilter = context.createBiquadFilter();
            birdFilter.type = 'bandpass';
            birdFilter.frequency.setValueAtTime(1200, context.currentTime);
            birdFilter.frequency.linearRampToValueAtTime(2000, context.currentTime + 1.5);
            birdFilter.Q.value = 5.0; // More resonant for bird-like whistles and calls
            
            // 3. Trail guide sequence with nature calls and wilderness start signals
            // First impact - Trail guide's "Adventure awaits!"
            const guideReady = context.createBufferSource();
            const guideReadyBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
            const guideReadyData = guideReadyBuffer.getChannelData(0);
            
            for (let i = 0; i < guideReadyData.length; i++) {
                const progress = i / guideReadyData.length;
                // Create a vocal-like formant by combining frequencies
                const baseFreq = 130; // Guide voice fundamental (slightly lower pitch)
                const formant1 = Math.sin(2 * Math.PI * baseFreq * progress);
                const formant2 = Math.sin(2 * Math.PI * baseFreq * 2.5 * progress) * 0.45;
                const formant3 = Math.sin(2 * Math.PI * baseFreq * 3.8 * progress) * 0.15;
                
                // Amplitude envelope to shape the "Adventure awaits" phrase
                const phraseEnvelope = progress < 0.3 ? 
                    Math.sin(progress / 0.3 * Math.PI) * 0.9 : // "Adven-" 
                    (progress < 0.6 ? 
                        Math.sin((progress - 0.3) / 0.3 * Math.PI * 2) * 0.8 : // "-ture a-"
                        Math.sin((progress - 0.6) / 0.4 * Math.PI) * 0.7); // "-waits"
                
                guideReadyData[i] = (formant1 + formant2 + formant3) * phraseEnvelope * 0.35;
            }
            guideReady.buffer = guideReadyBuffer;
            
            // Second impact - Wooden stick tap signal (first warning)
            const woodTap1 = context.createBufferSource();
            const woodTap1Buffer = context.createBuffer(1, context.sampleRate * 0.3, context.sampleRate);
            const woodTap1Data = woodTap1Buffer.getChannelData(0);
            
            for (let i = 0; i < woodTap1Data.length; i++) {
                const progress = i / woodTap1Data.length;
                // Wooden tap sound - a sharp, natural wooden impact
                const woodFreq = 220; // Base frequency for wood
                const woodTone = Math.sin(2 * Math.PI * woodFreq * progress) * 0.3 + 
                                Math.sin(2 * Math.PI * woodFreq * 3.5 * progress) * 0.2 + 
                                Math.sin(2 * Math.PI * woodFreq * 5 * progress) * 0.1;
                                
                // Short, wooden tap envelope with natural decay
                const envelope = progress < 0.02 ? progress / 0.02 : 
                                Math.pow(0.2, (progress - 0.02) * 8);
                                
                woodTap1Data[i] = woodTone * envelope;
            }
            woodTap1.buffer = woodTap1Buffer;
            
            // Third impact - Final hiking whistle GO signal!
            const whistleGo = context.createBufferSource();
            const whistleGoBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const whistleGoData = whistleGoBuffer.getChannelData(0);
            
            for (let i = 0; i < whistleGoData.length; i++) {
                const progress = i / whistleGoData.length;
                // Bright, clear hiking whistle for trail start
                const whistleFreq = 1800; // High pitched wilderness guide whistle
                const whistleTone = Math.sin(2 * Math.PI * whistleFreq * progress) * 0.6 + 
                                 Math.sin(2 * Math.PI * whistleFreq * 1.01 * progress) * 0.3 + // Slight detuning for realism
                                 Math.sin(2 * Math.PI * whistleFreq * 2 * progress) * 0.1;
                                
                // Characteristic wilderness guide whistle pattern - two short blasts
                const envelope = progress < 0.1 ? 
                               Math.sin(progress / 0.1 * Math.PI) : // First blast
                               (progress > 0.2 && progress < 0.3 ? 
                                Math.sin((progress - 0.2) / 0.1 * Math.PI) : // Second blast
                                0);
                                
                whistleGoData[i] = whistleTone * envelope * 0.8; // Distinct whistle sound
            }
            whistleGo.buffer = whistleGoBuffer;
            
            // 4. Wilderness ambient sounds (rising with dawn)
            const forestBufferSize = context.sampleRate * 3; // 3 seconds of forest ambience
            const forestBuffer = context.createBuffer(2, forestBufferSize, context.sampleRate); // Stereo
            const forestLeft = forestBuffer.getChannelData(0);
            const forestRight = forestBuffer.getChannelData(1);
            
            // Fill forest buffer with layered nature sounds that build up
            for (let i = 0; i < forestBufferSize; i++) {
                const progress = i / forestBufferSize;
                const daybreakIntensity = Math.min(1.0, progress * 1.5); // Rises steadily as day breaks
                
                // Time variable for various oscillations
                const t = i / context.sampleRate;
                
                // Base forest noise - gentle rustling leaves and undergrowth
                let forestNoise = (Math.random() * 2 - 1) * 0.15; 
                
                // Add some rhythmic rustling at various frequencies
                const leafRustle = Math.sin(2 * Math.PI * 0.8 * t) > 0.7 ? 0.08 : 0.02;
                
                // Add occasional wildlife sounds that become more frequent with daybreak
                const randomSoundThreshold = 0.997 - daybreakIntensity * 0.03;
                const randomSound = Math.random() > randomSoundThreshold ? 0.15 : 0;
                
                // Combine elements with intensity that increases over time
                const combinedForest = (forestNoise + leafRustle + randomSound) * daybreakIntensity;
                
                // Add flowing water sounds in the distance
                const waterSounds = (
                    Math.sin(2 * Math.PI * 60 * t + Math.random() * 0.1) * 0.05 + // Low water bubbling
                    Math.sin(2 * Math.PI * 90 * t + Math.random() * 0.2) * 0.03 + // Mid water flow
                    Math.sin(2 * Math.PI * 120 * t + Math.random() * 0.3) * 0.01   // High water splashes
                ) * 0.2 * (0.4 + daybreakIntensity);
                
                // Create wide stereo field for immersion
                // Left and right channels have different random elements for realistic forest soundscape
                const leftRandom = Math.random() * 0.05;
                const rightRandom = Math.random() * 0.05;
                
                forestLeft[i] = combinedForest * (0.85 + leftRandom) + waterSounds * (1.0 + Math.sin(t * 0.3) * 0.3);
                forestRight[i] = combinedForest * (0.85 + rightRandom) + waterSounds * (0.8 + Math.cos(t * 0.3) * 0.3);
            }
            
            const forest = context.createBufferSource();
            forest.buffer = forestBuffer;
            
            const forestFilter = context.createBiquadFilter();
            forestFilter.type = 'bandpass';
            forestFilter.frequency.value = 800; // Natural forest sound range
            forestFilter.Q.value = 0.7; // Wider bandwidth for natural forest sounds
            
            // 5. Forest path sounds and adventure equipment effects
            const trailBufferSize = context.sampleRate * 3; // 3 seconds of wilderness trail effects
            const trailBuffer = context.createBuffer(1, trailBufferSize, context.sampleRate);
            const trailData = trailBuffer.getChannelData(0);
            
            // Create increasing wilderness sound effects as adventure begins
            for (let i = 0; i < trailBufferSize; i++) {
                const progress = i / trailBufferSize;
                const intensity = Math.min(1.0, progress * 1.5); // Increases in intensity
                
                // Add random footsteps, gear rustling, and branch snaps based on intensity
                if (Math.random() < 0.03 * intensity) {
                    // When a trail sound occurs, make it last for a short time
                    const effectLength = Math.floor(context.sampleRate * (0.05 + Math.random() * 0.15)); // 50-200ms effect
                    const maxAmp = 0.25 * (0.3 + Math.random() * 0.7) * intensity; // Varying amplitudes
                    
                    // Choose between footsteps (rhythmic impacts) or gear sounds (rustling equipment)
                    const effectType = Math.random() > 0.6 ? 'footstep' : (Math.random() > 0.5 ? 'gear' : 'branch');
                    
                    for (let j = 0; j < effectLength && (i + j) < trailData.length; j++) {
                        const effectProgress = j / effectLength;
                        // Different envelope shape based on effect type
                        const envelope = effectType === 'footstep' ? 
                                        // Fast attack, medium decay for footsteps
                                        (effectProgress < 0.05 ? effectProgress / 0.05 : Math.pow(0.6, effectProgress * 5)) :
                                        effectType === 'gear' ?
                                        // Smoother curve for gear/clothing rustling 
                                        Math.sin(effectProgress * Math.PI) :
                                        // Sharp attack for branch snap
                                        (effectProgress < 0.02 ? effectProgress / 0.02 : Math.pow(0.3, effectProgress * 8));
                        
                        // Different sound content based on effect type
                        if (effectType === 'footstep') {
                            // Footstep - muffled impact with some crunch
                            const stepNoise = (Math.random() * 2 - 1) * 0.5 + Math.sin(effectProgress * 30) * 0.4;
                            trailData[i + j] += stepNoise * envelope * maxAmp;
                        } else if (effectType === 'gear') {
                            // Gear rustling - higher pitch cloth/equipment sounds
                            const gearNoise = (Math.random() * 2 - 1) * 0.6 + 
                                            (Math.random() * 2 - 1) * 0.3; // More random for fabric rustling
                            trailData[i + j] += gearNoise * envelope * maxAmp * 0.6;
                        } else {
                            // Branch snap - sharp crack
                            const branchNoise = (Math.random() > 0.5 ? 0.8 : -0.8) * (1 - effectProgress * 0.7);
                            trailData[i + j] += branchNoise * envelope * maxAmp * 1.2;
                        }
                    }
                }
            }
            
            const trailEffects = context.createBufferSource();
            trailEffects.buffer = trailBuffer;
            
            const trailFilter = context.createBiquadFilter();
            trailFilter.type = 'bandpass';
            trailFilter.frequency.value = 2000; // Middle range for footsteps and equipment sounds
            
            // 6. Gain nodes for all adventure components with dynamic nature awakening envelopes
            const windGain = context.createGain();
            windGain.gain.setValueAtTime(0.15, context.currentTime); // Start with gentle breeze
            windGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.8); // Build up as morning begins
            windGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 1.5); // Morning breeze develops
            windGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2.0); // Slight decrease as it stabilizes
            
            const birdGain = context.createGain();
            birdGain.gain.setValueAtTime(0.0, context.currentTime);
            birdGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.7); // First birds begin to call
            birdGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 1.5); // More birds join in
            birdGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2.2); // Stable bird chorus
            
            const guideGain = context.createGain();
            guideGain.gain.value = 0.6;
            
            const woodTap1Gain = context.createGain();
            woodTap1Gain.gain.value = 0.7;
            
            const whistleGain = context.createGain();
            whistleGain.gain.value = 0.8;
            
            const forestGain = context.createGain();
            forestGain.gain.setValueAtTime(0.15, context.currentTime);
            forestGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1.5);
            forestGain.gain.linearRampToValueAtTime(0.45, context.currentTime + 2.5); // Peaks after the final whistle
            
            const trailGain = context.createGain();
            trailGain.gain.setValueAtTime(0.0, context.currentTime);
            trailGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 1.0); // Gradual introduction
            trailGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2.0); // Build up
            trailGain.gain.linearRampToValueAtTime(0.45, context.currentTime + 2.5); // Maximum at adventure start
            
            // Create a convolver for adding stadium/outdoor track reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a natural forest/wilderness reverb (longer, more spacious)
            for (let i = 0; i < reverbBuffer.length; i++) {
                // Slower decay for wilderness open space
                const decay = Math.pow(0.85, i / (context.sampleRate * 0.25));
                // Add some early reflections for trees and terrain
                const earlyReflections = (i % (context.sampleRate * 0.08) < 5) ? 0.3 : 0;
                // Slightly different left/right for realistic forest spatial image
                reverbL[i] = ((Math.random() * 2 - 1) * 0.6 + earlyReflections) * decay;
                reverbR[i] = ((Math.random() * 2 - 1) * 0.6 + earlyReflections * 0.8) * decay;
            }
            convolver.buffer = reverbBuffer;
            
            // Master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.7;
            
            // Connect wind components
            windOsc.connect(windFilter);
            windFilter.connect(windGain);
            windGain.connect(convolver);
            windGain.connect(masterGain); // Direct path too
            
            // Connect bird call tones
            birdOsc.connect(birdFilter);
            birdFilter.connect(birdGain);
            birdGain.connect(convolver);
            birdGain.connect(masterGain);
            
            // Schedule wilderness start sequence sounds at specific times
            // Trail guide's "Adventure awaits!" at 0.5 seconds
            setTimeout(() => {
                guideReady.connect(guideGain);
                guideGain.connect(convolver);
                guideGain.connect(masterGain);
                guideReady.start();
            }, 500);
            
            // First wood tap (preparation signal) at 1.5 seconds
            setTimeout(() => {
                woodTap1.connect(woodTap1Gain);
                woodTap1Gain.connect(convolver);
                woodTap1Gain.connect(masterGain);
                woodTap1.start();
            }, 1500);
            
            // Final whistle (GO signal) at 2.5 seconds
            setTimeout(() => {
                whistleGo.connect(whistleGain);
                whistleGain.connect(convolver);
                whistleGain.connect(masterGain);
                whistleGo.start();
            }, 2500);
            
            // Connect forest ambience
            forest.connect(forestFilter);
            forestFilter.connect(forestGain);
            forestGain.connect(convolver);
            forestGain.connect(masterGain);
            
            // Connect trail and equipment effects
            trailEffects.connect(trailFilter);
            trailFilter.connect(trailGain);
            trailGain.connect(convolver);
            trailGain.connect(masterGain);
            
            // Connect reverb to master (more reverb for natural wilderness setting)
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.4; // Higher reverb amount for open air wilderness
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start continuous sound sources
            windOsc.start();
            breezeOsc.start();
            birdOsc.start();
            forest.start();
            trailEffects.start();
            
            // Stop and clean up
            setTimeout(() => {
                windOsc.stop();
                breezeOsc.stop();
                birdOsc.stop();
                forest.stop();
                trailEffects.stop();
                context.close();
            }, 3000); // Duration for the full adventure start sequence
            
            debug(`ArcadeEntity6: Played outdoor adventure start sequence launch sound`);
        } catch (err) {
            debug(`ArcadeEntity6: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity6: Using Web Audio API for sound generation`);
    }
    
    /**
     * Load game images for the selection screen
     */
    loadGameImages() {
        debug(`ArcadeEntity6: Loading game images for Vibe Disc cabinet`); 
        console.log(`🎮 ArcadeEntity6: Loading game images for Vibe Disc cabinet`);
        
        if (!this.games || this.games.length === 0) {
            debug(`ArcadeEntity6: No games to load images for`);
            console.warn(`🎮 ArcadeEntity6: No games to load images for`);
            return;
        }
        
        console.log(`🎮 ArcadeEntity6: Loading images for ${this.games.length} games:`, 
            this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity6: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity6: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity6: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity6: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity6: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity6: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity6: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity6: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity6: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity6: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity6: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity6: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity6: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity6: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity6: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity6: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
            
            const img = new Image();
            img.onload = () => {
                console.log(`🎮 ArcadeEntity6: Successfully loaded alternative image for ${game.title}`);
                game.image = img;
            };
            
            img.onerror = () => {
                console.warn(`🎮 ArcadeEntity6: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity6: Creating canvas fallback image for ${game.title}`);
        
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
        
        console.log(`🎮 ArcadeEntity6: Fallback image created for ${game.title}`);
    }

    /**
     * Play an outdoor adventure end/pack-up sound when closing the menu
     * Creates a campfire winding down, equipment being packed away, and evening forest sounds
     */
    playMenuCloseSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Campfire crackling that gradually diminishes
            const fireOsc = context.createOscillator();
            fireOsc.type = 'triangle'; // Base for warm fire sound
            fireOsc.frequency.setValueAtTime(80, context.currentTime); // Moderate fire crackling
            fireOsc.frequency.exponentialRampToValueAtTime(60, context.currentTime + 0.3); // Fire diminishing
            fireOsc.frequency.exponentialRampToValueAtTime(40, context.currentTime + 0.5); // Fire dying out
            
            // Fire crackle irregularities (random pops and snaps)
            const crackleOsc = context.createOscillator();
            crackleOsc.type = 'triangle';
            crackleOsc.frequency.setValueAtTime(8, context.currentTime); // Moderate crackle rate
            crackleOsc.frequency.linearRampToValueAtTime(3, context.currentTime + 0.4); // Slowing crackles as fire dies
            
            const crackleGain = context.createGain();
            crackleGain.gain.setValueAtTime(10, context.currentTime); // Initial crackle intensity
            crackleGain.gain.linearRampToValueAtTime(4, context.currentTime + 0.4); // Decreasing crackles
            
            // Connect crackle to fire frequency
            crackleOsc.connect(crackleGain);
            crackleGain.connect(fireOsc.frequency);
            
            // Fire filter to shape the sound
            const fireFilter = context.createBiquadFilter();
            fireFilter.type = 'lowpass';
            fireFilter.frequency.setValueAtTime(800, context.currentTime); // Full fire spectrum initially
            fireFilter.frequency.linearRampToValueAtTime(200, context.currentTime + 0.5); // Dampening as it dies
            
            // Fire gain envelope
            const fireGain = context.createGain();
            fireGain.gain.setValueAtTime(0.35, context.currentTime); // Start at moderate volume
            fireGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.35); // Fade as fire dies down
            fireGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.5); // Embers remain
            
            // 2. Equipment packing sounds - zipping backpacks, tent flaps, gear shuffling
            const packingTimes = [
                { startTime: 0.08, duration: 0.15, vol: 0.35, type: 'zip' },
                { startTime: 0.25, duration: 0.12, vol: 0.4, type: 'rustle' },
                { startTime: 0.38, duration: 0.10, vol: 0.3, type: 'snap' },
                { startTime: 0.45, duration: 0.08, vol: 0.25, type: 'zip' }
            ];
            
            // Create oscillators for packing sounds
            const packingOscs = [];
            const packingGains = [];
            
            for (let i = 0; i < packingTimes.length; i++) {
                const pack = packingTimes[i];
                
                // Create appropriate oscillator based on sound type
                const osc = context.createOscillator();
                
                if (pack.type === 'zip') {
                    // Zipper sound - raspy higher frequency noise
                    osc.type = 'sawtooth'; 
                    osc.frequency.value = 400 + Math.random() * 200; // Random zipper frequency
                } else if (pack.type === 'rustle') {
                    // Fabric/gear rustling sound - softer noise
                    osc.type = 'triangle'; 
                    osc.frequency.value = 120 + Math.random() * 80; // Random rustle frequency
                } else { // snap
                    // Snap/click of gear or buckles
                    osc.type = 'square'; 
                    osc.frequency.value = 150 + Math.random() * 100; // Random snap frequency
                }
                
                // Create gain with appropriate envelope for this equipment sound
                const gain = context.createGain();
                gain.gain.setValueAtTime(0.0, context.currentTime);
                gain.gain.setValueAtTime(0.0, context.currentTime + pack.startTime);
                
                // Different attack/decay for different sound types
                if (pack.type === 'zip') {
                    // Zipper has longer attack and sustain
                    gain.gain.linearRampToValueAtTime(pack.vol, context.currentTime + pack.startTime + 0.02);
                    gain.gain.linearRampToValueAtTime(pack.vol * 0.8, context.currentTime + pack.startTime + pack.duration * 0.7);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + pack.startTime + pack.duration);
                } else if (pack.type === 'rustle') {
                    // Rustling has medium attack and gradual decay
                    gain.gain.linearRampToValueAtTime(pack.vol, context.currentTime + pack.startTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + pack.startTime + pack.duration);
                } else { // snap
                    // Snap has very quick attack and decay
                    gain.gain.linearRampToValueAtTime(pack.vol, context.currentTime + pack.startTime + 0.005);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + pack.startTime + pack.duration * 0.6);
                }
                
                // Store for later
                packingOscs.push(osc);
                packingGains.push(gain);
                
                // Connect
                osc.connect(gain);
            }
            
            // 3. Evening forest sounds - crickets, owl hoots, light breeze
            const eveningBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
            const eveningData = eveningBuffer.getChannelData(0);
            
            // Create evening nature sounds
            for (let i = 0; i < eveningData.length; i++) {
                const progress = i / eveningData.length;
                
                // Background cricket chirps
                const cricketBase = Math.sin(2 * Math.PI * (4000 + Math.random() * 500) * i / context.sampleRate) * 0.03;
                
                // Random cricket chirps and owl hoots that get more frequent toward the middle
                const natureInterval = Math.min(4000, 8000 * Math.abs(progress - 0.5) + 1000); // More sounds in middle, sparse at beginning/end
                const isNatureSound = (i % Math.floor(natureInterval) < 15) && (Math.random() > 0.65);
                
                if (isNatureSound) {
                    // Determine if it's an owl hoot or a cricket chirp
                    const isOwl = Math.random() > 0.8 && progress > 0.2;
                    const soundLength = isOwl ? 300 : 80; // Owls are longer sounds
                    const soundFreq = isOwl ? (300 + Math.random() * 100) : (3000 + Math.random() * 1000);
                    
                    for (let j = 0; j < soundLength && (i + j) < eveningData.length; j++) {
                        // Different envelope shapes for different creatures
                        const amplitude = isOwl ?
                            // Owl hoot envelope - gradual rise and fall
                            (j < soundLength * 0.3 ? j/(soundLength * 0.3) : (1 - ((j - soundLength * 0.3) / (soundLength * 0.7)))) * 0.15 :
                            // Cricket chirp envelope - sharp attack, quick decay
                            Math.pow(1 - j/soundLength, 1.5) * 0.2;
                            
                        eveningData[i + j] += Math.sin(j * soundFreq/context.sampleRate * Math.PI * 2) * amplitude;
                    }
                    i += soundLength - 1; // Skip ahead
                } else {
                    // Constant background cricket ambience
                    eveningData[i] = cricketBase * (0.5 + progress * 0.5); // Crickets intensify as evening deepens
                }
            }
            
            const eveningSource = context.createBufferSource();
            eveningSource.buffer = eveningBuffer;
            
            // Filter for evening nature sounds
            const eveningFilter = context.createBiquadFilter();
            eveningFilter.type = 'bandpass';
            eveningFilter.frequency.value = 2000;
            eveningFilter.Q.value = 1.0; // Wider for natural sounds
            
            // Gain for evening sounds
            const eveningGain = context.createGain();
            eveningGain.gain.setValueAtTime(0.0, context.currentTime);
            eveningGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.2); // Delay start until fire dies down
            eveningGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.3); // Evening sounds emerge
            eveningGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.55); // Sustain
            
            // 4. Final farewell sound - distant owl hoot and a gentle breeze rustling leaves
            const farewellOsc = context.createOscillator();
            farewellOsc.type = 'sine'; // Clean tone for owl hoot
            farewellOsc.frequency.setValueAtTime(230, context.currentTime + 0.45); // Owl hoot frequency
            farewellOsc.frequency.linearRampToValueAtTime(200, context.currentTime + 0.5); // Slight drop for natural sound
            
            const farewellGain = context.createGain();
            farewellGain.gain.setValueAtTime(0.0, context.currentTime);
            farewellGain.gain.setValueAtTime(0.0, context.currentTime + 0.45); // Delay until end of sequence
            farewellGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.47); // Gentle rise
            farewellGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.5); // Hold briefly
            farewellGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6); // Natural decay
            
            // 5. Gentle night breeze fadeout - soft leaves rustling in the wind
            const breezeBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const breezeData = breezeBuffer.getChannelData(0);
            
            // Create gentle breeze through trees
            for (let i = 0; i < breezeData.length; i++) {
                const progress = i / breezeData.length;
                // Gradually decrease intensity as night settles
                const intensity = Math.max(0, 1.0 - progress * 1.8);
                // Add low frequency modulation for wind gusts
                const gustModulation = Math.sin(2 * Math.PI * 0.5 * i / context.sampleRate) * 0.2;
                // Filtered noise for gentle forest breeze
                breezeData[i] = ((Math.random() * 2 - 1) * 0.04 + gustModulation * 0.01) * intensity;
            }
            
            const breezeNoise = context.createBufferSource();
            breezeNoise.buffer = breezeBuffer;
            
            const breezeFilter = context.createBiquadFilter();
            breezeFilter.type = 'bandpass';
            breezeFilter.frequency.value = 400; // Sweet spot for leaf rustling
            breezeFilter.Q.value = 0.7; // Medium band for natural wind sound
            
            const breezeGain = context.createGain();
            breezeGain.gain.setValueAtTime(0.12, context.currentTime);
            breezeGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.55); // Gradual fadeout
            
            // Create an open-air forest reverb effect
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 1.2, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a natural outdoor reverb (longer, more diffuse)
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.85, i / (context.sampleRate * 0.15)); // Slower decay for open space
                // Add distant echoes for mountain/valley feeling
                const distantEcho = (i % (context.sampleRate * 0.12) < 10) ? 0.05 * Math.random() : 0;
                reverbL[i] = ((Math.random() * 2 - 1) * 0.3 + distantEcho) * decay;
                reverbR[i] = ((Math.random() * 2 - 1) * 0.3 + distantEcho) * decay * 0.9; // Slightly different for stereo effect
            }
            convolver.buffer = reverbBuffer;
            
            // Main output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.35; // Slightly louder for natural sounds
            
            // Connect all components
            fireOsc.connect(fireFilter);
            fireFilter.connect(fireGain);
            fireGain.connect(convolver);
            fireGain.connect(masterGain);
            
            // Connect all packing equipment sounds
            for (let i = 0; i < packingGains.length; i++) {
                packingGains[i].connect(convolver);
                packingGains[i].connect(masterGain);
            }
            
            eveningSource.connect(eveningFilter);
            eveningFilter.connect(eveningGain);
            eveningGain.connect(convolver);
            eveningGain.connect(masterGain);
            
            farewellOsc.connect(farewellGain);
            farewellGain.connect(convolver);
            farewellGain.connect(masterGain);
            
            breezeNoise.connect(breezeFilter);
            breezeFilter.connect(breezeGain);
            breezeGain.connect(convolver);
            breezeGain.connect(masterGain);
            
            // Connect reverb to master (more reverb for open-air forest sounds)
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.3; // More reverb for open spaces
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start sound components
            fireOsc.start();
            crackleOsc.start();
            packingOscs.forEach(osc => osc.start());
            eveningSource.start();
            farewellOsc.start();
            breezeNoise.start();
            
            // Stop and clean up
            setTimeout(() => {
                fireOsc.stop();
                crackleOsc.stop();
                packingOscs.forEach(osc => osc.stop());
                farewellOsc.stop();
                context.close();
            }, 650); // Slightly longer for full evening outdoor sequence
            
            debug(`ArcadeEntity6: Played outdoor adventure end/pack-up sound`);
        } catch (err) {
            debug(`ArcadeEntity6: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * Play immersive outdoor sports and nature sounds when player enters interaction range
     * Creates an authentic wilderness sports atmosphere with dynamic natural elements
     */
    playProximitySound() {
        try {
            // Create audio context for outdoor sports and nature sounds
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Select a random outdoor sports sound category for variety
            const soundTypes = ['disc_golf', 'trail_running', 'kayaking', 'hiking'];
            const selectedSport = soundTypes[Math.floor(Math.random() * soundTypes.length)];
            
            // Create a water stream sound - essential for outdoor nature ambience
            const waterBufferSize = 4 * context.sampleRate; // 4 second buffer
            const waterBuffer = context.createBuffer(1, waterBufferSize, context.sampleRate);
            const waterData = waterBuffer.getChannelData(0);
            
            // Create realistic flowing water sound with movement
            for (let i = 0; i < waterBufferSize; i++) {
                const t = i / context.sampleRate;
                
                // Base water flow with varying intensity
                const flowIntensity = 0.3 + 0.1 * Math.sin(t * 0.5) + 0.05 * Math.sin(t * 1.7);
                let waterSound = (Math.random() * 2 - 1) * flowIntensity * 0.39; // Another 30% increase from 0.3
                
                // Add occasional bubbling effects
                if (Math.random() < 0.003) {
                    const bubbleLength = Math.floor(context.sampleRate * 0.05); // 50ms bubble
                    if (i + bubbleLength < waterBufferSize) {
                        for (let j = 0; j < bubbleLength; j++) {
                            const bubblePhase = j / bubbleLength;
                            const bubbleEnv = Math.sin(bubblePhase * Math.PI);
                            // Add bubble sound to water at this position
                            if (i + j < waterBufferSize) {
                                // Random bubble frequencies
                                const freq = 500 + Math.random() * 700;
                                waterData[i + j] = waterSound + bubbleEnv * 0.2925 * Math.sin(t * freq + j * 0.3); // Another 30% increase from 0.225
                            }
                        }
                        i += bubbleLength; // Skip ahead to avoid overlapping bubbles
                    }
                } else {
                    waterData[i] = waterSound;
                }
            }
            
            const waterSource = context.createBufferSource();
            waterSource.buffer = waterBuffer;
            waterSource.loop = true;
            
            // Stereo water sound with movement
            const waterPanner = context.createStereoPanner();
            // Water moving from one side to the other for immersive effect
            waterPanner.pan.setValueAtTime(-0.4, context.currentTime);
            waterPanner.pan.linearRampToValueAtTime(0.3, context.currentTime + 2.0);
            
            // Water filter to shape the sound
            const waterFilter = context.createBiquadFilter();
            waterFilter.type = 'bandpass';
            waterFilter.frequency.value = 800;
            waterFilter.Q.value = 0.8;
            
            // Water gain envelope
            const waterGain = context.createGain();
            waterGain.gain.setValueAtTime(0.0, context.currentTime);
            waterGain.gain.linearRampToValueAtTime(0.156, context.currentTime + 0.4); // Another 30% increase from 0.12
            waterGain.gain.linearRampToValueAtTime(0.0975, context.currentTime + 1.5); // Another 30% increase from 0.075
            waterGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.0);
            
            // Create forest birds and wind sounds
            const forestBufferSize = 3 * context.sampleRate;
            const forestBuffer = context.createBuffer(1, forestBufferSize, context.sampleRate);
            const forestData = forestBuffer.getChannelData(0);
            
            // Create realistic forest ambience
            for (let i = 0; i < forestBufferSize; i++) {
                const t = i / context.sampleRate;
                // Base wind/leaves sound
                let windSound = (Math.random() * 2 - 1) * 0.1365; // Another 30% increase from 0.105
                
                // Add bird calls with authentic patterns
                if (Math.random() < 0.001) {
                    // Different types of bird calls
                    const birdType = Math.floor(Math.random() * 3);
                    const birdLength = Math.floor(context.sampleRate * (0.1 + Math.random() * 0.2));
                    
                    if (i + birdLength < forestBufferSize) {
                        for (let j = 0; j < birdLength; j++) {
                            const birdT = j / birdLength;
                            // Different bird call patterns
                            const birdEnv = Math.pow(Math.sin(birdT * Math.PI), 0.5);
                            
                            if (i + j < forestBufferSize) {
                                let birdFreq;
                                // Different bird species
                                if (birdType === 0) {
                                    // Warbler-like trill pattern
                                    birdFreq = 3000 + 500 * Math.sin(birdT * 50);
                                } else if (birdType === 1) {
                                    // Robin-like descending pattern
                                    birdFreq = 3500 - 1000 * birdT;
                                } else {
                                    // Cardinal-like rising pattern
                                    birdFreq = 2000 + 800 * birdT;
                                }
                                forestData[i + j] = windSound + birdEnv * 0.39 * Math.sin(birdT * birdFreq); // Another 30% increase from 0.3
                            }
                        }
                        i += birdLength; // Skip ahead to avoid overlapping calls
                    }
                } else {
                    forestData[i] = windSound;
                }
            }
            
            const forestSource = context.createBufferSource();
            forestSource.buffer = forestBuffer;
            forestSource.loop = true;
            
            // Forest sounds panner for spatial positioning
            const forestPanner = context.createStereoPanner();
            forestPanner.pan.value = 0.2 + Math.random() * 0.4; // Position birds to the right
            
            // Forest gain envelope
            const forestGain = context.createGain();
            forestGain.gain.setValueAtTime(0.0, context.currentTime);
            forestGain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.3);
            forestGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 1.2);
            forestGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.0);
            
            // Sport-specific sounds based on random selection
            let sportSound, sportGain, sportFilter, sportPanner;
            
            // Create the specific sport sound
            const sportBufferSize = context.sampleRate * 1;
            const sportBuffer = context.createBuffer(1, sportBufferSize, context.sampleRate);
            const sportData = sportBuffer.getChannelData(0);
            
            // Generate sport-specific sounds
            switch(selectedSport) {
                case 'disc_golf':
                    // Disc golf sounds - whoosh and chain basket hit
                    for (let i = 0; i < sportBufferSize; i++) {
                        const t = i / context.sampleRate;
                        if (t < 0.2) {
                            // Disc whoosh
                            sportData[i] = 0.585 * Math.sin(t * 20) * Math.exp(-t * 10); // Another 30% increase from 0.45
                        } else if (t > 0.5 && t < 0.6) {
                            // Chain basket hit with multiple chains
                            const chainHits = 3 + Math.floor(Math.random() * 4);
                            for (let chain = 0; chain < chainHits; chain++) {
                                const chainT = t - 0.5 - (chain * 0.02);
                                if (chainT > 0 && chainT < 0.05) {
                                    sportData[i] += 0.39 * Math.sin(chainT * 200) * Math.exp(-chainT * 40); // Another 30% increase from 0.3
                                }
                            }
                        }
                    }
                    break;
                    
                case 'trail_running':
                    // Footsteps on trail, breathing, leaves crunching
                    for (let i = 0; i < sportBufferSize; i++) {
                        const t = i / context.sampleRate;
                        // Regular footsteps pattern
                        const stepInterval = 0.4; // time between steps
                        const stepPhase = (t % stepInterval) / stepInterval;
                        
                        if (stepPhase < 0.1) {
                            // Foot impact with ground
                            sportData[i] = 0.2925 * Math.random() * Math.exp(-stepPhase * 50); // Another 30% increase from 0.225
                        }
                        
                        // Add rhythmic breathing
                        const breathCycle = 2.0; // 2 second breath cycle
                        const breathPhase = (t % breathCycle) / breathCycle;
                        if (breathPhase < 0.3) {
                            // Inhale
                            sportData[i] += 0.0975 * breathPhase * Math.random(); // Another 30% increase from 0.075
                        } else if (breathPhase > 0.5 && breathPhase < 0.8) {
                            // Exhale
                            sportData[i] += 0.1365 * (1-breathPhase) * Math.random(); // Another 30% increase from 0.105
                        }
                    }
                    break;
                    
                case 'kayaking':
                    // Paddle sounds and water splashes
                    for (let i = 0; i < sportBufferSize; i++) {
                        const t = i / context.sampleRate;
                        // Paddle strokes
                        const strokeInterval = 1.2; // time between paddle strokes
                        const strokePhase = (t % strokeInterval) / strokeInterval;
                        
                        if (strokePhase < 0.08) {
                            // Paddle entering water
                            sportData[i] = 0.39 * Math.random() * Math.exp(-strokePhase * 30); // Another 30% increase from 0.3
                        } else if (strokePhase > 0.2 && strokePhase < 0.3) {
                            // Paddle pulling through water
                            sportData[i] = 0.195 * Math.random(); // Another 30% increase from 0.15
                        } else if (strokePhase > 0.4 && strokePhase < 0.45) {
                            // Paddle exiting with drips
                            sportData[i] = 0.2925 * Math.random() * Math.exp(-(strokePhase-0.4) * 40); // Another 30% increase from 0.225
                        }
                    }
                    break;
                    
                case 'hiking':
                default:
                    // Hiking pole clicks, boot steps on varied terrain
                    for (let i = 0; i < sportBufferSize; i++) {
                        const t = i / context.sampleRate;
                        // Step pattern with pole clicks
                        const stepInterval = 0.6; // time between steps
                        const stepPhase = (t % stepInterval) / stepInterval;
                        
                        if (stepPhase < 0.05) {
                            // Boot on rocks/dirt
                            sportData[i] = 0.234 * Math.random() * Math.exp(-stepPhase * 40); // Another 30% increase from 0.18
                        } else if (stepPhase > 0.1 && stepPhase < 0.13) {
                            // Hiking pole click
                            sportData[i] = 0.195 * Math.sin(t * 5000) * Math.exp(-(stepPhase-0.1) * 100); // Another 30% increase from 0.15
                        }
                        
                        // Occasional branch snap
                        if (Math.random() < 0.0005) {
                            sportData[i] += 0.4875 * Math.random() * Math.exp(-0.001 * i); // Another 30% increase from 0.375
                        }
                    }
                    break;
            }
            
            // Create and configure sport sound source
            sportSound = context.createBufferSource();
            sportSound.buffer = sportBuffer;
            
            // Sport sound processing
            sportFilter = context.createBiquadFilter();
            sportFilter.type = 'bandpass';
            sportFilter.frequency.value = 1000;
            sportFilter.Q.value = 1.0;
            
            sportPanner = context.createStereoPanner();
            sportPanner.pan.value = -0.2 + Math.random() * 0.4; // Slightly left or center
            
            sportGain = context.createGain();
            sportGain.gain.setValueAtTime(0.0, context.currentTime);
            sportGain.gain.linearRampToValueAtTime(0.2925, context.currentTime + 0.1); // Another 30% increase from 0.225
            sportGain.gain.linearRampToValueAtTime(0.195, context.currentTime + 0.7); // Another 30% increase from 0.15
            sportGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.8);
            
            // Create large outdoor reverb for spaciousness
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2.0, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a realistic outdoor reverb (valley/canyon feel)
            for (let i = 0; i < reverbBuffer.length; i++) {
                const t = i / context.sampleRate;
                // Early reflections with mountain-like pattern
                if (t < 0.1) {
                    const reflections = Math.sin(t * 100) * Math.exp(-t * 10) * 0.195; // Another 30% increase from 0.15
                    reverbL[i] = (Math.random() * 2 - 1) * reflections * (1 - t/0.1);
                    reverbR[i] = (Math.random() * 2 - 1) * reflections * (1 - t/0.1);
                } else {
                    // Long tail for canyon-like space
                    const decay = Math.exp(-2 * (t - 0.1));
                    reverbL[i] = (Math.random() * 2 - 1) * decay * 0.0585; // Another 30% increase from 0.045
                    reverbR[i] = (Math.random() * 2 - 1) * decay * 0.0585; // Another 30% increase from 0.045
                }
            }
            convolver.buffer = reverbBuffer;
            
            // Master gain - increased volume level
            const masterGain = context.createGain();
            masterGain.gain.value = 0.429; // Another 30% increase on top of previous 50% increase (0.22 → 0.33 → 0.429)
            
            // Connect water source to audio graph
            waterSource.connect(waterFilter);
            waterFilter.connect(waterPanner);
            waterPanner.connect(waterGain);
            waterGain.connect(masterGain);
            waterGain.connect(convolver);
            
            // Connect forest source to audio graph
            forestSource.connect(forestPanner);
            forestPanner.connect(forestGain);
            forestGain.connect(masterGain);
            forestGain.connect(convolver);
            
            // Connect sport-specific sounds
            sportSound.connect(sportFilter);
            sportFilter.connect(sportPanner);
            sportPanner.connect(sportGain);
            sportGain.connect(masterGain);
            sportGain.connect(convolver);
            
            // Connect reverb to master
            convolver.connect(masterGain);
            
            // Connect master to output
            masterGain.connect(context.destination);
            
            // Start all sound sources
            waterSource.start();
            forestSource.start();
            sportSound.start();
            
            // Stop and clean up
            setTimeout(() => {
                waterSource.stop();
                forestSource.stop();
                sportSound.stop();
                context.close();
            }, 2500); // Slightly longer for natural fade
            
            debug(`ArcadeEntity6: Played immersive ${selectedSport} outdoor sports and nature sound effect`);
        } catch (err) {
            debug(`ArcadeEntity6: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity6: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity6: Using fallback rendering`);
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
            debug(`ArcadeEntity6: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity6: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity6: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
    drawGameSelectionInterface(ctx) {
        debug(`ArcadeEntity6: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity6 instance
            const self = this;
            
            // Add click event listener to the canvas overlay
            newOverlay.addEventListener('click', function(event) {
                console.log(`🎮 Overlay canvas clicked at ${event.clientX}, ${event.clientY}`);
                // Use the instance method to handle the click
                self.handleMenuClick(event.clientX, event.clientY);
            });
            
            overlayCtx = newOverlay.getContext('2d');
            console.log(`🎮 Created overlay canvas: ${newOverlay.width}x${newOverlay.height}`);
        } else {
            // Use existing overlay
            overlayCtx = overlayCanvas.getContext('2d');
            // Clear previous frame
            overlayCtx.clearRect(0, 0, width, height);
            
            // Make sure we have a click listener
            if (!overlayCanvas._hasClickListener) {
                const self = this;
                overlayCanvas.addEventListener('click', function(event) {
                    console.log(`🎮 Existing overlay canvas clicked at ${event.clientX}, ${event.clientY}`);
                    self.handleMenuClick(event.clientX, event.clientY);
                });
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
            // Since we're only showing Gnome Mercy, we can use a larger image with 4:3 aspect ratio
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
            const textWidth = overlayCtx.measureText('@archedark_').width;
            // Since this is right-aligned, we need to calculate position differently
            const twitterHandleX = width/2 + 90 - textWidth;
            // Move position back down (was about 40px higher, now returning to original position)
            const twitterHandleY = creatorFooterY + footerHeight/2 - 10;
            const twitterHandleWidth = textWidth * 2; // Make it wider
            const twitterHandleHeight = 50; // Make it taller
            
            // Add it to the clickable areas array so the entity's click handler will detect it
            this.clickableAreas.push({
                type: 'twitter',
                x: twitterHandleX,
                y: twitterHandleY,
                width: twitterHandleWidth,
                height: twitterHandleHeight,
                url: 'https://x.com/kickiniteasy'
            });
            
            console.log('Added ArcadeEntity6 Twitter clickable area:', 
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
        overlayCtx.textAlign = 'center';
        overlayCtx.fillText('Created by', width/2 - 70, creatorFooterY + footerHeight/2);
        
        // Twitter handle with special styling to indicate it's clickable
        overlayCtx.fillStyle = '#1DA1F2'; // Twitter blue
        overlayCtx.font = 'bold 18px Arial, sans-serif';
        overlayCtx.textAlign = 'right';
        overlayCtx.fillText('@kickiniteasy', width/2 + 120, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@kickiniteasy').width;
        
        // Get the exact position where the text ends since it's right-aligned
        const textStartX = width/2 + 120 - twitterHandleWidth;
        
        // Underline to show it's clickable - using measured width and exact position
        overlayCtx.fillRect(textStartX, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Cleanup: Remove the Twitter link when the menu is closed
        if (!this.gameSelectVisible) {
            const oldLink = document.getElementById(twitterLinkId);
            if (oldLink) {
                console.log('Removing ArcadeEntity6 Twitter link:', twitterLinkId);
                oldLink.remove();
            }
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
        debug(`ArcadeEntity6: Checking menu click at ${clientX}, ${clientY}`);
        
        // Skip if menu not visible
        if (!this.gameSelectVisible) return;
        
        // Debounce mechanism to prevent multiple rapid clicks
        const now = Date.now();
        if (!this._lastClickTime) {
            this._lastClickTime = 0;
        }
        
        // If less than 500ms since last click, ignore this click
        if (now - this._lastClickTime < 500) {
            debug(`ArcadeEntity6: Ignoring click - too soon after previous click`);
            return;
        }
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
            
            debug(`ArcadeEntity6: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity6: Clicked on area: ${area.type}`);
                    
                    // Track the last clicked URL to prevent multiple windows
                    if (!this._lastClickedUrls) {
                        this._lastClickedUrls = {};
                    }
                    
                    // Handle different types of clickable areas
                    switch(area.type) {
                        case 'twitter':
                            // Open the Twitter URL in a new tab, but only if we haven't recently opened it
                            if (area.url) {
                                const urlLastClickTime = this._lastClickedUrls[area.url] || 0;
                                if (now - urlLastClickTime > 2000) { // 2 second cooldown per URL
                                    debug(`ArcadeEntity6: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity6: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab, with same protection
                            if (area.url) {
                                const urlLastClickTime = this._lastClickedUrls[area.url] || 0;
                                if (now - urlLastClickTime > 2000) { // 2 second cooldown per URL
                                    debug(`ArcadeEntity6: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity6: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
}

export { ArcadeEntity6 };
