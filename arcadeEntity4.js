/**
 * Arcade Cabinet Entity for AI Alchemist's Lair
 * Decorative third arcade cabinet with interactive game selection functionality
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';
import { getAssetPath } from './pathResolver.js';

class ArcadeEntity4 extends Entity {
    /**
     * Creates a new arcade cabinet entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use ('Arcade_4', etc)
     * @param {object} options - Additional options
     */
    constructor(x, y, assetKey = 'Arcade_4', options = {}) {
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
        this.arcadeId = options.arcadeId || 'arcade4-' + Math.floor(Math.random() * 10000);
        
        // Visual properties
        this.glowColor = '#FF00FF';
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
                title: 'Gnome Mercy', 
                description: 'A bullet heaven roguelight',
                url: 'https://gnome-mercy.vercel.app/',
                imagePath: 'assets/Games/Game_8.png',
                image: null,
                alternativeImagePaths: ['assets/Games/Game_8.png', 'assets/games/Game_8.png']
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
        
        console.log(`ArcadeEntity4: Initialized with ${this.games.length} games:`, this.games);
        
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
        debug(`🧪 ArcadeEntity4: Testing direct image load with multiple paths...`);
        
        // Try multiple different path formats
        const pathsToTry = [
            window.location.origin + '/assets/decor/Arcade_4.png',
            'assets/decor/Arcade_4.png',
            './assets/decor/Arcade_4.png',
            '/assets/decor/Arcade_4.png',
            window.location.origin + '/assets/decor/Arcade%204.png',
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
        debug(`ArcadeEntity4: Attempting to load asset for ${this.assetKey}`);
        
        // First check if asset is already loaded with this key
        const existingAsset = assetLoader.getAsset(this.assetKey);
        if (existingAsset) {
            debug(`ArcadeEntity4: Found existing asset for ${this.assetKey}`);
            this.asset = existingAsset;
            this.hasLoaded = true;
            return;
        }
        
        // Directly attempt to load the image
        debug(`ArcadeEntity4: Asset not found in cache, attempting direct load`);
        this.directLoadArcadeImage();
    }
    
    /**
     * Directly load the arcade cabinet image without relying on asset loader
     */
    directLoadArcadeImage() {
        debug(`ArcadeEntity4: Directly loading arcade image for key ${this.assetKey}`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            debug(`ArcadeEntity4: SUCCESSFULLY loaded arcade image directly (${img.width}x${img.height})`);
            this.asset = img;
            this.hasLoaded = true;
            
            // Store in asset loader for potential reuse
            if (window.assetLoader) {
                window.assetLoader.assets[this.assetKey] = img;
            }
        };
        
        img.onerror = (err) => {
            debug(`ArcadeEntity4: FAILED to load arcade image directly from exact path, error: ${err}`);
            this.tryAlternativePaths();
        };
        
        // Force to use the EXACT path that matches the file in the directory with GitHub Pages handling
        // This is known to exist from the dir command
        const exactPath = 'assets/decor/Arcade_4.png';
        const resolvedPath = getAssetPath(exactPath);
        debug(`ArcadeEntity4: Attempting to load from resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try to load the arcade image from alternative paths
     */
    tryAlternativePaths() {
        debug(`ArcadeEntity4: Trying alternative paths for image`);
        
        // Try several alternative paths - we now know the exact filename is "Arcade 1.png"
        // Generate both regular and GitHub Pages-resolved paths
        const basePaths = [
            `assets/decor/Arcade_4.png`,        // Exact filename with space
            `./assets/decor/Arcade_4.png`,      // With leading ./ and space
            `assets/decor/Arcade%204.png`,      // URL encoded space
            `assets/decor/Arcade-4.png`,        // Hyphen instead of space
            `assets/decor/Arcade4.png`,         // No space
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
                debug(`ArcadeEntity4: All alternative paths failed, creating fallback`);
                this.createFallbackAsset();
                return;
            }
            
            const path = alternativePaths[pathIndex];
            debug(`ArcadeEntity4: Trying alternative path (${pathIndex+1}/${alternativePaths.length}): ${path}`);
            
            const altImg = new Image();
            
            altImg.onload = () => {
                debug(`ArcadeEntity4: Successfully loaded from alternative path: ${path}`);
                this.asset = altImg;
                this.hasLoaded = true;
                
                // Store in asset loader for potential reuse
                if (window.assetLoader) {
                    window.assetLoader.assets[this.assetKey] = altImg;
                }
            };
            
            altImg.onerror = () => {
                debug(`ArcadeEntity4: Failed to load from alternative path: ${path}`);
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
        debug(`ArcadeEntity4: Creating fallback asset`);
        
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
            debug(`ArcadeEntity4: Fallback asset created successfully (${img.width}x${img.height})`);
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
            debug(`ArcadeEntity4: No player provided to isPlayerNearby check`);
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
            debug(`ArcadeEntity4: Player is nearby (distance: ${distance.toFixed(2)})`);
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
                debug(`ArcadeEntity4: Player proximity changed to ${isNearPlayer ? 'NEAR' : 'FAR'}`);
                
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
                debug(`ArcadeEntity4: Enter key pressed, starting interaction`);
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
                debug(`ArcadeEntity4: Player walked away, closing game selection`);
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
        debug(`ArcadeEntity4: WARNING - handleInput() is deprecated, input handling moved to update()`);
    }
    
    /**
     * Start arcade cabinet interaction
     */
    startInteraction() {
        debug(`ArcadeEntity4: Starting interaction`);
        this.gameSelectVisible = true;
        
        // Tell the game system we're in an interaction
        // This prevents player movement during menu navigation
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(true);
            debug(`ArcadeEntity4: Set game interaction state to active`);
        } else {
            console.warn(`ArcadeEntity4: Game interaction system not available!`);
        }
        
        // Play sound
        this.playActivateSound();
    }
    
    /**
     * Hide game selection menu
     */
    hideGameSelection() {
        debug(`ArcadeEntity4: Hiding game selection`);
        
        // Play a sound effect when closing the menu
        this.playMenuCloseSound();
        
        this.gameSelectVisible = false;
        
        // Tell the game system interaction is over
        // This allows player movement again
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
            debug(`ArcadeEntity4: Set game interaction state to inactive`);
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
            console.log('ArcadeEntity4: Removed Twitter clickable areas');
        }
    }
    
    /**
     * Launch the selected game
     */
    launchGame() {
        debug(`ArcadeEntity4: Launching game: ${this.games[this.selectedGameIndex].title}`);
        
        if (this.games.length === 0) {
            debug(`ArcadeEntity4: No games available to launch`);
            return;
        }
        
        // Get the selected game
        const selectedGame = this.games[this.selectedGameIndex];
        debug(`ArcadeEntity4: Launching game: ${selectedGame.title}`);
        
        // Play launch sound
        this.playLaunchSound();
        
        // Restore game interaction state before launching
        if (window.game && typeof window.game.setInteractionActive === 'function') {
            window.game.setInteractionActive(false);
        }
        
        // Open the game URL
        try {
            window.open(selectedGame.url, '_blank');
            debug(`ArcadeEntity4: Successfully opened URL for ${selectedGame.title}`);
        } catch (err) {
            debug(`ArcadeEntity4: Failed to open URL: ${err}`);
        }
        
        // Hide the game selection interface
        this.hideGameSelection();
    }
    
    /**
     * Play a magical crystal/arcane power activation sound when powering on the arcade cabinet
     * Creates a rising magical energy effect with crystal resonance and arcane power build-up
     */
    playActivateSound() {
        try {
            // Create audio context for magical activation sequence
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Deep arcane power build-up (rising magical energy)
            const arcaneOsc = context.createOscillator();
            arcaneOsc.type = 'sine'; // Pure tone for magical energy
            arcaneOsc.frequency.setValueAtTime(50, context.currentTime); // Start at very low frequency
            arcaneOsc.frequency.exponentialRampToValueAtTime(120, context.currentTime + 0.6); // Rising power
            arcaneOsc.frequency.exponentialRampToValueAtTime(80, context.currentTime + 1.2); // Settle into stable hum
            
            // Add magical pulse/throb to the energy
            const pulseOsc = context.createOscillator();
            pulseOsc.type = 'sine';
            pulseOsc.frequency.setValueAtTime(3, context.currentTime); // Slow pulse initially
            pulseOsc.frequency.linearRampToValueAtTime(6, context.currentTime + 1.0); // Accelerating pulse
            
            const pulseGain = context.createGain();
            pulseGain.gain.setValueAtTime(10, context.currentTime); // Pulse depth
            pulseGain.gain.linearRampToValueAtTime(20, context.currentTime + 1.0); // Increasing modulation
            
            // Connect pulse modulation to arcane base frequency
            pulseOsc.connect(pulseGain);
            pulseGain.connect(arcaneOsc.frequency);
            
            // Arcane energy tone shaping
            const arcaneFilter = context.createBiquadFilter();
            arcaneFilter.type = 'lowshelf';
            arcaneFilter.frequency.value = 300;
            arcaneFilter.gain.value = 8; // Boost low end for richness
            
            // Arcane energy build-up envelope
            const arcaneGain = context.createGain();
            arcaneGain.gain.setValueAtTime(0.01, context.currentTime); // Start very quiet
            arcaneGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.7); // Rising power
            arcaneGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 1.2); // Full strength
            
            // 2. Crystal resonance activation (high bell-like tones in sequence)
            // Create multiple crystal oscillators for a chord-like activation sequence
            const crystalTones = [
                { freq: 1200, startTime: 0.2, duration: 1.5 },   // Base crystal tone
                { freq: 1800, startTime: 0.35, duration: 1.4 },  // Higher harmonic
                { freq: 2400, startTime: 0.5, duration: 1.2 },   // Even higher harmonic
                { freq: 3000, startTime: 0.65, duration: 1.0 }   // Highest chime
            ];
            
            // Create and configure crystal oscillators
            const crystalOscs = [];
            const crystalGains = [];
            
            for (let i = 0; i < crystalTones.length; i++) {
                const tone = crystalTones[i];
                
                // Create oscillator for this crystal tone
                const osc = context.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = tone.freq;
                
                // Create gain node with envelope for this crystal tone
                const gain = context.createGain();
                gain.gain.setValueAtTime(0.0, context.currentTime);
                gain.gain.setValueAtTime(0.0, context.currentTime + tone.startTime); // Delayed start
                gain.gain.linearRampToValueAtTime(0.15, context.currentTime + tone.startTime + 0.1); // Quick attack
                gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + tone.startTime + tone.duration); // Decay
                
                // Store for later use
                crystalOscs.push(osc);
                crystalGains.push(gain);
                
                // Connect this crystal tone to master
                osc.connect(gain);
            }
            
            // 3. Magical shimmer/sparkles effect (increasing over time)
            const sparkleBufferSize = context.sampleRate * 2; // 2 seconds buffer
            const sparkleBuffer = context.createBuffer(1, sparkleBufferSize, context.sampleRate);
            const sparkleData = sparkleBuffer.getChannelData(0);
            
            // Create increasing magical sparkle density as power builds
            for (let i = 0; i < sparkleBufferSize; i++) {
                const progress = i / sparkleBufferSize;
                const density = Math.min(1.0, progress * 2.5); // Increases in density over time
                
                // Random sparkles with density control
                if (Math.random() < 0.015 * density) {
                    // When a sparkle is created, make it last for a short time
                    const sparkleLength = Math.floor(context.sampleRate * 0.04); // 40ms sparkle
                    const maxAmp = 0.25 * (0.5 + Math.random() * 0.5); // Varying amplitudes
                    
                    for (let j = 0; j < sparkleLength && (i + j) < sparkleData.length; j++) {
                        const sparkleProgress = j / sparkleLength;
                        const envelope = Math.sin(sparkleProgress * Math.PI); // Bell curve
                        const freq = 3000 + Math.random() * 5000; // High frequency
                        sparkleData[i + j] += Math.sin(2 * Math.PI * freq * sparkleProgress) * envelope * maxAmp;
                    }
                }
            }
            
            const sparkles = context.createBufferSource();
            sparkles.buffer = sparkleBuffer;
            
            const sparkleFilter = context.createBiquadFilter();
            sparkleFilter.type = 'highpass';
            sparkleFilter.frequency.value = 5000;
            
            const sparkleGain = context.createGain();
            sparkleGain.gain.setValueAtTime(0.0, context.currentTime);
            sparkleGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.5); // Gradual increase
            sparkleGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1.2); // Peak intensity
            
            // 4. Mystical energy hum/aura (white noise filtered)
            const auraBufferSize = context.sampleRate * 2;
            const auraBuffer = context.createBuffer(1, auraBufferSize, context.sampleRate);
            const auraData = auraBuffer.getChannelData(0);
            
            // Fill buffer with noise for the magical aura
            for (let i = 0; i < auraBufferSize; i++) {
                auraData[i] = Math.random() * 2 - 1;
            }
            
            const aura = context.createBufferSource();
            aura.buffer = auraBuffer;
            
            // Filter for magical aura sound
            const auraFilter = context.createBiquadFilter();
            auraFilter.type = 'bandpass';
            auraFilter.frequency.value = 1000;
            auraFilter.Q.value = 1.5;
            
            const auraGain = context.createGain();
            auraGain.gain.setValueAtTime(0.0, context.currentTime);
            auraGain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.8); // Gradual fade in
            auraGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 1.2); // Peak volume
            
            // Create a convolver for adding magical ambience/reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a rich hall-like reverb
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.9, i / (context.sampleRate * 0.3));
                reverbL[i] = (Math.random() * 2 - 1) * decay;
                reverbR[i] = (Math.random() * 2 - 1) * decay;
            }
            convolver.buffer = reverbBuffer;
            
            // Final master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.3;
            
            // Connect arcane energy components
            arcaneOsc.connect(arcaneFilter);
            arcaneFilter.connect(arcaneGain);
            arcaneGain.connect(convolver);
            arcaneGain.connect(masterGain); // Direct signal path
            
            // Connect all crystal oscillators to master and convolver
            for (let i = 0; i < crystalGains.length; i++) {
                crystalGains[i].connect(convolver);
                crystalGains[i].connect(masterGain); // Direct signal path
            }
            
            // Connect sparkles
            sparkles.connect(sparkleFilter);
            sparkleFilter.connect(sparkleGain);
            sparkleGain.connect(convolver);
            sparkleGain.connect(masterGain);
            
            // Connect aura
            aura.connect(auraFilter);
            auraFilter.connect(auraGain);
            auraGain.connect(convolver);
            auraGain.connect(masterGain);
            
            // Connect reverb to master
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start all sound sources
            arcaneOsc.start();
            pulseOsc.start();
            crystalOscs.forEach(osc => osc.start());
            sparkles.start();
            aura.start();
            
            // Stop and clean up
            setTimeout(() => {
                arcaneOsc.stop();
                pulseOsc.stop();
                crystalOscs.forEach(osc => osc.stop());
                sparkles.stop();
                aura.stop();
                context.close();
            }, 1800); // Duration for the magical activation sequence
            
            debug(`ArcadeEntity4: Played magical crystal/arcane activation sound`);
        } catch (err) {
            debug(`ArcadeEntity4: Error playing activation sound: ${err}`);
        }
    }
    
    /**
     * Play a magical crystal chime sound when changing menu selections
     */
    playSelectSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Create magical crystal/glass chime sound (primary selection sound)
            const crystalOsc = context.createOscillator();
            crystalOsc.type = 'sine';
            crystalOsc.frequency.setValueAtTime(1800, context.currentTime); // High pitched crystal tone
            crystalOsc.frequency.exponentialRampToValueAtTime(1500, context.currentTime + 0.15); // Slight pitch decay
            
            // Add shimmer effect to the crystal sound
            const shimmerOsc = context.createOscillator();
            shimmerOsc.type = 'sine';
            shimmerOsc.frequency.value = 20; // Fast shimmer
            
            const shimmerGain = context.createGain();
            shimmerGain.gain.value = 10; // Amount of shimmer modulation
            
            // Connect shimmer modulation
            shimmerOsc.connect(shimmerGain);
            shimmerGain.connect(crystalOsc.frequency);
            
            // Create gain envelope for crystal tone
            const crystalGain = context.createGain();
            crystalGain.gain.setValueAtTime(0.0, context.currentTime);
            crystalGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.01); // Fast attack
            crystalGain.gain.setValueAtTime(0.15, context.currentTime + 0.05); // Short sustain
            crystalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25); // Long magical decay
            
            // Create filter for crystal tone shaping
            const crystalFilter = context.createBiquadFilter();
            crystalFilter.type = 'bandpass';
            crystalFilter.frequency.value = 2000;
            crystalFilter.Q.value = 4.0; // More resonant for crystal-like quality
            
            // 2. Create a metal impact sound (like sword hilt hitting a metal surface)
            const metalOsc = context.createOscillator();
            metalOsc.type = 'triangle';
            metalOsc.frequency.setValueAtTime(400, context.currentTime); // Medium-low pitch
            metalOsc.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.08); // Quick downward pitch
            
            // Create gain for metal impact
            const metalGain = context.createGain();
            metalGain.gain.setValueAtTime(0.0, context.currentTime);
            metalGain.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.01); // Fast attack
            metalGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1); // Fast decay
            
            // 3. Add magical dust/particle effect (high frequency noise)
            const dustBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
            const dustData = dustBuffer.getChannelData(0);
            for (let i = 0; i < dustData.length; i++) {
                // Create dust-like pattern with more high-frequency components
                dustData[i] = Math.random() * 0.04 - 0.02; // Quiet dust noise
            }
            
            const dust = context.createBufferSource();
            dust.buffer = dustBuffer;
            
            const dustFilter = context.createBiquadFilter();
            dustFilter.type = 'highpass';
            dustFilter.frequency.value = 5000; // Only allow high frequencies for sparkle effect
            dustFilter.Q.value = 1.0;
            
            const dustGain = context.createGain();
            dustGain.gain.setValueAtTime(0.0, context.currentTime);
            dustGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.02); // Fast attack
            dustGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); // Medium decay
            
            // Connect all nodes
            crystalOsc.connect(crystalFilter);
            crystalFilter.connect(crystalGain);
            crystalGain.connect(context.destination);
            
            metalOsc.connect(metalGain);
            metalGain.connect(context.destination);
            
            dust.connect(dustFilter);
            dustFilter.connect(dustGain);
            dustGain.connect(context.destination);
            
            // Start sound sources
            crystalOsc.start();
            shimmerOsc.start();
            metalOsc.start();
            dust.start();
            
            // Stop and clean up
            setTimeout(() => {
                crystalOsc.stop();
                shimmerOsc.stop();
                metalOsc.stop();
                dust.stop();
                context.close();
            }, 300); // Slightly longer for crystal decay
            
            debug(`ArcadeEntity4: Played magical crystal menu selection sound`);
        } catch (err) {
            debug(`ArcadeEntity4: Error playing selection sound: ${err}`);
        }
    }
    
    /**
     * Play an epic fantasy portal/gateway opening sound effect for game launch
     * A dramatic magical sequence with rising energy, thunderous impacts, and choir
     */
    playLaunchSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create components for an epic fantasy portal/gateway opening
            
            // 1. Low rumbling magical energy build-up (the foundation of the effect)
            const portalBaseOsc = context.createOscillator();
            portalBaseOsc.type = 'sine';
            portalBaseOsc.frequency.setValueAtTime(60, context.currentTime); // Start with deep bass
            portalBaseOsc.frequency.exponentialRampToValueAtTime(80, context.currentTime + 1.0); // Subtle rise
            portalBaseOsc.frequency.exponentialRampToValueAtTime(40, context.currentTime + 2.5); // Dramatic drop
            
            // Pulsing effect for the portal energy
            const pulseOsc = context.createOscillator();
            pulseOsc.type = 'sine';
            pulseOsc.frequency.setValueAtTime(2, context.currentTime); // Slow pulse initially
            pulseOsc.frequency.linearRampToValueAtTime(5, context.currentTime + 2.0); // Faster as portal opens
            
            const pulseGain = context.createGain();
            pulseGain.gain.setValueAtTime(15, context.currentTime); // Initial pulse strength
            pulseGain.gain.linearRampToValueAtTime(30, context.currentTime + 2.0); // More intense pulsing
            
            // Connect pulse modulation to portal base frequency
            pulseOsc.connect(pulseGain);
            pulseGain.connect(portalBaseOsc.frequency);
            
            // Portal base tone filter for richness
            const portalFilter = context.createBiquadFilter();
            portalFilter.type = 'lowshelf';
            portalFilter.frequency.setValueAtTime(300, context.currentTime);
            portalFilter.gain.value = 10; // Boost low end for rumble
            
            // 2. Magical crystalline harmonic overtones
            const crystalOsc = context.createOscillator();
            crystalOsc.type = 'sine';
            crystalOsc.frequency.setValueAtTime(400, context.currentTime); // Starting pitch
            crystalOsc.frequency.linearRampToValueAtTime(800, context.currentTime + 1.0); // Rise
            crystalOsc.frequency.linearRampToValueAtTime(1200, context.currentTime + 2.0); // Peak
            crystalOsc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 2.8); // Settle
            
            const crystalFilter = context.createBiquadFilter();
            crystalFilter.type = 'bandpass';
            crystalFilter.frequency.setValueAtTime(1000, context.currentTime);
            crystalFilter.frequency.linearRampToValueAtTime(1500, context.currentTime + 2.0);
            crystalFilter.Q.value = 3;
            
            // 3. Three dramatic sword/thunder impacts at key moments in the sequence
            // First impact - Portal begins to open
            const impact1 = context.createBufferSource();
            const impact1Buffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
            const impact1Data = impact1Buffer.getChannelData(0);
            
            for (let i = 0; i < impact1Data.length; i++) {
                const progress = i / impact1Data.length;
                // Sharp attack, quick decay
                const envelope = progress < 0.02 ? progress / 0.02 : Math.pow(0.1, progress * 5);
                impact1Data[i] = ((Math.random() * 2 - 1) * 0.5 + Math.sin(progress * 120)) * envelope;
            }
            impact1.buffer = impact1Buffer;
            
            // Second impact - Portal fully forms (louder, more resonant)
            const impact2 = context.createBufferSource();
            const impact2Buffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const impact2Data = impact2Buffer.getChannelData(0);
            
            for (let i = 0; i < impact2Data.length; i++) {
                const progress = i / impact2Data.length;
                // More resonant tail
                const envelope = progress < 0.01 ? progress / 0.01 : Math.pow(0.2, progress * 3);
                impact2Data[i] = ((Math.random() * 2 - 1) * 0.7 + Math.sin(progress * 80)) * envelope;
            }
            impact2.buffer = impact2Buffer;
            
            // Third impact - Final burst as gateway fully opens
            const impact3 = context.createBufferSource();
            const impact3Buffer = context.createBuffer(1, context.sampleRate * 0.8, context.sampleRate);
            const impact3Data = impact3Buffer.getChannelData(0);
            
            for (let i = 0; i < impact3Data.length; i++) {
                const progress = i / impact3Data.length;
                // Longest decay with some flutter
                const envelope = progress < 0.008 ? progress / 0.008 : Math.pow(0.3, progress * 2.5);
                const flutter = 1.0 + 0.2 * Math.sin(progress * 140);
                impact3Data[i] = ((Math.random() * 2 - 1) * 0.9 + Math.sin(progress * 60)) * envelope * flutter;
            }
            impact3.buffer = impact3Buffer;
            
            // 4. Ethereal magical choir sound (rising in intensity)
            const choirBufferSize = context.sampleRate * 3; // 3 seconds choir
            const choirBuffer = context.createBuffer(2, choirBufferSize, context.sampleRate); // Stereo
            const choirLeft = choirBuffer.getChannelData(0);
            const choirRight = choirBuffer.getChannelData(1);
            
            // Fill choir buffer with layered sine tones that create a choir-like effect
            for (let i = 0; i < choirBufferSize; i++) {
                const progress = i / choirBufferSize;
                const choirIntensity = Math.min(1.0, progress * 2.5); // Rises faster than other elements
                
                // Create chord-like structure with multiple frequencies
                const t = i / context.sampleRate;
                const f1 = 220; // A3
                const f2 = 277.18; // C#4
                const f3 = 329.63; // E4
                const f4 = 440; // A4
                
                // Base choir sound with vibrato
                const vibrato = 0.015 * Math.sin(2 * Math.PI * 6 * t); // 6 Hz vibrato
                const choir = (
                    Math.sin(2 * Math.PI * f1 * (t + vibrato)) * 0.2 +
                    Math.sin(2 * Math.PI * f2 * (t + vibrato)) * 0.15 +
                    Math.sin(2 * Math.PI * f3 * (t + vibrato)) * 0.15 +
                    Math.sin(2 * Math.PI * f4 * (t + vibrato)) * 0.1
                ) * choirIntensity * 0.3;
                
                // Slight stereo variation
                choirLeft[i] = choir * (1 + 0.1 * Math.sin(t * 0.5));
                choirRight[i] = choir * (1 + 0.1 * Math.cos(t * 0.5));
            }
            
            const choir = context.createBufferSource();
            choir.buffer = choirBuffer;
            
            const choirFilter = context.createBiquadFilter();
            choirFilter.type = 'bandpass';
            choirFilter.frequency.value = 800;
            choirFilter.Q.value = 1.0;
            
            // 5. Magical energy swirls and sparkles
            const sparkleBufferSize = context.sampleRate * 3; // 3 seconds of sparkle effects
            const sparkleBuffer = context.createBuffer(1, sparkleBufferSize, context.sampleRate);
            const sparkleData = sparkleBuffer.getChannelData(0);
            
            // Create increasing magical sparkle density as the portal opens
            for (let i = 0; i < sparkleBufferSize; i++) {
                const progress = i / sparkleBufferSize;
                const density = Math.min(1.0, progress * 3.0); // Increases in density
                
                // Random sparkles with density control
                if (Math.random() < 0.02 * density) {
                    // When a sparkle is created, make it last for a short time
                    const sparkleLength = Math.floor(context.sampleRate * 0.05); // 50ms sparkle
                    const maxAmp = 0.3 * (0.5 + Math.random() * 0.5); // Varying amplitudes
                    
                    for (let j = 0; j < sparkleLength && (i + j) < sparkleData.length; j++) {
                        const sparkleProgress = j / sparkleLength;
                        const envelope = Math.sin(sparkleProgress * Math.PI); // Bell curve
                        const freq = 3000 + Math.random() * 5000; // High frequency
                        sparkleData[i + j] += Math.sin(2 * Math.PI * freq * sparkleProgress) * envelope * maxAmp;
                    }
                }
            }
            
            const sparkles = context.createBufferSource();
            sparkles.buffer = sparkleBuffer;
            
            const sparkleFilter = context.createBiquadFilter();
            sparkleFilter.type = 'highpass';
            sparkleFilter.frequency.value = 6000;
            
            // 6. Gain nodes for all components with dramatic envelopes
            const portalGain = context.createGain();
            portalGain.gain.setValueAtTime(0.05, context.currentTime); // Start soft
            portalGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1.0); // Build
            portalGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 2.0); // Peak
            portalGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2.8); // Settle
            
            const crystalGain = context.createGain();
            crystalGain.gain.setValueAtTime(0.0, context.currentTime);
            crystalGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.7);
            crystalGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 2.0);
            crystalGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 2.8);
            
            const impact1Gain = context.createGain();
            impact1Gain.gain.value = 0.6;
            
            const impact2Gain = context.createGain();
            impact2Gain.gain.value = 0.8;
            
            const impact3Gain = context.createGain();
            impact3Gain.gain.value = 1.0;
            
            const choirGain = context.createGain();
            choirGain.gain.setValueAtTime(0.0, context.currentTime);
            choirGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 1.5);
            choirGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 2.5);
            
            const sparkleGain = context.createGain();
            sparkleGain.gain.setValueAtTime(0.0, context.currentTime);
            sparkleGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 1.0);
            sparkleGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2.0);
            sparkleGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 2.5);
            
            // Create a convolver for adding magical reverb
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 3, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a rich hall-like reverb
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.9, i / (context.sampleRate * 0.3));
                reverbL[i] = (Math.random() * 2 - 1) * decay;
                reverbR[i] = (Math.random() * 2 - 1) * decay;
            }
            convolver.buffer = reverbBuffer;
            
            // Master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.7;
            
            // Connect portal base components
            portalBaseOsc.connect(portalFilter);
            portalFilter.connect(portalGain);
            portalGain.connect(convolver);
            portalGain.connect(masterGain); // Direct path too
            
            // Connect crystal tones
            crystalOsc.connect(crystalFilter);
            crystalFilter.connect(crystalGain);
            crystalGain.connect(convolver);
            crystalGain.connect(masterGain);
            
            // Schedule impact sounds to play at specific times
            // First impact at 0.5 seconds
            setTimeout(() => {
                impact1.connect(impact1Gain);
                impact1Gain.connect(convolver);
                impact1Gain.connect(masterGain);
                impact1.start();
            }, 500);
            
            // Second impact at 1.5 seconds
            setTimeout(() => {
                impact2.connect(impact2Gain);
                impact2Gain.connect(convolver);
                impact2Gain.connect(masterGain);
                impact2.start();
            }, 1500);
            
            // Third impact at 2.5 seconds
            setTimeout(() => {
                impact3.connect(impact3Gain);
                impact3Gain.connect(convolver);
                impact3Gain.connect(masterGain);
                impact3.start();
            }, 2500);
            
            // Connect choir
            choir.connect(choirFilter);
            choirFilter.connect(choirGain);
            choirGain.connect(convolver);
            choirGain.connect(masterGain);
            
            // Connect sparkles
            sparkles.connect(sparkleFilter);
            sparkleFilter.connect(sparkleGain);
            sparkleGain.connect(convolver);
            sparkleGain.connect(masterGain);
            
            // Connect reverb to master
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start continuous sound sources
            portalBaseOsc.start();
            pulseOsc.start();
            crystalOsc.start();
            choir.start();
            sparkles.start();
            
            // Stop and clean up
            setTimeout(() => {
                portalBaseOsc.stop();
                pulseOsc.stop();
                crystalOsc.stop();
                choir.stop();
                sparkles.stop();
                context.close();
            }, 3000); // Duration for the full magical portal sequence
            
            debug(`ArcadeEntity4: Played epic fantasy portal opening launch sound`);
        } catch (err) {
            debug(`ArcadeEntity4: Error playing launch sound: ${err}`);
        }
    }
    
    /**
     * Load sound effects
     */
    loadSoundEffects() {
        // We're now using Web Audio API for sound generation
        // No need to load external sound files
        debug(`ArcadeEntity4: Using Web Audio API for sound generation`);
    }
    
    /**
     * Load game images for the selection screen
     */
    loadGameImages() {
        debug(`ArcadeEntity4: Loading game images for Gnome Mercy cabinet`); 
        console.log(`🎮 ArcadeEntity4: Loading game images for Gnome Mercy cabinet`);
        
        if (!this.games || this.games.length === 0) {
            debug(`ArcadeEntity4: No games to load images for`);
            console.warn(`🎮 ArcadeEntity4: No games to load images for`);
            return;
        }
        
        console.log(`🎮 ArcadeEntity4: Loading images for ${this.games.length} games:`, 
            this.games.map(g => g.title).join(', '));
        
        // Load images for each game that has an imagePath
        this.games.forEach(game => {
            if (game.imagePath) {
                debug(`ArcadeEntity4: Loading image for ${game.title}: ${game.imagePath}`);
                console.log(`🎮 ArcadeEntity4: Loading image for ${game.title}: ${game.imagePath}`);
                
                // Create image object
                const img = new Image();
                
                // Set up load handlers
                img.onload = () => {
                    debug(`ArcadeEntity4: Successfully loaded image for ${game.title}`);
                    console.log(`🎮 ArcadeEntity4: Successfully loaded image for ${game.title}`);
                    game.image = img;
                    
                    // Check if all games have images loaded
                    if (this.games.every(g => g.image)) {
                        console.log(`🎮 ArcadeEntity4: All game images loaded successfully`);
                        this.gameImagesLoaded = true;
                    }
                };
                
                img.onerror = (err) => {
                    debug(`ArcadeEntity4: Failed to load image for ${game.title}: ${err}`);
                    console.error(`🎮 ArcadeEntity4: Failed to load image for ${game.title}: ${err}`);
                    
                    // Try alternative paths if available
                    if (game.alternativeImagePaths && game.alternativeImagePaths.length > 0) {
                        console.log(`🎮 ArcadeEntity4: Trying alternative paths for ${game.title}`);
                        this.tryAlternativeImagePaths(game);
                    } else {
                        // Create a fallback canvas image
                        console.log(`🎮 ArcadeEntity4: Creating fallback image for ${game.title}`);
                        this.createFallbackImage(game);
                    }
                };
                
                // Try to use window.getAssetPath if available
                let finalPath = game.imagePath;
                if (typeof window.getAssetPath === 'function') {
                    try {
                        finalPath = window.getAssetPath(game.imagePath);
                        console.log(`🎮 ArcadeEntity4: Resolved path: ${finalPath}`);
                    } catch (e) {
                        console.warn(`🎮 ArcadeEntity4: Could not resolve path, using original: ${finalPath}`);
                    }
                }
                
                // Start loading
                img.src = finalPath;
            } else {
                debug(`ArcadeEntity4: No image path for ${game.title}`);
                console.warn(`🎮 ArcadeEntity4: No image path for ${game.title}`);
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
            console.warn(`🎮 ArcadeEntity4: No alternative paths for ${game.title}`);
            this.createFallbackImage(game);
            return;
        }
        
        let pathIndex = 0;
        const tryNextPath = () => {
            if (pathIndex >= game.alternativeImagePaths.length) {
                console.error(`🎮 ArcadeEntity4: All alternative paths failed for ${game.title}`);
                this.createFallbackImage(game);
                return;
            }
            
            const altPath = game.alternativeImagePaths[pathIndex];
            console.log(`🎮 ArcadeEntity4: Trying alternative path ${pathIndex+1}/${game.alternativeImagePaths.length}: ${altPath}`);
            
            const img = new Image();
            img.onload = () => {
                console.log(`🎮 ArcadeEntity4: Successfully loaded alternative image for ${game.title}`);
                game.image = img;
            };
            
            img.onerror = () => {
                console.warn(`🎮 ArcadeEntity4: Failed to load alternative path: ${altPath}`);
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
    console.log(`🎮 ArcadeEntity4: Creating canvas fallback image for ${game.title}`);
        
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
        
        console.log(`🎮 ArcadeEntity4: Fallback image created for ${game.title}`);
    }

    /**
     * Play a magical portal closing/power down sound when closing the menu
     * Creates a descending magical energy with dissolving crystals and arcane closure sounds
     */
    playMenuCloseSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Magical energy dissipation - descending tone
            const energyOsc = context.createOscillator();
            energyOsc.type = 'sine';
            energyOsc.frequency.setValueAtTime(220, context.currentTime); // Start at medium frequency
            energyOsc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.2); // Quick descent
            energyOsc.frequency.exponentialRampToValueAtTime(50, context.currentTime + 0.5); // Final low rumble
            
            // Pulsating energy as it fades
            const pulseOsc = context.createOscillator();
            pulseOsc.type = 'sine';
            pulseOsc.frequency.setValueAtTime(8, context.currentTime); // Faster pulse initially
            pulseOsc.frequency.linearRampToValueAtTime(2, context.currentTime + 0.4); // Slowing down
            
            const pulseGain = context.createGain();
            pulseGain.gain.setValueAtTime(20, context.currentTime); // Initial pulse depth
            pulseGain.gain.linearRampToValueAtTime(5, context.currentTime + 0.4); // Decreasing modulation
            
            // Connect pulse to energy frequency
            pulseOsc.connect(pulseGain);
            pulseGain.connect(energyOsc.frequency);
            
            // Energy filter to shape the sound
            const energyFilter = context.createBiquadFilter();
            energyFilter.type = 'lowshelf';
            energyFilter.frequency.setValueAtTime(300, context.currentTime);
            energyFilter.gain.value = 8; // Rich low end
            
            // Energy gain envelope
            const energyGain = context.createGain();
            energyGain.gain.setValueAtTime(0.3, context.currentTime); // Start at moderate volume
            energyGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.35); // Fade as energy depletes
            energyGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5); // Complete fade out
            
            // 2. Crystalline fragmentation sounds - descending chimes
            const crystalTones = [
                { freq: 1800, startTime: 0.02, decay: 0.15, vol: 0.2 },
                { freq: 1500, startTime: 0.1, decay: 0.15, vol: 0.18 },
                { freq: 1200, startTime: 0.17, decay: 0.15, vol: 0.16 },
                { freq: 900, startTime: 0.24, decay: 0.15, vol: 0.14 }
            ];
            
            // Create oscillators for crystal dissolution
            const crystalOscs = [];
            const crystalGains = [];
            
            for (let i = 0; i < crystalTones.length; i++) {
                const tone = crystalTones[i];
                
                // Create oscillator
                const osc = context.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = tone.freq;
                
                // Create gain with envelope for this crystal tone
                const gain = context.createGain();
                gain.gain.setValueAtTime(0.0, context.currentTime);
                gain.gain.setValueAtTime(0.0, context.currentTime + tone.startTime);
                gain.gain.linearRampToValueAtTime(tone.vol, context.currentTime + tone.startTime + 0.01); // Quick attack
                gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + tone.startTime + tone.decay); // Fast decay
                
                // Store for later
                crystalOscs.push(osc);
                crystalGains.push(gain);
                
                // Connect
                osc.connect(gain);
            }
            
            // 3. Magic dispersal/collapse effect
            const collapseBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
            const collapseData = collapseBuffer.getChannelData(0);
            
            // Create a magical collapse sound - reversed magical shatter
            for (let i = 0; i < collapseData.length; i++) {
                const progress = i / collapseData.length;
                const reverseProgress = 1 - progress;
                
                // More intensity at the beginning (which is the end of the reversal)
                const intensity = Math.pow(reverseProgress, 0.5);
                const sineComponent = Math.sin(reverseProgress * 40) * Math.sin(reverseProgress * 20);
                collapseData[i] = ((Math.random() * 2 - 1) * 0.3 + sineComponent * 0.7) * intensity;
            }
            
            const collapseSource = context.createBufferSource();
            collapseSource.buffer = collapseBuffer;
            
            // Filter for collapse sound
            const collapseFilter = context.createBiquadFilter();
            collapseFilter.type = 'bandpass';
            collapseFilter.frequency.value = 1200;
            collapseFilter.Q.value = 1.0;
            
            // Gain for collapse effect
            const collapseGain = context.createGain();
            collapseGain.gain.setValueAtTime(0.0, context.currentTime);
            collapseGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.1); // Quick ramp up
            collapseGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.4); // Fade out
            
            // 4. Final magical seal/locking effect
            const sealOsc = context.createOscillator();
            sealOsc.type = 'triangle';
            sealOsc.frequency.setValueAtTime(400, context.currentTime + 0.3); // Medium-low frequency
            sealOsc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.5); // Dropping pitch
            
            // Add slight vibrato to seal sound for mystical quality
            const sealVibratoOsc = context.createOscillator();
            sealVibratoOsc.type = 'sine';
            sealVibratoOsc.frequency.value = 10; // 10Hz vibrato
            
            const sealVibratoGain = context.createGain();
            sealVibratoGain.gain.value = 20; // Moderate vibrato
            
            sealVibratoOsc.connect(sealVibratoGain);
            sealVibratoGain.connect(sealOsc.frequency);
            
            const sealGain = context.createGain();
            sealGain.gain.setValueAtTime(0.0, context.currentTime);
            sealGain.gain.setValueAtTime(0.0, context.currentTime + 0.3); // Delay until after other effects
            sealGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.35); // Quick impact
            sealGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55); // Moderate fade out
            
            // 5. Magical dust settling - gentle white noise fadeout
            const dustBuffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate);
            const dustData = dustBuffer.getChannelData(0);
            
            // Create a gentle dust settling noise
            for (let i = 0; i < dustData.length; i++) {
                const progress = i / dustData.length;
                // Higher intensity at start, then gradually decreases
                const intensity = Math.max(0, 1.0 - progress * 2.5);
                dustData[i] = (Math.random() * 2 - 1) * 0.07 * intensity;
            }
            
            const dustNoise = context.createBufferSource();
            dustNoise.buffer = dustBuffer;
            
            const dustFilter = context.createBiquadFilter();
            dustFilter.type = 'highpass';
            dustFilter.frequency.value = 5000;
            
            const dustGain = context.createGain();
            dustGain.gain.setValueAtTime(0.1, context.currentTime);
            dustGain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5);
            
            // Create a magical reverb effect
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, context.sampleRate * 1.5, context.sampleRate);
            const reverbL = reverbBuffer.getChannelData(0);
            const reverbR = reverbBuffer.getChannelData(1);
            
            // Create a magical hall-like reverb
            for (let i = 0; i < reverbBuffer.length; i++) {
                const decay = Math.pow(0.85, i / (context.sampleRate * 0.1)); // Faster decay for closing
                reverbL[i] = (Math.random() * 2 - 1) * decay;
                reverbR[i] = (Math.random() * 2 - 1) * decay;
            }
            convolver.buffer = reverbBuffer;
            
            // Main output gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.3;
            
            // Connect all components
            energyOsc.connect(energyFilter);
            energyFilter.connect(energyGain);
            energyGain.connect(convolver);
            energyGain.connect(masterGain);
            
            // Connect all crystal oscillators
            for (let i = 0; i < crystalGains.length; i++) {
                crystalGains[i].connect(convolver);
                crystalGains[i].connect(masterGain);
            }
            
            collapseSource.connect(collapseFilter);
            collapseFilter.connect(collapseGain);
            collapseGain.connect(convolver);
            collapseGain.connect(masterGain);
            
            sealOsc.connect(sealGain);
            sealGain.connect(convolver);
            sealGain.connect(masterGain);
            
            dustNoise.connect(dustFilter);
            dustFilter.connect(dustGain);
            dustGain.connect(convolver);
            dustGain.connect(masterGain);
            
            // Connect reverb to master
            convolver.connect(masterGain);
            masterGain.connect(context.destination);
            
            // Start sound components
            energyOsc.start();
            pulseOsc.start();
            crystalOscs.forEach(osc => osc.start());
            collapseSource.start();
            sealOsc.start();
            sealVibratoOsc.start();
            dustNoise.start();
            
            // Stop and clean up
            setTimeout(() => {
                energyOsc.stop();
                pulseOsc.stop();
                crystalOscs.forEach(osc => osc.stop());
                sealOsc.stop();
                sealVibratoOsc.stop();
                context.close();
            }, 600); // Slightly longer for full magical closedown sequence
            
            debug(`ArcadeEntity4: Played magical portal closing/power down sound`);
        } catch (err) {
            debug(`ArcadeEntity4: Error playing menu close sound: ${err}`);
        }
    }

    /**
     * Play a sword and sorcery themed sound effect when player enters interaction range
     * Creates a layered fantasy sound with sword unsheathing, magical shimmer, and mystical ambience
     */
    playProximitySound() {
        try {
            // Create audio context for sword and magic sound effects
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 1. Sword unsheathing sound (metallic sliding + ring)
            const swordOsc = context.createOscillator();
            swordOsc.type = 'sawtooth'; // Metallic sound base
            swordOsc.frequency.setValueAtTime(120, context.currentTime); // Start at medium pitch
            swordOsc.frequency.linearRampToValueAtTime(800, context.currentTime + 0.15); // Fast rising pitch
            swordOsc.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.3); // Settling to ring
            
            // Envelope for sword sound
            const swordGain = context.createGain();
            swordGain.gain.setValueAtTime(0.01, context.currentTime);
            swordGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.1); // Quick attack
            swordGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.2); // Long decay
            
            // Sword sound filtering for metallic character
            const swordFilter = context.createBiquadFilter();
            swordFilter.type = 'highpass';
            swordFilter.frequency.value = 2000;
            swordFilter.Q.value = 3;
            
            // 2. Magical shimmer effect (bell-like, ethereal)
            const magicOsc = context.createOscillator();
            magicOsc.type = 'sine'; // Pure tone for magic
            magicOsc.frequency.setValueAtTime(1200, context.currentTime);
            magicOsc.frequency.setValueAtTime(1500, context.currentTime + 0.05);
            magicOsc.frequency.setValueAtTime(1800, context.currentTime + 0.1);
            magicOsc.frequency.setValueAtTime(2100, context.currentTime + 0.15);
            
            // Magic sound envelope (starts after sword, ethereal decay)
            const magicGain = context.createGain();
            magicGain.gain.setValueAtTime(0, context.currentTime);
            magicGain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.2); // Delayed start
            magicGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5); // Slow fade
            
            // Magic filter for bell-like quality
            const magicFilter = context.createBiquadFilter();
            magicFilter.type = 'bandpass';
            magicFilter.frequency.value = 2000;
            magicFilter.Q.value = 8; // Resonant filter for magical tone
            
            // 3. Low rumble for power/presence
            const rumbleOsc = context.createOscillator();
            rumbleOsc.type = 'triangle';
            rumbleOsc.frequency.setValueAtTime(60, context.currentTime); // Deep bass
            rumbleOsc.frequency.linearRampToValueAtTime(40, context.currentTime + 0.8); // Dropping pitch
            
            // Rumble envelope (longer sustain)
            const rumbleGain = context.createGain();
            rumbleGain.gain.setValueAtTime(0.01, context.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.3); // Slow build
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.0); // Medium decay
            
            // 4. Create white noise for magical dust/particles effect
            const bufferSize = 2 * context.sampleRate;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Fill buffer with noise
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = context.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            
            // Filter noise for a shimmering effect
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 8000; // Very high - just shimmer
            
            const noiseGain = context.createGain();
            noiseGain.gain.setValueAtTime(0, context.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.1);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
            
            // Final reverb (to simulate space/environment)
            const convolver = context.createConvolver();
            const reverbBuffer = context.createBuffer(2, 48000, context.sampleRate);
            const leftChannel = reverbBuffer.getChannelData(0);
            const rightChannel = reverbBuffer.getChannelData(1);
            
            // Create impulse response for reverb
            for (let i = 0; i < 48000; i++) {
                // Exponential decay
                const decay = Math.pow(0.9, i / 5000);
                leftChannel[i] = (Math.random() * 2 - 1) * decay;
                rightChannel[i] = (Math.random() * 2 - 1) * decay;
            }
            
            convolver.buffer = reverbBuffer;
            
            // Master gain
            const masterGain = context.createGain();
            masterGain.gain.value = 0.3; // Overall volume control
            
            // Connect sword components
            swordOsc.connect(swordFilter);
            swordFilter.connect(swordGain);
            swordGain.connect(convolver);
            swordGain.connect(masterGain); // Direct signal
            
            // Connect magic components
            magicOsc.connect(magicFilter);
            magicFilter.connect(magicGain);
            magicGain.connect(convolver);
            magicGain.connect(masterGain); // Direct signal
            
            // Connect rumble
            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(masterGain);
            
            // Connect noise
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(convolver);
            
            // Connect reverb to master
            convolver.connect(masterGain);
            
            // Connect master to output
            masterGain.connect(context.destination);
            
            // Start all sound sources
            swordOsc.start();
            magicOsc.start();
            rumbleOsc.start();
            noise.start();
            
            // Stop and clean up
            setTimeout(() => {
                swordOsc.stop();
                magicOsc.stop();
                rumbleOsc.stop();
                noise.stop();
                context.close();
            }, 1800); // Sound duration
            
            debug(`ArcadeEntity4: Played sword and sorcery proximity sound effect`);
        } catch (err) {
            debug(`ArcadeEntity4: Error playing proximity sound: ${err}`);
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
        debug(`ArcadeEntity4: Drawing at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), hasLoaded=${this.hasLoaded}, isNearPlayer=${this.isNearPlayer}`);
        
        if (!this.hasLoaded || !this.asset) {
            debug(`ArcadeEntity4: Using fallback rendering`);
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
            debug(`ArcadeEntity4: Drawing interaction prompt, alpha=${this.interactionPromptAlpha}`);
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
        debug(`ArcadeEntity4: Drawing fallback arcade at (${screenX}, ${screenY})`);
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
        debug(`ArcadeEntity4: Fallback arcade drawn, base at (${screenX}, ${screenY})`);
        
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
        debug(`ArcadeEntity4: Drawing game selection interface`);
        
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
            
            // Store a reference to the current ArcadeEntity4 instance
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
                url: 'https://x.com/archedark_'
            });
            
            console.log('Added ArcadeEntity4 Twitter clickable area:', 
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
        overlayCtx.fillText('@archedark_', width/2 + 100, creatorFooterY + footerHeight/2);
        
        // Measure text width to make the underline fit perfectly
        const twitterHandleWidth = overlayCtx.measureText('@archedark_').width;
        
        // Get the exact position where the text ends since it's right-aligned
        const textStartX = width/2 + 100 - twitterHandleWidth;
        
        // Underline to show it's clickable - using measured width and exact position
        overlayCtx.fillRect(textStartX, creatorFooterY + footerHeight/2 + 3, twitterHandleWidth, 2);
        
        // We no longer need to update DOM elements since we're using the entity's clickable areas
        
        overlayCtx.restore();
        
        console.log("🎮 Finished drawing arcade game menu");
        
        // Cleanup: Remove the Twitter link when the menu is closed
        if (!this.gameSelectVisible) {
            const oldLink = document.getElementById(twitterLinkId);
            if (oldLink) {
                console.log('Removing ArcadeEntity4 Twitter link:', twitterLinkId);
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
        debug(`ArcadeEntity4: Checking menu click at ${clientX}, ${clientY}`);
        
        // Skip if menu not visible
        if (!this.gameSelectVisible) return;
        
        // Debounce mechanism to prevent multiple rapid clicks
        const now = Date.now();
        if (!this._lastClickTime) {
            this._lastClickTime = 0;
        }
        
        // If less than 500ms since last click, ignore this click
        if (now - this._lastClickTime < 500) {
            debug(`ArcadeEntity4: Ignoring click - too soon after previous click`);
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
            
            debug(`ArcadeEntity4: Canvas coordinates: ${canvasX}, ${canvasY}`);
            
            // Check each clickable area
            for (const area of this.clickableAreas) {
                if (
                    canvasX >= area.x && 
                    canvasX <= area.x + area.width &&
                    canvasY >= area.y && 
                    canvasY <= area.y + area.height
                ) {
                    debug(`ArcadeEntity4: Clicked on area: ${area.type}`);
                    
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
                                    debug(`ArcadeEntity4: Opening Twitter URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity4: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                        case 'creator':
                            // Open the creator's URL in a new tab, with same protection
                            if (area.url) {
                                const urlLastClickTime = this._lastClickedUrls[area.url] || 0;
                                if (now - urlLastClickTime > 2000) { // 2 second cooldown per URL
                                    debug(`ArcadeEntity4: Opening URL: ${area.url}`);
                                    window.open(area.url, '_blank');
                                    this._lastClickedUrls[area.url] = now;
                                } else {
                                    debug(`ArcadeEntity4: Preventing duplicate URL open: ${area.url}`);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
}

export { ArcadeEntity4 };
