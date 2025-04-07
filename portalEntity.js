/**
 * PortalEntity class
 * Represents an interactive portal that can teleport the player to an external URL
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { input } from './input.js';
import { debug } from './utils.js';

export class PortalEntity extends Entity {
    /**
     * Create a new portal entity
     * @param {number} x - X position in the grid
     * @param {number} y - Y position in the grid
     * @param {number} z - Z position in the grid
     * @param {Object} options - Portal options
     */
    constructor(x, y, z = 0, options = {}) {
        super(x, y, z);
        
        // Set entity properties
        this.type = 'portal';
        this.isStatic = true;
        this.collidable = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.zHeight = 1.0;
        
        // Portal-specific properties
        this.portalId = options.id || 'portal1';
        this.targetUrl = options.targetUrl || 'https://x.com/aialchemistart';
        this.glowColor = options.glowColor || '#8A2BE2'; // BlueViolet glow
        this.glowIntensity = 0.6; // Initial glow intensity (0-1)
        this.glowDirection = 1; // Direction of glow animation (1 = increasing, -1 = decreasing)
        this.glowSpeed = 0.03; // Speed of pulsing glow effect
        this.maxGlowIntensity = 1.0;
        this.minGlowIntensity = 0.3;
        this.interactionDistance = options.interactionDistance || 4.0; // 3 grid units
        
        // Interaction state
        this.isPlayerNearby = false;
        this.showPrompt = false;
        this.interactionEnabled = true;
        this.interactionPromptAlpha = 0; // For fade in/out effect
        this.wasEnterPressed = false;
        
        // Animation properties
        this.animationTime = 0;
        
        // Load portal image
        this.loadPortalImage();
    }
    
    /**
     * Load the portal image
     */
    loadPortalImage() {
        // Check if we already have this asset loaded
        if (assetLoader.assets[this.portalId]) {
            console.log(`PortalEntity: Portal image already loaded for ${this.portalId}`);
            return;
        }
        
        console.log(`PortalEntity: Loading portal image for ${this.portalId}`);
        
        // Create an image and set up loading
        const img = new Image();
        img.onload = () => {
            console.log(`PortalEntity: Successfully loaded portal image for ${this.portalId}`);
            assetLoader.assets[this.portalId] = img;
        };
        
        img.onerror = () => {
            console.error(`PortalEntity: Failed to load portal image for ${this.portalId}`);
            // Create a fallback canvas image
            this.createFallbackImage();
        };
        
        // Set the source path to the portal image
        const path = `assets/decor/Portal_1.png`;
        
        console.log(`PortalEntity: Setting image src to: ${path}`);
        img.src = path;
    }
    
    /**
     * Create a fallback canvas-based image for the portal
     */
    createFallbackImage() {
        console.log('PortalEntity: Creating fallback canvas image');
        
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a mystical portal
        
        // Portal base
        ctx.fillStyle = '#2E2E42';
        ctx.beginPath();
        ctx.arc(64, 64, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal glow
        const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 50);
        gradient.addColorStop(0, '#8A2BE2'); // BlueViolet center
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)'); // Transparent outer
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(64, 64, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal runes
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Draw an X in the center
        ctx.beginPath();
        ctx.moveTo(44, 44);
        ctx.lineTo(84, 84);
        ctx.moveTo(84, 44);
        ctx.lineTo(44, 84);
        ctx.stroke();
        
        // Convert the canvas to an image
        const img = new Image();
        img.src = canvas.toDataURL();
        
        // Store in asset loader
        assetLoader.assets[this.portalId] = img;
        
        console.log('PortalEntity: Fallback image created and stored');
    }
    
    /**
     * Update the portal entity
     * @param {number} deltaTime - Time since last update in ms
     * @param {Entity} player - Player entity for proximity detection
     */
    update(deltaTime, player) {
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
        
        // Update animation time
        this.animationTime += deltaTime * 0.001; // Convert to seconds
        
        // Check if player is nearby for interaction
        this.updatePlayerProximity(player);
        
        // Update glow effect
        this.updateGlowEffect(deltaTime);
        
        // Check for interaction (Enter key press)
        this.checkForInteraction();
        
        // Debug logging every 60 frames
        if (Math.round(this.animationTime * 10) % 60 === 0) {
            console.log(`Portal update: animTime=${this.animationTime.toFixed(2)}, glow=${this.glowIntensity.toFixed(2)}, isNearby=${this.isPlayerNearby}`);
        }
    }
    
    /**
     * Update player proximity status
     * @param {Entity} player - Player entity
     */
    updatePlayerProximity(player) {
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track previous state for transition logging
            const wasNearby = this.isPlayerNearby;
            
            // Update proximity state
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Log state changes
            if (!wasNearby && this.isPlayerNearby) {
                console.log(`PortalEntity: Player entered interaction range (${distance.toFixed(2)} units)`);
                
                // Play vortex/whoosh sound when player enters range
                this.playProximitySound();
            } else if (wasNearby && !this.isPlayerNearby) {
                console.log(`PortalEntity: Player left interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Handle interaction prompt fade
            if (this.isPlayerNearby) {
                // Fade in prompt
                this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                this.showPrompt = true;
            } else {
                // Fade out prompt
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
                if (this.interactionPromptAlpha <= 0) {
                    this.showPrompt = false;
                }
            }
        } else {
            // No player reference, assume not nearby
            this.isPlayerNearby = false;
            this.showPrompt = false;
            this.interactionPromptAlpha = 0;
        }
    }
    
    /**
     * Update glow intensity based on animation time and player proximity
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateGlowEffect(deltaTime) {
        // The TV and Jukebox don't use deltaTime for their glow animation
        // This ensures consistent animation speed regardless of frame rate
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        
        // Reverse direction when reaching min/max values
        if (this.glowIntensity > this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity < this.minGlowIntensity) {
            this.glowIntensity = this.minGlowIntensity;
            this.glowDirection = 1;
        }
        
        // Enhance glow when player is nearby
        this.proximityBoost = this.isPlayerNearby ? 1.5 : 1.0;
        
        // Debug logging occasionally
        if (Math.random() < 0.01) {
            console.log(`Portal glow: intensity=${this.glowIntensity.toFixed(2)}, direction=${this.glowDirection}, proximityBoost=${this.proximityBoost}`);
        }
    }
    
    /**
     * Check for user interaction with the portal
     */
    checkForInteraction() {
        // Only check for interaction if player is nearby and interaction is enabled
        if (this.isPlayerNearby && this.interactionEnabled) {
            // Use the enhanced input system with all possible Enter key detection methods
            const isEnterPressed = input.enterKeyPressed || 
                                  input.numpadEnterPressed || 
                                  input.keys['Enter'] || 
                                  input.keys['NumpadEnter'] || 
                                  input.isKeyPressed('Enter') || 
                                  input.isKeyPressed('NumpadEnter');
            
            // Specific Enter key press detection (not just held down)
            const isNewEnterPress = isEnterPressed && !this.wasEnterPressed;
            
            // Aggressive logging to debug the issue
            console.log(`Portal interaction check:`, {
                isPlayerNearby: this.isPlayerNearby,
                isEnterPressed: isEnterPressed,
                wasEnterPressed: this.wasEnterPressed,
                isNewEnterPress: isNewEnterPress,
                enterFlag: input.enterKeyPressed,
                numpadEnterFlag: input.numpadEnterPressed,
                enterKey: input.keys['Enter'],
                numpadEnterKey: input.keys['NumpadEnter'],
                time: new Date().toISOString(),
                position: `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
            });
            
            // Only detect a new press (not holding)
            if (isNewEnterPress) {
                console.log('PortalEntity: NEW Enter key press detected, navigating to URL!');
                // Force this to run async to avoid any race conditions
                setTimeout(() => this.interact(), 50);
            }
            
            // Update previous state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Handle portal interaction (navigate to URL)
     */
    interact() {
        if (!this.interactionEnabled) return;
        
        console.log(`PortalEntity: Navigating to ${this.targetUrl}`);
        
        // Create a transition effect before opening URL
        this.createTransitionEffect();
        
        // Open URL in a new tab
        window.open(this.targetUrl, '_blank');
    }
    
    /**
     * Create a visual transition effect when interacting with the portal
     */
    createTransitionEffect() {
        // Create and style the overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = this.glowColor;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Animate the transition
        setTimeout(() => {
            overlay.style.opacity = '0.5';
            overlay.style.transition = 'opacity 0.2s ease-in-out';
            
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
            }, 200);
        }, 50);
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
        // Calculate adjusted position with proper grounding
        const groundingFactor = 1.8; // Adjust to make portal appear at right height
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position
        const drawY = adjustedScreenY - (this.z * 2);
        
        // Debug log drawing occasionally
        if (Math.random() < 0.005) {
            console.log(`Portal draw: screenX=${screenX}, screenY=${screenY}, glow=${this.glowIntensity.toFixed(2)}`);
            console.log(`Portal image loaded: ${!!assetLoader.assets[this.portalId]}`);
        }
        
        // Save the current context state
        ctx.save();
        
        // Check if portal image is loaded
        if (assetLoader.assets[this.portalId]) {
            // Calculate scale factor to fit in the desired width/height
            const img = assetLoader.assets[this.portalId];
            const scale = Math.min(width * 14 / img.width, height * 14 / img.height);
            
            // Calculate centered position
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const drawX = screenX - drawWidth / 2;
            
            // Apply glow effect with shadow
            if (this.glowIntensity > 0.1) {
                // Set glow color
                ctx.shadowColor = this.glowColor;
                // Apply proximity boost to make glow more intense when player is nearby
                const boostFactor = this.proximityBoost || 1.0;
                ctx.shadowBlur = (15 + (this.glowIntensity * 15)) * boostFactor;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            
            // Draw the portal image WITH the shadow effect applied
            ctx.drawImage(img, drawX, drawY - drawHeight, drawWidth, drawHeight);
        } else {
            // Fallback rendering if image isn't loaded
            ctx.fillStyle = '#8A2BE2'; // BlueViolet
            
            // Draw a portal-like shape
            const portalWidth = width * 0.8;
            const portalHeight = height * 1.5;
            const portalX = screenX - portalWidth / 2;
            const portalY = drawY - portalHeight;
            
            // Apply glow to the fallback portal
            if (this.glowIntensity > 0.1) {
                ctx.shadowColor = this.glowColor;
                // Apply same proximity boost as with the image
                const boostFactor = this.proximityBoost || 1.0;
                ctx.shadowBlur = (15 + (this.glowIntensity * 15)) * boostFactor;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            
            // Draw portal base shape
            ctx.beginPath();
            ctx.arc(screenX, drawY - portalHeight / 2, portalWidth / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw portal "X" in white
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX - 15, drawY - portalHeight / 2 - 15);
            ctx.lineTo(screenX + 15, drawY - portalHeight / 2 + 15);
            ctx.moveTo(screenX + 15, drawY - portalHeight / 2 - 15);
            ctx.lineTo(screenX - 15, drawY - portalHeight / 2 + 15);
            ctx.stroke();
        }
        
        // Draw interaction prompt if player is nearby
        if (this.interactionPromptAlpha > 0) {
            this.drawInteractionPrompt(ctx, screenX, drawY - height * -1);
        }
        
        // Restore context state
        ctx.restore();
        
        // Draw debug visuals if enabled
        if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.showEntityInfo) {
            this.drawDebugInfo(ctx, screenX, adjustedScreenY);
        }
    }
    
    /**
     * Draw interaction prompt above the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for the prompt
     * @param {number} y - Y position for the prompt
     */
    drawInteractionPrompt(ctx, x, y) {
        ctx.save();
        
        // Create dimensions for prompt window
        const padding = 48;
        const text = 'Visit AI Alchemist on X';
        const textWidth = ctx.measureText(text).width;
        const promptWidth = textWidth + (padding * 2);
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
        gradient.addColorStop(0, `rgba(40, 10, 60, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(0.5, `rgba(80, 20, 120, ${this.interactionPromptAlpha * 0.9})`);
        gradient.addColorStop(1, `rgba(40, 10, 60, ${this.interactionPromptAlpha * 0.9})`);
        
        // Draw background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
        
        // Draw border with glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 8 * this.glowIntensity;
        ctx.strokeStyle = `rgba(138, 43, 226, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);
        ctx.shadowBlur = 0;
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(138, 43, 226, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Play a lower-pitched vortex/whoosh sound when player approaches the portal
     */
    playProximitySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create noise buffer for the whoosh base - longer for lower pitch feel
            const bufferSize = audioCtx.sampleRate * 1.8; // 1.8 seconds of sound (longer than original 1.5)
            const noiseBuffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
            
            // Fill buffer with noise
            const leftChannel = noiseBuffer.getChannelData(0);
            const rightChannel = noiseBuffer.getChannelData(1);
            
            // Create noise with a specific envelope for whoosh effect
            for(let i = 0; i < bufferSize; i++) {
                // Position as a normalized value (0 to 1)
                const position = i / bufferSize;
                
                // Envelope shape - start low, build up, then fade
                // This creates the classic 'whoosh' shape
                let envelope;
                if (position < 0.2) {
                    // Initial build up
                    envelope = position * 5 * 0.2; // Ramp up to 0.2
                } else if (position < 0.4) {
                    // Continue rising
                    envelope = 0.2 + (position - 0.2) * 5 * 0.6; // Ramp up to 0.8
                } else if (position < 0.7) {
                    // Peak and begin descent
                    envelope = 0.8 - (position - 0.4) * (0.8 / 0.3) * 0.5; // Drop to 0.4
                } else {
                    // Tail off
                    envelope = 0.4 * (1 - (position - 0.7) / 0.3);
                }
                
                // Add some variation between channels
                leftChannel[i] = (Math.random() * 2 - 1) * envelope;
                rightChannel[i] = (Math.random() * 2 - 1) * envelope;
            }
            
            // Create noise source node
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // Create a bandpass filter for the 'whoosh' sound - LOWER frequencies for return portal
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(60, audioCtx.currentTime); // Lower starting frequency (60 vs 100)
            bandpass.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.8); // Lower peak (1200 vs 2000) and slower sweep
            bandpass.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 1.8); // Lower ending (300 vs 500)
            bandpass.Q.value = 1.3; // Wider bandwidth for more rumble
            
            // Create a lowpass filter to emphasize deeper tones instead of a highpass
            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 800; // Only allow lower frequencies through
            
            // Create an LFO for wobble effect - slower for lower pitch feel
            const lfo = audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.5; // Slower modulation (0.5 vs 0.8)
            
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 120; // Stronger modulation for heavier effect
            
            // Create master gain node for overall volume - slower attack/release for lower pitch
            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Start quieter
            masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.6); // Slower ramp up, louder peak
            masterGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1.8); // Slower fade out
            
            // Add reverb/echo effect - longer for lower pitch
            const convolver = audioCtx.createConvolver();
            const reverbLength = audioCtx.sampleRate * 1.5; // Longer reverb (1.5 vs 1.0)
            const reverbBuffer = audioCtx.createBuffer(2, reverbLength, audioCtx.sampleRate);
            const reverbLeftChannel = reverbBuffer.getChannelData(0);
            const reverbRightChannel = reverbBuffer.getChannelData(1);
            
            // Create reverb impulse - slower decay for lower pitch
            for(let i = 0; i < reverbLength; i++) {
                const decay = Math.exp(-i / (audioCtx.sampleRate * 0.5)); // Slower decay (0.5 vs 0.3)
                // Add subtle low frequency oscillation to reverb
                const lfo = Math.sin(i / (audioCtx.sampleRate * 0.3)) * 0.1;
                reverbLeftChannel[i] = ((Math.random() * 2 - 1) + lfo) * decay;
                reverbRightChannel[i] = ((Math.random() * 2 - 1) - lfo) * decay;
            }
            
            convolver.buffer = reverbBuffer;
            
            // Connect LFO to bandpass frequency
            lfo.connect(lfoGain);
            lfoGain.connect(bandpass.frequency);
            
            // Connect main audio path
            noiseSource.connect(bandpass);
            bandpass.connect(lowpass); // Using lowpass instead of highpass for lower tone
            lowpass.connect(convolver);
            convolver.connect(masterGain);
            lowpass.connect(masterGain); // Parallel dry signal
            masterGain.connect(audioCtx.destination);
            
            // Start sound
            noiseSource.start();
            lfo.start();
            
            // Add a deeper tonal element for the 'vortex' quality - lower pitched
            const toneOsc = audioCtx.createOscillator();
            toneOsc.type = 'sine';
            toneOsc.frequency.setValueAtTime(300, audioCtx.currentTime); // Lower starting (300 vs 600)
            toneOsc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 1.8); // Lower ending (80 vs 150)
            
            const toneGain = audioCtx.createGain();
            toneGain.gain.setValueAtTime(0, audioCtx.currentTime);
            toneGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.4); // Slower attack, stronger presence
            toneGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
            
            toneOsc.connect(toneGain);
            toneGain.connect(masterGain);
            toneOsc.start();
            toneOsc.stop(audioCtx.currentTime + 1.8);
            
            // Add a low rumble oscillator for the return portal
            const rumbleOsc = audioCtx.createOscillator();
            rumbleOsc.type = 'triangle';
            rumbleOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
            rumbleOsc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.8);
            rumbleOsc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1.8);
            
            const rumbleGain = audioCtx.createGain();
            rumbleGain.gain.setValueAtTime(0, audioCtx.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.5); // Subtle but noticeable
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
            
            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(masterGain);
            rumbleOsc.start();
            rumbleOsc.stop(audioCtx.currentTime + 1.8);
            
            // Schedule cleanup - longer for lower-pitched sound
            setTimeout(() => {
                try {
                    lfo.stop();
                    noiseSource.stop();
                    audioCtx.close();
                } catch (err) {
                    console.warn('Error cleaning up portal sound:', err);
                }
            }, 1800); // 1.8 seconds instead of 1.5
            
            debug('PortalEntity: Played lower-pitched vortex/whoosh proximity sound');
        } catch (err) {
            console.error(`PortalEntity: Error playing proximity sound: ${err.message}`);
        }
    }
    
    /**
     * Draw debug information for the portal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for debug info
     * @param {number} y - Y position for debug info
     */
    drawDebugInfo(ctx, x, y) {
        ctx.save();
        
        // Draw collision box
        ctx.strokeStyle = this.isPlayerNearby ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - this.width / 2, y - this.height / 2, this.width, this.height);
        
        // Draw interaction radius
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, this.interactionDistance * 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw entity info
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Portal(${this.x.toFixed(1)},${this.y.toFixed(1)})`, x, y - this.height);
        
        // Draw interaction status
        ctx.fillStyle = this.isPlayerNearby ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        ctx.fillText(this.isPlayerNearby ? 'IN RANGE' : 'OUT OF RANGE', x, y + this.height);
        
        ctx.restore();
    }
}
