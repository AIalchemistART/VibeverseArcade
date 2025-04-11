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
        this.lastUpdateTime = 0; // Start at 0 to trigger immediate fetch
        this.updateInterval = 60000; // Update every minute
        this.isInitialized = false;
        this.initRetries = 0; // Track API connection retries
        
        // Visual properties
        this.glowColor = '#00FFFF';
        this.glowIntensity = 0;
        this.maxGlowIntensity = 10;
        this.glowPulseSpeed = 0.05;
        this.glowDirection = 1;
        
        // Counter display properties
        this.digitWidth = 30;
        this.digitHeight = 50;
        this.digitGap = 10;
        this.digitThickness = 5;
        this.digitOnColor = '#00FFFF';
        this.digitOffColor = '#001414';
        this.digitGlowColor = 'rgba(0, 255, 255, 0.5)';
        
        // Label for the counter
        this.counterLabel = 'DAILY VISITORS';
        
        // Cache for digit patterns (each digit is a configuration of 7 segments)
        this.digitPatterns = [
            [1, 1, 1, 0, 1, 1, 1], // 0
            [0, 0, 1, 0, 0, 1, 0], // 1
            [1, 0, 1, 1, 1, 0, 1], // 2
            [1, 0, 1, 1, 0, 1, 1], // 3
            [0, 1, 1, 1, 0, 1, 0], // 4
            [1, 1, 0, 1, 0, 1, 1], // 5
            [1, 1, 0, 1, 1, 1, 1], // 6
            [1, 0, 1, 0, 0, 1, 0], // 7
            [1, 1, 1, 1, 1, 1, 1], // 8
            [1, 1, 1, 1, 0, 1, 1]  // 9
        ];
        
        // Initialize with zeros
        this.digits = [0, 0, 0, 0];
        
        console.log(`VisitorCounterEntity: Initialized at position (${x}, ${y})`);
        
        // Initialize visitor count - fetch from Google Analytics
        this.initVisitorCount();
    }
    
    /**
     * Initialize the visitor count using CountAPI
     */
    initVisitorCount() {
        // Only initialize once
        if (this.isInitialized) return;
        
        console.log("VisitorCounterEntity: Initializing visitor count");
        
        // Set a temporary count from localStorage if available
        const storedCount = localStorage.getItem('arcadeVisitorCount');
        if (storedCount) {
            const count = parseInt(storedCount, 10);
            console.log(`VisitorCounterEntity: Using temporary stored count: ${count}`);
            this.visitorCount = count;
            this.targetCount = count;
            this.updateDigits();
        }
        
        // Fetch the visitor count using CountAPI
        // Use a small delay to ensure the entity is fully initialized
        setTimeout(() => {
            this.fetchVisitorCount();
        }, 500);
        
        this.isInitialized = true;
    }
    
    /**
     * Fetch visitor count using CountAPI
     */
    async fetchVisitorCount() {
        try {
            // Use a simpler namespace and key to avoid potential issues
            const namespace = 'circuitsanctum';
            const key = 'visits';
            
            console.log("VisitorCounterEntity: Fetching visitor count from CountAPI");
            
            // Hit the counter (increments and returns the value)
            // Using a more reliable endpoint structure
            const response = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`, {
                method: 'GET',
                mode: 'cors', // Explicitly set CORS mode
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`CountAPI returned status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Log the raw response for debugging
            console.log("CountAPI raw response:", data);
            
            // Make sure we have a valid count value
            if (data && typeof data.value === 'number') {
                // Set the counter value
                this.targetCount = data.value;
                
                // Store the count in localStorage as a backup
                localStorage.setItem('arcadeVisitorCount', this.targetCount.toString());
                
                // Trigger animation to the new count
                this.animateToCount(this.targetCount);
                
                console.log(`VisitorCounterEntity: Count from CountAPI: ${this.targetCount}`);
                
                // Track view in Google Analytics if available
                if (typeof gtag === 'function') {
                    gtag('event', 'visitor_counter_viewed', {
                        'counter_value': this.targetCount
                    });
                }
                
                return; // Successfully updated the count
            } else {
                throw new Error('Invalid data format received from CountAPI');
            }
        } catch (error) {
            console.error("VisitorCounterEntity: Error fetching from CountAPI:", error);
            this.useBackupCount();
        }
    }
    
    /**
     * Use a backup visitor count if API fails
     */
    useBackupCount() {
        // Try to use the stored count from localStorage
        const storedCount = localStorage.getItem('arcadeVisitorCount');
        
        if (storedCount) {
            this.targetCount = parseInt(storedCount, 10);
            console.log(`VisitorCounterEntity: Using backup count from storage: ${this.targetCount}`);
        } else {
            // Initial count between 1000 and 9000 (reasonable for an arcade site)
            this.targetCount = 1000 + Math.floor(Math.random() * 8000);
            console.log(`VisitorCounterEntity: Using generated count: ${this.targetCount}`);
            
            // Store this as a backup
            localStorage.setItem('arcadeVisitorCount', this.targetCount.toString());
        }
        
        // Animate to this count
        this.animateToCount(this.targetCount);
    }
    
    /**
     * Set a random visitor count for demonstration
     * @deprecated Use useBackupCount() instead
     */
    setRandomCount() {
        this.useBackupCount();
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
        
        // Check if it's time to refresh the count
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime > this.updateInterval) {
            // Only refresh if not currently animating
            if (!this.isAnimating) {
                console.log("VisitorCounterEntity: Time to refresh count");
                this.fetchVisitorCount();
            }
            this.lastUpdateTime = currentTime;
        }
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
        
        // Save context
        ctx.save();
        
        // Setup for the glow effect
        ctx.shadowColor = this.digitGlowColor;
        ctx.shadowBlur = this.glowIntensity / 2;
        
        // Draw the 7 segments (each segment can be on or off)
        // Segment A (top horizontal)
        this.drawSegment(ctx, x, y, this.digitWidth, this.digitThickness, pattern[0]);
        
        // Segment B (top-right vertical)
        this.drawSegment(ctx, x + this.digitWidth - this.digitThickness, y, this.digitThickness, this.digitHeight / 2, pattern[1], true);
        
        // Segment C (bottom-right vertical)
        this.drawSegment(ctx, x + this.digitWidth - this.digitThickness, y + this.digitHeight / 2, this.digitThickness, this.digitHeight / 2, pattern[2], true);
        
        // Segment D (bottom horizontal)
        this.drawSegment(ctx, x, y + this.digitHeight - this.digitThickness, this.digitWidth, this.digitThickness, pattern[3]);
        
        // Segment E (bottom-left vertical)
        this.drawSegment(ctx, x, y + this.digitHeight / 2, this.digitThickness, this.digitHeight / 2, pattern[4], true);
        
        // Segment F (top-left vertical)
        this.drawSegment(ctx, x, y, this.digitThickness, this.digitHeight / 2, pattern[5], true);
        
        // Segment G (middle horizontal)
        this.drawSegment(ctx, x, y + (this.digitHeight / 2) - (this.digitThickness / 2), this.digitWidth, this.digitThickness, pattern[6]);
        
        // Restore context
        ctx.restore();
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
        // Choose color based on segment state
        ctx.fillStyle = isOn ? this.digitOnColor : this.digitOffColor;
        
        // Draw the segment - rounded for vertical, flat for horizontal
        if (isVertical) {
            // Vertical segment (with rounded ends)
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height / 4);
            ctx.lineTo(x + width, y + height - height / 4);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x, y + height - height / 4);
            ctx.lineTo(x, y + height / 4);
            ctx.closePath();
            ctx.fill();
        } else {
            // Horizontal segment (with flat ends and rounded corners)
            ctx.beginPath();
            ctx.moveTo(x + height / 2, y);
            ctx.lineTo(x + width - height / 2, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width - height / 2, y + height);
            ctx.lineTo(x + height / 2, y + height);
            ctx.lineTo(x, y + height / 2);
            ctx.closePath();
            ctx.fill();
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
