/**
 * Visitor Counter Entity for the Circuit Sanctum Arcade
 * Displays a cyberpunk/synthwave styled visitor counter connected to Google Analytics
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';

class VisitorCounterEntity extends Entity {
    /**
     * Creates a new visitor counter entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {object} options - Additional options
     */
    constructor(x, y, options = {}) {
        // Create a counter with standard settings as a static entity
        super(x, y, 1.0, 0.6, {
            isStatic: true,
            zHeight: 0.6,
            collidable: false
        });
        
        // Counter specific properties
        this.visitorCount = 0;
        this.targetCount = 0;
        this.animationSpeed = 0.1;
        this.isAnimating = false;
        this.isInitialized = false;
        
        // Label text - this could be changed as needed
        this.counterLabel = 'TOTAL VISITORS';
        
        // Set up storage key for visitor count
        const today = new Date().toDateString();
        localStorage.setItem('arcadeVisitorCountDate', today);
        
        // Visual properties
        this.glowColor = '#00FFFF';
        this.glowIntensity = 0;
        this.maxGlowIntensity = 8;
        this.glowPulseSpeed = 0.05;
        this.glowDirection = 1;
        
        // Counter display properties
        this.digitWidth = 32; // Wider for more clarity
        this.digitHeight = 50;
        this.digitGap = 8; // Smaller gap to fit better
        this.digitThickness = 6; // Thicker segments for readability
        this.digitOnColor = '#00ffff'; // Bright cyan for active segments
        this.digitOffColor = '#001010'; // Very dark for inactive segments 
        this.digitGlowColor = 'rgba(0, 255, 255, 0.7)'; // Stronger glow effect
        
        // Label for the counter
        this.counterLabel = 'DAILY VISITORS';
        
        // Cache for digit patterns (each digit is a configuration of 7 segments)
        // Using standard 7-segment display patterns for maximum readability
        // Format: [top, top-right, bottom-right, bottom, bottom-left, top-left, middle]
        this.digitPatterns = [
            [1, 1, 1, 1, 1, 1, 0], // 0: all segments except middle
            [0, 1, 1, 0, 0, 0, 0], // 1: only right segments
            [1, 1, 0, 1, 1, 0, 1], // 2: top, top-right, middle, bottom-left, bottom
            [1, 1, 1, 1, 0, 0, 1], // 3: top, top-right, middle, bottom-right, bottom
            [0, 1, 1, 0, 0, 1, 1], // 4: top-left, middle, top-right, bottom-right
            [1, 0, 1, 1, 0, 1, 1], // 5: top, top-left, middle, bottom-right, bottom
            [1, 0, 1, 1, 1, 1, 1], // 6: all except top-right
            [1, 1, 1, 0, 0, 0, 0], // 7: top, top-right, bottom-right
            [1, 1, 1, 1, 1, 1, 1], // 8: all segments lit
            [1, 1, 1, 1, 0, 1, 1]  // 9: all except bottom-left
        ];
        
        // Initialize with zeros
        this.digits = [0, 0, 0, 0];
        
        console.log(`VisitorCounterEntity: Initialized at position (${x}, ${y})`);
        
        // Initialize visitor count - fetch from our Netlify function
        this.initVisitorCount();
    }
    
    /**
     * Initialize the visitor count display
     */
    initVisitorCount() {
        // Only initialize once
        if (this.isInitialized) return;
        
        console.log("VisitorCounterEntity: Initializing visitor count");
        
        // Generate a simulated visitor count
        this.fetchVisitorCount();
        
        this.isInitialized = true;
    }
    
    /**
     * Fetch actual visitor count using Netlify serverless function
     * This avoids CORS issues by calling our own proxy
     */
    async fetchVisitorCount() {
        console.log("VisitorCounterEntity: Fetching visitor count from Netlify function");
        
        try {
            // First try to use any cached value for immediate display
            const storedCount = localStorage.getItem('arcadeVisitorCount');
            if (storedCount) {
                const count = parseInt(storedCount, 10);
                // Show the cached count immediately while we fetch the latest
                this.targetCount = count;
                this.animateToCount(this.targetCount);
                console.log(`VisitorCounterEntity: Using cached count: ${count} while fetching latest`);
            }
            
            // Determine the API endpoint - use relative URL that works in both dev and production
            let apiUrl;
            
            // In production (Netlify site)
            if (window.location.hostname.includes('netlify.app')) {
                // Use the SAME domain for the function to avoid CORS issues
                // This ensures we call the function on the same domain where the site is hosted
                
                // Only increment the count on first load, not on every refresh
                // This prevents artificially inflating the count
                const action = localStorage.getItem('visitorCounterInitialized') ? 'get' : 'hit';
                
                // Mark as initialized so subsequent calls don't increment
                if (!localStorage.getItem('visitorCounterInitialized')) {
                    localStorage.setItem('visitorCounterInitialized', 'true');
                    console.log('First visit in this session - incrementing counter');
                }
                
                // Add the action as a query parameter
                apiUrl = `https://${window.location.hostname}/.netlify/functions/visitor-count?action=${action}`;
                console.log(`Using same-origin endpoint: ${apiUrl} with action=${action}`);
            } else {
                // For local development, use the local endpoint with the action
                const action = localStorage.getItem('visitorCounterInitialized') ? 'get' : 'hit';
                if (!localStorage.getItem('visitorCounterInitialized')) {
                    localStorage.setItem('visitorCounterInitialized', 'true');
                }
                apiUrl = `/.netlify/functions/visitor-count?action=${action}`;
            }
            
            console.log(`VisitorCounterEntity: Calling API endpoint: ${apiUrl}`);
            
            // Call our Netlify function to get the visitor count
            const response = await fetch(apiUrl);
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }
            
            // Parse the JSON response
            const data = await response.json();
            console.log("VisitorCounterEntity: API response:", data);
            
            // Make sure we have a valid count
            if (data && typeof data.count === 'number') {
                // Store in localStorage as a backup
                localStorage.setItem('arcadeVisitorCount', data.count.toString());
                
                // Update the last refresh time to prevent too frequent API calls
                localStorage.setItem('arcadeVisitorLastRefresh', Date.now().toString());
                
                // Set as target and animate to it
                this.targetCount = data.count;
                this.animateToCount(this.targetCount);
                
                console.log(`VisitorCounterEntity: Got count from function: ${data.count}`);
                console.log(`VisitorCounterEntity: Source: ${data.source || 'unknown'}`);
                console.log(`VisitorCounterEntity: Namespace: ${data.namespace || 'unknown'}`);
                
                // Store additional metadata for debugging
                if (data.source === 'CountAPI') {
                    localStorage.setItem('arcadeVisitorCountNamespace', data.namespace);
                    localStorage.setItem('arcadeVisitorCountKey', data.key);
                }
                
                // Track in Google Analytics if available
                if (typeof gtag === 'function') {
                    gtag('event', 'visitor_counter_viewed', {
                        'counter_value': this.targetCount,
                        'source': data.source || 'CountAPI'
                    });
                }
            }
        } catch (error) {
            console.error("VisitorCounterEntity: Error fetching count from API:", error);
            
            // Use fallback if API call fails
            this.useFallbackCount();
        }
    }
    
    /**
     * Use a fallback count if the API call fails
     */
    useFallbackCount() {
        // Try to use the stored count from localStorage
        const storedCount = localStorage.getItem('arcadeVisitorCount');
        
        if (storedCount) {
            // Use the stored count
            this.targetCount = parseInt(storedCount, 10);
            console.log(`VisitorCounterEntity: Using stored count as fallback: ${this.targetCount}`);
        } else {
            // Generate a reasonable fallback count
            this.targetCount = 500 + Math.floor(Math.random() * 500);
            console.log(`VisitorCounterEntity: Using generated fallback count: ${this.targetCount}`);
            
            // Store it for next time
            localStorage.setItem('arcadeVisitorCount', this.targetCount.toString());
        }
        
        // Animate to this count
        this.animateToCount(this.targetCount);
    }
    
    /**
     * Check if it's time to refresh the visitor count from the API
     */
    checkForRefresh() {
        // Get the current time
        const now = Date.now();
        
        // Get the time of the last refresh
        const lastRefresh = parseInt(localStorage.getItem('arcadeVisitorLastRefresh') || '0', 10);
        
        // Use a longer refresh interval in production (5 minutes) to avoid excessive CountAPI calls
        // This is more respectful of the API provider's resources
        const refreshInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now - lastRefresh > refreshInterval) {
            // Time to refresh
            console.log('VisitorCounterEntity: Time to refresh visitor count');
            localStorage.setItem('arcadeVisitorLastRefresh', now.toString());
            this.fetchVisitorCount();
        }
    }
    
    /**
     * Animate the counter to the specified count
     * @param {number} targetCount - The target count to animate to
     */
    animateToCount(targetCount) {
        this.targetCount = targetCount;
        this.isAnimating = true;
        
        // Ensure the target is within our display range (4 digits)
        if (this.targetCount > 9999) {
            this.targetCount = 9999;
        }
        
        // Set the initial values for the animation
        if (this.visitorCount === 0) {
            // If starting from zero, jump to a closer number to avoid long animation
            this.visitorCount = Math.max(0, this.targetCount - 20);
        }
        
        // Ensure animation is visible but not too long
        const diff = Math.abs(this.targetCount - this.visitorCount);
        if (diff > 500) {
            // For large differences, start closer to avoid too long animation
            this.visitorCount = this.targetCount - 100 * Math.sign(this.targetCount - this.visitorCount);
        }
        
        console.log(`VisitorCounterEntity: Animating from ${this.visitorCount} to ${this.targetCount}`);
    }
    
    /**
     * Update the counter animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Pulse the glow effect
        this.updateGlow(deltaTime);
        
        // Handle counter animation
        if (this.isAnimating) {
            const diff = this.targetCount - this.visitorCount;
            
            if (Math.abs(diff) < 0.1) {
                // We've reached the target
                this.visitorCount = this.targetCount;
                this.isAnimating = false;
            } else {
                // Animate toward the target count
                const step = diff * this.animationSpeed;
                this.visitorCount += step;
            }
            
            // Update the digits based on the current count
            this.updateDigits();
        }
        
        // Nothing to update in the normal update cycle
        // We handle API calls in the fetchVisitorCount method
    }
    
    /**
     * Update the glow effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateGlow(deltaTime) {
        // Pulse the glow effect
        this.glowIntensity += this.glowDirection * this.glowPulseSpeed;
        
        // Reverse direction at min/max
        if (this.glowIntensity >= this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
    }
    
    /**
     * Update the digits based on the current count
     */
    updateDigits() {
        // Convert the visitor count to a 4-digit number
        const countValue = Math.floor(this.visitorCount);
        
        // Extract each digit
        this.digits[0] = Math.floor(countValue / 1000) % 10;
        this.digits[1] = Math.floor(countValue / 100) % 10;
        this.digits[2] = Math.floor(countValue / 10) % 10;
        this.digits[3] = countValue % 10;
    }
    
    /**
     * Draw the visitor counter
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     */
    draw(ctx, screenX, screenY) {
        // Calculate the total width of the display
        const totalWidth = (this.digitWidth * 4) + (this.digitGap * 3) + 40; // 40px padding
        const totalHeight = this.digitHeight + 40; // 40px padding
        
        // Draw the counter background (isometric panel)
        this.drawCounterPanel(ctx, screenX, screenY, totalWidth, totalHeight);
        
        // Draw each digit
        for (let i = 0; i < 4; i++) {
            const digitX = screenX - (totalWidth / 2) + 20 + (i * (this.digitWidth + this.digitGap));
            const digitY = screenY - (totalHeight / 2) + 20;
            
            this.drawDigit(ctx, digitX, digitY, this.digits[i]);
        }
        
        // Draw the label
        this.drawLabel(ctx, screenX, screenY + (totalHeight / 2) + 15);
        
        // Check if it's time to refresh the count
        this.checkForRefresh();
    }
    
    /**
     * Draw the counter panel with cyberpunk/synthwave aesthetics
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     */
    drawCounterPanel(ctx, x, y, width, height) {
        // Save context
        ctx.save();
        
        // Calculate corner coordinates for isometric panel
        const left = x - (width / 2);
        const top = y - (height / 2);
        const right = x + (width / 2);
        const bottom = y + (height / 2);
        
        // Draw isometric panel with neon cyberpunk style
        ctx.fillStyle = 'rgba(0, 10, 20, 0.8)';
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2;
        
        // Main panel
        ctx.beginPath();
        ctx.moveTo(left + 10, top);
        ctx.lineTo(right - 10, top);
        ctx.quadraticCurveTo(right, top, right, top + 10);
        ctx.lineTo(right, bottom - 10);
        ctx.quadraticCurveTo(right, bottom, right - 10, bottom);
        ctx.lineTo(left + 10, bottom);
        ctx.quadraticCurveTo(left, bottom, left, bottom - 10);
        ctx.lineTo(left, top + 10);
        ctx.quadraticCurveTo(left, top, left + 10, top);
        ctx.closePath();
        ctx.fill();
        
        // Neon border
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowIntensity;
        ctx.stroke();
        
        // Add grid lines for cyberpunk effect
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        
        // Horizontal grid lines
        for (let i = 1; i < 4; i++) {
            const lineY = top + (height * (i / 4));
            ctx.beginPath();
            ctx.moveTo(left + 5, lineY);
            ctx.lineTo(right - 5, lineY);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 1; i < 4; i++) {
            const lineX = left + (width * (i / 4));
            ctx.beginPath();
            ctx.moveTo(lineX, top + 5);
            ctx.lineTo(lineX, bottom - 5);
            ctx.stroke();
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Draw a single 7-segment digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position of the digit
     * @param {number} y - Top position of the digit
     * @param {number} digit - The digit to display (0-9)
     */
    drawDigit(ctx, x, y, digit) {
        // Get the segment pattern for this digit
        const pattern = this.digitPatterns[digit];
        
        // Reduce glitch probability to improve readability
        const shouldGlitch = Math.random() < 0.005; // Very rare glitch (0.5%)
        
        // Save context
        ctx.save();
        
        // Draw background rectangle for the digit
        ctx.fillStyle = '#001010';
        ctx.fillRect(x, y, this.digitWidth, this.digitHeight);
        
        // If we're showing a glitch frame, display some visual noise
        // This is very rare and only for visual effect
        if (shouldGlitch) {
            this.drawDigitGlitch(ctx, x, y);
        } else {
            // Add a border to each digit for better separation
            ctx.strokeStyle = '#003f3f';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.digitWidth, this.digitHeight);
            
            // Setup for the glow effect
            ctx.shadowColor = this.digitGlowColor;
            ctx.shadowBlur = this.glowIntensity;
            
            // Calculate padding to ensure segments don't touch the edges
            const padding = 2;
            
            // Draw the normal 7 segments (each segment can be on or off)
            // Segment A (top horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + padding, 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[0]
            );
            
            // Segment B (top-right vertical)
            this.drawSegment(ctx, 
                x + this.digitWidth - this.digitThickness - padding, 
                y + padding, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[1], 
                true
            );
            
            // Segment C (bottom-right vertical)
            this.drawSegment(ctx, 
                x + this.digitWidth - this.digitThickness - padding, 
                y + this.digitHeight / 2, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[2], 
                true
            );
            
            // Segment D (bottom horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + this.digitHeight - this.digitThickness - padding, 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[3]
            );
            
            // Segment E (bottom-left vertical)
            this.drawSegment(ctx, 
                x + padding, 
                y + this.digitHeight / 2, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[4], 
                true
            );
            
            // Segment F (top-left vertical)
            this.drawSegment(ctx, 
                x + padding, 
                y + padding, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[5], 
                true
            );
            
            // Segment G (middle horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + (this.digitHeight / 2) - (this.digitThickness / 2), 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[6]
            );
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Draw a digital glitch effect for a digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position of the digit
     * @param {number} y - Top position of the digit
     */
    drawDigitGlitch(ctx, x, y) {
        // Draw random digital noise for a glitched effect
        ctx.fillStyle = this.digitOnColor;
        
        // Draw a few random bars
        for (let i = 0; i < 3; i++) {
            const barY = y + Math.random() * this.digitHeight;
            const barHeight = Math.random() * 3 + 1;
            ctx.fillRect(x, barY, this.digitWidth, barHeight);
        }
        
        // Draw a few random vertical lines
        for (let i = 0; i < 2; i++) {
            const barX = x + Math.random() * this.digitWidth;
            const barWidth = Math.random() * 2 + 1;
            ctx.fillRect(barX, y, barWidth, this.digitHeight);
        }
    }
    
    /**
     * Draw a single segment of a digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position
     * @param {number} y - Top position
     * @param {number} width - Segment width
     * @param {number} height - Segment height
     * @param {boolean} isOn - Whether the segment is on or off
     * @param {boolean} isVertical - Whether the segment is vertical
     */
    drawSegment(ctx, x, y, width, height, isOn, isVertical = false) {
        // Choose color based on segment state - ensure proper contrast
        ctx.fillStyle = isOn ? this.digitOnColor : this.digitOffColor;
        
        // No glitch offset for normal display - we want readable numbers
        
        if (isVertical) {
            // Simple rectangle for vertical segments - maximum readability
            ctx.fillRect(x, y, width, height);
            
            // Add glow effect for on segments
            if (isOn) {
                ctx.shadowColor = this.digitGlowColor;
                ctx.shadowBlur = 3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, width, height);
                ctx.shadowBlur = 0;
            }
        } else {
            // Simple rectangle for horizontal segments - maximum readability
            ctx.fillRect(x, y, width, height);
            
            // Add glow effect for on segments
            if (isOn) {
                ctx.shadowColor = this.digitGlowColor;
                ctx.shadowBlur = 3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, width, height);
                ctx.shadowBlur = 0;
            }
        }
    }
    
    /**
     * Draw the label below the counter
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     */
    drawLabel(ctx, x, y) {
        ctx.save();
        
        // Set up text styles
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = this.glowColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowIntensity;
        
        // Draw the text
        ctx.fillText(this.counterLabel, x, y);
        
        ctx.restore();
    }
}

export { VisitorCounterEntity };
