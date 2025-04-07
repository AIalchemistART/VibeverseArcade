/**
 * loadingScreen.js
 * 
 * Provides a themed loading screen with progress indicators for the Vibeverse Arcade.
 * This screen displays during the initial asset loading to ensure all resources are properly
 * loaded before the player enters the game.
 */

class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.loadingContainer = null;
        this.vibeSymbols = [
            '🌀', '🎮', '🔮', '✨', '🌐', '🌈', '🎧', '🌠', '🕹️'
        ];
        this.currentSymbolIndex = 0;
        this.symbolRotationInterval = null;
        this.loadingMessages = [
            "Synchronizing interdimensional portals...",
            "Calibrating vibrational frequencies...",
            "Connecting to the Vibeverse network...",
            "Loading digital consciousness matrix...",
            "Generating synthwave harmonics...",
            "Initializing neon grid systems...",
            "Activating retro-futuristic interfaces...",
            "Stabilizing arcade quantum processors...",
            "Amplifying community vibrations...",
            "Powering up arcade energy fields...",
            "Unlocking dimensional gateways..."
        ];
    }

    /**
     * Create and show the loading screen
     */
    show() {
        // Create main container
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.id = 'loading-screen';
        this.loadingContainer.style.position = 'fixed';
        this.loadingContainer.style.top = '0';
        this.loadingContainer.style.left = '0';
        this.loadingContainer.style.width = '100%';
        this.loadingContainer.style.height = '100%';
        this.loadingContainer.style.background = 'linear-gradient(135deg, #1a0536 0%, #000000 100%)'; // Deep purple to black gradient
        this.loadingContainer.style.display = 'flex';
        this.loadingContainer.style.flexDirection = 'column';
        this.loadingContainer.style.justifyContent = 'center';
        this.loadingContainer.style.alignItems = 'center';
        this.loadingContainer.style.zIndex = '9999';
        this.loadingContainer.style.transition = 'opacity 1s ease-out';
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = "Vibeverse Arcade";
        title.style.color = '#ff00ff'; // Neon purple
        title.style.fontFamily = '"Cinzel Decorative", serif, fantasy';
        title.style.fontSize = '3.5rem';
        title.style.marginBottom = '1rem';
        title.style.textShadow = '0 0 10px rgba(255, 0, 255, 0.7), 0 0 20px rgba(255, 0, 255, 0.5)';
        title.style.animation = 'glow 3s infinite ease-in-out';
        
        // Add spinning vibe symbol
        this.loadingElement = document.createElement('div');
        this.loadingElement.textContent = this.vibeSymbols[0];
        this.loadingElement.style.fontSize = '5rem';
        this.loadingElement.style.marginBottom = '1.5rem';
        this.loadingElement.style.animation = 'spin 4s infinite linear';
        this.loadingElement.style.display = 'inline-block';
        
        // Add a loading message
        this.loadingMessage = document.createElement('div');
        this.loadingMessage.textContent = this.getRandomLoadingMessage();
        this.loadingMessage.style.color = '#f0e6d2';
        this.loadingMessage.style.fontFamily = 'serif';
        this.loadingMessage.style.fontSize = '1.5rem';
        this.loadingMessage.style.marginBottom = '2rem';
        this.loadingMessage.style.fontStyle = 'italic';
        
        // Create progress container
        const progressContainer = document.createElement('div');
        progressContainer.style.width = '80%';
        progressContainer.style.maxWidth = '500px';
        progressContainer.style.height = '20px';
        progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        progressContainer.style.borderRadius = '10px';
        progressContainer.style.overflow = 'hidden';
        progressContainer.style.border = '1px solid rgba(255, 0, 255, 0.5)';
        progressContainer.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.2)';
        
        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '0%';
        this.progressBar.style.height = '100%';
        this.progressBar.style.transition = 'width 0.5s ease-out';
        this.progressBar.style.borderRadius = '8px';
        this.progressBar.style.backgroundImage = 'linear-gradient(to right, #ff00ff, #00ffff)';
        this.progressBar.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.3)';
        
        // Create progress text
        this.progressText = document.createElement('div');
        this.progressText.textContent = '0%';
        this.progressText.style.color = '#f0e6d2';
        this.progressText.style.marginTop = '0.5rem';
        this.progressText.style.fontFamily = 'monospace';
        
        // Add decorative Vibeverse portal animation
        const vibeSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        vibeSVG.setAttribute('width', '100%');
        vibeSVG.setAttribute('height', '100%');
        vibeSVG.setAttribute('viewBox', '0 0 100 100');
        vibeSVG.setAttribute('preserveAspectRatio', 'none');
        vibeSVG.style.position = 'absolute';
        vibeSVG.style.top = '0';
        vibeSVG.style.left = '0';
        vibeSVG.style.pointerEvents = 'none';
        vibeSVG.style.zIndex = '-1';
        vibeSVG.innerHTML = `
            <defs>
                <radialGradient id="portal-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:0.3" />
                    <stop offset="70%" style="stop-color:#4b0082;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0" />
                </radialGradient>
                <linearGradient id="neon-grid" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:#ff00ff;stop-opacity:0.2" />
                </linearGradient>
            </defs>
            <!-- Portal/vortex effect -->
            <circle cx="50%" cy="50%" r="30%" stroke="rgba(255,0,255,0.3)" stroke-width="0.5" fill="url(#portal-gradient)">
                <animate attributeName="r" values="28%;32%;28%" dur="4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <!-- Inner portal rings -->
            <circle cx="50%" cy="50%" r="25%" stroke="rgba(0,255,255,0.3)" stroke-width="0.2" fill="none">
                <animate attributeName="r" values="23%;27%;23%" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="50%" cy="50%" r="20%" stroke="rgba(255,0,255,0.2)" stroke-width="0.15" fill="none">
                <animate attributeName="r" values="18%;22%;18%" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <!-- Cyberpunk/synthwave grid -->
            <path d="M0,20 L100,20 M0,40 L100,40 M0,60 L100,60 M0,80 L100,80" stroke="url(#neon-grid)" stroke-width="0.2">
                <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M20,0 L20,100 M40,0 L40,100 M60,0 L60,100 M80,0 L80,100" stroke="url(#neon-grid)" stroke-width="0.2">
                <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" />
            </path>
            <!-- Vibrational wave patterns -->
            <path d="M10,50 Q25,40 40,50 T70,50 T100,50" stroke="rgba(255,0,255,0.15)" stroke-width="0.3" fill="none">
                <animate attributeName="d" values="M10,50 Q25,40 40,50 T70,50 T100,50; M10,50 Q25,60 40,50 T70,50 T100,50; M10,50 Q25,40 40,50 T70,50 T100,50" dur="5s" repeatCount="indefinite" />
            </path>
            <path d="M10,60 Q25,50 40,60 T70,60 T100,60" stroke="rgba(0,255,255,0.15)" stroke-width="0.3" fill="none">
                <animate attributeName="d" values="M10,60 Q25,50 40,60 T70,60 T100,60; M10,60 Q25,70 40,60 T70,60 T100,60; M10,60 Q25,50 40,60 T70,60 T100,60" dur="5s" repeatCount="indefinite" />
            </path>
        `;

        // Add CSS keyframes for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
            
            @keyframes glow {
                0% { text-shadow: 0 0 10px rgba(255, 0, 255, 0.7), 0 0 20px rgba(255, 0, 255, 0.5); }
                50% { text-shadow: 0 0 15px rgba(255, 0, 255, 0.9), 0 0 30px rgba(255, 0, 255, 0.7); }
                100% { text-shadow: 0 0 10px rgba(255, 0, 255, 0.7), 0 0 20px rgba(255, 0, 255, 0.5); }
            }
            
            #loading-screen {
                animation: pulse 2s infinite ease-in-out;
            }
        `;
        document.head.appendChild(style);
        
        // Assemble the loading screen
        progressContainer.appendChild(this.progressBar);
        this.loadingContainer.appendChild(vibeSVG);
        this.loadingContainer.appendChild(title);
        this.loadingContainer.appendChild(this.loadingElement);
        this.loadingContainer.appendChild(this.loadingMessage);
        this.loadingContainer.appendChild(progressContainer);
        this.loadingContainer.appendChild(this.progressText);
        document.body.appendChild(this.loadingContainer);
        
        // Start rotating the alchemy symbols
        this.startSymbolRotation();
        this.updateLoadingMessage();
    }
    
    /**
     * Rotate through different alchemy symbols to create animation
     */
    startSymbolRotation() {
        this.symbolRotationInterval = setInterval(() => {
            this.currentSymbolIndex = (this.currentSymbolIndex + 1) % this.vibeSymbols.length;
            this.loadingElement.textContent = this.vibeSymbols[this.currentSymbolIndex];
        }, 800);
    }
    
    /**
     * Get a random loading message
     */
    getRandomLoadingMessage() {
        const index = Math.floor(Math.random() * this.loadingMessages.length);
        return this.loadingMessages[index];
    }
    
    /**
     * Update the loading message periodically
     */
    updateLoadingMessage() {
        setInterval(() => {
            this.loadingMessage.textContent = this.getRandomLoadingMessage();
        }, 3000);
    }
    
    /**
     * Update the progress bar
     * @param {number} percent - Loading progress percentage (0-100)
     */
    updateProgress(percent) {
        const clampedPercent = Math.min(100, Math.max(0, percent));
        this.progressBar.style.width = `${clampedPercent}%`;
        this.progressText.textContent = `${Math.round(clampedPercent)}%`;
    }
    
    /**
     * Hide the loading screen with a fade out animation
     * @param {Function} callback - Function to call after the screen is hidden
     */
    hide(callback) {
        this.loadingContainer.style.opacity = '0';
        
        // Clear intervals
        clearInterval(this.symbolRotationInterval);
        
        // Remove the loading screen after the animation completes
        setTimeout(() => {
            if (this.loadingContainer && this.loadingContainer.parentNode) {
                this.loadingContainer.parentNode.removeChild(this.loadingContainer);
            }
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 1000);
    }
}

// Export the LoadingScreen class
export { LoadingScreen };
