/**
 * Arcade Manager for AI Alchemist's Lair
 * Responsible for creating and placing arcade cabinet entities
 */

import { ArcadeEntity2 } from './arcadeEntity2.js';
import { debug } from './utils.js';

class ArcadeManager2 {
    /**
     * Create a new arcade manager
     * @param {object} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.arcades = [];
        this.assetsPreloaded = false;
    }
    
    /**
     * Preload arcade cabinet assets
     * @param {AssetLoader} assetLoader - The asset loader
     */
    preloadAssets(assetLoader) {
        debug('ArcadeManager2: Preloading arcade assets');
        
        if (!assetLoader) {
            debug('ArcadeManager2: No asset loader provided, skipping preload');
            return;
        }
        
        // Flag to track if assets have been preloaded
        if (this.assetsPreloaded) {
            debug('ArcadeManager2: Assets already preloaded, skipping');
            return;
        }
        
        // Register the arcade cabinet image
        // Use the EXACT filename with spaces that exists in the directory
        const imagePath = 'assets/decor/Arcade_2.png';
        assetLoader.loadImage(imagePath, 'Arcade_2');
        
        debug(`ArcadeManager2: Preloaded arcade cabinet image: ${imagePath}`);
        
        // Check if sounds directory exists first
        try {
            // Define fallback sound generation for when files don't exist
            const generateSilentAudio = () => {
                try {
                    // Create a silent audio context as fallback
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    gainNode.gain.value = 0; // Silent
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    return { 
                        play: () => {
                            debug('ArcadeManager2: Playing silent fallback audio');
                            // Do nothing, this is a silent fallback
                        }
                    };
                } catch (err) {
                    debug(`ArcadeManager2: Error creating silent audio: ${err}`);
                    return { play: () => {} }; // Empty play function
                }
            };
            
            // Sound effects removed to prevent loading errors
            debug('ArcadeManager2: Arcade sound loading skipped - not needed for Circuit Sanctum Arcade');
            
            // Register silent fallbacks directly instead of trying to load missing files
            const silentAudio = generateSilentAudio();
            if (assetLoader.registerAsset) {
                // Register silent placeholders for any code that might expect these
                assetLoader.registerAsset('arcade-select', silentAudio);
                assetLoader.registerAsset('arcade-launch', silentAudio);
                debug('ArcadeManager2: Registered silent audio fallbacks');
            }
        } catch (err) {
            debug(`ArcadeManager2: Error during sound preload: ${err}, using fallbacks`);
        }
        
        this.assetsPreloaded = true;
        debug('ArcadeManager2: Assets preload process completed');
    }
    
    /**
     * Add an arcade cabinet at specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} assetKey - Key for the asset to use
     * @param {object} options - Additional options
     * @returns {ArcadeEntity2} - The created arcade cabinet
     */
    addArcade(x, y, assetKey, options = {}) {
        // Add game reference to options
        options.game = this.game;
        
        const arcade = new ArcadeEntity2(x, y, assetKey, options);
        
        // If we have an asset loader available, load assets immediately
        if (this.game && this.game.assetLoader) {
            arcade.loadAsset(this.game.assetLoader);
        }
        
        // Add to the game
        if (this.game) {
            this.game.addEntity(arcade);
        }
        
        // Keep track of the arcade cabinet
        this.arcades.push(arcade);
        
        debug(`ArcadeManager2: Added arcade cabinet at (${x}, ${y})`);
        
        return arcade;
    }
    
    /**
     * Place arcade cabinets in the game world for the current scene
     * @param {string} sceneName - Current scene name
     */
    addEntities(sceneName) {
        debug(`ArcadeManager2: Adding arcade cabinets to scene: ${sceneName || 'default'}`);
        
        // Always add the arcade cabinet in the default scene
        // We're not checking for a specific scene name as that seems to be causing issues
        
        // Place arcade cabinet in a visible area but not in the way of other elements
        const arcadeX = 127; // Position in the room
        const arcadeY = 19; // Position in the room
        
        // Define only the Gnome Mercy game for this cabinet
        const arcadeGames = [
            { 
                title: "Gnome Mercy", 
                url: "https://gnome-mercy.vercel.app/",
                description: "A bullet heaven roguelight adventure",
                imagePath: "assets/Games/Game_6.png" // This will be loaded in the entity
            }
        ];
        
        const arcade = this.addArcade(arcadeX, arcadeY, 'Arcade_2', {
            arcadeId: 'main-arcade',
            games: arcadeGames
        });
        
        debug(`ArcadeManager2: Added arcade cabinet to scene at (${arcadeX}, ${arcadeY})`);
        debug(`ArcadeManager2: Final arcade position: (${arcade.x}, ${arcade.y})`);
    }
    
    /**
     * Update all arcade cabinets
     * @param {number} deltaTime - Time since last update in seconds
     * @param {object} input - Input state
     * @param {Entity} player - Player entity
     */
    update(deltaTime, input, player) {
        // We don't need to update arcades here since they'll be updated by the game entity system
        // This method exists for potential future use if we need manager-level updates
    }
}

export { ArcadeManager2 };
