/**
 * loadingScreen.js
 * 
 * Provides a themed loading screen with progress indicators for the AI Alchemist's Lair.
 * This screen displays during the initial asset loading to ensure all resources are properly
 * loaded before the player enters the game.
 */

class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.loadingContainer = null;
        this.alchemySymbols = [
            '⚗️', '🔮', '✨', '🧪', '📜', '🧙‍♂️', '🌌', '💫'
        ];
        this.currentSymbolIndex = 0;
        this.symbolRotationInterval = null;
        this.loadingMessages = [
            "Brewing magical potions...",
            "Collecting arcane dust...",
            "Calibrating alchemy apparatus...",
            "Charging crystals...",
            "Summoning mystical energies...",
            "Arranging enchanted items...",
            "Stabilizing magical fields...",
            "Tuning the ethereal frequencies...",
            "Preparing the alchemist's workspace..."
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
        this.loadingContainer.style.backgroundColor = '#1a0536'; // Deep purple background
        this.loadingContainer.style.display = 'flex';
        this.loadingContainer.style.flexDirection = 'column';
        this.loadingContainer.style.justifyContent = 'center';
        this.loadingContainer.style.alignItems = 'center';
        this.loadingContainer.style.zIndex = '9999';
        this.loadingContainer.style.transition = 'opacity 1s ease-out';
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = "AI Alchemist's Lair";
        title.style.color = 'gold';
        title.style.fontFamily = '"Cinzel Decorative", serif, fantasy';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '1rem';
        title.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)';
        
        // Add spinning alchemy symbol
        this.loadingElement = document.createElement('div');
        this.loadingElement.textContent = this.alchemySymbols[0];
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
        progressContainer.style.border = '1px solid rgba(255, 215, 0, 0.5)';
        progressContainer.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.2)';
        
        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '0%';
        this.progressBar.style.height = '100%';
        this.progressBar.style.backgroundColor = 'rgba(255, 215, 0, 0.7)';
        this.progressBar.style.transition = 'width 0.5s ease-out';
        this.progressBar.style.backgroundImage = 'linear-gradient(to right, #4b0082, #9c27b0, #673ab7)';
        
        // Create progress text
        this.progressText = document.createElement('div');
        this.progressText.textContent = '0%';
        this.progressText.style.color = '#f0e6d2';
        this.progressText.style.marginTop = '0.5rem';
        this.progressText.style.fontFamily = 'monospace';
        
        // Add decorative alchemical circles
        const circlesSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        circlesSVG.setAttribute('width', '100%');
        circlesSVG.setAttribute('height', '100%');
        circlesSVG.style.position = 'absolute';
        circlesSVG.style.top = '0';
        circlesSVG.style.left = '0';
        circlesSVG.style.pointerEvents = 'none';
        circlesSVG.style.zIndex = '-1';
        circlesSVG.innerHTML = `
            <defs>
                <radialGradient id="bg-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style="stop-color:#4b0082;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0" />
                </radialGradient>
            </defs>
            <circle cx="50%" cy="50%" r="30%" stroke="rgba(255,215,0,0.1)" stroke-width="1" fill="url(#bg-gradient)" />
            <circle cx="50%" cy="50%" r="40%" stroke="rgba(255,215,0,0.05)" stroke-width="0.5" fill="none" />
            <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,215,0,0.03)" stroke-width="0.3" fill="none" />
            <path d="M30%,50% L70%,50% M50%,30% L50%,70% M35%,35% L65%,65% M35%,65% L65%,35%" stroke="rgba(255,215,0,0.1)" stroke-width="0.2" />
        `;

        // Add CSS keyframes for spinning animation
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
            
            #loading-screen {
                animation: pulse 2s infinite ease-in-out;
            }
        `;
        document.head.appendChild(style);
        
        // Assemble the loading screen
        progressContainer.appendChild(this.progressBar);
        this.loadingContainer.appendChild(circlesSVG);
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
            this.currentSymbolIndex = (this.currentSymbolIndex + 1) % this.alchemySymbols.length;
            this.loadingElement.textContent = this.alchemySymbols[this.currentSymbolIndex];
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
