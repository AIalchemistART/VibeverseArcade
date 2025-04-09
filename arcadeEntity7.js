/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative third arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity7 extends Entity {
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_7', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_7', options = {}) {
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
        this.interactionRadius = 3.5;
        this.arcadeId = options.arcadeId || 'arcade7-' + Math.floor(Math.random() * 10000);
        
        // Visual properties
        this.glowColor = '#FF00FF';
        this.glowIntensity = 5;
        this.maxGlowIntensity = 15;
        this.glowSpeed = 0.1;
        this.glowDirection = 1;
        this.scaleX = .33;
        this.scaleY = .33;
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
                title: 'AI Quake II', 
                description: 'A first-person shooter',
                url: 'https://copilot.microsoft.com/wham?features=labs-wham-enabled',
                imagePath: 'assets/Games/Game_11.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_11.png', 'assets/games/Game_11.png']
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
        
        console.log(`ArcadeEntity7: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity7: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_7.png',
            'assets/decor/Arcade_7.png',
            './assets/decor/Arcade_7.png',
            '/assets/decor/Arcade_7.png',
            window.location.origin + '/assets/decor/Arcade%207.png',
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
        debug(`ArcadeEntity7: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity7: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity7: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity7: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity7: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity7: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_7.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity7: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity7: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_7.png`,        // Exact filename with space
            `./assets/decor/Arcade_7.png`,      // With leading ./ and space
            `assets/decor/Arcade%207.png`,      // URL encoded space
            `assets/decor/Arcade-7.png`,        // Hyphen instead of space
            `assets/decor/Arcade7.png`,         // No space
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
                debug(`ArcadeEntity7: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity7: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity7: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity7: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity7: Creating fallback asset`);
        
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
            debug(`ArcadeEntity7: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity7: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity7: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity7: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
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
                debug(`ArcadeEntity7: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity7: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity7: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        console.log(`ArcadeEntity7: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            console.log(`ArcadeEntity7: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity7: Game interaction system not available!`);
        }
        
        // Play sound
        console.log('ArcadeEntity7: About to call playActivateSound...');
        this.playActivateSound();
        console.log('ArcadeEntity7: Called playActivateSound');
    }
    
    /**
     * Hide game selection menu
     */
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity7: Hiding game selection`);
        
        // Play a sound effect when closing the menu
        this.playMenuCloseSound();
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity7: Set game interaction state to inactive`);
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
            console.log('ArcadeEntity7: Removed Twitter clickable areas');
        }
    }
    
    /**
     * Launch the selected game
     */
    launchGame() {
        debug(`ArcadeEntity7: Launching game: ${this.games[this.selectedGameIndex].title}`);
        
        if (this.games.length === 0) {
            debug(`ArcadeEntity7: No games available to launch`);
            return;
        }
        
        // Get the selected game
        const selectedGame = this.games[this.selectedGameIndex];
        debug(`ArcadeEntity7: Launching game: ${selectedGame.title}`);
        
        // Play launch sound
        this.playLaunchSound();
        
        // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity7: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity7: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    /**
     * Play Doom-themed power-on sounds when activating the arcade cabinet
     * Creates a hellish powered-up sequence with demonic ambience and mechanical elements
     */
    playActivateSound() {
        console.log('ArcadeEntity7: playActivateSound called - creating Doom power-on sound');
        try {
            // Create audio context for Doom hellish activation sequence
            const context = new (window.AudioContext || window.AudioContext)();
            console.log('ArcadeEntity7: AudioContext created, state:', context.state);
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('ArcadeEntity7: AudioContext is suspended, attempting to resume');
                context.resume().then(() => {
                    console.log('ArcadeEntity7: AudioContext resumed successfully');
                }).catch(err => {
                    console.error('ArcadeEntity7: Error resuming AudioContext:', err);
                });
            }
            
            // Create a master gain node for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.35; // Moderate volume for the entire sound sequence
            masterGain.connect(context.destination);
            
            // Create a convolver for reverb (hellish cavernous environment)
            const convolver = context.createConvolver();
            const convolverBuffer = context.createBuffer(2, context.sampleRate * 0.7, context.sampleRate);
            
            // Create reverb impulse response for hellish cavern
            for (let channel = 0; channel < 2; channel++) {
                const data = convolverBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    // Create cavernous reverb with metallic resonance (typical of Doom)
                    data[i] = ((Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.2))) * 
                              (0.4 + 0.2 * Math.sin(i / 100));
                }
            }
            convolver.buffer = convolverBuffer;
            
            // Reverb gain control
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.35; // More reverb for hellish cavern space
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            
            // 1. Demonic power-up drone (foundation layer)
            const droneOsc = context.createOscillator();
            droneOsc.type = 'sawtooth'; // Harsh hellish sound typical of Doom
            droneOsc.frequency.setValueAtTime(55, context.currentTime); // Base frequency (E1)
            droneOsc.frequency.linearRampToValueAtTime(110, context.currentTime + 0.8); // Rise to E2

            // Drone filter for gritty texture
            const droneFilter = context.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.setValueAtTime(400, context.currentTime);
            droneFilter.frequency.linearRampToValueAtTime(800, context.currentTime + 0.5);
            droneFilter.Q.value = 3.0; // Resonant hellish quality
            
            // Drone modulation (hellish fluttering)
            const droneLFO = context.createOscillator();
            droneLFO.type = 'square'; // Square wave for harsher modulation
            droneLFO.frequency.value = 5.5; // Demonic pulsation
            
            const droneLFOGain = context.createGain();
            droneLFOGain.gain.value = 20; // Amount of demonic variation
            
            // Drone gain envelope
            const droneGain = context.createGain();
            droneGain.gain.setValueAtTime(0, context.currentTime);
            droneGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.4); // Fade in
            droneGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.9); // Slight decrease
            
            // Connect drone components
            droneLFO.connect(droneLFOGain);
            droneLFOGain.connect(droneOsc.frequency);
            droneOsc.connect(droneFilter);
            droneFilter.connect(droneGain);
            droneGain.connect(masterGain);
            droneGain.connect(convolver);
            
            // 2. Mechanical activation sounds (motors, servo sounds, doors opening)
            const mechBuffer = context.createBuffer(1, context.sampleRate * 1.0, context.sampleRate);
            const mechData = mechBuffer.getChannelData(0);
            
            // Generate mechanical activation effects similar to Doom's elevator/door sounds
            for (let i = 0; i < mechData.length; i++) {
                const progress = i / mechData.length;
                
                // Early motor startup sounds
                if (progress < 0.2) {
                    const motorSpeed = progress * 5; // Motor accelerating
                    const motorNoise = (Math.random() * 2 - 1) * 0.5;
                    const motorHum = Math.sin(2 * Math.PI * 120 * (i / context.sampleRate)) * 0.3;
                    mechData[i] = (motorNoise + motorHum * motorSpeed) * (progress * 3);
                }
                // Middle section: door mechanism and heavy metal impacts
                else if (progress < 0.6) {
                    if (Math.random() < 0.01) {
                        // Metal impacts - like the doors in Doom
                        const impactLength = Math.floor(context.sampleRate * 0.08);
                        if (i + impactLength < mechData.length) {
                            for (let j = 0; j < impactLength; j++) {
                                const impactPhase = j / impactLength;
                                mechData[i + j] = ((Math.random() * 2 - 1) * 0.7) * 
                                                 Math.exp(-impactPhase * 10) * (0.6 + 0.3 * Math.sin(j * 0.4));
                            }
                            i += impactLength - 1;
                        }
                    } else {
                        // Background mechanical sounds
                        mechData[i] = (Math.random() * 2 - 1) * 0.1;
                    }
                }
            }
            
            const mechSource = context.createBufferSource();
            mechSource.buffer = mechBuffer;
            
            const mechGain = context.createGain();
            mechGain.gain.setValueAtTime(0, context.currentTime);
            mechGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.4);
            
            // Connect mechanical sounds
            mechSource.connect(mechGain);
            mechGain.connect(masterGain);
            mechGain.connect(convolver);
            
            // 3. Hellish ambience (demonic whispers and distant screams)
            const hellBuffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const hellData = hellBuffer.getChannelData(0);
            
            for (let i = 0; i < hellData.length; i++) {
                const progress = i / hellData.length;
                
                // Base demonic ambience noise
                let hellSound = (Math.random() * 2 - 1) * Math.min(0.15, progress * 0.2);
                
                // Add intermittent whispers and distant screams
                if (Math.random() < 0.003) {
                    const eventLength = Math.floor(context.sampleRate * 0.1); // 100ms event
                    if (i + eventLength < hellData.length) {
                        for (let j = 0; j < eventLength; j++) {
                            const eventPhase = j / eventLength;
                            // Modulate frequency for demonic effect
                            const freqMod = 80 + Math.sin(j * 0.1) * 30;
                            hellData[i + j] = hellSound + 
                                             (Math.sin(2 * Math.PI * freqMod * j / context.sampleRate) * 0.2 * 
                                             Math.sin(eventPhase * Math.PI));
                        }
                        i += eventLength - 1;
                    }
                } else {
                    hellData[i] = hellSound;
                }
            }
            
            const hellSource = context.createBufferSource();
            hellSource.buffer = hellBuffer;
            
            const hellFilter = context.createBiquadFilter();
            hellFilter.type = 'lowpass';
            hellFilter.frequency.value = 400;
            hellFilter.Q.value = 2.0; // More resonant for demonic quality
            
            const hellGain = context.createGain();
            hellGain.gain.setValueAtTime(0, context.currentTime);
            hellGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.3);
            
            // Connect hellish ambience sounds
            hellSource.connect(hellFilter);
            hellFilter.connect(hellGain);
            hellGain.connect(masterGain);
            hellGain.connect(convolver);
            
            // 4. Weapon loading and activation sounds (shotgun, chainsaw, etc)
            const weaponSounds = [
                { type: 'shotgun', startTime: 0.2, duration: 0.15, frequency: 120 },
                { type: 'chainsaw', startTime: 0.5, duration: 0.25, frequency: 85 },
                { type: 'reload', startTime: 0.8, duration: 0.1, frequency: 200 }
            ];
            
            const weaponOscs = [];
            const weaponGains = [];
            const weaponFilters = [];
            
            for (const sound of weaponSounds) {
                const osc = context.createOscillator();
                
                if (sound.type === 'shotgun') {
                    osc.type = 'square'; // Sharp shotgun pump sound
                } else if (sound.type === 'chainsaw') {
                    osc.type = 'sawtooth'; // Harsh chainsaw motor
                } else { // reload
                    osc.type = 'triangle'; // Metallic reload sound
                }
                
                osc.frequency.value = sound.frequency;
                
                const filter = context.createBiquadFilter();
                if (sound.type === 'shotgun') {
                    filter.type = 'lowpass';
                    filter.frequency.value = 800;
                } else if (sound.type === 'chainsaw') {
                    filter.type = 'bandpass';
                    filter.frequency.value = 250;
                    filter.Q.value = 3.0;
                } else {
                    filter.type = 'highpass';
                    filter.frequency.value = 800;
                }
                
                const gain = context.createGain();
                gain.gain.setValueAtTime(0, context.currentTime);
                gain.gain.setValueAtTime(0, context.currentTime + sound.startTime);
                
                if (sound.type === 'shotgun') {
                    // Sharper attack for shotgun pump
                    gain.gain.linearRampToValueAtTime(0.3, context.currentTime + sound.startTime + 0.01);
                    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + sound.startTime + 0.05);
                    gain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                    
                    // Add frequency ramp down for shotgun pump sound
                    osc.frequency.setValueAtTime(sound.frequency, context.currentTime + sound.startTime);
                    osc.frequency.linearRampToValueAtTime(sound.frequency * 0.7, context.currentTime + sound.startTime + 0.1);
                } else if (sound.type === 'chainsaw') {
                    // Revving up the chainsaw
                    gain.gain.linearRampToValueAtTime(0.15, context.currentTime + sound.startTime + 0.03);
                    gain.gain.linearRampToValueAtTime(0.25, context.currentTime + sound.startTime + 0.1);
                    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + sound.startTime + sound.duration - 0.05);
                    gain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                    
                    // Chainsaw frequency revving
                    osc.frequency.setValueAtTime(sound.frequency, context.currentTime + sound.startTime);
                    osc.frequency.linearRampToValueAtTime(sound.frequency * 1.8, context.currentTime + sound.startTime + 0.1);
                    osc.frequency.linearRampToValueAtTime(sound.frequency * 1.5, context.currentTime + sound.startTime + sound.duration);
                } else { // reload
                    // Metallic reload sound
                    gain.gain.linearRampToValueAtTime(0.2, context.currentTime + sound.startTime + 0.01);
                    gain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                }
                
                // Connect weapon sounds
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);
                gain.connect(convolver);
                
                weaponOscs.push(osc);
                weaponGains.push(gain);
                weaponFilters.push(filter);
            }
            
            // Start all sound sources
            console.log('ArcadeEntity7: Starting all Doom-themed sounds');
            // Start ambient droning
            droneOsc.start();
            droneLFO.start();
            // Start mechanical sounds
            mechSource.start();
            // Start hellish ambience
            hellSource.start();
            
            // Start weapon sounds
            for (const osc of weaponOscs) {
                osc.start();
            }
            
            // Stop and clean up after sequence completes
            setTimeout(() => {
                console.log('ArcadeEntity7: Stopping Doom-themed sounds');
                droneOsc.stop();
                droneLFO.stop();
                
                for (const osc of weaponOscs) {
                    osc.stop();
                }
                
                // Add one final hell portal closing sound
                const portalCloseOsc = context.createOscillator();
                portalCloseOsc.type = 'sawtooth';
                portalCloseOsc.frequency.setValueAtTime(300, context.currentTime);
                portalCloseOsc.frequency.exponentialRampToValueAtTime(50, context.currentTime + 0.6);
                
                const portalCloseGain = context.createGain();
                portalCloseGain.gain.setValueAtTime(0, context.currentTime);
                portalCloseGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.05);
                portalCloseGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);
                
                portalCloseOsc.connect(portalCloseGain);
                portalCloseGain.connect(masterGain);
                portalCloseGain.connect(convolver);
                
                portalCloseOsc.start();
                portalCloseOsc.stop(context.currentTime + 0.7);
                
                // Stop mechanical and hellish sounds
                mechSource.stop();
                hellSource.stop();
                
                // Close context after a short delay
                setTimeout(() => {
                    context.close();
                    console.log('ArcadeEntity7: Audio context closed');
                }, 800);
            }, 800); // Total duration for activation sequence
            
            console.log('ArcadeEntity7: Doom-themed demonic portal sound sequence created and playing');
            debug(`ArcadeEntity7: Played Doom-themed demonic portal sound effect`);
        } catch (err) {
            console.error('ArcadeEntity7: Error playing activation sound:', err);
            debug(`ArcadeEntity7: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play Doom-themed menu selection sounds when changing options
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a master gain for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.3;
            masterGain.connect(context.destination);
            
            // 1. Main weapon switch click sound (primary component)
            const weaponClickOsc = context.createOscillator();
            weaponClickOsc.type = 'square'; // Sharp edge for metallic weapon click
            weaponClickOsc.frequency.setValueAtTime(180, context.currentTime);
            weaponClickOsc.frequency.linearRampToValueAtTime(120, context.currentTime + 0.05);
            
            // Click envelope - sharp attack, quick decay
            const clickGain = context.createGain();
            clickGain.gain.setValueAtTime(0.0, context.currentTime);
            clickGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.01);
            clickGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
            
            // Click filter for metallic character
            const clickFilter = context.createBiquadFilter();
            clickFilter.type = 'highpass';
            clickFilter.frequency.value = 800;
            clickFilter.Q.value = 1.0;
            
            // 2. Menu UI computer beep (secondary component)
            const beepOsc = context.createOscillator();
            beepOsc.type = 'sawtooth'; // 90s computer-like tone
            beepOsc.frequency.setValueAtTime(440, context.currentTime);
            beepOsc.frequency.setValueAtTime(480, context.currentTime + 0.04);
            
            // Beep envelope
            const beepGain = context.createGain();
            beepGain.gain.setValueAtTime(0.0, context.currentTime);
            beepGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
            beepGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
            
            // Filter for retro computer sound
            const beepFilter = context.createBiquadFilter();
            beepFilter.type = 'lowpass';
            beepFilter.frequency.value = 1200;
            beepFilter.Q.value = 2.0;
            
            // Connect everything
            weaponClickOsc.connect(clickFilter);
            clickFilter.connect(clickGain);
            clickGain.connect(masterGain);
            
            beepOsc.connect(beepFilter);
            beepFilter.connect(beepGain);
            beepGain.connect(masterGain);
            
            // Start oscillators
            weaponClickOsc.start();
            beepOsc.start();
            
            // Stop after sound is complete
            setTimeout(() => {
                weaponClickOsc.stop();
                beepOsc.stop();
                context.close();
            }, 200);
            
            console.log('ArcadeEntity7: Played Doom menu selection sound');
        } catch (err) {
            console.error('ArcadeEntity7: Error playing Doom selection sound:', err);
        }
    }
    
    /**
     * Play a Doom-themed launch sound effect for game start
     * A hellish sequence with demonic portal opening, weapon charging, and infernal battle cries
     */
    playLaunchSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for an intense Doom-themed game launch sequence
            
            // 1. Demonic portal opening (foundation of the effect)
            const portalOsc = context.createOscillator();
            portalOsc.type = 'sawtooth'; // Harsh demonic sound
            portalOsc.frequency.setValueAtTime(60, context.currentTime); // Deep rumbling tone
            portalOsc.frequency.exponentialRampToValueAtTime(90, context.currentTime + 0.8); // Portal energy grows
            portalOsc.frequency.exponentialRampToValueAtTime(120, context.currentTime + 1.5); // Full demonic energy
            
            // Portal energy fluctuations for chaotic demonic presence
            const energyOsc = context.createOscillator();
            energyOsc.type = 'square'; // Sharper waveform for harsh demon energy
            energyOsc.frequency.setValueAtTime(0.5, context.currentTime); // Medium energy fluctuation pattern
            energyOsc.frequency.linearRampToValueAtTime(1.2, context.currentTime + 1.0); // Rapidly intensifies
            
            const energyGain = context.createGain();
            energyGain.gain.setValueAtTime(15, context.currentTime); // Initial energy intensity
            energyGain.gain.linearRampToValueAtTime(25, context.currentTime + 1.5); // Growing demonic intensity
            
            // Connect energy fluctuation to portal frequency
            energyOsc.connect(energyGain);
            energyGain.connect(portalOsc.frequency);
            
            // Portal sound filter for hellish atmosphere
            const portalFilter = context.createBiquadFilter();
            portalFilter.type = 'lowshelf';
            portalFilter.frequency.setValueAtTime(150, context.currentTime);
            portalFilter.gain.value = 12; // Heavy boost to low end for infernal rumbling
            
            // 2. Weapon charging and demonic machinery sounds
            const weaponOsc = context.createOscillator();
            weaponOsc.type = 'sawtooth';
            weaponOsc.frequency.setValueAtTime(300, context.currentTime); // Initial weapon powerup
            weaponOsc.frequency.linearRampToValueAtTime(600, context.currentTime + 0.8); // Charging sequence begins
            weaponOsc.frequency.linearRampToValueAtTime(900, context.currentTime + 1.5); // Energy builds
            weaponOsc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 2.0); // Weapon fully charged
            
            const weaponFilter = context.createBiquadFilter();
            weaponFilter.type = 'bandpass';
            weaponFilter.frequency.setValueAtTime(800, context.currentTime);
            weaponFilter.frequency.linearRampToValueAtTime(1500, context.currentTime + 1.5);
            weaponFilter.Q.value = 3.0; // Resonant for electronic weapon charging sounds
            
            // 3. Demonic battle cries and hellish portal sequences
            // First impact - Demonic roar "Your soul is mine!"
            const demonRoar = context.createBufferSource();
            const demonRoarBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const demonRoarData = demonRoarBuffer.getChannelData(0);
            
            for (let i = 0; i < demonRoarData.length; i++) {
                const progress = i / demonRoarData.length;
                // Create a demonic-like formant by combining harsh frequencies
                const baseFreq = 70; // Demonic voice fundamental (very low pitch)
                const formant1 = Math.sin(2 * Math.PI * baseFreq * progress);
                const formant2 = Math.sin(2 * Math.PI * baseFreq * 3.2 * progress) * 0.65; // Harsher overtones
                const formant3 = Math.sin(2 * Math.PI * baseFreq * 5.4 * progress) * 0.35; // More guttural
                const formant4 = Math.sin(2 * Math.PI * baseFreq * 7.8 * progress) * 0.25; // Added infernal layer
                
                // Amplitude envelope to shape the demonic roar
                const roarEnvelope = progress < 0.2 ? 
                    Math.pow(progress / 0.2, 2) * 0.9 : // Initial growl
                    (progress < 0.6 ? 
                        0.9 - Math.sin((progress - 0.2) / 0.4 * Math.PI) * 0.3 : // Main roar
                        Math.pow((1 - progress) / 0.4, 2) * 0.7); // Waning growl
                
                // Add distortion for demonic effect
                const distortionAmount = 0.2;
                const combinedWave = (formant1 + formant2 + formant3 + formant4) * roarEnvelope;
                demonRoarData[i] = Math.tanh(combinedWave * (1 + distortionAmount)) * 0.45;
            }
            demonRoar.buffer = demonRoarBuffer;
            
            // Second impact - Shotgun charging sound (weapon preparation)
            const shotgunCharge = context.createBufferSource();
            const shotgunChargeBuffer = context.createBuffer(1, context.sampleRate * 0.3, context.sampleRate);
            const shotgunChargeData = shotgunChargeBuffer.getChannelData(0);
            
            for (let i = 0; i < shotgunChargeData.length; i++) {
                const progress = i / shotgunChargeData.length;
                // Shotgun charging sound - mechanical, metallic ratcheting
                const metalFreq = 320; // Base frequency for metallic weapon
                const metalTone = Math.sin(2 * Math.PI * metalFreq * progress) * 0.4 + 
                                Math.sin(2 * Math.PI * metalFreq * 3.8 * progress) * 0.3 + 
                                Math.sin(2 * Math.PI * metalFreq * 7.2 * progress) * 0.2;
                                
                // Mechanical weapon racking sounds with metallic clicks
                const clickPattern = Math.floor(progress * 10) % 3 === 0 ? 1.0 : 0.4; // Periodic clicks
                const envelope = progress < 0.05 ? progress / 0.05 * clickPattern : 
                                Math.pow(0.3, (progress - 0.05) * 4) * clickPattern;
                                
                const noise = Math.random() * 0.15; // Add noise for metallic effect
                shotgunChargeData[i] = (metalTone + noise) * envelope * 0.8;
            }
            shotgunCharge.buffer = shotgunChargeBuffer;
            
            // Third impact - Final battle cry "RIP AND TEAR!"
            const battleCry = context.createBufferSource();
            const battleCryBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const battleCryData = battleCryBuffer.getChannelData(0);
            
            for (let i = 0; i < battleCryData.length; i++) {
                const progress = i / battleCryData.length;
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
                                
                // Add distortion and noise for demonic effect
                const distortion = Math.tanh(whistleTone * 3) * 0.3;
                const noise = (Math.random() * 2 - 1) * 0.1 * envelope;
                battleCryData[i] = (distortion + noise) * envelope * 0.6; // Hellish battle cry
            }
            battleCry.buffer = battleCryBuffer;
            
            // 4. Hellish ambient sounds (rising from the depths)
            const hellBufferSize = context.sampleRate * 3; // 3 seconds of infernal ambience
            const hellBuffer = context.createBuffer(2, hellBufferSize, context.sampleRate); // Stereo
            const hellLeft = hellBuffer.getChannelData(0);
            const hellRight = hellBuffer.getChannelData(1);
            
            // Fill hell buffer with layered demonic sounds that build up
            for (let i = 0; i < hellBufferSize; i++) {
                const progress = i / hellBufferSize;
                const infernalIntensity = Math.min(1.0, progress * 1.8); // Rises quickly as portal fully opens
                
                // Time variable for various oscillations
                const t = i / context.sampleRate;
                
                // Base hellish noise - infernal rumbling and demonic whispers
                let hellNoise = (Math.random() * 2 - 1) * 0.25; 
                
                // Add some rhythmic demonic pulsing
                const demonicPulse = Math.sin(2 * Math.PI * 1.2 * t) > 0.6 ? 0.12 : 0.04;
                
                // Add occasional tortured screams that become more frequent with portal opening
                const screamThreshold = 0.997 - infernalIntensity * 0.04;
                const demonicScream = Math.random() > screamThreshold ? 0.20 : 0;
                
                // Combine elements with intensity that increases over time
                const combinedHell = (hellNoise + demonicPulse + demonicScream) * infernalIntensity;
                
                // Add bubbling lava and hellfire sounds
                const lavaSounds = (
                    Math.sin(2 * Math.PI * 40 * t + Math.random() * 0.2) * 0.08 + // Deep lava bubbling
                    Math.sin(2 * Math.PI * 70 * t + Math.random() * 0.3) * 0.05 + // Mid hellfire crackling
                    Math.sin(2 * Math.PI * 110 * t + Math.random() * 0.4) * 0.03   // High ember hisses
                ) * 0.3 * (0.5 + infernalIntensity);
                
                // Create wide stereo field for immersive hellish soundscape
                // Left and right channels have different random elements for realistic infernal dimension
                const leftRandom = Math.random() * 0.08; // More randomness for chaotic hell sounds
                const rightRandom = Math.random() * 0.08;
                
                hellLeft[i] = combinedHell * (0.9 + leftRandom) + lavaSounds * (1.1 + Math.sin(t * 0.4) * 0.4);
                hellRight[i] = combinedHell * (0.9 + rightRandom) + lavaSounds * (0.9 + Math.cos(t * 0.4) * 0.4);
            }
            
            const hellAmbience = context.createBufferSource();
            hellAmbience.buffer = hellBuffer;
            
            const hellFilter = context.createBiquadFilter();
            hellFilter.type = 'bandpass';
            hellFilter.frequency.value = 600; // Infernal sound range
            hellFilter.Q.value = 0.5; // Wider bandwidth for chaotic hell sounds
            
            // 5. Doom weapon and demonic artifact effects
            const weaponBufferSize = context.sampleRate * 3; // 3 seconds of weapon sounds
            const weaponBuffer = context.createBuffer(1, weaponBufferSize, context.sampleRate);
            const weaponData = weaponBuffer.getChannelData(0);
            
            // Create increasing weapon and combat sound effects as battle begins
            for (let i = 0; i < weaponBufferSize; i++) {
                const progress = i / weaponBufferSize;
                const intensity = Math.min(1.0, progress * 1.8); // Increases in intensity faster
                
                // Add random weapon reloads, demonic machinery, and combat sounds based on intensity
                if (Math.random() < 0.03 * intensity) {
                    // When a trail sound occurs, make it last for a short time
                    const effectLength = Math.floor(context.sampleRate * (0.05 + Math.random() * 0.15)); // 50-200ms effect
                    const maxAmp = 0.25 * (0.3 + Math.random() * 0.7) * intensity; // Varying amplitudes
                    
                    // Choose between various Doom weapon and demonic machinery sounds
                    const effectType = Math.random() > 0.6 ? 'shotgun' : (Math.random() > 0.5 ? 'chaingun' : (Math.random() > 0.5 ? 'plasma' : 'machinery'));
                    
                    for (let j = 0; j < effectLength && (i + j) < weaponData.length; j++) {
                        const effectProgress = j / effectLength;
                        // Different envelope shape based on weapon type
                        const envelope = effectType === 'shotgun' ? 
                                        // Fast attack, quick decay for shotgun blast
                                        (effectProgress < 0.03 ? effectProgress / 0.03 : Math.pow(0.5, effectProgress * 6)) :
                                        effectType === 'chaingun' ?
                                        // Pulsating envelope for chaingun firing 
                                        Math.sin(effectProgress * Math.PI) * (0.7 + Math.sin(effectProgress * 30) * 0.3) :
                                        effectType === 'plasma' ?
                                        // Building charge for plasma weapon
                                        Math.pow(effectProgress, 2) * (1 - Math.pow(effectProgress, 8)) :
                                        // Machinery with erratic envelope
                                        (effectProgress < 0.1 ? effectProgress / 0.1 : 0.8) * (0.7 + Math.sin(effectProgress * 15) * 0.3);
                        
                        // Different sound content based on weapon type
                        if (effectType === 'shotgun') {
                            // Shotgun - powerful blast with metallic follow-through
                            const shotgunNoise = (Math.random() * 2 - 1) * 0.7 + // White noise for blast
                                               Math.sin(effectProgress * 60) * 0.3 + // Shell casing sound
                                               Math.sin(effectProgress * 10) * 0.4; // Low-end boom
                            weaponData[i + j] += shotgunNoise * envelope * maxAmp * 1.2; // Amplified for impact
                        } else if (effectType === 'chaingun') {
                            // Chaingun - rapid mechanical fire with rotation
                            const rotationSpeed = 20 + effectProgress * 40; // Increasing speed
                            const chaingunNoise = (Math.random() * 2 - 1) * 0.5 + // Firing noise
                                                Math.sin(2 * Math.PI * rotationSpeed * effectProgress) * 0.6; // Rotation sound
                            weaponData[i + j] += chaingunNoise * envelope * maxAmp;
                        } else if (effectType === 'plasma') {
                            // Plasma weapon - high pitched energy charge and release
                            const plasmaFreq = 500 + effectProgress * 1000; // Rising frequency
                            const plasmaNoise = Math.sin(2 * Math.PI * plasmaFreq * effectProgress) * 0.6 +
                                              Math.sin(2 * Math.PI * (plasmaFreq * 1.5) * effectProgress) * 0.3; // Harmonics
                            weaponData[i + j] += plasmaNoise * envelope * maxAmp * 0.9;
                        } else {
                            // Demonic machinery - hydraulic, mechanical grinding
                            const machineryFreq = 85 + Math.sin(effectProgress * 8) * 25; // Oscillating frequency
                            const machineryNoise = (Math.random() * 2 - 1) * 0.5 + // Noise component
                                                  Math.sin(2 * Math.PI * machineryFreq * effectProgress) * 0.4 + // Base tone
                                                  Math.sin(2 * Math.PI * (machineryFreq * 2.3) * effectProgress) * 0.2; // Harmonics
                            weaponData[i + j] += machineryNoise * envelope * maxAmp * 1.1;
                        }
                    }
                }
            }
            
            const weaponEffects = context.createBufferSource();
            weaponEffects.buffer = weaponBuffer;
            
            const combatFilter = context.createBiquadFilter();
            combatFilter.type = 'bandpass';
            combatFilter.frequency.value = 1500; // Middle range for weapon and machinery sounds
            
            // 6. Gain nodes for all demonic components with dynamic hellish portal envelopes
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.2, context.currentTime); // Start with deep infernal rumble
            portalGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.8); // Build up as portal opens
            portalGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 1.5); // Full demonic energy
            portalGain.gain.linearRampToValueAtTime(0.45, context.currentTime + 2.0); // Slight decrease as portal stabilizes
            
            const weaponGain = context.createGain();
            weaponGain.gain.setValueAtTime(0.0, context.currentTime);
            weaponGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.5); // Initial weapon power-up
            weaponGain.gain.linearRampToValueAtTime(0.45, context.currentTime + 1.2); // Weapon charging
            weaponGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 2.0); // Weapon heat stabilization
            
            const demonRoarGain = context.createGain();
            demonRoarGain.gain.value = 0.7; // Louder for demonic impact
            
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
            
            debug(`ArcadeEntity7: Played outdoor adventure start sequence launch sound`);
        } catch (err) {
            debug(`ArcadeEntity7: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity7: Using Web Audio API for sound generation`);
    }
    
    /**
     * Play ominous Doom-inspired approach sounds when player enters interaction range
     * Creates an atmosphere reminiscent of classic 90s Doom shooter with dark ambient effects and demonic elements
     */
    playProximitySound() {
        console.log('ArcadeEntity7: playProximitySound called - creating Doom-inspired ambient effect');
        try {
            // Create audio context for Doom-inspired sounds
            const context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('ArcadeEntity7: AudioContext created for Doom ambience, state:', context.state);
            
            // Check if we need to handle audio context resume for autoplay policy
            if (context.state === 'suspended') {
                console.log('ArcadeEntity7: AudioContext is suspended, attempting to resume');
                context.resume().then(() => {
                    console.log('ArcadeEntity7: AudioContext resumed successfully');
                }).catch(err => {
                    console.error('ArcadeEntity7: Error resuming AudioContext:', err);
                });
            }
            
            // Create a master gain node for overall volume control
            const masterGain = context.createGain();
            masterGain.gain.value = 0.45; // Slightly increased volume for the eerie effect
            masterGain.connect(context.destination);
            
            // Create a convolver for cavernous hell-like reverb
            const convolver = context.createConvolver();
            const convolverBuffer = context.createBuffer(2, context.sampleRate * 1.5, context.sampleRate);
            
            // Create reverb impulse response for Doom-like hellish cavernous space
            for (let channel = 0; channel < 2; channel++) {
                const data = convolverBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    // Create dark, long decay reverb characteristic of Doom's claustrophobic environments
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.3)) * 0.5;
                }
            }
            convolver.buffer = convolverBuffer;
            
            // Reverb gain control
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.6; // Heavy reverb for cavernous effect
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            
            // 1. Low droning ambience (foundation layer) - iconic Doom ambient bass
            const droneOsc = context.createOscillator();
            droneOsc.type = 'sawtooth'; // Harsher tone than sine for ominous feel
            droneOsc.frequency.setValueAtTime(55, context.currentTime); // E1 - very low base frequency
            droneOsc.frequency.linearRampToValueAtTime(58, context.currentTime + 0.8); // Subtle pitch bend for unease

            // Drone filter - dark and rumbling
            const droneFilter = context.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.setValueAtTime(250, context.currentTime);
            droneFilter.Q.value = 0.7; // Slightly resonant
            
            // Drone modulation - slow pulsing effect like Doom E1M1
            const droneLFO = context.createOscillator();
            droneLFO.type = 'triangle';
            droneLFO.frequency.value = 0.8; // Slow, brooding modulation
            
            const droneLFOGain = context.createGain();
            droneLFOGain.gain.value = 15; // Amount of drone modulation
            
            // Drone gain envelope
            const droneGain = context.createGain();
            droneGain.gain.setValueAtTime(0, context.currentTime);
            droneGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.3); // Fade in
            droneGain.gain.linearRampToValueAtTime(0.28, context.currentTime + 1.0); // Slight decrease
            
            // Connect drone components
            droneLFO.connect(droneLFOGain);
            droneLFOGain.connect(droneOsc.frequency);
            droneOsc.connect(droneFilter);
            droneFilter.connect(droneGain);
            droneGain.connect(masterGain);
            droneGain.connect(convolver);
            
            // 2. Demonic whispers - characteristic of Doom's atmosphere
            const whisperBuffer = context.createBuffer(1, context.sampleRate * 2.0, context.sampleRate);
            const whisperData = whisperBuffer.getChannelData(0);
            
            // Generate demonic whisper-like sounds
            for (let i = 0; i < whisperData.length; i++) {
                const t = i / context.sampleRate;
                const progress = i / whisperData.length;
                
                // Base noise component for the whispers
                let noise = (Math.random() * 2 - 1) * 0.15;
                
                // Add occasional whisper bursts
                if (Math.random() < 0.003) {
                    const whisperLength = Math.floor(context.sampleRate * (0.1 + Math.random() * 0.3));
                    const whisperType = Math.floor(Math.random() * 3); // Different whisper types
                    
                    if (i + whisperLength < whisperData.length) {
                        for (let j = 0; j < whisperLength; j++) {
                            const phase = j / whisperLength;
                            const envelope = Math.sin(Math.PI * phase); // Envelope shape
                            
                            // Different whisper patterns based on type
                            let whisperSound;
                            if (whisperType === 0) {
                                // Fast oscillating whisper (demonic)
                                whisperSound = Math.sin(2 * Math.PI * (300 + 200 * Math.sin(phase * 12)) * j / context.sampleRate);
                            } else if (whisperType === 1) {
                                // Breathy noise whisper
                                whisperSound = (Math.random() * 2 - 1) * 0.5;
                            } else {
                                // Low growl with harmonics
                                whisperSound = Math.sin(2 * Math.PI * 80 * j / context.sampleRate) * 0.3 +
                                             Math.sin(2 * Math.PI * 160 * j / context.sampleRate) * 0.2 +
                                             Math.sin(2 * Math.PI * 240 * j / context.sampleRate) * 0.1;
                            }
                            
                            // Apply envelope and add to existing data
                            if (i + j < whisperData.length) {
                                whisperData[i + j] = noise * 0.3 + whisperSound * envelope * 0.7;
                            }
                        }
                        
                        i += whisperLength - 1; // Skip ahead
                    }
                } else {
                    whisperData[i] = noise * (0.2 + 0.3 * Math.sin(t * 0.5));
                }
            }
            
            const whisperSource = context.createBufferSource();
            whisperSource.buffer = whisperBuffer;
            
            // Apply filtering to the whispers
            const whisperFilter = context.createBiquadFilter();
            whisperFilter.type = 'bandpass';
            whisperFilter.frequency.value = 800;
            whisperFilter.Q.value = 0.8;
            
            const whisperGain = context.createGain();
            whisperGain.gain.setValueAtTime(0, context.currentTime);
            whisperGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.7);
            
            // Connect whisper sounds
            whisperSource.connect(whisperFilter);
            whisperFilter.connect(whisperGain);
            whisperGain.connect(masterGain);
            whisperGain.connect(convolver);
            
            // 3. Door/portal sounds (iconic Doom door effects)
            const doorBuffer = context.createBuffer(1, context.sampleRate * 1.0, context.sampleRate);
            const doorData = doorBuffer.getChannelData(0);
            
            // Create a Doom-style door/lift mechanical sound
            for (let i = 0; i < doorData.length; i++) {
                const t = i / context.sampleRate;
                const progress = i / doorData.length;
                
                if (progress < 0.3) {
                    // Initial mechanical clunk (door unlock sound)
                    const freq = 120 + 30 * Math.sin(progress * 20);
                    doorData[i] = Math.sin(2 * Math.PI * freq * t) * 0.7 * (0.3 - progress);
                } else if (progress < 0.8) {
                    // Door movement sound - hydraulic hiss with mechanical elements
                    const noise = (Math.random() * 2 - 1) * 0.3;
                    const mechanical = Math.sin(2 * Math.PI * 85 * t) * 0.2 * Math.sin(progress * 10);
                    doorData[i] = noise + mechanical;
                } else {
                    // Door stop sound with reverb tail
                    const stopSound = Math.sin(2 * Math.PI * 60 * t) * 0.5 * Math.exp(-(progress - 0.8) * 15);
                    doorData[i] = stopSound + (Math.random() * 2 - 1) * 0.1 * (1 - progress);
                }
            }
            
            const doorSource = context.createBufferSource();
            doorSource.buffer = doorBuffer;
            
            const doorFilter = context.createBiquadFilter();
            doorFilter.type = 'lowpass';
            doorFilter.frequency.value = 2000;
            
            const doorGain = context.createGain();
            doorGain.gain.setValueAtTime(0, context.currentTime);
            doorGain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.1);
            doorGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.8);
            
            // Connect door sounds
            doorSource.connect(doorFilter);
            doorFilter.connect(doorGain);
            doorGain.connect(masterGain);
            doorGain.connect(convolver);
            
            // 4. Distant monster growls/effects (iconic Doom monster sounds)
            const monsterSounds = [
                { type: 'imp', startTime: 0.5, duration: 0.3, baseFreq: 100 },
                { type: 'zombie', startTime: 1.2, duration: 0.25, baseFreq: 150 },
                { type: 'distant', startTime: 0.2, duration: 0.6, baseFreq: 80 }
            ];
            
            const monsterNodes = [];
            const monsterGains = [];
            
            // Create each monster sound
            for (const sound of monsterSounds) {
                // Create a buffer for this monster sound
                const monsterBuffer = context.createBuffer(1, context.sampleRate * sound.duration, context.sampleRate);
                const monsterData = monsterBuffer.getChannelData(0);
                
                for (let i = 0; i < monsterData.length; i++) {
                    const progress = i / monsterData.length;
                    const t = i / context.sampleRate;
                    
                    if (sound.type === 'imp') {
                        // Imp-like screeching sound
                        const freq = sound.baseFreq * (1 + progress * 2 - Math.pow(progress, 2) * 1.5);
                        monsterData[i] = Math.sin(2 * Math.PI * freq * t) * 0.4 * Math.sin(Math.PI * progress) +
                                      (Math.random() * 2 - 1) * 0.2 * Math.sin(Math.PI * progress);
                    } else if (sound.type === 'zombie') {
                        // Zombie grunt
                        const gruntFreq = sound.baseFreq * (1 - 0.5 * progress);
                        monsterData[i] = Math.sin(2 * Math.PI * gruntFreq * t) * 0.4 * Math.pow(Math.sin(Math.PI * progress), 2) +
                                      Math.sin(2 * Math.PI * gruntFreq * 2 * t) * 0.2 * Math.pow(Math.sin(Math.PI * progress), 2) +
                                      (Math.random() * 2 - 1) * 0.15 * Math.sin(Math.PI * progress);
                    } else { // distant
                        // Distant monster roar
                        const roarFreq = sound.baseFreq * (1 + 0.3 * Math.sin(progress * 6));
                        monsterData[i] = Math.sin(2 * Math.PI * roarFreq * t) * 0.3 * Math.pow(Math.sin(Math.PI * progress), 0.5) +
                                      (Math.random() * 2 - 1) * 0.1;
                    }
                }
                
                const monsterSource = context.createBufferSource();
                monsterSource.buffer = monsterBuffer;
                
                const monsterFilter = context.createBiquadFilter();
                monsterFilter.type = sound.type === 'distant' ? 'lowpass' : 'bandpass';
                monsterFilter.frequency.value = sound.type === 'distant' ? 500 : 1200;
                
                const monsterGain = context.createGain();
                monsterGain.gain.setValueAtTime(0, context.currentTime);
                monsterGain.gain.setValueAtTime(0, context.currentTime + sound.startTime);
                monsterGain.gain.linearRampToValueAtTime(0.3, context.currentTime + sound.startTime + 0.05);
                monsterGain.gain.linearRampToValueAtTime(0, context.currentTime + sound.startTime + sound.duration);
                
                // Connect monster sound
                monsterSource.connect(monsterFilter);
                monsterFilter.connect(monsterGain);
                monsterGain.connect(masterGain);
                monsterGain.connect(convolver);
                
                monsterNodes.push(monsterSource);
                monsterGains.push(monsterGain);
            }
            
            // Start all sound sources
            console.log('ArcadeEntity7: Starting all Doom-inspired sounds');
            droneOsc.start();
            droneLFO.start();
            whisperSource.start();
            doorSource.start();
            
            // Start monster sounds
            for (const source of monsterNodes) {
                source.start();
            }
            
            // Set timeouts to stop and clean up oscillators
            setTimeout(() => {
                try {
                    droneOsc.stop();
                    droneLFO.stop();
                    
                    // Disconnect all nodes to allow garbage collection
                    droneGain.disconnect();
                    whisperGain.disconnect();
                    doorGain.disconnect();
                    
                    for (const gain of monsterGains) {
                        gain.disconnect();
                    }
                    
                    masterGain.disconnect();
                    console.log('ArcadeEntity7: Doom sound effects cleaned up');
                } catch (err) {
                    console.error('ArcadeEntity7: Error cleaning up sound resources:', err);
                }
            }, 2000); // 2 second sound effect duration
        } catch (err) {
            console.error('ArcadeEntity7: Error creating approach sound:', err);
        }
    }
    
    /**
     * Load game images for the selection screen
     */
    loadGameImages() {
        debug(`ArcadeEntity7: Loading game images for Vibe Disc cabinet`); 
        console.log(`🎮 ArcadeEntity7: Loading game images for Vibe Disc cabinet`);
        
        if (!this.games || this.games.length === 0) {
            debug(`ArcadeEntity7: No games to load images for`);
            console.warn(`🎮 ArcadeEntity7: No games to load images for`);
            return;
        }
        
        console.log(`🎮 ArcadeEntity7: Loading images for ${this.games.length} games:`, 
            this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity7: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity7: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity7: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity7: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity7: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity7: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity7: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity7: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity7: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity7: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity7: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity7: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity7: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity7: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity7: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity7: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
            
            const img = new Image();
            img.onload = () => {
                console.log(`🎮 ArcadeEntity7: Successfully loaded alternative image for ${game.title}`);
                game.image = img;
            };
            
            img.onerror = () => {
                console.warn(`🎮 ArcadeEntity7: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity7: Creating canvas fallback image for ${game.title}`);
        
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
        
        console.log(`🎮 ArcadeEntity7: Fallback image created for ${game.title}`);
    }

    /**
     * Play a Doom-themed portal closing sound when closing the menu
     * Creates hellish energy dissipation, metal grinding, and demonic presence fading
     */
    playMenuCloseSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Hellish energy dissipation sound
            const portalOsc = context.createOscillator();
            portalOsc.type = 'sawtooth'; // Harsh demonic base sound
            portalOsc.frequency.setValueAtTime(150, context.currentTime); // Moderate portal energy
            portalOsc.frequency.exponentialRampToValueAtTime(60, context.currentTime + 0.3); // Energy collapsing
            portalOsc.frequency.exponentialRampToValueAtTime(30, context.currentTime + 0.5); // Portal closing
            
            // Portal fluctuation irregularities (unstable energy)
            const fluctuationOsc = context.createOscillator();
            fluctuationOsc.type = 'square'; // Harsher square wave for demonic quality
            fluctuationOsc.frequency.setValueAtTime(8, context.currentTime); // Moderate fluctuation rate
            fluctuationOsc.frequency.linearRampToValueAtTime(3, context.currentTime + 0.4); // Slowing as portal closes
            
            const fluctuationGain = context.createGain();
            fluctuationGain.gain.setValueAtTime(20, context.currentTime); // Initial fluctuation intensity
            fluctuationGain.gain.linearRampToValueAtTime(5, context.currentTime + 0.4); // Decreasing fluctuations
            
            // Connect fluctuation to portal frequency
            fluctuationOsc.connect(fluctuationGain);
            fluctuationGain.connect(portalOsc.frequency);
            
            // Portal filter to shape the sound
            const portalFilter = context.createBiquadFilter();
            portalFilter.type = 'lowpass';
            portalFilter.frequency.setValueAtTime(1200, context.currentTime); // Full spectrum initially
            portalFilter.frequency.linearRampToValueAtTime(100, context.currentTime + 0.5); // Closing energy signature
            portalFilter.Q.value = 8.0; // Resonant demonic quality
            
            // Portal gain envelope
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.4, context.currentTime); // Start at moderate volume
            portalGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.35); // Fade as portal closes
            portalGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.5); // Residual energy
            
            // 2. Mechanical sounds of hell gates and demonic machinery powering down
            const mechanicalTimes = [
                { startTime: 0.08, duration: 0.15, vol: 0.35, type: 'metal' },   // Metal doors/gates closing
                { startTime: 0.25, duration: 0.12, vol: 0.4, type: 'hydraulic' }, // Hydraulic pistons releasing
                { startTime: 0.38, duration: 0.10, vol: 0.3, type: 'steam' },     // Demonic steam release
                { startTime: 0.45, duration: 0.08, vol: 0.25, type: 'lock' }      // Final locking mechanism
            ];
            
            // Create oscillators for mechanical hell sounds
            const mechanicalOscs = [];
            const mechanicalGains = [];
            
            for (let i = 0; i < mechanicalTimes.length; i++) {
                const mech = mechanicalTimes[i];
                
                // Create appropriate oscillator based on sound type
                const osc = context.createOscillator();
                
                if (mech.type === 'metal') {
                    // Metal gate/door sound - harsh clanging sound
                    osc.type = 'sawtooth'; 
                    osc.frequency.value = 120 + Math.random() * 80; // Metal gate frequency
                } else if (mech.type === 'hydraulic') {
                    // Hydraulic pistons sound - pressurized release
                    osc.type = 'square'; 
                    osc.frequency.value = 85 + Math.random() * 40; // Deep hydraulic sound
                } else if (mech.type === 'steam') {
                    // Demonic steam release - hissing noise
                    osc.type = 'sawtooth'; 
                    osc.frequency.value = 2000 + Math.random() * 1000; // High frequency hiss
                } else { // lock
                    // Final mechanical locking sound
                    osc.type = 'square'; 
                    osc.frequency.value = 180 + Math.random() * 50; // Heavy lock mechanism
                }
                
                // Create gain with appropriate envelope for this demonic mechanical sound
                const gain = context.createGain();
                gain.gain.setValueAtTime(0.0, context.currentTime);
                gain.gain.setValueAtTime(0.0, context.currentTime + mech.startTime);
                
                // Different attack/decay for different sound types
                if (mech.type === 'metal') {
                    // Metal gate has sharp attack and long, resonant decay
                    gain.gain.linearRampToValueAtTime(mech.vol, context.currentTime + mech.startTime + 0.01);
                    gain.gain.linearRampToValueAtTime(mech.vol * 0.7, context.currentTime + mech.startTime + mech.duration * 0.5);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + mech.startTime + mech.duration);
                } else if (mech.type === 'hydraulic') {
                    // Hydraulic has medium attack and gradual hissing decay
                    gain.gain.linearRampToValueAtTime(mech.vol, context.currentTime + mech.startTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + mech.startTime + mech.duration);
                } else if (mech.type === 'steam') {
                    // Steam has quick attack and slow decay
                    gain.gain.linearRampToValueAtTime(mech.vol, context.currentTime + mech.startTime + 0.008);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + mech.startTime + mech.duration);
                } else { // lock
                    // Lock has sharp attack and quick decay
                    gain.gain.linearRampToValueAtTime(mech.vol, context.currentTime + mech.startTime + 0.005);
                    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + mech.startTime + mech.duration * 0.6);
                }
                
                // Store for later
                mechanicalOscs.push(osc);
                mechanicalGains.push(gain);
                
                // Connect
                osc.connect(gain);
            }
            
            // 3. Demonic ambient sounds - distant screams, hellish whispers, void atmosphere
            const demonicBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
            const demonicData = demonicBuffer.getChannelData(0);
            
            // Create hellish ambient soundscape
            for (let i = 0; i < demonicData.length; i++) {
                const progress = i / demonicData.length;
                
                // Background demonic whispers
                const whisperBase = Math.sin(2 * Math.PI * (300 + Math.random() * 200) * i / context.sampleRate) * 0.03;
                
                // Random demonic whispers and distant screams that get more frequent toward the middle
                const demonicInterval = Math.min(4000, 8000 * Math.abs(progress - 0.5) + 1000); // More sounds in middle, sparse at beginning/end
                const isDemonicSound = (i % Math.floor(demonicInterval) < 15) && (Math.random() > 0.65);
                
                if (isDemonicSound) {
                    // Determine if it's a demonic scream or a hellish growl
                    const isScream = Math.random() > 0.8 && progress > 0.2;
                    const soundLength = isScream ? 400 : 150; // Screams are longer sounds
                    const soundFreq = isScream ? (800 + Math.random() * 400) : (120 + Math.random() * 80);
                    
                    for (let j = 0; j < soundLength && (i + j) < demonicData.length; j++) {
                        // Different envelope shapes for different demonic sounds
                        const amplitude = isScream ?
                            // Demonic scream envelope - slower rise, long agonizing decay
                            (j < soundLength * 0.2 ? j/(soundLength * 0.2) : (1 - ((j - soundLength * 0.2) / (soundLength * 0.8)))) * 0.2 :
                            // Hellish growl envelope - quick attack, rumbling decay
                            Math.pow(1 - j/soundLength, 1.2) * 0.25;
                            
                        demonicData[i + j] += Math.sin(j * soundFreq/context.sampleRate * Math.PI * 2) * amplitude;
                    }
                    i += soundLength - 1; // Skip ahead
                } else {
                    // Constant background hellish whispers
                    demonicData[i] = whisperBase * (0.5 + progress * 0.5); // Whispers intensify as portal closes
                }
            }
            
            const demonicSource = context.createBufferSource();
            demonicSource.buffer = demonicBuffer;
            
            // Filter for demonic ambient sounds
            const demonicFilter = context.createBiquadFilter();
            demonicFilter.type = 'notch'; // Creates an eerie quality
            demonicFilter.frequency.value = 1200;
            demonicFilter.Q.value = 4.0; // Narrower for supernatural resonance
            
            // Gain for demonic sounds
            const demonicGain = context.createGain();
            demonicGain.gain.setValueAtTime(0.0, context.currentTime);
            demonicGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.2); // Delay start until portal energy dissipates
            demonicGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.3); // Demonic sounds surge
            demonicGain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.55); // Sustain with demonic presence
            
            // 4. Final demonic finality sound - hellish gate slam and distant infernal rumble
            const finalityOsc = context.createOscillator();
            finalityOsc.type = 'square'; // Harsh tone for demonic gate slam
            finalityOsc.frequency.setValueAtTime(55, context.currentTime + 0.45); // Deep impact frequency
            finalityOsc.frequency.linearRampToValueAtTime(35, context.currentTime + 0.65); // Dropping into abyss
            
            const finalityGain = context.createGain();
            finalityGain.gain.setValueAtTime(0.0, context.currentTime);
            finalityGain.gain.setValueAtTime(0.0, context.currentTime + 0.45); // Delay until end of sequence
            finalityGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.47); // Sudden impact
            finalityGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.5); // Sustain
            finalityGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7); // Infernal decay
            
            // 5. Hellish atmosphere fadeout - distant wails and unholy rumbling
            const hellBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const hellData = hellBuffer.getChannelData(0);
            
            // Create hellish atmosphere fading into void
            for (let i = 0; i < hellData.length; i++) {
                const progress = i / hellData.length;
                // Gradually decrease intensity as void consumes all
                const intensity = Math.max(0, 1.0 - progress * 1.8);
                // Add low frequency modulation for unholy rumbling
                const rumbleModulation = Math.sin(2 * Math.PI * 0.3 * i / context.sampleRate) * 0.35;
                // Filtered noise for hellish atmosphere
                hellData[i] = ((Math.random() * 2 - 1) * 0.08 + rumbleModulation * 0.04) * intensity;
            }
            
            const hellNoise = context.createBufferSource();
            hellNoise.buffer = hellBuffer;
            
            const hellFilter = context.createBiquadFilter();
            hellFilter.type = 'lowshelf'; // Emphasize low frequencies for rumbling
            hellFilter.frequency.value = 200; // Sweet spot for hellish rumbling
            hellFilter.gain.value = 4.0; // Boost the low end for demonic quality
            
            const hellGain = context.createGain();
            hellGain.gain.setValueAtTime(0.18, context.currentTime);
            hellGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.65); // Longer, ominous fadeout
            
            // Create a hellish reverb effect like a vast infernal chamber
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2.0, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a vast hellish chamber reverb (longer, more cavernous)
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.9, i / (context.sampleRate * 0.25)); // Slower decay for infernal cavern
                // Add distant demonic echoes for infernal chamber feeling
                const demonicEcho = (i % (context.sampleRate * 0.18) < 20) ? 0.08 * Math.random() : 0;
                reverbL[i] = ((Math.random() * 2 - 1) * 0.45 + demonicEcho) * decay;
                reverbR[i] = ((Math.random() * 2 - 1) * 0.45 + demonicEcho) * decay * 0.85; // Slightly different for stereo effect
            }
            convolver.buffer = reverbBuffer;
            
            // Main output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.4; // Slightly louder for demonic impact
            
            // Connect all components
            portalOsc.connect(portalFilter);
            portalFilter.connect(portalGain);
            portalGain.connect(convolver);
            portalGain.connect(masterGain);
            
            // Connect all mechanical hell sounds
            for (let i = 0; i < mechanicalGains.length; i++) {
                mechanicalGains[i].connect(convolver);
                mechanicalGains[i].connect(masterGain);
            }
            
            demonicSource.connect(demonicFilter);
            demonicFilter.connect(demonicGain);
            demonicGain.connect(convolver);
            demonicGain.connect(masterGain);
            
            finalityOsc.connect(finalityGain);
            finalityGain.connect(convolver);
            finalityGain.connect(masterGain);
            
            hellNoise.connect(hellFilter);
            hellFilter.connect(hellGain);
            hellGain.connect(convolver);
            hellGain.connect(masterGain);
            
            // Connect reverb to master (heavy reverb for infernal chamber acoustics)
            const reverbGain = context.createGain();
            reverbGain.gain.value = 0.4; // More reverb for hellish caverns
            convolver.connect(reverbGain);
            reverbGain.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start demonic sound components
            portalOsc.start();
            fluctuationOsc.start();
            mechanicalOscs.forEach(osc => osc.start());
            demonicSource.start();
            finalityOsc.start();
            hellNoise.start();
            
            // Stop and clean up
            setTimeout(() => {
                portalOsc.stop();
                fluctuationOsc.stop();
                mechanicalOscs.forEach(osc => osc.stop());
                demonicSource.stop();
                finalityOsc.stop();
                hellNoise.stop();
                context.close();
            }, 750); // Slightly longer for full hellish sequence
            
            debug(`ArcadeEntity7: Played Doom-themed portal closing sound`);
        } catch (err) {
            debug(`ArcadeEntity7: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * @deprecated This method has been replaced by the Doom-themed version above
     */
    _playOutdoorProximitySound() {
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
            
            debug(`ArcadeEntity7: Played immersive ${selectedSport} outdoor sports and nature sound effect`);
        } catch (err) {
            debug(`ArcadeEntity7: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity7: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity7: Using fallback rendering`);
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
            debug(`ArcadeEntity7: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity7: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity7: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        
        // Draw "Not Mobile Enabled" warning when player is near
        if (this.isNearPlayer) {
            this.drawMobileWarning(ctx, x, y + 70);
        }
        
        ctx.restore();
    }
    
    /**
     * Draw game selection interface
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawGameSelectionInterface(ctx) {
        debug(`ArcadeEntity7: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity7 instance
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
                url: 'https://x.com/MSFTResearch'
            });
            
            console.log('Added ArcadeEntity7 Twitter clickable area:', 
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
        overlayCtx.fillText('@MSFTResearch', width/2 + 135, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@MSFTResearch').width;
        
        // Get the exact position where the text ends since it's right-aligned
        const textStartX = width/2 + 135 - twitterHandleWidth;
        
        // Underline to show it's clickable - using measured width and exact position
        overlayCtx.fillRect(textStartX, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Cleanup: Remove the Twitter link when the menu is closed
        if (!this.gameSelectVisible) {
            const oldLink = document.getElementById(twitterLinkId);
            if (oldLink) {
                console.log('Removing ArcadeEntity7 Twitter link:', twitterLinkId);
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
        debug(`ArcadeEntity7: Checking menu click at ${clientX}, ${clientY}`);
        
        // Skip if menu not visible
        if (!this.gameSelectVisible) return;
        
        // Debounce mechanism to prevent multiple rapid clicks
        const now = Date.now();
        if (!this._lastClickTime) {
            this._lastClickTime = 0;
        }
        
        // If less than 500ms since last click, ignore this click
        if (now - this._lastClickTime < 500) {
            debug(`ArcadeEntity7: Ignoring click - too soon after previous click`);
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
            
            debug(`ArcadeEntity7: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity7: Clicked on area: ${area.type}`);
                    
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
                                    debug(`ArcadeEntity7: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity7: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab, with same protection
                            if (area.url) {
                                const urlLastClickTime = this._lastClickedUrls[area.url] || 0;
                                if (now - urlLastClickTime > 2000) { // 2 second cooldown per URL
                                    debug(`ArcadeEntity7: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity7: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
    
    /**
     * Draw a warning that games in this arcade are not mobile-compatible
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - X position to draw at
     * @param {number} y - Y position to draw at
     */
    drawMobileWarning(ctx, x, y) {
        ctx.save();
        
        // Set up text style
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const warningText = 'Not Mobile Enabled';
        
        // Measure text for background
        const textWidth = ctx.measureText(warningText).width;
        const padding = 15;
        const warningWidth = textWidth + (padding * 2);
        const warningHeight = 32;
        const warningX = x - (warningWidth / 2);
        const warningY = y - (warningHeight / 2);
        
        // Create a dark to red gradient background for warning
        const gradient = ctx.createLinearGradient(warningX, warningY, warningX, warningY + warningHeight);
        gradient.addColorStop(0, `rgba(60, 0, 0, 0.9)`);
        gradient.addColorStop(0.5, `rgba(100, 0, 0, 0.9)`);
        gradient.addColorStop(1, `rgba(60, 0, 0, 0.9)`);
        
        // Draw background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(warningX, warningY, warningWidth, warningHeight);
        
        // Draw border with red glow effect
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(warningX, warningY, warningWidth, warningHeight);
        ctx.shadowBlur = 0;
        
        // Draw warning text
        ctx.fillStyle = 'rgba(255, 200, 200, 0.9)';
        ctx.fillText(warningText, x, y);
        
        ctx.restore();
    }

}

export { ArcadeEntity7 };
