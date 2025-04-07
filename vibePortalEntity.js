/**
 * VibePortalEntity.js - Animated portal to the VIBEVERSE
 * An interactive portal that animates and can transport the player
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug, info } from './utils.js';

export class VibePortalEntity extends Entity {
    /**
     * Create a new VIBEVERSE portal entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {Object} options - Additional options like color, size, etc.
     */
    constructor(x, y, z = 0, options = {}) {
        // Make portal slightly larger than standard entities
        const width = options.width || 2.0;
        const height = options.height || 2.0;
        super(x, y, width, height);
        
        // Set z position and height
        this.z = z;
        this.zHeight = 2.0; // Tall portal
        
        // Set static properties (non-moving decorative element)
        this.isStatic = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.collidable = true; // Allow collision detection for portal entry
        
        // Portal-specific properties
        this.portalColor = options.color || '#00ff00'; // Default green for exit portal
        this.portalType = options.type || 'exit'; // 'start' or 'exit'
        this.isActive = true; // Can be toggled
        this.targetUrl = options.targetUrl || 'https://portal.pieter.com';
        this.portalLabel = options.label || 'ENTER VIBEVERSE';
        
        // Animation properties
        this.animationTime = 0;
        this.rotationSpeed = 0.02;
        this.pulseSpeed = 0.03;
        this.particleSpeed = 0.05;
        this.portalRadius = 40; // Base size for drawing
        this.torusThickness = 8;
        this.innerRadius = this.portalRadius - this.torusThickness;
        
        // Particle system for portal effect
        this.particles = [];
        this.initParticles(200); // Create 200 particles
        
        // Portal interaction properties
        this.interactionDistance = options.interactionDistance || 3; // Distance for proximity detection
        this.isPlayerNearby = false;
        this.entryDetectionRange = options.entryDetectionRange || 1.5; // Distance to trigger portal entry
        
        // Player distance tracking
        this.playerDistance = Infinity;
        
        debug('VibePortalEntity: Created new portal at', { x, y, z });
    }
    
    /**
     * Initialize particle system for portal effect
     * @param {number} count - Number of particles to create
     */
    initParticles(count) {
        for (let i = 0; i < count; i++) {
            // Create particles in a ring around the portal
            const angle = Math.random() * Math.PI * 2;
            const radius = this.portalRadius + (Math.random() - 0.5) * 4;
            
            // Convert to cartesian coordinates
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * 4;
            
            // Create colors based on portal type
            let r = 0, g = 0, b = 0;
            if (this.portalType === 'start') {
                // Red color with slight variation for start portal
                r = 0.8 + Math.random() * 0.2;
                g = 0;
                b = 0;
            } else {
                // Green color with slight variation for exit portal
                r = 0;
                g = 0.8 + Math.random() * 0.2;
                b = 0;
            }
            
            // Add particle to array
            this.particles.push({
                x, y, z,
                initialAngle: angle,
                initialRadius: radius,
                color: { r, g, b },
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    /**
     * Update portal state - called each frame
     * @param {number} deltaTime - Time since last update
     * @param {Entity} player - Player entity for proximity detection
     */
    update(deltaTime, player) {
        // Skip physics updates for static portal
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
        
        // Update animation time
        this.animationTime += deltaTime * 0.001; // Convert to seconds
        
        // Update particle positions
        this.updateParticles(deltaTime);
        
        // Check if player is nearby
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track distance for label opacity
            this.playerDistance = distance;
            
            const wasNearby = this.isPlayerNearby;
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Player just entered interaction range
            if (!wasNearby && this.isPlayerNearby) {
                debug(`VibePortalEntity: Player entered interaction range (${distance.toFixed(2)} units)`);
                
                // Play high-pitched vortex/whoosh sound when player enters range
                this.playProximitySound();
            }
            
            // Player just left interaction range
            if (wasNearby && !this.isPlayerNearby) {
                debug(`VibePortalEntity: Player left interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Check if player is close enough to enter the portal
            if (this.isActive && distance <= this.entryDetectionRange) {
                this.enterPortal();
            }
        } else {
            // No player reference, assume far away
            this.playerDistance = Infinity;
            this.isPlayerNearby = false;
        }
    }
    
    /**
     * Update particle positions for animation
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateParticles(deltaTime) {
        // Update each particle position
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Apply oscillation effect based on sine wave
            p.y += this.particleSpeed * Math.sin(this.animationTime + i * 0.1) * deltaTime;
        }
    }
    
    /**
     * Handle portal entry
     */
    enterPortal() {
        debug('VibePortalEntity: Player entered portal!');
        
        // Don't trigger too frequently
        if (this._lastEntryTime && Date.now() - this._lastEntryTime < 2000) {
            return;
        }
        this._lastEntryTime = Date.now();
        
        // Create URL with parameters
        const params = new URLSearchParams();
        params.append('portal', 'true');
        
        // Add the current domain as the ref parameter for exit portals
        if (this.portalType === 'exit') {
            // Use the current domain + path as the ref parameter
            let refValue;
            
            // For GitHub Pages, we need to include the repository name
            if (window.location.hostname.includes('github.io')) {
                // Get the first part of the path which should be the repository name
                const repoName = window.location.pathname.split('/')[1] || '';
                refValue = window.location.hostname + (repoName ? '/' + repoName : '');
            } else {
                // For other sites, just use the hostname
                refValue = window.location.hostname || 'alchemistslair.local';
            }
            
            params.append('ref', refValue);
            debug(`VibePortalEntity: Adding ref parameter with value: ${refValue}`);
        }
        
        // Add additional parameters if needed
        if (window.selfUsername) {
            params.append('username', window.selfUsername);
        }
        
        // Build the full URL
        const paramString = params.toString();
        
        // Properly construct the URL by checking if it already has parameters
        let nextPage;
        if (this.targetUrl.includes('?')) {
            // If the URL already has parameters, append with &
            nextPage = this.targetUrl + '&' + paramString;
        } else {
            // Otherwise use ? to start parameters
            nextPage = this.targetUrl + (paramString ? '?' + paramString : '');
        }
        
        // Fix specific case for GitHub Pages
        if (this.targetUrl.includes('github.io')) {
            debug('VibePortalEntity: Detected GitHub Pages URL, ensuring correct parameter format');
            // Make sure we're using the right repository path structure
            if (!this.targetUrl.endsWith('/')) {
                nextPage = this.targetUrl + '/' + (paramString ? '?' + paramString : '');
            }
        }
        
        // Dispatch custom event for portal entry
        const portalEvent = new CustomEvent('portal-entry', {
            detail: {
                portalType: this.portalType,
                targetUrl: nextPage
            }
        });
        document.dispatchEvent(portalEvent);
        
        // Create visual effect for portal entry
        this.createPortalTransitionEffect();
        
        // For production, actually navigate to the URL
        setTimeout(() => {
            if (this.portalType === 'exit') {
                // Check if we're targeting a GitHub Pages URL and ensure proper formatting
                if (this.targetUrl.includes('github.io')) {
                    // For GitHub Pages, use the complete repository path in the URL
                    const fullUrl = 'https://alchemistART.github.io/AIalchemistsLAIR?portal=true&ref=' + 
                                   encodeURIComponent(window.location.hostname);
                    
                    debug(`VibePortalEntity: GitHub Pages destination detected, using URL: ${fullUrl}`);
                    this.showPortalMessage(`Traveling to AIalchemist's Lair...`);
                    window.location.href = fullUrl;
                } else {
                    // Standard URL handling for non-GitHub Pages targets
                    debug(`VibePortalEntity: Navigating to: ${nextPage}`);
                    window.location.href = nextPage;
                }
            } else if (this.portalType === 'start') {
                // Check for ref parameter in URL for start portal
                const urlParams = new URLSearchParams(window.location.search);
                const refUrl = urlParams.get('ref');
                
                if (refUrl) {
                    // Format the URL properly
                    let url = refUrl;
                    
                    // Special handling for GitHub Pages refs
                    if (url.includes('github.io')) {
                        // Check if it has the repository name
                        if (!url.includes('/AIalchemistsLAIR')) {
                            // Add the repository name if it's missing
                            url = url + '/AIalchemistsLAIR';
                            debug(`VibePortalEntity: Added missing repository name to GitHub Pages URL: ${url}`);
                        }
                    }
                    
                    // Add protocol if missing
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    
                    // Preserve query parameters except 'ref'
                    const currentParams = new URLSearchParams(window.location.search);
                    const newParams = new URLSearchParams();
                    
                    for (const [key, value] of currentParams) {
                        if (key !== 'ref') {
                            newParams.append(key, value);
                        }
                    }
                    
                    const paramString = newParams.toString();
                    const fullUrl = url + (paramString ? '?' + paramString : '');
                    
                    debug(`VibePortalEntity: Navigating to ref URL: ${fullUrl}`);
                    window.location.href = fullUrl;
                } else {
                    debug(`VibePortalEntity: No ref parameter found, using hardcoded fallback`);
                    
                    // DIRECT FALLBACK: Hardcoded list of known game URLs to return to
                    const gameUrls = [
                        'http://localhost:3000',  // Local development
                        'http://localhost:5500',  // Live Server
                        'https://alchemistART.github.io/AIalchemistsLAIR'  // Main game on GitHub Pages
                    ];
                    
                    // Try to determine the best fallback URL based on current environment
                    let fallbackUrl;
                    
                    if (window.location.hostname === 'localhost') {
                        // If we're on localhost, use localhost fallback
                        fallbackUrl = window.location.protocol + '//' + window.location.host;
                    } else if (window.location.hostname.includes('github.io')) {
                        // If we're on GitHub Pages, return to the main game repository
                        fallbackUrl = 'https://alchemistART.github.io/AIalchemistsLAIR';
                    } else {
                        // Otherwise use the GitHub Pages fallback
                        fallbackUrl = gameUrls[2];
                    }
                    
                    debug(`VibePortalEntity: Using hardcoded fallback URL: ${fallbackUrl}`);
                    this.showPortalMessage("Returning to main game...");
                    
                    // Use a short delay for the transition
                    setTimeout(() => {
                        window.location.href = fallbackUrl;
                    }, 1500);
                }
            }
        }, 1000); // Small delay for visual effect
    }
    
    /**
     * Create visual transition effect when entering portal
     */
    createPortalTransitionEffect() {
        // Create a fullscreen overlay for transition effect
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = this.portalType === 'start' ? 'rgba(255, 0, 0, 0)' : 'rgba(0, 255, 0, 0)';
        overlay.style.transition = 'background-color 1s ease-in-out';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        
        document.body.appendChild(overlay);
        
        // Trigger fade effect
        setTimeout(() => {
            overlay.style.backgroundColor = this.portalType === 'start' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
        }, 50);
    }
    
    /**
     * Show a message to the user about portal status
     * @param {string} message - Message to display
     */
    showPortalMessage(message) {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.position = 'fixed';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = this.portalColor;
        messageElement.style.padding = '20px';
        messageElement.style.borderRadius = '10px';
        messageElement.style.fontFamily = 'Arial, sans-serif';
        messageElement.style.fontSize = '18px';
        messageElement.style.textAlign = 'center';
        messageElement.style.zIndex = '10000';
        messageElement.style.boxShadow = `0 0 10px ${this.portalColor}`;
        
        // Add a slight glow effect
        messageElement.style.textShadow = `0 0 5px ${this.portalColor}`;
        
        document.body.appendChild(messageElement);
        
        // Remove the message after a delay
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.5s ease-in-out';
            
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 500);
        }, 3000);
    }
    
    /**
     * Draw the portal entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Skip drawing if not active
        if (!this.isActive) return;
        
        // Calculate adjusted position with proper grounding
        const groundingFactor = 0.7; // Adjust to make portal appear at right height
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position
        const drawY = adjustedScreenY - (this.z * 2);
        
        // Save the context state
        ctx.save();
        
        // Draw the rotating torus (outer ring)
        this.drawPortalRing(ctx, screenX, drawY);
        
        // Draw the inner surface with pulse effect
        this.drawPortalInner(ctx, screenX, drawY);
        
        // Draw particles
        this.drawParticles(ctx, screenX, drawY);
        
        // Draw portal label
        this.drawPortalLabel(ctx, screenX, drawY - this.portalRadius - 20);
        
        // Draw debug info
        if (window.DEBUG_MODE) {
            this.drawDebugInfo(ctx, screenX, drawY, width, height);
        }
        
        // Restore the context state
        ctx.restore();
    }
    
    /**
     * Draw the outer ring of the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawPortalRing(ctx, x, y) {
        // Calculate rotation for animation
        const rotation = this.animationTime * this.rotationSpeed;
        
        // Set style for the outer ring
        ctx.strokeStyle = this.portalColor;
        ctx.lineWidth = this.torusThickness;
        
        // Add glow effect
        ctx.shadowColor = this.portalColor;
        ctx.shadowBlur = 15;
        
        // Draw a circle with some rotation (simulating a torus in 2D)
        ctx.beginPath();
        
        // Apply a slight squish to simulate perspective
        const radiusX = this.portalRadius;
        const radiusY = this.portalRadius * 0.25; // Squish factor for isometric perspective
        
        // Ellipse drawing with animation
        ctx.ellipse(
            x, y,
            radiusX, radiusY,
            rotation, 0, Math.PI * 2
        );
        
        ctx.stroke();
    }
    
    /**
     * Draw the inner part of the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawPortalInner(ctx, x, y) {
        // Create pulsing effect
        const pulseScale = 0.9 + Math.sin(this.animationTime * this.pulseSpeed) * 0.1;
        
        // Set style for inner surface
        const colorRGB = this.hexToRgb(this.portalColor);
        ctx.fillStyle = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, 0.5)`;
        
        // Draw inner surface as an ellipse
        ctx.beginPath();
        
        // Apply a slight squish to simulate perspective
        const innerRadiusX = this.innerRadius * pulseScale;
        const innerRadiusY = innerRadiusX * 0.25; // Squish factor for isometric perspective
        
        ctx.ellipse(
            x, y,
            innerRadiusX, innerRadiusY,
            0, 0, Math.PI * 2
        );
        
        ctx.fill();
    }
    
    /**
     * Draw the particles around the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawParticles(ctx, x, y) {
        // Calculate particle opacity based on player distance
        // Full opacity when player is within 3 units, fades to 0.2 when 6 units away
        const particleFadeStartDistance = 3.0;   // Start fading at 3 grid units
        const particleFadeEndDistance = 6.0;     // Mostly faded at 6 grid units
        
        // Calculate opacity based on distance
        let baseOpacity = 0.7; // Base particle opacity
        if (this.playerDistance > particleFadeStartDistance) {
            // Linear interpolation to reduce opacity as distance increases
            // But maintain a minimum of 0.2 opacity for distant particles
            const fadeAmount = Math.min(1.0, 
                (this.playerDistance - particleFadeStartDistance) / 
                (particleFadeEndDistance - particleFadeStartDistance)
            );
            baseOpacity = 0.7 - (fadeAmount * 0.5); // Reduce to 0.2 at max distance
        }
        
        // Apply the squish factor for isometric view
        const squishFactor = 0.25;
        
        // Draw each particle
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Calculate particle position on the elliptical path
            const angle = p.initialAngle + this.animationTime * p.speed * 0.1;
            const radius = p.initialRadius;
            
            // Apply isometric squish
            const particleX = x + Math.cos(angle) * radius;
            const particleY = y + Math.sin(angle) * radius * squishFactor;
            
            // Calculate individual particle opacity (variation for visual interest)
            const particleOpacity = baseOpacity * (0.7 + Math.sin(this.animationTime + i * 0.3) * 0.3);
            
            // Draw with glow effect and adjusted opacity
            ctx.fillStyle = `rgba(${p.color.r * 255}, ${p.color.g * 255}, ${p.color.b * 255}, ${particleOpacity})`;
            ctx.shadowColor = `rgba(${p.color.r * 255}, ${p.color.g * 255}, ${p.color.b * 255}, ${particleOpacity * 0.8})`;
            ctx.shadowBlur = 5;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    /**
     * Draw the portal label
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawPortalLabel(ctx, x, y) {
        // Calculate label opacity based on player distance
        // Full opacity when player is within 3 units, fades to 0 when 6 units away
        const labelFadeStartDistance = 3.0;   // Start fading at 3 grid units
        const labelFadeEndDistance = 6.0;     // Completely faded at 6 grid units
        
        // Calculate opacity based on distance
        let opacity = 1.0;
        if (this.playerDistance > labelFadeStartDistance) {
            // Linear interpolation to reduce opacity as distance increases
            opacity = 1.0 - Math.min(1.0, 
                (this.playerDistance - labelFadeStartDistance) / 
                (labelFadeEndDistance - labelFadeStartDistance)
            );
        }
        
        // If opacity is effectively 0, skip drawing to save performance
        if (opacity < 0.01) return;
        
        // Set text style
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply opacity to both fill and shadow
        const portalColorRGB = this.hexToRgb(this.portalColor);
        const fillStyleWithOpacity = `rgba(${portalColorRGB.r}, ${portalColorRGB.g}, ${portalColorRGB.b}, ${opacity})`;
        const shadowColorWithOpacity = `rgba(${portalColorRGB.r}, ${portalColorRGB.g}, ${portalColorRGB.b}, ${opacity * 0.8})`;
        
        // Add glow effect with opacity
        ctx.shadowColor = shadowColorWithOpacity;
        ctx.shadowBlur = 10;
        
        // Draw text with opacity
        ctx.fillStyle = fillStyleWithOpacity;
        ctx.fillText(this.portalLabel, x, y);
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    /**
     * Draw debug information
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Entity width
     * @param {number} height - Entity height
     */
    drawDebugInfo(ctx, x, y, width, height) {
        // Draw collision box
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x - width / 2,
            y - height / 2,
            width,
            height
        );
        
        // Draw interaction radius
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, this.interactionDistance * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw Portal info
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.portalType}Portal(${this.x.toFixed(1)},${this.y.toFixed(1)})`, x, y - height / 2 - 10);
        
        // Interaction status
        const statusY = y + height / 2 + 15;
        ctx.fillStyle = this.isPlayerNearby ? 'lime' : 'red';
        ctx.fillText(this.isPlayerNearby ? 'IN RANGE' : 'OUT OF RANGE', x, statusY);
    }
    
    /**
     * Play a high-pitched vortex/whoosh sound when player approaches the portal
     */
    playProximitySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create noise buffer for the whoosh base
            const bufferSize = audioCtx.sampleRate * 1.3; // Slightly shorter for higher pitch feel (1.3 seconds)
            const noiseBuffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
            
            // Fill buffer with noise
            const leftChannel = noiseBuffer.getChannelData(0);
            const rightChannel = noiseBuffer.getChannelData(1);
            
            // Create noise with a specific envelope for whoosh effect
            for(let i = 0; i < bufferSize; i++) {
                // Position as a normalized value (0 to 1)
                const position = i / bufferSize;
                
                // Envelope shape - start low, build up, then fade - faster curve for higher pitch
                let envelope;
                if (position < 0.15) { // Faster initial build (0.15 vs 0.2)
                    // Initial build up
                    envelope = position * (1/0.15) * 0.3; // Ramp up to 0.3
                } else if (position < 0.35) { // Faster peak (0.35 vs 0.4)
                    // Continue rising
                    envelope = 0.3 + (position - 0.15) * (1/0.2) * 0.6; // Ramp up to 0.9
                } else if (position < 0.6) { // Faster descent (0.6 vs 0.7)
                    // Peak and begin descent
                    envelope = 0.9 - (position - 0.35) * (0.9 / 0.25) * 0.5; // Drop to 0.4
                } else {
                    // Tail off
                    envelope = 0.4 * (1 - (position - 0.6) / 0.4);
                }
                
                // Add some variation between channels - with higher frequency noise
                // Higher frequency noise by using more rapid variations
                const noiseFreq = Math.sin(position * 100) * 0.1; // Add higher frequency components
                leftChannel[i] = ((Math.random() * 2 - 1) + noiseFreq) * envelope;
                rightChannel[i] = ((Math.random() * 2 - 1) - noiseFreq) * envelope;
            }
            
            // Create noise source node
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Create a bandpass filter - HIGHER FREQUENCIES for vibeverse portal
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(400, audioCtx.currentTime); // Higher starting frequency (400 vs 100)
            bandpass.frequency.exponentialRampToValueAtTime(4000, audioCtx.currentTime + 0.4); // Higher peak (4000 vs 2000)
            bandpass.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.3); // Higher ending (800 vs 500)
            bandpass.Q.value = 1.8; // Narrower bandwidth for more distinctive sound
            
            // Create a highpass filter to remove rumble
            const highpass = audioCtx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 200; // Higher cutoff (200 vs 80) to emphasize higher frequencies
            
            // Create an LFO for wobble effect - faster for higher pitch feel
            const lfo = audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 1.2; // Faster modulation (1.2 vs 0.8)
            
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 150; // More intense modulation
            
            // Create master gain node for overall volume
            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.1, audioCtx.currentTime); // Start quiet
            masterGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.3); // Ramp up
            masterGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1.3); // Fade out
            
            // Add reverb/echo effect - shorter for higher pitch
            const convolver = audioCtx.createConvolver();
            const reverbLength = audioCtx.sampleRate * 0.8; // Shorter reverb (0.8 vs 1.0)
            const reverbBuffer = audioCtx.createBuffer(2, reverbLength, audioCtx.sampleRate);
            const reverbLeftChannel = reverbBuffer.getChannelData(0);
            const reverbRightChannel = reverbBuffer.getChannelData(1);
            
            // Create reverb impulse - faster decay for higher pitch
            for(let i = 0; i < reverbLength; i++) {
                const decay = Math.exp(-i / (audioCtx.sampleRate * 0.2)); // Faster decay (0.2 vs 0.3)
                reverbLeftChannel[i] = (Math.random() * 2 - 1) * decay;
                reverbRightChannel[i] = (Math.random() * 2 - 1) * decay;
            }
            
            convolver.buffer = reverbBuffer;
            
            // Connect LFO to bandpass frequency
            lfo.connect(lfoGain);
            lfoGain.connect(bandpass.frequency);
            
            // Connect main audio path
            noiseSource.connect(bandpass);
            bandpass.connect(highpass);
            highpass.connect(convolver);
            convolver.connect(masterGain);
            highpass.connect(masterGain); // Parallel dry signal
            masterGain.connect(audioCtx.destination);
            
            // Start sound
            noiseSource.start();
            lfo.start();
            
            // Add a subtle tonal element - HIGHER PITCHED for 'vortex' quality
            const toneOsc = audioCtx.createOscillator();
            toneOsc.type = 'sine';
            toneOsc.frequency.setValueAtTime(1200, audioCtx.currentTime); // Higher starting (1200 vs 600)
            toneOsc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 1.3); // Higher ending (300 vs 150)
            
            const toneGain = audioCtx.createGain();
            toneGain.gain.setValueAtTime(0, audioCtx.currentTime);
            toneGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.2); // Faster attack
            toneGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.3);
            
            toneOsc.connect(toneGain);
            toneGain.connect(masterGain);
            toneOsc.start();
            toneOsc.stop(audioCtx.currentTime + 1.3);
            
            // Add a high pitched shimmer for the vibeverse portal
            const shimmerOsc = audioCtx.createOscillator();
            shimmerOsc.type = 'triangle';
            shimmerOsc.frequency.setValueAtTime(2400, audioCtx.currentTime);
            shimmerOsc.frequency.exponentialRampToValueAtTime(4800, audioCtx.currentTime + 0.6);
            shimmerOsc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 1.3);
            
            const shimmerGain = audioCtx.createGain();
            shimmerGain.gain.setValueAtTime(0, audioCtx.currentTime);
            shimmerGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.2); // Very subtle
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.3);
            
            shimmerOsc.connect(shimmerGain);
            shimmerGain.connect(masterGain);
            shimmerOsc.start();
            shimmerOsc.stop(audioCtx.currentTime + 1.3);
            
            // Schedule cleanup
            setTimeout(() => {
                try {
                    lfo.stop();
                    noiseSource.stop();
                    audioCtx.close();
                } catch (err) {
                    console.warn('Error cleaning up vibeverse portal sound:', err);
                }
            }, 1300);
            
            debug('VibePortalEntity: Played high-pitched vortex sound');
        } catch (err) {
            console.error(`VibePortalEntity: Error playing proximity sound: ${err.message}`);
        }
    }
    
    /**
     * Helper method to convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} - RGB object {r,g,b}
     */
    hexToRgb(hex) {
        // Remove the hash if present
        hex = hex.replace(/^#/, '');
        
        // Parse the hex values
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        
        return { r, g, b };
    }
}
