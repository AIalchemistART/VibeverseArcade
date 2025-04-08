/**
 * Main module for AI Alchemist's Lair
 * Entry point that initializes the game and coordinates all subsystems
 */

import { input } from './input.js';
import { TestScene } from './scene.js';
import { shouldRenderFrame, getDeltaTime, updateFps, TARGET_FPS } from './timing.js';
import { drawFpsCounter, DEBUG_CONFIG } from './debug.js';
import { info, warn, error, debug } from './utils.js';
import { checkBrowserCompatibility, createCompatibilityErrorMessage } from './compatibility.js';
import { Camera } from './camera.js';
import { panState, initPanEvents } from './panState.js';
import { MiniMap } from './minimap.js';
import { Game } from './game.js';
import { updateScene, getSceneManager, initSceneSystem } from './sceneIntegration.js';
import { initDebugControls } from './debugControls.js';
import { SceneRenderer } from './sceneRenderer.js';
import doorwayManager from './doorways.js';
import { characterRenderer } from './characterRenderer.js';
import assetLoader from './assetLoader.js';
import { Player } from './player.js'; // Use named import to match named export in player.js
import { SignManager } from './signManager.js'; // Import SignManager
import { SignManager2 } from './signManager2.js'; // Import arcade SignManager2
import { SignManager3 } from './signManager3.js'; // Import ceiling SignManager3
import { SignManager4 } from './signManager4.js'; // Import ceiling SignManager4
import { SignManager5 } from './signManager5.js'; // Import ceiling SignManager5
import { SignManager6 } from './signManager6.js'; // Import ceiling SignManager6
import { JukeboxManager } from './jukeboxManager.js'; // Import JukeboxManager
import { TVManager } from './tvManager.js'; // Import TVManager
import { CouchManager } from './couchManager.js'; // Import CouchManager
import { Couch2Manager } from './couch2Manager.js'; // Import Couch2Manager
import { RugManager } from './rugManager.js'; // Import RugManager
import { RugManager2 } from './rugManager2.js'; // Import RugManager2
import { RugManager3 } from './rugManager3.js'; // Import RugManager3
import { RugManager4 } from './rugManager4.js'; // Import RugManager4
import { VibePortalManager } from './vibePortalManager.js'; // Import VibePortalManager
import { TrophyManager } from './trophyManager.js'; // Import TrophyManager
import { XPortalManager } from './xPortalManager.js'; // Import XPortalManager
import { SpellbookManager } from './spellbookManager.js'; // Import SpellbookManager
import { ArcadeManager } from './arcadeManager.js'; // Import ArcadeManager
import { ArcadeManager2 } from './arcadeManager2.js'; // Import ArcadeManager2
import { ArcadeManager3 } from './arcadeManager3.js'; // Import ArcadeManager3
import { ArcadeManager4 } from './arcadeManager4.js'; // Import ArcadeManager4

// Check browser compatibility before initializing the game
const compatibilityResults = checkBrowserCompatibility();

