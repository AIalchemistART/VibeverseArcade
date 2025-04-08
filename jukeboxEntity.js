/**
 * Jukebox Entity for AI Alchemist's Lair
 * Handles loading and rendering of jukebox entities in the game world
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { input } from './input.js';
import { getAssetPath } from './pathResolver.js';

class JukeboxEntity extends Entity {
    /**
     * Create a new jukebox entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} jukeboxKey - Key for the jukebox asset in the asset loader
     */
    constructor(x, y, width = 3, height = 3, jukeboxKey = 'jukebox1') {
        super(x, y, width, height);
        
        console.log(`JukeboxEntity: Creating new jukebox at (${x}, ${y}) with key ${jukeboxKey}`);
        
        // Jukebox specific properties
        this.jukeboxKey = jukeboxKey;    // Key for the jukebox asset
        this.zHeight = 1.0;              // Taller height for jukebox
        this.z = 0;                      // Base z position (on the ground)
        this.jukeboxImage = null;        // Will hold the loaded image
        this.loadAttempts = 0;           // Track loading attempts
        this.maxLoadAttempts = 3;        // Maximum loading attempts
        
        // Ensure jukebox has no velocity - it's a static object
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStatic = true;            // Make jukebox static so it doesn't move
        
        // Apply a +1 positional offset to fix grid alignment
        // This corrects the issue where the jukebox appears at grid (-1,-1) instead of (0,0)
        this.x += -2.5;
        this.y += -2.25;
        
        // Decorative glow effect state
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.02;
        
        // Interactive properties
        this.interactionDistance = 6;   // Distance within which player can interact with jukebox
        this.isPlayerNearby = false;      // Tracks if player is close enough to interact
        this.isActive = false;            // Tracks if music player is currently active
        this.wasEnterPressed = false;     // Tracks enter key state to detect press
        this.soundCloudPlayer = null;     // Will hold the soundcloud player element
        this.interactionPromptAlpha = 0;  // Transparency for interaction prompt
        
        // Add a direct Enter key event listener
        this.handleKeyDown = (event) => {
            if (event.key === 'Enter' && this.isPlayerNearby && !this.isActive) {
                console.log('JukeboxEntity: Direct Enter key event detected - toggling jukebox');
                this.toggleJukebox();
            }
        };
        
        // Register the event listener
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Debug console log about jukebox placement
        console.log(`JukeboxEntity: Final adjusted position: (${this.x}, ${this.y})`);
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(jukeboxKey);
        if (existingAsset) {
            console.log(`JukeboxEntity: Found existing asset for ${jukeboxKey} in asset loader`);
            this.jukeboxImage = existingAsset;
        } else {
            console.log(`JukeboxEntity: No existing asset found for ${jukeboxKey}, will load directly`);
        }
        
        // Directly try to load the jukebox image
        this.directLoadJukeboxImage();
        
        // Initialize the SoundCloud iframe HTML
        this.soundCloudIframeHTML = `
            <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" 
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true">
            </iframe>
            <div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;">
                <a href="https://soundcloud.com/vanitas_euphony" title="Vanitas" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas</a> · 
                <a href="https://soundcloud.com/vanitas_euphony/sets/vanitas-essential-tracks" title="Vanitas Essential Tracks" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas Essential Tracks</a>
            </div>
        `;
    }
    
    /**
     * Directly load the jukebox image without relying on asset loader
     */
    directLoadJukeboxImage() {
        if (this.jukeboxImage) {
            console.log(`JukeboxEntity: Jukebox image already loaded, skipping direct load`);
            return;
        }
        
        console.log(`JukeboxEntity: Directly loading jukebox image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            console.log(`JukeboxEntity: Successfully loaded jukebox image directly (${img.width}x${img.height})`);
            this.jukeboxImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.jukeboxKey] = img;
            console.log(`JukeboxEntity: Stored jukebox image in asset loader with key ${this.jukeboxKey}`);
        };
        
        img.onerror = (err) => {
            console.log(`JukeboxEntity: Failed to load jukebox image directly`, err);
            console.log(`JukeboxEntity: Failed path was: assets/decor/Jukebox_1.png`);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`JukeboxEntity: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log(`JukeboxEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution for GitHub Pages compatibility
        const exactPath = 'assets/decor/Jukebox_1.png';
        const resolvedPath = getAssetPath(exactPath);
        console.log(`JukeboxEntity: Setting image src to resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        console.log(`JukeboxEntity: Trying alternative path (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        const paths = [
            'assets/decor/Jukebox1.png',
            './assets/decor/Jukebox_1.png',
            './assets/decor/Jukebox1.png'
        ];
        
        const pathIndex = (this.loadAttempts - 1) % paths.length;
        const path = paths[pathIndex];
        
        console.log(`JukeboxEntity: Selected path ${pathIndex+1}/${paths.length}: ${path}`);
        
        const img = new Image();
        
        img.onload = () => {
            console.log(`JukeboxEntity: Successfully loaded jukebox from alternative path: ${path} (${img.width}x${img.height})`);
            this.jukeboxImage = img;
            assetLoader.assets[this.jukeboxKey] = img;
        };
        
        img.onerror = (err) => {
            console.log(`JukeboxEntity: Failed to load jukebox from alternative path: ${path}`, err);
            
            // Try next attempt if we haven't reached the maximum
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`JukeboxEntity: Will try next alternative path (attempt ${this.loadAttempts + 1})`);
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log('JukeboxEntity: All jukebox loading attempts failed. Using fallback.');
                // Create a fallback canvas-based image
                this.createFallbackImage();
            }
        };
        
        // Resolve path for GitHub Pages compatibility
        const resolvedPath = getAssetPath(path);
        console.log(`JukeboxEntity: Setting alternative image src to resolved path: ${resolvedPath} (original: ${path})`);
        img.src = resolvedPath;
    }
    
    /**
     * Create a fallback canvas-based image for the jukebox
     */
    createFallbackImage() {
        console.log('JukeboxEntity: Creating fallback canvas image');
        
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a medieval-cyberpunk style jukebox
        
        // Base of the jukebox (dark metal)
        ctx.fillStyle = '#232323';
        ctx.fillRect(24, 40, 80, 80);
        
        // Top rounded part
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.ellipse(64, 40, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Screen area
        ctx.fillStyle = '#000';
        ctx.fillRect(34, 50, 60, 30);
        
        // Cyan screen glow
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(34, 50, 60, 30);
        ctx.globalAlpha = 1.0;
        
        // Control panel area
        ctx.fillStyle = '#444';
        ctx.fillRect(34, 90, 60, 20);
        
        // Cyan neon trim
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        
        // Outline the jukebox
        ctx.beginPath();
        ctx.moveTo(24, 40);
        ctx.lineTo(24, 120);
        ctx.lineTo(104, 120);
        ctx.lineTo(104, 40);
        ctx.stroke();
        
        // Top curve outline
        ctx.beginPath();
        ctx.ellipse(64, 40, 40, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Screen outline
        ctx.strokeRect(34, 50, 60, 30);
        
        // Control buttons
        ctx.shadowBlur = 5;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#ffff00';
            ctx.beginPath();
            ctx.arc(44 + i * 15, 100, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Sound wave icon on screen
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 65);
        ctx.quadraticCurveTo(50, 55, 60, 65);
        ctx.quadraticCurveTo(70, 75, 80, 65);
        ctx.stroke();
        
        // Convert the canvas to an image
        const image = new Image();
        image.src = canvas.toDataURL();
        
        console.log('JukeboxEntity: Fallback image created successfully');
        
        // Store the fallback image
        image.onload = () => {
            console.log(`JukeboxEntity: Fallback canvas image loaded with size ${image.width}x${image.height}`);
            this.jukeboxImage = image;
            assetLoader.assets[this.jukeboxKey] = image;
        };
    }
    
    /**
     * Update method for animation effects
     * @param {number} deltaTime - Time since last frame
     * @param {Object} player - Player entity for interaction checks
     */
    update(deltaTime, player) {
        // Skip physics update as jukebox is static
        if (this.isStatic) {
            // Don't update position or apply velocity
        } else {
            // Basic entity physics update (for non-static entities)
            // Implement basic movement for non-static entities
            this.x += this.velocityX * deltaTime;
            this.y += this.velocityY * deltaTime;
        }
        
        // Update glow effect animation
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // Check for player proximity if player is provided
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track previous state for transition
            const wasNearby = this.isPlayerNearby;
            
            // Update proximity state
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Debug output only when state changes
            if (wasNearby !== this.isPlayerNearby) {
                console.log(`JukeboxEntity: Player proximity changed to ${this.isPlayerNearby ? 'NEARBY' : 'FAR'} (distance: ${distance.toFixed(2)})`);
                
                // Play vinyl scratch and music sample when player approaches
                if (this.isPlayerNearby && !wasNearby) {
                    this.playProximitySound();
                }
            }
            
            // Handle interaction prompt fade
            if (this.isPlayerNearby) {
                // Only show prompt if jukebox is inactive
                if (!this.isActive) {
                    // Fade in prompt
                    this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                } else {
                    // Keep prompt hidden while active
                    this.interactionPromptAlpha = 0;
                }
            } else {
                // Fade out prompt when player moves away
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
            }
            
            // Check for Enter key press - only toggle when player is nearby and Enter is newly pressed
            // We check Input.keys.Enter directly from the input system
            const isEnterPressed = window.input && window.input.keys && window.input.keys['Enter'];
            
            // Only detect a new press (not holding)
            if (isEnterPressed && !this.wasEnterPressed && this.isPlayerNearby && !this.isActive) {
                console.log('JukeboxEntity: Enter key newly pressed, toggling jukebox ON');
                this.toggleJukebox();
            } 
            // Handle closing with Enter if already active
            else if (isEnterPressed && !this.wasEnterPressed && this.isActive) {
                console.log('JukeboxEntity: Enter key newly pressed while active, toggling jukebox OFF');
                this.toggleJukebox();
            }
            
            // Update previous key state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Toggle the jukebox player on/off
     */
    toggleJukebox() {
        this.isActive = !this.isActive;
        
        console.log(`JukeboxEntity: Toggling jukebox state to ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        if (this.isActive) {
            this.showSoundCloudPlayer();
            
            // Temporarily disable the direct Enter key event listener while player is active
            // This prevents it from immediately closing due to key repeat
            document.removeEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        } else {
            this.hideSoundCloudPlayer();
            
            // Re-enable the direct Enter key event listener after player is closed
            document.addEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        }
    }
    
    /**
     * Create and show the SoundCloud player
     */
    showSoundCloudPlayer() {
        console.log('JukeboxEntity: Showing SoundCloud player');
        
        // Create container if it doesn't exist
        if (!this.soundCloudPlayer) {
            console.log('JukeboxEntity: Creating SoundCloud player container');
            
            // Create container for the SoundCloud player
            this.soundCloudPlayer = document.createElement('div');
            this.soundCloudPlayer.id = 'soundCloudPlayerModal';
            this.soundCloudPlayer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                height: 400px;
                background-color: rgba(0, 0, 0, 0.9);
                border: 4px solid #ff00a5;
                box-shadow: 0 0 20px #ff00a5, inset 0 0 10px #ff00a5;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transition: opacity 0.3s ease;
                overflow: hidden;
                padding: 20px;
                color: white;
                font-family: monospace;
            `;
            
            // Create a header with title and close button
            // Add CSS animation for pulsing effect
            const animationStyle = document.createElement('style');
            animationStyle.textContent = `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 20px rgba(255, 0, 165, 0.8); }
                    50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 30px rgba(255, 0, 165, 1); }
                    100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 20px rgba(255, 0, 165, 0.8); }
                }
            `;
            document.head.appendChild(animationStyle);
            
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #ff00a5;
            `;
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = 'AI Alchemist\'s Jukebox';
            title.style.cssText = `
                margin: 0;
                color: #ff00a5;
                text-shadow: 0 0 5px #ff00a5;
            `;
            header.appendChild(title);
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.cssText = `
                background-color: transparent;
                border: 2px solid #ff00a5;
                color: #ff00a5;
                font-weight: bold;
                font-size: 18px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(255, 0, 165, 0.5);
            `;
            
            // Close button hover effect
            closeButton.onmouseover = () => {
                closeButton.style.backgroundColor = 'rgba(255, 0, 165, 0.2)';
            };
            closeButton.onmouseout = () => {
                closeButton.style.backgroundColor = 'transparent';
            };
            
            // Close button click handler with specific callback function to prevent issues
            this.closePlayerHandler = () => {
                console.log('JukeboxEntity: Close button clicked, toggling player off');
                this.toggleJukebox();
            };
            closeButton.addEventListener('click', this.closePlayerHandler);
            
            header.appendChild(closeButton);
            this.soundCloudPlayer.appendChild(header);
            
            // Create player container
            const playerContainer = document.createElement('div');
            playerContainer.style.cssText = `
                flex: 1;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            `;
            
            // Add SoundCloud iframe with mobile-optimized parameters
            const iframe = document.createElement('iframe');
            iframe.id = 'soundcloud-widget';
            iframe.width = '100%';
            iframe.height = '90%'; // Leave room for controls
            iframe.frameBorder = 'no';
            iframe.allow = 'autoplay; encrypted-media';
            iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
            
            // Create a mobile-optimized URL with autoplay enabled
            // - Set auto_play=true for immediate playback on both desktop and mobile
            // - Use mobile=true to hint at mobile optimization
            // - Set show_artwork=true for better mobile experience
            // - Use smaller_images=true for more efficient loading
            // - Disable teaser which can cause problems on mobile
            iframe.src = 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff00a5&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true&show_artwork=true&mobile=true&smaller_images=true';
            
            // Load SoundCloud Widget API if not already loaded
            if (!window.SC) {
                const script = document.createElement('script');
                script.src = 'https://w.soundcloud.com/player/api.js';
                document.head.appendChild(script);
            }
            playerContainer.appendChild(iframe);
            
            // Create an auto-play button as a failsafe, enhanced for touch devices
            const autoplayButton = document.createElement('button');
            autoplayButton.textContent = '▶️ Start Music';
            autoplayButton.id = 'jukebox-autoplay-button';
            autoplayButton.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #ff00a5;
                color: white;
                border: none;
                padding: 20px 40px; /* Larger touch target */
                border-radius: 12px; /* Slightly rounder corners */
                font-weight: bold;
                font-size: 26px; /* Larger text for better visibility */
                cursor: pointer;
                font-family: monospace;
                transition: all 0.3s ease;
                box-shadow: 0 0 20px rgba(255, 0, 165, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                -webkit-tap-highlight-color: rgba(255, 0, 165, 0.5); /* Mobile tap highlight */
                user-select: none; /* Prevent text selection */
                touch-action: manipulation; /* Optimization for touch */
                display: none; /* Initially hidden */
            `;
            playerContainer.appendChild(autoplayButton);
            
            // Initialize SoundCloud Widget API with enhanced autoplay reliability for both desktop and mobile
            let autoplayAttempts = 0;
            const maxAutoplayAttempts = 5; // Increased attempts for mobile
            const attemptAutoplay = () => {
                if (window.SC && autoplayAttempts < maxAutoplayAttempts) {
                    try {
                        console.log(`JukeboxEntity: Autoplay attempt ${autoplayAttempts + 1}/${maxAutoplayAttempts}`);
                        const widget = SC.Widget(iframe);
                        
                        // Check for mobile device first
                        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
                        
                        // Comprehensive approach to ensure autoplay works on both desktop and mobile
                        widget.bind(SC.Widget.Events.READY, () => {
                            console.log(`JukeboxEntity: Widget ready, initiating autoplay sequence (${isMobile ? 'mobile' : 'desktop'} device)`);
                            
                            // Immediate interactive trigger needed for mobile browsers
                            if (isMobile) {
                                // Mobile devices need a slight delay to ensure proper initialization
                                setTimeout(() => {
                                    console.log('JukeboxEntity: Delayed mobile autoplay trigger');
                                    widget.setVolume(90); // Slightly louder for mobile
                                    widget.play();
                                }, 500);
                            } else {
                                // Standard desktop autoplay
                                widget.setVolume(80);
                                widget.play();
                            }
                            
                            // Check if playback actually started after a delay, with longer wait for mobile
                            setTimeout(() => {
                                widget.getPosition(position => {
                                    if (position <= 0) {
                                        // Playback hasn't started, try again or show manual button
                                        console.log('JukeboxEntity: Autoplay failed, position is still 0');
                                        autoplayAttempts++;
                                        
                                        if (autoplayAttempts >= maxAutoplayAttempts) {
                                            console.log('JukeboxEntity: Maximum autoplay attempts reached, showing manual play button');
                                            // Make button more prominent
                                            autoplayButton.style.display = 'flex';
                                            autoplayButton.style.animation = 'pulse 1.5s infinite';
                                            
                                            // Add a hint to the button text for mobile users
                                            if (isMobile) {
                                                autoplayButton.textContent = '▶️ Tap to Play Music';
                                            }
                                        } else {
                                            console.log(`JukeboxEntity: Retry attempt ${autoplayAttempts}`);
                                            widget.play(); // Try again
                                        }
                                    } else {
                                        console.log(`JukeboxEntity: Autoplay successful! Position: ${position}ms`);
                                        // Hide manual button if it's showing
                                        autoplayButton.style.display = 'none';
                                        // Now we can shuffle since playback is working
                                        shufflePlaylist(widget);
                                    }
                                });
                            }, isMobile ? 1500 : 1000); // Longer wait time for mobile
                        });
                        
                        // Handle track completion
                        widget.bind(SC.Widget.Events.FINISH, () => {
                            console.log('JukeboxEntity: Track finished, ensuring playback continues');
                            widget.play();
                        });
                        
                    } catch (err) {
                        console.error('JukeboxEntity: Error during autoplay attempt', err);
                        autoplayAttempts++;
                        if (autoplayAttempts >= maxAutoplayAttempts) {
                            autoplayButton.style.display = 'block';
                        }
                    }
                } else if (autoplayAttempts >= maxAutoplayAttempts) {
                    autoplayButton.style.display = 'block';
                }
            };
            
            // Function to shuffle the playlist
            const shufflePlaylist = (widget) => {
                widget.getSounds((playlist) => {
                    if (!playlist || playlist.length === 0) {
                        console.error('JukeboxEntity: No tracks found in playlist');
                        return;
                    }
                    
                    // Pick a random track to start with
                    const trackCount = playlist.length;
                    const randomTrack = Math.floor(Math.random() * trackCount);
                    
                    console.log(`JukeboxEntity: Shuffling to random track ${randomTrack+1} of ${trackCount}`);
                    widget.skip(randomTrack);
                    widget.play();
                });
            };
            
            // Manual start button handlers optimized for both touch and mouse events
            // Add visual feedback for touch interaction
            const handlePlayAction = () => {
                if (window.SC) {
                    try {
                        console.log('JukeboxEntity: Manual play button activated');
                        const widget = SC.Widget(iframe);
                        widget.play();
                        autoplayButton.style.display = 'none';
                        shufflePlaylist(widget);
                    } catch (err) {
                        console.error('JukeboxEntity: Error starting playback manually', err);
                    }
                }
            };
            
            // Add visual feedback for touch
            const applyTouchEffect = () => {
                autoplayButton.style.transform = 'translate(-50%, -50%) scale(0.97)';
                autoplayButton.style.backgroundColor = '#d6008c';
                autoplayButton.style.boxShadow = '0 0 25px rgba(255, 0, 165, 0.9)';
            };
            
            const removeTouchEffect = () => {
                autoplayButton.style.transform = 'translate(-50%, -50%)';
                autoplayButton.style.backgroundColor = '#ff00a5';
                autoplayButton.style.boxShadow = '0 0 20px rgba(255, 0, 165, 0.8)';
            };
            
            // Add all event listeners for better mobile support
            autoplayButton.addEventListener('click', handlePlayAction);
            autoplayButton.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent double-tap zoom
                applyTouchEffect();
            }, { passive: false });
            
            autoplayButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                removeTouchEffect();
                handlePlayAction();
            }, { passive: false });
            
            // Mouse events for desktop
            autoplayButton.addEventListener('mousedown', applyTouchEffect);
            autoplayButton.addEventListener('mouseup', removeTouchEffect);
            autoplayButton.addEventListener('mouseleave', removeTouchEffect);
            
            // Start the autoplay attempt sequence
            setTimeout(attemptAutoplay, 1000);
            
            // Mobile playback is now functional, no fallback needed
            
            // Add control buttons for playback
            const controlButtonsContainer = document.createElement('div');
            controlButtonsContainer.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 10px;
                margin-bottom: 10px;
            `;
            
            // Helper function to create control buttons with consistent styling and touch support
            const createButton = (text, tooltip) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.title = tooltip;
                button.style.cssText = `
                    background-color: #ff00a5;
                    color: white;
                    border: none;
                    padding: 12px 20px; /* Larger touch target */
                    border-radius: 8px; /* Slightly rounder corners */
                    font-weight: bold;
                    font-size: 18px; /* Larger text for mobile */
                    cursor: pointer;
                    font-family: monospace;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 10px rgba(255, 0, 165, 0.5);
                    -webkit-tap-highlight-color: rgba(255, 0, 165, 0.5); /* Mobile tap highlight */
                    user-select: none; /* Prevent text selection */
                    touch-action: manipulation; /* Optimization for touch */
                `;
                
                // Apply visual feedback on touch/click
                const applyButtonEffect = () => {
                    button.style.transform = 'scale(0.97)';
                    button.style.backgroundColor = '#d6008c';
                    button.style.boxShadow = '0 0 15px rgba(255, 0, 165, 0.8)';
                };
                
                const removeButtonEffect = () => {
                    button.style.transform = 'scale(1)';
                    button.style.backgroundColor = '#ff00a5';
                    button.style.boxShadow = '0 0 10px rgba(255, 0, 165, 0.5)';
                };
                
                // Mouse events for desktop
                button.addEventListener('mousedown', applyButtonEffect);
                button.addEventListener('mouseup', removeButtonEffect);
                button.addEventListener('mouseleave', removeButtonEffect);
                
                // Touch events for mobile
                button.addEventListener('touchstart', (e) => {
                    // Prevent default to avoid delays on mobile
                    e.preventDefault();
                    applyButtonEffect();
                }, { passive: false });
                
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    removeButtonEffect();
                }, { passive: false });
                
                return button;
            };
            
            // Previous track button
            const prevButton = createButton('⏮️ Prev', 'Play previous track');
            
            // Next track button
            const nextButton = createButton('⏭️ Next', 'Play next track');
            
            // Shuffle button
            const shuffleButton = createButton('🔀 Shuffle', 'Shuffle playlist');
            
            // Shuffle button click handler with Widget API integration
            shuffleButton.addEventListener('click', () => {
                console.log('JukeboxEntity: Shuffle button clicked, activating true random playback');
                
                // Use the SoundCloud Widget API to properly shuffle tracks
                if (window.SC) {
                    try {
                        // Get widget instance
                        const widget = SC.Widget(iframe);
                        
                        // First ensure playlist is loaded before attempting to shuffle
                        widget.bind(SC.Widget.Events.READY, () => {
                            console.log('JukeboxEntity: Widget ready, retrieving playlist');
                            
                            // Get the playlist tracks
                            widget.getSounds((playlist) => {
                                if (!playlist || playlist.length === 0) {
                                    console.error('JukeboxEntity: No tracks found in playlist');
                                    return;
                                }
                                
                                console.log(`JukeboxEntity: Found ${playlist.length} tracks to shuffle`);
                                
                                // Create array of shuffled indices
                                const trackCount = playlist.length;
                                const indices = Array.from({length: trackCount}, (_, i) => i);
                                
                                // Fisher-Yates shuffle algorithm
                                for (let i = indices.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [indices[i], indices[j]] = [indices[j], indices[i]];
                                }
                                
                                // Select a random starting point
                                const startAt = Math.floor(Math.random() * indices.length);
                                
                                // Skip to random track and play
                                const firstTrack = indices[startAt];
                                console.log(`JukeboxEntity: Jumping to random track ${firstTrack+1} of ${trackCount}`);
                                
                                widget.skip(firstTrack);
                                widget.play();
                                
                                // Show shuffle feedback to user
                                shuffleButton.textContent = '🔀 Shuffled!';
                                setTimeout(() => {
                                    shuffleButton.textContent = '🔀 Shuffle';
                                }, 1500);
                            });
                        });
                        
                    } catch (err) {
                        console.error('JukeboxEntity: Error using SoundCloud Widget API', err);
                        // Fallback to iframe reload if Widget API fails
                        const newRandomIndex = Math.floor(Math.random() * 20);
                        iframe.src = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff00a5&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true&starting_track=${newRandomIndex}`;
                        console.log(`JukeboxEntity: Fallback shuffle to track index ${newRandomIndex}`);
                    }
                } else {
                    // Fallback to iframe reload if Widget API not available
                    const newRandomIndex = Math.floor(Math.random() * 20);
                    iframe.src = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1886380535&color=%23ff00a5&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true&starting_track=${newRandomIndex}`;
                    console.log(`JukeboxEntity: Fallback shuffle to track index ${newRandomIndex}`);
                }
            });
            
            // Previous track button handler
            prevButton.addEventListener('click', () => {
                console.log('JukeboxEntity: Previous button clicked');
                if (window.SC) {
                    try {
                        const widget = SC.Widget(iframe);
                        widget.prev();
                        
                        // Show feedback
                        prevButton.textContent = '⏮️ Playing Previous';
                        setTimeout(() => {
                            prevButton.textContent = '⏮️ Prev';
                        }, 1000);
                    } catch (err) {
                        console.error('JukeboxEntity: Error using previous track', err);
                    }
                }
            });
            
            // Next track button handler
            nextButton.addEventListener('click', () => {
                console.log('JukeboxEntity: Next button clicked');
                if (window.SC) {
                    try {
                        const widget = SC.Widget(iframe);
                        widget.next();
                        
                        // Show feedback
                        nextButton.textContent = '⏭️ Playing Next';
                        setTimeout(() => {
                            nextButton.textContent = '⏭️ Next';
                        }, 1000);
                    } catch (err) {
                        console.error('JukeboxEntity: Error using next track', err);
                    }
                }
            });
            
            // Add all buttons to the control container
            controlButtonsContainer.appendChild(prevButton);
            controlButtonsContainer.appendChild(shuffleButton);
            controlButtonsContainer.appendChild(nextButton);
            playerContainer.appendChild(controlButtonsContainer);
            
            // Add attribution div
            const attribution = document.createElement('div');
            attribution.style.cssText = `
                font-size: 10px;
                color: #cccccc;
                line-break: anywhere;
                word-break: normal;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;
                font-weight: 100;
                margin-top: 5px;
                text-align: center;
            `;
            attribution.innerHTML = '<a href="https://soundcloud.com/vanitas_euphony" title="Vanitas" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas</a> · <a href="https://soundcloud.com/vanitas_euphony/sets/vanitas-essential-tracks" title="Vanitas Essential Tracks" target="_blank" style="color: #cccccc; text-decoration: none;">Vanitas Essential Tracks</a>';
            playerContainer.appendChild(attribution);
            
            // Add instruction text
            const instructions = document.createElement('p');
            instructions.textContent = 'Press ESC key or click X to close the player';
            instructions.style.cssText = `
                color: rgba(255, 0, 165, 0.8);
                margin-top: 15px;
                text-align: center;
                font-size: 12px;
            `;
            playerContainer.appendChild(instructions);
            
            this.soundCloudPlayer.appendChild(playerContainer);
            
            // Add to DOM
            document.body.appendChild(this.soundCloudPlayer);
            
            // Setup keydown event to close with Escape key
            this.keydownHandler = (event) => {
                if (event.key === 'Escape') {
                    this.toggleJukebox();
                }
            };
            document.addEventListener('keydown', this.keydownHandler);
            
            // Prevent clicks on the player from propagating to game canvas
            this.soundCloudPlayer.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            
            // Small delay to allow DOM to update before transitioning opacity
            setTimeout(() => {
                this.soundCloudPlayer.style.opacity = '1';
            }, 50);
        } else {
            // Just show existing player
            document.body.appendChild(this.soundCloudPlayer);
            
            // Setup keydown event to close with Escape key
            this.keydownHandler = (event) => {
                if (event.key === 'Escape') {
                    this.toggleJukebox();
                }
            };
            document.addEventListener('keydown', this.keydownHandler);
            
            // Small delay to allow DOM to update before transitioning opacity
            setTimeout(() => {
                this.soundCloudPlayer.style.opacity = '1';
            }, 50);
        }
    }
    
    
    /**
     * Hide the SoundCloud player
     */
    hideSoundCloudPlayer() {
        console.log('JukeboxEntity: Hiding SoundCloud player');
        
        if (this.soundCloudPlayer) {
            // Fade out
            this.soundCloudPlayer.style.opacity = '0';
            
            // Clean up event listeners explicitly
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
                this.keydownHandler = null;
            }
            
            // Remove after transition
            setTimeout(() => {
                // Remove from DOM but keep reference
                if (this.soundCloudPlayer && this.soundCloudPlayer.parentNode) {
                    this.soundCloudPlayer.parentNode.removeChild(this.soundCloudPlayer);
                    console.log('JukeboxEntity: Player element removed from DOM');
                }
            }, 300);
        }
    }
    
    /**
     * Play a vinyl record scratch and music sample sound when player approaches
     */
    playProximitySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 2.5; // seconds
            
            // Create an audio buffer for our combined effect
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
            const leftChannel = buffer.getChannelData(0);
            const rightChannel = buffer.getChannelData(1);
            
            // Part 1: Vinyl record scratch (~0.7 seconds)
            const scratchDuration = 0.7; // seconds
            const scratchSamples = Math.floor(scratchDuration * audioCtx.sampleRate);
            
            // Vinyl scratch parameters
            const scratchIntensity = 0.8;
            const scratchSpeed = 30;
            
            for (let i = 0; i < scratchSamples; i++) {
                const t = i / audioCtx.sampleRate;
                
                // Envelope for scratch (start strong, fade out)
                const env = 1 - (i / scratchSamples);
                
                // Base scratch noise - filtered noise with rapid pitch changes
                const noise = Math.random() * 2 - 1;
                
                // Forward-backward motion for scratch effect
                const scratchPattern = Math.sin(t * scratchSpeed * (1 + t * 5));
                
                // Combine with a resonant filter effect
                const resonance = Math.sin(2 * Math.PI * 500 * t) * Math.exp(-t * 10) * 0.3;
                
                // Add crackle for authentic vinyl sound
                const crackle = (Math.random() > 0.98) ? Math.random() * 0.3 : 0;
                
                // Combine components
                const scratch = ((noise * 0.4 + scratchPattern * 0.6) * scratchIntensity + resonance + crackle) * env;
                
                // Stereo effect
                leftChannel[i] = scratch * 0.9;
                rightChannel[i] = scratch * 0.8;
            }
            
            // Small gap between scratch and music
            const gapSamples = Math.floor(0.1 * audioCtx.sampleRate);
            
            // Part 2: Brief music sample (notes from a melody)
            const sampleStartIndex = scratchSamples + gapSamples;
            const musicDuration = duration - scratchDuration - 0.1; // Remaining time after scratch and gap
            const musicSamples = Math.floor(musicDuration * audioCtx.sampleRate);
            
            // Define a short funky bassline with beat
            const notes = [
                { freq: 110, duration: 0.12, type: 'bass' }, // A2
                { freq: 110, duration: 0.12, type: 'bass' }, // A2 repeat
                { freq: 146.83, duration: 0.12, type: 'bass' }, // D3
                { freq: 110, duration: 0.12, type: 'bass' }, // A2
                { freq: 164.81, duration: 0.2, type: 'bass' }, // E3
                { freq: 220, duration: 0.1, type: 'bass' }, // A3
                { freq: 220, duration: 0.1, type: 'bass' } // A3 repeat
            ];
            
            // Add a few high chord stabs
            const chordStabs = [
                { time: 0.3, duration: 0.1 },
                { time: 0.7, duration: 0.1 }
            ];
            
            // Drum beat pattern (kick on 1 and 3, snare on 2 and 4)
            const beats = [
                { time: 0, type: 'kick' },
                { time: 0.25, type: 'snare' },
                { time: 0.5, type: 'kick' },
                { time: 0.75, type: 'snare' }
            ];
            
            // Generate music section
            let noteStartTime = 0;
            
            // Add bass notes
            for (let i = 0; i < notes.length && noteStartTime < musicDuration; i++) {
                const note = notes[i];
                const noteSamples = Math.floor(note.duration * audioCtx.sampleRate);
                const noteEndTime = noteStartTime + note.duration;
                const startIndex = sampleStartIndex + Math.floor(noteStartTime * audioCtx.sampleRate);
                
                for (let j = 0; j < noteSamples; j++) {
                    if (startIndex + j >= bufferSize) break;
                    
                    const t = j / audioCtx.sampleRate;
                    const noteEnvelope = Math.min(1, (j / 1000)) * Math.min(1, (noteSamples - j) / 1000);
                    
                    // Bass sound - sine with overtones
                    const bassSound = Math.sin(2 * Math.PI * note.freq * t) * 0.6 + 
                                    Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.2 + 
                                    Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.1;
                    
                    // Apply exponential decay
                    const noteValue = bassSound * noteEnvelope * 0.5;
                    
                    // Mix into buffer
                    leftChannel[startIndex + j] += noteValue;
                    rightChannel[startIndex + j] += noteValue;
                }
                
                noteStartTime = noteEndTime;
            }
            
            // Add chord stabs
            for (const stab of chordStabs) {
                if (stab.time >= musicDuration) continue;
                
                const stabSamples = Math.floor(stab.duration * audioCtx.sampleRate);
                const startIndex = sampleStartIndex + Math.floor(stab.time * audioCtx.sampleRate);
                
                // Define chord frequencies (A minor 7th: A C E G)
                const chordFreqs = [440, 523.25, 659.25, 392];
                
                for (let j = 0; j < stabSamples; j++) {
                    if (startIndex + j >= bufferSize) break;
                    
                    const t = j / audioCtx.sampleRate;
                    const stabEnvelope = Math.exp(-j / (stabSamples / 5)); // Fast decay
                    
                    // Generate chord tones
                    let chordSound = 0;
                    for (const freq of chordFreqs) {
                        chordSound += Math.sin(2 * Math.PI * freq * t) * 0.15;
                    }
                    
                    // Apply envelope
                    const chordValue = chordSound * stabEnvelope * 0.3;
                    
                    // Mix into buffer with slight stereo spread
                    leftChannel[startIndex + j] += chordValue * 1.1;
                    rightChannel[startIndex + j] += chordValue * 0.9;
                }
            }
            
            // Add drum beats
            for (let bar = 0; bar < 2; bar++) { // Two bars of beats
                for (const beat of beats) {
                    const beatTime = beat.type === 'kick' ? 0.05 : 0.08; // Kick is shorter than snare
                    const beatStart = bar + beat.time;
                    
                    if (beatStart >= musicDuration) continue;
                    
                    const beatSamples = Math.floor(beatTime * audioCtx.sampleRate);
                    const startIndex = sampleStartIndex + Math.floor(beatStart * audioCtx.sampleRate);
                    
                    for (let j = 0; j < beatSamples; j++) {
                        if (startIndex + j >= bufferSize) break;
                        
                        const t = j / audioCtx.sampleRate;
                        let beatValue = 0;
                        
                        if (beat.type === 'kick') {
                            // Kick drum - sine wave with exponential pitch drop
                            const kickFreq = 120 * Math.exp(-t * 20) + 60;
                            beatValue = Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-t * 20) * 0.7;
                        } else {
                            // Snare - filtered noise with resonance
                            const snareNoise = Math.random() * 2 - 1;
                            const snareResonance = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 20) * 0.3;
                            beatValue = (snareNoise * 0.5 + snareResonance) * Math.exp(-t * 10) * 0.6;
                        }
                        
                        // Mix into buffer
                        leftChannel[startIndex + j] += beatValue * 0.45;
                        rightChannel[startIndex + j] += beatValue * 0.45;
                    }
                }
            }
            
            // Final normalization to prevent clipping
            let maxSample = 0;
            for (let i = 0; i < bufferSize; i++) {
                maxSample = Math.max(maxSample, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
            }
            
            if (maxSample > 0.8) {
                const normalizationFactor = 0.8 / maxSample;
                for (let i = 0; i < bufferSize; i++) {
                    leftChannel[i] *= normalizationFactor;
                    rightChannel[i] *= normalizationFactor;
                }
            }
            
            // Create source node and connect to destination
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            
            // Add filtering
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highshelf';
            filter.frequency.value = 4000;
            filter.gain.value = -6; // Cut some highs for vintage feel
            
            // Add a compressor for punch
            const compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 10;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.005;
            compressor.release.value = 0.05;
            
            // Master gain
            const masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.6;
            
            // Connect nodes
            source.connect(filter);
            filter.connect(compressor);
            compressor.connect(masterGain);
            masterGain.connect(audioCtx.destination);
            
            // Play sound
            source.start();
            
            // Schedule cleanup
            setTimeout(() => {
                try {
                    source.stop();
                    audioCtx.close();
                } catch (err) {
                    console.warn('Error cleaning up jukebox sound:', err);
                }
            }, duration * 1000);
            
            debug('JukeboxEntity: Played vinyl scratch and music sample proximity sound');
        } catch (err) {
            console.error(`JukeboxEntity: Error playing proximity sound: ${err.message}`);
        }
    }
    
    /**
     * Play a vinyl record scratch and music sample sound when player approaches
     */
    playProximitySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 2.5; // seconds
            
            // Create an audio buffer for our combined effect
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
            const leftChannel = buffer.getChannelData(0);
            const rightChannel = buffer.getChannelData(1);
            
            // Part 1: Vinyl record scratch (~0.7 seconds)
            const scratchDuration = 0.7; // seconds
            const scratchSamples = Math.floor(scratchDuration * audioCtx.sampleRate);
            
            // Vinyl scratch parameters
            const scratchIntensity = 0.8;
            const scratchSpeed = 30;
            
            for (let i = 0; i < scratchSamples; i++) {
                const t = i / audioCtx.sampleRate;
                
                // Envelope for scratch (start strong, fade out)
                const env = 1 - (i / scratchSamples);
                
                // Base scratch noise - filtered noise with rapid pitch changes
                const noise = Math.random() * 2 - 1;
                
                // Forward-backward motion for scratch effect
                const scratchPattern = Math.sin(t * scratchSpeed * (1 + t * 5));
                
                // Combine with a resonant filter effect
                const resonance = Math.sin(2 * Math.PI * 500 * t) * Math.exp(-t * 10) * 0.3;
                
                // Add crackle for authentic vinyl sound
                const crackle = (Math.random() > 0.98) ? Math.random() * 0.3 : 0;
                
                // Combine components
                const scratch = ((noise * 0.4 + scratchPattern * 0.6) * scratchIntensity + resonance + crackle) * env;
                
                // Stereo effect
                leftChannel[i] = scratch * 0.9;
                rightChannel[i] = scratch * 0.8;
            }
            
            // Small gap between scratch and music
            const gapSamples = Math.floor(0.1 * audioCtx.sampleRate);
            
            // Part 2: Brief music sample (notes from a melody)
            const sampleStartIndex = scratchSamples + gapSamples;
            const musicDuration = duration - scratchDuration - 0.1; // Remaining time after scratch and gap
            const musicSamples = Math.floor(musicDuration * audioCtx.sampleRate);
            
            // Define a short funky bassline with beat
            const notes = [
                { freq: 110, duration: 0.12, type: 'bass' }, // A2
                { freq: 110, duration: 0.12, type: 'bass' }, // A2 repeat
                { freq: 146.83, duration: 0.12, type: 'bass' }, // D3
                { freq: 110, duration: 0.12, type: 'bass' }, // A2
                { freq: 164.81, duration: 0.2, type: 'bass' }, // E3
                { freq: 220, duration: 0.1, type: 'bass' }, // A3
                { freq: 220, duration: 0.1, type: 'bass' } // A3 repeat
            ];
            
            // Add a few high chord stabs
            const chordStabs = [
                { time: 0.3, duration: 0.1 },
                { time: 0.7, duration: 0.1 }
            ];
            
            // Drum beat pattern (kick on 1 and 3, snare on 2 and 4)
            const beats = [
                { time: 0, type: 'kick' },
                { time: 0.25, type: 'snare' },
                { time: 0.5, type: 'kick' },
                { time: 0.75, type: 'snare' }
            ];
            
            // Generate music section
            let noteStartTime = 0;
            
            // Add bass notes
            for (let i = 0; i < notes.length && noteStartTime < musicDuration; i++) {
                const note = notes[i];
                const noteSamples = Math.floor(note.duration * audioCtx.sampleRate);
                const noteEndTime = noteStartTime + note.duration;
                const startIndex = sampleStartIndex + Math.floor(noteStartTime * audioCtx.sampleRate);
                
                for (let j = 0; j < noteSamples; j++) {
                    if (startIndex + j >= bufferSize) break;
                    
                    const t = j / audioCtx.sampleRate;
                    const noteEnvelope = Math.min(1, (j / 1000)) * Math.min(1, (noteSamples - j) / 1000);
                    
                    // Bass sound - sine with overtones
                    const bassSound = Math.sin(2 * Math.PI * note.freq * t) * 0.6 + 
                                    Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.2 + 
                                    Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.1;
                    
                    // Apply exponential decay
                    const noteValue = bassSound * noteEnvelope * 0.5;
                    
                    // Mix into buffer
                    leftChannel[startIndex + j] += noteValue;
                    rightChannel[startIndex + j] += noteValue;
                }
                
                noteStartTime = noteEndTime;
            }
            
            // Add chord stabs
            for (const stab of chordStabs) {
                if (stab.time >= musicDuration) continue;
                
                const stabSamples = Math.floor(stab.duration * audioCtx.sampleRate);
                const startIndex = sampleStartIndex + Math.floor(stab.time * audioCtx.sampleRate);
                
                // Define chord frequencies (A minor 7th: A C E G)
                const chordFreqs = [440, 523.25, 659.25, 392];
                
                for (let j = 0; j < stabSamples; j++) {
                    if (startIndex + j >= bufferSize) break;
                    
                    const t = j / audioCtx.sampleRate;
                    const stabEnvelope = Math.exp(-j / (stabSamples / 5)); // Fast decay
                    
                    // Generate chord tones
                    let chordSound = 0;
                    for (const freq of chordFreqs) {
                        chordSound += Math.sin(2 * Math.PI * freq * t) * 0.15;
                    }
                    
                    // Apply envelope
                    const chordValue = chordSound * stabEnvelope * 0.3;
                    
                    // Mix into buffer with slight stereo spread
                    leftChannel[startIndex + j] += chordValue * 1.1;
                    rightChannel[startIndex + j] += chordValue * 0.9;
                }
            }
            
            // Add drum beats
            for (let bar = 0; bar < 2; bar++) { // Two bars of beats
                for (const beat of beats) {
                    const beatTime = beat.type === 'kick' ? 0.05 : 0.08; // Kick is shorter than snare
                    const beatStart = bar + beat.time;
                    
                    if (beatStart >= musicDuration) continue;
                    
                    const beatSamples = Math.floor(beatTime * audioCtx.sampleRate);
                    const startIndex = sampleStartIndex + Math.floor(beatStart * audioCtx.sampleRate);
                    
                    for (let j = 0; j < beatSamples; j++) {
                        if (startIndex + j >= bufferSize) break;
                        
                        const t = j / audioCtx.sampleRate;
                        let beatValue = 0;
                        
                        if (beat.type === 'kick') {
                            // Kick drum - sine wave with exponential pitch drop
                            const kickFreq = 120 * Math.exp(-t * 20) + 60;
                            beatValue = Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-t * 20) * 0.7;
                        } else {
                            // Snare - filtered noise with resonance
                            const snareNoise = Math.random() * 2 - 1;
                            const snareResonance = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 20) * 0.3;
                            beatValue = (snareNoise * 0.5 + snareResonance) * Math.exp(-t * 10) * 0.6;
                        }
                        
                        // Mix into buffer
                        leftChannel[startIndex + j] += beatValue * 0.45;
                        rightChannel[startIndex + j] += beatValue * 0.45;
                    }
                }
            }
            
            // Final normalization to prevent clipping
            let maxSample = 0;
            for (let i = 0; i < bufferSize; i++) {
                maxSample = Math.max(maxSample, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
            }
            
            if (maxSample > 0.8) {
                const normalizationFactor = 0.8 / maxSample;
                for (let i = 0; i < bufferSize; i++) {
                    leftChannel[i] *= normalizationFactor;
                    rightChannel[i] *= normalizationFactor;
                }
            }
            
            // Create source node and connect to destination
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            
            // Add filtering
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highshelf';
            filter.frequency.value = 4000;
            filter.gain.value = -6; // Cut some highs for vintage feel
            
            // Add a compressor for punch
            const compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 10;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.005;
            compressor.release.value = 0.05;
            
            // Master gain
            const masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.3;
            
            // Connect nodes
            source.connect(filter);
            filter.connect(compressor);
            compressor.connect(masterGain);
            masterGain.connect(audioCtx.destination);
            
            // Play sound
            source.start();
            
            // Schedule cleanup
            setTimeout(() => {
                try {
                    source.stop();
                    audioCtx.close();
                } catch (err) {
                    console.warn('Error cleaning up jukebox sound:', err);
                }
            }, duration * 1000);
            
            debug('JukeboxEntity: Played vinyl scratch and music sample proximity sound');
        } catch (err) {
            console.error(`JukeboxEntity: Error playing proximity sound: ${err.message}`);
        }
    }
    
    /**
     * Clean up event listeners when entity is removed
     * This prevents memory leaks
     */
    cleanup() {
        console.log('JukeboxEntity: Cleaning up event listeners');
        // Remove the direct keydown event listener
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Hide and remove player if active
        if (this.isActive) {
            this.hideSoundCloudPlayer();
        }
    }
    
    /**
     * Draw the jukebox with appropriate glow effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        console.log(`JukeboxEntity: Drawing jukebox at (${this.x}, ${this.y}) -> screen (${screenX}, ${screenY})`);
        
        try {
            // Get jukebox image - either from our direct loading or asset loader as fallback
            const jukeboxImage = this.jukeboxImage || assetLoader.getAsset(this.jukeboxKey);
            
            if (jukeboxImage) {
                console.log(`JukeboxEntity: Image found (${jukeboxImage.width}x${jukeboxImage.height}), drawing actual jukebox`);
                
                // Draw jukebox image
                const jukeboxWidth = width * 2.5;
                const jukeboxHeight = height * 3.75;
                
                // Position jukebox so it appears grounded at the correct isometric position
                // Subtract half the width to center horizontally
                const jukeboxX = screenX - jukeboxWidth / 2;
                
                // Key change: Properly use height and zOffset to position vertically
                // This ensures the jukebox is properly grounded on the isometric plane
                // Move the jukebox base to the ground level by adding a fixed offset
                // A lower multiplier means higher on the grid (0.2-0.3 is good for a "standing on the ground" effect)
                const groundingFactor = 0.3;
                const jukeboxY = screenY - (jukeboxHeight * groundingFactor);
                
                // Draw glow effect
                ctx.save();
                
                // Enhanced glow when player is nearby
                if (this.isPlayerNearby) {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 25 * this.glowIntensity;
                } else {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 15 * this.glowIntensity;
                }
                
                // Draw the jukebox
                ctx.drawImage(
                    jukeboxImage,
                    jukeboxX,
                    jukeboxY,
                    jukeboxWidth,
                    jukeboxHeight
                );
                
                ctx.restore();
                
                // Draw interaction prompt when player is nearby
                if (this.interactionPromptAlpha > 0) {
                    this.drawInteractionPrompt(ctx, screenX, screenY - jukeboxHeight * 0.8);
                }
                
                console.log(`JukeboxEntity: Jukebox image drawn successfully`);
            } else {
                console.log(`JukeboxEntity: No image available, drawing fallback`);
                
                // If no image is loaded yet, try loading again if we haven't exceeded attempts
                if (this.loadAttempts < this.maxLoadAttempts) {
                    console.log(`JukeboxEntity: Retrying image load, current attempts: ${this.loadAttempts}`);
                    this.directLoadJukeboxImage();
                } else {
                    console.log(`JukeboxEntity: Max load attempts (${this.maxLoadAttempts}) reached, using fallback only`);
                }
                
                // Draw fallback while loading or if loading failed
                this.drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset);
            }
        } catch (err) {
            console.error(`JukeboxEntity: Error drawing jukebox:`, err);
            this.drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset);
        }
    }
    
    /**
     * Draw interaction prompt above the jukebox
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for the prompt
     * @param {number} y - Y position for the prompt
     */
    drawInteractionPrompt(ctx, x, y) {
        ctx.save();
        
        // Set up text style with larger font
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Enhanced glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Play Music';
        const textWidth = ctx.measureText(text).width;
        
        // Draw background
        ctx.fillStyle = `rgba(0, 0, 0, ${this.interactionPromptAlpha * 0.7})`;
        ctx.fillRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw border
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Draw a fallback jukebox when the image fails to load
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     * @param {number} zOffset - Z offset for rendering height
     */
    drawFallbackJukebox(ctx, screenX, screenY, width, height, zOffset) {
        console.log(`JukeboxEntity: Drawing fallback jukebox at (${screenX}, ${screenY})`);
        
        // Save context for transformations
        ctx.save();
        
        // Calculate dimensions for the jukebox
        const jukeboxWidth = width * 1.1;
        const jukeboxHeight = height * 1.8;
        
        // Position jukebox so it appears grounded at the correct isometric position
        // Subtract half the width to center horizontally
        const jukeboxX = screenX - jukeboxWidth / 2;
        
        // Apply same positioning as the main draw method for consistency
        const groundingFactor = 0.3;
        const jukeboxY = screenY - (jukeboxHeight * groundingFactor);
        
        // Add neon glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15 * this.glowIntensity;
        
        // Base of the jukebox (dark metal)
        ctx.fillStyle = '#232323';
        ctx.fillRect(jukeboxX, jukeboxY + jukeboxHeight * 0.3, jukeboxWidth, jukeboxHeight * 0.7);
        
        // Top rounded part
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.ellipse(
            jukeboxX + jukeboxWidth/2, 
            jukeboxY + jukeboxHeight * 0.3, 
            jukeboxWidth/2, 
            jukeboxHeight * 0.15, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Screen area
        ctx.fillStyle = '#000';
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        
        // Cyan screen glow
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.3 * this.glowIntensity;
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        ctx.globalAlpha = 1.0;
        
        // Control panel area
        ctx.fillStyle = '#444';
        ctx.fillRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.75, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.15
        );
        
        // Cyan neon trim
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        // Outline the jukebox
        ctx.beginPath();
        ctx.moveTo(jukeboxX, jukeboxY + jukeboxHeight * 0.3);
        ctx.lineTo(jukeboxX, jukeboxY + jukeboxHeight);
        ctx.lineTo(jukeboxX + jukeboxWidth, jukeboxY + jukeboxHeight);
        ctx.lineTo(jukeboxX + jukeboxWidth, jukeboxY + jukeboxHeight * 0.3);
        ctx.stroke();
        
        // Top curve outline
        ctx.beginPath();
        ctx.ellipse(
            jukeboxX + jukeboxWidth/2, 
            jukeboxY + jukeboxHeight * 0.3, 
            jukeboxWidth/2, 
            jukeboxHeight * 0.15, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Screen outline
        ctx.strokeRect(
            jukeboxX + jukeboxWidth * 0.15, 
            jukeboxY + jukeboxHeight * 0.35, 
            jukeboxWidth * 0.7, 
            jukeboxHeight * 0.3
        );
        
        // Control buttons
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#ffff00';
            ctx.beginPath();
            ctx.arc(
                jukeboxX + jukeboxWidth * 0.25 + i * (jukeboxWidth * 0.15), 
                jukeboxY + jukeboxHeight * 0.82, 
                jukeboxWidth * 0.05, 
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
        }
        
        // Sound wave icon on screen
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(jukeboxX + jukeboxWidth * 0.2, jukeboxY + jukeboxHeight * 0.5);
        ctx.quadraticCurveTo(
            jukeboxX + jukeboxWidth * 0.35, 
            jukeboxY + jukeboxHeight * 0.4,
            jukeboxX + jukeboxWidth * 0.5, 
            jukeboxY + jukeboxHeight * 0.5
        );
        ctx.quadraticCurveTo(
            jukeboxX + jukeboxWidth * 0.65, 
            jukeboxY + jukeboxHeight * 0.6,
            jukeboxX + jukeboxWidth * 0.8, 
            jukeboxY + jukeboxHeight * 0.5
        );
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Restore context
        ctx.restore();
    }
}

export { JukeboxEntity };