// Only proceed with game initialization if critical features are supported
if (compatibilityResults.allCriticalSupported) {
    try {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found. Please check the HTML structure.');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context. Please check browser support.');
        }

        // Initialize pan events for the canvas (for middle-mouse panning)
        initPanEvents(canvas);

        // Initialize the scene system
        initSceneSystem(ctx, canvas);
        
        // Get scene manager for accessing scene data
        const sceneManager = getSceneManager();
        
        // Initialize the scene renderer
        const sceneRenderer = new SceneRenderer(ctx);

        // Initialize scene and player position
        const scene = new TestScene();
        let playerX = 95;
        let playerY = 5;
        
        // Initialize camera with canvas dimensions
        const camera = new Camera(canvas.width, canvas.height);
        
        // Use scene's grid and cell dimensions for consistency
        camera.setMapBoundaries(scene.gridWidth, scene.gridHeight, scene.cellWidth, scene.cellHeight);
        
        // Set the camera smoothness - lower value for smoother movement
        camera.setSmoothingFactor(0.08);
        
        // Initialize mini-map with grid dimensions, cell size, and canvas dimensions
        const miniMap = new MiniMap(
            scene.gridWidth, 
            scene.gridHeight, 
            scene.cellWidth, 
            scene.cellHeight,
            canvas.width, 
            canvas.height
        );
        
        // Initialize game system
        const game = new Game();
        
        // Make game instance globally accessible for entities
        window.game = game;
        
        // Create and initialize player entity at starting position
        const playerEntity = game.initPlayer(playerX, playerY);
        
        // Calculate player's isometric position
        const playerIsoX = (playerX - playerY) * (scene.cellWidth / 2);
        const playerIsoY = (playerX + playerY) * (scene.cellHeight / 2);
        
        // Center camera on player's isometric coordinates
        camera.centerOn(playerIsoX, playerIsoY);
        
        // Wait briefly for asset loading before creating signs
        setTimeout(() => {
            // Initialize SignManager with game instance
            const signManager = new SignManager(game);
            
            // Preload sign assets
            signManager.preloadSigns();
            
            // Add signs to scene
            console.log('Adding signs to scene...');
            signManager.addSigns(); // Create one sign in the center
            console.log('Signs added successfully');
            
            // Initialize arcade SignManager2 with game instance
            const signManager2 = new SignManager2(game);
            
            // Preload arcade sign assets
            signManager2.preloadSigns();
            
            // Add arcade signs to scene
            console.log('Adding arcade signs to scene...');
            signManager2.addSigns();
            console.log('Arcade signs added successfully');
            
            // Initialize ceiling SignManager3 with game instance
            const signManager3 = new SignManager3(game);
            
            // Preload ceiling sign assets
            signManager3.preloadSigns();
            
            // Add ceiling signs to scene
            console.log('Adding ceiling signs to scene...');
            signManager3.addSigns();
            console.log('Ceiling signs added successfully');

            // Initialize ceiling SignManager4 with game instance
            const signManager4 = new SignManager4(game);
            
            // Preload ceiling sign assets
            signManager4.preloadSigns();
            
            // Add ceiling signs to scene
            console.log('Adding ceiling signs to scene...');
            signManager4.addSigns();
            console.log('Ceiling signs added successfully');

            // Initialize ceiling SignManager5 with game instance
            const signManager5 = new SignManager5(game);
            
            // Preload ceiling sign assets
            signManager5.preloadSigns();
            
            // Add ceiling signs to scene
            console.log('Adding ceiling signs to scene...');
            signManager5.addSigns();
            console.log('Ceiling signs added successfully');

            // Initialize ceiling SignManager6 with game instance
            const signManager6 = new SignManager6(game);
            
            // Preload ceiling sign assets
            signManager6.preloadSigns();
            
            // Add ceiling signs to scene
            console.log('Adding ceiling signs to scene...');
            signManager6.addSigns();
            console.log('Ceiling signs added successfully');
            
            // Initialize JukeboxManager with game instance
            const jukeboxManager = new JukeboxManager(game);
            
            // Preload jukebox assets
            jukeboxManager.preloadJukeboxes();
            
            // Add jukeboxes to scene
            console.log('Adding jukeboxes to scene...');
            jukeboxManager.addJukeboxes();
            console.log('Jukeboxes added successfully');
            
            // Initialize TVManager with game instance
            const tvManager = new TVManager(game);
            
            // Preload TV assets
            tvManager.preloadTVs();
            
            // Add TVs to scene
            console.log('Adding TVs to scene...');
            tvManager.addTVs();
            console.log('TVs added successfully');
            
            // Initialize CouchManager with game instance
            const couchManager = new CouchManager(game);
            
            // Preload couch assets
            couchManager.preloadAssets();
            
            // Add couches to scene
            console.log('Adding couches to scene...');
            couchManager.addCouches();
            console.log('Couches added successfully');
            
            // Initialize Couch2Manager with game instance
            const couch2Manager = new Couch2Manager(game);
            
            // Preload couch2 assets
            couch2Manager.preloadAssets();
            
            // Add couch2 to scene
            console.log('Adding couch2 to scene...');
            couch2Manager.addCouches();
            console.log('Couch2 added successfully');
            
            // Initialize VibePortalManager with game instance
            const vibePortalManager = new VibePortalManager(game);
            
            // Add portals to scene
            console.log('Adding VIBEVERSE portals to scene...');
            vibePortalManager.addPortals(
                // Start portal options (red) - positioned in lower right corner
                { 
                    position: { x: 87, y: 2, z: -3 },
                    label: 'RETURN PORTAL',
                    interactionDistance: 3.5,  // Slightly larger interaction range
                    entryDetectionRange: 2.0   // Easier to enter
                },
                // Exit portal options (green) - positioned in upper left corner
                { 
                    position: { x: 90, y: 2, z: -3 },
                    label: 'ENTER VIBEVERSE',
                    targetUrl: 'https://portal.pieter.com',
                    interactionDistance: 3.5,  // Slightly larger interaction range
                    entryDetectionRange: 2.0   // Easier to enter
                }
            );
            console.log('VIBEVERSE portals added successfully');
            
            // Initialize RugManager with game instance
            const rugManager = new RugManager(game);
            
            // Preload rug assets
            rugManager.preloadAssets();
            
            // Add rugs to scene
            console.log('Adding rugs to scene...');
            rugManager.addRugs();
            console.log('Rugs added successfully');
            
            // Initialize RugManager2 with game instance
            const rugManager2 = new RugManager2(game);
            
            // Preload rug assets
            rugManager2.preloadAssets();
            
            // Add rugs to scene
            console.log('Adding rugs to scene...');
            rugManager2.addRugs();
            console.log('Rugs added successfully');
            
            // Initialize RugManager3 with game instance
            const rugManager3 = new RugManager3(game);
            
            // Preload rug assets
            rugManager3.preloadAssets();
            
            // Add rugs to scene
            console.log('Adding rugs to scene...');
            rugManager3.addRugs();
            console.log('Rugs added successfully');
            
            // Initialize RugManager4 with game instance
            const rugManager4 = new RugManager4(game);
            
            // Preload rug assets
            rugManager4.preloadAssets();
            
            // Add rugs to scene
            console.log('Adding rugs to scene...');
            rugManager4.addRugs();
            console.log('Rugs added successfully');

            // Initialize TrophyManager with game instance
            const trophyManager = new TrophyManager(game);
            
            // Preload trophy assets
            trophyManager.preloadAssets();
            
            // Add trophies to scene
            console.log('Adding trophies to scene...');
            trophyManager.addTrophies();
            console.log('Trophies added successfully');
            
            // Initialize XPortalManager with game instance
            const xPortalManager = new XPortalManager(game);
            
            // Preload X portal assets
            xPortalManager.preloadAssets();
            
            // Add X portals to scene
            console.log('Adding X portals to scene...');
            xPortalManager.addPortals();
            console.log('X portals added successfully');
            
            // Initialize SpellbookManager with game instance
            const spellbookManager = new SpellbookManager(game);
            
            // Preload spellbook assets
            spellbookManager.preloadAssets();
            
            // Add spellbooks to scene
            console.log('Adding spellbooks to scene...');
            spellbookManager.addSpellbooks();
            console.log('Spellbooks added successfully');
            
            // Initialize ArcadeManager with game instance
            const arcadeManager = new ArcadeManager(game);
            
            // Preload arcade assets
            arcadeManager.preloadAssets(assetLoader);
            
            // Force window.assetLoader to be set for direct access by entity classes
            window.assetLoader = assetLoader;
            
            // Change this - explicitly pass a scene name that will match our condition
            arcadeManager.addEntities('startRoom');
            console.log('Arcade cabinets added successfully');

            // Initialize ArcadeManager2 with game instance
            const arcadeManager2 = new ArcadeManager2(game);
            
            // Preload arcade assets
            arcadeManager2.preloadAssets(assetLoader);
            
            // Force window.assetLoader to be set for direct access by entity classes
            window.assetLoader = assetLoader;
            
            // Change this - explicitly pass a scene name that will match our condition
            arcadeManager2.addEntities('startRoom');
            console.log('Arcade cabinets added successfully');
            
            // Initialize ArcadeManager3 with game instance
            const arcadeManager3 = new ArcadeManager3(game);
            
            // Preload arcade assets
            arcadeManager3.preloadAssets(assetLoader);
            
            // Force window.assetLoader to be set for direct access by entity classes
            window.assetLoader = assetLoader;
            
            // Change this - explicitly pass a scene name that will match our condition
            arcadeManager3.addEntities('startRoom');
            console.log('Arcade cabinets added successfully');

            // Initialize ArcadeManager4 with game instance
            const arcadeManager4 = new ArcadeManager4(game);
            
            // Preload arcade assets
            arcadeManager4.preloadAssets(assetLoader);
            
            // Force window.assetLoader to be set for direct access by entity classes
            window.assetLoader = assetLoader;
            
            // Change this - explicitly pass a scene name that will match our condition
            arcadeManager4.addEntities('startRoom');
            console.log('Arcade cabinets added successfully');
            
            // Send initialization complete event
        }, 500);
        
        // Explicitly check if character renderer is loaded
        console.log('🧙 Initializing character renderer and checking sprites...');
        // Force asset loading check
        setTimeout((timestamp) => {
            console.log('Character renderer initialized:', characterRenderer);
            // Check all assets
            const spriteNames = [
                'wizardN', 'wizardNE', 'wizardE', 'wizardSE', 
                'wizardS', 'wizardSW', 'wizardW', 'wizardNW'
            ];
            console.log('Checking for wizard sprites:');
            spriteNames.forEach(name => {
                const asset = assetLoader.getAsset(name);
                console.log(`Sprite ${name}: ${asset ? '✅ LOADED' : '❌ NOT LOADED'}`);
                if (!asset) {
                    console.warn(`Cannot find sprite: ${name} at path: ${assetLoader.commonAssets[name]}`);
                }
            });
        }, 1000);
            
        info('Game initialized with camera and mini-map', { 
            mapSize: `${scene.gridWidth}x${scene.gridHeight} grid (${camera.mapWidth}x${camera.mapHeight} pixels)`,
            playerPosition: `Grid: (${playerX}, ${playerY}), Iso: (${playerIsoX}, ${playerIsoY})`,
            cameraPosition: `${camera.x}, ${camera.y}`,
            smoothingFactor: camera.getSmoothingFactor(),
            zoom: camera.zoom
        });

        // Track previous keyboard state to detect key press events
        const keyStates = {
            B: false,  // Toggle collision boxes
            G: false,  // Toggle spatial grid
            I: false,  // Toggle entity info
            P: false,  // Toggle panning
            R: false,  // Reset camera
            T: false,  // Generate test entities
            F: false,  // Toggle FPS counter
            C: false,  // Center camera on player
            O: false,  // Force door open/close
        };

        // Debug options
        let testEntitiesCreated = false;
        let frameCount = 0;

        // Initialize debug controls
        initDebugControls();

        // Add keyboard controls for camera and player
        document.addEventListener('keydown', (e) => {
            // KEYPRESS DEBUGGER - Check all key presses to verify input handling
            console.log(`KEY PRESSED: ${e.key}`);
            
            // Force-update the input module's key state to fix keyboard movement issues
            if (input && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                input.keys[e.key] = true;
                console.log(`Direct input update: ${e.key} = true`);
                
                // Force player to be movable - fixing potential static entity issues
                if (playerEntity) {
                    playerEntity.isStatic = false;
                }
            }
            
            // Debug Enter key specifically for jukebox interaction
            if (e.key === 'Enter') {
                console.log(`JUKEBOX DEBUG: Enter key pressed directly in main.js keydown event`);
            }
            
            // Center camera on player with 'C' key
            if (e.key === 'c' || e.key === 'C') {
                // Calculate player's isometric position using scene's cell dimensions
                const playerIsoX = (playerX - playerY) * (scene.cellWidth / 2);
                const playerIsoY = (playerX + playerY) * (scene.cellHeight / 2);
                
                // Instantly center camera on player
                camera.centerOn(playerIsoX, playerIsoY);
                info('Camera centered on player with C key');
            }
            
            // Reset camera with 'R' key
            if (e.key === 'r' || e.key === 'R') {
                camera.reset();
                info('Camera reset with R key');
            }
            
            // Camera zoom in with 'Z' key or '=' key
            if (e.key === 'z' || e.key === 'Z' || e.key === '+' || e.key === '=') {
                camera.zoomIn();
                info('Camera zoomed in');
            }
            
            // Camera zoom out with 'X' key or '-' key
            if (e.key === 'x' || e.key === 'X' || e.key === '-' || e.key === '_') {
                camera.zoomOut();
                info('Camera zoomed out');
            }
            
            // Reset current pan with 'P' key
            if (e.key === 'p' || e.key === 'P') {
                panState.resetDeltas();
                info('Pan state reset with P key');
            }
            
            // Toggle mini-map with 'M' key
            if (e.key === 'm' || e.key === 'M') {
                miniMap.visible = !miniMap.visible;
                info(`Mini-map ${miniMap.visible ? 'shown' : 'hidden'}`);
            }
            
            // Jump with spacebar
            if (e.key === ' ' || e.key === 'Spacebar') {
                playerEntity.jump();
                debug('Jump triggered with spacebar');
            }
            
            // Debug toggle keys disabled for deployment
            
            // Toggle collision boxes with 'B' key - DISABLED FOR DEPLOYMENT
            // if (e.key === 'b' || e.key === 'B') {
            //     game.toggleDebugFeature('collision');
            // }
            
            // Toggle spatial grid with 'G' key - DISABLED FOR DEPLOYMENT
            // if (e.key === 'g' || e.key === 'G') {
            //     game.toggleDebugFeature('grid');
            // }
            
            // Toggle entity info with 'I' key - DISABLED FOR DEPLOYMENT
            // if (e.key === 'i' || e.key === 'I') {
            //     game.toggleDebugFeature('info');
            // }
            
            // Camera smoothness adjustment with number keys 0-9
            if (!isNaN(parseInt(e.key)) && parseInt(e.key) >= 0 && parseInt(e.key) <= 9) {
                const num = parseInt(e.key);
                let smoothing = num / 10;
                
                // Special case for key '0' - ultra smooth
                if (num === 0) smoothing = 0.01;
                
                camera.setSmoothingFactor(smoothing);
                info(`Camera smoothing set to ${smoothing}`);
            }
            
            // Force door open/close with 'O' key
            if (e.key === 'o' || e.key === 'O') {
                // Toggle north door state in current scene
                if (currentScene) {
                    const isOpen = !doorwayManager.doorwaysByScene[currentScene.id]?.[0]?.isOpen;
                    doorwayManager.forceDoorState(currentScene.id, 'north', 8, isOpen);
                    info(`DEBUG: Forced north door ${isOpen ? 'OPEN' : 'CLOSED'}`);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            // Force-update the input module's key state
            if (input && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                input.keys[e.key] = false;
                console.log(`Direct input update: ${e.key} = false`);
            }
        });

        // T key test handler disabled for deployment
        // window.addEventListener('keydown', (e) => {
        //     if (e.key === 't' || e.key === 'T') {
        //         // Test entity creation disabled for deployment
        //     }
        // });

        function gameLoop(timestamp) {
            try {
                // Check if we should render this frame (60 FPS cap)
                if (!shouldRenderFrame(timestamp)) {
                    requestAnimationFrame(gameLoop);
                    return;
                }
                
                // Update FPS counter
                const currentFps = updateFps(timestamp);
                
                // Get delta time for frame-rate independent movement
                const deltaTime = getDeltaTime();
                
                // Update scene from scene manager, passing the player entity for portal detection
                const currentScene = updateScene(deltaTime, playerEntity);
                if (currentScene) {
                    // Log scene rendering for debugging during development
                    if (DEBUG_CONFIG.logSceneRendering) {
                        console.log(`Rendering scene: ${currentScene.name}`);
                    }
                }
                
                // Update player position based on input
                // Calculate movement direction from input
                let dx = 0;
                let dy = 0;
                
                // Left movement (decreases X in isometric)
                if (input.keys['ArrowLeft'] || input.keys['a'] || input.keys['A']) dx -= 1;
                // Right movement (increases X in isometric)
                if (input.keys['ArrowRight'] || input.keys['d'] || input.keys['D']) dx += 1;
                // Up movement (decreases Y in isometric)
                if (input.keys['ArrowUp'] || input.keys['w'] || input.keys['W']) dy -= 1;
                // Down movement (increases Y in isometric)
                if (input.keys['ArrowDown'] || input.keys['s'] || input.keys['S']) dy += 1;
                
                // Use the player's move method to update position and direction
                if (dx !== 0 || dy !== 0) {
                    // Convert direction to proper format
                    let direction = '';
                    if (dx < 0) direction = 'left';
                    else if (dx > 0) direction = 'right';
                    
                    if (dy < 0) {
                        direction = direction ? 'north' + direction : 'up';
                    } else if (dy > 0) {
                        direction = direction ? 'south' + direction : 'down';
                    }
                    
                    // Call the player's move method
                    playerEntity.move(direction, deltaTime);
                    
                    // Update local tracking variables
                    playerX = playerEntity.x;
                    playerY = playerEntity.y;
                } else {
                    // If no keys pressed, ensure player stops
                    playerEntity.move('none', deltaTime);
                }
                
                // Constrain player within grid boundaries
                playerX = Math.max(0, Math.min(scene.gridWidth - 1, playerX));
                playerY = Math.max(0, Math.min(scene.gridHeight - 1, playerY));
                playerEntity.x = playerX;
                playerEntity.y = playerY;
                
                // Update game physics and collisions
                game.update(deltaTime);
                
                // Calculate player's isometric position using scene's cell dimensions
                const playerIsoX = (playerX - playerY) * (scene.cellWidth / 2);
                const playerIsoY = (playerX + playerY) * (scene.cellHeight / 2);
                
                // Update doorway animations and check for player-doorway collisions
                doorwayManager.update(deltaTime, playerX, playerY, scene);
                
                // Update camera to follow player's isometric position
                camera.follow(playerIsoX, playerIsoY);
                
                // Handle camera panning with middle-mouse drag
                if (panState.active && (panState.deltaX !== 0 || panState.deltaY !== 0)) {
                    camera.pan(panState.deltaX, panState.deltaY);
                    panState.resetDeltas(); // Reset deltas after applying them
                }
                
                camera.update(); // Apply smooth movement interpolation
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // First render the scene visuals using SceneRenderer if a current scene exists
                if (currentScene) {
                    sceneRenderer.render(currentScene);
                }
                
                // Then render game entities and player on top of the scene visuals
                scene.render(ctx, playerX, playerY, camera, playerEntity, game);
                
                // Render doorways on top of the base scene but below UI elements
                doorwayManager.render(ctx, camera);
                
                // DIAGNOSTICS: Check if the game object is properly connected to the rendering pipeline
                if (testEntitiesCreated && frameCount % 60 === 0) { // Only log once per second
                    console.log('[DIAGNOSTICS] Game & Scene connection:');
                    console.log('- Game entities:', game.entities.length);
                    console.log('- Player position:', {x: playerX, y: playerY});
                    console.log('- Is game passed to scene?', !!game);
                    console.log('- Is playerEntity passed to scene?', !!playerEntity);
                    
                    // Check if render pipeline sees the entities
                    if (game.entities.length > 0) {
                        console.log('- Sample entity:', game.entities[0]);
                    }
                }
                
                // Get current player info for debugging
                const player = sceneManager.getCurrentPlayer();
                if (player) {
                    console.log(`Player at (${player.x.toFixed(2)}, ${player.y.toFixed(2)}), isPlayer: ${player.isPlayer}, direction: ${player.getDirection()}`);
                }
                
                // Render mini-map after scene to overlay it
                miniMap.render(ctx, playerX, playerY, camera);
                
                // Direct drawing of decorative elements based on current scene
                const currentSceneId = window.location.hash.substring(1) || 'startRoom';
                console.log('Current scene for decorations:', currentSceneId);
                
                // Update the HTML overlay for decorative elements
                const overlay = document.getElementById('decorativeOverlay');
                if (overlay) {
                    if (currentSceneId === 'neonPhylactery') {
                        overlay.style.display = 'block';
                    } else {
                        overlay.style.display = 'none';
                    }
                } else {
                    console.error('Decorative overlay element not found');
                }
                
                // Draw decorative doors directly in the neonPhylactery scene
                if (currentSceneId === 'neonPhylactery') {
                    console.log('Drawing decorative doors for neonPhylactery scene');
                    
                    // Save context for decorative elements
                    ctx.save();
                    
                    // SE Door - magenta
                    const seDoorX = 550;
                    const seDoorY = 350;
                    
                    // Draw SE door
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#ff00ff';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    
                    // Draw door shape (arch)
                    ctx.beginPath();
                    ctx.moveTo(seDoorX - 30, seDoorY + 40);
                    ctx.lineTo(seDoorX - 30, seDoorY - 20);
                    ctx.quadraticCurveTo(seDoorX, seDoorY - 50, seDoorX + 30, seDoorY - 20);
                    ctx.lineTo(seDoorX + 30, seDoorY + 40);
                    ctx.closePath();
                    
                    // Fill and stroke
                    ctx.fill();
                    ctx.stroke();
                    
                    // Add decorative elements
                    ctx.beginPath();
                    ctx.arc(seDoorX, seDoorY - 10, 10, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff00ff';
                    ctx.fill();
                    
                    // Add label
                    ctx.font = '12px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.fillText('SE Door', seDoorX, seDoorY + 20);
                    
                    // SW Door - cyan
                    const swDoorX = 250;
                    const swDoorY = 450;
                    
                    // Draw SW door
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#00ffff';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    
                    // Draw door shape (arch)
                    ctx.beginPath();
                    ctx.moveTo(swDoorX - 30, swDoorY + 40);
                    ctx.lineTo(swDoorX - 30, swDoorY - 20);
                    ctx.quadraticCurveTo(swDoorX, swDoorY - 50, swDoorX + 30, swDoorY - 20);
                    ctx.lineTo(swDoorX + 30, swDoorY + 40);
                    ctx.closePath();
                    
                    // Fill and stroke
                    ctx.fill();
                    ctx.stroke();
                    
                    // Add decorative elements
                    ctx.beginPath();
                    ctx.arc(swDoorX, swDoorY - 10, 10, 0, Math.PI * 2);
                    ctx.fillStyle = '#00ffff';
                    ctx.fill();
                    
                    // Add label
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('SW Door', swDoorX, swDoorY + 20);
                    
                    // Restore context
                    ctx.restore();
                    
                    console.log('Doors drawn directly in main game loop');
                }
                
                // Draw FPS counter if enabled
                drawFpsCounter(ctx, currentFps);
                
                // Debug key handling
                if (input.keys['B'] && !keyStates.B) {
                    keyStates.B = true;
                    showBoundaries = !showBoundaries;
                    debug(`Show boundaries: ${showBoundaries}`);
                } else if (!input.keys['B']) {
                    keyStates.B = false;
                }
                
                // Spatial grid toggle
                if (input.keys['G'] && !keyStates.G) {
                    keyStates.G = true;
                    game.debugRenderer.toggleSpatialGrid();
                    info("Spatial grid " + (game.debugRenderer.showSpatialGrid ? "enabled" : "disabled"));
                } else if (!input.keys['G']) {
                    keyStates.G = false;
                }
                
                // Entity info toggle
                if (input.keys['I'] && !keyStates.I) {
                    keyStates.I = true;
                    game.debugRenderer.toggleEntityInfo();
                    info("Entity info " + (game.debugRenderer.showEntityInfo ? "enabled" : "disabled"));
                } else if (!input.keys['I']) {
                    keyStates.I = false;
                }
                
                // Generate test entities to verify spatial grid and depth sorting
                if (input.keys['T'] && !keyStates.T) {
                    keyStates.T = true;
                    console.log('T KEY PRESSED - Creating test entities');
                    // Use a DOM notification instead of alert which blocks execution
                    const notification = document.createElement('div');
                    notification.style.position = 'absolute';
                    notification.style.top = '50px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.padding = '10px 20px';
                    notification.style.background = 'rgba(0, 200, 100, 0.9)';
                    notification.style.color = 'white';
                    notification.style.fontWeight = 'bold';
                    notification.style.borderRadius = '5px';
                    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    notification.style.zIndex = '1000';
                    
                    try {
                        // Toggle test entities (create if not present, remove if already present)
                        if (!testEntitiesCreated) {
                            notification.textContent = 'Creating test entities...';
                            document.body.appendChild(notification);
                            
                            info("Creating test entities...");
                            game.createTestEntities();
                            
                            // Output detailed debug about created entities
                            console.log("Game entities:", game.entities);
                            info(`Game now has ${game.entities.length} entities total`);
                            
                            testEntitiesCreated = true;
                            notification.textContent = `Created ${game.entities.length} test entities`;
                            info("Test entities created - showing spatial grid and height-based entities");
                            
                            // Automatically enable grid and debug visualization
                            if (!game.debugRenderer.showSpatialGrid) {
                                game.debugRenderer.toggleSpatialGrid();
                            }
                            if (!game.debugRenderer.showCollisionBoxes) {
                                game.debugRenderer.toggleCollisionBoxes();
                            }
                            
                            // Make sure entity names are visible
                            scene.showEntityNames = true;
                        } else {
                            // Clear entities on second press
                            notification.textContent = 'Removing test entities...';
                            document.body.appendChild(notification);
                            
                            game.clearEntities();
                            testEntitiesCreated = false;
                            notification.textContent = 'Test entities removed';
                            info("Test entities removed");
                        }
                        
                        // Remove notification after 3 seconds
                        setTimeout(() => {
                            document.body.removeChild(notification);
                        }, 3000);
                    } catch (e) {
                        notification.textContent = `Error: ${e.message}`;
                        notification.style.background = 'rgba(200, 0, 0, 0.9)';
                        document.body.appendChild(notification);
                        
                        setTimeout(() => {
                            document.body.removeChild(notification);
                        }, 5000);
                        
                        error("Error handling test entities:", e);
                        console.error(e); // Log to browser console for stack trace
                    }
                } else if (!input.keys['T']) {
                    keyStates.T = false;
                }
                
                // Toggle FPS counter with 'F' key
                if (input.keys['F'] && !keyStates.F) {
                    keyStates.F = true;
                    DEBUG_CONFIG.showFPS = !DEBUG_CONFIG.showFPS;
                    info(`FPS counter ${DEBUG_CONFIG.showFPS ? 'enabled' : 'disabled'}`);
                } else if (!input.keys['F']) {
                    keyStates.F = false;
                }
                
                // Force door open/close with 'O' key
                if (input.keys['O'] && !keyStates.O) {
                    keyStates.O = true;
                    // Toggle north door state in current scene
                    if (currentScene) {
                        const isOpen = !doorwayManager.doorwaysByScene[currentScene.id]?.[0]?.isOpen;
                        doorwayManager.forceDoorState(currentScene.id, 'north', 8, isOpen);
                        info(`DEBUG: Forced north door ${isOpen ? 'OPEN' : 'CLOSED'}`);
                    }
                } else if (!input.keys['O']) {
                    keyStates.O = false;
                }
            } catch (e) {
                error('Error during game loop execution', e);
                // Continue the game loop despite errors
            }
            
            // Always request next frame to keep the game running
            requestAnimationFrame(gameLoop);
            frameCount++;
        }

        // Add mouse wheel zoom control
        canvas.addEventListener('wheel', (e) => {
            // Prevent default scrolling behavior
            e.preventDefault();
            
            // Determine zoom direction based on wheel delta
            if (e.deltaY < 0) {
                // Scroll up = zoom in
                camera.zoomIn(1.05);
                debug(`Mouse wheel zoom in: ${camera.targetZoom.toFixed(2)}`);
            } else {
                // Scroll down = zoom out
                camera.zoomOut(1.05);
                debug(`Mouse wheel zoom out: ${camera.targetZoom.toFixed(2)}`);
            }
        }, { passive: false }); // This makes preventDefault() work

        // Log initialization status
        info(`Game initialized with ${TARGET_FPS} FPS cap`);
        info(`Press 'F' to toggle FPS display (currently ${DEBUG_CONFIG.SHOW_FPS ? 'visible' : 'hidden'})`);
        info(`Press 'C' to center camera on player`);
        info(`Press '1-9' to adjust camera smoothness (1=smooth, 9=responsive)`);
        info(`Press '0' for extremely smooth camera motion`);
        info(`Press 'Z/X' to zoom in/out, or use mouse wheel`);
        info(`Press '+/-' for fine zoom adjustments`);
        info(`Press 'R' to reset zoom to default`);
        info(`Middle-click and drag to pan the camera manually`);
        info(`Press 'P' to reset panning`);
        info(`Press 'M' to toggle mini-map`);
        // Debug toggle key information disabled for deployment
        // info(`Press 'B' to toggle collision boxes`);
        // info(`Press 'G' to toggle spatial grid`);
        // info(`Press 'I' to toggle entity info`);
        // info(`Press 'T' to toggle test entities creation`);
        info(`Press 'O' to force door open/close`);
        
        // Log any non-critical compatibility warnings
        if (compatibilityResults.unsupportedFeatures.length > 0) {
            warn('Some non-critical features are not supported by your browser', compatibilityResults.unsupportedFeatures);
        }

        // Start the game loop
        requestAnimationFrame(gameLoop);
        
    } catch (e) {
        // Critical initialization error
        error('Critical error during game initialization', e);
        
        // Display error message on the page for user
        const errorMessage = document.createElement('div');
        errorMessage.style.color = '#ff3366';
        errorMessage.style.background = 'rgba(0, 0, 0, 0.8)';
        errorMessage.style.padding = '20px';
        errorMessage.style.margin = '20px auto';
        errorMessage.style.maxWidth = '800px';
        errorMessage.style.borderRadius = '5px';
        errorMessage.style.fontFamily = 'monospace';
        errorMessage.style.border = '2px solid #ff3366';
        errorMessage.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        errorMessage.style.zIndex = '1000';
        errorMessage.innerHTML = `
            <h2>😞 Game initialization failed</h2>
            <p>${e.message}</p>
            <p>Please check the console for more details.</p>
        `;
        document.body.appendChild(errorMessage);
    }
} else {
    // Critical browser compatibility issues - show user-friendly error
    error('Critical browser compatibility issues detected', compatibilityResults.unsupportedFeatures);
    
    // Display compatibility error message
    const compatibilityError = document.createElement('div');
    compatibilityError.innerHTML = createCompatibilityErrorMessage(compatibilityResults.unsupportedFeatures);
    document.body.appendChild(compatibilityError);
}
